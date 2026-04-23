import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import KotorAdmin from "./KotorAdmin.jsx";
import KotorTicket from "./KotorTicket.jsx";
import KotorTicketsDisplay from "./KotorTicketsDisplay.jsx";
import { getStripeMode } from "./supabaseClient.js";

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

function Switcher() {
  const [route, setRoute] = useState(window.location.hash || "#admin");

  useEffect(() => {
    const onHash = () => setRoute(window.location.hash || "#admin");
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const path = route.split("?")[0];
  const isBuy     = path === "#buy";
  const isTickets = path === "#tickets";

  return (
    <>
      <TestModeBanner />

      {!isTickets && (
        <div style={{
          position: "fixed", bottom: 20, right: 20, zIndex: 9999,
          display: "flex", gap: 0, padding: 4, borderRadius: 10,
          background: "#fff", border: "1px solid #E6E8EB",
          boxShadow: "0 6px 20px rgba(26,31,43,0.12)",
          fontFamily: "'Inter', system-ui, sans-serif",
        }}>
          <a href="#admin" style={{
            padding: "7px 14px", fontSize: 12, fontWeight: 700,
            borderRadius: 7, textDecoration: "none",
            background: !isBuy ? "#B23A3A" : "transparent",
            color: !isBuy ? "#fff" : "#6B7684",
          }}>Admin</a>
          <a href="#buy" style={{
            padding: "7px 14px", fontSize: 12, fontWeight: 700,
            borderRadius: 7, textDecoration: "none",
            background: isBuy ? "#B23A3A" : "transparent",
            color: isBuy ? "#fff" : "#6B7684",
          }}>Kupovina</a>
        </div>
      )}

      {isTickets ? <KotorTicketsDisplay /> : isBuy ? <KotorTicket /> : <KotorAdmin />}
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<Switcher />);
