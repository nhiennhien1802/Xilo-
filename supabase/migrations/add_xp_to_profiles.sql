-- migration: add_xp_to_profiles.sql
alter table public.profiles
  add column if not exists xp int default 0;

-- (tuỳ chọn) index nếu sau này làm bảng xếp hạng leaderboard theo XP
create index if not exists idx_profiles_xp on public.profiles(xp desc);
