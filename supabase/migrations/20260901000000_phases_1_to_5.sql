begin;

create table if not exists public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations on delete cascade,
  order_id uuid not null,
  previous_status public.order_status,
  new_status public.order_status not null,
  changed_by uuid not null references auth.users,
  notes text,
  created_at timestamptz not null default now(),
  foreign key (organization_id, order_id) references public.orders(organization_id, id) on delete cascade
);
create index if not exists order_status_history_order_idx
  on public.order_status_history(organization_id, order_id, created_at desc);
alter table public.order_status_history enable row level security;
revoke all on public.order_status_history from anon, authenticated;
grant select, insert on public.order_status_history to authenticated;
create policy order_history_read on public.order_status_history for select to authenticated
  using (private.is_member(organization_id));

create or replace function public.ensure_user_workspace(p_default_name text default null)
returns public.organizations language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  account auth.users;
  workspace public.organizations;
  workspace_name text;
  workspace_slug text;
begin
  if uid is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  select * into account from auth.users where id = uid;
  insert into public.profiles(id, full_name)
  values (uid, coalesce(nullif(trim(account.raw_user_meta_data->>'full_name'), ''), split_part(account.email, '@', 1), 'Usuario'))
  on conflict (id) do nothing;
  select o.* into workspace
  from public.organizations o
  join public.organization_members m on m.organization_id = o.id
  where m.user_id = uid and m.active and o.deleted_at is null
  order by m.created_at limit 1;
  if workspace.id is not null then return workspace; end if;
  workspace_name := coalesce(nullif(trim(p_default_name), ''), nullif(trim(account.raw_user_meta_data->>'organization_name'), ''), 'Mi empresa');
  workspace_slug := trim(both '-' from regexp_replace(lower(workspace_name), '[^a-z0-9]+', '-', 'g')) || '-' || left(uid::text, 8);
  insert into public.organizations(name, slug, created_by)
  values (workspace_name, workspace_slug, uid) returning * into workspace;
  insert into public.organization_members(organization_id, user_id, role)
  values (workspace.id, uid, 'admin');
  insert into public.audit_logs(organization_id, actor_user_id, action, entity_type, entity_id, new_data)
  values (workspace.id, uid, 'organization.created', 'organization', workspace.id::text, to_jsonb(workspace));
  return workspace;
end;
$$;
revoke all on function public.ensure_user_workspace(text) from public, anon;
grant execute on function public.ensure_user_workspace(text) to authenticated;

create or replace function public.create_invitation(
  p_organization_id uuid, p_email text, p_role public.app_role
) returns text language plpgsql security definer set search_path = '' as $$
declare token text := gen_random_uuid()::text;
begin
  if not private.has_role(p_organization_id, array['admin']::public.app_role[]) then
    raise exception 'Only administrators can invite members' using errcode = '42501';
  end if;
  update public.invitations set status = 'revoked', updated_at = now()
  where organization_id = p_organization_id and lower(email::text) = lower(trim(p_email)) and status = 'pending';
  insert into public.invitations(organization_id, email, role, token_hash, invited_by, expires_at)
  values (p_organization_id, lower(trim(p_email)), p_role,
    encode(pg_catalog.sha256(convert_to(token, 'UTF8')), 'hex'), auth.uid(), now() + interval '7 days');
  insert into public.audit_logs(organization_id, actor_user_id, action, entity_type, metadata)
  values (p_organization_id, auth.uid(), 'invitation.created', 'invitation', jsonb_build_object('email', lower(trim(p_email)), 'role', p_role));
  return token;
end;
$$;

create or replace function public.accept_invitation(p_token text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare invitation public.invitations; account_email text;
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  select email into account_email from auth.users where id = auth.uid();
  select * into invitation from public.invitations
  where token_hash = encode(pg_catalog.sha256(convert_to(p_token, 'UTF8')), 'hex')
    and status = 'pending' and expires_at > now() for update;
  if invitation.id is null then raise exception 'Invitation is invalid or expired'; end if;
  if lower(invitation.email::text) <> lower(account_email) then raise exception 'Invitation belongs to another email' using errcode = '42501'; end if;
  insert into public.organization_members(organization_id, user_id, role, active)
  values (invitation.organization_id, auth.uid(), invitation.role, true)
  on conflict (organization_id, user_id) do update set role = excluded.role, active = true, updated_at = now();
  update public.invitations set status = 'accepted', accepted_at = now(), updated_at = now() where id = invitation.id;
  return invitation.organization_id;
end;
$$;
revoke all on function public.create_invitation(uuid,text,public.app_role), public.accept_invitation(text) from public, anon;
grant execute on function public.create_invitation(uuid,text,public.app_role), public.accept_invitation(text) to authenticated;

create or replace function public.get_organization_members(p_organization_id uuid)
returns table(user_id uuid, full_name text, email text, role public.app_role, active boolean)
language sql stable security definer set search_path = '' as $$
  select m.user_id, p.full_name, u.email::text, m.role, m.active
  from public.organization_members m
  join public.profiles p on p.id = m.user_id
  join auth.users u on u.id = m.user_id
  where m.organization_id = p_organization_id and private.is_member(p_organization_id)
  order by p.full_name;
$$;
revoke all on function public.get_organization_members(uuid) from public, anon;
grant execute on function public.get_organization_members(uuid) to authenticated;

create or replace function public.set_member_access(p_organization_id uuid, p_user_id uuid, p_role public.app_role, p_active boolean)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not private.has_role(p_organization_id, array['admin']::public.app_role[]) then
    raise exception 'Only administrators can manage members' using errcode = '42501';
  end if;
  if p_user_id = auth.uid() and not p_active then raise exception 'You cannot deactivate your own account'; end if;
  update public.organization_members set role = p_role, active = p_active, updated_at = now()
  where organization_id = p_organization_id and user_id = p_user_id;
  if p_role = 'closer' and p_active then
    insert into public.closers(organization_id, user_id, active, created_by)
    values (p_organization_id, p_user_id, true, auth.uid())
    on conflict (organization_id, user_id) do update set active = true, updated_at = now();
  else
    update public.closers set active = false, updated_at = now()
    where organization_id = p_organization_id and user_id = p_user_id;
  end if;
  insert into public.audit_logs(organization_id, actor_user_id, action, entity_type, entity_id, new_data)
  values (p_organization_id, auth.uid(), 'member.updated', 'organization_member', p_user_id::text,
    jsonb_build_object('role', p_role, 'active', p_active));
end;
$$;
revoke all on function public.set_member_access(uuid,uuid,public.app_role,boolean) from public, anon;
grant execute on function public.set_member_access(uuid,uuid,public.app_role,boolean) to authenticated;

create or replace function public.create_order_with_item(
  p_organization_id uuid, p_contact_id uuid, p_opportunity_id uuid,
  p_shipping_method_id uuid, p_payment_method_id uuid, p_product_id uuid,
  p_variant_id uuid, p_quantity integer, p_unit_price numeric, p_attributes jsonb,
  p_university text, p_province text, p_estimated_weight numeric,
  p_indicative_price numeric, p_final_price numeric, p_internal_notes text
) returns public.orders language plpgsql security definer set search_path = '' as $$
declare created_order public.orders;
begin
  if not private.is_member(p_organization_id) then raise exception 'Membership required' using errcode = '42501'; end if;
  insert into public.orders(organization_id, contact_id, opportunity_id, shipping_method_id, payment_method_id,
    status, university, province, estimated_weight, indicative_price, final_price, internal_notes, created_by)
  values (p_organization_id, p_contact_id, p_opportunity_id, p_shipping_method_id, p_payment_method_id,
    'new', nullif(trim(p_university),''), nullif(trim(p_province),''), p_estimated_weight,
    p_indicative_price, p_final_price, nullif(trim(p_internal_notes),''), auth.uid()) returning * into created_order;
  if p_product_id is not null then
    insert into public.order_items(organization_id, order_id, product_id, variant_id, quantity, unit_price, attributes)
    values (p_organization_id, created_order.id, p_product_id, p_variant_id, greatest(coalesce(p_quantity,1),1), coalesce(p_unit_price,0), coalesce(p_attributes,'{}'::jsonb));
  end if;
  insert into public.audit_logs(organization_id, actor_user_id, action, entity_type, entity_id, new_data)
  values (p_organization_id, auth.uid(), 'order.created', 'order', created_order.id::text, to_jsonb(created_order));
  return created_order;
end;
$$;
revoke all on function public.create_order_with_item(uuid,uuid,uuid,uuid,uuid,uuid,uuid,integer,numeric,jsonb,text,text,numeric,numeric,numeric,text) from public, anon;
grant execute on function public.create_order_with_item(uuid,uuid,uuid,uuid,uuid,uuid,uuid,integer,numeric,jsonb,text,text,numeric,numeric,numeric,text) to authenticated;

create or replace function public.claim_order(p_order_id uuid)
returns public.orders language plpgsql security definer set search_path = '' as $$
declare target public.orders; closer_record public.closers;
begin
  select * into target from public.orders where id = p_order_id and deleted_at is null for update;
  if target.id is null then raise exception 'Order not found'; end if;
  if not private.has_role(target.organization_id, array['admin','supervisor','closer']::public.app_role[]) then
    raise exception 'Closer access required' using errcode = '42501';
  end if;
  if target.closer_id is not null then raise exception 'Order was already assigned'; end if;
  insert into public.closers(organization_id, user_id, created_by)
  values (target.organization_id, auth.uid(), auth.uid())
  on conflict (organization_id, user_id) do update set active = true
  returning * into closer_record;
  update public.orders set closer_id = closer_record.id, updated_at = now() where id = target.id returning * into target;
  update public.contacts set assigned_to = auth.uid(), updated_at = now()
  where organization_id = target.organization_id and id = target.contact_id;
  insert into public.audit_logs(organization_id, actor_user_id, action, entity_type, entity_id, new_data)
  values (target.organization_id, auth.uid(), 'order.claimed', 'order', target.id::text, jsonb_build_object('closer_id', closer_record.id));
  return target;
end;
$$;
revoke all on function public.claim_order(uuid) from public, anon;
grant execute on function public.claim_order(uuid) to authenticated;

create or replace function public.log_order_status_change() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if old.status is distinct from new.status then
    insert into public.order_status_history(organization_id, order_id, previous_status, new_status, changed_by)
    values (new.organization_id, new.id, old.status, new.status, auth.uid());
  end if;
  return new;
end;
$$;
do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'order_status_audit') then
    create trigger order_status_audit after update of status on public.orders
    for each row execute function public.log_order_status_change();
  end if;
end $$;

create policy closer_queue_read on public.orders for select to authenticated
  using (closer_id is null and private.has_role(organization_id, array['closer']::public.app_role[]));

create or replace function private.closer_can_read_contact(org uuid, contact uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select private.has_role(org, array['closer']::public.app_role[])
    and exists(select 1 from public.orders where organization_id = org and contact_id = contact and closer_id is null and deleted_at is null);
$$;
revoke all on function private.closer_can_read_contact(uuid,uuid) from public;
grant execute on function private.closer_can_read_contact(uuid,uuid) to authenticated;
create policy closer_queue_contact_read on public.contacts for select to authenticated
  using (private.closer_can_read_contact(organization_id, id));

commit;
