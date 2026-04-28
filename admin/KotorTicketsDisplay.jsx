import { useEffect, useState } from "react";
import { SUPABASE_URL } from "./supabaseClient.js";

// ─── Kotor paleta ────────────────────────────────────────────────────────────
const C = {
  primary:    "#B23A3A", primaryDark: "#8E2A2A", primarySoft: "#FBE9E9",
  gold:       "#C9A227", goldDark:    "#A8841C", goldSoft:    "#FBF2D6",
  bg:         "#F7F8FA", surface:     "#FFFFFF",
  border:     "#E6E8EB", borderSoft:  "#F0F1F4",
  text:       "#1A1F2B", textMuted:   "#4A5363", textSoft: "#6B7684", textFaint: "#9AA3B2",
};

// Engleski primarno + ostali jezici za naslove
const T = {
  en: {
    title:      "Your tickets",
    subtitle:   "Kotor City Walls · UNESCO World Heritage",
    ticketOf:   (i, n) => `Ticket ${i} of ${n}`,
    category:   "Category",
    price:      "Price",
    issued:     "Issued",
    status:     "Status",
    valid:      "Valid",
    used:       "Used",
    refunded:   "Refunded",
    instruct:   "Show this QR code at the entrance. The scanner at the walls will validate automatically.",
    orderRef:   "Order reference",
    customer:   "Customer",
    loading:    "Loading…",
    notFound:   "No tickets found",
    notFoundSub:"Please check the link or contact support@kotorwalls.com",
    print:      "Print tickets",
    download:   "Save as PDF",
  },
  me: {
    title:      "Tvoje karte",
    subtitle:   "Kotorske zidine · UNESCO svjetska baština",
    ticketOf:   (i, n) => `Karta ${i} od ${n}`,
    category:   "Kategorija",
    price:      "Cijena",
    issued:     "Izdata",
    status:     "Status",
    valid:      "Važi",
    used:       "Iskorišćena",
    refunded:   "Refundirana",
    instruct:   "Pokaži QR kod na ulazu. Čitač na bedemima automatski validira.",
    orderRef:   "Broj narudžbine",
    customer:   "Kupac",
    loading:    "Učitavanje…",
    notFound:   "Karte nisu pronađene",
    notFoundSub:"Provjeri link ili piši na support@kotorwalls.com",
    print:      "Odštampaj karte",
    download:   "Sačuvaj kao PDF",
  },
  de: { title: "Ihre Tickets", subtitle: "Stadtmauern von Kotor · UNESCO-Welterbe", ticketOf: (i,n) => `Ticket ${i} von ${n}`, category: "Kategorie", price: "Preis", issued: "Ausgestellt", status: "Status", valid: "Gültig", used: "Benutzt", refunded: "Erstattet", instruct: "Zeigen Sie den QR-Code am Eingang vor. Der Scanner validiert automatisch.", orderRef: "Bestellnummer", customer: "Kunde", loading: "Laden…", notFound: "Keine Tickets gefunden", notFoundSub: "Bitte Link prüfen oder support@kotorwalls.com kontaktieren", print: "Drucken", download: "Als PDF speichern" },
  ru: { title: "Ваши билеты", subtitle: "Городские стены Котора · Объект ЮНЕСКО", ticketOf: (i,n) => `Билет ${i} из ${n}`, category: "Категория", price: "Цена", issued: "Выдан", status: "Статус", valid: "Действителен", used: "Использован", refunded: "Возврат", instruct: "Покажите QR-код на входе. Сканер у стен проверит автоматически.", orderRef: "Номер заказа", customer: "Клиент", loading: "Загрузка…", notFound: "Билеты не найдены", notFoundSub: "Проверьте ссылку или напишите на support@kotorwalls.com", print: "Распечатать", download: "Сохранить как PDF" },
  zh: { title: "您的门票", subtitle: "科托尔城墙 · 联合国教科文组织世界遗产", ticketOf: (i,n) => `第 ${i} / ${n} 张`, category: "类别", price: "价格", issued: "签发时间", status: "状态", valid: "有效", used: "已使用", refunded: "已退款", instruct: "在入口处出示此QR码。城墙扫描器会自动验证。", orderRef: "订单号", customer: "客户", loading: "加载中…", notFound: "未找到门票", notFoundSub: "请检查链接或联系 support@kotorwalls.com", print: "打印门票", download: "保存为PDF" },
};

const LANGS = [
  { code: "en", label: "EN" },
  { code: "me", label: "ME" },
  { code: "de", label: "DE" },
  { code: "ru", label: "RU" },
  { code: "zh", label: "中文" },
];

function StatusBadge({ status, t }) {
  const map = {
    valid:    { bg: "#E3F3E8", fg: "#0F7A3D", bd: "#BBECCB", lbl: t.valid },
    used:     { bg: C.borderSoft, fg: C.textSoft, bd: C.border, lbl: t.used },
    refunded: { bg: C.primarySoft, fg: C.primaryDark, bd: "#F3CFCF", lbl: t.refunded },
    pending:  { bg: C.goldSoft, fg: C.goldDark, bd: "#EADD9C", lbl: status },
  };
  const s = map[status] ?? map.pending;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      fontSize: 11, fontWeight: 700, padding: "3px 10px",
      borderRadius: 999, background: s.bg, color: s.fg,
      border: `1px solid ${s.bd}`, letterSpacing: 0.3, textTransform: "uppercase",
    }}>{s.lbl}</span>
  );
}

export default function KotorTicketsDisplay() {
  // Parse query iz BOTH search (?order=XXX) i hash (#tickets?order=XXX).
  // search ima prednost, jer Vercel SPA rewrite šalje na /index.html sa search,
  // a stari linkovi mogu i dalje koristiti #hash format.
  const readQuery = () => {
    const search = new URLSearchParams(window.location.search);
    const hashQ  = new URLSearchParams(window.location.hash.split("?")[1] ?? "");
    const merged = new URLSearchParams();
    for (const [k, v] of hashQ) merged.set(k, v);
    for (const [k, v] of search) merged.set(k, v);   // search overrides hash
    return merged;
  };
  const [query, setQuery] = useState(readQuery);
  useEffect(() => {
    const on = () => setQuery(readQuery());
    window.addEventListener("hashchange", on);
    window.addEventListener("popstate",  on);
    return () => {
      window.removeEventListener("hashchange", on);
      window.removeEventListener("popstate",  on);
    };
  }, []);

  const orderId   = query.get("order");
  const sessionId = query.get("session_id");
  const piId      = query.get("pi");

  const [lang, setLang] = useState("en");
  const t = T[lang] ?? T.en;

  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr]         = useState(null);

  useEffect(() => {
    (async () => {
      if (!orderId && !sessionId && !piId) {
        setLoading(false); setErr("missing params"); return;
      }
      try {
        let url = `${SUPABASE_URL}/functions/v1/kw-view-tickets?`;
        if (orderId)        url += `order_id=${orderId}`;
        else if (sessionId) url += `session_id=${sessionId}`;
        else if (piId)      url += `payment_intent_id=${piId}`;
        const res = await fetch(url);
        const body = await res.json();
        if (!res.ok) throw new Error(body.error ?? "load failed");
        setData(body);
        if (body.order?.language && T[body.order.language]) setLang(body.order.language);
      } catch (e) { setErr(String(e.message ?? e)); }
      finally { setLoading(false); }
    })();
  }, [orderId, sessionId, piId]);

  const fmtDate = (iso) => {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  };
  const fmtTime = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div style={{
      minHeight: "100vh", background: C.bg,
      fontFamily: "'Inter', 'DM Sans', system-ui, sans-serif",
      padding: "32px 16px 80px",
    }}>
      <div style={{ maxWidth: 680, margin: "0 auto" }}>

        {/* Top bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            fontSize: 13, fontWeight: 700, color: C.text, letterSpacing: "-0.2px",
          }}>
            <img
              src="https://hvpytasddzeprgqkwlbu.supabase.co/storage/v1/object/public/razno/kotor.png"
              alt="Kotor Walls"
              style={{ width: 30, height: 30, borderRadius: 7, objectFit: "contain", display: "block" }}
            />
            Kotor Walls
          </div>
          <div style={{ display: "flex", gap: 2, padding: 3, borderRadius: 9, background: C.surface, border: `1px solid ${C.border}` }}>
            {LANGS.map(l => (
              <button key={l.code} onClick={() => setLang(l.code)} style={{
                padding: "4px 10px", borderRadius: 6, border: "none",
                background: lang === l.code ? C.primary : "transparent",
                color: lang === l.code ? "#fff" : C.textSoft,
                fontSize: 11, fontWeight: lang === l.code ? 700 : 500,
                cursor: "pointer", fontFamily: "inherit",
              }}>{l.label}</button>
            ))}
          </div>
        </div>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: C.goldSoft, border: "1px solid #EADD9C", borderRadius: 20, padding: "3px 10px", marginBottom: 12 }}>
            <span style={{ width: 5, height: 5, background: C.goldDark, borderRadius: "50%" }} />
            <span style={{ fontSize: 10, color: C.goldDark, fontWeight: 700, letterSpacing: "0.9px" }}>UNESCO WORLD HERITAGE</span>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: C.text, letterSpacing: "-0.4px", margin: 0 }}>{t.title}</h1>
          <p style={{ fontSize: 13, color: C.textSoft, marginTop: 6, margin: "6px 0 0" }}>{t.subtitle}</p>
        </div>

        {/* Loading / Error */}
        {loading && (
          <div style={{ textAlign: "center", color: C.textSoft, padding: 40 }}>{t.loading}</div>
        )}

        {!loading && (err || !data?.tickets?.length) && (
          <div style={{
            background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`,
            padding: 40, textAlign: "center",
          }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{t.notFound}</div>
            <div style={{ fontSize: 13, color: C.textSoft, marginTop: 6 }}>{t.notFoundSub}</div>
            {err && <div style={{ fontSize: 11, color: C.textFaint, marginTop: 14, fontFamily: "ui-monospace, monospace" }}>{err}</div>}
          </div>
        )}

        {!loading && data?.tickets?.length > 0 && (
          <>
            {/* Instruction banner */}
            <div style={{
              background: C.goldSoft, border: "1px solid #EADD9C",
              borderRadius: 10, padding: "12px 16px", marginBottom: 18,
              display: "flex", gap: 10, alignItems: "flex-start",
            }}>
              <svg width="18" height="18" fill="none" stroke={C.goldDark} viewBox="0 0 24 24" style={{ flexShrink: 0, marginTop: 1 }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div style={{ fontSize: 13, color: C.goldDark, fontWeight: 500, lineHeight: 1.5 }}>{t.instruct}</div>
            </div>

            {/* Order summary */}
            <div style={{
              background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`,
              padding: "14px 18px", marginBottom: 18,
              display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 13,
            }}>
              <div>
                <div style={{ fontSize: 11, color: C.textSoft, marginBottom: 2, textTransform: "uppercase", letterSpacing: 0.5 }}>{t.customer}</div>
                <div style={{ color: C.text, fontWeight: 600 }}>{data.order?.customer_name ?? "—"}</div>
                <div style={{ color: C.textSoft, fontSize: 12 }}>{data.order?.customer_email ?? ""}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 11, color: C.textSoft, marginBottom: 2, textTransform: "uppercase", letterSpacing: 0.5 }}>{t.orderRef}</div>
                <div style={{ color: C.text, fontFamily: "ui-monospace, monospace", fontSize: 11 }}>
                  {data.order?.id?.slice(0, 8)}…{data.order?.id?.slice(-4)}
                </div>
              </div>
            </div>

            {/* Tickets — portrait layout, optimizovan za mobilni telefon */}
            <div style={{ display: "flex", flexDirection: "column", gap: 18, alignItems: "center" }}>
              {data.tickets.map((ticket, i) => (
                <div key={ticket.id} style={{
                  width: "100%", maxWidth: 360,
                  background: C.surface, borderRadius: 16,
                  border: `1px solid ${C.border}`,
                  overflow: "hidden",
                  boxShadow: "0 6px 20px rgba(26,31,43,0.06), 0 1px 3px rgba(26,31,43,0.04)",
                  position: "relative",
                  pageBreakInside: "avoid",
                  breakInside: "avoid",
                }}>
                  {/* Gradient stripe */}
                  <div style={{ height: 4, background: `linear-gradient(90deg, ${C.gold} 0%, ${C.primary} 100%)` }} />

                  {/* Top: ticket # + UNESCO mini badge */}
                  <div style={{
                    padding: "14px 18px 0",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                  }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: C.textFaint, letterSpacing: 0.6, textTransform: "uppercase" }}>
                      {t.ticketOf(i + 1, data.tickets.length)}
                    </div>
                    <StatusBadge status={ticket.status} t={t} />
                  </div>

                  {/* Category — najveći i najbitniji element */}
                  <div style={{
                    padding: "8px 18px 16px",
                    textAlign: "center",
                  }}>
                    <div style={{
                      fontSize: 22, fontWeight: 800, color: C.text,
                      letterSpacing: "-0.4px", lineHeight: 1.2,
                    }}>
                      {ticket.category_name}
                    </div>
                    <div style={{
                      fontSize: 13, fontWeight: 700, color: C.primary, marginTop: 4,
                    }}>
                      €{Number(ticket.price ?? 0).toFixed(2)}
                    </div>
                  </div>

                  {/* QR — centriran, veliki */}
                  <div style={{
                    display: "flex", justifyContent: "center",
                    padding: "0 18px 14px",
                  }}>
                    <div style={{
                      width: 220, height: 220,
                      background: C.surface, border: `1px solid ${C.border}`,
                      borderRadius: 12, padding: 10,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {ticket.qr_image_url ? (
                        <img src={ticket.qr_image_url} alt="QR"
                             style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                      ) : (
                        <div style={{ color: C.textFaint, fontSize: 12, textAlign: "center" }}>
                          QR<br/>pending
                        </div>
                      )}
                    </div>
                  </div>

                  {/* QR code text — monospace ispod QR-a */}
                  <div style={{
                    fontFamily: "ui-monospace, monospace",
                    fontSize: 11, color: C.textMuted,
                    textAlign: "center", letterSpacing: 0.4,
                    padding: "0 18px 14px",
                    wordBreak: "break-all",
                  }}>
                    {ticket.qr_code}
                  </div>

                  {/* Perforation */}
                  <div style={{
                    position: "relative",
                    borderTop: `1.5px dashed ${C.borderSoft}`,
                    margin: "0 18px",
                  }}>
                    {/* notches sa strana */}
                    <div style={{
                      position: "absolute", left: -25, top: -10,
                      width: 20, height: 20, borderRadius: "50%",
                      background: C.bg, border: `1px solid ${C.border}`,
                    }} />
                    <div style={{
                      position: "absolute", right: -25, top: -10,
                      width: 20, height: 20, borderRadius: "50%",
                      background: C.bg, border: `1px solid ${C.border}`,
                    }} />
                  </div>

                  {/* Detalji — kompaktna lista ispod perforacije */}
                  <div style={{
                    padding: "14px 18px 6px",
                    display: "grid", gap: 6, fontSize: 12,
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: C.textSoft }}>{t.issued}</span>
                      <span style={{ color: C.text, fontWeight: 600 }}>
                        {fmtDate(ticket.issued_at)} {fmtTime(ticket.issued_at)}
                      </span>
                    </div>
                  </div>

                  {/* Footer brand */}
                  <div style={{
                    padding: "10px 18px 14px",
                    fontSize: 10, color: C.textFaint,
                    textAlign: "center", letterSpacing: 0.5, fontWeight: 700,
                    textTransform: "uppercase",
                  }}>
                    KOTOR WALLS · {fmtDate(data.order?.paid_at ?? data.order?.created_at)}
                  </div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div style={{ marginTop: 24, display: "flex", justifyContent: "center" }}>
              <button onClick={() => window.print()} className="no-print" style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "12px 24px", background: C.primary, color: "#fff",
                border: "none", borderRadius: 10,
                fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                boxShadow: "0 2px 6px rgba(178,58,58,0.25)",
              }}>
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
                </svg>
                {t.download}
              </button>
            </div>

            {/* Print CSS — sakriva navigaciju, čisti backgrounds, layout za A4 */}
            <style>{`
              @media print {
                body { background: #fff !important; }
                .no-print { display: none !important; }
                @page { size: A4 portrait; margin: 16mm; }
                button { display: none !important; }
              }
            `}</style>
          </>
        )}

        {/* Footer */}
        <div style={{ textAlign: "center", marginTop: 36, color: C.textFaint, fontSize: 11 }}>
          kotorwalls.com · © 2026
        </div>
      </div>
    </div>
  );
}
