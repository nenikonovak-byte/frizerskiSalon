-- Pokrenite ovo u Supabase Dashboard → SQL Editor → New query.
-- Skripta je bezbedna za ponovno pokretanje: dodaje kolone postojećoj tabeli.
-- Evidencija je dostupna samo prijavljenim korisnicima.
create table if not exists public.clients (
  id bigint generated always as identity primary key,
  client_code text not null unique,
  full_name text not null,
  service_date date not null,
  service_time time,
  service_type text not null,
  price numeric(12,2) not null check (price >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  created_by_email text,
  assigned_to text check (assigned_to in ('Seka', 'Jeca'))
);

-- Nadogradnja postojeće baze: stare zapise ne briše i ne menja.
alter table public.clients add column if not exists service_time time;
alter table public.clients add column if not exists created_by uuid references auth.users(id) on delete set null;
alter table public.clients add column if not exists created_by_email text;
alter table public.clients add column if not exists assigned_to text;

-- Autor se automatski upisuje iz trenutno prijavljenog Supabase naloga.
-- Pri izmeni zapisa autor se čuva i ne menja se na osobu koja ga uređuje.
create or replace function public.set_client_audit_fields()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    new.created_by := auth.uid();
    new.created_by_email := coalesce(auth.jwt() ->> 'email', 'Nepoznat korisnik');
  elsif tg_op = 'UPDATE' then
    new.created_by := old.created_by;
    new.created_by_email := old.created_by_email;
  end if;
  return new;
end;
$$;

drop trigger if exists clients_set_audit_fields on public.clients;
create trigger clients_set_audit_fields
before insert or update on public.clients
for each row execute function public.set_client_audit_fields();

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
