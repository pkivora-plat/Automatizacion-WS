begin;
create extension if not exists pgcrypto;
create extension if not exists citext;
create extension if not exists unaccent;
create schema if not exists private;

create type public.app_role as enum ('admin','supervisor','agent','closer');
create type public.plan_tier as enum ('starter','growth','enterprise');
create type public.lead_stage as enum ('new','contacted','qualified','proposal','negotiation','won','lost');
create type public.order_status as enum ('new','incomplete','quoted','awaiting_payment','payment_review','confirmed','in_production','shipped','delivered','cancelled');
create type public.run_status as enum ('pending','running','completed','failed');

create table public.profiles (
 id uuid primary key references auth.users on delete cascade, full_name text not null,
 phone text, avatar_url text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.organizations (
 id uuid primary key default gen_random_uuid(), name text not null check(char_length(trim(name)) between 2 and 120),
 slug text not null unique check(slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'), timezone text not null default 'America/Santo_Domingo',
 business_data jsonb not null default '{}', plan public.plan_tier not null default 'starter', plan_limits jsonb not null default '{}',
 created_by uuid not null references auth.users, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz
);
create table public.organization_members (
 organization_id uuid not null references public.organizations on delete cascade, user_id uuid not null references auth.users on delete cascade,
 role public.app_role not null default 'agent', active boolean not null default true,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), primary key(organization_id,user_id)
);
create table public.invitations (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations on delete cascade,
 email citext not null, role public.app_role not null, token_hash text not null unique,
 status text not null default 'pending' check(status in ('pending','accepted','revoked','expired')),
 invited_by uuid not null references auth.users, expires_at timestamptz not null, accepted_at timestamptz,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.contacts (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations on delete cascade,
 full_name text not null, company text, email citext, phone text, status text not null default 'active', source text,
 assigned_to uuid references auth.users, created_by uuid not null references auth.users,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz, unique(organization_id,id)
);
create table public.leads (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations on delete cascade,
 contact_id uuid, title text not null, stage public.lead_stage not null default 'new', value numeric(14,2) not null default 0 check(value>=0),
 source text, assigned_to uuid references auth.users, loss_reason text, follow_up_at timestamptz, created_by uuid not null references auth.users,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz, unique(organization_id,id),
 foreign key(organization_id,contact_id) references public.contacts(organization_id,id)
);
create table public.opportunities (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations on delete cascade,
 contact_id uuid not null, lead_id uuid, title text not null, estimated_value numeric(14,2) not null default 0 check(estimated_value>=0),
 probability int not null default 0 check(probability between 0 and 100), status text not null default 'open' check(status in ('open','won','lost','cancelled')),
 assigned_to uuid references auth.users, expected_close_date date, loss_reason text, created_by uuid not null references auth.users,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz, unique(organization_id,id),
 foreign key(organization_id,contact_id) references public.contacts(organization_id,id), foreign key(organization_id,lead_id) references public.leads(organization_id,id)
);
create table public.activities (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations on delete cascade,
 entity_type text not null, entity_id uuid not null, activity_type text not null, title text not null, details jsonb not null default '{}',
 due_at timestamptz, completed_at timestamptz, actor_user_id uuid not null references auth.users, created_at timestamptz not null default now()
);
create table public.notes (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations on delete cascade,
 entity_type text not null, entity_id uuid not null, body text not null, created_by uuid not null references auth.users,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz
);
create table public.products (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations on delete cascade,
 name text not null, code text not null, category text not null, description text, active boolean not null default true,
 created_by uuid not null references auth.users, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz,
 unique(organization_id,id), unique(organization_id,code)
);
create table public.product_variants (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations on delete cascade, product_id uuid not null,
 name text not null, code text not null, material text not null check(material in ('gold','silver')), size numeric(4,1) not null check(size between 4 and 13 and size*2=trunc(size*2)),
 min_weight numeric(8,2) not null, max_weight numeric(8,2) not null check(max_weight>=min_weight), base_price numeric(14,2) not null check(base_price>=0),
 indicative_price numeric(14,2) not null check(indicative_price>=0), currency char(3) not null default 'DOP', available boolean not null default true,
 active boolean not null default true, created_by uuid not null references auth.users, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz,
 unique(organization_id,id), unique(organization_id,code), foreign key(organization_id,product_id) references public.products(organization_id,id) on delete cascade
);
create table public.product_images (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations on delete cascade,
 product_id uuid not null, variant_id uuid, storage_path text not null, alt_text text, sort_order int not null default 0, created_by uuid not null references auth.users,
 created_at timestamptz not null default now(), unique(organization_id,storage_path),
 foreign key(organization_id,product_id) references public.products(organization_id,id) on delete cascade,
 foreign key(organization_id,variant_id) references public.product_variants(organization_id,id) on delete cascade
);
create table public.shipping_methods (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations on delete cascade,
 name text not null, provinces text[] not null default '{}', fee numeric(14,2) not null default 0, estimated_time text, instructions text, active boolean not null default true,
 created_by uuid not null references auth.users, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(organization_id,id), unique(organization_id,name)
);
create table public.payment_methods (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations on delete cascade,
 name text not null, method_type text not null check(method_type in ('cash','transfer','other')), bank_name text, account_holder text, account_type text,
 account_last4 text check(account_last4 is null or account_last4 ~ '^[0-9]{4}$'), account_ciphertext text, currency char(3) not null default 'DOP', active boolean not null default true,
 created_by uuid not null references auth.users, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(organization_id,id), unique(organization_id,name)
);
create table public.closers (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations on delete cascade,
 user_id uuid not null references auth.users on delete cascade, active boolean not null default true, capacity int not null default 20 check(capacity>0),
 created_by uuid not null references auth.users, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(organization_id,id), unique(organization_id,user_id), foreign key(organization_id,user_id) references public.organization_members(organization_id,user_id)
);
create table public.orders (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations on delete cascade,
 contact_id uuid not null, opportunity_id uuid, shipping_method_id uuid, payment_method_id uuid, closer_id uuid,
 status public.order_status not null default 'new', university text, province text, estimated_weight numeric(8,2), indicative_price numeric(14,2), final_price numeric(14,2),
 currency char(3) not null default 'DOP', payment_proof_path text, internal_notes text, created_by uuid not null references auth.users,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz, unique(organization_id,id),
 foreign key(organization_id,contact_id) references public.contacts(organization_id,id), foreign key(organization_id,opportunity_id) references public.opportunities(organization_id,id),
 foreign key(organization_id,shipping_method_id) references public.shipping_methods(organization_id,id), foreign key(organization_id,payment_method_id) references public.payment_methods(organization_id,id),
 foreign key(organization_id,closer_id) references public.closers(organization_id,id)
);
create table public.order_items (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations on delete cascade,
 order_id uuid not null, product_id uuid not null, variant_id uuid, quantity int not null default 1 check(quantity>0), unit_price numeric(14,2) not null check(unit_price>=0),
 attributes jsonb not null default '{}', created_at timestamptz not null default now(),
 foreign key(organization_id,order_id) references public.orders(organization_id,id) on delete cascade,
 foreign key(organization_id,product_id) references public.products(organization_id,id), foreign key(organization_id,variant_id) references public.product_variants(organization_id,id)
);
create table public.conversation_sessions (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations on delete cascade,
 contact_id uuid, channel text not null default 'web', external_id text, current_state text not null default 'start', collected_data jsonb not null default '{}',
 pending_fields text[] not null default '{}', result text, closer_id uuid, claimed_at timestamptz, last_activity_at timestamptz not null default now(),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(organization_id,id), unique(organization_id,channel,external_id),
 foreign key(organization_id,contact_id) references public.contacts(organization_id,id), foreign key(organization_id,closer_id) references public.closers(organization_id,id)
);
create table public.automation_definitions (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations on delete cascade,
 name text not null, trigger_type text not null, definition jsonb not null, version int not null default 1, active boolean not null default false,
 created_by uuid not null references auth.users, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(organization_id,id), unique(organization_id,name)
);
create table public.automation_runs (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations on delete cascade,
 automation_definition_id uuid not null, idempotency_key text not null, external_execution_id text, status public.run_status not null default 'pending',
 input jsonb not null default '{}', output jsonb, error_details jsonb, attempt_count int not null default 0, started_at timestamptz, completed_at timestamptz,
 created_by uuid references auth.users, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(organization_id,idempotency_key),
 foreign key(organization_id,automation_definition_id) references public.automation_definitions(organization_id,id)
);
create table public.chatbot_configs (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations on delete cascade unique,
 name text not null, welcome_message text not null, state_machine jsonb not null default '{}', enabled boolean not null default false,
 created_by uuid not null references auth.users, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.knowledge_sources (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations on delete cascade,
 title text not null, source_type text not null default 'text', content text, storage_path text, active boolean not null default true,
 created_by uuid not null references auth.users, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz,
 check(content is not null or storage_path is not null)
);
create table public.audit_logs (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations on delete cascade,
 actor_user_id uuid references auth.users, action text not null, entity_type text not null, entity_id text, old_data jsonb, new_data jsonb,
 metadata jsonb not null default '{}', created_at timestamptz not null default now()
);

create index members_user_idx on public.organization_members(user_id,active);
create index contacts_org_idx on public.contacts(organization_id,created_at desc) where deleted_at is null;
create unique index contacts_email_uq on public.contacts(organization_id,lower(email::text)) where email is not null and deleted_at is null;
create unique index contacts_phone_uq on public.contacts(organization_id,phone) where phone is not null and deleted_at is null;
create index leads_stage_idx on public.leads(organization_id,stage,updated_at desc) where deleted_at is null;
create index opportunities_status_idx on public.opportunities(organization_id,status,expected_close_date) where deleted_at is null;
create index orders_status_idx on public.orders(organization_id,status,updated_at desc) where deleted_at is null;
create index activities_entity_idx on public.activities(organization_id,entity_type,entity_id,created_at desc);
create index notes_entity_idx on public.notes(organization_id,entity_type,entity_id,created_at desc) where deleted_at is null;
create index runs_status_idx on public.automation_runs(organization_id,status,created_at desc);
create index audit_org_idx on public.audit_logs(organization_id,created_at desc);

create function private.is_member(org uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.organization_members where organization_id=org and user_id=(select auth.uid()) and active);
$$;
create function private.has_role(org uuid, roles public.app_role[]) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.organization_members where organization_id=org and user_id=(select auth.uid()) and active and role=any(roles));
$$;
create function private.is_closer(org uuid, closer uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.closers where organization_id=org and id=closer and user_id=(select auth.uid()) and active);
$$;
revoke all on schema private from public; grant usage on schema private to authenticated;
revoke all on function private.is_member(uuid),private.has_role(uuid,public.app_role[]),private.is_closer(uuid,uuid) from public;
grant execute on function private.is_member(uuid),private.has_role(uuid,public.app_role[]),private.is_closer(uuid,uuid) to authenticated;

create function public.touch_updated_at() returns trigger language plpgsql set search_path='' as $$ begin new.updated_at=now(); return new; end; $$;
do $$ declare t text; begin foreach t in array array['profiles','organizations','organization_members','invitations','contacts','leads','opportunities','notes','products','product_variants','shipping_methods','payment_methods','closers','orders','conversation_sessions','automation_definitions','automation_runs','chatbot_configs','knowledge_sources'] loop execute format('create trigger touch_updated_at before update on public.%I for each row execute function public.touch_updated_at()',t); end loop; end $$;

create function public.create_organization(p_name text,p_slug text,p_timezone text default 'America/Santo_Domingo') returns public.organizations
language plpgsql security definer set search_path='' as $$ declare o public.organizations; begin
 if auth.uid() is null then raise exception 'Authentication required' using errcode='42501'; end if;
 insert into public.organizations(name,slug,timezone,created_by) values(trim(p_name),lower(trim(p_slug)),p_timezone,auth.uid()) returning * into o;
 insert into public.organization_members values(o.id,auth.uid(),'admin',true,now(),now()); return o; end; $$;
revoke all on function public.create_organization(text,text,text) from public,anon; grant execute on function public.create_organization(text,text,text) to authenticated;

create function public.handle_new_user() returns trigger language plpgsql security definer set search_path='' as $$
declare n text; s text; oid uuid; begin
 insert into public.profiles(id,full_name) values(new.id,coalesce(nullif(trim(new.raw_user_meta_data->>'full_name'),''),split_part(new.email,'@',1)));
 n:=nullif(trim(new.raw_user_meta_data->>'organization_name'),'');
 if n is not null then s:=trim(both '-' from regexp_replace(lower(public.unaccent(n)),'[^a-z0-9]+','-','g'))||'-'||left(new.id::text,8);
  insert into public.organizations(name,slug,created_by) values(n,s,new.id) returning id into oid;
  insert into public.organization_members(organization_id,user_id,role) values(oid,new.id,'admin'); end if; return new; end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

do $$ declare t text; begin foreach t in array array['profiles','organizations','organization_members','invitations','contacts','leads','opportunities','activities','notes','products','product_variants','product_images','orders','order_items','shipping_methods','payment_methods','closers','conversation_sessions','automation_definitions','automation_runs','chatbot_configs','knowledge_sources','audit_logs'] loop execute format('alter table public.%I enable row level security',t); execute format('revoke all on public.%I from anon,authenticated',t); end loop; end $$;

grant select,update on public.profiles to authenticated;
create policy profile_self_read on public.profiles for select to authenticated using(id=(select auth.uid()));
create policy profile_self_update on public.profiles for update to authenticated using(id=(select auth.uid())) with check(id=(select auth.uid()));
grant select,update on public.organizations to authenticated;
create policy org_member_read on public.organizations for select to authenticated using(private.is_member(id) and deleted_at is null);
create policy org_admin_update on public.organizations for update to authenticated using(private.has_role(id,array['admin']::public.app_role[])) with check(private.has_role(id,array['admin']::public.app_role[]));
grant select,insert,update,delete on public.organization_members to authenticated;
create policy member_read on public.organization_members for select to authenticated using(private.is_member(organization_id));
create policy member_admin_write on public.organization_members for all to authenticated using(private.has_role(organization_id,array['admin']::public.app_role[])) with check(private.has_role(organization_id,array['admin']::public.app_role[]));

do $$ declare t text; begin foreach t in array array['invitations','products','product_variants','product_images','shipping_methods','payment_methods','closers','automation_definitions','chatbot_configs','knowledge_sources'] loop
 execute format('grant select,insert,update,delete on public.%I to authenticated',t);
 execute format('create policy tenant_read on public.%I for select to authenticated using(private.is_member(organization_id))',t);
 execute format('create policy manager_write on public.%I for all to authenticated using(private.has_role(organization_id,array[''admin'',''supervisor'']::public.app_role[])) with check(private.has_role(organization_id,array[''admin'',''supervisor'']::public.app_role[]))',t);
 end loop; end $$;
do $$ declare t text; begin foreach t in array array['contacts','leads','opportunities'] loop
 execute format('grant select,insert,update,delete on public.%I to authenticated',t);
 execute format('create policy assigned_read on public.%I for select to authenticated using(private.has_role(organization_id,array[''admin'',''supervisor'']::public.app_role[]) or (private.is_member(organization_id) and (assigned_to=(select auth.uid()) or created_by=(select auth.uid()))))',t);
 execute format('create policy assigned_insert on public.%I for insert to authenticated with check(private.is_member(organization_id) and created_by=(select auth.uid()) and (assigned_to is null or assigned_to=(select auth.uid()) or private.has_role(organization_id,array[''admin'',''supervisor'']::public.app_role[])))',t);
 execute format('create policy assigned_update on public.%I for update to authenticated using(private.has_role(organization_id,array[''admin'',''supervisor'']::public.app_role[]) or assigned_to=(select auth.uid())) with check(private.has_role(organization_id,array[''admin'',''supervisor'']::public.app_role[]) or assigned_to=(select auth.uid()))',t);
 execute format('create policy manager_delete on public.%I for delete to authenticated using(private.has_role(organization_id,array[''admin'',''supervisor'']::public.app_role[]))',t);
 end loop; end $$;
grant select,insert,update,delete on public.orders to authenticated;
create policy order_read on public.orders for select to authenticated using(private.has_role(organization_id,array['admin','supervisor']::public.app_role[]) or private.is_closer(organization_id,closer_id) or created_by=(select auth.uid()));
create policy order_insert on public.orders for insert to authenticated with check(private.is_member(organization_id) and created_by=(select auth.uid()));
create policy order_update on public.orders for update to authenticated using(private.has_role(organization_id,array['admin','supervisor']::public.app_role[]) or private.is_closer(organization_id,closer_id)) with check(private.has_role(organization_id,array['admin','supervisor']::public.app_role[]) or private.is_closer(organization_id,closer_id));
create policy order_delete on public.orders for delete to authenticated using(private.has_role(organization_id,array['admin','supervisor']::public.app_role[]));
do $$ declare t text; begin foreach t in array array['order_items','activities','notes','conversation_sessions','automation_runs'] loop
 execute format('grant select,insert,update,delete on public.%I to authenticated',t);
 execute format('create policy tenant_access on public.%I for all to authenticated using(private.is_member(organization_id)) with check(private.is_member(organization_id))',t);
 end loop; end $$;
grant select on public.audit_logs to authenticated;
create policy audit_admin_read on public.audit_logs for select to authenticated using(private.has_role(organization_id,array['admin']::public.app_role[]));

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
('product-images','product-images',false,10485760,array['image/jpeg','image/png','image/webp']),
('business-files','business-files',false,20971520,array['image/jpeg','image/png','image/webp','application/pdf']),
('payment-proofs','payment-proofs',false,10485760,array['image/jpeg','image/png','image/webp','application/pdf']) on conflict(id) do nothing;
create function private.path_org(p text) returns uuid language plpgsql immutable set search_path='' as $$ begin return split_part(p,'/',1)::uuid; exception when invalid_text_representation then return null; end; $$;
revoke all on function private.path_org(text) from public; grant execute on function private.path_org(text) to authenticated;
create policy tenant_files_read on storage.objects for select to authenticated using(bucket_id in('product-images','business-files','payment-proofs') and private.is_member(private.path_org(name)));
create policy tenant_files_insert on storage.objects for insert to authenticated with check(bucket_id in('product-images','business-files','payment-proofs') and private.is_member(private.path_org(name)) and owner_id=(select auth.uid()::text));
create policy tenant_files_update on storage.objects for update to authenticated using(private.is_member(private.path_org(name)) and owner_id=(select auth.uid()::text)) with check(private.is_member(private.path_org(name)) and owner_id=(select auth.uid()::text));
create policy tenant_files_delete on storage.objects for delete to authenticated using(private.is_member(private.path_org(name)) and (owner_id=(select auth.uid()::text) or private.has_role(private.path_org(name),array['admin','supervisor']::public.app_role[])));
commit;
