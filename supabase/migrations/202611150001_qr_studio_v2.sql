-- QR Studio V2 — Supabase schema
-- Run this migration in the Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.qr_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  short_code text not null unique check (short_code ~ '^[A-Za-z0-9_-]{8,20}$'),
  title text not null default 'Untitled campaign' check (char_length(title) between 1 and 120),
  destination_url text not null check (char_length(destination_url) <= 2048),
  is_active boolean not null default true,
  scan_count bigint not null default 0 check (scan_count >= 0),
  created_at timestamptz not null default now(),
  last_scanned_at timestamptz
);

create index if not exists qr_links_user_created_idx
  on public.qr_links(user_id, created_at desc);
create index if not exists qr_links_short_code_idx
  on public.qr_links(short_code) where is_active = true;

create table if not exists public.qr_scan_events (
  id bigint generated always as identity primary key,
  qr_link_id uuid not null references public.qr_links(id) on delete cascade,
  scanned_at timestamptz not null default now(),
  device_category text not null default 'other'
    check (device_category in ('mobile', 'desktop', 'tablet', 'other')),
  browser_category text not null default 'other'
    check (browser_category in ('chrome', 'safari', 'firefox', 'edge', 'other'))
);

create index if not exists qr_scan_events_link_time_idx
  on public.qr_scan_events(qr_link_id, scanned_at desc);

alter table public.qr_links enable row level security;
alter table public.qr_scan_events enable row level security;

drop policy if exists "Owners can view their QR links" on public.qr_links;
create policy "Owners can view their QR links"
  on public.qr_links for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Owners can create their QR links" on public.qr_links;
create policy "Owners can create their QR links"
  on public.qr_links for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Owners can update their QR links" on public.qr_links;
create policy "Owners can update their QR links"
  on public.qr_links for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Owners can delete their QR links" on public.qr_links;
create policy "Owners can delete their QR links"
  on public.qr_links for delete to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Owners can read their scan events" on public.qr_scan_events;
create policy "Owners can read their scan events"
  on public.qr_scan_events for select to authenticated
  using (
    exists (
      select 1 from public.qr_links
      where qr_links.id = qr_scan_events.qr_link_id
        and qr_links.user_id = auth.uid()
    )
  );

-- Only the Edge Function's service-role client can execute this RPC.
-- It records one aggregate event and increments the counter atomically.
create or replace function public.record_qr_scan(
  p_code text,
  p_device text default 'other',
  p_browser text default 'other'
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_link public.qr_links%rowtype;
begin
  select * into v_link
  from public.qr_links
  where short_code = p_code and is_active = true
  for update;

  if not found then
    return null;
  end if;

  update public.qr_links
  set scan_count = scan_count + 1,
      last_scanned_at = now()
  where id = v_link.id;

  insert into public.qr_scan_events(qr_link_id, device_category, browser_category)
  values (
    v_link.id,
    case when p_device in ('mobile','desktop','tablet') then p_device else 'other' end,
    case when p_browser in ('chrome','safari','firefox','edge') then p_browser else 'other' end
  );

  return v_link.destination_url;
end;
$$;

revoke all on function public.record_qr_scan(text, text, text) from public, anon, authenticated;
grant execute on function public.record_qr_scan(text, text, text) to service_role;

grant select, insert, update, delete on public.qr_links to authenticated;
grant select on public.qr_scan_events to authenticated;
