-- 생리 주기 트래커 초기 스키마 + RLS
-- 목표(모드): tracking(생리 추적) / ttc(임신 준비) / pregnant(임신 중)

-- =========================================================
-- profiles
-- =========================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  goal text not null default 'ttc' check (goal in ('tracking', 'ttc', 'pregnant')),
  avg_cycle_length int not null default 28,
  avg_period_length int not null default 5,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- 회원가입 시 프로필 자동 생성
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', null))
  on conflict (id) do nothing;
  insert into public.notification_prefs (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =========================================================
-- periods (생리 기록 — 주기 계산의 핵심)
-- =========================================================
create table if not exists public.periods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  start_date date not null,
  end_date date,
  created_at timestamptz not null default now(),
  unique (user_id, start_date)
);

create index if not exists periods_user_start_idx
  on public.periods (user_id, start_date desc);

alter table public.periods enable row level security;

-- =========================================================
-- daily_logs (몸상태/증상 — 비공개, 본인만)
-- =========================================================
create table if not exists public.daily_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  log_date date not null,
  flow text not null default 'none'
    check (flow in ('none', 'light', 'medium', 'heavy', 'very_heavy')),
  intercourse text not null default 'none'
    check (intercourse in ('none', 'protected', 'unprotected')),
  symptoms text[] not null default '{}',
  mood text,
  note text,
  unique (user_id, log_date)
);

create index if not exists daily_logs_user_date_idx
  on public.daily_logs (user_id, log_date desc);

alter table public.daily_logs enable row level security;

-- =========================================================
-- pregnancies (임신 중 모드)
-- =========================================================
create table if not exists public.pregnancies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  lmp_date date not null,
  due_date date not null,
  status text not null default 'active' check (status in ('active', 'ended')),
  created_at timestamptz not null default now()
);

alter table public.pregnancies enable row level security;

-- =========================================================
-- partner_links (파트너 연결 — 읽기 전용 공유)
-- owner: 기록자(아내), partner: 열람자(남편)
-- =========================================================
create table if not exists public.partner_links (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  partner_id uuid references auth.users (id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  invite_code text not null unique,
  created_at timestamptz not null default now()
);

create index if not exists partner_links_partner_idx
  on public.partner_links (partner_id);

alter table public.partner_links enable row level security;

-- 어떤 사용자가 특정 owner의 데이터를 볼 수 있는 accepted 파트너인지 확인
create or replace function public.is_accepted_partner(_owner uuid, _viewer uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.partner_links pl
    where pl.owner_id = _owner
      and pl.partner_id = _viewer
      and pl.status = 'accepted'
  );
$$;

-- =========================================================
-- push_subscriptions (Web Push 구독)
-- =========================================================
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

create index if not exists push_subscriptions_user_idx
  on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

-- =========================================================
-- notification_prefs (알림 설정)
-- =========================================================
create table if not exists public.notification_prefs (
  user_id uuid primary key references auth.users (id) on delete cascade,
  period_reminder boolean not null default true,
  ovulation_reminder boolean not null default true,
  fertile_window_reminder boolean not null default true,
  log_reminder boolean not null default false,
  partner_fertile_alert boolean not null default true,
  reminder_hour int not null default 9 check (reminder_hour between 0 and 23)
);

alter table public.notification_prefs enable row level security;

-- =========================================================
-- RLS 정책
-- =========================================================

-- profiles: 본인 전체 + 파트너는 연결된 owner 행 읽기
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (
    auth.uid() = id or public.is_accepted_partner(id, auth.uid())
  );
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

-- periods: 본인 전체 CRUD + 파트너 읽기 전용
drop policy if exists "periods_select" on public.periods;
create policy "periods_select" on public.periods
  for select using (
    auth.uid() = user_id or public.is_accepted_partner(user_id, auth.uid())
  );
drop policy if exists "periods_insert_own" on public.periods;
create policy "periods_insert_own" on public.periods
  for insert with check (auth.uid() = user_id);
drop policy if exists "periods_update_own" on public.periods;
create policy "periods_update_own" on public.periods
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "periods_delete_own" on public.periods;
create policy "periods_delete_own" on public.periods
  for delete using (auth.uid() = user_id);

-- daily_logs: 본인만 (파트너 접근 없음)
drop policy if exists "daily_logs_all_own" on public.daily_logs;
create policy "daily_logs_all_own" on public.daily_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- pregnancies: 본인 전체 + 파트너 읽기 (예측 대신 임신 정보 공유)
drop policy if exists "pregnancies_select" on public.pregnancies;
create policy "pregnancies_select" on public.pregnancies
  for select using (
    auth.uid() = user_id or public.is_accepted_partner(user_id, auth.uid())
  );
drop policy if exists "pregnancies_write_own" on public.pregnancies;
create policy "pregnancies_write_own" on public.pregnancies
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- partner_links: 양쪽 당사자가 자기 링크 조회/관리
drop policy if exists "partner_links_select" on public.partner_links;
create policy "partner_links_select" on public.partner_links
  for select using (auth.uid() = owner_id or auth.uid() = partner_id);
drop policy if exists "partner_links_insert_owner" on public.partner_links;
create policy "partner_links_insert_owner" on public.partner_links
  for insert with check (auth.uid() = owner_id);
-- 코드로 연결: partner가 본인을 partner_id로 등록하거나, owner가 관리
drop policy if exists "partner_links_update" on public.partner_links;
create policy "partner_links_update" on public.partner_links
  for update using (
    auth.uid() = owner_id or auth.uid() = partner_id or partner_id is null
  );
drop policy if exists "partner_links_delete_owner" on public.partner_links;
create policy "partner_links_delete_owner" on public.partner_links
  for delete using (auth.uid() = owner_id);

-- push_subscriptions: 본인만
drop policy if exists "push_subs_all_own" on public.push_subscriptions;
create policy "push_subs_all_own" on public.push_subscriptions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- notification_prefs: 본인만
drop policy if exists "notif_prefs_all_own" on public.notification_prefs;
create policy "notif_prefs_all_own" on public.notification_prefs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
