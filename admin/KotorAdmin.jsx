import { useState, useEffect, useMemo } from "react";
import { rest, callEdge, getStripeMode, setStripeMode } from "./supabaseClient.js";

// ─── Palette (Kotor grb — crvena + zlatna, na svijetloj podlozi) ──────────────
const C = {
  bg:         "#F7F8FA",
  surface:    "#FFFFFF",
  border:     "#E6E8EB",
  borderSoft: "#F0F1F4",
  text:       "#1A1F2B",
  textMuted:  "#4A5363",
  textSoft:   "#6B7684",
  textFaint:  "#9AA3B2",

  primary:      "#B23A3A",
  primaryDark:  "#8E2A2A",
  primarySoft:  "#FBE9E9",

  gold:         "#C9A227",
  goldDark:     "#A8841C",
  goldSoft:     "#FBF2D6",

  success:     "#2F7D4F",
  successSoft: "#E3F3E8",
  warning:     "#C98015",
  warningSoft: "#FBF0DC",
  danger:      "#B23A3A",
  dangerSoft:  "#FBE9E9",
  info:        "#8A7866",
  infoSoft:    "#F1ECE1",

  chip:        "#F7F8FA",
};

// ─── Icons ────────────────────────────────────────────────────────────────────
const Ico = ({ d, size = 16 }) => (
  <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d={d} />
  </svg>
);
const I = {
  home:      "M3 12l9-9 9 9M5 10v10a1 1 0 001 1h4v-6h4v6h4a1 1 0 001-1V10",
  ticket:    "M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z",
  cat:       "M4 6h16M4 12h10M4 18h7",
  tx:        "M7 16l-4-4m0 0l4-4m-4 4h18M17 8l4 4m0 0l-4 4m4-4H3",
  refund:    "M3 10h10a5 5 0 015 5v1M3 10l4-4M3 10l4 4",
  user:      "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
  channel:   "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z",
  kiosk:     "M5 3h14v14H5zM9 21h6M12 17v4",
  gate:      "M3 20V10l9-6 9 6v10M3 20h18M10 20v-6h4v6",
  pay:       "M3 10h18M5 6h14a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z",
  fraud:     "M12 2l9 4v6c0 5-4 9-9 10-5-1-9-5-9-10V6l9-4zM9 12l2 2 4-4",
  fiscal:    "M9 12h6m-6 4h6m-7 5h8a2 2 0 002-2V5a2 2 0 00-2-2h-5.6a1 1 0 00-.7.3L7.3 6.6a1 1 0 00-.3.7V19a2 2 0 002 2z",
  report:    "M9 19v-6H5v6M9 13V9h4v10M13 9V5h4v14",
  audit:     "M9 5h6m-6 4h6m-6 4h4m-7 7h12a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z",
  api:       "M10 20l4-16m4 4l4 4-4 4M6 8l-4 4 4 4",
  webhook:   "M14 10l-5 5m5-5a4 4 0 10-6 0m6 0l5-5m-11 5a4 4 0 100 6m0-6l-5 5m5 1a4 4 0 106 0",
  users:     "M17 20h5v-2a4 4 0 00-3-4m-6 6H2v-2a4 4 0 014-4h4a4 4 0 014 4v2zM8 12a4 4 0 110-8 4 4 0 010 8zm10-4a3 3 0 11-6 0 3 3 0 016 0z",
  settings:  "M10.3 3.6a2 2 0 013.4 0l.6 1a2 2 0 002.2 1l1.1-.3a2 2 0 012.4 2.4l-.3 1a2 2 0 001 2.2l1 .6a2 2 0 010 3.4l-1 .6a2 2 0 00-1 2.2l.3 1a2 2 0 01-2.4 2.4l-1.1-.3a2 2 0 00-2.2 1l-.6 1a2 2 0 01-3.4 0l-.6-1a2 2 0 00-2.2-1l-1.1.3a2 2 0 01-2.4-2.4l.3-1a2 2 0 00-1-2.2l-1-.6a2 2 0 010-3.4l1-.6a2 2 0 001-2.2l-.3-1a2 2 0 012.4-2.4l1.1.3a2 2 0 002.2-1l.6-1zM15 12a3 3 0 11-6 0 3 3 0 016 0z",
  search:    "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
  bell:      "M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5m6 0a3 3 0 11-6 0",
  plus:      "M12 5v14m-7-7h14",
  down:      "M19 9l-7 7-7-7",
  export:    "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1M8 12l4 4 4-4M12 16V4",
  filter:    "M3 4h18M6 10h12M10 16h4",
  more:      "M12 5v.01M12 12v.01M12 19v.01",
  check:     "M5 13l4 4L19 7",
  close:     "M6 6l12 12M18 6L6 18",
  up:        "M7 17L17 7M17 7H9M17 7v8",
  edit:      "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.4-9.4a2 2 0 112.8 2.8L11.8 15.8 8 17l1.2-3.8 9.4-9.4z",
  clock:     "M12 8v4l3 2m6-2a9 9 0 11-18 0 9 9 0 0118 0z",
  dot:       "M12 12m-3 0a3 3 0 106 0a3 3 0 10-6 0",
  link:      "M10 14a5 5 0 007.1 0l3-3a5 5 0 00-7.1-7.1l-1.7 1.7M14 10a5 5 0 00-7.1 0l-3 3a5 5 0 007.1 7.1l1.7-1.7",
};

// ─── Podaci ───────────────────────────────────────────────────────────────────
// Svi podaci dolaze iz Supabase-a (projekat: etiketing-me).
// Prazni nizovi = prazna stanja dok ne postoje podaci u bazi.
const RECENT_TICKETS = [];
const CATEGORIES = [];
const CHANNELS = [
  { key: "web",     name: "Web",                 icon: I.channel, today: 0, pct: 0, live: true  },
  { key: "widget",  name: "Embed widget",        icon: I.channel, today: 0, pct: 0, live: true  },
  { key: "kiosk",   name: "Samouslužni kiosci",  icon: I.kiosk,   today: 0, pct: 0, live: false },
  { key: "pos",     name: "POS / blagajna",      icon: I.pay,     today: 0, pct: 0, live: false },
  { key: "onboard", name: "Onboard / brodovi",   icon: I.channel, today: 0, pct: 0, live: false },
  { key: "partner", name: "Booking / GYG",       icon: I.link,    today: 0, pct: 0, live: false },
];
const KIOSKS    = [];
const GATES     = [];
const BIN_RULES = [];
const USERS     = [];

// ─── Primitives ───────────────────────────────────────────────────────────────
const card = {
  background: C.surface,
  border: `1px solid ${C.border}`,
  borderRadius: 10,
  boxShadow: "0 1px 2px rgba(16,24,40,0.04)",
};

function Badge({ tone = "neutral", children }) {
  const map = {
    neutral: { bg: C.chip,        fg: C.textMuted, bd: C.border },
    success: { bg: C.successSoft, fg: "#0F7A3D",   bd: "#BBECCB" },
    warning: { bg: C.warningSoft, fg: "#8A5A00",   bd: "#F5DCA8" },
    danger:  { bg: C.dangerSoft,  fg: "#A21432",   bd: "#F5B8C4" },
    info:    { bg: C.infoSoft,    fg: "#00509D",   bd: "#B8DAFB" },
    brand:   { bg: C.goldSoft, fg: C.goldDark, bd: "#EADD9C" },
  };
  const s = map[tone];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      fontSize: 11, fontWeight: 600, padding: "2px 8px",
      borderRadius: 999, background: s.bg, color: s.fg,
      border: `1px solid ${s.bd}`, letterSpacing: 0.1,
    }}>{children}</span>
  );
}

function Btn({ children, variant = "primary", onClick, icon, size = "md" }) {
  const [hov, setHov] = useState(false);
  const sz = size === "sm"
    ? { padding: "6px 10px", fontSize: 12 }
    : { padding: "8px 14px", fontSize: 13 };
  const styles = {
    primary: {
      background: hov ? C.primaryDark : C.primary,
      color: "#fff", border: `1px solid ${hov ? C.primaryDark : C.primary}`,
      boxShadow: "0 1px 2px rgba(99,91,255,0.25)",
    },
    secondary: {
      background: hov ? C.bg : C.surface,
      color: C.text, border: `1px solid ${C.border}`,
    },
    ghost: {
      background: hov ? C.bg : "transparent",
      color: C.textMuted, border: "1px solid transparent",
    },
    danger: {
      background: hov ? "#C41537" : C.danger,
      color: "#fff", border: `1px solid ${hov ? "#C41537" : C.danger}`,
    },
  };
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        ...sz, ...styles[variant],
        display: "inline-flex", alignItems: "center", gap: 6,
        borderRadius: 7, fontWeight: 600, cursor: "pointer",
        fontFamily: "inherit", transition: "background 0.12s, border-color 0.12s",
        whiteSpace: "nowrap",
      }}>
      {icon && <Ico d={icon} size={14} />}
      {children}
    </button>
  );
}

function Stat({ label, value, delta, tone = "success", sub }) {
  return (
    <div style={{ ...card, padding: 18 }}>
      <div style={{ fontSize: 12, color: C.textSoft, fontWeight: 500, marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700, color: C.text, letterSpacing: "-0.5px", lineHeight: 1 }}>{value}</div>
      {sub && (
        <div style={{ marginTop: 8, fontSize: 11, color: C.textFaint, fontWeight: 500 }}>{sub}</div>
      )}
      {delta && (
        <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 6 }}>
          <Badge tone={tone}>
            <Ico d={tone === "success" ? I.up : I.down} size={11} /> {delta}
          </Badge>
          <span style={{ fontSize: 12, color: C.textFaint }}>vs. juče</span>
        </div>
      )}
    </div>
  );
}

function SectionHead({ title, sub, actions }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
      <div>
        <div style={{ fontSize: 18, fontWeight: 700, color: C.text, letterSpacing: "-0.2px" }}>{title}</div>
        {sub && <div style={{ fontSize: 13, color: C.textSoft, marginTop: 2 }}>{sub}</div>}
      </div>
      {actions && <div style={{ display: "flex", gap: 8 }}>{actions}</div>}
    </div>
  );
}

function SearchBar({ placeholder = "Pretraga…" }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8,
      padding: "7px 10px", border: `1px solid ${C.border}`,
      borderRadius: 7, background: C.surface, minWidth: 240,
    }}>
      <span style={{ color: C.textFaint, display: "flex" }}><Ico d={I.search} size={15} /></span>
      <input placeholder={placeholder} style={{
        border: "none", outline: "none", fontSize: 13, color: C.text,
        fontFamily: "inherit", width: "100%", background: "transparent",
      }} />
    </div>
  );
}

function Table({ head, children }) {
  return (
    <div style={{ ...card, overflow: "hidden" }}>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: C.bg }}>
              {head.map(h => (
                <th key={h} style={{
                  padding: "10px 18px", textAlign: "left",
                  fontSize: 11, fontWeight: 600, color: C.textSoft,
                  letterSpacing: "0.4px", textTransform: "uppercase",
                  borderBottom: `1px solid ${C.border}`,
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      </div>
    </div>
  );
}

const td = { padding: "12px 18px", fontSize: 13, color: C.text, borderBottom: `1px solid ${C.borderSoft}` };

function Empty({ icon = I.ticket, title = "Nema podataka", sub = "Podaci će se pojaviti nakon prvih unosa." }) {
  return (
    <div style={{ ...card, padding: 48, textAlign: "center" }}>
      <div style={{
        width: 52, height: 52, borderRadius: 12, margin: "0 auto 14px",
        background: C.primarySoft, color: C.primary,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Ico d={icon} size={22} />
      </div>
      <div style={{ fontSize: 15, fontWeight: 600, color: C.text }}>{title}</div>
      <div style={{ fontSize: 13, color: C.textSoft, marginTop: 6, maxWidth: 320, margin: "6px auto 0", lineHeight: 1.5 }}>{sub}</div>
    </div>
  );
}

// ─── Panels ───────────────────────────────────────────────────────────────────
function Overview() {
  const [reports, setReports] = useState(null);
  const [recent,  setRecent]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  const load = async () => {
    setLoading(true); setErr(null);
    try {
      const [rep, tx] = await Promise.all([
        callEdge("admin-reports",      { range: "30d" }),
        callEdge("admin-transactions", { limit: 8 }),
      ]);
      setReports(rep);
      // admin-transactions vraća { transactions: [...] } sa attached refunds
      // niz na svakom — koristimo to da označimo refundirane.
      setRecent(tx?.transactions ?? tx?.rows ?? []);
    } catch (e) { setErr(String(e.message ?? e)); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  // KPI iz reports
  const summary = reports?.summary ?? {};
  const hourly  = reports?.hourly_today ?? [];
  const todayOrders  = hourly.reduce((s, h) => s + (h.orders  ?? 0), 0);
  const todayRevenue = hourly.reduce((s, h) => s + (h.revenue ?? 0), 0);
  const monthOrders  = summary.orders_count ?? 0;
  const monthRevenueGross = summary.revenue_gross ?? 0;
  const monthRevenueNet   = summary.revenue_net   ?? 0;
  const refundsCount = summary.refunds_count ?? 0;
  const refundsTotal = summary.refunds_total ?? 0;
  const avgPerDay    = Math.round((monthOrders / 30) * 10) / 10;

  // Channels iz sales_by_channel — mapiraj na CHANNELS metadata
  const channelMap = new Map((reports?.sales_by_channel ?? []).map(c => [c.key, c]));
  const channelsLive = CHANNELS.map(c => {
    const r = channelMap.get(c.key);
    return { ...c, today: r?.count ?? 0, sum: r?.sum ?? 0 };
  });
  const maxToday = Math.max(1, ...channelsLive.map(c => c.today));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <SectionHead
        title="Pregled"
        sub={loading ? "Učitavanje…" : "Posljednjih 30 dana · uživo iz baze"}
        actions={<Btn variant="secondary" icon={I.refresh} size="sm" onClick={load}>Osvježi</Btn>}
      />

      {err && (
        <div style={{ padding: "10px 14px", background: C.primarySoft, border: `1px solid ${C.border}`, borderRadius: 8, color: C.primaryDark, fontSize: 12 }}>
          {err}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 12 }}>
        <Stat label="Prodaje danas"    value={String(todayOrders)} />
        <Stat label="Prihod danas"     value={`€${Number(todayRevenue).toFixed(2)}`} />
        <Stat label="Plaćene narudžbe / 30 dana" value={String(monthOrders)} />
        <Stat
          label="Net prihod / 30 dana"
          value={`€${Number(monthRevenueNet).toFixed(2)}`}
          sub={refundsCount > 0
            ? `bruto €${Number(monthRevenueGross).toFixed(2)} − ${refundsCount} refund(a) €${Number(refundsTotal).toFixed(2)}`
            : `bruto = net (nema refunda)`}
        />
        <Stat label="Prosjek / dan"    value={String(avgPerDay)} />
      </div>

      {/* Channels snapshot + Recent */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 18 }}>
        <div style={{ ...card, overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: `1px solid ${C.borderSoft}`, fontSize: 14, fontWeight: 600, color: C.text }}>
            Kanali prodaje · 30 dana
          </div>
          <div style={{ padding: "6px 0" }}>
            {channelsLive.map(c => (
              <div key={c.key} style={{ display: "flex", alignItems: "center", padding: "10px 18px", gap: 12 }}>
                <div style={{ width: 28, height: 28, borderRadius: 7, background: C.primarySoft, color: C.primaryDark, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Ico d={c.icon} size={14} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: C.text, fontWeight: 500 }}>{c.name}</div>
                  <div style={{ marginTop: 5, height: 4, background: C.bg, borderRadius: 4 }}>
                    <div style={{ height: "100%", width: `${(c.today / maxToday) * 100}%`, background: c.live ? C.primary : C.textFaint, borderRadius: 4 }} />
                  </div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.text, width: 50, textAlign: "right" }}>{c.today}</div>
                {!c.live && <Badge tone="warning">soon</Badge>}
              </div>
            ))}
          </div>
        </div>

        <div style={{ ...card, overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: `1px solid ${C.borderSoft}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>Posljednje transakcije</div>
            <Badge tone="brand">Live</Badge>
          </div>
          {loading ? (
            <div style={{ padding: "40px 18px", textAlign: "center", color: C.textSoft, fontSize: 13 }}>Učitavanje…</div>
          ) : recent.length === 0 ? (
            <div style={{ padding: "40px 18px", textAlign: "center", color: C.textSoft, fontSize: 13 }}>
              Još nema transakcija.
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                {recent.slice(0, 8).map((t, i) => {
                  const time = t.created_at ? new Date(t.created_at).toLocaleTimeString("sr-ME", { hour: "2-digit", minute: "2-digit" }) : "—";
                  const amount = Number(t.amount ?? 0);
                  const status = t.status ?? "—";
                  // Refundirana? — admin-transactions attach-uje niz refunds[]
                  // na svaku transakciju. Ako ima makar jedan refund sa
                  // statusom succeeded, transakcija se vizuelno označava
                  // kao refundirana (umjesto da pokazuje "succeeded").
                  const refundedSum = (t.refunds ?? []).filter(r => r.status === "succeeded")
                    .reduce((s, r) => s + Number(r.amount ?? 0), 0);
                  const isFullRefund    = refundedSum >= amount - 0.01 && refundedSum > 0;
                  const isPartialRefund = refundedSum > 0 && !isFullRefund;
                  const displayStatus =
                    isFullRefund    ? "refunded"
                  : isPartialRefund ? "partial refund"
                  : status;
                  const tone =
                    isFullRefund    ? "warning"
                  : isPartialRefund ? "warning"
                  : status === "succeeded" ? "success"
                  : status === "failed"    ? "danger" : "neutral";
                  return (
                    <tr key={t.id || i} style={{ borderBottom: i < recent.length - 1 ? `1px solid ${C.borderSoft}` : "none" }}>
                      <td style={{ padding: "10px 18px", fontSize: 12, fontFamily: "ui-monospace, monospace", color: C.primaryDark, fontWeight: 600 }}>
                        {(t.stripe_pi_id || t.id || "").toString().slice(-10)}
                      </td>
                      <td style={{ padding: "10px 18px", fontSize: 12, color: C.textMuted }}>
                        {t.brand ? `${t.brand} •••• ${t.last4 ?? "—"}` : (t.method ?? "card")}
                      </td>
                      <td style={{ padding: "10px 18px", fontSize: 12, color: C.textSoft, fontFamily: "ui-monospace, monospace" }}>{time}</td>
                      <td style={{ padding: "10px 18px", fontSize: 13, fontWeight: 700, color: isFullRefund ? C.textSoft : C.text, textDecoration: isFullRefund ? "line-through" : "none" }}>
                        €{amount.toFixed(2)}
                        {refundedSum > 0 && (
                          <div style={{ fontSize: 10, color: C.primaryDark, fontWeight: 500 }}>−€{refundedSum.toFixed(2)}</div>
                        )}
                      </td>
                      <td style={{ padding: "10px 18px", textAlign: "right" }}>
                        <Badge tone={tone}>{displayStatus}</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function TicketsPanel() {
  const [cats, setCats]     = useState([]);
  const [issued, setIssued] = useState([]);
  const [loading, setLoad]  = useState(true);
  const [err, setErr]       = useState(null);
  const [editing, setEditing] = useState(null);

  const load = async () => {
    setLoad(true); setErr(null);
    try {
      const [c, t] = await Promise.all([
        rest("kotorwalls_ticket_categories?select=*&order=sort_order.asc,code.asc"),
        rest("kotorwalls_tickets?select=id,qr_code,category_name,price,status,issued_at,language,order_id&order=issued_at.desc&limit=50"),
      ]);
      setCats(c ?? []);
      setIssued(t ?? []);
    } catch (e) { setErr(String(e.message ?? e)); }
    finally { setLoad(false); }
  };
  useEffect(() => { load(); }, []);

  const remove = async (id) => {
    if (!confirm("Obriši vrstu ulaznice?")) return;
    try { await rest(`kotorwalls_ticket_categories?id=eq.${id}`, { method: "DELETE" }); load(); }
    catch (e) { alert(e.message); }
  };
  const toggle = async (row) => {
    try {
      await rest(`kotorwalls_ticket_categories?id=eq.${row.id}`, {
        method: "PATCH", body: JSON.stringify({ active: !row.active }),
      });
      load();
    } catch (e) { alert(e.message); }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      {/* Vrste ulaznica */}
      <div>
        <SectionHead
          title="Vrste ulaznica"
          sub={<>Naziv i cijena svake vrste karte — snima se u tabelu <code style={{ fontFamily: "ui-monospace, monospace", background: C.bg, padding: "1px 6px", borderRadius: 4, fontSize: 12 }}>kotorwalls_ticket_categories</code></>}
          actions={<Btn icon={I.plus} size="sm" onClick={() => setEditing({})}>Nova ulaznica</Btn>}
        />
        {err && <div style={{ ...card, padding: 14, color: C.danger, marginBottom: 12 }}>{err}</div>}
        {loading ? (
          <div style={{ ...card, padding: 30, textAlign: "center", color: C.textSoft }}>Učitavanje…</div>
        ) : cats.length === 0 ? (
          <Empty icon={I.ticket} title="Nema vrsta ulaznica" sub='Klikni "Nova ulaznica" da dodaš prvu — naziv, cijena i kod.' />
        ) : (
          <Table head={["Naziv", "Kod", "Cijena", "Kvantitet", "Status", ""]}>
            {cats.map(r => (
              <tr key={r.id}>
                <td style={{ ...td, fontWeight: 600 }}>{r.name_i18n?.me ?? r.name_i18n?.en ?? r.code}</td>
                <td style={{ ...td, fontFamily: "ui-monospace, monospace", color: C.textMuted }}>{r.code}</td>
                <td style={{ ...td, fontWeight: 700 }}>€{Number(r.price).toFixed(2)}</td>
                <td style={td}>{r.quantity ?? "∞"}</td>
                <td style={td}>
                  <button onClick={() => toggle(r)} style={{ border: "none", background: "transparent", padding: 0, cursor: "pointer" }}>
                    <Badge tone={r.active ? "success" : "neutral"}>{r.active ? "aktivna" : "neaktivna"}</Badge>
                  </button>
                </td>
                <td style={{ ...td, textAlign: "right" }}>
                  <Btn variant="ghost" icon={I.edit} size="sm" onClick={() => setEditing(r)}>Izmjeni</Btn>
                  <Btn variant="ghost" size="sm" onClick={() => remove(r.id)}>Obriši</Btn>
                </td>
              </tr>
            ))}
          </Table>
        )}
      </div>

      {/* Izdate karte */}
      <div>
        <SectionHead
          title="Izdate karte"
          sub={<>Svaka plaćena kupovina = karta sa QR kodom. Tabela <code style={{ fontFamily: "ui-monospace, monospace", background: C.bg, padding: "1px 6px", borderRadius: 4, fontSize: 12 }}>kotorwalls_tickets</code></>}
          actions={<>
            <SearchBar placeholder="QR kod, kategorija…" />
            <Btn variant="secondary" icon={I.export} size="sm">Izvezi</Btn>
          </>}
        />
        {loading ? null : issued.length === 0 ? (
          <Empty icon={I.ticket} title="Još nema izdatih karata" sub="Kada prvi kupac završi kupovinu, karte će se pojaviti ovdje sa QR kodom i statusom." />
        ) : (
          <Table head={["QR kod", "Vrsta", "Cijena", "Jezik", "Izdata", "Status"]}>
            {issued.map(t0 => (
              <tr key={t0.id}>
                <td style={{ ...td, fontFamily: "ui-monospace, monospace", color: C.primaryDark, fontWeight: 600, fontSize: 12 }}>{t0.qr_code}</td>
                <td style={td}>{t0.category_name}</td>
                <td style={{ ...td, fontWeight: 700 }}>€{Number(t0.price).toFixed(2)}</td>
                <td style={td}><Badge>{(t0.language ?? "en").toUpperCase()}</Badge></td>
                <td style={{ ...td, color: C.textSoft, fontSize: 12 }}>{t0.issued_at ? new Date(t0.issued_at).toLocaleString() : "—"}</td>
                <td style={td}>
                  <Badge tone={t0.status === "valid" ? "success" : t0.status === "used" ? "neutral" : t0.status === "refunded" ? "danger" : "warning"}>{t0.status}</Badge>
                </td>
              </tr>
            ))}
          </Table>
        )}
      </div>

      {editing !== null && (
        <CategoryModal row={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />
      )}
    </div>
  );
}

function Categories() {
  const [rows, setRows]   = useState([]);
  const [loading, setLoad] = useState(true);
  const [err, setErr]      = useState(null);
  const [editing, setEditing] = useState(null); // null = closed, {} = new, {row} = edit

  const load = async () => {
    setLoad(true); setErr(null);
    try {
      const data = await rest("kotorwalls_ticket_categories?select=*&order=sort_order.asc,code.asc");
      setRows(data ?? []);
    } catch (e) { setErr(String(e.message ?? e)); }
    finally { setLoad(false); }
  };
  useEffect(() => { load(); }, []);

  const remove = async (id) => {
    if (!confirm("Obriši kategoriju?")) return;
    try {
      await rest(`kotorwalls_ticket_categories?id=eq.${id}`, { method: "DELETE" });
      load();
    } catch (e) { alert(e.message); }
  };

  const toggle = async (row) => {
    try {
      await rest(`kotorwalls_ticket_categories?id=eq.${row.id}`, {
        method: "PATCH",
        body: JSON.stringify({ active: !row.active }),
      });
      load();
    } catch (e) { alert(e.message); }
  };

  return (
    <div>
      <SectionHead
        title="Kategorije karata"
        sub="Tipovi, cijene i dostupnost — promjene se odmah primjenjuju na widget"
        actions={<Btn icon={I.plus} size="sm" onClick={() => setEditing({})}>Nova kategorija</Btn>}
      />

      {err && <div style={{ ...card, padding: 14, color: C.danger, marginBottom: 12 }}>{err}</div>}

      {loading ? (
        <div style={{ ...card, padding: 40, textAlign: "center", color: C.textSoft }}>Učitavanje…</div>
      ) : rows.length === 0 ? (
        <Empty icon={I.cat} title="Nema kategorija" sub='Dodaj prvu kategoriju klikom na "Nova kategorija". Unesi naziv, kod i cijenu.' />
      ) : (
        <Table head={["Naziv", "Kod", "Cijena", "Kvantitet", "Status", ""]}>
          {rows.map(r => (
            <tr key={r.id}>
              <td style={{ ...td, fontWeight: 600 }}>{r.name_i18n?.me ?? r.name_i18n?.en ?? r.code}</td>
              <td style={{ ...td, fontFamily: "ui-monospace, monospace", color: C.textMuted }}>{r.code}</td>
              <td style={{ ...td, fontWeight: 700 }}>€{Number(r.price).toFixed(2)}</td>
              <td style={td}>{r.quantity ?? "∞"}</td>
              <td style={td}>
                <button onClick={() => toggle(r)} style={{ border: "none", background: "transparent", padding: 0, cursor: "pointer" }}>
                  <Badge tone={r.active ? "success" : "neutral"}>{r.active ? "aktivna" : "neaktivna"}</Badge>
                </button>
              </td>
              <td style={{ ...td, textAlign: "right" }}>
                <Btn variant="ghost" icon={I.edit} size="sm" onClick={() => setEditing(r)}>Izmjeni</Btn>
                <Btn variant="ghost" size="sm" onClick={() => remove(r.id)}>Obriši</Btn>
              </td>
            </tr>
          ))}
        </Table>
      )}

      {editing !== null && (
        <CategoryModal row={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />
      )}
    </div>
  );
}

function CategoryModal({ row, onClose, onSaved }) {
  const isNew = !row?.id;
  const [code, setCode]       = useState(row?.code ?? "");
  const [name, setName]       = useState(row?.name_i18n?.me ?? row?.name_i18n?.en ?? "");
  const [nameEn, setNameEn]   = useState(row?.name_i18n?.en ?? "");
  const [sublabel, setSublabel] = useState(row?.sublabel_i18n?.me ?? "");
  const [price, setPrice]     = useState(row?.price ?? "");
  const [quantity, setQuantity] = useState(row?.quantity ?? "");
  const [active, setActive]   = useState(row?.active ?? true);
  const [err, setErr]         = useState(null);
  const [saving, setSaving]   = useState(false);

  const save = async () => {
    setErr(null); setSaving(true);
    try {
      const cleanCode = code.trim().toLowerCase().replace(/\s+/g, "-");
      if (!cleanCode) { setErr("Kod je obavezan (npr. adult, child, standard)."); setSaving(false); return; }
      if (!(name || nameEn)) { setErr("Naziv je obavezan."); setSaving(false); return; }
      if (!price || Number(price) <= 0) { setErr("Cijena mora biti veća od 0."); setSaving(false); return; }

      const payload = {
        code: cleanCode,
        name_i18n: { me: name || nameEn, en: nameEn || name },
        sublabel_i18n: sublabel ? { me: sublabel, en: sublabel } : null,
        price: Number(price),
        quantity: quantity === "" ? null : Number(quantity),
        active,
      };
      if (isNew) {
        await rest("kotorwalls_ticket_categories", { method: "POST", body: JSON.stringify(payload) });
      } else {
        await rest(`kotorwalls_ticket_categories?id=eq.${row.id}`, { method: "PATCH", body: JSON.stringify(payload) });
      }
      onSaved();
    } catch (e) { setErr(String(e.message ?? e)); }
    finally { setSaving(false); }
  };

  const field = { fontSize: 13, color: C.textMuted, fontWeight: 500, marginBottom: 5, display: "block" };
  const input = {
    width: "100%", padding: "9px 11px", borderRadius: 7,
    border: `1px solid ${C.border}`, fontSize: 13, color: C.text,
    fontFamily: "inherit", outline: "none", background: C.surface,
  };

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(26,31,43,0.5)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 1000, padding: 20,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        ...card, padding: 24, width: "100%", maxWidth: 460,
        boxShadow: "0 12px 48px rgba(26,31,43,0.25)",
      }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: C.text, marginBottom: 4 }}>
          {isNew ? "Nova kategorija" : "Izmjeni kategoriju"}
        </div>
        <div style={{ fontSize: 13, color: C.textSoft, marginBottom: 18 }}>
          Svaka kategorija može imati bilo koji naziv i cijenu.
        </div>

        <div style={{ display: "grid", gap: 12 }}>
          <div>
            <label style={field}>Naziv (crnogorski)</label>
            <input style={input} value={name} onChange={e => setName(e.target.value)} placeholder='npr. "Odrasli"' />
          </div>
          <div>
            <label style={field}>Naziv (English)</label>
            <input style={input} value={nameEn} onChange={e => setNameEn(e.target.value)} placeholder='e.g. "Adult"' />
          </div>
          <div>
            <label style={field}>Kod (jedinstven, npr. "adult")</label>
            <input style={input} value={code} onChange={e => setCode(e.target.value)} disabled={!isNew} placeholder="adult" />
          </div>
          <div>
            <label style={field}>Opis / podnaslov</label>
            <input style={input} value={sublabel} onChange={e => setSublabel(e.target.value)} placeholder="npr. 15+ god." />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label style={field}>Cijena (EUR)</label>
              <input type="number" step="0.01" style={input} value={price} onChange={e => setPrice(e.target.value)} placeholder="8.00" />
            </div>
            <div>
              <label style={field}>Količina (prazno = ∞)</label>
              <input type="number" style={input} value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="∞" />
            </div>
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: C.text, cursor: "pointer" }}>
            <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} />
            Aktivna (vidljiva u widget-u)
          </label>
        </div>

        {err && <div style={{ marginTop: 14, padding: 10, background: C.primarySoft, border: "1px solid #F3CFCF", borderRadius: 7, fontSize: 12, color: C.primaryDark }}>{err}</div>}

        <div style={{ display: "flex", gap: 8, marginTop: 18, justifyContent: "flex-end" }}>
          <Btn variant="secondary" onClick={onClose}>Otkaži</Btn>
          <Btn onClick={save}>{saving ? "Čuvanje…" : isNew ? "Kreiraj" : "Sačuvaj"}</Btn>
        </div>
      </div>
    </div>
  );
}

const fmtMoney = (n, cur = "EUR") => {
  const v = Number(n ?? 0);
  const sym = cur === "EUR" ? "€" : `${cur} `;
  return `${sym}${v.toFixed(2)}`;
};
const fmtTime = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("sr-Latn", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
};
const txStatusTone = (s) => ({
  succeeded: "success", refunded: "warning", partially_refunded: "warning",
  failed: "danger", pending: "info",
}[s] ?? "neutral");

function useTransactionsData() {
  const [data, setData]     = useState({ transactions: [], refunds: [], stats: {} });
  const [loading, setLoad]  = useState(true);
  const [err, setErr]       = useState(null);

  const load = async () => {
    setLoad(true); setErr(null);
    try {
      const res = await callEdge("admin-transactions", { limit: 200 });
      setData({
        transactions: res.transactions ?? [],
        refunds:      res.refunds ?? [],
        stats:        res.stats ?? {},
      });
    } catch (e) { setErr(String(e.message ?? e)); }
    finally { setLoad(false); }
  };
  useEffect(() => { load(); }, []);
  return { ...data, loading, err, reload: load };
}

function Transactions() {
  const { transactions, stats, loading, err, reload } = useTransactionsData();
  const [query, setQuery]     = useState("");
  const [refundTx, setRefundTx] = useState(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return transactions;
    return transactions.filter(t =>
      (t.stripe_pi_id ?? "").toLowerCase().includes(q) ||
      (t.brand ?? "").toLowerCase().includes(q) ||
      (t.last4 ?? "").includes(q) ||
      (t.order?.customer_email ?? "").toLowerCase().includes(q) ||
      (t.order?.customer_name ?? "").toLowerCase().includes(q)
    );
  }, [transactions, query]);

  const refundedForTx = (t) =>
    (t.refunds ?? [])
      .filter(r => r.status !== "failed" && r.status !== "canceled")
      .reduce((s, r) => s + Number(r.amount ?? 0), 0);

  return (
    <div>
      <SectionHead
        title="Transakcije"
        sub="Plaćanja sinhronizovana sa procesorom plaćanja — puna i djelimična refundacija po redu"
        actions={<>
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "7px 10px", border: `1px solid ${C.border}`,
            borderRadius: 7, background: C.surface, minWidth: 240,
          }}>
            <span style={{ color: C.textFaint, display: "flex" }}><Ico d={I.search} size={15} /></span>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="pi_…, brand, last4, email…"
              style={{ border: "none", outline: "none", fontSize: 13, color: C.text, fontFamily: "inherit", width: "100%", background: "transparent" }}
            />
          </div>
          <Btn variant="secondary" icon={I.clock} size="sm" onClick={reload}>Osvježi</Btn>
        </>}
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 18 }}>
        <Stat label="Uspješne (24h)" value={String(stats.succeeded_24h ?? 0)} />
        <Stat label="Refundirano"    value={fmtMoney(stats.refunded_total ?? 0)} />
        <Stat label="Neuspjele"      value={String(stats.failed ?? 0)} />
        <Stat label="Chargeback"     value={String(stats.chargebacks ?? 0)} />
      </div>

      {err && <div style={{ ...card, padding: 14, marginBottom: 12, background: C.primarySoft, borderColor: "#F3CFCF", color: C.primaryDark, fontSize: 13 }}>{err}</div>}

      {loading ? (
        <div style={{ ...card, padding: 40, textAlign: "center", color: C.textSoft, fontSize: 13 }}>Učitavam transakcije…</div>
      ) : filtered.length === 0 ? (
        <Empty icon={I.tx} title="Nema transakcija" sub="Ovdje će biti prikazana sva plaćanja, refundacije i chargeback-ovi." />
      ) : (
        <Table head={["Datum", "Kupac", "Kartica", "Iznos", "Refundirano", "Status", "Plaćanje ID", ""]}>
          {filtered.map(t => {
            const refSum = refundedForTx(t);
            const orderStatus = t.order?.payment_status ?? t.status;
            const canRefund = t.status === "succeeded" && refSum < Number(t.amount) - 0.01;
            return (
              <tr key={t.id}>
                <td style={{ ...td, fontFamily: "ui-monospace, monospace", color: C.textMuted, fontSize: 12 }}>{fmtTime(t.created_at)}</td>
                <td style={td}>
                  <div style={{ fontWeight: 600 }}>{t.order?.customer_name ?? "—"}</div>
                  <div style={{ fontSize: 11, color: C.textSoft }}>{t.order?.customer_email ?? ""}</div>
                </td>
                <td style={{ ...td, fontSize: 12 }}>
                  {t.brand ? (
                    <div>
                      <span style={{ textTransform: "capitalize", fontWeight: 600 }}>{t.brand}</span>
                      {t.last4 && <span style={{ color: C.textSoft }}> ····{t.last4}</span>}
                    </div>
                  ) : <span style={{ color: C.textFaint }}>—</span>}
                  {t.country && <div style={{ fontSize: 11, color: C.textFaint }}>{t.country}</div>}
                </td>
                <td style={{ ...td, fontWeight: 700 }}>{fmtMoney(t.amount, t.currency)}</td>
                <td style={td}>
                  {refSum > 0
                    ? <span style={{ color: C.warning, fontWeight: 600 }}>{fmtMoney(refSum, t.currency)}</span>
                    : <span style={{ color: C.textFaint }}>—</span>}
                </td>
                <td style={td}>
                  <Badge tone={txStatusTone(orderStatus)}>
                    {orderStatus === "partially_refunded" ? "djelimično" : orderStatus}
                  </Badge>
                </td>
                <td style={{ ...td, fontFamily: "ui-monospace, monospace", fontSize: 11, color: C.textSoft }}>
                  {t.stripe_pi_id ? `${t.stripe_pi_id.slice(0, 14)}…` : "—"}
                </td>
                <td style={{ ...td, textAlign: "right" }}>
                  <Btn
                    variant={canRefund ? "secondary" : "ghost"}
                    size="sm"
                    icon={I.refund}
                    onClick={canRefund ? () => setRefundTx(t) : undefined}
                  >
                    Refund
                  </Btn>
                </td>
              </tr>
            );
          })}
        </Table>
      )}

      {refundTx && (
        <RefundModal
          tx={refundTx}
          alreadyRefunded={refundedForTx(refundTx)}
          onClose={() => setRefundTx(null)}
          onDone={() => { setRefundTx(null); reload(); }}
        />
      )}
    </div>
  );
}

const REFUND_REASONS = [
  { v: "requested_by_customer", label: "Na zahtjev kupca" },
  { v: "duplicate",             label: "Dupli plaćeno" },
  { v: "fraudulent",            label: "Prevara / neovlašteno" },
  { v: "custom",                label: "Drugo (upiši razlog)" },
];

function RefundModal({ tx, alreadyRefunded, onClose, onDone }) {
  const txAmount = Number(tx.amount);
  const maxRefund = Math.max(0, Number((txAmount - (alreadyRefunded ?? 0)).toFixed(2)));
  const [amount, setAmount]   = useState(maxRefund.toFixed(2));
  const [reason, setReason]   = useState("requested_by_customer");
  const [note, setNote]       = useState("");
  const [saving, setSaving]   = useState(false);
  const [err, setErr]         = useState(null);

  const submit = async () => {
    setErr(null);
    const amt = Number(amount);
    if (!(amt > 0) || amt > maxRefund + 0.001) {
      setErr(`Iznos mora biti između 0.01 i ${maxRefund.toFixed(2)}`);
      return;
    }
    setSaving(true);
    try {
      const res = await callEdge("admin-refund", {
        transaction_id: tx.id,
        amount:         amt,
        reason:         reason === "custom" ? (note || "other") : reason,
        note:           note || null,
      });
      if (res?.error) throw new Error(res.error);
      onDone();
    } catch (e) { setErr(String(e.message ?? e)); }
    finally { setSaving(false); }
  };

  const field = { fontSize: 13, color: C.textMuted, fontWeight: 500, marginBottom: 5, display: "block" };
  const input = {
    width: "100%", padding: "9px 11px", borderRadius: 7,
    border: `1px solid ${C.border}`, fontSize: 13, color: C.text,
    fontFamily: "inherit", outline: "none", background: C.surface,
  };

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(26,31,43,0.5)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 1000, padding: 20,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        ...card, padding: 24, width: "100%", maxWidth: 480,
        boxShadow: "0 12px 48px rgba(26,31,43,0.25)",
      }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: C.text, marginBottom: 4 }}>Refund transakcije</div>
        <div style={{ fontSize: 12, color: C.textSoft, marginBottom: 16, fontFamily: "ui-monospace, monospace" }}>
          {tx.stripe_pi_id ?? tx.id}
        </div>

        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10,
          padding: 12, background: C.bg, borderRadius: 8, marginBottom: 16,
        }}>
          <div>
            <div style={{ fontSize: 11, color: C.textSoft, marginBottom: 2 }}>Originalno</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{fmtMoney(txAmount, tx.currency)}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: C.textSoft, marginBottom: 2 }}>Već refundirano</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: alreadyRefunded > 0 ? C.warning : C.text }}>
              {fmtMoney(alreadyRefunded ?? 0, tx.currency)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: C.textSoft, marginBottom: 2 }}>Maksimum</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.primaryDark }}>{fmtMoney(maxRefund, tx.currency)}</div>
          </div>
        </div>

        <div style={{ display: "grid", gap: 12 }}>
          <div>
            <label style={field}>Iznos refunda ({tx.currency})</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input type="number" step="0.01" min="0.01" max={maxRefund}
                style={{ ...input, flex: 1 }}
                value={amount}
                onChange={e => setAmount(e.target.value)}
              />
              <Btn variant="secondary" size="sm" onClick={() => setAmount(maxRefund.toFixed(2))}>Pun iznos</Btn>
            </div>
          </div>

          <div>
            <label style={field}>Razlog</label>
            <select style={input} value={reason} onChange={e => setReason(e.target.value)}>
              {REFUND_REASONS.map(r => <option key={r.v} value={r.v}>{r.label}</option>)}
            </select>
          </div>

          <div>
            <label style={field}>Napomena (interno)</label>
            <textarea
              style={{ ...input, minHeight: 60, resize: "vertical" }}
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder={reason === "custom" ? "Obavezno za razlog 'Drugo'…" : "Opciono — vidljivo u audit logu"}
            />
          </div>
        </div>

        {err && <div style={{ marginTop: 14, padding: 10, background: C.primarySoft, border: "1px solid #F3CFCF", borderRadius: 7, fontSize: 12, color: C.primaryDark }}>{err}</div>}

        <div style={{ display: "flex", gap: 8, marginTop: 18, justifyContent: "flex-end" }}>
          <Btn variant="secondary" onClick={onClose}>Otkaži</Btn>
          <Btn variant="danger" icon={I.refund} onClick={submit}>
            {saving ? "Refundiram…" : `Refund ${fmtMoney(Number(amount || 0), tx.currency)}`}
          </Btn>
        </div>
      </div>
    </div>
  );
}

function Refunds() {
  const { transactions, refunds, loading, err, reload } = useTransactionsData();
  const txById = useMemo(() => new Map(transactions.map(t => [t.id, t])), [transactions]);

  return (
    <div>
      <SectionHead
        title="Refundacije"
        sub="Sve refundacije izvršene preko procesora plaćanja — kompletne i djelimične"
        actions={<Btn variant="secondary" icon={I.clock} size="sm" onClick={reload}>Osvježi</Btn>}
      />

      {err && <div style={{ ...card, padding: 14, marginBottom: 12, background: C.primarySoft, borderColor: "#F3CFCF", color: C.primaryDark, fontSize: 13 }}>{err}</div>}

      {loading ? (
        <div style={{ ...card, padding: 40, textAlign: "center", color: C.textSoft, fontSize: 13 }}>Učitavam…</div>
      ) : refunds.length === 0 ? (
        <div style={{ ...card, padding: 40, textAlign: "center" }}>
          <div style={{ color: C.textSoft, marginBottom: 12 }}><Ico d={I.refund} size={32} /></div>
          <div style={{ fontSize: 15, fontWeight: 600, color: C.text }}>Nema refundacija</div>
          <div style={{ fontSize: 13, color: C.textSoft, marginTop: 6 }}>Pokreni refundaciju iz tabele transakcija.</div>
        </div>
      ) : (
        <Table head={["Datum", "Kupac", "Iznos", "Razlog", "Status", "Refund ID", "Transakcija"]}>
          {refunds.map(r => {
            const tx = txById.get(r.transaction_id);
            return (
              <tr key={r.id}>
                <td style={{ ...td, fontFamily: "ui-monospace, monospace", color: C.textMuted, fontSize: 12 }}>{fmtTime(r.created_at)}</td>
                <td style={td}>
                  <div style={{ fontWeight: 600 }}>{tx?.order?.customer_name ?? "—"}</div>
                  <div style={{ fontSize: 11, color: C.textSoft }}>{tx?.order?.customer_email ?? ""}</div>
                </td>
                <td style={{ ...td, fontWeight: 700, color: C.warning }}>{fmtMoney(r.amount, r.currency)}</td>
                <td style={{ ...td, fontSize: 12 }}>{r.reason ?? "—"}</td>
                <td style={td}>
                  <Badge tone={r.status === "succeeded" ? "success" : r.status === "failed" ? "danger" : "info"}>
                    {r.status}
                  </Badge>
                </td>
                <td style={{ ...td, fontFamily: "ui-monospace, monospace", fontSize: 11, color: C.textSoft }}>
                  {r.stripe_refund_id ? `${r.stripe_refund_id.slice(0, 16)}…` : "—"}
                </td>
                <td style={{ ...td, fontFamily: "ui-monospace, monospace", fontSize: 11, color: C.textSoft }}>
                  {tx?.stripe_pi_id ? `${tx.stripe_pi_id.slice(0, 14)}…` : "—"}
                </td>
              </tr>
            );
          })}
        </Table>
      )}
    </div>
  );
}

function ChannelsPanel() {
  return (
    <div>
      <SectionHead title="Kanali prodaje" sub="Web, widget, kiosci, POS, onboard, partneri" actions={<Btn icon={I.plus} size="sm">Dodaj kanal</Btn>} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 }}>
        {CHANNELS.map(c => (
          <div key={c.key} style={{ ...card, padding: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: C.primarySoft, color: C.primaryDark, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Ico d={c.icon} size={16} />
              </div>
              <Badge tone={c.live ? "success" : "warning"}>{c.live ? "aktivan" : "uskoro"}</Badge>
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, color: C.text }}>{c.name}</div>
            <div style={{ fontSize: 13, color: C.textSoft, marginTop: 4 }}>{c.today} prodaja danas · {c.pct}%</div>
            <div style={{ display: "flex", gap: 6, marginTop: 14 }}>
              <Btn variant="secondary" size="sm">Konfiguracija</Btn>
              <Btn variant="ghost" size="sm">Statistika</Btn>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Kiosks() {
  return (
    <div>
      <SectionHead
        title="Samouslužni kiosci"
        sub="Status, API ključevi, offline sinhronizacija i audit"
        actions={<Btn icon={I.plus} size="sm">Dodaj kiosk</Btn>}
      />
      {KIOSKS.length === 0 ? (
        <Empty icon={I.kiosk} title="Nema kiosaka" sub="Dodaj prvi kiosk da bi dobio jedinstveni API key i uključio ga u sistem." />
      ) : (
        <Table head={["ID", "Lokacija", "Status", "Posljednji heartbeat", "Prodaja (30d)", ""]}>
          {KIOSKS.map(k => (
            <tr key={k.id}>
              <td style={{ ...td, fontFamily: "ui-monospace, monospace", fontWeight: 600 }}>{k.id}</td>
              <td style={td}>{k.loc}</td>
              <td style={td}><Badge tone={k.status === "online" ? "success" : "danger"}>{k.status}</Badge></td>
              <td style={{ ...td, color: C.textSoft }}>{k.last}</td>
              <td style={{ ...td, fontWeight: 700 }}>{k.sales}</td>
              <td style={{ ...td, textAlign: "right" }}>
                <Btn variant="ghost" size="sm">API key</Btn>
                <Btn variant="ghost" size="sm">Audit log</Btn>
              </td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  );
}

function GatesPanel() {
  return (
    <div>
      <SectionHead
        title="Prolazni mehanizmi"
        sub="CM4 NANO edge uređaji · tripod / barijera · live status i pokušaji prolaza"
        actions={<Btn variant="secondary" icon={I.settings} size="sm">Interval otvaranja</Btn>}
      />
      {GATES.length === 0 ? (
        <Empty icon={I.gate} title="Nema prolaza" sub="Registruj CM4 NANO uređaje sa QR čitačem da bi povezao tripod/barijeru." />
      ) : (
        <Table head={["ID", "Lokacija", "Uređaj", "Status", "Prolazi (danas)", ""]}>
          {GATES.map(g => (
            <tr key={g.id}>
              <td style={{ ...td, fontFamily: "ui-monospace, monospace", fontWeight: 600 }}>{g.id}</td>
              <td style={td}>{g.loc}</td>
              <td style={{ ...td, color: C.textMuted }}>{g.device}</td>
              <td style={td}><Badge tone={g.status === "ok" ? "success" : "danger"}>{g.status}</Badge></td>
              <td style={{ ...td, fontWeight: 700 }}>{g.passes}</td>
              <td style={{ ...td, textAlign: "right" }}>
                <Btn variant="ghost" size="sm">Simuliraj signal</Btn>
                <Btn variant="ghost" size="sm">Log</Btn>
              </td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  );
}

function Payments() {
  return (
    <div>
      <SectionHead title="Plaćanja" sub="Metode, BIN pravila, 3DS i status gateway-a" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <div style={{ ...card, padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 12 }}>Metode plaćanja</div>
          {[
            ["Visa / Mastercard / Amex",   true],
            ["Discover / Diners / JCB",    true],
            ["UnionPay",                   true],
            ["Apple Pay",                  true],
            ["Google Pay",                 true],
            ["Microsoft Pay",              false],
            ["PayPal",                     true],
          ].map(([n, on]) => (
            <div key={n} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${C.borderSoft}` }}>
              <span style={{ fontSize: 13, color: C.text }}>{n}</span>
              <Badge tone={on ? "success" : "neutral"}>{on ? "uključeno" : "isključeno"}</Badge>
            </div>
          ))}
        </div>

        <div style={{ ...card, padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 12 }}>Sigurnost i usklađenost</div>
          {[
            ["PCI DSS Level 1",      "gateway"],
            ["TLS 1.2+",             "enforced"],
            ["PSD2 / SCA",           "aktivno"],
            ["3D Secure 2.0",        "aktivno"],
            ["Tokenizacija",         "aktivno"],
            ["Fraud ML procjena",    "aktivno"],
          ].map(([n, v]) => (
            <div key={n} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${C.borderSoft}` }}>
              <span style={{ fontSize: 13, color: C.text }}>{n}</span>
              <Badge tone="success">{v}</Badge>
            </div>
          ))}
        </div>
      </div>

      <SectionHead title="BIN pravila" sub="Popusti i promocije na osnovu izdavaoca kartice" actions={<Btn icon={I.plus} size="sm">Novo pravilo</Btn>} />
      {BIN_RULES.length === 0 ? (
        <Empty icon={I.pay} title="Nema BIN pravila" sub="Dodaj prvo pravilo da bi aktivirao popuste po izdavaocu kartice (tender 3.4)." />
      ) : (
        <Table head={["BIN", "Brend", "Izdavalac", "Popust", "Status", ""]}>
          {BIN_RULES.map(r => (
            <tr key={r.id}>
              <td style={{ ...td, fontFamily: "ui-monospace, monospace", fontWeight: 600 }}>{r.bin}</td>
              <td style={td}>{r.brand}</td>
              <td style={td}>{r.issuer}</td>
              <td style={{ ...td, fontWeight: 700, color: C.primaryDark }}>{r.disc}</td>
              <td style={td}><Badge tone={r.active ? "success" : "neutral"}>{r.active ? "aktivno" : "pauzirano"}</Badge></td>
              <td style={{ ...td, textAlign: "right" }}><Btn variant="ghost" icon={I.edit} size="sm">Izmjeni</Btn></td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  );
}

const ITEM_KIND_LABEL = {
  card_bin:             "BIN kartice",
  card_fingerprint:     "Otisak kartice",
  email:                "Email adresa",
  ip_address:           "IP adresa",
  country:              "Zemlja (ISO 2)",
  string:               "Tekst",
  case_sensitive_string:"Tekst (case-sensitive)",
  customer_id:          "Customer ID",
  us_bank_account_fingerprint: "US bank fingerprint",
  sepa_debit_fingerprint:      "SEPA fingerprint",
};

function Fraud() {
  const [lists, setLists]     = useState([]);
  const [loading, setLoad]    = useState(true);
  const [err, setErr]         = useState(null);
  const [activeList, setActive] = useState(null);
  const [items, setItems]     = useState([]);
  const [warnings, setWarns]  = useState([]);
  const [newItem, setNewItem] = useState("");
  const [adding, setAdding]   = useState(false);

  const loadLists = async () => {
    setLoad(true); setErr(null);
    try {
      const [lv, ef] = await Promise.all([
        callEdge("admin-radar", { action: "list_value_lists" }),
        callEdge("admin-radar", { action: "list_early_fraud", limit: 20 }),
      ]);
      setLists(lv.value_lists ?? []);
      setWarns(ef.warnings ?? []);
      if (!activeList && (lv.value_lists ?? []).length) {
        setActive(lv.value_lists[0]);
      }
    } catch (e) { setErr(String(e.message ?? e)); }
    finally { setLoad(false); }
  };
  useEffect(() => { loadLists(); }, []);

  const loadItems = async (listId) => {
    if (!listId) { setItems([]); return; }
    try {
      const res = await callEdge("admin-radar", { action: "list_items", value_list: listId });
      setItems(res.items ?? []);
    } catch (e) { setErr(String(e.message ?? e)); }
  };
  useEffect(() => { if (activeList) loadItems(activeList.id); }, [activeList?.id]);

  const addItem = async () => {
    if (!newItem.trim() || !activeList) return;
    setAdding(true); setErr(null);
    try {
      await callEdge("admin-radar", { action: "add_item", value_list: activeList.id, value: newItem.trim() });
      setNewItem("");
      await loadItems(activeList.id);
    } catch (e) { setErr(String(e.message ?? e)); }
    finally { setAdding(false); }
  };

  const removeItem = async (item) => {
    if (!confirm(`Obriši "${item.value}" iz liste "${activeList?.name}"?`)) return;
    try {
      await callEdge("admin-radar", { action: "delete_item", item_id: item.id });
      await loadItems(activeList.id);
    } catch (e) { setErr(String(e.message ?? e)); }
  };

  return (
    <div>
      <SectionHead
        title="Prevencija prevara"
        sub="Radar value liste (CRUD iz admina), Early Fraud Warnings, risk score"
        actions={<Btn variant="secondary" icon={I.clock} size="sm" onClick={loadLists}>Osvježi</Btn>}
      />

      {err && <div style={{ ...card, padding: 14, marginBottom: 12, background: C.primarySoft, borderColor: "#F3CFCF", color: C.primaryDark, fontSize: 13 }}>{err}</div>}

      {/* Bezbjednosna napomena — šta se može odavde, a šta zahtijeva Super admina */}
      <div style={{
        ...card, padding: 14, marginBottom: 16,
        background: C.infoSoft, borderColor: "#B8DAFB",
        fontSize: 12, color: C.textMuted, lineHeight: 1.6,
      }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#00509D", marginBottom: 6, letterSpacing: 0.2, textTransform: "uppercase" }}>
          Bezbjednosno ograničenje
        </div>
        <div>
          Iz bezbjednosnih razloga, napredne politike sprečavanja prevara — <b>pravila odlučivanja</b> (if-then logika, risk score pragovi), <b>3-D Secure challenge politika</b>, <b>modeli uređaja i otisaka</b>, kao i testiranje / backtest pravila — mijenjaju se isključivo direktno na zaštićenom portalu procesora plaćanja, uz obaveznu dvofaktorsku autentikaciju i audit trag. Operatorima admina ovaj pristup nije omogućen.
        </div>
        <div style={{ marginTop: 8 }}>
          Za izmjenu tih politika kontaktirajte <b>Super administratora</b> na <a href="mailto:support@kotorwalls.com" style={{ color: "#00509D", fontWeight: 600 }}>support@kotorwalls.com</a>.
        </div>
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid #B8DAFB", color: C.textSoft }}>
          <b style={{ color: C.text }}>Iz admina možete:</b> upravljati Value Lists (blok/allow liste po BIN-u, zemlji, IP-u, email-u, otisku kartice), pregledati Early Fraud Warnings i risk score po transakciji, pokrenuti refund i zatvoriti review.
        </div>
      </div>

      {/* Value lists grid */}
      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 16, marginBottom: 20 }}>
        <div style={{ ...card, overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.borderSoft}`, fontSize: 12, fontWeight: 700, color: C.textSoft, letterSpacing: 0.4, textTransform: "uppercase" }}>
            Value lists ({lists.length})
          </div>
          {loading ? (
            <div style={{ padding: 20, color: C.textSoft, fontSize: 13 }}>Učitavam…</div>
          ) : lists.length === 0 ? (
            <div style={{ padding: 20, color: C.textSoft, fontSize: 13 }}>Nema lista. Kreiraj ih u Stripe Dashboard → Radar.</div>
          ) : lists.map(l => (
            <button
              key={l.id}
              onClick={() => setActive(l)}
              style={{
                display: "block", width: "100%", padding: "11px 16px", textAlign: "left",
                background: activeList?.id === l.id ? C.primarySoft : "transparent",
                border: "none", borderBottom: `1px solid ${C.borderSoft}`,
                cursor: "pointer", fontFamily: "inherit",
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 600, color: activeList?.id === l.id ? C.primaryDark : C.text }}>
                {l.name}
              </div>
              <div style={{ fontSize: 11, color: C.textSoft, marginTop: 2 }}>
                {ITEM_KIND_LABEL[l.item_type] ?? l.item_type} · {l.alias}
              </div>
            </button>
          ))}
        </div>

        <div style={{ ...card, padding: 18 }}>
          {!activeList ? (
            <div style={{ padding: 20, color: C.textSoft, fontSize: 13, textAlign: "center" }}>
              Izaberi listu lijevo.
            </div>
          ) : (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{activeList.name}</div>
                  <div style={{ fontSize: 12, color: C.textSoft, marginTop: 2 }}>
                    Tip: <b>{ITEM_KIND_LABEL[activeList.item_type] ?? activeList.item_type}</b> · Alias: <code>{activeList.alias}</code> · Stavki: {items.length}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                <input
                  value={newItem}
                  onChange={e => setNewItem(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") addItem(); }}
                  placeholder={
                    activeList.item_type === "card_bin"   ? "npr. 411111" :
                    activeList.item_type === "country"    ? "npr. NG" :
                    activeList.item_type === "ip_address" ? "npr. 203.0.113.5" :
                    activeList.item_type === "email"      ? "npr. bad@actor.com" :
                    "vrijednost"
                  }
                  style={{
                    flex: 1, padding: "9px 12px", borderRadius: 7,
                    border: `1px solid ${C.border}`, fontSize: 13, fontFamily: "inherit",
                    outline: "none",
                  }}
                />
                <Btn icon={I.plus} size="sm" onClick={addItem}>
                  {adding ? "Dodajem…" : "Dodaj"}
                </Btn>
              </div>

              {items.length === 0 ? (
                <div style={{ padding: 20, color: C.textSoft, fontSize: 13, textAlign: "center", border: `1px dashed ${C.border}`, borderRadius: 8 }}>
                  Lista je prazna.
                </div>
              ) : (
                <div style={{ border: `1px solid ${C.borderSoft}`, borderRadius: 8, maxHeight: 360, overflowY: "auto" }}>
                  {items.map(it => (
                    <div key={it.id} style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "9px 14px", borderBottom: `1px solid ${C.borderSoft}`,
                    }}>
                      <div>
                        <span style={{ fontFamily: "ui-monospace, monospace", fontSize: 13, color: C.text, fontWeight: 600 }}>
                          {it.value}
                        </span>
                        <span style={{ fontSize: 11, color: C.textFaint, marginLeft: 10 }}>
                          {new Date(it.created * 1000).toLocaleDateString("sr-Latn")}
                        </span>
                      </div>
                      <button
                        onClick={() => removeItem(it)}
                        style={{
                          padding: "4px 10px", fontSize: 11, fontWeight: 600,
                          background: "transparent", color: C.danger,
                          border: `1px solid ${C.border}`, borderRadius: 6,
                          cursor: "pointer", fontFamily: "inherit",
                        }}
                      >Obriši</button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Early fraud warnings */}
      <SectionHead title="Early Fraud Warnings" sub="Rana upozorenja iz kartične šeme — preduzmi akciju da izbjegneš chargeback" />
      {warnings.length === 0 ? (
        <div style={{ ...card, padding: 30, textAlign: "center", color: C.textSoft, fontSize: 13 }}>
          Nema aktuelnih upozorenja.
        </div>
      ) : (
        <Table head={["Datum", "Razlog", "Charge", "Akcija preduzeta", "Uticaj na dispute"]}>
          {warnings.map(w => (
            <tr key={w.id}>
              <td style={{ ...td, fontFamily: "ui-monospace, monospace", fontSize: 12 }}>
                {new Date(w.created * 1000).toLocaleString("sr-Latn", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
              </td>
              <td style={td}>
                <Badge tone="danger">{w.fraud_type}</Badge>
              </td>
              <td style={{ ...td, fontFamily: "ui-monospace, monospace", fontSize: 11, color: C.textSoft }}>
                {typeof w.charge === "string" ? w.charge.slice(0, 18) + "…" : w.charge?.id?.slice(0, 18) + "…"}
              </td>
              <td style={td}>
                <Badge tone={w.actionable ? "warning" : "neutral"}>
                  {w.actionable ? "potrebna" : "ne"}
                </Badge>
              </td>
              <td style={td}>
                {w.influences_dispute ? <Badge tone="danger">da</Badge> : <Badge tone="success">ne</Badge>}
              </td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  );
}

const CHANNEL_LABEL = {
  web:     "Web",
  widget:  "Embed widget",
  kiosk:   "Samouslužni kiosci",
  pos:     "POS / blagajna",
  onboard: "Onboard / brodovi",
  partner: "Booking / GYG",
  unknown: "Nepoznat kanal",
};

function Fiscal() {
  const [range, setRange] = useState("30d");
  const [data, setData]   = useState(null);
  const [loading, setLoad] = useState(true);
  const [err, setErr]     = useState(null);
  const [retryingId, setRetryingId] = useState(null);

  const load = async () => {
    setLoad(true); setErr(null);
    try {
      const res = await callEdge("admin-fiscal", { action: "get", range });
      if (res?.error) throw new Error(res.error);
      setData(res);
    } catch (e) { setErr(String(e.message ?? e)); }
    finally { setLoad(false); }
  };
  useEffect(() => { load(); }, [range]);

  const retry = async (orderId) => {
    setRetryingId(orderId);
    try {
      const res = await callEdge("admin-fiscal", { action: "retry", order_id: orderId });
      if (res?.error) alert(`Greška: ${res.error}`);
      else if (res?.success) alert(`Uspješno fiskalizovano. IIC: ${res.iic ?? "-"}`);
      else alert(`Neuspješno: ${res?.error ?? "nepoznata greška"}`);
      await load();
    } catch (e) { alert(String(e.message ?? e)); }
    finally { setRetryingId(null); }
  };

  const s   = data?.summary ?? {};
  const cfg = data?.config  ?? {};
  const byChan = data?.by_channel ?? [];
  const recent = data?.recent     ?? [];
  const money  = v => fmtMoney(v, "EUR");
  const isProd = !!s.is_production;

  return (
    <div>
      <SectionHead
        title="Fiskalizacija"
        sub="Crnogorski EFI / CIS — pregled po kanalu prodaje"
        actions={<>
          <div style={{ display: "flex", gap: 4, padding: 3, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 7 }}>
            {REPORT_RANGES.map(r => (
              <button key={r.key} onClick={() => setRange(r.key)} style={{
                padding: "5px 11px", fontSize: 12, fontWeight: 600,
                background: range === r.key ? C.primary : "transparent",
                color: range === r.key ? "#fff" : C.textMuted,
                border: "none", borderRadius: 5, cursor: "pointer", fontFamily: "inherit",
              }}>{r.label}</button>
            ))}
          </div>
          <Btn variant="secondary" icon={I.clock} size="sm" onClick={load}>Osvježi</Btn>
        </>}
      />

      {err && <div style={{ ...card, padding: 14, marginBottom: 12, background: C.primarySoft, borderColor: "#F3CFCF", color: C.primaryDark, fontSize: 13 }}>{err}</div>}

      {/* KPI */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 18 }}>
        <Stat label="Fiskalizovano"   value={String(s.succeeded_count ?? 0)} />
        <Stat label="Neuspješno"      value={String(s.failed_count ?? 0)}    tone={(s.failed_count ?? 0) > 0 ? "warning" : "success"} />
        <Stat label="Na čekanju"      value={String(s.pending_count ?? 0)}   tone={(s.pending_count ?? 0) > 0 ? "warning" : "success"} />
        <Stat label="Iznos (uspješni)" value={money(s.total_amount ?? 0)} />
        <Stat label="Posljednji IIC"  value={s.last_iic ? `${s.last_iic.slice(0,8)}…` : "—"} sub={s.last_iic ? "kratki prikaz" : null} />
      </div>

      {/* Status + parametri */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <div style={{ ...card, padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 14 }}>Status servisa</div>
          {[
            ["Fiskalizacija",  s.config_enabled ? "uključena" : "isključena", s.config_enabled ? "success" : "warning"],
            ["Okruženje",      isProd ? "PROD" : "TEST",                       isProd ? "danger" : "info"],
            ["Posljednji IIC", s.last_iic ? `${s.last_iic.slice(0,12)}…` : "—", "neutral"],
            ["Neuspješni",     String(s.failed_count ?? 0),                    (s.failed_count ?? 0) > 0 ? "warning" : "success"],
          ].map(([k, v, t]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: `1px solid ${C.borderSoft}` }}>
              <span style={{ fontSize: 13, color: C.textMuted }}>{k}</span>
              <Badge tone={t}>{v}</Badge>
            </div>
          ))}
        </div>
        <div style={{ ...card, padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 14 }}>Poreski parametri</div>
          {[
            ["Naziv",          cfg.seller_name ?? "—"],
            ["PIB",            cfg.seller_tin ?? "—"],
            ["TCR / ENU",      cfg.tcr_code ?? "—"],
            ["Poslovna jedinica", cfg.business_unit_code ?? "—"],
            ["PDV stopa",      cfg.default_vat_rate != null ? `${cfg.default_vat_rate}%` : "—"],
            ["Default operater", cfg.operator_code ?? "—"],
          ].map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: `1px solid ${C.borderSoft}` }}>
              <span style={{ fontSize: 13, color: C.textMuted }}>{k}</span>
              <span style={{ fontSize: 13, color: C.text, fontWeight: 600, fontFamily: ["TCR / ENU", "PIB", "Poslovna jedinica", "Default operater"].includes(k) ? "ui-monospace, monospace" : "inherit" }}>{v}</span>
            </div>
          ))}
        </div>
      </div>

      {loading && !data && (
        <div style={{ ...card, padding: 40, textAlign: "center", color: C.textSoft, fontSize: 13 }}>Učitavam…</div>
      )}

      {/* Per-channel breakdown */}
      <div style={{ ...card, padding: 20, marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>Fiskalizacija po kanalu prodaje</div>
            <div style={{ fontSize: 12, color: C.textSoft, marginTop: 2 }}>{byChan.length} aktivnih kanala u izabranom periodu</div>
          </div>
          <Btn variant="secondary" icon={I.export} size="sm" onClick={() => downloadCsv(`kotor-fiscal-channels-${range}.csv`, byChan)}>CSV</Btn>
        </div>
        {byChan.length === 0 ? (
          <Empty title="Nema fiskalnih zapisa" sub="Čim se prva narudžbina plati i fiskalizuje, pojaviće se ovdje." />
        ) : (
          <Table head={["Kanal", "Uspješno", "Neuspješno", "Na čekanju", "Iznos"]}>
            {byChan.map(c => (
              <tr key={c.channel}>
                <td style={td}>{CHANNEL_LABEL[c.channel] ?? c.channel}</td>
                <td style={td}><Badge tone="success">{c.succeeded}</Badge></td>
                <td style={td}>{c.failed > 0 ? <Badge tone="danger">{c.failed}</Badge> : <span style={{ color: C.textFaint }}>0</span>}</td>
                <td style={td}>{c.pending > 0 ? <Badge tone="warning">{c.pending}</Badge> : <span style={{ color: C.textFaint }}>0</span>}</td>
                <td style={{ ...td, fontWeight: 700, color: C.text }}>{money(c.amount)}</td>
              </tr>
            ))}
          </Table>
        )}
      </div>

      {/* Recent fiscal records */}
      <div style={{ ...card, padding: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>Posljednji fiskalni računi</div>
            <div style={{ fontSize: 12, color: C.textSoft, marginTop: 2 }}>Zadnjih {recent.length} zapisa · klik na "Pogledaj" otvara fiskalni račun sa svim podacima</div>
          </div>
        </div>
        {recent.length === 0 ? (
          <Empty title="Nema zapisa" sub="Fiskalni računi se pojavljuju nakon uspješne naplate." />
        ) : (
          <Table head={["Vrijeme", "Kanal", "Br.", "Kupac", "Status", "IIC", "Iznos", ""]}>
            {recent.map(r => (
              <tr key={r.id}>
                <td style={{ ...td, fontFamily: "ui-monospace, monospace", fontSize: 12 }}>{fmtTime(r.created_at)}</td>
                <td style={td}>{CHANNEL_LABEL[r.channel] ?? r.channel ?? "—"}</td>
                <td style={{ ...td, fontFamily: "ui-monospace, monospace" }}>{r.invoice_ord_num ?? "—"}</td>
                <td style={td}>
                  {r.customer_name ? (
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{r.customer_name}</div>
                      {r.customer_email && (
                        <div style={{ fontSize: 11, color: C.textSoft, marginTop: 1 }}>{r.customer_email}</div>
                      )}
                    </div>
                  ) : (
                    <span style={{ color: C.textFaint }}>—</span>
                  )}
                </td>
                <td style={td}>
                  {r.status === "succeeded" && <Badge tone="success">OK</Badge>}
                  {r.status === "failed"    && <Badge tone="danger" title={r.error}>FAIL</Badge>}
                  {r.status === "pending"   && <Badge tone="warning">…</Badge>}
                </td>
                <td style={{ ...td, fontFamily: "ui-monospace, monospace", fontSize: 11 }}>
                  {r.ikof ? `${r.ikof.slice(0,12)}…` : "—"}
                </td>
                <td style={{ ...td, fontWeight: 600 }}>{money(r.total)}</td>
                <td style={td}>
                  <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                    {r.status === "succeeded" && r.order_id && (
                      <a
                        href={`/racun?order=${r.order_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Otvori fiskalni račun"
                        style={{
                          padding: "4px 10px", fontSize: 11, fontWeight: 600,
                          background: C.surface, color: C.primary,
                          border: `1px solid ${C.primary}`, borderRadius: 5,
                          textDecoration: "none", fontFamily: "inherit",
                          display: "inline-flex", alignItems: "center", gap: 4,
                        }}>
                        Pogledaj
                      </a>
                    )}
                    {(r.status === "failed" || r.status === "pending") && (
                      <button
                        onClick={() => retry(r.order_id)}
                        disabled={retryingId === r.order_id}
                        title={r.status === "pending" ? "Pošalji u fiskalizaciju" : "Pokušaj ponovo"}
                        style={{
                          padding: "4px 10px", fontSize: 11, fontWeight: 600,
                          background: retryingId === r.order_id ? C.borderSoft : C.primary, color: "#fff",
                          border: "none", borderRadius: 5, cursor: retryingId === r.order_id ? "wait" : "pointer",
                          fontFamily: "inherit",
                        }}>{retryingId === r.order_id ? "…" : (r.status === "pending" ? "Fiskalizuj" : "Retry")}</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </Table>
        )}
      </div>
    </div>
  );
}

const REPORT_RANGES = [
  { key: "7d",  label: "7 dana" },
  { key: "30d", label: "30 dana" },
  { key: "12m", label: "12 mjeseci" },
  { key: "ytd", label: "Ova godina" },
  { key: "all", label: "Sve" },
];

function downloadCsv(filename, rows) {
  if (!rows?.length) { alert("Nema podataka za izvoz."); return; }
  const keys = Object.keys(rows[0]);
  const esc = v => {
    const s = v == null ? "" : String(v);
    return /[,"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [keys.join(","), ...rows.map(r => keys.map(k => esc(r[k])).join(","))].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function Reports() {
  const [range, setRange] = useState("30d");
  const [data, setData]   = useState(null);
  const [loading, setLoad] = useState(true);
  const [err, setErr]     = useState(null);

  const load = async () => {
    setLoad(true); setErr(null);
    try {
      const res = await callEdge("admin-reports", { range });
      if (res?.error) throw new Error(res.error);
      setData(res);
    } catch (e) { setErr(String(e.message ?? e)); }
    finally { setLoad(false); }
  };
  useEffect(() => { load(); }, [range]);

  const s = data?.summary ?? {};
  const revByDay  = data?.revenue_by_day  ?? [];
  const refByDay  = data?.refunds_by_day  ?? [];
  const byCat     = data?.sales_by_category ?? [];
  const byChan    = data?.sales_by_channel  ?? [];
  const byLang    = data?.sales_by_language ?? [];
  const byCountry = data?.sales_by_country  ?? [];
  const hourly    = data?.hourly_today    ?? [];
  const maxBar    = Math.max(1, ...revByDay.map(x => x.sum));

  const money = v => fmtMoney(v, s.currency ?? "EUR");

  return (
    <div>
      <SectionHead
        title="Izvještaji"
        sub="Prihod, prodaja, refund ratio — agregirano iz narudžbina, tiketa, transakcija i refunda"
        actions={<>
          <div style={{ display: "flex", gap: 4, padding: 3, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 7 }}>
            {REPORT_RANGES.map(r => (
              <button key={r.key} onClick={() => setRange(r.key)} style={{
                padding: "5px 11px", fontSize: 12, fontWeight: 600,
                background: range === r.key ? C.primary : "transparent",
                color: range === r.key ? "#fff" : C.textMuted,
                border: "none", borderRadius: 5, cursor: "pointer", fontFamily: "inherit",
              }}>{r.label}</button>
            ))}
          </div>
          <Btn variant="secondary" icon={I.clock} size="sm" onClick={load}>Osvježi</Btn>
        </>}
      />

      {err && <div style={{ ...card, padding: 14, marginBottom: 12, background: C.primarySoft, borderColor: "#F3CFCF", color: C.primaryDark, fontSize: 13 }}>{err}</div>}

      {/* KPI */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 18 }}>
        <Stat label="Prihod (bruto)" value={money(s.revenue_gross ?? 0)} />
        <Stat label="Prihod (neto)"  value={money(s.revenue_net ?? 0)} />
        <Stat label="Narudžbine"     value={String(s.orders_count ?? 0)} />
        <Stat label="Tiketi izdati"  value={String(s.tickets_count ?? 0)} />
        <Stat label="Prosjek po narudžbini" value={money(s.avg_order_value ?? 0)} />
        <Stat label="Refundirano"    value={money(s.refunds_total ?? 0)} />
        <Stat label="Refund ratio"   value={`${s.refund_rate_pct ?? 0}%`} />
        <Stat label="Uspješne tx"    value={`${s.tx_success_rate ?? 0}%`} />
      </div>

      {loading && !data && (
        <div style={{ ...card, padding: 40, textAlign: "center", color: C.textSoft, fontSize: 13 }}>Učitavam…</div>
      )}

      {/* Prihod po danu */}
      <div style={{ ...card, padding: 20, marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>Prihod po danu</div>
            <div style={{ fontSize: 12, color: C.textSoft, marginTop: 2 }}>{revByDay.length} dana sa aktivnošću</div>
          </div>
          <Btn variant="secondary" icon={I.export} size="sm" onClick={() => downloadCsv(`kotor-revenue-${range}.csv`, revByDay)}>CSV</Btn>
        </div>
        {revByDay.length === 0 ? (
          <div style={{ padding: 30, textAlign: "center", color: C.textFaint, fontSize: 13 }}>Nema podataka u izabranom periodu.</div>
        ) : (
          <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 140, overflowX: "auto" }}>
            {revByDay.map(d => (
              <div key={d.date} title={`${d.date}: ${money(d.sum)} · ${d.count} narudžbina`}
                style={{ flex: "1 0 18px", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, minWidth: 18 }}>
                <div style={{
                  width: "80%", height: `${(d.sum / maxBar) * 110 + 2}px`,
                  background: `linear-gradient(180deg, ${C.primary}, ${C.primaryDark})`,
                  borderRadius: "4px 4px 0 0",
                }} />
                <span style={{ fontSize: 9, color: C.textFaint, fontFamily: "ui-monospace, monospace", transform: "rotate(-45deg)", transformOrigin: "top left", whiteSpace: "nowrap" }}>
                  {d.date.slice(5)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Breakdown tabele */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <BreakdownCard
          title="Prodaja po kategoriji tiketa"
          rows={byCat}
          money={money}
          onExport={() => downloadCsv(`kotor-category-${range}.csv`, byCat)}
        />
        <BreakdownCard
          title="Prodaja po kanalu"
          rows={byChan}
          money={money}
          onExport={() => downloadCsv(`kotor-channel-${range}.csv`, byChan)}
        />
        <BreakdownCard
          title="Prodaja po jeziku kupca"
          rows={byLang}
          money={money}
          onExport={() => downloadCsv(`kotor-language-${range}.csv`, byLang)}
        />
        <BreakdownCard
          title="Geografska analiza (ISO zemlja)"
          rows={byCountry}
          money={money}
          onExport={() => downloadCsv(`kotor-country-${range}.csv`, byCountry)}
        />
      </div>

      {/* Današnji satni raspored */}
      <div style={{ ...card, padding: 20, marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>Posjeta po satu — danas</div>
            <div style={{ fontSize: 12, color: C.textSoft, marginTop: 2 }}>{hourly.reduce((s, h) => s + h.orders, 0)} narudžbina od ponoći</div>
          </div>
          <Btn variant="secondary" icon={I.export} size="sm" onClick={() => downloadCsv("kotor-hourly-today.csv", hourly)}>CSV</Btn>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 100 }}>
          {hourly.map(h => {
            const max = Math.max(1, ...hourly.map(x => x.orders));
            return (
              <div key={h.hour} title={`${h.hour}:00 — ${h.orders} narudžbina · ${money(h.revenue)}`}
                style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                <div style={{
                  width: "100%", height: `${(h.orders / max) * 80 + (h.orders > 0 ? 2 : 0)}px`,
                  background: h.orders > 0 ? C.gold : C.borderSoft,
                  borderRadius: "3px 3px 0 0",
                }} />
                <span style={{ fontSize: 9, color: C.textFaint, fontFamily: "ui-monospace, monospace" }}>
                  {String(h.hour).padStart(2, "0")}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Refundi */}
      {refByDay.length > 0 && (
        <div style={{ ...card, padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>Refundi po danu</div>
            <Btn variant="secondary" icon={I.export} size="sm" onClick={() => downloadCsv(`kotor-refunds-${range}.csv`, refByDay)}>CSV</Btn>
          </div>
          <Table head={["Datum", "Broj", "Iznos"]}>
            {refByDay.map(r => (
              <tr key={r.date}>
                <td style={{ ...td, fontFamily: "ui-monospace, monospace" }}>{r.date}</td>
                <td style={td}>{r.count}</td>
                <td style={{ ...td, fontWeight: 700, color: C.warning }}>{money(r.sum)}</td>
              </tr>
            ))}
          </Table>
        </div>
      )}
    </div>
  );
}

function BreakdownCard({ title, rows, money, onExport }) {
  const total = rows.reduce((s, r) => s + r.sum, 0);
  return (
    <div style={{ ...card, padding: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{title}</div>
        <Btn variant="ghost" icon={I.export} size="sm" onClick={onExport}>CSV</Btn>
      </div>
      {rows.length === 0 ? (
        <div style={{ padding: 18, textAlign: "center", color: C.textFaint, fontSize: 13 }}>—</div>
      ) : (
        <div>
          {rows.slice(0, 8).map(r => {
            const pct = total > 0 ? (r.sum / total) * 100 : 0;
            return (
              <div key={r.key} style={{ padding: "9px 0", borderBottom: `1px solid ${C.borderSoft}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <span style={{ fontSize: 13, color: C.text, fontWeight: 500 }}>{r.key}</span>
                  <span style={{ fontSize: 13, color: C.text, fontWeight: 700 }}>{money(r.sum)}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ flex: 1, height: 4, background: C.bg, borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: C.primary }} />
                  </div>
                  <span style={{ fontSize: 11, color: C.textSoft, minWidth: 50, textAlign: "right" }}>
                    {r.count} · {pct.toFixed(1)}%
                  </span>
                </div>
              </div>
            );
          })}
          {rows.length > 8 && (
            <div style={{ fontSize: 12, color: C.textFaint, textAlign: "center", padding: "10px 0 0" }}>
              +{rows.length - 8} više (CSV ima sve)
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const ACTION_TONE = {
  "payment.succeeded":     "success",
  "payment.capture_failed":"danger",
  "refund.created":        "warning",
  "refund.received":       "warning",
  "email.ticket_sent":     "info",
  "email.ticket_failed":   "danger",
  "charge.dispute.created":"danger",
  "charge.dispute.updated":"warning",
  "charge.dispute.closed": "neutral",
  "retention.updated":     "info",
  "retention.cleanup_run": "info",
};

// ─── Retention card — dijeli se u Audit log i Webhooks panelu ────────────────
function RetentionCard({ kind /* "audit" | "webhook" */ }) {
  const [data, setData]   = useState(null);
  const [loading, setLoad] = useState(true);
  const [err, setErr]     = useState(null);
  const [saving, setSaving] = useState(false);
  const [running, setRun] = useState(false);
  const [auditDays, setAuditDays]     = useState(30);
  const [webhookDays, setWebhookDays] = useState(14);

  const load = async () => {
    setLoad(true); setErr(null);
    try {
      const res = await callEdge("admin-retention", { action: "get" });
      if (res?.error) throw new Error(res.error);
      setData(res);
      setAuditDays(res.settings?.audit_noncritical_days ?? 30);
      setWebhookDays(res.settings?.webhook_deliveries_days ?? 14);
    } catch (e) { setErr(String(e.message ?? e)); }
    finally { setLoad(false); }
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    setSaving(true); setErr(null);
    try {
      await callEdge("admin-retention", {
        action: "save",
        audit_noncritical_days:  Number(auditDays),
        webhook_deliveries_days: Number(webhookDays),
      });
      await load();
    } catch (e) { setErr(String(e.message ?? e)); }
    finally { setSaving(false); }
  };

  const runNow = async () => {
    if (!confirm("Pokrenuti čišćenje sada? Obrisaće se svi ne-kritični zapisi stariji od konfigurisanih dana.")) return;
    setRun(true); setErr(null);
    try {
      const res = await callEdge("admin-retention", { action: "run" });
      if (res?.error) throw new Error(res.error);
      alert(`Obrisano: ${res.deleted?.audit_deleted ?? 0} audit zapisa, ${res.deleted?.webhook_deleted ?? 0} webhook zapisa.`);
      await load();
    } catch (e) { setErr(String(e.message ?? e)); }
    finally { setRun(false); }
  };

  const isAudit = kind === "audit";
  const days = isAudit ? auditDays : webhookDays;
  const setDays = isAudit ? setAuditDays : setWebhookDays;
  const preview = isAudit ? data?.preview?.audit_would_delete : data?.preview?.webhook_would_delete;
  const critical = data?.preview?.audit_preserved_critical ?? 0;

  return (
    <div style={{ ...card, padding: 20, marginTop: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>
            {isAudit ? "Retention — audit log" : "Retention — webhook deliveries"}
          </div>
          <div style={{ fontSize: 12, color: C.textSoft, marginTop: 3, lineHeight: 1.5, maxWidth: 520 }}>
            {isAudit
              ? <>Ne-kritični zapisi se brišu automatski posle X dana. <b>Kritične akcije</b> (payment.*, refund.*, charge.dispute.*, sve admin-akcije, email.ticket_failed) <b>se čuvaju trajno</b> — zbog poreskih i revizorskih obaveza.</>
              : <>Webhook delivery log (payload + response) je debug podatak — briše se automatski posle X dana.</>
            }
          </div>
        </div>
        <Btn variant="secondary" size="sm" icon={I.clock} onClick={load}>Osvježi</Btn>
      </div>

      {err && <div style={{ padding: 10, marginBottom: 10, background: C.primarySoft, border: "1px solid #F3CFCF", borderRadius: 7, fontSize: 12, color: C.primaryDark }}>{err}</div>}

      {loading && !data ? (
        <div style={{ color: C.textSoft, fontSize: 13, padding: 12 }}>Učitavam…</div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: 14, alignItems: "center", padding: "12px 0", borderTop: `1px solid ${C.borderSoft}`, borderBottom: `1px solid ${C.borderSoft}` }}>
            <label style={{ fontSize: 13, color: C.textMuted }}>Čuvaj (dana)</label>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <input
                type="number"
                min={isAudit ? 7 : 3}
                max={isAudit ? 3650 : 180}
                value={days}
                onChange={e => setDays(e.target.value)}
                style={{ width: 100, padding: "8px 10px", borderRadius: 7, border: `1px solid ${C.border}`, fontSize: 13, fontFamily: "inherit", outline: "none" }}
              />
              <span style={{ fontSize: 12, color: C.textSoft }}>
                {isAudit ? "(min 7, max 3650)" : "(min 3, max 180)"}
              </span>
            </div>
          </div>

          <div style={{ padding: "14px 0", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div style={{ padding: 12, background: C.bg, borderRadius: 8 }}>
              <div style={{ fontSize: 11, color: C.textSoft, fontWeight: 600, letterSpacing: 0.3, textTransform: "uppercase", marginBottom: 6 }}>
                {isAudit ? "Bilo bi obrisano sad" : "Za brisanje sad"}
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: preview > 0 ? C.warning : C.text }}>
                {preview ?? 0}
              </div>
              <div style={{ fontSize: 11, color: C.textFaint, marginTop: 2 }}>zapisa</div>
            </div>
            {isAudit && (
              <div style={{ padding: 12, background: C.successSoft, borderRadius: 8, border: "1px solid #BBECCB" }}>
                <div style={{ fontSize: 11, color: "#0F7A3D", fontWeight: 600, letterSpacing: 0.3, textTransform: "uppercase", marginBottom: 6 }}>
                  Zaštićeno (kritično)
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#0F7A3D" }}>{critical}</div>
                <div style={{ fontSize: 11, color: "#0F7A3D", marginTop: 2 }}>ne brišu se automatski</div>
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <Btn onClick={save}>{saving ? "Čuvam…" : "Sačuvaj"}</Btn>
            <Btn variant="secondary" icon={I.close} onClick={runNow}>
              {running ? "Čistim…" : "Pokreni čišćenje sada"}
            </Btn>
          </div>

          <div style={{ marginTop: 14, padding: "10px 12px", background: C.infoSoft, border: "1px solid #B8DAFB", borderRadius: 8, fontSize: 11, color: "#00509D", lineHeight: 1.5 }}>
            <b>Auto-scheduler:</b> čišćenje se ne izvršava automatski dok ne aktiviraš pg_cron u Supabase Dashboard → Database → Cron sa query-jem <code style={{ background: "rgba(0,80,157,0.08)", padding: "1px 5px", borderRadius: 3 }}>select kotorwalls_cleanup_logs();</code> (predloženo: svaki dan u 03:00).
          </div>
        </>
      )}
    </div>
  );
}

function AuditLog() {
  const [data, setData]       = useState({ rows: [], total: 0, actions: [] });
  const [loading, setLoad]    = useState(true);
  const [err, setErr]         = useState(null);
  const [actionF, setActionF] = useState("");
  const [actorF, setActorF]   = useState("");
  const [expanded, setExpanded] = useState({});

  const load = async () => {
    setLoad(true); setErr(null);
    try {
      const res = await callEdge("admin-audit", {
        limit: 200,
        ...(actionF ? { action: actionF } : {}),
        ...(actorF  ? { actor_type: actorF } : {}),
      });
      if (res?.error) throw new Error(res.error);
      setData({ rows: res.rows ?? [], total: res.total ?? 0, actions: res.actions ?? [] });
    } catch (e) { setErr(String(e.message ?? e)); }
    finally { setLoad(false); }
  };
  useEffect(() => { load(); }, [actionF, actorF]);

  const exportCsv = () => {
    const rows = data.rows.map(r => ({
      timestamp: r.created_at,
      actor_type: r.actor_type,
      action: r.action,
      entity: r.entity ?? "",
      entity_id: r.entity_id ?? "",
      metadata: r.metadata ? JSON.stringify(r.metadata) : "",
      ip: r.ip ?? "",
    }));
    downloadCsv(`kotor-audit-${new Date().toISOString().slice(0,10)}.csv`, rows);
  };

  return (
    <div>
      <SectionHead
        title="Audit log"
        sub={`Svaka izmjena i sistemski događaj · ${data.total} zapisa`}
        actions={<>
          <select
            value={actionF} onChange={e => setActionF(e.target.value)}
            style={{ padding: "7px 10px", borderRadius: 7, border: `1px solid ${C.border}`, fontSize: 12, fontFamily: "inherit", background: C.surface, color: C.text, outline: "none" }}
          >
            <option value="">Sve akcije</option>
            {data.actions.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <select
            value={actorF} onChange={e => setActorF(e.target.value)}
            style={{ padding: "7px 10px", borderRadius: 7, border: `1px solid ${C.border}`, fontSize: 12, fontFamily: "inherit", background: C.surface, color: C.text, outline: "none" }}
          >
            <option value="">Svi akteri</option>
            <option value="system">system</option>
            <option value="admin">admin</option>
            <option value="user">user</option>
          </select>
          <Btn variant="secondary" icon={I.export} size="sm" onClick={exportCsv}>Izvezi CSV</Btn>
          <Btn variant="secondary" icon={I.clock} size="sm" onClick={load}>Osvježi</Btn>
        </>}
      />

      {err && <div style={{ ...card, padding: 14, marginBottom: 12, background: C.primarySoft, borderColor: "#F3CFCF", color: C.primaryDark, fontSize: 13 }}>{err}</div>}

      {loading && data.rows.length === 0 ? (
        <div style={{ ...card, padding: 40, textAlign: "center", color: C.textSoft, fontSize: 13 }}>Učitavam…</div>
      ) : data.rows.length === 0 ? (
        <>
          <Empty icon={I.audit} title="Audit log je prazan" sub="Svi događaji (kreiranja, izmjene, refundacije, greške) biće automatski zapisani." />
          <RetentionCard kind="audit" />
        </>
      ) : (
        <div style={{ ...card, overflow: "hidden" }}>
          {data.rows.map(r => {
            const isOpen = !!expanded[r.id];
            const hasMeta = r.metadata && Object.keys(r.metadata).length > 0;
            return (
              <div key={r.id} style={{ borderBottom: `1px solid ${C.borderSoft}` }}>
                <div
                  onClick={() => hasMeta && setExpanded(e => ({ ...e, [r.id]: !isOpen }))}
                  style={{ display: "flex", padding: "11px 18px", gap: 14, cursor: hasMeta ? "pointer" : "default", alignItems: "center" }}
                >
                  <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 11, color: C.textSoft, width: 140, flexShrink: 0 }}>
                    {new Date(r.created_at).toLocaleString("sr-Latn", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                  </div>
                  <div style={{ width: 70, flexShrink: 0 }}>
                    <Badge tone={r.actor_type === "admin" ? "brand" : r.actor_type === "system" ? "info" : "neutral"}>
                      {r.actor_type}
                    </Badge>
                  </div>
                  <div style={{ width: 210, flexShrink: 0 }}>
                    <Badge tone={ACTION_TONE[r.action] ?? "neutral"}>{r.action}</Badge>
                  </div>
                  <div style={{ fontSize: 12, color: C.textMuted, fontFamily: "ui-monospace, monospace", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {r.entity && <span>{r.entity}</span>}
                    {r.entity_id && <span style={{ color: C.textFaint }}> · {r.entity_id.slice(0, 8)}…</span>}
                  </div>
                  {hasMeta && (
                    <div style={{ color: C.textFaint, fontSize: 11 }}>
                      {isOpen ? <Ico d={I.up} size={12} /> : <Ico d={I.down} size={12} />}
                    </div>
                  )}
                </div>
                {isOpen && hasMeta && (
                  <div style={{
                    padding: "10px 18px 14px 172px", background: C.bg,
                    fontFamily: "ui-monospace, monospace", fontSize: 11, color: C.textMuted,
                    whiteSpace: "pre-wrap", wordBreak: "break-all",
                  }}>
                    {JSON.stringify(r.metadata, null, 2)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <RetentionCard kind="audit" />
    </div>
  );
}

function ApiDocs() {
  return (
    <div>
      <SectionHead title="API i SDK" sub="REST + JSON · test i produkcija · SDK primjeri" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={{ ...card, padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 12 }}>API ključevi</div>
          {[
            ["Produkcija · tajni",  "sk_live_••••••••••••7af2"],
            ["Produkcija · javni",  "pk_live_2A91…E1"],
            ["Test · tajni",        "sk_test_••••••••••••9d01"],
            ["Test · javni",        "pk_test_BC42…77"],
          ].map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${C.borderSoft}` }}>
              <span style={{ fontSize: 12, color: C.textMuted }}>{k}</span>
              <span style={{ fontSize: 12, fontFamily: "ui-monospace, monospace", color: C.text, fontWeight: 600 }}>{v}</span>
            </div>
          ))}
          <div style={{ marginTop: 14, display: "flex", gap: 8 }}>
            <Btn icon={I.plus} size="sm">Novi ključ</Btn>
            <Btn variant="secondary" size="sm">Rotiraj</Btn>
          </div>
        </div>

        <div style={{ ...card, padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 12 }}>Endpointi</div>
          {[
            ["POST", "/v1/tickets"],
            ["POST", "/v1/tickets/validate"],
            ["POST", "/v1/payments"],
            ["POST", "/v1/refunds"],
            ["POST", "/v1/fiscal/invoice"],
            ["GET",  "/v1/reports/daily"],
          ].map(([m, p]) => (
            <div key={p} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: `1px solid ${C.borderSoft}` }}>
              <Badge tone={m === "GET" ? "info" : "brand"}>{m}</Badge>
              <span style={{ fontSize: 12, fontFamily: "ui-monospace, monospace", color: C.text }}>{p}</span>
            </div>
          ))}
          <div style={{ marginTop: 14 }}>
            <Btn variant="secondary" size="sm" icon={I.link}>Otvori dokumentaciju</Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

function Webhooks() {
  const [endpoints, setEndpoints] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [stripeEvents, setStripeEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  const load = async () => {
    setLoading(true); setErr(null);
    try {
      const res = await callEdge("admin-webhooks", { limit: 50 });
      setEndpoints(res.endpoints ?? []);
      setDeliveries(res.deliveries ?? []);
      setStripeEvents(res.stripe_events ?? []);
    } catch (e) { setErr(String(e.message ?? e)); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const fmtTime = (iso) => {
    if (!iso) return "—";
    try { return new Date(iso).toLocaleString("sr-ME", { dateStyle: "short", timeStyle: "short" }); } catch { return iso; }
  };

  // Boja po tipu eventa za vizuelno razlikovanje
  const eventTone = (action) => {
    if (action.startsWith("payment.")) return action === "payment.succeeded" ? "success" : "danger";
    if (action.startsWith("refund."))  return "warning";
    if (action.startsWith("charge.dispute.")) return "danger";
    if (action.startsWith("email."))   return action === "email.ticket_sent" ? "success" : "danger";
    return "neutral";
  };

  return (
    <div>
      <SectionHead
        title="Webhook-ovi"
        sub="Stripe događaji (incoming) + outgoing endpointi (partneri)"
        actions={<Btn icon={I.refresh} size="sm" onClick={load}>Osvježi</Btn>}
      />

      {err && (
        <div style={{ padding: "10px 14px", background: C.primarySoft, border: `1px solid ${C.border}`, borderRadius: 8, color: C.primaryDark, fontSize: 12, marginBottom: 12 }}>
          {err}
        </div>
      )}

      {/* ── Stripe incoming events ─────────────────────────────────── */}
      <div style={{ fontSize: 13, fontWeight: 700, color: C.text, margin: "4px 0 8px" }}>
        Stripe događaji (incoming) — payment.* · refund.* · charge.dispute.* · email.ticket_*
      </div>
      {loading ? (
        <div style={{ padding: 24, textAlign: "center", color: C.textSoft, fontSize: 13 }}>Učitavanje…</div>
      ) : stripeEvents.length === 0 ? (
        <Empty icon={I.webhook} title="Nema Stripe događaja" sub="Kad Stripe pošalje payment_intent.succeeded webhook, akcija će se pojaviti ovdje." />
      ) : (
        <Table head={["Vrijeme", "Događaj", "Order ID", "Detalji"]}>
          {stripeEvents.map(e => {
            const meta = e.metadata || {};
            const detail = meta.amount != null ? `€${Number(meta.amount).toFixed(2)}${meta.brand ? ` · ${meta.brand}` : ""}${meta.country ? ` · ${meta.country}` : ""}` : (meta.error ? `error: ${meta.error}` : "");
            return (
              <tr key={e.id}>
                <td style={{ ...td, color: C.textSoft, fontSize: 12 }}>{fmtTime(e.created_at)}</td>
                <td style={td}><Badge tone={eventTone(e.action)}>{e.action}</Badge></td>
                <td style={{ ...td, fontFamily: "ui-monospace, monospace", color: C.textMuted, fontSize: 11 }}>
                  {(e.entity_id || "").slice(0, 8)}{e.entity_id ? "…" : "—"}
                </td>
                <td style={{ ...td, color: C.textMuted, fontSize: 12 }}>{detail}</td>
              </tr>
            );
          })}
        </Table>
      )}

      {/* ── Outgoing endpointi (partneri) ──────────────────────────── */}
      <div style={{ fontSize: 13, fontWeight: 700, color: C.text, margin: "24px 0 8px" }}>
        Outgoing endpointi (partneri)
      </div>
      {loading ? null : endpoints.length === 0 ? (
        <Empty icon={I.webhook} title="Nema registrovanih endpointa" sub="Endpointi se kreiraju direktno u bazi (kotorwalls_webhooks). Partneri (fiskal, Booking, GYG) primaju događaje na registrovani URL." />
      ) : (
        <Table head={["URL", "Događaji", "Status", "Zadnja isporuka"]}>
          {endpoints.map(w => (
            <tr key={w.id}>
              <td style={{ ...td, fontFamily: "ui-monospace, monospace", color: C.primaryDark, fontWeight: 600, fontSize: 12 }}>{w.url}</td>
              <td style={{ ...td, color: C.textMuted, fontFamily: "ui-monospace, monospace", fontSize: 11 }}>{Array.isArray(w.events) ? w.events.join(", ") : w.events}</td>
              <td style={td}><Badge tone={w.status === "healthy" ? "success" : "danger"}>{w.status}</Badge></td>
              <td style={{ ...td, color: C.textSoft, fontSize: 12 }}>{fmtTime(w.last_delivery_at)}</td>
            </tr>
          ))}
        </Table>
      )}

      {/* ── Outgoing isporuke ─────────────────────────────────────── */}
      {!loading && deliveries.length > 0 && (
        <>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.text, margin: "20px 0 8px" }}>
            Outgoing isporuke
          </div>
          <Table head={["Vrijeme", "Događaj", "Webhook", "HTTP", "Trajanje", "Status"]}>
            {deliveries.map(d => (
              <tr key={d.id}>
                <td style={{ ...td, color: C.textSoft, fontSize: 12 }}>{fmtTime(d.created_at)}</td>
                <td style={{ ...td, fontFamily: "ui-monospace, monospace", fontSize: 12, color: C.text }}>{d.event_type}</td>
                <td style={{ ...td, color: C.textSoft, fontSize: 11, fontFamily: "ui-monospace, monospace" }}>{(d.webhook_id || "").slice(0, 8)}</td>
                <td style={{ ...td, fontFamily: "ui-monospace, monospace", color: d.response_code >= 200 && d.response_code < 300 ? "#15803D" : C.primaryDark, fontWeight: 600 }}>{d.response_code ?? "—"}</td>
                <td style={{ ...td, color: C.textMuted, fontSize: 12 }}>{d.response_ms != null ? `${d.response_ms}ms` : "—"}</td>
                <td style={td}><Badge tone={d.success ? "success" : "danger"}>{d.success ? "OK" : "FAIL"}</Badge></td>
              </tr>
            ))}
          </Table>
        </>
      )}

      <RetentionCard kind="webhook" />
    </div>
  );
}

function UsersPanel() {
  return (
    <div>
      <SectionHead title="Korisnici i uloge" sub="Role-based pristup · SSO · 2FA" actions={<Btn icon={I.plus} size="sm">Pozovi korisnika</Btn>} />
      {USERS.length === 0 ? (
        <Empty icon={I.users} title="Nema dodatnih korisnika" sub="Pozovi operatere, partnere i administratore preko email adrese." />
      ) : (
        <Table head={["Ime", "Email", "Uloga", "Posljednje", ""]}>
          {USERS.map(u => (
            <tr key={u.id}>
              <td style={{ ...td, fontWeight: 600 }}>{u.name}</td>
              <td style={{ ...td, color: C.textMuted, fontFamily: "ui-monospace, monospace", fontSize: 12 }}>{u.email}</td>
              <td style={td}><Badge tone={u.role === "Admin" ? "brand" : u.role === "Operator" ? "info" : "neutral"}>{u.role}</Badge></td>
              <td style={{ ...td, color: C.textSoft }}>{u.last}</td>
              <td style={{ ...td, textAlign: "right" }}><Btn variant="ghost" icon={I.edit} size="sm">Izmjeni</Btn></td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  );
}

function PaymentModeCard() {
  const [mode, setMode] = useState(getStripeMode());

  useEffect(() => {
    const h = (e) => setMode(e.detail);
    window.addEventListener("kw:mode-change", h);
    return () => window.removeEventListener("kw:mode-change", h);
  }, []);

  const switchTo = (next) => {
    if (next === mode) return;
    const msg = next === "live"
      ? "Prebaciti na PRODUKCIJU? Sljedeća plaćanja će koristiti stvarne kartice i stvarni novac."
      : "Prebaciti na TEST mod? Sljedeća plaćanja neće naplaćivati stvarni novac (samo testne kartice).";
    if (!confirm(msg)) return;
    setStripeMode(next);
    setMode(next);
    setTimeout(() => window.location.reload(), 150);
  };

  const isTest = mode === "test";
  const pillStyle = (active, activeColor, activeBg, activeBorder) => ({
    padding: "10px 18px", fontSize: 13, fontWeight: 700,
    borderRadius: 8, cursor: active ? "default" : "pointer",
    background: active ? activeBg : C.surface,
    color:      active ? activeColor : C.textMuted,
    border:     `1.5px solid ${active ? activeBorder : C.border}`,
    fontFamily: "inherit",
    display: "inline-flex", alignItems: "center", gap: 8,
    transition: "all 0.12s",
  });

  return (
    <div style={{ ...card, padding: 20, gridColumn: "1 / -1" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>Režim naplate</div>
          <div style={{ fontSize: 12, color: C.textSoft, marginTop: 3 }}>
            Produkcija naplaćuje stvarne kartice. Test mod koristi testne ključeve i ne dira stvarni novac.
          </div>
        </div>
        <Badge tone={isTest ? "warning" : "success"}>
          {isTest ? "TEST" : "PRODUKCIJA"}
        </Badge>
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
        <button
          onClick={() => switchTo("live")}
          disabled={!isTest}
          style={pillStyle(!isTest, "#0F7A3D", C.successSoft, "#BBECCB")}
        >
          <span style={{
            width: 8, height: 8, borderRadius: "50%",
            background: !isTest ? "#2F7D4F" : C.textFaint,
          }} />
          Produkcija
        </button>
        <button
          onClick={() => switchTo("test")}
          disabled={isTest}
          style={pillStyle(isTest, "#8A5A00", C.warningSoft, "#F5DCA8")}
        >
          <span style={{
            width: 8, height: 8, borderRadius: "50%",
            background: isTest ? "#C98015" : C.textFaint,
          }} />
          Test
        </button>
      </div>

      {isTest && (
        <div style={{
          marginTop: 14, padding: "10px 12px", borderRadius: 8,
          background: C.warningSoft, border: "1px solid #F5DCA8",
          fontSize: 12, color: "#8A5A00", lineHeight: 1.5,
        }}>
          Sistem je u test modu. Testna kartica: <b>4242 4242 4242 4242</b> · CVC bilo koji · datum u budućnosti.
        </div>
      )}
    </div>
  );
}

function Settings() {
  return (
    <div>
      <SectionHead title="Podešavanja" sub="Organizacija, jezici, valute, obavještenja" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <PaymentModeCard />
        {[
          ["Organizacija",   [["Naziv", "Opština Kotor"], ["Valuta", "EUR"], ["Vremenska zona", "Europe/Podgorica"]]],
          ["Jezici",         [["Podržani", "EN · ME · DE · RU · ZH"], ["Podrazumijevani", "EN"]]],
          ["Email",          [["Pošiljalac", "tickets@kotorwalls.me"], ["Domen verifikacija", "SPF + DKIM"]]],
          ["Notifikacije",   [["Dnevni izvještaj", "22:00"], ["Alert sistema", "SMS + Email"]]],
        ].map(([title, rows]) => (
          <div key={title} style={{ ...card, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 12 }}>{title}</div>
            {rows.map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: `1px solid ${C.borderSoft}` }}>
                <span style={{ fontSize: 13, color: C.textMuted }}>{k}</span>
                <span style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>{v}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Nav ──────────────────────────────────────────────────────────────────────
const NAV = [
  { group: "Pregled", items: [
    { key: "overview", label: "Dashboard", icon: I.home },
  ]},
  { group: "Prodaja", items: [
    { key: "tickets",     label: "Ulaznice",      icon: I.ticket },
    { key: "transactions",label: "Transakcije",   icon: I.tx },
    { key: "refunds",     label: "Refundacije",   icon: I.refund },
  ]},
  { group: "Kanali", items: [
    { key: "channels", label: "Kanali",     icon: I.channel },
    { key: "kiosks",   label: "Kiosci",     icon: I.kiosk },
    { key: "gates",    label: "Prolazi",    icon: I.gate },
  ]},
  { group: "Finansije", items: [
    { key: "payments", label: "Plaćanja",       icon: I.pay },
    { key: "fraud",    label: "Prevencija prevara", icon: I.fraud },
    { key: "fiscal",   label: "Fiskalizacija",  icon: I.fiscal },
    { key: "reports",  label: "Izvještaji",     icon: I.report },
  ]},
  { group: "Sistem", items: [
    { key: "audit",    label: "Audit log",  icon: I.audit },
    { key: "api",      label: "API i SDK",  icon: I.api },
    { key: "webhooks", label: "Webhook-ovi", icon: I.webhook },
    { key: "users",    label: "Korisnici",  icon: I.users },
    { key: "settings", label: "Podešavanja", icon: I.settings },
  ]},
];

const PANELS = {
  overview:     <Overview />,
  tickets:      <TicketsPanel />,
  categories:   <Categories />,
  transactions: <Transactions />,
  refunds:      <Refunds />,
  channels:     <ChannelsPanel />,
  kiosks:       <Kiosks />,
  gates:        <GatesPanel />,
  payments:     <Payments />,
  fraud:        <Fraud />,
  fiscal:       <Fiscal />,
  reports:      <Reports />,
  audit:        <AuditLog />,
  api:          <ApiDocs />,
  webhooks:     <Webhooks />,
  users:        <UsersPanel />,
  settings:     <Settings />,
};

// ─── Shell ────────────────────────────────────────────────────────────────────
export default function KotorAdmin() {
  const [active, setActive] = useState("overview");

  const currentLabel = NAV.flatMap(g => g.items).find(i => i.key === active)?.label;

  return (
    <div style={{
      display: "flex", height: "100vh", overflow: "hidden",
      background: C.bg, color: C.text,
      fontFamily: "'Inter', 'DM Sans', system-ui, -apple-system, sans-serif",
    }}>
      {/* Sidebar */}
      <aside style={{
        width: 248, minWidth: 248,
        background: C.surface,
        borderRight: `1px solid ${C.border}`,
        display: "flex", flexDirection: "column",
      }}>
        {/* Brand */}
        <div style={{ padding: "18px 18px 14px", borderBottom: `1px solid ${C.borderSoft}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img
              src="https://hvpytasddzeprgqkwlbu.supabase.co/storage/v1/object/public/razno/kotor.png"
              alt="Kotor Walls"
              style={{ width: 32, height: 32, borderRadius: 7, objectFit: "contain", display: "block" }}
            />
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.text, letterSpacing: "-0.2px" }}>Kotor Walls</div>
              <div style={{ fontSize: 11, color: C.textSoft }}>Admin · Produkcija</div>
            </div>
          </div>
        </div>

        <nav style={{ flex: 1, padding: "10px 10px 14px", overflowY: "auto" }}>
          {NAV.map(group => (
            <div key={group.group} style={{ marginBottom: 14 }}>
              <div style={{
                fontSize: 10, fontWeight: 700, color: C.textFaint,
                letterSpacing: "0.8px", textTransform: "uppercase",
                padding: "4px 10px 6px",
              }}>{group.group}</div>
              {group.items.map(it => {
                const on = active === it.key;
                return (
                  <button key={it.key} onClick={() => setActive(it.key)}
                    style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "7px 10px", borderRadius: 6, border: "none",
                      background: on ? C.primarySoft : "transparent",
                      color: on ? C.primaryDark : C.textMuted,
                      fontSize: 13, fontWeight: on ? 600 : 500,
                      cursor: "pointer", width: "100%", textAlign: "left",
                      fontFamily: "inherit", marginBottom: 1,
                      transition: "background 0.12s",
                    }}
                    onMouseEnter={e => { if (!on) e.currentTarget.style.background = C.bg; }}
                    onMouseLeave={e => { if (!on) e.currentTarget.style.background = "transparent"; }}
                  >
                    <span style={{ display: "flex" }}><Ico d={it.icon} size={15} /></span>
                    {it.label}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User footer */}
        <div style={{ padding: 12, borderTop: `1px solid ${C.borderSoft}`, display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 999,
            background: C.primarySoft, color: C.primaryDark,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, fontWeight: 700,
          }}>RM</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Rade Milošević</div>
            <div style={{ fontSize: 11, color: C.textSoft }}>Admin</div>
          </div>
          <button style={{ border: `1px solid ${C.border}`, background: C.surface, width: 28, height: 28, borderRadius: 6, cursor: "pointer", color: C.textSoft, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Ico d={I.settings} size={13} />
          </button>
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Topbar */}
        <header style={{
          height: 56, background: C.surface, borderBottom: `1px solid ${C.border}`,
          display: "flex", alignItems: "center", padding: "0 22px", gap: 14, flexShrink: 0,
        }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{currentLabel}</div>
          <span style={{ fontSize: 11, color: C.textSoft, background: C.bg, border: `1px solid ${C.border}`, padding: "3px 9px", borderRadius: 6, fontFamily: "ui-monospace, monospace" }}>/{active}</span>

          <div style={{ flex: 1 }} />

          <SearchBar placeholder="Pretraga ulaznica, kupaca, ID-ova…" />

          <button style={{
            width: 34, height: 34, border: `1px solid ${C.border}`, background: C.surface,
            borderRadius: 7, cursor: "pointer", color: C.textMuted,
            display: "flex", alignItems: "center", justifyContent: "center", position: "relative",
          }}>
            <Ico d={I.bell} size={15} />
            <span style={{ position: "absolute", top: 7, right: 8, width: 7, height: 7, background: C.danger, borderRadius: "50%", border: `2px solid ${C.surface}` }} />
          </button>

          <Badge tone="success"><span style={{ width: 6, height: 6, background: C.success, borderRadius: "50%" }} /> Sistem OK</Badge>
        </header>

        {/* Content */}
        <main style={{ flex: 1, overflow: "auto", padding: "24px 24px 40px" }}>
          <div style={{ maxWidth: 1280, margin: "0 auto" }}>
            {PANELS[active]}
          </div>
        </main>
      </div>
    </div>
  );
}
