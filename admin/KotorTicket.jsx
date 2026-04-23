import { useState, useEffect, useMemo } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { callEdge, rest } from "./supabaseClient.js";
import { TermsLinks } from "./KotorLegal.jsx";

// ─── Kotor paleta ────────────────────────────────────────────────────────────
const C = {
  primary:     "#B23A3A", primaryDark: "#8E2A2A", primarySoft: "#FBE9E9",
  gold:        "#C9A227", goldDark:    "#A8841C", goldSoft:    "#FBF2D6",
  bg:          "#F7F8FA", surface:     "#FFFFFF",
  border:      "#E6E8EB", borderSoft:  "#F0F1F4",
  text:        "#1A1F2B", textMuted:   "#4A5363", textSoft: "#6B7684", textFaint: "#9AA3B2",
};

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

// ─── Prevodi ─────────────────────────────────────────────────────────────────
const T = {
  en: {
    title: "Kotor City Walls", subtitle: "Purchase entrance tickets",
    desc: "UNESCO World Heritage since 1979. 4.5 km of Venetian fortifications rising 280 m above the Bay of Kotor.",
    selectTickets: "Select tickets",
    total: "Total", continue: "Continue to details →",
    back: "Back",
    details: "Your details",
    detailsSub: "We'll send your QR tickets to your email.",
    name: "Full name", email: "Email", phone: "Phone (optional)",
    address: "Address (optional)", city: "City", zip: "Postal code", country: "Country",
    payNow: "Pay now", paySecure: "Secure payment",
    secured: "Payments processed by Stripe · PCI DSS Level 1",
    success: "Payment successful",
    successSub: "Your tickets have been sent to your email.",
    viewTickets: "View tickets",
    newOrder: "← New order",
    processing: "Processing payment…",
    required: "Required",
    fillAll: "Please fill in the required fields",
    termsAck: "By continuing you accept our terms of service.",
  },
  me: {
    title: "Kotorske zidine", subtitle: "Kupovina ulaznica",
    desc: "UNESCO svjetska baština od 1979. 4,5 km venecijanskih utvrđenja iznad Bokokotorskog zaliva.",
    selectTickets: "Izaberi karte",
    total: "Ukupno", continue: "Nastavi na podatke →",
    back: "Nazad",
    details: "Tvoji podaci",
    detailsSub: "Poslaćemo QR karte na tvoju email adresu.",
    name: "Ime i prezime", email: "Email", phone: "Telefon (opciono)",
    address: "Adresa (opciono)", city: "Grad", zip: "Poštanski broj", country: "Država",
    payNow: "Plati sada", paySecure: "Sigurno plaćanje",
    secured: "Plaćanja obrađuje Stripe · PCI DSS Level 1",
    success: "Plaćanje uspješno",
    successSub: "Karte su poslate na tvoju email adresu.",
    viewTickets: "Prikaži karte",
    newOrder: "← Nova narudžbina",
    processing: "Obrada plaćanja…",
    required: "Obavezno",
    fillAll: "Popuni obavezna polja",
    termsAck: "Nastavkom prihvataš uslove korišćenja.",
  },
  de: {
    title: "Stadtmauern von Kotor", subtitle: "Eintrittskarten kaufen",
    desc: "UNESCO-Welterbe seit 1979. 4,5 km venezianische Befestigungen, 280 m über der Bucht.",
    selectTickets: "Tickets auswählen",
    total: "Gesamt", continue: "Weiter zu Details →",
    back: "Zurück",
    details: "Ihre Angaben",
    detailsSub: "Wir senden Ihre QR-Tickets an Ihre E-Mail.",
    name: "Vollständiger Name", email: "E-Mail", phone: "Telefon (optional)",
    address: "Adresse (optional)", city: "Stadt", zip: "PLZ", country: "Land",
    payNow: "Jetzt bezahlen", paySecure: "Sichere Zahlung",
    secured: "Zahlungen durch Stripe · PCI DSS Level 1",
    success: "Zahlung erfolgreich",
    successSub: "Tickets an Ihre E-Mail gesendet.",
    viewTickets: "Tickets anzeigen",
    newOrder: "← Neue Bestellung",
    processing: "Zahlung wird verarbeitet…",
    required: "Pflichtfeld",
    fillAll: "Bitte Pflichtfelder ausfüllen",
    termsAck: "Mit dem Fortfahren akzeptieren Sie unsere Bedingungen.",
  },
  ru: {
    title: "Городские стены Котора", subtitle: "Купить входные билеты",
    desc: "Объект ЮНЕСКО с 1979 года. 4,5 км венецианских укреплений над Которской бухтой.",
    selectTickets: "Выбор билетов",
    total: "Итого", continue: "Далее к данным →",
    back: "Назад",
    details: "Ваши данные",
    detailsSub: "Билеты с QR-кодом придут на вашу почту.",
    name: "Полное имя", email: "Эл. почта", phone: "Телефон (необязательно)",
    address: "Адрес (необязательно)", city: "Город", zip: "Индекс", country: "Страна",
    payNow: "Оплатить", paySecure: "Безопасная оплата",
    secured: "Платежи обрабатывает Stripe · PCI DSS Level 1",
    success: "Оплата прошла",
    successSub: "Билеты отправлены на вашу почту.",
    viewTickets: "Показать билеты",
    newOrder: "← Новый заказ",
    processing: "Обработка платежа…",
    required: "Обязательно",
    fillAll: "Заполните обязательные поля",
    termsAck: "Продолжая, вы принимаете условия обслуживания.",
  },
  zh: {
    title: "科托尔城墙", subtitle: "购买入场票",
    desc: "自1979年起成为联合国教科文组织世界遗产。威尼斯防御工事高耸于科托尔湾280米之上。",
    selectTickets: "选择门票",
    total: "总计", continue: "继续填写信息 →",
    back: "返回",
    details: "您的信息",
    detailsSub: "我们会将带QR码的门票发到您的邮箱。",
    name: "姓名", email: "邮箱", phone: "电话（可选）",
    address: "地址（可选）", city: "城市", zip: "邮编", country: "国家",
    payNow: "立即支付", paySecure: "安全支付",
    secured: "由 Stripe 处理支付 · PCI DSS Level 1",
    success: "支付成功",
    successSub: "门票已发送至您的邮箱。",
    viewTickets: "查看门票",
    newOrder: "← 新订单",
    processing: "正在处理支付…",
    required: "必填",
    fillAll: "请填写必填字段",
    termsAck: "继续即表示接受服务条款。",
  },
};

const LANGS = [
  { code: "en", label: "EN" },
  { code: "me", label: "ME" },
  { code: "de", label: "DE" },
  { code: "ru", label: "RU" },
  { code: "zh", label: "中文" },
];

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

const fieldLabel = { fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 5, display: "block" };
const fieldInput = {
  width: "100%", padding: "10px 12px", borderRadius: 8,
  border: `1px solid ${C.border}`, fontSize: 14, color: C.text,
  fontFamily: "inherit", outline: "none", background: C.surface,
  transition: "border-color 0.12s",
};

// ─── Forma za plaćanje (unutar Stripe Elements) ─────────────────────────────
function PaymentForm({ t, piClientSecret, orderId, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [err, setErr] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setProcessing(true); setErr(null);
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}${window.location.pathname}#success?order=${orderId}`,
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
        <PaymentElement options={{ layout: "tabs" }} />
      </div>
      {err && (
        <div style={{
          marginTop: 12, padding: "10px 12px", borderRadius: 8,
          background: C.primarySoft, border: "1px solid #F3CFCF",
          color: C.primaryDark, fontSize: 12, fontWeight: 500,
        }}>{err}</div>
      )}
      <div style={{ marginTop: 16 }}>
        <PrimaryBtn disabled={!stripe || processing}>
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

  const t = T[lang];

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

  const startCheckout = async () => {
    if (!customer.name || !customer.email) { setErr(t.fillAll); return; }
    if (!accepted) { setErr(t.fillAll); return; }
    setCreating(true); setErr(null);
    try {
      const items = tickets.filter(tt => (qty[tt.id] ?? 0) > 0)
                          .map(tt => ({ category_code: tt.id, quantity: qty[tt.id] }));
      const res = await callEdge("create-checkout", {
        items, language: lang, channel: "web",
        customer_name:    customer.name,
        customer_email:   customer.email,
        customer_phone:   customer.phone,
        customer_address: customer.address,
        customer_city:    customer.city,
        customer_zip:     customer.zip,
        customer_country: customer.country,
      });
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

        {/* Lang */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
          <div style={{ display: "flex", gap: 2, padding: 3, borderRadius: 9, background: C.surface, border: `1px solid ${C.border}` }}>
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

            {/* ── INFO ── */}
            {screen === "info" && (
              <>
                <div style={{ marginBottom: 18 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{t.details}</div>
                  <div style={{ fontSize: 12, color: C.textSoft, marginTop: 4 }}>{t.detailsSub}</div>
                </div>

                <div style={{ display: "grid", gap: 12 }}>
                  <div>
                    <label style={fieldLabel}>{t.name} *</label>
                    <input style={fieldInput} value={customer.name} onChange={e => setCustomer(c => ({ ...c, name: e.target.value }))} />
                  </div>
                  <div>
                    <label style={fieldLabel}>{t.email} *</label>
                    <input type="email" style={fieldInput} value={customer.email} onChange={e => setCustomer(c => ({ ...c, email: e.target.value }))} />
                  </div>
                  <div>
                    <label style={fieldLabel}>{t.phone}</label>
                    <input style={fieldInput} value={customer.phone} onChange={e => setCustomer(c => ({ ...c, phone: e.target.value }))} />
                  </div>
                  <div>
                    <label style={fieldLabel}>{t.address}</label>
                    <input style={fieldInput} value={customer.address} onChange={e => setCustomer(c => ({ ...c, address: e.target.value }))} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr", gap: 10 }}>
                    <div>
                      <label style={fieldLabel}>{t.city}</label>
                      <input style={fieldInput} value={customer.city} onChange={e => setCustomer(c => ({ ...c, city: e.target.value }))} />
                    </div>
                    <div>
                      <label style={fieldLabel}>{t.zip}</label>
                      <input style={fieldInput} value={customer.zip} onChange={e => setCustomer(c => ({ ...c, zip: e.target.value }))} />
                    </div>
                    <div>
                      <label style={fieldLabel}>{t.country}</label>
                      <input style={fieldInput} value={customer.country} maxLength={2} onChange={e => setCustomer(c => ({ ...c, country: e.target.value.toUpperCase() }))} />
                    </div>
                  </div>
                </div>

                <div style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  background: C.primarySoft, border: "1px solid #F3CFCF",
                  borderRadius: 10, padding: "13px 15px", margin: "18px 0 14px",
                }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: C.textMuted }}>{t.total}</span>
                  <span style={{ fontSize: 22, fontWeight: 800, color: C.text }}>€{total.toFixed(2)}</span>
                </div>

                {err && (
                  <div style={{ marginBottom: 10, padding: "10px 12px", borderRadius: 8, background: C.primarySoft, border: "1px solid #F3CFCF", color: C.primaryDark, fontSize: 12, fontWeight: 500 }}>{err}</div>
                )}

                <div style={{ marginBottom: 14 }}>
                  <TermsLinks lang={lang} showCheckbox accepted={accepted} onAccept={setAccepted} />
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  <SecondaryBtn onClick={() => setScreen("buy")}>← {t.back}</SecondaryBtn>
                  <div style={{ flex: 2 }}>
                    <PrimaryBtn onClick={startCheckout} disabled={creating || !accepted}>
                      {creating ? t.processing : t.continue}
                    </PrimaryBtn>
                  </div>
                </div>
              </>
            )}

            {/* ── PAY ── */}
            {screen === "pay" && piClient && elementsOpts && (
              <>
                <div style={{ marginBottom: 18 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{t.paySecure}</div>
                  <div style={{ fontSize: 12, color: C.textSoft, marginTop: 4 }}>{customer.email}</div>
                </div>

                <div style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  background: C.goldSoft, border: "1px solid #EADD9C",
                  borderRadius: 10, padding: "12px 14px", marginBottom: 16,
                }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: C.goldDark }}>{t.total}</span>
                  <span style={{ fontSize: 22, fontWeight: 800, color: C.text }}>€{total.toFixed(2)}</span>
                </div>

                <Elements stripe={stripePromise} options={elementsOpts}>
                  <PaymentForm t={t} piClientSecret={piClient} orderId={paidOrderId} onSuccess={(id) => { setPaidOrderId(id); setScreen("success"); }} />
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

          {/* Footer */}
          <div style={{
            background: C.bg, borderTop: `1px solid ${C.borderSoft}`,
            padding: "10px 22px",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
            color: C.textSoft,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span style={{ fontSize: 11 }}>{t.secured}</span>
            </div>
            <TermsLinks lang={lang} />
          </div>
        </div>
      </div>
    </div>
  );
}
