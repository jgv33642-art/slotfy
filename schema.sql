-- ========================================================
-- SLOTFY SAAS MULTI-TENANT SCHEDULING DATABASE SCHEMA
-- ========================================================

-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";

-- 2. TENANTS TABLE
create table public.tenants (
    id uuid default gen_random_uuid() primary key,
    name text not null,
    slug text not null unique,
    niche text not null,
    business_hours jsonb not null default '{
        "monday": {"open": "08:00", "close": "18:00", "active": true},
        "tuesday": {"open": "08:00", "close": "18:00", "active": true},
        "wednesday": {"open": "08:00", "close": "18:00", "active": true},
        "thursday": {"open": "08:00", "close": "18:00", "active": true},
        "friday": {"open": "08:00", "close": "18:00", "active": true},
        "saturday": {"open": "08:00", "close": "12:00", "active": true},
        "sunday": {"open": "00:00", "close": "00:00", "active": false}
    }'::jsonb,
    whatsapp_number text not null,
    subscription_status text not null default 'active' check (subscription_status in ('active', 'inactive', 'past_due')),
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null
);

-- Index for fast lookup on public booking pages
create index idx_tenants_slug on public.tenants(slug);

-- 3. PROFILES TABLE (Linked to Supabase Auth)
create table public.profiles (
    id uuid references auth.users on delete cascade primary key,
    tenant_id uuid references public.tenants on delete cascade not null,
    name text not null,
    email text not null,
    role text not null default 'staff' check (role in ('admin', 'staff')),
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null
);

create index idx_profiles_tenant on public.profiles(tenant_id);

-- 4. SERVICES TABLE
create table public.services (
    id uuid default gen_random_uuid() primary key,
    tenant_id uuid references public.tenants on delete cascade not null,
    name text not null,
    description text,
    duration_minutes integer not null check (duration_minutes > 0),
    price numeric(10, 2) not null check (price >= 0),
    is_active boolean default true not null,
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null
);

create index idx_services_tenant on public.services(tenant_id);

-- 5. APPOINTMENTS TABLE
create table public.appointments (
    id uuid default gen_random_uuid() primary key,
    tenant_id uuid references public.tenants on delete cascade not null,
    service_id uuid references public.services on delete cascade not null,
    client_name text not null,
    client_phone text not null,
    appointment_time timestamptz not null,
    status text not null default 'scheduled' check (status in ('scheduled', 'confirmed', 'cancelled')),
    notes text,
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null
);

create index idx_appointments_tenant_time on public.appointments(tenant_id, appointment_time);

-- 6. SECURITY DEFINER HELPERS FOR RLS
-- Safely fetches the tenant_id of the currently logged-in user
create or replace function public.get_user_tenant_id()
returns uuid
language plpgsql
security definer
stable
as $$
begin
  return (
    select tenant_id 
    from public.profiles 
    where id = auth.uid()
  );
end;
$$;

-- 7. ENABLE ROW LEVEL SECURITY
alter table public.tenants enable row level security;
alter table public.profiles enable row level security;
alter table public.services enable row level security;
alter table public.appointments enable row level security;

-- 8. ROW LEVEL SECURITY (RLS) POLICIES

-- ================= tenants =================
create policy "Allow staff to view their tenant" on public.tenants
    for select using (id = public.get_user_tenant_id());

create policy "Allow tenant admins to update details" on public.tenants
    for update using (
        id = public.get_user_tenant_id() 
        and exists (
            select 1 from public.profiles 
            where profiles.id = auth.uid() and profiles.role = 'admin'
        )
    );

create policy "Allow public read active tenants" on public.tenants
    for select using (subscription_status = 'active');

-- ================= profiles =================
create policy "Allow users of same tenant to view profiles" on public.profiles
    for select using (tenant_id = public.get_user_tenant_id());

create policy "Allow profile owners to update their profile" on public.profiles
    for update using (id = auth.uid());

-- ================= services =================
create policy "Allow tenant employees CRUD services" on public.services
    for all using (tenant_id = public.get_user_tenant_id());

create policy "Allow public read active services" on public.services
    for select using (
        is_active = true 
        and exists (
            select 1 from public.tenants 
            where tenants.id = services.tenant_id 
              and tenants.subscription_status = 'active'
        )
    );

-- ================= appointments =================
create policy "Allow tenant employees CRUD appointments" on public.appointments
    for all using (tenant_id = public.get_user_tenant_id());

create policy "Allow public booking inserts" on public.appointments
    for insert with check (
        exists (
            select 1 from public.tenants 
            where tenants.id = appointments.tenant_id 
              and tenants.subscription_status = 'active'
        )
    );

create policy "Allow public selection of appointment times" on public.appointments
    for select using (
        exists (
            select 1 from public.tenants 
            where tenants.id = appointments.tenant_id 
              and tenants.subscription_status = 'active'
        )
    );

-- 9. AVAILABILITY CHECK FUNCTION (SECURITY DEFINER)
create or replace function public.get_busy_slots(
    p_tenant_id uuid,
    p_start_date timestamptz,
    p_end_date timestamptz
)
returns table (busy_time timestamptz, duration_minutes integer)
language plpgsql
security definer
stable
as $$
begin
    if not exists (select 1 from public.tenants where id = p_tenant_id and subscription_status = 'active') then
        raise exception 'Tenant is inactive or subscription has expired.';
    end if;

    return query
    select 
        a.appointment_time as busy_time,
        s.duration_minutes
    from public.appointments a
    join public.services s on a.service_id = s.id
    where a.tenant_id = p_tenant_id
      and a.appointment_time >= p_start_date
      and a.appointment_time <= p_end_date
      and a.status != 'cancelled';
end;
$$;
