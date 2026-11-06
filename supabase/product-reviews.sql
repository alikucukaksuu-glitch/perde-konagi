-- Perde Konagi | Supabase SQL Editor'da bir kez calistirin.
create extension if not exists pgcrypto;
create table if not exists public.product_reviews (
 id uuid primary key default gen_random_uuid(),
 product_slug text not null check (length(product_slug) between 1 and 180),
 user_id uuid not null references auth.users(id) on delete cascade,
 display_name text not null check (length(trim(display_name)) between 2 and 60),
 rating smallint not null check (rating between 1 and 5),
 comment text not null check (length(trim(comment)) between 10 and 2000),
 photo_paths text[] not null default '{}',
 status text not null default 'pending' check (status in ('pending','approved','rejected')),
 created_at timestamptz not null default now(),
 unique(product_slug,user_id),
 check (cardinality(photo_paths) <= 3)
);
create index if not exists product_reviews_public_idx on public.product_reviews(product_slug,created_at desc) where status='approved';
alter table public.product_reviews enable row level security;
drop policy if exists "Public approved reviews" on public.product_reviews;
create policy "Public approved reviews" on public.product_reviews for select to anon,authenticated using (status='approved');
drop policy if exists "Authenticated review submission" on public.product_reviews;
create policy "Authenticated review submission" on public.product_reviews for insert to authenticated
with check (user_id=auth.uid() and status='pending' and cardinality(photo_paths)=0);
-- Review moderation is performed via Supabase dashboard with service-role privileges,
-- never expose the service_role key in GitHub Pages or client JavaScript.
-- Photo uploads should be enabled only after a verified storage workflow is configured.
