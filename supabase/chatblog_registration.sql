-- CHATBLOG ONLINE — CANONICAL CHATPESA-STYLE SCHEMA
-- SAFE/ADDITIVE: creates only chatblog_* tables. It does not alter Chatpesa tables.
create extension if not exists pgcrypto;

create table if not exists public.chatblog_users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  username text not null,
  email text not null,
  phone text not null,
  country text not null,
  password_hash text not null,
  password_salt text not null,
  status text not null default 'pending' check (status in ('pending','active','rejected')),
  role text not null default 'user' check (role in ('user','admin')),
  balance bigint not null default 0 check (balance >= 0),
  total_earned bigint not null default 0 check (total_earned >= 0),
  total_withdrawn bigint not null default 0 check (total_withdrawn >= 0),
  bonus bigint not null default 0 check (bonus >= 0),
  public_token text not null unique,
  created_at timestamptz not null default now(),
  activated_at timestamptz
);

create unique index if not exists chatblog_users_username_key on public.chatblog_users(lower(username));
create unique index if not exists chatblog_users_email_key on public.chatblog_users(lower(email));
create unique index if not exists chatblog_users_phone_key on public.chatblog_users(phone);

create table if not exists public.chatblog_activation_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.chatblog_users(id) on delete cascade,
  method text not null check (method in ('fimipay','lipa_namba')),
  amount bigint not null check (amount > 0),
  phone text not null,
  external_id text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  confirmed_at timestamptz,
  reviewed_at timestamptz
);
create index if not exists chatblog_activation_user_status_idx on public.chatblog_activation_payments(user_id,status);
create index if not exists chatblog_activation_created_idx on public.chatblog_activation_payments(created_at desc);

create table if not exists public.chatblog_withdrawals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.chatblog_users(id) on delete cascade,
  amount bigint not null check (amount >= 50000),
  method text not null,
  account_number text not null,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);
create index if not exists chatblog_withdrawals_user_status_idx on public.chatblog_withdrawals(user_id,status);
create index if not exists chatblog_withdrawals_created_idx on public.chatblog_withdrawals(created_at desc);

create table if not exists public.chatblog_chat_sessions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null default gen_random_uuid() unique,
  user_id uuid not null references public.chatblog_users(id) on delete cascade,
  person_name text not null,
  payout bigint not null check (payout >= 0),
  message_count integer not null default 0 check (message_count between 0 and 20),
  status text not null default 'open' check (status in ('open','completed','closed')),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
create index if not exists chatblog_chat_sessions_user_created_idx on public.chatblog_chat_sessions(user_id,created_at desc);

create table if not exists public.chatblog_chat_messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.chatblog_chat_sessions(id) on delete cascade,
  sender text not null check (sender in ('user','foreigner')),
  text text not null,
  created_at timestamptz not null default now()
);
create index if not exists chatblog_chat_messages_chat_created_idx on public.chatblog_chat_messages(chat_id,created_at);

create table if not exists public.chatblog_notifications (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  message text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists chatblog_notifications_created_idx on public.chatblog_notifications(created_at desc);

create table if not exists public.chatblog_admin_notifications (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  user_id uuid references public.chatblog_users(id) on delete cascade,
  title text not null,
  message text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists chatblog_admin_notifications_created_idx on public.chatblog_admin_notifications(created_at desc);

alter table public.chatblog_users enable row level security;
alter table public.chatblog_activation_payments enable row level security;
alter table public.chatblog_withdrawals enable row level security;
alter table public.chatblog_chat_sessions enable row level security;
alter table public.chatblog_chat_messages enable row level security;
alter table public.chatblog_notifications enable row level security;
alter table public.chatblog_admin_notifications enable row level security;

insert into public.chatblog_notifications(title,message,active)
select 'Karibu ChatBlog 👋','Jisajili, lipia activation fee ya TZS 14,500, kisha anza kuchat.',true
where not exists (select 1 from public.chatblog_notifications where title='Karibu ChatBlog 👋');
