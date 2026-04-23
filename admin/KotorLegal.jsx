// ═══════════════════════════════════════════════════════════════════════════
// Pravni tekstovi za Kotorske zidine — Uslovi, Privatnost, Povrat
// Svi jezici: EN (primarno), ME, DE, RU, ZH
// Adaptirano iz šablona e-tickets.me uz norme Zakona o zaštiti potrošača CG
// i GDPR/Zakona o zaštiti podataka o ličnosti CG.
// ═══════════════════════════════════════════════════════════════════════════

import { useState } from "react";

const C = {
  primary: "#B23A3A", primaryDark: "#8E2A2A",
  bg: "#F7F8FA", surface: "#FFFFFF",
  border: "#E6E8EB", borderSoft: "#F0F1F4",
  text: "#1A1F2B", textMuted: "#4A5363", textSoft: "#6B7684",
};

// ─── Tekstovi ────────────────────────────────────────────────────────────────
export const LEGAL = {
  en: {
    terms: {
      title: "Terms of Use",
      updated: "Last updated: 23 April 2026",
      content: `
## 1. Scope
These Terms of Use govern the purchase and use of tickets for Kotor City Walls (UNESCO World Heritage Site), sold through kotorwalls.com. By completing a purchase you accept these terms.

## 2. Provider
The online sale is operated by the concession holder of Kotor City Walls, acting in accordance with the Law on Consumer Protection of Montenegro ("Službeni list CG"). Contact: support@kotorwalls.com.

## 3. Ticket and QR code
Each ticket carries a unique QR code, digitally signed with HMAC-SHA256. The QR code is required to pass through the automated gates at the entrance to the walls. A single QR code may be used only once.

## 4. Prices and payment
Prices are shown in EUR, VAT included where applicable. Payments are processed by Stripe (PCI DSS Level 1 certified). No card data is stored on our servers. Stripe handles tokenisation, 3D Secure and SCA in accordance with PSD2.

## 5. Validity
Tickets are valid for the period stated at purchase. Tickets are personal, not transferable after use, and cannot be resold without written consent.

## 6. User obligations
The buyer is responsible for the accuracy of provided data (especially email), for keeping the QR code private, and for complying with on-site rules and safety instructions.

## 7. Liability
The provider is not liable for damages caused by force majeure, closure of the walls due to weather, maintenance, or public safety decisions. In case of closure, refund policy in Section 8 applies.

## 8. Refunds and cancellation
See the separate Refund Policy. Under Montenegrin consumer law, for services tied to a specific date (e.g. timed entry), the statutory 14-day right of withdrawal does not apply once the service is rendered or on the day of entry.

## 9. Data protection
Personal data is processed under the Privacy Policy and the Law on Personal Data Protection of Montenegro and, where applicable, GDPR (Regulation (EU) 2016/679).

## 10. Governing law and jurisdiction
These Terms are governed by the laws of Montenegro. Disputes fall under the jurisdiction of the competent court in Kotor.
      `.trim(),
    },
    privacy: {
      title: "Privacy Policy",
      updated: "Last updated: 23 April 2026",
      content: `
## 1. Data controller
The controller of personal data is the operator of Kotor City Walls. Contact: support@kotorwalls.com.

## 2. What we collect
- Name, email, telephone (optional), billing address (optional)
- Purchase data (category, quantity, amount, currency, language)
- Payment metadata (brand, BIN, last 4 digits, issuing bank, country, risk score) — received from Stripe, no full card number is stored
- Technical data (IP address, user agent) for fraud prevention and audit

## 3. Purpose
- Ticket issuance and delivery of QR codes
- Payment processing and fraud prevention (Law on Consumer Protection, Law on Prevention of Money Laundering)
- Fiscal invoice issuance under Montenegrin fiscalisation regulations
- Support and dispute resolution

## 4. Legal basis
Performance of contract (Art. 6(1)(b) GDPR), compliance with legal obligations (Art. 6(1)(c) — fiscal, accounting), and legitimate interests (Art. 6(1)(f) — fraud prevention, security).

## 5. Retention
- Purchase and fiscal data: as required by tax and accounting law (typically 5–10 years)
- Technical logs: up to 12 months
- Marketing data (if consented): until withdrawal of consent

## 6. Sharing
- Stripe (payment processor — USA/EU, adequate safeguards under EU–US Data Privacy Framework)
- Montenegrin fiscal service (ENU)
- Competent authorities where required by law

## 7. Your rights
Access, rectification, erasure, restriction, objection, portability. Contact support@kotorwalls.com. You may lodge a complaint with the Agency for Personal Data Protection of Montenegro.

## 8. Security
TLS 1.2+ in transit, encryption at rest, PCI DSS Level 1 compliant payment processing, access restricted by role-based controls, tamper-evident audit log.
      `.trim(),
    },
    refund: {
      title: "Refund Policy",
      updated: "Last updated: 23 April 2026",
      content: `
## 1. Unused tickets
Tickets that have not been scanned at the entrance may be refunded up to **24 hours before** the date of intended visit. Requests sent to support@kotorwalls.com must include the order reference.

## 2. Used tickets
Tickets that have been scanned (status "used") are non-refundable, except for proven technical failure of our system.

## 3. Closure of the walls
If access is closed on the day of the visit due to weather, safety decisions or force majeure, buyers are entitled to a full refund or a new ticket valid within 6 months.

## 4. Processing time
Approved refunds are returned to the original payment method within 5–10 business days. Stripe processing time may add 2–5 additional business days depending on the issuing bank.

## 5. Chargebacks
Before initiating a chargeback with your bank, please contact us. Unjustified chargebacks may be contested with Stripe's evidence process.

## 6. Montenegrin consumer law
Nothing in this policy limits statutory consumer rights under the Law on Consumer Protection of Montenegro.
      `.trim(),
    },
    distance: {
      title: "Distance Sale Contract",
      updated: "Last updated: 23 April 2026",
      content: `
## 1. Parties
**Seller (Merchant):** Kotor City Walls d.o.o., Stari grad bb, 85330 Kotor, Montenegro. Tax ID (PIB): 03123456. Contact: support@kotorwalls.com.
**Buyer (Consumer):** the natural or legal person completing the purchase through kotorwalls.com under the identity and contact details provided at checkout.

## 2. Subject and conclusion of the contract
This is a contract concluded at a distance, exclusively through means of distance communication (the website kotorwalls.com), without the simultaneous physical presence of the parties, within the meaning of the Consumer Protection Act of Montenegro (Official Gazette of Montenegro No. 12/2026). The subject of the contract is the issuance of a personalised electronic entrance ticket (QR code) for the Kotor City Walls, a leisure service provided on a specific date (timed entry).

The contract is concluded at the moment the Buyer (i) selects tickets, (ii) enters personal data, (iii) confirms the mandatory acknowledgments of the right-of-withdrawal notice and the Terms of Use, Privacy Policy and Refund Policy, and (iv) successfully completes payment. The Seller will send a confirmation and the QR ticket(s) to the email address provided by the Buyer.

## 3. Price, VAT and payment
All prices are shown in EUR on the checkout page and include value added tax (VAT) where applicable. The total amount payable is displayed before payment is confirmed and includes the ticket price and any applicable service fee. Payment is processed by a regulated payment service provider in accordance with PSD2. No card data is stored on the Seller's servers.

## 4. Duration and delivery
This is a one-time contract. The electronic ticket is delivered to the Buyer's email address immediately upon successful payment and, at the latest, within 24 hours. The ticket is valid for the date and conditions stated at purchase.

## 5. Right of withdrawal — IMPORTANT
**The Buyer does not have the statutory 14-day right to unilaterally withdraw from this contract.** In accordance with Article 119, paragraph 1, item 12 of the Consumer Protection Act of Montenegro (Official Gazette No. 12/2026), the right of withdrawal does not apply to contracts for the provision of services related to leisure activities, where the contract provides for a specific date or period of performance. By completing the purchase and confirming the acknowledgment at checkout, the Buyer expressly accepts that this exemption applies.

Exceptions in which a refund is possible:
(a) cancellation or postponement of access to the City Walls by the Seller or the competent authority;
(b) force majeure preventing the Seller from performing the service on the purchased date;
(c) if the Buyer has purchased and activated ticket insurance, under the conditions of that insurance.

## 6. Complaints and dispute resolution
The Buyer may submit complaints in writing to support@kotorwalls.com. The Seller will respond within 8 days in accordance with the Consumer Protection Act of Montenegro. The Buyer also has the right to submit a complaint to the competent Market Inspection and, where applicable, to use alternative dispute resolution mechanisms.

## 7. Personal data
Personal data is processed in accordance with the Seller's Privacy Policy, the Law on Personal Data Protection of Montenegro, and, where applicable, the GDPR (Regulation (EU) 2016/679).

## 8. Governing law and jurisdiction
This contract is governed by the laws of Montenegro. Disputes arising out of or in connection with this contract fall within the jurisdiction of the competent court in Kotor. Nothing in this contract limits mandatory consumer rights granted by Montenegrin law.

## 9. Language
This distance sale contract is drawn up in the English language. Translations of the surrounding Terms, Privacy and Refund policies are provided for informational purposes; in case of discrepancy, the English version of this contract prevails.
      `.trim(),
    },
    labels: {
      terms: "Terms of Use",
      privacy: "Privacy Policy",
      refund: "Refund Policy",
      distance: "Distance Contract",
      acceptPrefix: "By continuing you accept our",
      and: "and",
      close: "Close",
    },
  },

  me: {
    // Uslovi korišćenja samo na engleskom — fallback na LEGAL.en.terms
    privacy: {
      title: "Politika privatnosti",
      updated: "Posljednje ažurirano: 23. april 2026.",
      content: `
## 1. Rukovalac podacima
Rukovalac ličnih podataka je operater Kotorskih zidina. Kontakt: support@kotorwalls.com.

## 2. Podaci koje prikupljamo
- Ime i prezime, email, telefon (opciono), adresa za naplatu (opciono)
- Podaci o kupovini (kategorija, količina, iznos, valuta, jezik)
- Metapodaci plaćanja (brend kartice, BIN, posljednje 4 cifre, banka izdavalac, zemlja, risk score) — dobijeni od Stripe-a, puni broj kartice se ne čuva
- Tehnički podaci (IP adresa, user agent) u svrhu prevencije prevara i audita

## 3. Svrha obrade
- Izdavanje ulaznice i isporuka QR koda
- Obrada plaćanja i sprečavanje prevara (Zakon o zaštiti potrošača, Zakon o sprečavanju pranja novca)
- Izdavanje fiskalnog računa prema propisima CG
- Podrška korisnicima i rješavanje reklamacija

## 4. Pravni osnov
Izvršenje ugovora (čl. 6(1)(b) GDPR), ispunjenje zakonskih obaveza (čl. 6(1)(c) — fiskalno, računovodstveno), legitimni interes (čl. 6(1)(f) — prevencija prevara, bezbjednost).

## 5. Čuvanje
- Podaci o kupovini i fiskalni podaci: u rokovima propisanim poreskim i računovodstvenim propisima (obično 5–10 godina)
- Tehnički logovi: do 12 mjeseci
- Marketinški podaci (uz pristanak): do povlačenja pristanka

## 6. Dijeljenje podataka
- Stripe (procesor plaćanja — SAD/EU, uz adekvatne zaštite iz EU–US Data Privacy Framework-a)
- Poreska uprava Crne Gore (ENU sistem)
- Nadležni organi kada to propis nalaže

## 7. Vaša prava
Uvid, ispravka, brisanje, ograničenje obrade, prigovor, prenosivost. Kontakt: support@kotorwalls.com. Imate pravo podnijeti pritužbu Agenciji za zaštitu ličnih podataka Crne Gore.

## 8. Bezbjednost
TLS 1.2+ u prenosu, enkripcija u mirovanju, PCI DSS Level 1 obrada plaćanja, pristup ograničen ulogama, nepromjenjiv audit log.
      `.trim(),
    },
    refund: {
      title: "Politika povrata ulaznica",
      updated: "Posljednje ažurirano: 23. april 2026.",
      content: `
## 1. Neiskorišćene ulaznice
Ulaznice koje nisu skenirane na ulazu mogu se refundirati najkasnije **24 časa prije** datuma planirane posjete. Zahtjev se šalje na support@kotorwalls.com i mora sadržavati broj narudžbine.

## 2. Iskorišćene ulaznice
Ulaznice sa statusom "iskorišćena" ne podliježu povratu, osim u slučaju dokazanog tehničkog kvara našeg sistema.

## 3. Zatvaranje bedema
Ako je pristup onemogućen na dan posjete usljed vremenskih uslova, odluka o javnoj bezbjednosti ili više sile, kupac ima pravo na puni povrat ili zamjensku ulaznicu sa rokom važenja od 6 mjeseci.

## 4. Vrijeme obrade
Odobreni povrati vraćaju se na isti metod plaćanja u roku od 5–10 radnih dana. Stripe-ovo procesiranje može dodati 2–5 dodatnih radnih dana u zavisnosti od banke izdavaoca.

## 5. Chargeback
Prije iniciranja chargeback-a kod vaše banke, obratite nam se. Neosnovani chargeback-ovi se osporavaju kroz Stripe evidence proces.

## 6. Zakon o zaštiti potrošača CG
Ništa u ovoj politici ne ograničava zakonska prava potrošača prema Zakonu o zaštiti potrošača Crne Gore.
      `.trim(),
    },
    labels: {
      terms: "Uslovi korišćenja",
      privacy: "Politika privatnosti",
      refund: "Povrat ulaznica",
      distance: "Ugovor na daljinu (EN)",
      acceptPrefix: "Nastavkom prihvatate",
      and: "i",
      close: "Zatvori",
    },
  },

  de: {
    privacy: {
      title: "Datenschutzerklärung",
      updated: "Zuletzt aktualisiert: 23. April 2026",
      content: `
## 1. Verantwortlicher
Verantwortlicher für die Datenverarbeitung ist der Betreiber der Stadtmauern von Kotor. Kontakt: support@kotorwalls.com.

## 2. Erhobene Daten
- Name, E-Mail, Telefon (optional), Rechnungsadresse (optional)
- Kaufdaten (Kategorie, Menge, Betrag, Währung, Sprache)
- Zahlungsmetadaten (Marke, BIN, letzte 4 Ziffern, Ausgabebank, Land, Risikobewertung) — von Stripe bereitgestellt; vollständige Kartennummer wird nicht gespeichert
- Technische Daten (IP-Adresse, User-Agent) zur Betrugsprävention und Prüfung

## 3. Zweck
- Ausstellung des Tickets und Zustellung des QR-Codes
- Zahlungsabwicklung und Betrugsprävention (Verbraucherschutz-, Geldwäschegesetz)
- Ausstellung fiskalischer Rechnungen (CG-Fiskalvorschriften)
- Support und Streitbeilegung

## 4. Rechtsgrundlage
Vertragserfüllung (Art. 6(1)(b) DSGVO), rechtliche Verpflichtungen (Art. 6(1)(c)), berechtigte Interessen (Art. 6(1)(f)).

## 5. Aufbewahrung
- Kauf- und Fiskaldaten: gemäß Steuer- und Buchhaltungsrecht (in der Regel 5–10 Jahre)
- Technische Protokolle: bis zu 12 Monate
- Marketing (mit Einwilligung): bis zum Widerruf

## 6. Weitergabe
- Stripe (Zahlungsabwickler — USA/EU, EU–US Data Privacy Framework)
- Steuerbehörde Montenegro (ENU)
- Zuständige Behörden bei gesetzlicher Verpflichtung

## 7. Ihre Rechte
Auskunft, Berichtigung, Löschung, Einschränkung, Widerspruch, Übertragbarkeit. Kontakt: support@kotorwalls.com. Beschwerderecht bei der montenegrinischen Datenschutzbehörde.

## 8. Sicherheit
TLS 1.2+, Verschlüsselung ruhender Daten, PCI DSS Level 1 Zahlungsabwicklung, rollenbasierter Zugriff, manipulationssicheres Audit-Log.
      `.trim(),
    },
    refund: {
      title: "Erstattungsrichtlinie",
      updated: "Zuletzt aktualisiert: 23. April 2026",
      content: `
## 1. Ungenutzte Tickets
Tickets, die am Eingang nicht gescannt wurden, können bis **24 Stunden vor** dem geplanten Besuchsdatum erstattet werden. Anfragen an support@kotorwalls.com müssen die Bestellnummer enthalten.

## 2. Genutzte Tickets
Tickets mit Status „benutzt" sind nicht erstattungsfähig, außer bei nachgewiesenem technischem Fehler unseres Systems.

## 3. Schließung der Mauern
Bei Schließung am Besuchstag wegen Wetter, Sicherheitsentscheidung oder höherer Gewalt besteht Anspruch auf volle Erstattung oder Ersatzticket (gültig 6 Monate).

## 4. Bearbeitungszeit
Genehmigte Rückerstattungen werden innerhalb von 5–10 Werktagen auf die ursprüngliche Zahlungsmethode zurückgebucht. Die Stripe-Verarbeitung kann je nach Bank weitere 2–5 Werktage hinzufügen.

## 5. Chargebacks
Vor einem Chargeback bei Ihrer Bank kontaktieren Sie bitte uns. Unbegründete Chargebacks werden mit Stripe-Nachweisverfahren bestritten.

## 6. Verbraucherrecht
Diese Richtlinie schränkt keine gesetzlichen Verbraucherrechte nach montenegrinischem Recht ein.
      `.trim(),
    },
    labels: {
      terms: "Nutzungsbedingungen",
      privacy: "Datenschutz",
      refund: "Erstattung",
      distance: "Fernabsatzvertrag (EN)",
      acceptPrefix: "Mit dem Fortfahren akzeptieren Sie",
      and: "und",
      close: "Schließen",
    },
  },

  ru: {
    privacy: {
      title: "Политика конфиденциальности",
      updated: "Последнее обновление: 23 апреля 2026 г.",
      content: `
## 1. Контролёр данных
Контролёром персональных данных является оператор Которских стен. Контакт: support@kotorwalls.com.

## 2. Что мы собираем
- Имя, email, телефон (необязательно), платёжный адрес (необязательно)
- Данные о покупке (категория, количество, сумма, валюта, язык)
- Метаданные платежа (бренд, BIN, последние 4 цифры, банк-эмитент, страна, оценка риска) — от Stripe; полный номер карты не хранится
- Технические данные (IP, user agent) для предотвращения мошенничества и аудита

## 3. Цели
- Выпуск билета и доставка QR-кода
- Обработка платежей и предотвращение мошенничества
- Выставление фискальных счетов (правила Черногории)
- Поддержка и разрешение споров

## 4. Правовая основа
Исполнение договора (ст. 6(1)(b) GDPR), соблюдение закона (ст. 6(1)(c)), законные интересы (ст. 6(1)(f)).

## 5. Хранение
- Данные о покупке и фискальные данные: в сроки, установленные налоговым и бухгалтерским законодательством (обычно 5–10 лет)
- Технические журналы: до 12 месяцев
- Маркетинг (с согласия): до отзыва согласия

## 6. Передача
- Stripe (обработчик платежей — США/ЕС, EU–US Data Privacy Framework)
- Налоговая служба Черногории (ENU)
- Компетентные органы по требованию закона

## 7. Ваши права
Доступ, исправление, удаление, ограничение, возражение, переносимость. Контакт: support@kotorwalls.com. Право жалобы в Агентство защиты персональных данных Черногории.

## 8. Безопасность
TLS 1.2+, шифрование хранимых данных, PCI DSS Level 1, ролевой доступ, защищённый аудит-журнал.
      `.trim(),
    },
    refund: {
      title: "Политика возврата",
      updated: "Последнее обновление: 23 апреля 2026 г.",
      content: `
## 1. Неиспользованные билеты
Билеты, не отсканированные на входе, могут быть возвращены не позднее чем **за 24 часа до** планируемой даты посещения. Запросы на support@kotorwalls.com с номером заказа.

## 2. Использованные билеты
Билеты со статусом «использован» возврату не подлежат, кроме случаев доказанной технической неисправности нашей системы.

## 3. Закрытие стен
Если доступ закрыт в день посещения из-за погоды, решений безопасности или форс-мажора — полный возврат или замена билета (6 месяцев).

## 4. Сроки обработки
Одобренные возвраты возвращаются на исходный способ оплаты в течение 5–10 рабочих дней. Stripe может добавить 2–5 дополнительных дней.

## 5. Chargeback
Перед инициацией chargeback в банке — свяжитесь с нами. Необоснованные chargeback оспариваются через процесс Stripe.

## 6. Законодательство Черногории
Ничто в настоящей политике не ограничивает законных прав потребителей.
      `.trim(),
    },
    labels: {
      terms: "Условия",
      privacy: "Конфиденциальность",
      refund: "Возврат",
      distance: "Договор дист. продажи (EN)",
      acceptPrefix: "Продолжая, вы принимаете",
      and: "и",
      close: "Закрыть",
    },
  },

  zh: {
    privacy: {
      title: "隐私政策",
      updated: "最后更新：2026年4月23日",
      content: `
## 1. 数据控制者
个人数据的控制者为科托尔城墙运营方。联系方式：support@kotorwalls.com。

## 2. 收集的数据
- 姓名、邮箱、电话（可选）、账单地址（可选）
- 购买数据（类别、数量、金额、货币、语言）
- 支付元数据（卡组织、BIN、卡号后4位、发卡行、国家、风险评分）——来自 Stripe，不存储完整卡号
- 技术数据（IP、User-Agent）用于防欺诈与审计

## 3. 目的
- 出票并发送二维码
- 支付处理与防欺诈
- 按黑山规定开具电子发票
- 客户支持与争议处理

## 4. 法律依据
履行合同（GDPR 第6(1)(b)条）、遵守法定义务（第6(1)(c)条）、合法利益（第6(1)(f)条）。

## 5. 保留期
- 购买与税务数据：按税务和会计法规（通常5–10年）
- 技术日志：最长12个月
- 营销（经同意）：至撤回同意

## 6. 共享
- Stripe（支付处理商，美/欧，EU–US Data Privacy Framework）
- 黑山税务局（ENU）
- 法律要求的主管机关

## 7. 您的权利
访问、更正、删除、限制、反对、可携带。联系 support@kotorwalls.com。可向黑山个人数据保护局投诉。

## 8. 安全
TLS 1.2+ 传输加密，静态数据加密，PCI DSS Level 1 支付处理，基于角色的访问控制，防篡改审计日志。
      `.trim(),
    },
    refund: {
      title: "退款政策",
      updated: "最后更新：2026年4月23日",
      content: `
## 1. 未使用的门票
未在入口扫描的门票，可在计划到访日期**前24小时**申请退款。请发送至 support@kotorwalls.com，并注明订单号。

## 2. 已使用的门票
状态为"已使用"的门票不予退款，除非证明系统发生技术故障。

## 3. 城墙关闭
若到访当日因天气、安全决定或不可抗力关闭，可全额退款或换取有效期6个月的门票。

## 4. 处理时间
已批准的退款将在5–10个工作日内退回原支付方式。Stripe 处理时间可能额外增加2–5个工作日，取决于发卡行。

## 5. 拒付（Chargeback）
向银行发起拒付前，请先联系我们。无理由拒付将通过 Stripe 证据流程进行抗辩。

## 6. 消费者法
本政策不限制黑山《消费者保护法》赋予的法定权利。
      `.trim(),
    },
    labels: {
      terms: "使用条款",
      privacy: "隐私政策",
      refund: "退款政策",
      distance: "远程销售合同 (EN)",
      acceptPrefix: "继续即表示您接受",
      and: "和",
      close: "关闭",
    },
  },
};

// ─── Jednostavan markdown → HTML (samo ## naslovi, prazne linije, bold) ─────
function renderMarkdown(md) {
  const lines = md.split("\n");
  const out = [];
  let paragraph = [];
  const flushP = (i) => {
    if (paragraph.length) {
      out.push(
        <p key={`p-${i}`} style={{ margin: "0 0 12px", lineHeight: 1.7, color: C.textMuted, fontSize: 14 }}>
          {paragraph.join(" ")}
        </p>
      );
      paragraph = [];
    }
  };
  lines.forEach((line, i) => {
    if (line.startsWith("## ")) {
      flushP(i);
      out.push(
        <h3 key={`h-${i}`} style={{ fontSize: 15, fontWeight: 700, color: C.text, marginTop: 22, marginBottom: 10 }}>
          {line.replace(/^##\s*/, "")}
        </h3>
      );
    } else if (line.startsWith("- ")) {
      flushP(i);
      out.push(
        <li key={`li-${i}`} style={{ marginBottom: 6, lineHeight: 1.7, color: C.textMuted, fontSize: 14 }}>
          {line.replace(/^-\s*/, "")}
        </li>
      );
    } else if (line.trim() === "") {
      flushP(i);
    } else {
      paragraph.push(line.trim());
    }
  });
  flushP("end");
  return out;
}

// ─── Modal ───────────────────────────────────────────────────────────────────
export function LegalModal({ doc, onClose }) {
  if (!doc) return null;
  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(26,31,43,0.5)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 10000, padding: 16,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: C.surface, borderRadius: 14,
        width: "100%", maxWidth: 640, maxHeight: "85vh",
        display: "flex", flexDirection: "column",
        boxShadow: "0 20px 60px rgba(26,31,43,0.3)",
      }}>
        <div style={{
          padding: "18px 22px", borderBottom: `1px solid ${C.borderSoft}`,
          display: "flex", justifyContent: "space-between", alignItems: "flex-start",
        }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: C.text, letterSpacing: "-0.2px" }}>{doc.title}</div>
            <div style={{ fontSize: 11, color: C.textSoft, marginTop: 3 }}>{doc.updated}</div>
          </div>
          <button onClick={onClose} style={{
            width: 32, height: 32, border: `1px solid ${C.border}`,
            background: C.bg, borderRadius: 8, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: C.textMuted, fontSize: 18, lineHeight: 1,
          }}>×</button>
        </div>
        <div style={{ padding: "4px 22px 22px", overflowY: "auto" }}>
          {renderMarkdown(doc.content)}
        </div>
      </div>
    </div>
  );
}

// ─── Linija sa linkovima + pristanak ────────────────────────────────────────
export function TermsLinks({ lang, showCheckbox, accepted, onAccept }) {
  const L = LEGAL[lang]?.labels ?? LEGAL.en.labels;
  const [openDoc, setOpenDoc] = useState(null);

  const linkStyle = {
    color: C.primary, textDecoration: "underline", textUnderlineOffset: 2,
    fontSize: 12, cursor: "pointer", background: "none", border: "none",
    padding: 0, fontFamily: "inherit", fontWeight: 600,
  };

  const open = (key) => () => setOpenDoc(LEGAL[lang]?.[key] ?? LEGAL.en[key]);

  return (
    <>
      <div style={{ fontSize: 12, color: C.textSoft, lineHeight: 1.6, textAlign: "center" }}>
        {showCheckbox ? (
          <label style={{ display: "inline-flex", alignItems: "flex-start", gap: 8, cursor: "pointer", textAlign: "left" }}>
            <input
              type="checkbox"
              checked={!!accepted}
              onChange={e => onAccept?.(e.target.checked)}
              style={{ marginTop: 3, accentColor: C.primary, width: 14, height: 14 }}
            />
            <span>
              {L.acceptPrefix}{" "}
              <button type="button" onClick={open("terms")}  style={linkStyle}>{L.terms}</button>,{" "}
              <button type="button" onClick={open("privacy")} style={linkStyle}>{L.privacy}</button> {L.and}{" "}
              <button type="button" onClick={open("refund")}  style={linkStyle}>{L.refund}</button>.
            </span>
          </label>
        ) : (
          <>
            <button type="button" onClick={open("terms")}  style={linkStyle}>{L.terms}</button>{" · "}
            <button type="button" onClick={open("privacy")} style={linkStyle}>{L.privacy}</button>{" · "}
            <button type="button" onClick={open("refund")}  style={linkStyle}>{L.refund}</button>{L.distance ? <>{" · "}<button type="button" onClick={open("distance")} style={linkStyle}>{L.distance}</button></> : null}
          </>
        )}
      </div>
      <LegalModal doc={openDoc} onClose={() => setOpenDoc(null)} />
    </>
  );
}
