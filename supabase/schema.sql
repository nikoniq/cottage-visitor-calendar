create extension if not exists pgcrypto;

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text not null,
  arrival date not null,
  departure date not null,
  guests integer not null check (guests between 1 and 4),
  notes text,
  status text not null check (status in ('requested', 'unavailable')) default 'requested',
  created_at timestamptz not null default now()
);

alter table public.bookings enable row level security;

create policy if not exists "public can read bookings"
on public.bookings
for select
using (true);

create policy if not exists "public can insert requested bookings"
on public.bookings
for insert
with check (status = 'requested');

create table if not exists public.holiday_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  date_range text not null,
  link text not null,
  description text,
  emoji text
);
