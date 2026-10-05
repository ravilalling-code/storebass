alter table public.products add column if not exists description text not null default '';
alter table public.trip_config
  add column if not exists departure_place text not null default 'Lima',
  add column if not exists arrival_place text not null default 'Miami',
  add column if not exists order_deadline_lima date,
  add column if not exists order_deadline_usa date,
  add column if not exists exchange_rate numeric(10,4) not null default 3.75;
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'tickets') then
    alter publication supabase_realtime add table public.tickets;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'trip_config') then
    alter publication supabase_realtime add table public.trip_config;
  end if;
end $$;
