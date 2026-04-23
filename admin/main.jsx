import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import KotorAdmin from "./KotorAdmin.jsx";
import KotorTicket from "./KotorTicket.jsx";
import KotorTicketsDisplay from "./KotorTicketsDisplay.jsx";

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
