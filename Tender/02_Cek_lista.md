# Ček-lista — Kotor Walls

Status: ⬜ nije urađeno · 🟡 djelimično · ✅ urađeno · 🔵 van našeg dijela (hardware/edge/fiskal integracije)

> Naš dio posla: **online platforma**. Popunićemo šta već imaš pa ostalo označimo kao TODO.

---

## 1. Vlasništvo i kontrola
- ⬜ 1.1 Dokumentacija + API reference pripremljene za predaju
- ⬜ 1.1 Procedura predaje pristupnih podataka i ovlašćenja
- ⬜ 1.2 Centralizovana baza sa pristupom samo naručiocu/partnerima

## 2. Arhitektura i web platforma
- ⬜ 2.1 Višeslojna arhitektura (frontend / backend / baza)
- ⬜ 2.1 REST API + JSON komunikacija
- ⬜ 2.1 Cloud-spremna baza (skaliranje, pouzdanost)
- ⬜ 2.2 Responzivan frontend
- ⬜ 2.2 Backend sa poslovnom logikom + integracijama
- ⬜ 2.3 Web app za online kupovinu e-karata
- ⬜ 2.4 Tipovi karata: pojedinačna / dnevna / višednevna / sezonska
- ⬜ 2.4 Forma za unos podataka o plaćanju
- ⬜ 2.4 Automatsko izdavanje e-karte sa jedinstvenim QR kodom
- ⬜ 2.4 Logika validacije QR (validna / iskorišćena / nevažeća)
- ⬜ 2.4 Bilježenje svih verifikacija
- ⬜ 2.5 UI optimizovan za PC / tablet / mobilni, bez instalacije
- ⬜ 2.5 Centralna baza karata — dostupna administratorima

## 3. Metode plaćanja
- ⬜ 3.1 Integracija kartičnih brendova (Visa, MC, Amex, Discover, Diners, JCB, UnionPay, lokalni)
- ⬜ 3.2 Apple Pay / Google Pay / Microsoft Pay
- ⬜ 3.2 Express Checkout (Visa/MC/Amex)
- ⬜ 3.2 PayPal
- ⬜ 3.3 Real-time BIN provjera + prikaz brenda/izdavaoca
- ⬜ 3.4 BIN-based popusti/promocije
- ⬜ 3.4 Admin interfejs za BIN pravila

## 4. Sigurnost i usklađenost
- ⬜ 4.1 Neosjetljivi podaci (ID, kanal, cijena, QR) na serverima naručioca
- ⬜ 4.2 Kartični podaci NE prolaze kroz naš server — direktno do gateway-a
- ⬜ 4.2 TLS 1.2+ svuda
- ⬜ 4.2 Gateway sa PCI DSS Level 1 (tokenizacija, enkripcija)
- ⬜ 4.3 PSD2 / SCA / 3D Secure 2.0 na strani gateway-a
- ⬜ 4.3 Prijem statusa transakcije
- ⬜ 4.4 Fraud prevencija (ML risk score, admin pravila, audit log)
- ⬜ 4.5 Korisnici bez login-a — samo kroz proces plaćanja

## 5. REST API, integracije, webhook-ovi
- ⬜ 5.1 Javna API dokumentacija
- ⬜ 5.1 SDK / primjeri (web, mobile)
- ⬜ 5.2 Webhook-ovi: plaćanje / refund / chargeback / ...
- ⬜ 5.2 Sigurnosno potpisivanje webhook-ova
- ⬜ 5.3 API za povlačenje ulaznica (offline štampa / kiosk / blagajna)

## 6. Transakcije i izvještavanje
- ⬜ 6.1 Refundacija (full / djelimična) + notifikacija kupcu
- ⬜ 6.1 Storniranje
- ⬜ 6.2 Chargeback workflow + audit
- ⬜ 6.3 Real-time dashboard
- ⬜ 6.3 Dnevni / mjesečni / godišnji izvještaji
- ⬜ 6.3 Konsolidovani finansijski pregled
- ⬜ 6.3 Izvoz u Excel / PDF
- ⬜ 6.3 Audit log aktivnosti

## 7. Admin dashboard
- ⬜ 7.1 Statistike prodaje + finansija
- ⬜ 7.1 Geografska analiza + pregled kupaca
- ⬜ 7.2 Upravljanje kategorijama / cijenama / kvantitetima (real-time)
- ⬜ 7.3 Audit trail izmjena
- ⬜ 7.4 Pretraga i filtriranje kupaca i transakcija + izvoz
- ⬜ 7.5 Role-based kontrola pristupa

## 8. Kanali prodaje
- ⬜ 8.1 Web kanal
- ⬜ 8.1 Mobilni kanal
- 🔵 8.1 Kiosk kanal (integratori — mi samo API)
- 🔵 8.1 POS / onboard / partneri (Booking.com, GetYourGuide)
- ⬜ 8.1 Sinhronizacija svih kanala u centralu
- ⬜ 8.2 Embed widget za eksterne sajtove
- ⬜ 8.3 Prodaja na licu mjesta + fiskalizacija + QR

## 9. Integracija kioska (API strana)
- ⬜ 9.1 Dokumentovan otvoreni API
- ⬜ 9.2 Endpointi: kupovina / rezervacija / validacija / izdavanje / fiskalizacija / refund / QR
- ⬜ 9.3 Autentikacija + upravljanje sesijama
- ⬜ 9.4 Real-time notifikacije o statusu
- ⬜ 9.5 Potpisani webhook-ovi
- ⬜ 9.6 Testni API + test podaci
- ⬜ 9.7 Endpointi za generisanje/validaciju QR kodova
- ⬜ 9.8 Fiskalni endpointi
- ⬜ 9.9 TLS 1.2+
- ⬜ 9.10 Tokenizacija + PCI DSS
- ⬜ 9.11 Real-time dostupnost / cijene / promocije
- ⬜ 9.12 API key po kiosku + admin
- ⬜ 9.13 Audit log kioska
- ⬜ 9.14 Offline režim + sinhronizacija
- ⬜ 9.15 Tehnička podrška integratorima

## 10. Prolazni mehanizam (edge, CM4 NANO)
- 🔵 10.1 Edge servis na CM4 NANO (Ubuntu 22.04)
- 🔵 10.1 Čitanje QR preko RS-232
- 🔵 10.1 Poziv centralnog validacionog API-ja
- 🔵 10.1 Lokalni cache za offline validaciju
- 🔵 10.1 Relejni izlaz ka Xqiny HQTT2012 barijeri
- 🔵 10.1 Čitanje open/closed/fault signala
- 🔵 10.1 Lokalni audit + sinhronizacija sa centralom
- ⬜ **Naš dio 10.1:** centralni `/validate` endpoint za edge servis
- ⬜ **Naš dio 10.1:** endpoint za sinhronizaciju audit događaja sa edge-a

## 11. Centralizacija
- ⬜ 11.1 Svi kanali pišu u centralnu bazu
- ⬜ 11.1 Finansijski tokovi konsolidovani
- ⬜ 11.2 Zaštita od zloupotreba (dupliranje, replay, ...)

## 12. Održavanje
- ⬜ 12.1 Monitoring performansi (APM / metrics)
- ⬜ 12.1 Deploy bez prekida rada (blue-green / rolling)
- ⬜ 12.1 Procedura sigurnosnih zakrpa

## 13. Isporuka i podrška
- ⬜ 13.1 Finalna dokumentacija + API reference
- ⬜ 13.2 Plan obuke korisnika
- ⬜ 13.2 Kanal prioritetne podrške
- ⬜ 13.3 SLA P1 (odgovor 1h / rješenje 6h)
- ⬜ 13.3 SLA P2 (odgovor 2h / rješenje 12h)
- ⬜ 13.3 SLA P3 (odgovor 3h / rješenje 1 dan)
- ⬜ 13.3 SLA P4 (odgovor 24h / rješenje 2 dana)
