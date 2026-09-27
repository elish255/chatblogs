-- Safe additive migration for ChatBlog registration.
-- Does NOT alter or drop any existing Chatpesa table/column.
create table if not exists public.chatblog_account_details (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  username text not null unique,
  country text not null,
  password_hash text not null,
  created_at timestamptz not null default now()
);

alter table public.chatblog_account_details enable row level security;

-- The ChatBlog server uses the Supabase service-role key for all writes/reads.
-- No public policies are created intentionally.
