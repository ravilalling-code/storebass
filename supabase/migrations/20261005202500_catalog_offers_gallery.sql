alter table public.products
  add column if not exists offer_active boolean not null default false,
  add column if not exists offer_price numeric(10,2);

update public.products
set offer_price = null,
    offer_active = false
where offer_price is null;

alter table public.products
  drop constraint if exists products_offer_price_check;
alter table public.products
  add constraint products_offer_price_check
  check (offer_price is null or offer_price > 0);

create table if not exists public.product_images (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references public.products(id) on delete cascade,
  url text not null,
  sort_order integer not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default timezone('America/Lima', now())
);

create index if not exists product_images_product_id_idx on public.product_images(product_id, sort_order);

alter table public.product_images enable row level security;
grant select on public.product_images to anon, authenticated;
grant insert, update, delete on public.product_images to authenticated;

drop policy if exists "Public can view product images" on public.product_images;
create policy "Public can view product images" on public.product_images for select to anon, authenticated using (true);

drop policy if exists "Authenticated manages product images" on public.product_images;
create policy "Authenticated manages product images" on public.product_images for all to authenticated using (true) with check (true);

do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'products') then
    alter publication supabase_realtime add table public.products;
  end if;
end $$;

insert into public.product_images(product_id, url, sort_order, is_primary)
select id, img, 0, true from public.products
where coalesce(img, '') <> ''
and not exists (select 1 from public.product_images pi where pi.product_id = products.id);
