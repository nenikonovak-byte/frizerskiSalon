-- Pokrenite ovo u Supabase Dashboard → SQL Editor → New query.
-- Evidencija je dostupna samo prijavljenim korisnicima.
create table if not exists public.clients (
  id bigint generated always as identity primary key,
  client_code text not null unique,
  full_name text not null,
  service_date date not null,
  service_type text not null,
  price numeric(12,2) not null check (price >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.clients enable row level security;

-- Uklonite stare politike sa istim imenima, ako SQL pokrećete ponovo.
drop policy if exists "Signed-in users can read clients" on public.clients;
drop policy if exists "Signed-in users can add clients" on public.clients;
drop policy if exists "Signed-in users can update clients" on public.clients;
drop policy if exists "Signed-in users can delete clients" on public.clients;

create policy "Signed-in users can read clients"
on public.clients for select to authenticated using (true);

create policy "Signed-in users can add clients"
on public.clients for insert to authenticated with check (true);

create policy "Signed-in users can update clients"
on public.clients for update to authenticated using (true) with check (true);

create policy "Signed-in users can delete clients"
on public.clients for delete to authenticated using (true);

grant select, insert, update, delete on public.clients to authenticated;
grant usage, select on sequence public.clients_id_seq to authenticated;

-- Napomena: napravite naloge za vas i kolegu kroz Supabase Dashboard → Authentication → Users.
-- Nemojte praviti javnu registraciju ako želite da pristup imaju samo odabrani ljudi.
