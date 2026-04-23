import { useState, useEffect } from "react";
import { rest } from "./supabaseClient.js";

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
const BAR   = [0,0,0,0,0,0,0,0,0,0,0,0];
const BAR_L = ["Jan","Feb","Mar","Apr","Maj","Jun","Jul","Avg","Sep","Okt","Nov","Dec"];
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
const WEBHOOKS  = [];

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

function Stat({ label, value, delta, tone = "success" }) {
  return (
    <div style={{ ...card, padding: 18 }}>
      <div style={{ fontSize: 12, color: C.textSoft, fontWeight: 500, marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700, color: C.text, letterSpacing: "-0.5px", lineHeight: 1 }}>{value}</div>
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
  const maxBar = Math.max(...BAR);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <SectionHead
        title="Pregled"
        sub="Prodaja, prihodi i aktivnost u realnom vremenu"
        actions={<>
          <Btn variant="secondary" icon={I.export} size="sm">Izvezi</Btn>
          <Btn icon={I.plus} size="sm">Nova prodaja</Btn>
        </>}
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
        <Stat label="Prodaje danas"    value="0"    />
        <Stat label="Prihod danas"     value="€0"   />
        <Stat label="Ovaj mjesec"      value="0"    />
        <Stat label="Prosjek / dan"    value="0"    />
        <Stat label="Otvoreni sporovi" value="0"    />
      </div>

      <div style={{ ...card, padding: 22 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>Mjesečne posjete</div>
            <div style={{ fontSize: 12, color: C.textSoft, marginTop: 2 }}>2025 · Kotorske zidine</div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {["7D", "30D", "12M"].map((r, i) => (
              <button key={r} style={{
                padding: "5px 11px", fontSize: 12, fontWeight: 600,
                background: i === 2 ? C.goldSoft : C.surface,
                color: i === 2 ? C.goldDark : C.textMuted,
                border: `1px solid ${i === 2 ? "#EADD9C" : C.border}`,
                borderRadius: 6, cursor: "pointer",
              }}>{r}</button>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 140 }}>
          {BAR.map((v, i) => (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <div style={{
                width: "100%", height: `${(v / maxBar) * 120}px`,
                background: i >= 10 ? `linear-gradient(180deg, ${C.primary}, ${C.primaryDark})` : C.goldSoft,
                borderRadius: "6px 6px 0 0",
              }} />
              <span style={{ fontSize: 10, color: C.textFaint, fontWeight: 500 }}>{BAR_L[i]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Channels snapshot + Recent */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 18 }}>
        <div style={{ ...card, overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: `1px solid ${C.borderSoft}`, fontSize: 14, fontWeight: 600, color: C.text }}>
            Kanali prodaje · danas
          </div>
          <div style={{ padding: "6px 0" }}>
            {CHANNELS.map(c => (
              <div key={c.key} style={{ display: "flex", alignItems: "center", padding: "10px 18px", gap: 12 }}>
                <div style={{ width: 28, height: 28, borderRadius: 7, background: C.primarySoft, color: C.primaryDark, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Ico d={c.icon} size={14} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: C.text, fontWeight: 500 }}>{c.name}</div>
                  <div style={{ marginTop: 5, height: 4, background: C.bg, borderRadius: 4 }}>
                    <div style={{ height: "100%", width: `${c.pct}%`, background: c.live ? C.primary : C.textFaint, borderRadius: 4 }} />
                  </div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.text, width: 40, textAlign: "right" }}>{c.today}</div>
                {!c.live && <Badge tone="warning">soon</Badge>}
              </div>
            ))}
          </div>
        </div>

        <div style={{ ...card, overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: `1px solid ${C.borderSoft}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>Posljednje ulaznice</div>
            <Badge tone="brand">Live</Badge>
          </div>
          {RECENT_TICKETS.length === 0 ? (
            <div style={{ padding: "40px 18px", textAlign: "center", color: C.textSoft, fontSize: 13 }}>
              Još nema izdatih ulaznica.
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                {RECENT_TICKETS.map((t, i) => (
                  <tr key={t.id} style={{ borderBottom: i < RECENT_TICKETS.length - 1 ? `1px solid ${C.borderSoft}` : "none" }}>
                    <td style={{ padding: "10px 18px", fontSize: 12, fontFamily: "ui-monospace, monospace", color: C.primaryDark, fontWeight: 600 }}>{t.id}</td>
                    <td style={{ padding: "10px 18px", fontSize: 13, color: C.text }}>{t.type}</td>
                    <td style={{ padding: "10px 18px", fontSize: 12, color: C.textMuted }}>{t.channel}</td>
                    <td style={{ padding: "10px 18px", fontSize: 12, color: C.textSoft, fontFamily: "ui-monospace, monospace" }}>{t.time}</td>
                    <td style={{ padding: "10px 18px", fontSize: 13, fontWeight: 700, color: C.text }}>€{t.price.toFixed(2)}</td>
                    <td style={{ padding: "10px 18px", textAlign: "right" }}>
                      <Badge tone={t.status === "valid" ? "success" : "neutral"}>{t.status}</Badge>
                    </td>
                  </tr>
                ))}
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
      const payload = {
        code: code.trim().toLowerCase(),
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

function Transactions() {
  return (
    <div>
      <SectionHead
        title="Transakcije"
        sub="Plaćanja, refundacije, storniranja i chargeback-ovi"
        actions={<>
          <SearchBar />
          <Btn variant="secondary" icon={I.filter} size="sm">Filter</Btn>
          <Btn variant="secondary" icon={I.export} size="sm">Izvoz</Btn>
        </>}
      />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 18 }}>
        <Stat label="Uspješne (24h)" value="0" />
        <Stat label="Refundirano"    value="0" />
        <Stat label="Neuspjele"      value="0" />
        <Stat label="Chargeback"     value="0" />
      </div>
      <Empty icon={I.tx} title="Nema transakcija" sub="Ovdje će biti prikazana sva plaćanja, refundacije i chargeback-ovi." />
    </div>
  );
}

function Refunds() {
  return (
    <div>
      <SectionHead title="Refundacije i chargeback" sub="Ručno ili djelimično vraćanje sredstava + praćenje sporova" />
      <div style={{ ...card, padding: 40, textAlign: "center" }}>
        <div style={{ color: C.textSoft, marginBottom: 12 }}><Ico d={I.refund} size={32} /></div>
        <div style={{ fontSize: 15, fontWeight: 600, color: C.text }}>Nema otvorenih zahtjeva</div>
        <div style={{ fontSize: 13, color: C.textSoft, marginTop: 6 }}>Pokreni refundaciju iz detalja transakcije.</div>
      </div>
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

function Fraud() {
  return (
    <div>
      <SectionHead title="Prevencija prevara" sub="ML risk score + admin pravila + audit log odluka" />
      <div style={{ ...card, padding: 22 }}>
        {[
          ["Blokiraj preko 5 kupovina iste kartice / sat",          true],
          ["Označi transakcije sa risk score > 80",                 true],
          ["Zahtijevaj 3DS challenge za iznose preko €100",         true],
          ["Blokiraj IP adrese sa više neuspjelih pokušaja",        true],
          ["Auto-review za nove BIN brojeve",                       false],
        ].map(([r, on]) => (
          <div key={r} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: `1px solid ${C.borderSoft}` }}>
            <span style={{ fontSize: 13, color: C.text }}>{r}</span>
            <Badge tone={on ? "success" : "neutral"}>{on ? "aktivno" : "pauzirano"}</Badge>
          </div>
        ))}
      </div>
    </div>
  );
}

function Fiscal() {
  return (
    <div>
      <SectionHead title="Fiskalizacija" sub="Crnogorski ENU + QR na računu" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={{ ...card, padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 14 }}>Status konekcije</div>
          {[
            ["ENU servis",        "online",  "success"],
            ["Sertifikat",        "važi do 2026-11-12", "success"],
            ["Posljednji IKOF",   "5a2c…bd2f", "neutral"],
            ["Neizlistanih", "0", "success"],
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
            ["PDV stopa",          "21%"],
            ["Poreska šifra",      "PDV-021"],
            ["Operater default",   "KW-ADMIN"],
            ["Obrasci računa",     "A4 · 80mm"],
          ].map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: `1px solid ${C.borderSoft}` }}>
              <span style={{ fontSize: 13, color: C.textMuted }}>{k}</span>
              <span style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Reports() {
  return (
    <div>
      <SectionHead title="Izvještaji" sub="Dnevni / mjesečni / godišnji · konsolidovano · ad-hoc izvoz" actions={<Btn icon={I.plus} size="sm">Novi izvještaj</Btn>} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
        {[
          ["Dnevni promet",      "Automatski svaki dan u 23:59", I.report],
          ["Mjesečni pregled",   "1. u mjesecu — finansijski",   I.report],
          ["Godišnji izvještaj", "Konsolidovano po kanalima",    I.report],
          ["Ad-hoc izvoz",       "Excel / PDF — po filterima",   I.export],
          ["Posjeta po satu",    "Kapacitet i prolazi",          I.clock],
          ["Geografska analiza", "Po jeziku / zemlji",           I.channel],
        ].map(([t, s, ic]) => (
          <div key={t} style={{ ...card, padding: 18 }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: C.primarySoft, color: C.primaryDark, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
              <Ico d={ic} size={16} />
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{t}</div>
            <div style={{ fontSize: 12, color: C.textSoft, marginTop: 4, lineHeight: 1.5 }}>{s}</div>
            <div style={{ marginTop: 12, display: "flex", gap: 6 }}>
              <Btn variant="secondary" size="sm" icon={I.export}>PDF</Btn>
              <Btn variant="ghost" size="sm">Excel</Btn>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AuditLog() {
  const rows = [];
  return (
    <div>
      <SectionHead title="Audit log" sub="Svaka izmjena i sistemski događaj — nepromjenjivo" actions={<Btn variant="secondary" icon={I.export} size="sm">Izvezi</Btn>} />
      {rows.length === 0 ? (
        <Empty icon={I.audit} title="Audit log je prazan" sub="Svi događaji (kreiranja, izmjene, refundacije, greške) biće automatski zapisani." />
      ) : (
        <div style={{ ...card, overflow: "hidden" }}>
          {rows.map((r, i) => (
            <div key={i} style={{ display: "flex", padding: "12px 18px", borderBottom: i < rows.length - 1 ? `1px solid ${C.borderSoft}` : "none", gap: 14 }}>
              <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 12, color: C.textSoft, width: 60 }}>{r.w}</div>
              <div style={{ fontSize: 12, color: C.primaryDark, fontWeight: 600, width: 180 }}>{r.u}</div>
              <div style={{ fontSize: 13, color: C.text, flex: 1 }}>{r.a}</div>
            </div>
          ))}
        </div>
      )}
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
  return (
    <div>
      <SectionHead title="Webhook-ovi" sub="Potpisani, autentikovani događaji · payment.* · refund.* · ticket.*" actions={<Btn icon={I.plus} size="sm">Novi endpoint</Btn>} />
      {WEBHOOKS.length === 0 ? (
        <Empty icon={I.webhook} title="Nema registrovanih endpointa" sub="Dodaj URL partnera (npr. fiskal, Booking, GYG) da automatski primaju događaje." />
      ) : (
        <Table head={["URL", "Događaji", "Status", ""]}>
          {WEBHOOKS.map(w => (
            <tr key={w.id}>
              <td style={{ ...td, fontFamily: "ui-monospace, monospace", color: C.primaryDark, fontWeight: 600 }}>{w.url}</td>
              <td style={{ ...td, color: C.textMuted, fontFamily: "ui-monospace, monospace", fontSize: 12 }}>{w.events}</td>
              <td style={td}><Badge tone={w.status === "healthy" ? "success" : "danger"}>{w.status}</Badge></td>
              <td style={{ ...td, textAlign: "right" }}>
                <Btn variant="ghost" size="sm">Pošalji test</Btn>
                <Btn variant="ghost" icon={I.edit} size="sm">Izmjeni</Btn>
              </td>
            </tr>
          ))}
        </Table>
      )}
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

function Settings() {
  return (
    <div>
      <SectionHead title="Podešavanja" sub="Organizacija, jezici, valute, obavještenja" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {[
          ["Organizacija",   [["Naziv", "Kotor City Walls d.o.o."], ["PIB", "03123456"], ["Valuta", "EUR"], ["Vremenska zona", "Europe/Podgorica"]]],
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
            <div style={{
              width: 30, height: 30, borderRadius: 7,
              background: `linear-gradient(135deg, ${C.gold} 0%, ${C.primary} 100%)`,
              color: "#fff", fontWeight: 800, fontSize: 13,
              display: "flex", alignItems: "center", justifyContent: "center",
              letterSpacing: "-0.3px",
            }}>KW</div>
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
