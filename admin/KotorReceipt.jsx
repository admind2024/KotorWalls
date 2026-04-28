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

const T = {
  en: {
    title:     "Fiscal Receipt",
    subtitle:  "Tax invoice — Montenegro fiscalization (CIS)",
    seller:    "Seller",
    pib:       "Tax ID",
    buCode:    "Business unit",
    customer:  "Customer",
    email:     "Email",
    items:     "Items",
    qty:       "Qty",
    unit:      "Unit price",
    vat:       "VAT",
    total:     "Total",
    subtotal:  "Subtotal",
    grandTotal:"Grand total",
    iic:       "IIC (Issuer Identification Code)",
    fic:       "FIC (Fiscal Identification Code)",
    ordNum:    "Invoice No.",
    issuedAt:  "Issued",
    tcr:       "TCR",
    verifyCis: "Verify on CIS portal",
    print:     "Print receipt",
    pendingFiscal: "Receipt is being fiscalized…",
    notFiscalized: "This order is not fiscalized.",
    notFound:  "Order not found",
    notFoundSub:"Please check the link or contact support@kotorwalls.com",
    loading:   "Loading…",
    paymentMethod: "Payment method",
    card: "Card",
    cash: "Cash",
    paid:      "Paid",
    note:      "Pursuant to the Law on Fiscalization in Trade in Goods and Services (Official Gazette of Montenegro), this is a valid fiscal invoice. Verify authenticity on the CIS portal using the QR code or IIC.",
  },
  me: {
    title:     "Fiskalni račun",
    subtitle:  "Poreski račun — fiskalizacija CG (CIS)",
    seller:    "Prodavac",
    pib:       "PIB",
    buCode:    "Poslovna jedinica",
    customer:  "Kupac",
    email:     "Email",
    items:     "Stavke",
    qty:       "Kol.",
    unit:      "Jed. cijena",
    vat:       "PDV",
    total:     "Ukupno",
    subtotal:  "Iznos bez PDV-a",
    grandTotal:"Ukupno za naplatu",
    iic:       "IKOF (Identifikacioni kod izdavaoca)",
    fic:       "JIKR (Jedinstveni identifikacioni kod računa)",
    ordNum:    "Br. računa",
    issuedAt:  "Izdato",
    tcr:       "TCR",
    verifyCis: "Provjeri na CIS portalu",
    print:     "Štampaj račun",
    pendingFiscal: "Račun se fiskalizuje…",
    notFiscalized: "Ova narudžbina nije fiskalizovana.",
    notFound:  "Narudžbina nije pronađena",
    notFoundSub:"Provjeri link ili piši na support@kotorwalls.com",
    loading:   "Učitavanje…",
    paymentMethod: "Način plaćanja",
    card: "Kartica",
    cash: "Gotovina",
    paid:      "Plaćeno",
    note:      "U skladu sa Zakonom o fiskalizaciji u prometu proizvoda i usluga (Sl. list CG), ovo je valjan fiskalni račun. Autentičnost možete provjeriti na CIS portalu putem QR koda ili IKOF-a.",
  },
};

const LANGS = [
  { code: "en", label: "EN" },
  { code: "me", label: "ME" },
];

export default function KotorReceipt() {
  const readQuery = () => {
    const search = new URLSearchParams(window.location.search);
    const hashQ  = new URLSearchParams(window.location.hash.split("?")[1] ?? "");
    const merged = new URLSearchParams();
    for (const [k, v] of hashQ) merged.set(k, v);
    for (const [k, v] of search) merged.set(k, v);
    return merged;
  };
  const [query, setQuery] = useState(readQuery);
  useEffect(() => {
    const on = () => setQuery(readQuery());
    window.addEventListener("popstate", on);
    window.addEventListener("hashchange", on);
    return () => {
      window.removeEventListener("popstate", on);
      window.removeEventListener("hashchange", on);
    };
  }, []);

  const orderId = query.get("order") ?? query.get("order_id");

  const [lang, setLang] = useState("me");
  const t = T[lang] ?? T.me;

  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr]         = useState(null);

  useEffect(() => {
    (async () => {
      if (!orderId) { setLoading(false); setErr("missing order"); return; }
      try {
        const url = `${SUPABASE_URL}/functions/v1/kw-view-tickets?order_id=${encodeURIComponent(orderId)}`;
        const res = await fetch(url);
        const body = await res.json();
        if (!res.ok) throw new Error(body.error ?? "load failed");
        setData(body);
        if (body.order?.language && T[body.order.language]) setLang(body.order.language);
      } catch (e) { setErr(String(e.message ?? e)); }
      finally { setLoading(false); }
    })();
  }, [orderId]);

  // ─── Agregiraj tickets po (kategorija, cijena) → stavke računa ─────────────
  const aggregateItems = (tickets) => {
    const map = new Map();
    for (const tk of tickets ?? []) {
      const price = Number(tk.price ?? 0);
      const key = `${tk.category_code}::${price}`;
      const cur = map.get(key);
      if (cur) cur.qty += 1;
      else map.set(key, { name: tk.category_name, code: tk.category_code, price, qty: 1 });
    }
    return Array.from(map.values());
  };

  const fmtDate = (iso) => {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleString("en-GB", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      });
    } catch { return String(iso); }
  };

  // CG fiskalna API "issue_dt" je stringa npr. "2026-04-28T08:11:23+02:00"
  const fmtIssueDt = (s) => {
    if (!s) return "—";
    return fmtDate(s);
  };

  const order   = data?.order   ?? null;
  const tickets = data?.tickets ?? [];

  // Fiscal — koristi server fiscal record ili fallback na order kolone (fiscal_ikof, fiscal_jikr)
  // ako edge funkcija još nije ažurirana ili fiscal_invoices red ne postoji.
  const serverFiscal = data?.fiscal ?? null;
  const fiscal = serverFiscal ?? (
    order?.fiscal_ikof
      ? { ikof: order.fiscal_ikof, jikr: order.fiscal_jikr ?? null }
      : null
  );

  // Seller — server ili default iz CG fiskalne konfiguracije
  const seller = data?.seller ?? {
    seller_name: "—",
    seller_tin: "—",
    business_unit_code: "—",
    business_unit_address: "",
    business_unit_town: "",
    default_vat_rate: 21,
    is_production: false,
  };

  const items = aggregateItems(tickets);

  // Fiskalni status: "fiscalized" / "pending" / "failed" / null
  const fiscalStatus = order?.fiscal_status ?? null;
  const isFiscalized = fiscalStatus === "fiscalized" || !!fiscal?.ikof;

  // VAT računica — fiscal default_vat_rate je INKLUZIVAN (cijene su sa PDV-om)
  const vatRate = Number(seller?.default_vat_rate ?? 21);
  const totalWithVat = Number(order?.total ?? items.reduce((s, i) => s + i.price * i.qty, 0));
  const subtotalNoVat = totalWithVat / (1 + vatRate / 100);
  const vatAmount     = totalWithVat - subtotalNoVat;
  const cur = order?.currency ?? "EUR";
  const fmtMoney = (n) => `${cur === "EUR" ? "€" : cur + " "}${Number(n ?? 0).toFixed(2)}`;

  return (
    <div style={{
      minHeight: "100vh", background: C.bg,
      fontFamily: "'Inter', 'DM Sans', system-ui, sans-serif",
      padding: "24px 14px 60px",
    }}>
      <div style={{ maxWidth: 640, margin: "0 auto" }}>

        {/* Top bar */}
        <div className="no-print" style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          marginBottom: 16,
        }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            fontSize: 13, fontWeight: 700, color: C.text,
          }}>
            <img
              src="https://hvpytasddzeprgqkwlbu.supabase.co/storage/v1/object/public/razno/kotor.png"
              alt="Kotor Walls"
              style={{ width: 28, height: 28, borderRadius: 6, objectFit: "contain", display: "block" }}
            />
            Kotor Walls
          </div>
          <div style={{
            display: "flex", gap: 2, padding: 3, borderRadius: 8,
            background: C.surface, border: `1px solid ${C.border}`,
          }}>
            {LANGS.map(l => (
              <button key={l.code} onClick={() => setLang(l.code)} style={{
                padding: "4px 10px", borderRadius: 5, border: "none",
                background: lang === l.code ? C.primary : "transparent",
                color: lang === l.code ? "#fff" : C.textSoft,
                fontSize: 11, fontWeight: lang === l.code ? 700 : 500,
                cursor: "pointer", fontFamily: "inherit",
              }}>{l.label}</button>
            ))}
          </div>
        </div>

        {loading && (
          <div style={{ textAlign: "center", color: C.textSoft, padding: 40 }}>{t.loading}</div>
        )}

        {!loading && err && (
          <div style={{
            background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`,
            padding: 32, textAlign: "center",
          }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{t.notFound}</div>
            <div style={{ fontSize: 13, color: C.textSoft, marginTop: 6 }}>{t.notFoundSub}</div>
            <div style={{ fontSize: 11, color: C.textFaint, marginTop: 12, fontFamily: "ui-monospace, monospace" }}>{err}</div>
          </div>
        )}

        {!loading && !err && order && (
          <div className="receipt" style={{
            background: C.surface, borderRadius: 14,
            border: `1px solid ${C.border}`,
            boxShadow: "0 4px 18px rgba(26,31,43,0.05)",
            overflow: "hidden",
          }}>
            {/* Gradient stripe */}
            <div style={{ height: 4, background: `linear-gradient(90deg, ${C.gold} 0%, ${C.primary} 100%)` }} />

            <div style={{ padding: "20px 22px" }}>
              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14, gap: 12 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.textFaint, letterSpacing: 0.6, textTransform: "uppercase" }}>
                    KOTOR WALLS
                  </div>
                  <h1 style={{ fontSize: 22, fontWeight: 800, color: C.text, margin: "4px 0 2px", letterSpacing: "-0.3px" }}>
                    {t.title}
                  </h1>
                  <div style={{ fontSize: 12, color: C.textSoft }}>{t.subtitle}</div>
                </div>
                <div style={{
                  background: isFiscalized ? "#E3F3E8" : C.goldSoft,
                  color:      isFiscalized ? "#0F7A3D" : C.goldDark,
                  border:     `1px solid ${isFiscalized ? "#BBECCB" : "#EADD9C"}`,
                  padding: "3px 10px", borderRadius: 999,
                  fontSize: 10, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase",
                  flexShrink: 0,
                }}>
                  {isFiscalized ? "FISCALIZED" : (fiscalStatus === "failed" ? "FAILED" : "PENDING")}
                </div>
              </div>

              {/* Status banner — uvijek vidljiv, jasno opisuje stanje */}
              {!isFiscalized && (
                <div style={{
                  marginBottom: 14, padding: "10px 14px",
                  background: fiscalStatus === "failed" ? C.primarySoft : C.goldSoft,
                  border: `1px solid ${fiscalStatus === "failed" ? "#F3CFCF" : "#EADD9C"}`,
                  color: fiscalStatus === "failed" ? C.primaryDark : C.goldDark,
                  borderRadius: 8, fontSize: 12, fontWeight: 600, lineHeight: 1.5,
                }}>
                  {fiscalStatus === "failed"
                    ? "Fiskalizacija nije uspjela — pokušaj retry iz admin panela."
                    : t.pendingFiscal}
                </div>
              )}

              {/* Seller — uvijek prikazujemo, čak i ako server seller je null */}
              <Section label={t.seller}>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>
                  {seller?.seller_name && seller.seller_name !== "—" ? seller.seller_name : "Opština Kotor / TECONIA MONTENEGRO DOO"}
                </div>
                {seller?.seller_tin && seller.seller_tin !== "—" && <Row k={t.pib} v={seller.seller_tin} mono />}
                {(seller?.business_unit_address || seller?.business_unit_town) && (
                  <Row k={t.buCode} v={`${seller?.business_unit_code ?? ""} · ${seller?.business_unit_address ?? ""} ${seller?.business_unit_town ?? ""}`.trim()} />
                )}
                {fiscal?.tcr_code && <Row k={t.tcr} v={fiscal.tcr_code} mono />}
              </Section>

              {/* Customer — uvijek vidljivo kad je order */}
              <Section label={t.customer}>
                <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>
                  {order.customer_name || "—"}
                </div>
                {order.customer_email && <Row k={t.email} v={order.customer_email} />}
                {order.customer_phone && <Row k="Telefon" v={order.customer_phone} />}
                {order.customer_country && <Row k="Država" v={order.customer_country} />}
              </Section>

              {/* Invoice meta */}
              <Section>
                {fiscal?.invoice_ord_num && (
                  <Row k={t.ordNum}
                       v={`${fiscal.invoice_ord_num} / ${new Date(fiscal.issued_at ?? order.paid_at ?? Date.now()).getFullYear()}`}
                       mono bold />
                )}
                <Row k={t.issuedAt} v={fmtIssueDt(fiscal?.issue_dt ?? fiscal?.issued_at ?? order.paid_at)} />
                <Row k={t.paymentMethod} v={order.channel === "kiosk-cash" ? t.cash : t.card} />
              </Section>

              {/* Items */}
              <div style={{ marginTop: 16, marginBottom: 4 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.textSoft, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 8 }}>
                  {t.items}
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                      <th style={thStyle(C.textMuted)}>{t.items}</th>
                      <th style={{ ...thStyle(C.textMuted), textAlign: "center", width: 50 }}>{t.qty}</th>
                      <th style={{ ...thStyle(C.textMuted), textAlign: "right", width: 90 }}>{t.unit}</th>
                      <th style={{ ...thStyle(C.textMuted), textAlign: "right", width: 90 }}>{t.total}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((it, i) => (
                      <tr key={i} style={{ borderBottom: `1px solid ${C.borderSoft}` }}>
                        <td style={{ padding: "10px 0", color: C.text }}>
                          <div style={{ fontWeight: 600 }}>{it.name}</div>
                          <div style={{ fontSize: 11, color: C.textFaint, fontFamily: "ui-monospace, monospace", marginTop: 2 }}>
                            {it.code}
                          </div>
                        </td>
                        <td style={{ padding: "10px 0", textAlign: "center", color: C.text, fontWeight: 600 }}>{it.qty}</td>
                        <td style={{ padding: "10px 0", textAlign: "right", color: C.textMuted }}>{fmtMoney(it.price)}</td>
                        <td style={{ padding: "10px 0", textAlign: "right", color: C.text, fontWeight: 700 }}>
                          {fmtMoney(it.price * it.qty)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${C.borderSoft}` }}>
                <Row k={t.subtotal}                   v={fmtMoney(subtotalNoVat)} />
                <Row k={`${t.vat} (${vatRate}%)`}     v={fmtMoney(vatAmount)} />
                <div style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.border}`,
                }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: C.text }}>{t.grandTotal}</span>
                  <span style={{ fontSize: 22, fontWeight: 800, color: C.text, letterSpacing: "-0.5px" }}>
                    {fmtMoney(totalWithVat)}
                  </span>
                </div>
              </div>

              {/* Fiscal blok — QR lijevo, IIC/FIC desno, suptilna pozadina */}
              {fiscal?.ikof && (
                <div style={{
                  marginTop: 16,
                  padding: 14,
                  background: C.bg,
                  border: `1px solid ${C.borderSoft}`,
                  borderRadius: 10,
                  display: "flex", gap: 14, alignItems: "flex-start",
                }}>
                  {/* QR — lijevo, kompaktan ali skenabilan */}
                  {fiscal.qr_url && (
                    <a
                      href={fiscal.qr_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={t.verifyCis}
                      style={{
                        flexShrink: 0, width: 110, height: 110,
                        background: "#fff", border: `1px solid ${C.border}`,
                        borderRadius: 8, padding: 5,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}
                    >
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(fiscal.qr_url)}`}
                        alt="CIS verify QR"
                        style={{ width: "100%", height: "100%", objectFit: "contain" }}
                      />
                    </a>
                  )}

                  {/* IIC/FIC + verify link — desno */}
                  <div style={{ flex: 1, minWidth: 0, display: "grid", gap: 8 }}>
                    <div>
                      <div style={{ fontSize: 9, fontWeight: 700, color: C.textSoft, letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 2 }}>
                        IIC
                      </div>
                      <div style={{ fontSize: 11, color: C.text, fontFamily: "ui-monospace, monospace", wordBreak: "break-all", lineHeight: 1.4 }}>
                        {fiscal.ikof}
                      </div>
                    </div>
                    {fiscal.jikr && (
                      <div>
                        <div style={{ fontSize: 9, fontWeight: 700, color: C.textSoft, letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 2 }}>
                          FIC
                        </div>
                        <div style={{ fontSize: 11, color: C.text, fontFamily: "ui-monospace, monospace", wordBreak: "break-all", lineHeight: 1.4 }}>
                          {fiscal.jikr}
                        </div>
                      </div>
                    )}
                    {fiscal.qr_url && (
                      <a
                        href={fiscal.qr_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          fontSize: 10, color: C.textMuted,
                          textDecoration: "none", fontWeight: 600,
                          letterSpacing: 0.3,
                        }}
                      >
                        {t.verifyCis} →
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Legal note */}
              <div style={{
                marginTop: 14,
                fontSize: 10.5, color: C.textSoft, lineHeight: 1.55,
                fontStyle: "italic",
              }}>
                {t.note}
              </div>
            </div>
          </div>
        )}

        {/* Print button */}
        {!loading && !err && order && (
          <div className="no-print" style={{ marginTop: 18, display: "flex", justifyContent: "center" }}>
            <button onClick={() => window.print()} style={{
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
              {t.print}
            </button>
          </div>
        )}

        <div style={{ textAlign: "center", marginTop: 30, color: C.textFaint, fontSize: 11 }}>
          kotorwalls.com · © 2026
        </div>
      </div>

      <style>{`
        @media print {
          html, body {
            background: #fff !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .no-print { display: none !important; }
          @page {
            size: A4 portrait;
            margin: 12mm;
          }
          .receipt {
            box-shadow: none !important;
            border: 1px solid #ddd !important;
            page-break-inside: avoid;
            break-inside: avoid;
          }
          /* Sažima vertikalna razmaka da sve stane na jednu stranu */
          .receipt > div:last-child > * { margin-top: 8px !important; padding-top: 8px !important; }
          .receipt h1 { font-size: 18px !important; }
        }
      `}</style>
    </div>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────────
function Section({ label, children }) {
  return (
    <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${C.borderSoft}` }}>
      {label && (
        <div style={{
          fontSize: 10, fontWeight: 700, color: C.textSoft,
          letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 6,
        }}>
          {label}
        </div>
      )}
      {children}
    </div>
  );
}

function Row({ k, v, mono = false, small = false, bold = false }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", gap: 10,
      padding: "3px 0", fontSize: small ? 11 : 12,
    }}>
      <span style={{ color: C.textSoft, flexShrink: 0 }}>{k}</span>
      <span style={{
        color: C.text,
        fontWeight: bold ? 700 : 500,
        fontFamily: mono ? "ui-monospace, monospace" : "inherit",
        textAlign: "right",
        wordBreak: "break-all",
      }}>
        {v}
      </span>
    </div>
  );
}

function thStyle(color) {
  return {
    padding: "8px 0",
    textAlign: "left",
    fontSize: 10,
    fontWeight: 700,
    color,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  };
}
