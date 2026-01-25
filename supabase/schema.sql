-- Enable extensions
create extension if not exists pgcrypto;

-- Core tables
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  pin_hash text not null,
  created_at timestamptz default now()
);

create table if not exists public.picks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  picks_by_category jsonb not null,
  updated_at timestamptz default now()
);

create unique index if not exists picks_user_id_unique on public.picks(user_id);

-- RPC: create or verify a username+pin and return user id
create or replace function public.login_user(p_username text, p_pin text)
returns uuid
language plpgsql
security definer
as $$
declare
  found_user public.users%rowtype;
begin
  select * into found_user from public.users where lower(username) = lower(p_username);

  if found_user.id is null then
    insert into public.users (username, pin_hash)
    values (p_username, crypt(p_pin, gen_salt('bf')))
    returning * into found_user;
    return found_user.id;
  end if;

  if crypt(p_pin, found_user.pin_hash) = found_user.pin_hash then
    return found_user.id;
  end if;

  return null;
end;
$$;

-- RPC: rename user if pin matches
create or replace function public.rename_user(p_user_id uuid, p_pin text, p_new_username text)
returns boolean
language plpgsql
security definer
as $$
declare
  found_user public.users%rowtype;
begin
  select * into found_user from public.users where id = p_user_id;
  if found_user.id is null then
    return false;
  end if;

  if crypt(p_pin, found_user.pin_hash) <> found_user.pin_hash then
    return false;
  end if;

  update public.users
  set username = p_new_username
  where id = p_user_id;

  return true;
end;
$$;

-- RPC: save picks if pin matches
create or replace function public.save_picks(p_user_id uuid, p_pin text, p_picks jsonb)
returns boolean
language plpgsql
security definer
as $$
declare
  found_user public.users%rowtype;
begin
  select * into found_user from public.users where id = p_user_id;
  if found_user.id is null then
    return false;
  end if;

  if crypt(p_pin, found_user.pin_hash) <> found_user.pin_hash then
    return false;
  end if;

  insert into public.picks (user_id, picks_by_category, updated_at)
  values (p_user_id, p_picks, now())
  on conflict (user_id)
  do update set picks_by_category = excluded.picks_by_category, updated_at = now();

  return true;
end;
$$;

-- Public view for leaderboard
create or replace view public.leaderboard_picks as
select u.username, p.picks_by_category
from public.users u
join public.picks p on p.user_id = u.id;

-- RLS
alter table public.users enable row level security;
alter table public.picks enable row level security;

-- Allow read from leaderboard view
grant select on public.leaderboard_picks to anon;

-- Allow execute on RPC for anon
grant execute on function public.login_user(text, text) to anon;
grant execute on function public.rename_user(uuid, text, text) to anon;
grant execute on function public.save_picks(uuid, text, jsonb) to anon;
