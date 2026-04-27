import { useEffect, useState } from "react";
import { SUPABASE_URL } from "./supabaseClient.js";

// ─── Distance Sales Contract page ─────────────────────────────────────────
// Renderuje ugovor na daljinu (MNE Consumer Protection Act 12/2026 čl. 109)
// koji se otvara klikom iz email-a. URL: /ugovor-na-daljinu?order_id=<uuid>
// (ili /ugovor-na-daljinu?session_id=<stripe>)
// ──────────────────────────────────────────────────────────────────────────

const C = {
  primary: "#B23A3A", primaryDark: "#8E2A2A",
  gold:    "#C9A227", goldDark:    "#A8841C", goldSoft: "#FBF2D6",
  bg:      "#F7F8FA", surface:     "#FFFFFF",
  border:  "#E6E8EB", borderSoft:  "#F0F1F4",
  text:    "#1A1F2B", textMuted:   "#4A5363", textSoft: "#6B7684", textFaint: "#9AA3B2",
};

const fmtMoney = (n, cur = "EUR") => {
  const v = Number(n) || 0;
  const sym = cur === "EUR" ? "€" : `${cur} `;
  return `${sym}${v.toFixed(2)}`;
};
const fmtDate = (iso) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-GB", {
      day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
    });
  } catch { return iso; }
};

function readQuery() {
  const search = new URLSearchParams(window.location.search);
  const hashQ  = new URLSearchParams(window.location.hash.split("?")[1] ?? "");
  // Try search first, then hash, then path-segment style /ugovor-na-daljinu/{id}
  const orderId =
    search.get("order_id") ||
    hashQ.get("order_id") ||
    (window.location.pathname.match(/\/ugovor-na-daljinu\/([0-9a-f-]{8,})/i)?.[1]);
  const sessionId = search.get("session_id") || hashQ.get("session_id");
  return { orderId, sessionId };
}

export default function KotorContract() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr]         = useState(null);

  useEffect(() => {
    const { orderId, sessionId } = readQuery();
    if (!orderId && !sessionId) {
      setLoading(false);
      setErr("Missing order_id or session_id in URL");
      return;
    }
    const params = new URLSearchParams();
    if (orderId)        params.set("order_id", orderId);
    else if (sessionId) params.set("session_id", sessionId);
    fetch(`${SUPABASE_URL}/functions/v1/distance-contract?${params}`)
      .then(r => r.json())
      .then(j => { if (j.error) throw new Error(j.error); setData(j); })
      .catch(e => setErr(String(e.message ?? e)))
      .finally(() => setLoading(false));
  }, []);

  // Loading
  if (loading) {
    return (
      <div style={pageStyles.loading}>
        <div style={{ color: C.textSoft, fontSize: 13 }}>Loading contract…</div>
      </div>
    );
  }

  // Error / not found
  if (err || !data?.order) {
    return (
      <div style={pageStyles.loading}>
        <div style={{
          background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: 12, padding: 32, maxWidth: 420, textAlign: "center",
          boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
        }}>
          <h1 style={{ margin: "0 0 8px", fontSize: 18, color: C.text }}>Distance Sales Contract</h1>
          <p style={{ margin: 0, color: C.textSoft, fontSize: 13 }}>{err || "Order not found"}</p>
        </div>
      </div>
    );
  }

  const { order, tickets, seller, legal } = data;
  const orderRef = String(order.id || "").slice(0, 8).toUpperCase();
  const cur      = order.currency || "EUR";
  const total    = Number(order.total) || 0;
  const created  = fmtDate(order.created_at);
  const itemsTotal = (tickets || []).reduce((s, t) => s + (Number(t.price) || 0), 0);

  return (
    <div style={pageStyles.body}>
      {/* Toolbar — sakriva se na print */}
      <div style={pageStyles.toolbar} className="no-print">
        <h1 style={pageStyles.toolbarTitle}>Distance Sales Contract · #{orderRef}</h1>
        <button onClick={() => window.print()} style={pageStyles.printBtn}>
          🖨 Print / Save as PDF
        </button>
      </div>

      <div style={pageStyles.page}>

        {/* Header */}
        <div style={pageStyles.head}>
          <div style={pageStyles.logo}>
            <img
              src="https://hvpytasddzeprgqkwlbu.supabase.co/storage/v1/object/public/razno/kotor.png"
              alt="Kotor Walls"
              style={pageStyles.logoImg}
            />
            <div>
              <div style={pageStyles.logoName}>Kotor Walls</div>
              <div style={pageStyles.logoSub}>UNESCO World Heritage Site</div>
            </div>
          </div>
          <div style={pageStyles.metaRight}>
            <div style={pageStyles.ref}>#{orderRef}</div>
            <div>{created}</div>
          </div>
        </div>

        <h1 style={pageStyles.title}>Distance Sales Contract</h1>
        <div style={pageStyles.subtitle}>Confirmation of contract concluded at a distance</div>

        <div style={pageStyles.legalRef}>
          <strong>Legal basis:</strong> This document constitutes a written confirmation of the
          distance sales contract concluded between the Seller and the Buyer, in accordance with{" "}
          <strong>{legal.article109} of the {legal.act}</strong> ({legal.gazette}).
          It contains all elements required by law and is provided to the Buyer on a durable medium (email).
        </div>

        {/* 1. SELLER */}
        <Section n="1" title="Seller">
          <KV k="Legal name"    v={seller.name} />
          <KV k="Address"       v={seller.address} />
          <KV k="Contact email" v={<a href={`mailto:${seller.email}`} style={{ color: C.primary }}>{seller.email}</a>} />
          <KV k="Website"       v={seller.website} />
        </Section>

        {/* 2. BUYER */}
        <Section n="2" title="Buyer">
          <KV k="Name"  v={order.customer_name  || "—"} />
          <KV k="Email" v={order.customer_email || "—"} />
          {order.customer_phone   && <KV k="Phone"   v={order.customer_phone} />}
          {order.customer_country && <KV k="Country" v={order.customer_country} />}
        </Section>

        {/* 3. SUBJECT */}
        <Section n="3" title="Subject of the Contract">
          <p style={pageStyles.p}>
            Sale of dated entrance tickets for the <strong>Kotor City Walls</strong> (UNESCO World
            Heritage Site, Stari grad Kotor, Montenegro). Each ticket grants single-entry access on
            the day of validity, redeemed by scanning the QR code at the automated entrance gate.
          </p>
          <table style={pageStyles.itemsTable}>
            <thead>
              <tr>
                <th style={pageStyles.th}>#</th>
                <th style={pageStyles.th}>Description</th>
                <th style={pageStyles.th}>Ticket ID (QR)</th>
                <th style={{ ...pageStyles.th, textAlign: "right" }}>Price</th>
              </tr>
            </thead>
            <tbody>
              {(tickets || []).length === 0 ? (
                <tr><td colSpan={4} style={{ ...pageStyles.td, textAlign: "center", color: C.textSoft }}>No items</td></tr>
              ) : tickets.map((t, i) => (
                <tr key={t.id || i}>
                  <td style={pageStyles.td}>{i + 1}</td>
                  <td style={pageStyles.td}>{t.category_name || "Entrance ticket — Kotor City Walls"}</td>
                  <td style={{ ...pageStyles.td, fontFamily: "ui-monospace, Menlo, monospace", fontSize: 11, color: C.textSoft }}>{t.qr_code || "—"}</td>
                  <td style={{ ...pageStyles.td, textAlign: "right" }}>{fmtMoney(t.price, cur)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={pageStyles.summary}>
            <table style={pageStyles.summaryTable}>
              <tbody>
                <tr><td>Subtotal</td><td style={{ textAlign: "right" }}>{fmtMoney(itemsTotal, cur)}</td></tr>
                <tr style={pageStyles.totalRow}>
                  <td>Total paid (incl. VAT where applicable)</td>
                  <td style={{ textAlign: "right" }}>{fmtMoney(total, cur)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Section>

        {/* 4. PAYMENT */}
        <Section n="4" title="Price &amp; Payment">
          <KV k="Total amount"     v={<strong>{fmtMoney(total, cur)}</strong>} />
          <KV k="Currency"         v={cur} />
          <KV k="Payment method"   v="Online card payment (PCI-DSS compliant processor)" />
          <KV k="Payment status"   v={order.payment_status || "Confirmed"} />
          <KV k="Date of contract" v={created} />
          {order.stripe_session_id && (
            <KV k="Transaction ref" v={<span style={{ fontFamily: "ui-monospace, Menlo, monospace", fontSize: 11 }}>{order.stripe_session_id}</span>} />
          )}
        </Section>

        {/* 5. RIGHT OF WITHDRAWAL */}
        <Section n="5" title="Right of Withdrawal — Important Notice">
          <div style={pageStyles.notice}>
            <strong>The 14-day right of withdrawal does NOT apply to this contract.</strong>
            {" "}In accordance with <strong>{legal.article119} of the {legal.act}</strong> ({legal.gazette}),
            the consumer's right to unilaterally withdraw from a distance contract within 14 days
            does not apply to leisure services provided on a specific date. Dated entrance tickets
            to a tourist attraction fall within this exemption and cannot be returned or exchanged
            at the buyer's initiative.
          </div>
          <p style={pageStyles.p}>Refunds are possible only in the following cases:</p>
          <ul style={{ margin: "6px 0 0", paddingLeft: 20, fontSize: 12, color: C.textMuted }}>
            <li>Closure of the attraction by competent authorities</li>
            <li>Force majeure preventing access for more than 24 hours</li>
            <li>Technical fault on the Seller's side preventing valid ticket usage</li>
          </ul>
          <p style={{ ...pageStyles.p, marginTop: 10 }}>
            Refund requests are submitted to{" "}
            <a href={`mailto:${seller.email}`} style={{ color: C.primary }}>{seller.email}</a>
            {" "}with order reference <strong>#{orderRef}</strong>.
          </p>
        </Section>

        {/* 6. COMPLAINTS */}
        <Section n="6" title="Complaints &amp; Out-of-Court Dispute Resolution">
          <p style={pageStyles.p}>
            <strong>Complaints (Art. 27–29 of the {legal.act}):</strong> may be submitted in writing
            to <a href={`mailto:${seller.email}`} style={{ color: C.primary }}>{seller.email}</a>.
            The Seller will respond in writing within <strong>8 days</strong> of receipt. Complaints
            regarding the invoice may be submitted within 8 days from the date of payment.
          </p>
          <p style={pageStyles.p}>
            <strong>Out-of-court dispute resolution:</strong> consumers have the right to refer
            disputes to the Board for Out-of-Court Resolution of Consumer Disputes at the{" "}
            <strong>Chamber of Commerce of Montenegro</strong> (Privredna komora Crne Gore).
          </p>
        </Section>

        {/* 7. APPLICABLE LAW */}
        <Section n="7" title="Applicable Law &amp; Jurisdiction">
          <p style={pageStyles.p}>
            This contract is governed by the laws of Montenegro. Any disputes that cannot be resolved
            amicably or through out-of-court resolution shall fall under the jurisdiction of the
            competent court in Kotor, Montenegro.
          </p>
        </Section>

        {/* 8. DURABLE MEDIUM */}
        <Section n="8" title="Provision on a Durable Medium">
          <p style={pageStyles.p}>
            A copy of this contract together with the QR tickets is delivered to the Buyer's email
            address ({order.customer_email || "—"}) immediately after payment, in accordance with
            Art. 109 paragraph 2 of the {legal.act}. The Buyer may save or print this document at any time.
          </p>
        </Section>

        {/* Signature blocks */}
        <div style={pageStyles.signatures}>
          <div style={pageStyles.sigBox}>
            <div style={pageStyles.sigTitle}>For the Seller</div>
            <div style={pageStyles.sigLine} />
            <div>Opština Kotor</div>
            <div>Authorised representative</div>
          </div>
          <div style={pageStyles.sigBox}>
            <div style={pageStyles.sigTitle}>Buyer (electronic acceptance)</div>
            <div style={pageStyles.sigLine} />
            <div>{order.customer_name || "—"}</div>
            <div>Accepted at: {created}</div>
          </div>
        </div>

        <div style={pageStyles.footerNote}>
          Document generated · #{orderRef} · {new Date().toISOString().slice(0, 10)} ·
          Reference legislation: {legal.act}, {legal.gazette}
        </div>

        {/* Crnogorska sekcija — pravna redundansa */}
        <div style={pageStyles.langSection}>
          <div style={pageStyles.langLabel}>Verzija na crnogorskom jeziku · Pravna redundansa</div>
          <h1 style={{ ...pageStyles.title, fontSize: 18 }}>Ugovor o prodaji na daljinu</h1>
          <p style={pageStyles.p}>
            Ovaj dokument predstavlja pisanu potvrdu ugovora o prodaji na daljinu zaključenog
            između prodavca i kupca, u skladu sa <strong>članom 109 Zakona o zaštiti potrošača
            Crne Gore</strong> (Sl. list CG br. 12/2026). Sadrži sve elemente propisane zakonom
            i dostavlja se kupcu na trajnom nosaču podataka (email).
          </p>
          <KV k="Prodavac"        v="Opština Kotor, Stari grad bb, 85330 Kotor, Crna Gora" />
          <KV k="Kupac"           v={`${order.customer_name || "—"} · ${order.customer_email || "—"}`} />
          <KV k="Predmet"         v={`Ulaznice za Kotorske gradske zidine (${(tickets || []).length} kom.)`} />
          <KV k="Ukupno plaćeno"  v={<strong>{fmtMoney(total, cur)}</strong>} />
          <KV k="Datum ugovora"   v={created} />
          <KV k="Broj narudžbine" v={`#${orderRef}`} />
          <div style={{ ...pageStyles.notice, marginTop: 14 }}>
            <strong>Pravo na raskid (čl. 119 st. 1 t. 12 ZZP CG 12/2026):</strong> Za karte vezane
            za određeni datum ulaska na turističku znamenitost <strong>ne važi</strong> 14-dnevno
            pravo jednostranog raskida ugovora. Karte se ne mogu vratiti ni zamijeniti na ličnu
            inicijativu, osim u slučaju zatvaranja lokacije ili više sile.
          </div>
          <p style={{ ...pageStyles.p, marginTop: 14, fontSize: 11, color: C.textSoft }}>
            Prigovor se podnosi na{" "}
            <a href={`mailto:${seller.email}`} style={{ color: C.primary }}>{seller.email}</a>
            {" "}u roku od 8 dana, a vansudsko rješavanje sporova vrši Odbor pri Privrednoj komori
            Crne Gore.
          </p>
        </div>

      </div>

      {/* Print CSS */}
      <style>{`
        @media print {
          body { background: #fff !important; }
          .no-print { display: none !important; }
          @page { size: A4 portrait; margin: 14mm; }
        }
      `}</style>
    </div>
  );
}

// ─── Helper components ─────────────────────────────────────────────────────
function Section({ n, title, children }) {
  return (
    <section style={{ marginBottom: 24 }}>
      <h2 style={{
        fontSize: 13, fontWeight: 700, color: C.text,
        textTransform: "uppercase", letterSpacing: 0.5,
        margin: "0 0 10px", paddingBottom: 6,
        borderBottom: `1px solid ${C.border}`,
      }}>{n}. {title}</h2>
      {children}
    </section>
  );
}

function KV({ k, v }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: "6px 16px", marginBottom: 8 }}>
      <div style={{ color: C.textSoft, fontSize: 12 }}>{k}</div>
      <div style={{ color: C.text, fontSize: 13 }}>{v}</div>
    </div>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────
const pageStyles = {
  body: {
    margin: 0, background: C.bg,
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    color: C.text, lineHeight: 1.55, fontSize: 14,
    minHeight: "100vh",
  },
  loading: {
    minHeight: "100vh", background: C.bg,
    display: "flex", alignItems: "center", justifyContent: "center",
    fontFamily: "'Inter', system-ui, sans-serif", padding: 20,
  },
  toolbar: {
    position: "sticky", top: 0, background: "#fff",
    borderBottom: `1px solid ${C.border}`, padding: "10px 16px",
    display: "flex", justifyContent: "space-between", alignItems: "center",
    zIndex: 10,
  },
  toolbarTitle: { margin: 0, fontSize: 14, fontWeight: 600, color: C.textMuted, letterSpacing: 0.2 },
  printBtn: {
    background: C.primary, color: "#fff", border: "none",
    padding: "8px 16px", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer",
    fontFamily: "inherit",
  },
  page: {
    maxWidth: 820, margin: "24px auto", background: "#fff",
    padding: "48px 56px", boxShadow: "0 2px 20px rgba(26,31,43,0.06)",
    borderRadius: 8,
  },
  head: {
    display: "flex", justifyContent: "space-between", alignItems: "flex-start",
    borderBottom: `2px solid ${C.text}`, paddingBottom: 18, marginBottom: 28,
  },
  logo: { display: "flex", alignItems: "center", gap: 12 },
  logoImg: { width: 48, height: 48, borderRadius: 8, display: "block", objectFit: "contain" },
  logoName: { fontWeight: 700, fontSize: 16 },
  logoSub:  { fontSize: 11, color: C.textSoft },
  metaRight: { textAlign: "right", fontSize: 11, color: C.textSoft },
  ref: {
    fontFamily: "ui-monospace, Menlo, monospace", fontSize: 13,
    color: C.text, fontWeight: 600, marginBottom: 2,
  },
  title: {
    fontSize: 22, fontWeight: 800, letterSpacing: "-0.4px",
    margin: "0 0 4px", color: C.text,
  },
  subtitle: {
    fontSize: 12, color: C.textSoft, textTransform: "uppercase",
    letterSpacing: 0.6, fontWeight: 600, marginBottom: 24,
  },
  legalRef: {
    background: C.goldSoft, border: `1px solid #EADD9C`, borderRadius: 8,
    padding: "12px 14px", fontSize: 12, color: "#5d4915", marginBottom: 28,
  },
  p: { margin: "0 0 10px", fontSize: 13, color: C.textMuted, lineHeight: 1.55 },
  itemsTable: { width: "100%", borderCollapse: "collapse", marginTop: 6 },
  th: {
    textAlign: "left", fontSize: 11, fontWeight: 700, color: C.textSoft,
    textTransform: "uppercase", letterSpacing: 0.4,
    padding: "8px 10px", background: C.bg, borderBottom: `1px solid ${C.border}`,
  },
  td: { padding: 10, borderBottom: `1px solid ${C.borderSoft}`, fontSize: 13 },
  summary: { display: "flex", justifyContent: "flex-end", marginTop: 14 },
  summaryTable: { fontSize: 13, minWidth: 280 },
  totalRow: {
    fontSize: 15, fontWeight: 800,
  },
  notice: {
    background: C.bg, borderLeft: `3px solid ${C.primary}`,
    padding: "12px 14px", fontSize: 12, color: C.textMuted,
    margin: "8px 0", borderRadius: "0 6px 6px 0",
  },
  signatures: {
    display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40,
    marginTop: 36, paddingTop: 24, borderTop: `1px dashed ${C.border}`,
  },
  sigBox: { fontSize: 11, color: C.textSoft },
  sigTitle: { marginBottom: 8, fontWeight: 600, color: C.text },
  sigLine: { borderBottom: `1px solid ${C.text}`, height: 30, marginBottom: 6 },
  footerNote: {
    marginTop: 32, paddingTop: 16, borderTop: `1px solid ${C.border}`,
    fontSize: 10, color: C.textFaint, textAlign: "center",
  },
  langSection: {
    marginTop: 48, paddingTop: 24, borderTop: `2px solid ${C.text}`,
  },
  langLabel: {
    fontSize: 11, color: C.textSoft, textTransform: "uppercase",
    letterSpacing: 0.6, fontWeight: 600, marginBottom: 14,
  },
};
