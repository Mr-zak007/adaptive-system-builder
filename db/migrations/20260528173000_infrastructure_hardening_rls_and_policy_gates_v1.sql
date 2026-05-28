-- Infrastructure Hardening v1
-- Strict tenant isolation + RLS policy coverage + query boundary validation helpers

create or replace function public.user_belongs_to_org(_org_id uuid, _user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    where ur.org_id = _org_id
      and ur.user_id = _user_id
  )
$$;

create or replace function public.org_admin(_org_id uuid, _user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_role(_org_id, _user_id, 'admin'::public.app_role)
$$;

drop policy if exists organizations_member_access on public.organizations;
create policy organizations_member_access
on public.organizations
for select
to authenticated
using (public.user_belongs_to_org(id));

drop policy if exists user_roles_member_read on public.user_roles;
create policy user_roles_member_read
on public.user_roles
for select
to authenticated
using (public.user_belongs_to_org(org_id));

drop policy if exists user_roles_admin_write on public.user_roles;
create policy user_roles_admin_write
on public.user_roles
for all
to authenticated
using (public.org_admin(org_id))
with check (public.org_admin(org_id));

drop policy if exists tickets_tenant_isolation on public.tickets;
create policy tickets_tenant_isolation
on public.tickets
for all
to authenticated
using (public.user_belongs_to_org(org_id))
with check (public.user_belongs_to_org(org_id));

drop policy if exists ticket_events_tenant_isolation on public.ticket_events;
create policy ticket_events_tenant_isolation
on public.ticket_events
for all
to authenticated
using (public.user_belongs_to_org(org_id))
with check (public.user_belongs_to_org(org_id));

drop policy if exists field_tasks_tenant_isolation on public.field_tasks;
create policy field_tasks_tenant_isolation
on public.field_tasks
for all
to authenticated
using (public.user_belongs_to_org(org_id))
with check (public.user_belongs_to_org(org_id));

drop policy if exists attachments_tenant_isolation on public.attachments;
create policy attachments_tenant_isolation
on public.attachments
for all
to authenticated
using (public.user_belongs_to_org(org_id))
with check (public.user_belongs_to_org(org_id));

drop policy if exists domain_events_tenant_isolation on public.domain_events;
create policy domain_events_tenant_isolation
on public.domain_events
for all
to authenticated
using (public.user_belongs_to_org(org_id))
with check (public.user_belongs_to_org(org_id));

drop policy if exists operation_idempotency_tenant_isolation on public.operation_idempotency;
create policy operation_idempotency_tenant_isolation
on public.operation_idempotency
for all
to authenticated
using (public.user_belongs_to_org(org_id))
with check (public.user_belongs_to_org(org_id));

drop policy if exists audit_logs_tenant_isolation on public.audit_logs;
create policy audit_logs_tenant_isolation
on public.audit_logs
for all
to authenticated
using (org_id is null or public.user_belongs_to_org(org_id))
with check (org_id is null or public.user_belongs_to_org(org_id));

drop policy if exists job_executions_tenant_isolation on public.job_executions;
create policy job_executions_tenant_isolation
on public.job_executions
for all
to authenticated
using (org_id is null or public.user_belongs_to_org(org_id))
with check (org_id is null or public.user_belongs_to_org(org_id));

create or replace function public.validate_rls_policy_coverage()
returns table (
  table_name text,
  rls_enabled boolean,
  has_authenticated_policy boolean,
  org_column_present boolean,
  status text
)
language sql
stable
security definer
set search_path = public
as $$
  with required_tables as (
    select unnest(array[
      'tickets',
      'ticket_events',
      'field_tasks',
      'attachments',
      'domain_events',
      'operation_idempotency',
      'audit_logs',
      'job_executions'
    ]) as table_name
  ),
  table_meta as (
    select
      rt.table_name,
      coalesce(pc.relrowsecurity, false) as rls_enabled,
      exists (
        select 1
        from pg_policies p
        where p.schemaname = 'public'
          and p.tablename = rt.table_name
          and p.roles::text ilike '%authenticated%'
      ) as has_authenticated_policy,
      exists (
        select 1
        from information_schema.columns c
        where c.table_schema = 'public'
          and c.table_name = rt.table_name
          and c.column_name = 'org_id'
      ) as org_column_present
    from required_tables rt
    left join pg_class pc on pc.relname = rt.table_name
    left join pg_namespace pn on pn.oid = pc.relnamespace and pn.nspname = 'public'
  )
  select
    tm.table_name,
    tm.rls_enabled,
    tm.has_authenticated_policy,
    tm.org_column_present,
    case
      when tm.rls_enabled and tm.has_authenticated_policy and tm.org_column_present then 'pass'
      else 'fail'
    end as status
  from table_meta tm
  order by tm.table_name;
$$;

create or replace function public.validate_query_boundary_indexes()
returns table (
  index_name text,
  exists boolean,
  status text
)
language sql
stable
security definer
set search_path = public
as $$
  with required_indexes as (
    select unnest(array[
      'idx_ticket_events_timeline',
      'idx_tickets_filter_matrix',
      'idx_tickets_activity_timeline',
      'idx_attachments_owner_status_timeline',
      'idx_domain_events_unpublished',
      'idx_operation_idempotency_expiry'
    ]) as index_name
  )
  select
    ri.index_name,
    exists (select 1 from pg_indexes i where i.schemaname = 'public' and i.indexname = ri.index_name) as exists,
    case
      when exists (select 1 from pg_indexes i where i.schemaname = 'public' and i.indexname = ri.index_name) then 'pass'
      else 'fail'
    end as status
  from required_indexes ri;
$$;
