-- System Foundation v1
-- Modular monolith + internal domain events + immutable audit logs

create extension if not exists pgcrypto;

-- ===== Enums =====
create type public.app_role as enum ('admin', 'dispatcher', 'field_technician', 'support_engineer', 'knowledge_manager', 'viewer');
create type public.ticket_status as enum ('open', 'triaged', 'assigned', 'in_progress', 'blocked', 'resolved', 'closed');
create type public.ticket_priority as enum ('low', 'medium', 'high', 'critical');
create type public.task_status as enum ('pending', 'scheduled', 'in_progress', 'done', 'failed', 'canceled');
create type public.attachment_owner_type as enum ('ticket', 'field_task', 'solution', 'installation_project', 'knowledge_article', 'procedure');
create type public.attachment_status as enum ('uploaded', 'processing', 'ready', 'failed', 'deleted');
create type public.ticket_event_type as enum ('created', 'triaged', 'assigned', 'status_changed', 'comment_added', 'resolved', 'closed', 'reopened');
create type public.job_status as enum ('queued', 'running', 'succeeded', 'failed', 'dead_letter');
create type public.sla_timer_type as enum ('response', 'escalation', 'overdue');
create type public.sla_timer_status as enum ('pending', 'running', 'met', 'breached', 'canceled');
create type public.installation_status as enum ('planned', 'active', 'paused', 'completed', 'canceled');

-- ===== Common helpers =====
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ===== Identity & RBAC =====
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.organizations to authenticated;
grant all on public.organizations to service_role;
alter table public.organizations enable row level security;

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (org_id, user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_org_id uuid, _user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where org_id = _org_id
      and user_id = _user_id
      and role = _role
  )
$$;

-- ===== Catalog vs Field Instances =====
create table public.product_catalog_models (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  sku text not null,
  vendor text not null,
  model_name text not null,
  category text not null,
  specs jsonb not null default '{}'::jsonb,
  firmware_baseline text,
  is_active boolean not null default true,
  row_version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references auth.users(id),
  unique (org_id, sku)
);
grant select, insert, update, delete on public.product_catalog_models to authenticated;
grant all on public.product_catalog_models to service_role;
alter table public.product_catalog_models enable row level security;

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  contact_name text,
  contact_phone text,
  contact_email text,
  address jsonb,
  row_version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references auth.users(id)
);
grant select, insert, update, delete on public.clients to authenticated;
grant all on public.clients to service_role;
alter table public.clients enable row level security;

create table public.solar_systems (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete restrict,
  system_code text not null,
  location jsonb,
  commissioning_date date,
  status text not null default 'active',
  metadata jsonb not null default '{}'::jsonb,
  row_version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references auth.users(id),
  unique (org_id, system_code)
);
grant select, insert, update, delete on public.solar_systems to authenticated;
grant all on public.solar_systems to service_role;
alter table public.solar_systems enable row level security;

create table public.installed_components (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  solar_system_id uuid not null references public.solar_systems(id) on delete cascade,
  catalog_model_id uuid references public.product_catalog_models(id) on delete set null,
  serial_number text,
  component_type text not null,
  installed_at timestamptz,
  health_status text not null default 'unknown',
  runtime_metadata jsonb not null default '{}'::jsonb,
  row_version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references auth.users(id),
  unique (org_id, serial_number)
);
grant select, insert, update, delete on public.installed_components to authenticated;
grant all on public.installed_components to service_role;
alter table public.installed_components enable row level security;

-- ===== Ticketing =====
create table public.tickets (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  solar_system_id uuid references public.solar_systems(id) on delete set null,
  title text not null,
  description text,
  status public.ticket_status not null default 'open',
  priority public.ticket_priority not null default 'medium',
  assignee_user_id uuid references auth.users(id),
  reported_by_user_id uuid references auth.users(id),
  due_at timestamptz,
  last_activity_at timestamptz not null default now(),
  row_version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references auth.users(id)
);
grant select, insert, update, delete on public.tickets to authenticated;
grant all on public.tickets to service_role;
alter table public.tickets enable row level security;

create table public.ticket_events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  ticket_id uuid not null references public.tickets(id) on delete cascade,
  event_type public.ticket_event_type not null,
  actor_user_id uuid references auth.users(id),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
grant select, insert on public.ticket_events to authenticated;
grant all on public.ticket_events to service_role;
alter table public.ticket_events enable row level security;

create table public.field_tasks (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  ticket_id uuid not null references public.tickets(id) on delete cascade,
  title text not null,
  instructions text,
  status public.task_status not null default 'pending',
  assignee_user_id uuid references auth.users(id),
  scheduled_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  completion_notes text,
  row_version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references auth.users(id)
);
grant select, insert, update, delete on public.field_tasks to authenticated;
grant all on public.field_tasks to service_role;
alter table public.field_tasks enable row level security;

-- ===== Error Intelligence =====
create table public.error_codes (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  code text not null,
  title text not null,
  severity text,
  subsystem text,
  description text,
  metadata jsonb not null default '{}'::jsonb,
  row_version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references auth.users(id),
  unique (org_id, code)
);
grant select, insert, update, delete on public.error_codes to authenticated;
grant all on public.error_codes to service_role;
alter table public.error_codes enable row level security;

create table public.ticket_error_codes (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  ticket_id uuid not null references public.tickets(id) on delete cascade,
  error_code_id uuid not null references public.error_codes(id) on delete restrict,
  detected_at timestamptz not null default now(),
  confidence numeric(5,2),
  source text,
  unique (org_id, ticket_id, error_code_id)
);
grant select, insert, update, delete on public.ticket_error_codes to authenticated;
grant all on public.ticket_error_codes to service_role;
alter table public.ticket_error_codes enable row level security;

create table public.error_code_intelligence (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  error_code_id uuid not null references public.error_codes(id) on delete cascade,
  insight_type text not null,
  insight_value jsonb not null,
  confidence numeric(5,2),
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.error_code_intelligence to authenticated;
grant all on public.error_code_intelligence to service_role;
alter table public.error_code_intelligence enable row level security;

-- ===== Knowledge =====
create table public.knowledge_articles (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  summary text,
  body_markdown text not null,
  tags text[] not null default '{}',
  published_at timestamptz,
  row_version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references auth.users(id)
);
grant select, insert, update, delete on public.knowledge_articles to authenticated;
grant all on public.knowledge_articles to service_role;
alter table public.knowledge_articles enable row level security;

create table public.proven_solutions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  problem_statement text,
  solution_steps jsonb not null default '[]'::jsonb,
  effectiveness_score numeric(5,2),
  usage_count integer not null default 0,
  row_version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references auth.users(id)
);
grant select, insert, update, delete on public.proven_solutions to authenticated;
grant all on public.proven_solutions to service_role;
alter table public.proven_solutions enable row level security;

create table public.troubleshooting_procedures (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  objective text,
  procedure_steps jsonb not null default '[]'::jsonb,
  safety_notes text,
  row_version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references auth.users(id)
);
grant select, insert, update, delete on public.troubleshooting_procedures to authenticated;
grant all on public.troubleshooting_procedures to service_role;
alter table public.troubleshooting_procedures enable row level security;

create table public.solution_error_code_map (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  solution_id uuid not null references public.proven_solutions(id) on delete cascade,
  error_code_id uuid not null references public.error_codes(id) on delete cascade,
  rank_score numeric(8,4),
  unique (org_id, solution_id, error_code_id)
);
grant select, insert, update, delete on public.solution_error_code_map to authenticated;
grant all on public.solution_error_code_map to service_role;
alter table public.solution_error_code_map enable row level security;

-- ===== Attachments =====
create table public.attachments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  owner_type public.attachment_owner_type not null,
  owner_id uuid not null,
  file_name text not null,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes >= 0),
  checksum_sha256 text not null,
  storage_provider text not null,
  storage_key text not null,
  status public.attachment_status not null default 'uploaded',
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references auth.users(id),
  unique (org_id, storage_provider, storage_key)
);
grant select, insert, update, delete on public.attachments to authenticated;
grant all on public.attachments to service_role;
alter table public.attachments enable row level security;

-- ===== Installations =====
create table public.installation_projects (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete restrict,
  solar_system_id uuid references public.solar_systems(id) on delete set null,
  code text not null,
  status public.installation_status not null default 'planned',
  start_date date,
  target_end_date date,
  actual_end_date date,
  notes text,
  row_version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references auth.users(id),
  unique (org_id, code)
);
grant select, insert, update, delete on public.installation_projects to authenticated;
grant all on public.installation_projects to service_role;
alter table public.installation_projects enable row level security;

create table public.installation_tasks (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.installation_projects(id) on delete cascade,
  title text not null,
  status public.task_status not null default 'pending',
  assignee_user_id uuid references auth.users(id),
  scheduled_at timestamptz,
  completed_at timestamptz,
  row_version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references auth.users(id)
);
grant select, insert, update, delete on public.installation_tasks to authenticated;
grant all on public.installation_tasks to service_role;
alter table public.installation_tasks enable row level security;

-- ===== SLA =====
create table public.sla_policies (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  priority public.ticket_priority,
  response_target_minutes integer,
  escalation_target_minutes integer,
  overdue_target_minutes integer,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.sla_policies to authenticated;
grant all on public.sla_policies to service_role;
alter table public.sla_policies enable row level security;

create table public.ticket_sla_timers (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  ticket_id uuid not null references public.tickets(id) on delete cascade,
  sla_policy_id uuid references public.sla_policies(id) on delete set null,
  timer_type public.sla_timer_type not null,
  status public.sla_timer_status not null default 'pending',
  due_at timestamptz,
  started_at timestamptz,
  breached_at timestamptz,
  met_at timestamptz,
  created_at timestamptz not null default now(),
  unique (org_id, ticket_id, timer_type)
);
grant select, insert, update, delete on public.ticket_sla_timers to authenticated;
grant all on public.ticket_sla_timers to service_role;
alter table public.ticket_sla_timers enable row level security;

-- ===== Events / Jobs / Idempotency / Audit =====
create table public.domain_events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  aggregate_type text not null,
  aggregate_id uuid not null,
  event_name text not null,
  event_version integer not null default 1,
  payload jsonb not null,
  occurred_at timestamptz not null default now(),
  published_at timestamptz,
  partition_key text,
  unique (org_id, aggregate_type, aggregate_id, event_name, occurred_at)
);
grant select, insert, update on public.domain_events to authenticated;
grant all on public.domain_events to service_role;
alter table public.domain_events enable row level security;

create table public.job_executions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.organizations(id) on delete cascade,
  job_type text not null,
  dedupe_key text,
  payload jsonb not null,
  status public.job_status not null default 'queued',
  attempts integer not null default 0,
  max_attempts integer not null default 8,
  next_run_at timestamptz not null default now(),
  locked_at timestamptz,
  locked_by text,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, job_type, dedupe_key)
);
grant select, insert, update, delete on public.job_executions to authenticated;
grant all on public.job_executions to service_role;
alter table public.job_executions enable row level security;

create table public.operation_idempotency (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  operation_type text not null,
  idempotency_key text not null,
  request_hash text not null,
  response_hash text,
  status text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz,
  unique (org_id, operation_type, idempotency_key)
);
grant select, insert, update, delete on public.operation_idempotency to authenticated;
grant all on public.operation_idempotency to service_role;
alter table public.operation_idempotency enable row level security;

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.organizations(id) on delete set null,
  actor_user_id uuid references auth.users(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  request_id text,
  correlation_id text,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now()
);
grant select, insert on public.audit_logs to authenticated;
grant all on public.audit_logs to service_role;
alter table public.audit_logs enable row level security;

create or replace function public.prevent_audit_log_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'audit_logs is immutable append-only';
end;
$$;

create trigger trg_audit_logs_no_update
before update on public.audit_logs
for each row
execute function public.prevent_audit_log_mutation();

create trigger trg_audit_logs_no_delete
before delete on public.audit_logs
for each row
execute function public.prevent_audit_log_mutation();

-- ===== Timestamps triggers =====
create trigger trg_product_catalog_models_updated_at before update on public.product_catalog_models for each row execute function public.set_updated_at();
create trigger trg_clients_updated_at before update on public.clients for each row execute function public.set_updated_at();
create trigger trg_solar_systems_updated_at before update on public.solar_systems for each row execute function public.set_updated_at();
create trigger trg_installed_components_updated_at before update on public.installed_components for each row execute function public.set_updated_at();
create trigger trg_tickets_updated_at before update on public.tickets for each row execute function public.set_updated_at();
create trigger trg_field_tasks_updated_at before update on public.field_tasks for each row execute function public.set_updated_at();
create trigger trg_error_codes_updated_at before update on public.error_codes for each row execute function public.set_updated_at();
create trigger trg_knowledge_articles_updated_at before update on public.knowledge_articles for each row execute function public.set_updated_at();
create trigger trg_proven_solutions_updated_at before update on public.proven_solutions for each row execute function public.set_updated_at();
create trigger trg_troubleshooting_procedures_updated_at before update on public.troubleshooting_procedures for each row execute function public.set_updated_at();
create trigger trg_attachments_updated_at before update on public.attachments for each row execute function public.set_updated_at();
create trigger trg_installation_projects_updated_at before update on public.installation_projects for each row execute function public.set_updated_at();
create trigger trg_installation_tasks_updated_at before update on public.installation_tasks for each row execute function public.set_updated_at();
create trigger trg_job_executions_updated_at before update on public.job_executions for each row execute function public.set_updated_at();

-- ===== Performance indexes =====
create index idx_clients_org_deleted on public.clients(org_id, deleted_at);
create index idx_solar_systems_org_client on public.solar_systems(org_id, client_id, deleted_at);
create index idx_components_system_status on public.installed_components(org_id, solar_system_id, health_status, deleted_at);
create index idx_tickets_queue on public.tickets(org_id, status, priority, created_at desc) where deleted_at is null;
create index idx_tickets_assignee on public.tickets(org_id, assignee_user_id, status, updated_at desc) where deleted_at is null;
create index idx_ticket_events_ticket_time on public.ticket_events(org_id, ticket_id, created_at desc);
create index idx_field_tasks_worker on public.field_tasks(org_id, assignee_user_id, status, scheduled_at) where deleted_at is null;
create index idx_ticket_error_codes_ticket on public.ticket_error_codes(org_id, ticket_id);
create index idx_solution_error_map_code on public.solution_error_code_map(org_id, error_code_id, rank_score desc);
create index idx_attachments_owner on public.attachments(org_id, owner_type, owner_id, created_at desc) where deleted_at is null;
create index idx_attachments_status on public.attachments(org_id, status, created_at desc);
create index idx_installation_projects_org_status on public.installation_projects(org_id, status, target_end_date) where deleted_at is null;
create index idx_ticket_sla_due on public.ticket_sla_timers(org_id, status, due_at);
create index idx_domain_events_publish on public.domain_events(org_id, published_at, occurred_at);
create index idx_job_executions_pick on public.job_executions(status, next_run_at, locked_at);
create index idx_idempotency_lookup on public.operation_idempotency(org_id, operation_type, idempotency_key);
create index idx_audit_logs_entity on public.audit_logs(org_id, entity_type, entity_id, created_at desc);
create index idx_audit_logs_actor on public.audit_logs(org_id, actor_user_id, created_at desc);

-- ===== Text search indexes (MVP) =====
create index idx_tickets_fts on public.tickets using gin (to_tsvector('simple', coalesce(title,'') || ' ' || coalesce(description,'')));
create index idx_knowledge_articles_fts on public.knowledge_articles using gin (to_tsvector('simple', coalesce(title,'') || ' ' || coalesce(summary,'') || ' ' || coalesce(body_markdown,'')));
