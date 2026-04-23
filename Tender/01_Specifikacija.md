# Predmet nabavke — Kotor Walls (Bedemi)

Implementacija, isporuka i održavanje softverskog rješenja za online naplatu i prodaju ulaznica na bedemima. Višekanalno, sigurno, transparentno i efikasno upravljanje prodajom i naplatom. Kupovina digitalnih ulaznica + kontrola prolaza (tripod/barijera), fiskalizacija, bezbjedno plaćanje i administracija prodaje.

---

## 1. Vlasništvo i kontrola
- **1.1** Dokumentacija i API reference predati naručiocu po završetku implementacije. Predati pristupne podatke i ovlašćenja — puna nezavisnost naručioca.
- **1.2** Puna kontrola nad generisanjem, evidencijom i validacijom ulaznica. Centralizovana baza — pristup samo naručilac ili ovlašćeni partneri.

## 2. Funkcionalni zahtjevi i karakteristike
- **2.1** Moderna web arhitektura, razdvajanje slojeva (prezentacija / poslovna logika / baza). Svi moderni browseri + mobilni. REST API + JSON. Brza baza, cloud skaliranje.
- **2.2** Višeslojna web aplikacija. Responzivan frontend, backend sa poslovnom logikom, platnim integracijama i kontrolerom prolaza.
- **2.3** Web app za jednostavnu online kupovinu e-karata.
- **2.4** Tipovi karata: pojedinačna, dnevna, višednevna, sezonska. Unos podataka za plaćanje. Automatsko izdavanje e-karte sa jedinstvenim QR kodom. QR otvara prolazni mehanizam (tripod/barijera) na validaciju. Nevažeća/iskorišćena → zatvoreno + poruka o grešci. Sve verifikacije se bilježe.
- **2.5** Intuitivan UI — PC, tablet, mobilni. Bez dodatnih instalacija. Centralna baza, dostupna administratorima.

## 3. Podržane metode plaćanja
- **3.1** Visa, Mastercard, Amex, Discover, Diners, JCB, UnionPay, lokalni brendovi. Bez geografskih/valutnih ograničenja.
- **3.2** Digitalni novčanici: Apple Pay, Google Pay, Microsoft Pay, Visa/Mastercard/Amex Express Checkout, PayPal, ostale globalne i lokalne opcije.
- **3.3** Real-time BIN provjera, identifikacija brenda i izdavaoca, prikaz korisniku.
- **3.4** Popusti/promocije na osnovu BIN broja. Admin interfejs za upravljanje pravilima.

## 4. Sigurnost i usklađenost
- **4.1** Neosjetljivi podaci (ID ulaznice, kanal plaćanja, cijena, QR, ...) na serverima naručioca.
- **4.2** Osjetljivi podaci o karticama (broj, CVV, datum isteka, auth) NE čuvaju se i NE obrađuju na serverima naručioca. Prenose se direktno TLS 1.2+ kanalom do banke/gateway-a — PCI DSS Level 1, tokenizacija, enkripcija.
- **4.3** PSD2 i SCA. 3D Secure 2.0 i procjena izuzetaka — na strani banke/gateway-a. Sistem naručioca inicira i prima status.
- **4.4** Prevencija prevara — ML procjena rizika, admin pravila, audit log. Samo na osnovu neosjetljivih podataka i statusa iz gateway-a.
- **4.5** Korisnici NEMAJU login na sistem naručioca. Podaci se obrađuju samo kroz proces plaćanja.

## 5. REST API, integracije, webhook-ovi
- **5.1** RESTful + JSON, dokumentacija, SDK primjeri, podrška za web/mobile.
- **5.2** Webhook obavještenja (plaćanje, refund, chargeback...) — potpisane i autentikovane.
- **5.3** API za povlačenje podataka o ulaznicama — offline štampa, kiosci, blagajne.

## 6. Upravljanje transakcijama i izvještavanje
- **6.1** Refundacije i storniranje (potpuno/djelimično), evidencija + notifikacija.
- **6.2** Chargeback praćenje i upravljanje, audit procesa i statusa.
- **6.3** Real-time dashboard, dnevni/mjesečni/godišnji izvještaji, konsolidovani finansijski pregled, ad-hoc izvoz (Excel, PDF), audit log.

## 7. Dashboard i administracija
- **7.1** Centralizovan dashboard — prodaja, finansije, geografska analiza, kupci.
- **7.2** Samostalno upravljanje kategorijama karata, cijenama, kvantitetima (real-time).
- **7.3** Audit trail svih izmjena.
- **7.4** Napredna pretraga i filtriranje kupaca/transakcija + izvoz.
- **7.5** Kontrola pristupa prema korisničkim pravima.

## 8. Kanali prodaje
- **8.1** Web, mobile, kiosci, POS, onboard (kruzeri/hoteli/prevoznici), partnerske platforme (Booking.com, GetYourGuide). Sinhronizacija sa centralom.
- **8.2** Widgeti — integracija u postojeće stranice i aplikacije.
- **8.3** Prodaja na licu mjesta — fiskalizacija + QR.

## 9. Integracija samouslužnih kioska
- **9.1** Otvoreni i dokumentovan API. Tehnička dokumentacija + podrška integratorima. Bez izmjena centrale — samo konfiguracija.
- **9.2** REST endpointi: kupovina, rezervacija, validacija, izdavanje, fiskalizacija, refundacija, QR.
- **9.3** API za autentikaciju, sesije, sigurnu komunikaciju.
- **9.4** Real-time notifikacije o statusu transakcije, ulaznicama, greškama.
- **9.5** Potpisani i autentikovani webhook-ovi.
- **9.6** Testni API + testni podaci.
- **9.7** Endpointi za generisanje i validaciju QR kodova.
- **9.8** Podrška fiskalnim zahtjevima.
- **9.9** TLS 1.2+ za svu komunikaciju.
- **9.10** Tokenizacija kartičnih podataka + PCI DSS usklađenost.
- **9.11** Ažurni podaci o dostupnosti, cijenama, promocijama — u svakom trenutku.
- **9.12** Admin i kontrola pristupa — svaki kiosk svoj API key / identifikacija.
- **9.13** Audit log aktivnosti kioska.
- **9.14** Offline režim + sinhronizacija pri povezivanju.
- **9.15** Tehnička podrška tokom razvoja i integracije.

## 10. Komunikacija sa prolaznim mehanizmom
- **10.1** Povezivanje sa tripodom/barijerom preko relejnog interfejsa / digitalnog izlaza. Signal za otvaranje na konfigurabilan interval, auto-zaključavanje. Svi pokušaji se bilježe.
- **Postojeća oprema:** QR čitač (RS-232), trokraka barijera **Xqiny HQTT2012**, centralna jedinica **CM4 NANO (CM4101008)** sa Ubuntu 22.04.
- **Obaveze ponuđača — edge servis na CM4 NANO:**
  - čita QR preko RS-232
  - poziva centralni API za validaciju (ili lokalni cache ako je offline)
  - aktivira relejni izlaz za Xqiny barijeru — konfigurabilan interval
  - čita i bilježi povratne signale (open/closed/fault)
  - lokalno bilježi audit događaje i sinhronizuje sa centralom

## 11. Centralizacija
- **11.1** Svi procesi prodaje u centralnoj bazi. Jasni finansijski tokovi i izvještaji po svim kanalima.
- **11.2** Transparentnost, kontrola, zaštita od zloupotreba.

## 12. Održavanje i ažuriranje
- **12.1** Jednostavno održavanje, nadzor performansi, dalji razvoj bez prekida rada. Sigurnosne zakrpe i nadogradnje po preporukama proizvođača.

## 13. Ostalo
- **13.1** Dokumentacija i API reference — po završetku.
- **13.2** Obuka + prioritetna tehnička podrška, opcija dodatnih sati.
- **13.3** SLA:
  - **P1** sistem ne radi — odgovor 1h, rješenje 6h
  - **P2** glavna funkcija ne radi — odgovor 2h, rješenje 12h
  - **P3** manji problem — odgovor 3h, rješenje 1 dan
  - **P4** upit — odgovor 24h, rješenje 2 dana
