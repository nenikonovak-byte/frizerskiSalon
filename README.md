# Studio — evidencija klijenata frizerskog salona

Aplikacija je napravljena u HTML-u, CSS-u i JavaScript-u. GitHub Pages hostuje izgled aplikacije, a Supabase čuva zapise u zajedničkoj online bazi. Možete da se prijavite sa dva odvojena naloga i da oboje vidite iste podatke.

## Funkcije
- Dodavanje klijenta: ID, ime i prezime, datum, vrsta usluge i cena.
- Izmena i brisanje zapisa.
- Pretraga po ID-u, imenu i usluzi, kao i filter usluge.
- Broj klijenata, broj usluga ovog meseca i promet za tekući mesec.
- Prijava korisnika, responsivan prikaz za mobilni telefon i računar.
- Podaci se čuvaju u online bazi, a ne samo u pregledaču.

## 1. Napravite Supabase bazu
1. Otvorite https://supabase.com/ i napravite projekat.
2. U projektu otvorite **SQL Editor → New query**.
3. Kopirajte ceo sadržaj fajla `schema.sql`, nalepite ga i pritisnite **Run**.
4. Otvorite **Project Settings → API** (u nekim prikazima **Connect**) i kopirajte **Project URL** i **publishable key** (ili stariji `anon` public key).
5. Otvorite `config.js` i zamenite:
   - `UNESITE_SUPABASE_PROJECT_URL` adresom projekta
   - `UNESITE_SUPABASE_PUBLISHABLE_KEY` javnim/publishable ključem projekta

**Nikada ne stavljajte `service_role` ili `secret` ključ u `config.js` ili u GitHub.** Aplikacija koristi samo javni ključ uz pravila RLS i prijavu korisnika.

## 2. Napravite naloge za sebe i kolegu
1. U Supabase Dashboard-u otvorite **Authentication → Users**.
2. Izaberite **Add user** / **Create new user** i napravite nalog za sebe.
3. Ponovite za kolegu, koristeći njegovu email adresu i početnu lozinku.
4. Po želji isključite javnu registraciju u Authentication podešavanjima. Nemojte deliti jedan nalog i lozinku.
5. Obojica se prijavljujete na istu objavljenu adresu aplikacije, svako svojim nalogom.

Ako je uključena potvrda email adrese, nalog mora biti potvrđen prema podešavanjima projekta.

## 3. Postavite aplikaciju na GitHub Pages
1. Na GitHub-u napravite novi repository, na primer `frizerska-evidencija`.
2. Dodajte fajlove `index.html`, `style.css`, `app.js`, `config.js`, `schema.sql` i `README.md` u glavni direktorijum repozitorijuma.
3. Otvorite **Settings → Pages**.
4. U odeljku **Build and deployment** izaberite **Deploy from a branch**.
5. Izaberite granu `main` i folder `/(root)`, pa kliknite **Save**.
6. Sačekajte da GitHub objavi sajt i otvorite prikazanu adresu. Pošaljite tu adresu kolegi.

GitHub Pages objavljuje statičke fajlove, dok se podaci čuvaju u Supabase bazi.

## Važne napomene
- ID klijenta mora biti jedinstven. Možete da koristite, na primer, `1001`, `1002` ili oznake po vašem sistemu.
- Svaki red u tabeli predstavlja jednu posetu/uslugu. Ako isti klijent dođe više puta, unesite novu posetu sa novim ID-em zapisa klijenta (polje „ID klijenta“ ovde služi kao jedinstvena oznaka zapisa). Ako želite odvojeno trajni ID osobe i više poseta, strukturu baze treba proširiti.
- Brisanje je trajno i traži potvrdu.
- Zbog zaštite podataka, delite link samo sa ljudima kojima je pristup potreban. Prijava je obavezna; pravila baze dozvoljavaju čitanje, dodavanje, izmenu i brisanje samo prijavljenim korisnicima.
- Ovo je osnovna evidencija, bez rezervnih kopija. Za poslovnu upotrebu povremeno izvezite podatke/napravite backup baze.
