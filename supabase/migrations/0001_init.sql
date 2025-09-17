-- DNSweeper initial schema

create extension if not exists "pgcrypto" with schema public;

create table if not exists public.domains (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade,
    domain_name text not null,
    last_scan timestamptz,
    created_at timestamptz not null default timezone('utc', now()),
    constraint domains_user_domain_key unique (user_id, domain_name)
);

create table if not exists public.scans (
    id uuid primary key default gen_random_uuid(),
    domain_id uuid references public.domains(id) on delete cascade,
    garbage_count integer not null default 0,
    total_records integer not null default 0,
    result jsonb,
    created_at timestamptz not null default timezone('utc', now())
);

create index if not exists scans_domain_id_created_at_idx
    on public.scans (domain_id, created_at desc);

create table if not exists public.subscriptions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade,
    stripe_customer_id text,
    stripe_subscription_id text,
    status text,
    current_period_end timestamptz,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now()),
    constraint subscriptions_user_unique unique (user_id)
);

create index if not exists subscriptions_customer_idx
    on public.subscriptions (stripe_customer_id);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$ language plpgsql;

create trigger set_subscriptions_updated_at
before update on public.subscriptions
for each row execute procedure public.set_updated_at();

alter table public.domains enable row level security;
alter table public.scans enable row level security;
alter table public.subscriptions enable row level security;

create policy "Domains are readable by owner" on public.domains
  for select using (auth.uid() = user_id);

create policy "Domains are manageable by owner" on public.domains
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Scans are readable by domain owner" on public.scans
  for select using (
    exists (
      select 1
      from public.domains d
      where d.id = domain_id and d.user_id = auth.uid()
    )
  );

create policy "Scans are insertable by domain owner" on public.scans
  for insert with check (
    exists (
      select 1
      from public.domains d
      where d.id = domain_id and d.user_id = auth.uid()
    )
  );

create policy "Subscriptions readable by owner" on public.subscriptions
  for select using (auth.uid() = user_id);

create policy "Subscriptions updatable by owner" on public.subscriptions
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

