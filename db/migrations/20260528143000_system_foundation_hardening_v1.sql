-- System Foundation Hardening v1
-- Correctness + maintainability + scalability reinforcement

-- ===== Immutable timeline/event safety =====
create or replace function public.prevent_ticket_event_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'ticket_events is immutable append-only';
end;
$$;

drop trigger if exists trg_ticket_events_no_update on public.ticket_events;
create trigger trg_ticket_events_no_update
before update on public.ticket_events
for each row
execute function public.prevent_ticket_event_mutation();

drop trigger if exists trg_ticket_events_no_delete on public.ticket_events;
create trigger trg_ticket_events_no_delete
before delete on public.ticket_events
for each row
execute function public.prevent_ticket_event_mutation();

create or replace function public.enforce_domain_event_update_rules()
returns trigger
language plpgsql
as $$
begin
  if old.published_at is null
     and new.published_at is not null
     and old.aggregate_type = new.aggregate_type
     and old.aggregate_id = new.aggregate_id
     and old.event_name = new.event_name
     and old.event_version = new.event_version
     and old.payload = new.payload
     and old.occurred_at = new.occurred_at
     and old.partition_key is not distinct from new.partition_key then
    return new;
  end if;

  raise exception 'domain_events only allows published_at transition null -> timestamp';
end;
$$;

drop trigger if exists trg_domain_events_update_rules on public.domain_events;
create trigger trg_domain_events_update_rules
before update on public.domain_events
for each row
execute function public.enforce_domain_event_update_rules();

-- ===== Optimistic concurrency hard-guard =====
create or replace function public.enforce_row_version_increment()
returns trigger
language plpgsql
as $$
begin
  if new.row_version <> old.row_version + 1 then
    raise exception 'row_version must increment by exactly 1';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_tickets_row_version on public.tickets;
create trigger trg_tickets_row_version
before update on public.tickets
for each row
execute function public.enforce_row_version_increment();

drop trigger if exists trg_field_tasks_row_version on public.field_tasks;
create trigger trg_field_tasks_row_version
before update on public.field_tasks
for each row
execute function public.enforce_row_version_increment();

drop trigger if exists trg_installed_components_row_version on public.installed_components;
create trigger trg_installed_components_row_version
before update on public.installed_components
for each row
execute function public.enforce_row_version_increment();

drop trigger if exists trg_installation_projects_row_version on public.installation_projects;
create trigger trg_installation_projects_row_version
before update on public.installation_projects
for each row
execute function public.enforce_row_version_increment();

drop trigger if exists trg_installation_tasks_row_version on public.installation_tasks;
create trigger trg_installation_tasks_row_version
before update on public.installation_tasks
for each row
execute function public.enforce_row_version_increment();

-- ===== State invariants =====
create or replace function public.enforce_ticket_status_transition()
returns trigger
language plpgsql
as $$
begin
  if new.status = old.status then
    return new;
  end if;

  if old.status = 'open' and new.status in ('triaged') then return new; end if;
  if old.status = 'triaged' and new.status in ('assigned') then return new; end if;
  if old.status = 'assigned' and new.status in ('in_progress', 'blocked') then return new; end if;
  if old.status = 'in_progress' and new.status in ('blocked', 'resolved') then return new; end if;
  if old.status = 'blocked' and new.status in ('in_progress') then return new; end if;
  if old.status = 'resolved' and new.status in ('closed', 'in_progress') then return new; end if;
  if old.status = 'closed' and new.status in ('in_progress') then return new; end if;

  raise exception 'invalid ticket status transition: % -> %', old.status, new.status;
end;
$$;

drop trigger if exists trg_ticket_status_transition on public.tickets;
create trigger trg_ticket_status_transition
before update on public.tickets
for each row
execute function public.enforce_ticket_status_transition();

create or replace function public.enforce_task_status_transition()
returns trigger
language plpgsql
as $$
begin
  if new.status = old.status then
    return new;
  end if;

  if old.status = 'pending' and new.status in ('scheduled', 'canceled') then return new; end if;
  if old.status = 'scheduled' and new.status in ('in_progress', 'canceled') then return new; end if;
  if old.status = 'in_progress' and new.status in ('done', 'failed') then return new; end if;

  raise exception 'invalid task status transition: % -> %', old.status, new.status;
end;
$$;

drop trigger if exists trg_field_task_status_transition on public.field_tasks;
create trigger trg_field_task_status_transition
before update on public.field_tasks
for each row
execute function public.enforce_task_status_transition();

drop trigger if exists trg_installation_task_status_transition on public.installation_tasks;
create trigger trg_installation_task_status_transition
before update on public.installation_tasks
for each row
execute function public.enforce_task_status_transition();

create or replace function public.enforce_sla_timer_status_transition()
returns trigger
language plpgsql
as $$
begin
  if new.status = old.status then
    return new;
  end if;

  if old.status = 'pending' and new.status in ('running', 'breached', 'canceled') then return new; end if;
  if old.status = 'running' and new.status in ('met', 'breached', 'canceled') then return new; end if;

  raise exception 'invalid SLA timer transition: % -> %', old.status, new.status;
end;
$$;

drop trigger if exists trg_sla_timer_status_transition on public.ticket_sla_timers;
create trigger trg_sla_timer_status_transition
before update on public.ticket_sla_timers
for each row
execute function public.enforce_sla_timer_status_transition();

-- ===== Polymorphic attachment safety =====
alter table public.attachments
  add constraint chk_attachments_checksum_sha256_hex
  check (checksum_sha256 ~ '^[A-Fa-f0-9]{64}$');

alter table public.attachments
  add constraint chk_attachments_size_upper_bound
  check (size_bytes <= 2147483648);

create or replace function public.validate_attachment_owner_reference()
returns trigger
language plpgsql
as $$
declare
  is_valid boolean;
begin
  is_valid := false;

  if new.owner_type = 'ticket' then
    select exists (
      select 1 from public.tickets t
      where t.id = new.owner_id and t.org_id = new.org_id and t.deleted_at is null
    ) into is_valid;
  elsif new.owner_type = 'field_task' then
    select exists (
      select 1 from public.field_tasks ft
      where ft.id = new.owner_id and ft.org_id = new.org_id and ft.deleted_at is null
    ) into is_valid;
  elsif new.owner_type = 'solution' then
    select exists (
      select 1 from public.proven_solutions s
      where s.id = new.owner_id and s.org_id = new.org_id and s.deleted_at is null
    ) into is_valid;
  elsif new.owner_type = 'installation_project' then
    select exists (
      select 1 from public.installation_projects ip
      where ip.id = new.owner_id and ip.org_id = new.org_id and ip.deleted_at is null
    ) into is_valid;
  elsif new.owner_type = 'knowledge_article' then
    select exists (
      select 1 from public.knowledge_articles ka
      where ka.id = new.owner_id and ka.org_id = new.org_id and ka.deleted_at is null
    ) into is_valid;
  elsif new.owner_type = 'procedure' then
    select exists (
      select 1 from public.troubleshooting_procedures tp
      where tp.id = new.owner_id and tp.org_id = new.org_id and tp.deleted_at is null
    ) into is_valid;
  end if;

  if not is_valid then
    raise exception 'invalid attachment owner reference for owner_type=% owner_id=%', new.owner_type, new.owner_id;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_attachments_validate_owner on public.attachments;
create trigger trg_attachments_validate_owner
before insert or update on public.attachments
for each row
execute function public.validate_attachment_owner_reference();

-- ===== Index hardening for timelines / filtering / analytics =====
create index if not exists idx_ticket_events_timeline
  on public.ticket_events(org_id, ticket_id, created_at desc, id desc);

create index if not exists idx_ticket_events_type_timeline
  on public.ticket_events(org_id, event_type, created_at desc);

create index if not exists idx_tickets_filter_matrix
  on public.tickets(org_id, status, assignee_user_id, priority, updated_at desc)
  where deleted_at is null;

create index if not exists idx_tickets_activity_timeline
  on public.tickets(org_id, last_activity_at desc, id desc)
  where deleted_at is null;

create index if not exists idx_attachments_owner_status_timeline
  on public.attachments(org_id, owner_type, owner_id, status, created_at desc)
  where deleted_at is null;

create index if not exists idx_attachments_large_ready
  on public.attachments(org_id, status, size_bytes desc, created_at desc)
  where deleted_at is null and status = 'ready';

create index if not exists idx_domain_events_unpublished
  on public.domain_events(org_id, occurred_at, id)
  where published_at is null;

create index if not exists idx_domain_events_aggregate
  on public.domain_events(org_id, aggregate_type, aggregate_id, occurred_at desc);

create index if not exists idx_audit_logs_created_at_brin
  on public.audit_logs using brin (created_at);

create index if not exists idx_operation_idempotency_expiry
  on public.operation_idempotency(org_id, expires_at);
