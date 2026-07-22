-- migration: add_avatar_url_to_profiles.sql
alter table public.profiles
  add column if not exists avatar_url text;
