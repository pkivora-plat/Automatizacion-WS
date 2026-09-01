begin;

alter table public.organizations
  add column if not exists status text not null default 'active'
  check (status in ('onboarding','active','suspended'));

create table if not exists private.platform_admins (
  user_id uuid primary key references auth.users on delete cascade,
  granted_by uuid references auth.users,
  created_at timestamptz not null default now()
);
create table if not exists private.platform_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users,
  action text not null,
  organization_id uuid references public.organizations on delete set null,
  details jsonb not null default '{}',
  created_at timestamptz not null default now()
);
revoke all on private.platform_admins, private.platform_audit_logs from public, anon, authenticated;

-- Bootstrap only the oldest account in this greenfield project. Additional platform
-- administrators must be granted explicitly from the SQL console.
insert into private.platform_admins(user_id)
select id from auth.users order by created_at limit 1
on conflict (user_id) do nothing;

create or replace function private.is_platform_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from private.platform_admins where user_id = auth.uid());
$$;
revoke all on function private.is_platform_admin() from public;
grant execute on function private.is_platform_admin() to authenticated;

create or replace function private.is_member(org uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(
    select 1 from public.organization_members m
    join public.organizations o on o.id = m.organization_id
    where m.organization_id = org and m.user_id = auth.uid() and m.active
      and o.status <> 'suspended' and o.deleted_at is null
  );
$$;
create or replace function private.has_role(org uuid, roles public.app_role[])
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(
    select 1 from public.organization_members m
    join public.organizations o on o.id = m.organization_id
    where m.organization_id = org and m.user_id = auth.uid() and m.active and m.role = any(roles)
      and o.status <> 'suspended' and o.deleted_at is null
  );
$$;

create table if not exists public.pricing_tiers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations on delete cascade,
  name text not null,
  min_weight numeric(8,2) not null check(min_weight > 0),
  max_weight numeric(8,2) not null check(max_weight >= min_weight),
  indicative_price numeric(14,2) not null check(indicative_price >= 0),
  currency char(3) not null default 'DOP',
  active boolean not null default true,
  created_by uuid not null references auth.users,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(organization_id, name)
);
alter table public.pricing_tiers enable row level security;
revoke all on public.pricing_tiers from anon, authenticated;
grant select, insert, update, delete on public.pricing_tiers to authenticated;
create policy pricing_tenant_read on public.pricing_tiers for select to authenticated
  using (private.is_member(organization_id));
create policy pricing_manager_write on public.pricing_tiers for all to authenticated
  using (private.has_role(organization_id, array['admin','supervisor']::public.app_role[]))
  with check (private.has_role(organization_id, array['admin','supervisor']::public.app_role[]));
create trigger touch_pricing_tiers before update on public.pricing_tiers
  for each row execute function public.touch_updated_at();

create table if not exists public.workflow_templates (
  id uuid primary key default gen_random_uuid(),
  template_key text not null unique,
  name text not null,
  description text,
  definition jsonb not null default '{}',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.workflow_templates enable row level security;
revoke all on public.workflow_templates from anon, authenticated;
grant select on public.workflow_templates to authenticated;
create policy workflow_templates_read on public.workflow_templates for select to authenticated
  using (active);
create trigger touch_workflow_templates before update on public.workflow_templates
  for each row execute function public.touch_updated_at();

create or replace function public.is_platform_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select private.is_platform_admin();
$$;
revoke all on function public.is_platform_admin() from public, anon;
grant execute on function public.is_platform_admin() to authenticated;

create or replace function public.admin_list_organizations()
returns table(
  id uuid, name text, slug text, status text, plan public.plan_tier,
  member_count bigint, contact_count bigint, lead_count bigint, order_count bigint,
  created_at timestamptz
) language plpgsql stable security definer set search_path = '' as $$
begin
  if not private.is_platform_admin() then raise exception 'Platform administrator required' using errcode = '42501'; end if;
  return query
    select o.id, o.name, o.slug, o.status, o.plan,
      (select count(*) from public.organization_members m where m.organization_id = o.id and m.active),
      (select count(*) from public.contacts c where c.organization_id = o.id and c.deleted_at is null),
      (select count(*) from public.leads l where l.organization_id = o.id and l.deleted_at is null),
      (select count(*) from public.orders r where r.organization_id = o.id and r.deleted_at is null),
      o.created_at
    from public.organizations o where o.deleted_at is null order by o.created_at desc;
end;
$$;
revoke all on function public.admin_list_organizations() from public, anon;
grant execute on function public.admin_list_organizations() to authenticated;

create or replace function public.admin_create_organization(
  p_name text, p_slug text, p_timezone text default 'America/Santo_Domingo', p_owner_email text default null
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  created public.organizations;
  owner_id uuid;
  token text;
begin
  if not private.is_platform_admin() then raise exception 'Platform administrator required' using errcode = '42501'; end if;
  insert into public.organizations(name, slug, timezone, status, created_by)
  values (trim(p_name), lower(trim(p_slug)), p_timezone, 'onboarding', auth.uid()) returning * into created;
  if nullif(trim(p_owner_email),'') is not null then
    select id into owner_id from auth.users where lower(email) = lower(trim(p_owner_email)) limit 1;
    if owner_id is not null then
      insert into public.organization_members(organization_id,user_id,role,active)
      values(created.id,owner_id,'admin',true);
    else
      token := gen_random_uuid()::text;
      insert into public.invitations(organization_id,email,role,token_hash,invited_by,expires_at)
      values(created.id,lower(trim(p_owner_email)),'admin',encode(pg_catalog.sha256(convert_to(token,'UTF8')),'hex'),auth.uid(),now()+interval '7 days');
    end if;
  end if;
  insert into private.platform_audit_logs(actor_user_id,action,organization_id,details)
  values(auth.uid(),'organization.created',created.id,jsonb_build_object('name',created.name,'owner_email',p_owner_email));
  return jsonb_build_object('organization',to_jsonb(created),'invitation_token',token);
end;
$$;
revoke all on function public.admin_create_organization(text,text,text,text) from public, anon;
grant execute on function public.admin_create_organization(text,text,text,text) to authenticated;

create or replace function public.admin_update_organization(
  p_organization_id uuid, p_status text, p_plan public.plan_tier, p_plan_limits jsonb default null
) returns public.organizations language plpgsql security definer set search_path = '' as $$
declare updated public.organizations;
begin
  if not private.is_platform_admin() then raise exception 'Platform administrator required' using errcode = '42501'; end if;
  if p_status not in ('onboarding','active','suspended') then raise exception 'Invalid organization status'; end if;
  update public.organizations set status=p_status, plan=p_plan,
    plan_limits=coalesce(p_plan_limits,plan_limits), updated_at=now()
  where id=p_organization_id and deleted_at is null returning * into updated;
  if updated.id is null then raise exception 'Organization not found'; end if;
  insert into private.platform_audit_logs(actor_user_id,action,organization_id,details)
  values(auth.uid(),'organization.updated',updated.id,jsonb_build_object('status',p_status,'plan',p_plan,'limits',p_plan_limits));
  return updated;
end;
$$;
revoke all on function public.admin_update_organization(uuid,text,public.plan_tier,jsonb) from public, anon;
grant execute on function public.admin_update_organization(uuid,text,public.plan_tier,jsonb) to authenticated;

create or replace function public.admin_create_doradito_example()
returns public.organizations language plpgsql security definer set search_path = '' as $$
declare
  created public.organizations;
  graduation_product uuid;
  wedding_product uuid;
  flow_definition jsonb := jsonb_build_object(
    'version',1,'mode','deterministic','states',jsonb_build_array(
      'interest','ring_type','university','size','material','pricing','catalog',
      'province','shipping','payment','purchase_intent','human_assistance','completed'
    )
  );
begin
  if not private.is_platform_admin() then raise exception 'Platform administrator required' using errcode = '42501'; end if;
  select * into created from public.organizations where slug='doradito' and deleted_at is null limit 1;
  if created.id is not null then return created; end if;
  insert into public.organizations(name,slug,timezone,business_data,status,plan,created_by)
  values('DORADITO','doradito','America/Santo_Domingo',jsonb_build_object('business_type','jewelry','example_tenant',true),'active','growth',auth.uid())
  returning * into created;
  insert into public.organization_members(organization_id,user_id,role) values(created.id,auth.uid(),'admin');
  insert into public.pricing_tiers(organization_id,name,min_weight,max_weight,indicative_price,created_by) values
    (created.id,'Pequeño',5.1,5.6,29500,auth.uid()),
    (created.id,'Mediano',6.5,7.2,33500,auth.uid()),
    (created.id,'Grande',9.5,10.5,41000,auth.uid());
  insert into public.products(organization_id,name,code,category,description,created_by)
  values(created.id,'Anillo de graduación','DOR-GRAD','Anillo de graduación','Producto configurable por universidad, talla y material.',auth.uid()) returning id into graduation_product;
  insert into public.products(organization_id,name,code,category,description,created_by)
  values(created.id,'Anillo matrimonial','DOR-MATR','Anillo matrimonial','Producto configurable por talla y material.',auth.uid()) returning id into wedding_product;
  insert into public.workflow_templates(template_key,name,description,definition)
  values('jewelry-sales-deterministic','Venta determinista para joyería','Plantilla reutilizable para empresas de joyería.',flow_definition)
  on conflict(template_key) do update set definition=excluded.definition,updated_at=now();
  insert into public.automation_definitions(organization_id,name,trigger_type,definition,active,created_by)
  values(created.id,'DORADITO · Flujo comercial','web_chat',flow_definition,false,auth.uid());
  insert into public.chatbot_configs(organization_id,name,welcome_message,state_machine,enabled,created_by)
  values(created.id,'Asistente DORADITO','¡Hola! Te ayudaré a elegir tu anillo.',flow_definition,false,auth.uid());
  insert into private.platform_audit_logs(actor_user_id,action,organization_id,details)
  values(auth.uid(),'example_tenant.created',created.id,jsonb_build_object('template','jewelry-sales-deterministic'));
  return created;
end;
$$;
revoke all on function public.admin_create_doradito_example() from public, anon;
grant execute on function public.admin_create_doradito_example() to authenticated;

create or replace function public.ensure_user_workspace(p_default_name text default null)
returns public.organizations language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); account auth.users; workspace public.organizations; workspace_name text; workspace_slug text;
begin
  if uid is null then raise exception 'Authentication required' using errcode='42501'; end if;
  select * into account from auth.users where id=uid;
  insert into public.profiles(id,full_name) values(uid,coalesce(nullif(trim(account.raw_user_meta_data->>'full_name'),''),split_part(account.email,'@',1),'Usuario')) on conflict(id) do nothing;
  select o.* into workspace from public.organizations o join public.organization_members m on m.organization_id=o.id
  where m.user_id=uid and m.active and o.deleted_at is null and o.status<>'suspended' order by m.created_at limit 1;
  if workspace.id is not null then return workspace; end if;
  if exists(select 1 from public.organization_members m join public.organizations o on o.id=m.organization_id where m.user_id=uid and m.active and o.status='suspended' and o.deleted_at is null)
    then raise exception 'Organization suspended' using errcode='42501'; end if;
  workspace_name:=coalesce(nullif(trim(p_default_name),''),nullif(trim(account.raw_user_meta_data->>'organization_name'),''),'Mi empresa');
  workspace_slug:=trim(both '-' from regexp_replace(lower(workspace_name),'[^a-z0-9]+','-','g'))||'-'||left(uid::text,8);
  insert into public.organizations(name,slug,created_by) values(workspace_name,workspace_slug,uid) returning * into workspace;
  insert into public.organization_members(organization_id,user_id,role) values(workspace.id,uid,'admin');
  return workspace;
end;
$$;

commit;
