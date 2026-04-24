import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import KotorAdmin from "./KotorAdmin.jsx";
import KotorTicket from "./KotorTicket.jsx";
import KotorTicketsDisplay from "./KotorTicketsDisplay.jsx";
import { getStripeMode } from "./supabaseClient.js";

// ─── Test mode banner ───────────────────────────────────────────────────────
function TestModeBanner() {
  const [mode, setMode] = useState(getStripeMode());
  useEffect(() => {
    const h = (e) => setMode(e.detail);
    window.addEventListener("kw:mode-change", h);
    return () => window.removeEventListener("kw:mode-change", h);
  }, []);
  if (mode !== "test") return null;
  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 10000,
      padding: "6px 12px", textAlign: "center",
      background: "#C98015", color: "#fff",
      fontSize: 11, fontWeight: 700, letterSpacing: 0.3,
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      TEST MOD — plaćanja nisu stvarna. Promijeni u Admin → Podešavanja → Režim naplate.
    </div>
  );
}

// ─── Admin login gate ───────────────────────────────────────────────────────
const ADMIN_USER = "demo";
const ADMIN_PASS = "2026!";
const SESSION_KEY = "kw_admin_session";

function AdminLogin({ onOk }) {
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [err, setErr] = useState("");

  const submit = (e) => {
    e.preventDefault();
    if (u === ADMIN_USER && p === ADMIN_PASS) {
      try { sessionStorage.setItem(SESSION_KEY, "1"); } catch {}
      onOk();
    } else {
      setErr("Pogrešni podaci.");
    }
  };

  const input = {
    width: "100%", padding: "10px 12px", borderRadius: 8,
    border: "1px solid #E6E8EB", fontSize: 14, color: "#1A1F2B",
    fontFamily: "inherit", outline: "none", background: "#fff",
  };
  const label = { fontSize: 12, fontWeight: 600, color: "#4A5363", marginBottom: 5, display: "block" };

  return (
    <div style={{
      minHeight: "100vh", background: "#F7F8FA",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Inter', system-ui, sans-serif", padding: 20,
    }}>
      <form onSubmit={submit} style={{
        width: "100%", maxWidth: 360,
        background: "#fff", borderRadius: 14,
        border: "1px solid #E6E8EB",
        padding: 28,
        boxShadow: "0 4px 20px rgba(26,31,43,0.04)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 7,
            background: "linear-gradient(135deg, #C9A227 0%, #B23A3A 100%)",
            color: "#fff", fontWeight: 800, fontSize: 13,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>KW</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#1A1F2B" }}>Kotor Walls</div>
            <div style={{ fontSize: 11, color: "#6B7684" }}>Admin prijava</div>
          </div>
        </div>

        <div style={{ display: "grid", gap: 12 }}>
          <div>
            <label style={label}>Korisnik</label>
            <input style={input} value={u} onChange={e => setU(e.target.value)} autoFocus autoComplete="username" />
          </div>
          <div>
            <label style={label}>Šifra</label>
            <input type="password" style={input} value={p} onChange={e => setP(e.target.value)} autoComplete="current-password" />
          </div>
        </div>

        {err && (
          <div style={{
            marginTop: 12, padding: "9px 11px", borderRadius: 8,
            background: "#FBE9E9", border: "1px solid #F3CFCF",
            color: "#8E2A2A", fontSize: 12, fontWeight: 500,
          }}>{err}</div>
        )}

        <button type="submit" style={{
          width: "100%", marginTop: 16, padding: 12, border: "none", borderRadius: 8,
          background: "#B23A3A", color: "#fff", fontSize: 14, fontWeight: 700,
          cursor: "pointer", fontFamily: "inherit",
          boxShadow: "0 1px 2px rgba(178,58,58,0.25)",
        }}>Prijavi se</button>
      </form>
    </div>
  );
}

function AdminGate() {
  const [ok, setOk] = useState(() => {
    try { return sessionStorage.getItem(SESSION_KEY) === "1"; } catch { return false; }
  });
  if (!ok) return <AdminLogin onOk={() => setOk(true)} />;
  return <KotorAdmin />;
}

// ─── Routing (path-based + hash fallback) ───────────────────────────────────
function useRoute() {
  const get = () => ({
    path: window.location.pathname,
    search: window.location.search,
    hash: window.location.hash,
  });
  const [r, setR] = useState(get());
  useEffect(() => {
    const on = () => setR(get());
    window.addEventListener("popstate", on);
    window.addEventListener("hashchange", on);
    return () => {
      window.removeEventListener("popstate", on);
      window.removeEventListener("hashchange", on);
    };
  }, []);
  return r;
}

function Switcher() {
  const { path, hash } = useRoute();

  // Path-based + hash fallback (za dev sa #buy itd.)
  const clean = path.replace(/\/$/, "");
  const isAdmin   = clean === "/admin"   || hash.startsWith("#admin");
  const isTickets = clean === "/tickets" || clean === "/karte" || hash.startsWith("#tickets");
  // Default = buy widget
  const isBuy     = !isAdmin && !isTickets;

  return (
    <>
      <TestModeBanner />

      {isAdmin   && <AdminGate />}
      {isTickets && <KotorTicketsDisplay />}
      {isBuy     && <KotorTicket />}
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<Switcher />);
