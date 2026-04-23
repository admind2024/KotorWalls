import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import KotorAdmin from "./KotorAdmin.jsx";
import KotorTicket from "./KotorTicket.jsx";
import KotorTicketsDisplay from "./KotorTicketsDisplay.jsx";
import { getStripeMode, setStripeMode } from "./supabaseClient.js";

function StripeModeToggle() {
  const [mode, setMode] = useState(getStripeMode());

  useEffect(() => {
    const h = (e) => setMode(e.detail);
    window.addEventListener("kw:mode-change", h);
    return () => window.removeEventListener("kw:mode-change", h);
  }, []);

  const isTest = mode === "test";
  const toggle = () => {
    const next = isTest ? "live" : "test";
    const msg = next === "live"
      ? "Prebaciti na PRODUKCIJU? Koristiće se stvarne kartice i stvarni novac."
      : "Prebaciti na TEST mod? Koristiće se testne Stripe kartice (bez stvarnog novca).";
    if (!confirm(msg)) return;
    setStripeMode(next);
    setMode(next);
    // reload da Stripe.js pokupi novi publishable key
    setTimeout(() => window.location.reload(), 150);
  };

  return (
    <div style={{
      position: "fixed", top: 12, right: 12, zIndex: 10000,
      display: "flex", alignItems: "center", gap: 8,
      padding: "6px 10px 6px 8px", borderRadius: 999,
      background: "#fff",
      border: `2px solid ${isTest ? "#C98015" : "#2F7D4F"}`,
      boxShadow: "0 6px 20px rgba(26,31,43,0.12)",
      fontFamily: "'Inter', system-ui, sans-serif",
      cursor: "pointer",
    }} onClick={toggle} title={isTest ? "Klikni za povratak na produkciju" : "Klikni za prelazak u test mod"}>
      <span style={{
        width: 8, height: 8, borderRadius: "50%",
        background: isTest ? "#C98015" : "#2F7D4F",
        boxShadow: `0 0 0 3px ${isTest ? "rgba(201,128,21,0.2)" : "rgba(47,125,79,0.2)"}`,
      }} />
      <span style={{
        fontSize: 11, fontWeight: 800, letterSpacing: 0.5,
        color: isTest ? "#8A5A00" : "#0F7A3D", textTransform: "uppercase",
      }}>
        Stripe: {isTest ? "TEST" : "LIVE"}
      </span>
      <button
        onClick={(e) => { e.stopPropagation(); toggle(); }}
        style={{
          padding: "4px 10px", fontSize: 11, fontWeight: 700,
          borderRadius: 999, border: "none", cursor: "pointer",
          background: isTest ? "#2F7D4F" : "#C98015",
          color: "#fff", fontFamily: "inherit",
        }}
      >
        {isTest ? "→ Produkcija" : "→ Test"}
      </button>
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
      {!isTickets && <StripeModeToggle />}

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
