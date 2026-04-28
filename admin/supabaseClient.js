// Supabase klijent — koristi se iz admin-a i widget-a
// Potrebne env varijable u .env: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY

const URL  = import.meta.env.VITE_SUPABASE_URL;
const ANON = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const SUPABASE_URL  = URL;
export const SUPABASE_ANON = ANON;

// ─── Stripe mode toggle (test / live) ───────────────────────────────────────
// Trajna pohrana je u DB (kotorwalls_admin_state, čita/upisuje admin-state
// edge funkcija) — admin se loguje sa različitih PC-eva, preferenca prati
// nalog, ne lokalni browser.
//
// Read priority unutar tekućeg taba:
//   URL ?mode=test|live  → sessionStorage (samo za taj tab; share-able link)
//   sessionStorage       → tekuća sesija (postavlja je fetchStripeMode pri
//                          učitavanju /admin ili buy widget-a)
//   default 'live'
//
// fetchStripeMode() — poziva se sa main.jsx pri pokretanju i sa AdminGate
// nakon login-a; sinhronizuje sessionStorage sa DB stanjem.
// setStripeMode() — UI toggle u admin panelu; piše u DB pa update-uje session.

const STRIPE_MODE_KEY = "kw_stripe_mode";

export function getStripeMode() {
  try {
    const urlMode = new URLSearchParams(window.location.search).get("mode");
    if (urlMode === "test" || urlMode === "live") {
      sessionStorage.setItem(STRIPE_MODE_KEY, urlMode);
      return urlMode;
    }
    const sess = sessionStorage.getItem(STRIPE_MODE_KEY);
    if (sess === "test" || sess === "live") return sess;
    return "live";
  } catch { return "live"; }
}

// Povuci aktuelni mod iz DB-a i sinhronizuj sa sessionStorage-om.
// Ako URL ima ?mode= override, ne diramo (URL ima prioritet).
export async function fetchStripeMode() {
  try {
    const urlMode = new URLSearchParams(window.location.search).get("mode");
    if (urlMode === "test" || urlMode === "live") return urlMode;

    const r = await fetch(`${URL}/functions/v1/admin-state`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: ANON, Authorization: `Bearer ${ANON}` },
      body: JSON.stringify({ action: "get" }),
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const j = await r.json();
    const v = j?.stripe_mode === "test" ? "test" : "live";
    sessionStorage.setItem(STRIPE_MODE_KEY, v);
    window.dispatchEvent(new CustomEvent("kw:mode-change", { detail: v }));
    return v;
  } catch (e) {
    console.warn("fetchStripeMode failed:", e);
    return getStripeMode();
  }
}

export async function setStripeMode(m) {
  const v = m === "test" ? "test" : "live";
  try {
    const r = await fetch(`${URL}/functions/v1/admin-state`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: ANON, Authorization: `Bearer ${ANON}` },
      body: JSON.stringify({ action: "set", stripe_mode: v }),
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
  } catch (e) {
    console.error("setStripeMode failed:", e);
    throw e;
  }
  try { sessionStorage.setItem(STRIPE_MODE_KEY, v); } catch {}
  window.dispatchEvent(new CustomEvent("kw:mode-change", { detail: v }));
  return v;
}
export function getStripePublishableKey() {
  return getStripeMode() === "test"
    ? import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY_TEST
    : import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
}

// Direktan REST poziv na PostgREST (tabele)
export async function rest(path, opts = {}) {
  const res = await fetch(`${URL}/rest/v1/${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      apikey:         ANON,
      Authorization:  `Bearer ${ANON}`,
      Prefer:         opts.prefer ?? "return=representation",
      ...(opts.headers ?? {}),
    },
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`${path} ${res.status}: ${t}`);
  }
  return res.status === 204 ? null : res.json();
}

export async function callEdge(fn, body) {
  // Automatski ubaci Stripe mode u svaki edge call (osim ako je eksplicitno postavljen)
  const finalBody = { mode: getStripeMode(), ...(body ?? {}) };
  const res = await fetch(`${URL}/functions/v1/${fn}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey:        ANON,
      Authorization: `Bearer ${ANON}`,
    },
    body: JSON.stringify(finalBody),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`${fn} ${res.status}: ${t}`);
  }
  return res.json();
}
