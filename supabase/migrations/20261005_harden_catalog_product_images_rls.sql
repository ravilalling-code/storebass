-- StoreBass catalog security and media permissions.
-- Applied to production Supabase on 2026-10-05.

revoke all on table public.products from anon;
grant select on table public.products to anon;
revoke all on table public.products from authenticated;
grant select, insert, update, delete on table public.products to authenticated;

revoke all on table public.product_images from anon;
grant select on table public.product_images to anon;
revoke all on table public.product_images from authenticated;
grant select, insert, update, delete on table public.product_images to authenticated;

drop policy if exists "Authenticated manages product images" on public.product_images;
drop policy if exists "Public can view product images" on public.product_images;

drop policy if exists "StoreBass media admin insert" on storage.objects;
drop policy if exists "StoreBass media admin update" on storage.objects;
drop policy if exists "StoreBass media admin delete" on storage.objects;
create policy "StoreBass media admin insert" on storage.objects for insert to authenticated with check (bucket_id = 'storebass-media' and (select private.is_admin()));
create policy "StoreBass media admin update" on storage.objects for update to authenticated using (bucket_id = 'storebass-media' and (select private.is_admin())) with check (bucket_id = 'storebass-media' and (select private.is_admin()));
create policy "StoreBass media admin delete" on storage.objects for delete to authenticated using (bucket_id = 'storebass-media' and (select private.is_admin()));
