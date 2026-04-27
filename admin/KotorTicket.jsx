import { useState, useEffect, useMemo } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { callEdge, rest, getStripePublishableKey, getStripeMode } from "./supabaseClient.js";
import { TermsLinks } from "./KotorLegal.jsx";

// ─── Kotor paleta ────────────────────────────────────────────────────────────
const C = {
  primary:     "#B23A3A", primaryDark: "#8E2A2A", primarySoft: "#FBE9E9",
  gold:        "#C9A227", goldDark:    "#A8841C", goldSoft:    "#FBF2D6",
  bg:          "#F7F8FA", surface:     "#FFFFFF",
  border:      "#E6E8EB", borderSoft:  "#F0F1F4",
  text:        "#1A1F2B", textMuted:   "#4A5363", textSoft: "#6B7684", textFaint: "#9AA3B2",
};

// stripePromise se re-kreira po mode-u (test/live) — cache po mode-u
const stripePromiseCache = {};
function getStripePromise() {
  const mode = getStripeMode();
  if (!stripePromiseCache[mode]) {
    const key = getStripePublishableKey();
    stripePromiseCache[mode] = key ? loadStripe(key) : Promise.resolve(null);
  }
  return stripePromiseCache[mode];
}

// ─── Prevodi ─────────────────────────────────────────────────────────────────
const T = {
  en: {
    title: "Kotor City Walls", subtitle: "Purchase entrance tickets",
    desc: "The fortifications of the historic city of Kotor, with ramparts rising to the fortress of San Giovanni, are part of the Venetian Defense System inscribed on the UNESCO World Heritage List. Kotor combines the heritage of Illyria, Byzantium, Venice and Austria, making it one of the most authentic cultural gems of the Adriatic.",
    selectTickets: "Select tickets",
    total: "Total", continue: "Continue to details →",
    back: "Back",
    details: "Your details",
    detailsSub: "We'll send your QR tickets to your email.",
    name: "Full name", email: "Email", phone: "Phone",
    address: "Address", city: "City", zip: "Postal code", country: "Country",
    payNow: "Pay now", paySecure: "Secure payment",
    success: "Payment successful",
    successSub: "Your tickets have been sent to your email.",
    viewTickets: "View tickets",
    newOrder: "← New order",
    processing: "Processing payment…",
    required: "Required",
    fillAll: "Please fill in the required fields",
    termsAck: "By continuing you accept our terms of service.",
    withdrawTitle: "Important notice on the right of withdrawal",
    withdrawBody: "In accordance with Article 119, paragraph 1, item 12 of the Consumer Protection Act of Montenegro (Official Gazette No. 12/2026), for leisure services provided on a specific date you do not have the right to unilaterally withdraw from this distance contract after purchase. Tickets cannot be returned or exchanged at the customer's initiative, except in the case of cancellation or postponement of the event, or if ticket insurance has been activated.",
    withdrawAck: "I understand that I do not have the right to unilaterally withdraw from this contract, as it concerns a leisure service on a specific date (Art. 119 para. 1 item 12 of the Consumer Protection Act, Official Gazette of Montenegro No. 12/2026).",
  },
  me: {
    title: "Kotorske zidine", subtitle: "Kupovina ulaznica",
    desc: "Utvrđenja istorijskog grada Kotora, sa bedemima koji se uzdižu do tvrđave Sv. Ivan, dio su Venecijanskog odbrambenog sistema upisanog u UNESCO Listu svjetske baštine. Kotor spaja nasljeđe Ilirije, Vizantije, Venecije i Austrije, što ga čini jednim od najautentičnijih kulturnih dragulja Jadrana.",
    selectTickets: "Izaberi karte",
    total: "Ukupno", continue: "Nastavi na podatke →",
    back: "Nazad",
    details: "Tvoji podaci",
    detailsSub: "Poslaćemo QR karte na tvoju email adresu.",
    name: "Ime i prezime", email: "Email", phone: "Telefon",
    address: "Adresa", city: "Grad", zip: "Poštanski broj", country: "Država",
    payNow: "Plati sada", paySecure: "Sigurno plaćanje",
    success: "Plaćanje uspješno",
    successSub: "Karte su poslate na tvoju email adresu.",
    viewTickets: "Prikaži karte",
    newOrder: "← Nova narudžbina",
    processing: "Obrada plaćanja…",
    required: "Obavezno",
    fillAll: "Popuni obavezna polja",
    termsAck: "Nastavkom prihvataš uslove korišćenja.",
    withdrawTitle: "Važna napomena o pravu na raskid",
    withdrawBody: "U skladu sa članom 119 stav 1 tačka 12 Zakona o zaštiti potrošača CG (Sl. list br. 12/2026), za usluge slobodnog vremena koje se pružaju određenog datuma nemate pravo na jednostrani raskid ugovora nakon kupovine. Karte se ne mogu vratiti ni zamijeniti na ličnu inicijativu, osim u slučaju otkazivanja/odlaganja događaja ili ako je aktivirano osiguranje ulaznica.",
    withdrawAck: "Razumijem da nemam pravo na jednostrani raskid ovog ugovora jer se radi o usluzi slobodnog vremena određenog datuma (čl. 119 st. 1 t. 12 Zakona o zaštiti potrošača, Sl. list CG, br. 12/2026).",
  },
  de: {
    title: "Stadtmauern von Kotor", subtitle: "Eintrittskarten kaufen",
    desc: "Die Befestigungsanlagen der Altstadt von Kotor, deren Mauern bis zur Festung San Giovanni hinaufreichen, sind Teil des Venezianischen Verteidigungssystems, das in die UNESCO-Welterbeliste eingetragen ist. Kotor vereint das Erbe Illyriens, Byzanz', Venedigs und Österreichs und zählt damit zu den authentischsten Kulturjuwelen der Adria.",
    selectTickets: "Tickets auswählen",
    total: "Gesamt", continue: "Weiter zu Details →",
    back: "Zurück",
    details: "Ihre Angaben",
    detailsSub: "Wir senden Ihre QR-Tickets an Ihre E-Mail.",
    name: "Vollständiger Name", email: "E-Mail", phone: "Telefon",
    address: "Adresse", city: "Stadt", zip: "PLZ", country: "Land",
    payNow: "Jetzt bezahlen", paySecure: "Sichere Zahlung",
    success: "Zahlung erfolgreich",
    successSub: "Tickets an Ihre E-Mail gesendet.",
    viewTickets: "Tickets anzeigen",
    newOrder: "← Neue Bestellung",
    processing: "Zahlung wird verarbeitet…",
    required: "Pflichtfeld",
    fillAll: "Bitte Pflichtfelder ausfüllen",
    termsAck: "Mit dem Fortfahren akzeptieren Sie unsere Bedingungen.",
    withdrawTitle: "Wichtiger Hinweis zum Widerrufsrecht",
    withdrawBody: "Gemäß Art. 119 Abs. 1 Ziff. 12 des Verbraucherschutzgesetzes Montenegros (Amtsblatt Nr. 12/2026) haben Sie bei Freizeitdienstleistungen, die zu einem bestimmten Datum erbracht werden, nach dem Kauf kein einseitiges Widerrufsrecht. Tickets können nicht auf eigene Initiative zurückgegeben oder umgetauscht werden, außer bei Absage/Verschiebung der Veranstaltung oder wenn eine Ticketversicherung aktiviert wurde.",
    withdrawAck: "Ich verstehe, dass ich für diesen Vertrag kein einseitiges Widerrufsrecht habe, da es sich um eine Freizeitdienstleistung zu einem bestimmten Datum handelt (Art. 119 Abs. 1 Ziff. 12 VSchG, Amtsblatt Montenegro Nr. 12/2026).",
  },
  ru: {
    title: "Городские стены Котора", subtitle: "Купить входные билеты",
    desc: "Укрепления исторического города Котор со стенами, поднимающимися к крепости Сан-Джованни, входят в Венецианскую оборонительную систему, включённую в Список всемирного наследия ЮНЕСКО. Котор сочетает наследие Иллирии, Византии, Венеции и Австрии, что делает его одной из самых аутентичных культурных жемчужин Адриатики.",
    selectTickets: "Выбор билетов",
    total: "Итого", continue: "Далее к данным →",
    back: "Назад",
    details: "Ваши данные",
    detailsSub: "Билеты с QR-кодом придут на вашу почту.",
    name: "Полное имя", email: "Эл. почта", phone: "Телефон",
    address: "Адрес", city: "Город", zip: "Индекс", country: "Страна",
    payNow: "Оплатить", paySecure: "Безопасная оплата",
    success: "Оплата прошла",
    successSub: "Билеты отправлены на вашу почту.",
    viewTickets: "Показать билеты",
    newOrder: "← Новый заказ",
    processing: "Обработка платежа…",
    required: "Обязательно",
    fillAll: "Заполните обязательные поля",
    termsAck: "Продолжая, вы принимаете условия обслуживания.",
    withdrawTitle: "Важное уведомление о праве на отказ",
    withdrawBody: "В соответствии со ст. 119 ч. 1 п. 12 Закона о защите потребителей Черногории (Офиц. вестник № 12/2026), для услуг досуга, предоставляемых в определённую дату, после покупки вы не имеете права на односторонний отказ от договора. Билеты не подлежат возврату и обмену по инициативе покупателя, кроме случаев отмены/переноса мероприятия или активации страховки билетов.",
    withdrawAck: "Я понимаю, что не имею права на односторонний отказ от настоящего договора, так как речь идёт об услуге досуга на определённую дату (ст. 119 ч. 1 п. 12 Закона о защите потребителей, Офиц. вестник ЧГ № 12/2026).",
  },
  zh: {
    title: "科托尔城墙", subtitle: "购买入场票",
    desc: "科托尔古城的防御工事，其城墙蜿蜒而上直至圣约翰要塞，是被列入联合国教科文组织《世界遗产名录》的威尼斯防御体系的一部分。科托尔融合了伊利里亚、拜占庭、威尼斯和奥地利的文化遗产，是亚得里亚海最具真实历史底蕴的文化瑰宝之一。",
    selectTickets: "选择门票",
    total: "总计", continue: "继续填写信息 →",
    back: "返回",
    details: "您的信息",
    detailsSub: "我们会将带QR码的门票发到您的邮箱。",
    name: "姓名", email: "邮箱", phone: "电话",
    address: "地址", city: "城市", zip: "邮编", country: "国家",
    payNow: "立即支付", paySecure: "安全支付",
    success: "支付成功",
    successSub: "门票已发送至您的邮箱。",
    viewTickets: "查看门票",
    newOrder: "← 新订单",
    processing: "正在处理支付…",
    required: "必填",
    fillAll: "请填写必填字段",
    termsAck: "继续即表示接受服务条款。",
    withdrawTitle: "关于撤回权的重要提示",
    withdrawBody: "根据黑山《消费者保护法》（黑山官方公报第 12/2026 号）第 119 条第 1 款第 12 项，对于在特定日期提供的休闲服务，您在购买后无权单方撤回合同。除非活动取消/延期或已激活门票保险，否则门票不可由消费者自行退换。",
    withdrawAck: "我理解本合同涉及在特定日期提供的休闲服务，因此我无权单方撤回本合同（黑山《消费者保护法》官方公报第 12/2026 号第 119 条第 1 款第 12 项）。",
  },
};

const LANGS = [
  { code: "en", label: "EN" },
  { code: "me", label: "ME" },
  { code: "de", label: "DE" },
  { code: "ru", label: "RU" },
  { code: "zh", label: "中文" },
];

// ─── Zakonski obavezan identitet prodavca (ZZP CG čl. 30) ────────────────────
const MERCHANT = {
  name:    "Opština Kotor",
  address: "Stari grad bb, 85330 Kotor, Crna Gora",
  email:   "support@kotorwalls.com",
};

const LEGAL_FOOTER_I18N = {
  en: {
    priceNote: "All prices in EUR. VAT included where applicable.",
    withdrawNote: "Dated entry tickets are exempt from the 14-day right of withdrawal (EU Dir. 2011/83/EU art. 16(l)). Refund policy applies in case of force majeure or venue closure.",
    sellerLabel: "Seller",
    taxId: "Tax ID",
  },
  me: {
    priceNote: "Cijene u EUR. PDV uračunat gdje je primjenjivo.",
    withdrawNote: "Za karte vezane za određeni datum ulaska ne važi 14-dnevno pravo odustanka (čl. 119 st. 1 t. 12 Zakona o zaštiti potrošača CG, Sl. list br. 12/2026). Povrat u slučaju više sile ili zatvaranja lokacije po Politici refundacije.",
    sellerLabel: "Prodavac",
    taxId: "PIB",
  },
  de: {
    priceNote: "Preise in EUR. MwSt. ggf. enthalten.",
    withdrawNote: "Eintrittskarten mit festem Datum sind vom 14-tägigen Widerrufsrecht ausgenommen (EU-RL 2011/83/EU Art. 16 l). Bei höherer Gewalt oder Schließung gilt die Rückerstattungsrichtlinie.",
    sellerLabel: "Verkäufer",
    taxId: "Steuer-ID",
  },
  ru: {
    priceNote: "Цены указаны в EUR. НДС включён, где применимо.",
    withdrawNote: "К билетам на конкретную дату не применяется 14-дневное право отказа (Дир. ЕС 2011/83/EU, ст. 16(l)). При форс-мажоре — по Политике возврата.",
    sellerLabel: "Продавец",
    taxId: "ИНН",
  },
  zh: {
    priceNote: "价格以欧元计价。适用时已含增值税。",
    withdrawNote: "指定日期入场券不适用14天无条件退货权（欧盟指令 2011/83/EU 第16(l)条）。如遇不可抗力或景点关闭，按退款政策办理。",
    sellerLabel: "卖方",
    taxId: "税号",
  },
};

function LegalFooter({ lang }) {
  const L = LEGAL_FOOTER_I18N[lang] ?? LEGAL_FOOTER_I18N.en;
  return (
    <div style={{
      background: C.bg, borderTop: `1px solid ${C.borderSoft}`,
      padding: "12px 22px 14px",
      display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
      color: C.textSoft, fontSize: 11, lineHeight: 1.55, textAlign: "center",
    }}>
      <div style={{ color: C.textMuted, fontWeight: 600 }}>
        {L.sellerLabel}: {MERCHANT.name}
      </div>
      <div>{MERCHANT.address} · {MERCHANT.email}</div>
      <div style={{ opacity: 0.85 }}>{L.priceNote}</div>
      <div style={{ opacity: 0.75, maxWidth: 520 }}>{L.withdrawNote}</div>
      <div style={{ marginTop: 2 }}>
        <TermsLinks lang={lang} />
      </div>
    </div>
  );
}

// ─── Primitivi ───────────────────────────────────────────────────────────────
function PrimaryBtn({ onClick, children, disabled, full = true }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} disabled={disabled}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        width: full ? "100%" : "auto", padding: "13px 20px", border: "none", borderRadius: 10,
        background: disabled ? "#D4D7DC" : hov ? C.primaryDark : C.primary,
        color: "#fff", fontSize: 14, fontWeight: 700,
        cursor: disabled ? "not-allowed" : "pointer", transition: "background 0.15s",
        fontFamily: "inherit", letterSpacing: "0.1px",
        boxShadow: disabled ? "none" : "0 1px 2px rgba(178,58,58,0.25)",
      }}>{children}</button>
  );
}
function SecondaryBtn({ onClick, children, flex = 1 }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        flex, padding: "13px",
        background: hov ? C.bg : C.surface,
        color: C.textMuted, border: `1px solid ${C.border}`, borderRadius: 10,
        fontSize: 13, fontWeight: 600, cursor: "pointer",
        transition: "background 0.12s", fontFamily: "inherit",
      }}>{children}</button>
  );
}
function CounterBtn({ onClick, disabled, isPlus }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} disabled={disabled}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        width: 32, height: 32, border: "none",
        background: disabled ? C.borderSoft : isPlus ? (hov ? C.primaryDark : C.primary) : (hov ? C.borderSoft : C.bg),
        color: disabled ? C.textFaint : isPlus ? "#fff" : C.textMuted,
        fontSize: 19, fontWeight: 500,
        cursor: disabled ? "not-allowed" : "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all 0.12s", opacity: disabled ? 0.5 : 1,
        lineHeight: 1, padding: 0,
      }}>{isPlus ? "+" : "−"}</button>
  );
}

// ─── Step indicator ─────────────────────────────────────────────────────────
function StepBar({ current, total = 3 }) {
  const labels = ["1", "2", "3"];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 18 }}>
      {labels.slice(0, total).map((n, i) => {
        const step = i + 1;
        const done   = step <  current;
        const active = step === current;
        return (
          <div key={n} style={{ display: "flex", alignItems: "center", gap: 6, flex: i < total - 1 ? 1 : 0 }}>
            <div style={{
              width: 22, height: 22, borderRadius: "50%",
              background: done ? C.gold : active ? C.primary : C.borderSoft,
              color: done || active ? "#fff" : C.textFaint,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 800,
            }}>{done ? "✓" : n}</div>
            {i < total - 1 && (
              <div style={{ flex: 1, height: 2, background: done ? C.gold : C.borderSoft, borderRadius: 2 }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

const fieldLabel = { fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 5, display: "block" };
const fieldInput = {
  width: "100%", padding: "10px 12px", borderRadius: 8,
  border: `1px solid ${C.border}`, fontSize: 14, color: C.text,
  fontFamily: "inherit", outline: "none", background: C.surface,
  transition: "border-color 0.12s",
};

// ─── Forma za plaćanje ──────────────────────────────────────────────────────
function PaymentForm({ t, orderId, customer, canSubmit, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [err, setErr] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    if (!canSubmit) { setErr(t.fillAll); return; }

    setProcessing(true); setErr(null);
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/tickets?order=${orderId}`,
        payment_method_data: {
          billing_details: {
            name:  customer?.name  || "",
            email: customer?.email || "",
            phone: customer?.phone || "",
            // Stripe traži da se SVA polja adrese proslijede (kao string, ne undefined)
            // kad je fields.billingDetails.address === "never". Inače baca IntegrationError.
            address: {
              line1:       customer?.address || "",
              line2:       "",
              city:        customer?.city    || "",
              postal_code: customer?.zip     || "",
              country:     customer?.country || "ME",
              state:       "",
            },
          },
        },
      },
      redirect: "if_required",
    });
    if (error) {
      setErr(error.message); setProcessing(false);
    } else {
      onSuccess(orderId);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ padding: 2 }}>
        <PaymentElement options={{
          layout: "tabs",
          fields: { billingDetails: { address: "never", name: "never", email: "never", phone: "never" } },
        }} />
      </div>
      {err && (
        <div style={{
          marginTop: 12, padding: "10px 12px", borderRadius: 8,
          background: C.primarySoft, border: "1px solid #F3CFCF",
          color: C.primaryDark, fontSize: 12, fontWeight: 500,
        }}>{err}</div>
      )}
      <div style={{ marginTop: 16 }}>
        <PrimaryBtn disabled={!stripe || processing || !canSubmit}>
          {processing ? t.processing : t.payNow}
        </PrimaryBtn>
      </div>
    </form>
  );
}

// ─── Glavni widget ───────────────────────────────────────────────────────────
export default function KotorTicket() {
  const [lang, setLang] = useState("en");
  const [tickets, setTickets] = useState([]);
  const [qty, setQty] = useState({});
  const [screen, setScreen] = useState("buy");   // buy | info | pay | success
  const [loadingCats, setLoadingCats] = useState(true);

  const [customer, setCustomer] = useState({
    name: "", email: "", phone: "",
    address: "", city: "", zip: "", country: "ME",
  });

  const [piClient, setPiClient] = useState(null);
  const [paidOrderId, setPaidOrderId] = useState(null);
  const [creating, setCreating] = useState(false);
  const [err, setErr] = useState(null);
  const [accepted, setAccepted] = useState(false);
  const [withdrawAck, setWithdrawAck] = useState(false);

  const [zipLookup, setZipLookup] = useState({ loading: false, matches: [], error: null });

  const t = T[lang];

  // ZIP → grad + država (Nominatim kroz našu edge funkciju). Auto-fill je samo
  // sugestija — polja Grad i Država ostaju editabilna i kad lookup uspije.
  useEffect(() => {
    const zip = customer.zip?.trim();
    if (!zip || zip.length < 3) {
      setZipLookup({ loading: false, matches: [], error: null });
      return;
    }
    let cancelled = false;
    const run = async () => {
      setZipLookup({ loading: true, matches: [], error: null });
      try {
        const res = await callEdge("lookup-zip", { zip });
        if (cancelled) return;
        const matches = res?.matches ?? [];
        if (matches.length === 0) {
          setZipLookup({ loading: false, matches: [], error: "not_found" });
          return;
        }
        const first = matches[0];
        setCustomer(c => ({ ...c, country: first.country_code, city: first.city || "" }));
        setZipLookup({ loading: false, matches, error: null });
      } catch (e) {
        if (!cancelled) setZipLookup({ loading: false, matches: [], error: String(e.message ?? e) });
      }
    };
    const tm = setTimeout(run, 450);
    return () => { cancelled = true; clearTimeout(tm); };
  }, [customer.zip]);

  // Ručni izbor alternativnog match-a (chip ispod ZIP-a kad ima više rezultata)
  const pickMatch = (m) => {
    setCustomer(c => ({ ...c, country: m.country_code, city: m.city || "" }));
  };

  useEffect(() => {
    (async () => {
      try {
        const rows = await rest("kotorwalls_ticket_categories?select=*&active=eq.true&order=sort_order.asc,code.asc");
        const mapped = (rows ?? []).map(r => ({
          id: r.code, price: Number(r.price),
          label: r.name_i18n ?? { en: r.code },
          sublabel: r.sublabel_i18n ?? { en: "" },
        }));
        setTickets(mapped);
        setQty(Object.fromEntries(mapped.map(m => [m.id, 0])));
      } catch (e) { console.error(e); }
      finally { setLoadingCats(false); }
    })();
  }, []);

  const total = tickets.reduce((s, tt) => s + tt.price * (qty[tt.id] ?? 0), 0);
  const hasItems = total > 0;

  const changeQty = (id, delta) =>
    setQty(q => ({ ...q, [id]: Math.max(0, Math.min(10, (q[id] ?? 0) + delta)) }));

  // Kreira PaymentIntent sa samo items — customer se šalje na submit preko Stripe billing_details
  const goToPayment = async () => {
    setCreating(true); setErr(null);
    try {
      const items = tickets.filter(tt => (qty[tt.id] ?? 0) > 0)
                          .map(tt => ({ category_code: tt.id, quantity: qty[tt.id] }));
      const res = await callEdge("create-checkout", { items, language: lang, channel: "web" });
      if (!res.clientSecret) throw new Error(res.error ?? "No clientSecret");
      setPiClient(res.clientSecret);
      setPaidOrderId(res.orderId);
      setScreen("pay");
    } catch (e) { setErr(String(e.message ?? e)); }
    finally { setCreating(false); }
  };

  const reset = () => {
    setQty(Object.fromEntries(tickets.map(m => [m.id, 0])));
    setCustomer({ name: "", email: "", phone: "", address: "", city: "", zip: "", country: "ME" });
    setPiClient(null); setPaidOrderId(null); setScreen("buy");
  };

  const elementsOpts = useMemo(() => piClient ? {
    clientSecret: piClient,
    appearance: {
      theme: "stripe",
      variables: {
        colorPrimary: C.primary, colorText: C.text,
        colorDanger: C.primary, borderRadius: "8px", fontFamily: "Inter, system-ui, sans-serif",
      },
    },
    locale: lang === "me" ? "hr" : lang === "zh" ? "zh" : lang,
  } : null, [piClient, lang]);

  return (
    <div style={{
      minHeight: "100vh", background: C.bg,
      display: "flex", alignItems: "flex-start", justifyContent: "center",
      padding: "48px 16px", fontFamily: "'Inter', 'DM Sans', system-ui, sans-serif",
    }}>
      <div style={{ width: "100%", maxWidth: 480 }}>

        {/* Lang — sticky na vrhu */}
        <div style={{
          position: "sticky", top: 0, zIndex: 50,
          display: "flex", justifyContent: "flex-end",
          padding: "10px 0 12px",
          marginBottom: 4,
          background: `linear-gradient(to bottom, ${C.bg} 75%, rgba(247,248,250,0))`,
          backdropFilter: "blur(6px)",
        }}>
          <div style={{
            display: "flex", gap: 2, padding: 3, borderRadius: 9,
            background: C.surface, border: `1px solid ${C.border}`,
            boxShadow: "0 2px 8px rgba(26,31,43,0.06)",
          }}>
            {LANGS.map(l => (
              <button key={l.code} onClick={() => setLang(l.code)} style={{
                padding: "4px 10px", borderRadius: 6, border: "none",
                background: lang === l.code ? C.primary : "transparent",
                color: lang === l.code ? "#fff" : C.textSoft,
                fontSize: 11, fontWeight: lang === l.code ? 700 : 500,
                cursor: "pointer", transition: "all 0.15s", fontFamily: "inherit",
              }}>{l.label}</button>
            ))}
          </div>
        </div>

        <div style={{
          background: C.surface, borderRadius: 14,
          border: `1px solid ${C.border}`, overflow: "hidden",
          boxShadow: "0 4px 20px rgba(26,31,43,0.04), 0 1px 3px rgba(26,31,43,0.06)",
        }}>

          {/* Header */}
          <div style={{ padding: "28px 28px 22px", borderBottom: `1px solid ${C.borderSoft}`, position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${C.gold} 0%, ${C.primary} 100%)` }} />
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: C.goldSoft, border: "1px solid #EADD9C", borderRadius: 20, padding: "3px 10px", marginBottom: 14 }}>
              <span style={{ width: 5, height: 5, background: C.goldDark, borderRadius: "50%" }} />
              <span style={{ fontSize: 10, color: C.goldDark, fontWeight: 700, letterSpacing: "0.9px" }}>UNESCO WORLD HERITAGE</span>
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: C.text, letterSpacing: "-0.3px", lineHeight: 1.2, margin: 0 }}>{t.title}</h1>
            <p style={{ fontSize: 13, color: C.textSoft, margin: "5px 0 0" }}>{t.subtitle}</p>
          </div>

          {/* Body */}
          <div style={{ padding: "22px" }}>

            {/* ── BUY ── */}
            {screen === "buy" && (
              <>
                <StepBar current={1} total={3} />
                {loadingCats && <div style={{ padding: 30, textAlign: "center", color: C.textSoft, fontSize: 13 }}>…</div>}
                {!loadingCats && tickets.length === 0 && (
                  <div style={{ padding: 30, textAlign: "center", color: C.textSoft, fontSize: 13 }}>
                    No ticket categories defined yet.
                  </div>
                )}
                {tickets.map((tt, i) => {
                  const active = (qty[tt.id] ?? 0) > 0;
                  return (
                    <div key={tt.id} style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "12px 14px", borderRadius: 10,
                      marginBottom: i < tickets.length - 1 ? 8 : 0,
                      background: active ? C.primarySoft : C.bg,
                      border: `1px solid ${active ? "#F3CFCF" : C.borderSoft}`,
                      transition: "all 0.15s",
                    }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{tt.label[lang] ?? tt.label.en ?? tt.id}</div>
                        <div style={{ fontSize: 11, color: C.textSoft, marginTop: 1 }}>{tt.sublabel?.[lang] ?? tt.sublabel?.en ?? ""}</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: C.primary, marginTop: 3 }}>€{tt.price.toFixed(2)}</div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", border: `1px solid ${C.border}`, borderRadius: 9, overflow: "hidden", background: C.surface }}>
                        <CounterBtn onClick={() => changeQty(tt.id, -1)} disabled={(qty[tt.id] ?? 0) === 0} isPlus={false} />
                        <div style={{
                          width: 38, textAlign: "center", fontSize: 14, fontWeight: 700,
                          color: active ? C.primary : C.textMuted,
                          borderLeft: `1px solid ${C.border}`, borderRight: `1px solid ${C.border}`,
                          lineHeight: "32px",
                        }}>{qty[tt.id] ?? 0}</div>
                        <CounterBtn onClick={() => changeQty(tt.id, 1)} disabled={(qty[tt.id] ?? 0) === 10} isPlus={true} />
                      </div>
                    </div>
                  );
                })}

                {hasItems && (
                  <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${C.borderSoft}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                      <span style={{ fontSize: 13, color: C.textSoft, fontWeight: 500 }}>{t.total}</span>
                      <span style={{ fontSize: 26, fontWeight: 800, color: C.text, letterSpacing: "-0.5px" }}>€{total.toFixed(2)}</span>
                    </div>
                    <PrimaryBtn onClick={() => setScreen("info")}>{t.continue}</PrimaryBtn>
                  </div>
                )}

                <div style={{ marginTop: 18, paddingTop: 14, borderTop: `1px solid ${C.borderSoft}` }}>
                  <p style={{ fontSize: 12, color: C.textSoft, lineHeight: 1.7, margin: 0, textAlign: "center" }}>{t.desc}</p>
                </div>
              </>
            )}

            {/* ── INFO (korak 2 / 3 — podaci kupca) ── */}
            {screen === "info" && (
              <>
                <StepBar current={2} total={3} />

                <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 4 }}>{t.details}</div>
                <div style={{ fontSize: 12, color: C.textSoft, marginBottom: 14 }}>{t.detailsSub}</div>

                <div style={{ display: "grid", gap: 12 }}>
                  <div>
                    <label style={fieldLabel}>{t.name} *</label>
                    <input style={fieldInput} value={customer.name} onChange={e => setCustomer(c => ({ ...c, name: e.target.value }))} autoComplete="name" />
                  </div>
                  <div>
                    <label style={fieldLabel}>{t.email} *</label>
                    <input type="email" style={fieldInput} value={customer.email} onChange={e => setCustomer(c => ({ ...c, email: e.target.value }))} autoComplete="email" />
                  </div>
                  <div>
                    <label style={fieldLabel}>{t.phone}</label>
                    <input style={fieldInput} value={customer.phone} onChange={e => setCustomer(c => ({ ...c, phone: e.target.value }))} autoComplete="tel" />
                  </div>

                  {/* Adresa — puni red (kao etiketing inline forma) */}
                  <div>
                    <label style={fieldLabel}>{t.address}</label>
                    <input
                      style={fieldInput}
                      value={customer.address}
                      onChange={e => setCustomer(c => ({ ...c, address: e.target.value }))}
                      autoComplete="street-address"
                      placeholder="Ulica i broj"
                    />
                  </div>

                  {/* ZIP + Grad + Država — jedan red, ručni unos (bez Nominatim autofill-a) */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr 0.7fr", gap: 10 }}>
                    <div>
                      <label style={fieldLabel}>{t.zip} *</label>
                      <input
                        style={{ ...fieldInput, fontFamily: "ui-monospace, monospace", letterSpacing: "0.5px" }}
                        value={customer.zip}
                        type="text"
                        inputMode="numeric"
                        maxLength={5}
                        autoComplete="postal-code"
                        placeholder="85330"
                        onChange={e => setCustomer(c => ({ ...c, zip: e.target.value.replace(/\D/g, "") }))}
                      />
                    </div>
                    <div>
                      <label style={fieldLabel}>{t.city}</label>
                      <input
                        style={fieldInput}
                        value={customer.city}
                        onChange={e => setCustomer(c => ({ ...c, city: e.target.value }))}
                        placeholder="Kotor"
                        autoComplete="address-level2"
                      />
                    </div>
                    <div>
                      <label style={fieldLabel}>{t.country}</label>
                      <input
                        style={{ ...fieldInput, textAlign: "center", letterSpacing: "0.5px" }}
                        value={customer.country}
                        onChange={e => setCustomer(c => ({ ...c, country: e.target.value.toUpperCase() }))}
                        maxLength={2}
                        placeholder="ME"
                        autoComplete="country"
                      />
                    </div>
                  </div>
                </div>

                {/* ZZP CG napomena */}
                <div style={{
                  marginTop: 16, padding: "10px 12px",
                  background: C.goldSoft, border: "1px solid #EADD9C",
                  borderRadius: 8, fontSize: 11, lineHeight: 1.5, color: C.text,
                }}>
                  <div style={{ fontWeight: 700, marginBottom: 4, color: C.goldDark }}>{t.withdrawTitle}</div>
                  <div style={{ color: C.textMuted }}>{t.withdrawBody}</div>
                </div>

                <label style={{
                  display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer",
                  padding: "9px 11px", margin: "10px 0",
                  border: `1px solid ${withdrawAck ? C.gold : C.border}`,
                  background: withdrawAck ? C.goldSoft : C.surface,
                  borderRadius: 8,
                }}>
                  <input
                    type="checkbox"
                    checked={withdrawAck}
                    onChange={e => setWithdrawAck(e.target.checked)}
                    style={{ marginTop: 2, accentColor: C.primary, width: 16, height: 16, flexShrink: 0 }}
                  />
                  <span style={{ fontSize: 11, lineHeight: 1.5, color: C.text, fontWeight: 500 }}>{t.withdrawAck}</span>
                </label>

                <div style={{ marginBottom: 14 }}>
                  <TermsLinks lang={lang} showCheckbox accepted={accepted} onAccept={setAccepted} />
                </div>

                {err && (
                  <div style={{ marginBottom: 10, padding: "10px 12px", borderRadius: 8, background: C.primarySoft, border: "1px solid #F3CFCF", color: C.primaryDark, fontSize: 12, fontWeight: 500 }}>{err}</div>
                )}

                <div style={{ display: "flex", gap: 8 }}>
                  <SecondaryBtn onClick={() => setScreen("buy")}>← {t.back}</SecondaryBtn>
                  <div style={{ flex: 2 }}>
                    <PrimaryBtn
                      onClick={() => {
                        if (!customer.name || !customer.email) { setErr(t.fillAll); return; }
                        if (!accepted || !withdrawAck)         { setErr(t.fillAll); return; }
                        goToPayment();
                      }}
                      disabled={creating}
                    >
                      {creating ? t.processing : t.payNow + " →"}
                    </PrimaryBtn>
                  </div>
                </div>
              </>
            )}

            {/* ── PAY (korak 3 / 3 — Stripe Elements) ── */}
            {screen === "pay" && piClient && elementsOpts && (
              <>
                <StepBar current={3} total={3} />

                <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{t.paySecure}</div>
                <div style={{ fontSize: 12, color: C.textSoft, marginTop: 4, marginBottom: 14 }}>{customer.email}</div>

                <div style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  background: C.goldSoft, border: "1px solid #EADD9C",
                  borderRadius: 10, padding: "12px 14px", marginBottom: 16,
                }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: C.goldDark }}>{t.total}</span>
                  <span style={{ fontSize: 22, fontWeight: 800, color: C.text }}>€{total.toFixed(2)}</span>
                </div>

                <Elements stripe={getStripePromise()} options={elementsOpts}>
                  <PaymentForm
                    t={t}
                    orderId={paidOrderId}
                    customer={customer}
                    canSubmit={!!(customer.name && customer.email && accepted && withdrawAck)}
                    onSuccess={(id) => { setPaidOrderId(id); setScreen("success"); }}
                  />
                </Elements>

                <div style={{ marginTop: 12 }}>
                  <SecondaryBtn onClick={() => setScreen("info")}>← {t.back}</SecondaryBtn>
                </div>
              </>
            )}

            {/* ── SUCCESS ── */}
            {screen === "success" && (
              <div style={{ textAlign: "center", padding: "26px 0 6px" }}>
                <div style={{
                  width: 64, height: 64, borderRadius: "50%",
                  background: C.goldSoft, border: `2px solid ${C.gold}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 16px", color: C.goldDark,
                }}>
                  <svg width="28" height="28" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: C.text }}>{t.success}</div>
                <div style={{ fontSize: 13, color: C.textSoft, marginTop: 6, lineHeight: 1.6 }}>{t.successSub}</div>
                <div style={{ display: "flex", gap: 8, marginTop: 20, justifyContent: "center" }}>
                  <a href={`#tickets?order=${paidOrderId}`} style={{
                    padding: "10px 20px", background: C.primary, color: "#fff",
                    textDecoration: "none", borderRadius: 8, fontSize: 13, fontWeight: 700,
                  }}>{t.viewTickets}</a>
                  <button onClick={reset} style={{
                    padding: "10px 20px", background: C.surface, color: C.textMuted,
                    border: `1px solid ${C.border}`, borderRadius: 8,
                    fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                  }}>{t.newOrder}</button>
                </div>
              </div>
            )}

          </div>

          {/* Footer — zakonski obavezan identitet prodavca + info o cijenama */}
          <LegalFooter lang={lang} />
        </div>
      </div>
    </div>
  );
}
