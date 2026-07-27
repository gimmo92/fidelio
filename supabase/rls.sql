-- Fidelio: Row Level Security multi-tenant
-- Eseguire in Supabase SQL Editor DOPO `prisma migrate deploy` / `prisma db push`.
--
-- Strategia: ogni utente autenticato ha un JWT con claim `group_id` (e opzionalmente
-- `location_id`, `role`, `user_type`) impostati via custom claims / app_metadata.
-- Le policy filtrano su dealer_groups.id = auth.jwt() ->> 'group_id'.
--
-- Per lo staff: group_id obbligatorio.
-- Per i clienti: group_id + accesso solo ai propri record (customer.auth_user_id = auth.uid()).

-- ─── Helper: claim group_id dal JWT ──────────────────────────────────────────

create or replace function public.current_group_id()
returns text
language sql
stable
as $$
  select coalesce(
    auth.jwt() -> 'app_metadata' ->> 'group_id',
    auth.jwt() ->> 'group_id'
  );
$$;

create or replace function public.current_user_type()
returns text
language sql
stable
as $$
  select coalesce(
    auth.jwt() -> 'app_metadata' ->> 'user_type',
    auth.jwt() ->> 'user_type',
    'staff'
  );
$$;

create or replace function public.current_customer_id()
returns text
language sql
stable
as $$
  select c.id
  from public.customers c
  where c.auth_user_id = auth.uid()::text
  limit 1;
$$;

-- ─── Abilita RLS ─────────────────────────────────────────────────────────────

alter table public.dealer_groups enable row level security;
alter table public.locations enable row level security;
alter table public.staff_users enable row level security;
alter table public.customers enable row level security;
alter table public.vehicles enable row level security;
alter table public.service_records enable row level security;
alter table public.appointments enable row level security;
alter table public.reminders enable row level security;
alter table public.communication_logs enable row level security;

-- ─── Dealer groups ───────────────────────────────────────────────────────────

drop policy if exists "staff_select_own_group" on public.dealer_groups;
create policy "staff_select_own_group" on public.dealer_groups
  for select to authenticated
  using (id = public.current_group_id());

-- ─── Locations ───────────────────────────────────────────────────────────────

drop policy if exists "tenant_select_locations" on public.locations;
create policy "tenant_select_locations" on public.locations
  for select to authenticated
  using (group_id = public.current_group_id());

drop policy if exists "owner_manage_locations" on public.locations;
create policy "owner_manage_locations" on public.locations
  for all to authenticated
  using (
    group_id = public.current_group_id()
    and (auth.jwt() -> 'app_metadata' ->> 'role') = 'OWNER'
  )
  with check (
    group_id = public.current_group_id()
    and (auth.jwt() -> 'app_metadata' ->> 'role') = 'OWNER'
  );

-- ─── Staff users ─────────────────────────────────────────────────────────────

drop policy if exists "staff_select_same_group" on public.staff_users;
create policy "staff_select_same_group" on public.staff_users
  for select to authenticated
  using (group_id = public.current_group_id());

-- ─── Customers ───────────────────────────────────────────────────────────────

drop policy if exists "staff_all_customers" on public.customers;
create policy "staff_all_customers" on public.customers
  for all to authenticated
  using (
    public.current_user_type() = 'staff'
    and group_id = public.current_group_id()
  )
  with check (
    public.current_user_type() = 'staff'
    and group_id = public.current_group_id()
  );

drop policy if exists "customer_select_self" on public.customers;
create policy "customer_select_self" on public.customers
  for select to authenticated
  using (
    public.current_user_type() = 'customer'
    and auth_user_id = auth.uid()::text
  );

drop policy if exists "customer_update_self" on public.customers;
create policy "customer_update_self" on public.customers
  for update to authenticated
  using (
    public.current_user_type() = 'customer'
    and auth_user_id = auth.uid()::text
  )
  with check (
    public.current_user_type() = 'customer'
    and auth_user_id = auth.uid()::text
  );

-- ─── Vehicles ────────────────────────────────────────────────────────────────

drop policy if exists "staff_all_vehicles" on public.vehicles;
create policy "staff_all_vehicles" on public.vehicles
  for all to authenticated
  using (
    public.current_user_type() = 'staff'
    and exists (
      select 1 from public.customers c
      where c.id = vehicles.customer_id
        and c.group_id = public.current_group_id()
    )
  )
  with check (
    public.current_user_type() = 'staff'
    and exists (
      select 1 from public.customers c
      where c.id = vehicles.customer_id
        and c.group_id = public.current_group_id()
    )
  );

drop policy if exists "customer_select_own_vehicles" on public.vehicles;
create policy "customer_select_own_vehicles" on public.vehicles
  for select to authenticated
  using (
    public.current_user_type() = 'customer'
    and customer_id = public.current_customer_id()
  );

-- ─── Service records ─────────────────────────────────────────────────────────

drop policy if exists "staff_all_service_records" on public.service_records;
create policy "staff_all_service_records" on public.service_records
  for all to authenticated
  using (
    public.current_user_type() = 'staff'
    and exists (
      select 1 from public.locations l
      where l.id = service_records.location_id
        and l.group_id = public.current_group_id()
    )
  )
  with check (
    public.current_user_type() = 'staff'
    and exists (
      select 1 from public.locations l
      where l.id = service_records.location_id
        and l.group_id = public.current_group_id()
    )
  );

drop policy if exists "customer_select_own_service_records" on public.service_records;
create policy "customer_select_own_service_records" on public.service_records
  for select to authenticated
  using (
    public.current_user_type() = 'customer'
    and exists (
      select 1 from public.vehicles v
      where v.id = service_records.vehicle_id
        and v.customer_id = public.current_customer_id()
    )
  );

-- ─── Appointments ────────────────────────────────────────────────────────────

drop policy if exists "staff_all_appointments" on public.appointments;
create policy "staff_all_appointments" on public.appointments
  for all to authenticated
  using (
    public.current_user_type() = 'staff'
    and exists (
      select 1 from public.locations l
      where l.id = appointments.location_id
        and l.group_id = public.current_group_id()
    )
  )
  with check (
    public.current_user_type() = 'staff'
    and exists (
      select 1 from public.locations l
      where l.id = appointments.location_id
        and l.group_id = public.current_group_id()
    )
  );

drop policy if exists "customer_own_appointments" on public.appointments;
create policy "customer_own_appointments" on public.appointments
  for all to authenticated
  using (
    public.current_user_type() = 'customer'
    and exists (
      select 1 from public.vehicles v
      where v.id = appointments.vehicle_id
        and v.customer_id = public.current_customer_id()
    )
  )
  with check (
    public.current_user_type() = 'customer'
    and exists (
      select 1 from public.vehicles v
      where v.id = appointments.vehicle_id
        and v.customer_id = public.current_customer_id()
    )
  );

-- ─── Reminders ───────────────────────────────────────────────────────────────

drop policy if exists "staff_all_reminders" on public.reminders;
create policy "staff_all_reminders" on public.reminders
  for all to authenticated
  using (
    public.current_user_type() = 'staff'
    and exists (
      select 1 from public.vehicles v
      join public.customers c on c.id = v.customer_id
      where v.id = reminders.vehicle_id
        and c.group_id = public.current_group_id()
    )
  )
  with check (
    public.current_user_type() = 'staff'
    and exists (
      select 1 from public.vehicles v
      join public.customers c on c.id = v.customer_id
      where v.id = reminders.vehicle_id
        and c.group_id = public.current_group_id()
    )
  );

drop policy if exists "customer_select_own_reminders" on public.reminders;
create policy "customer_select_own_reminders" on public.reminders
  for select to authenticated
  using (
    public.current_user_type() = 'customer'
    and exists (
      select 1 from public.vehicles v
      where v.id = reminders.vehicle_id
        and v.customer_id = public.current_customer_id()
    )
  );

-- ─── Communication logs ──────────────────────────────────────────────────────

drop policy if exists "staff_all_communications" on public.communication_logs;
create policy "staff_all_communications" on public.communication_logs
  for all to authenticated
  using (
    public.current_user_type() = 'staff'
    and exists (
      select 1 from public.customers c
      where c.id = communication_logs.customer_id
        and c.group_id = public.current_group_id()
    )
  )
  with check (
    public.current_user_type() = 'staff'
    and exists (
      select 1 from public.customers c
      where c.id = communication_logs.customer_id
        and c.group_id = public.current_group_id()
    )
  );

drop policy if exists "customer_select_own_communications" on public.communication_logs;
create policy "customer_select_own_communications" on public.communication_logs
  for select to authenticated
  using (
    public.current_user_type() = 'customer'
    and customer_id = public.current_customer_id()
  );

-- Nota: le Server Actions Next.js usano Prisma con DATABASE_URL (service role /
-- connection string che bypassa RLS). Le policy proteggono l'accesso diretto
-- via Supabase client (anon key) dall'area clienti e da eventuali client-side.
