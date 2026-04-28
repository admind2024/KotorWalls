// Supabase klijent — koristi se iz admin-a i widget-a
// Potrebne env varijable u .env: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY

const URL  = import.meta.env.VITE_SUPABASE_URL;
const ANON = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const SUPABASE_URL  = URL;
export const SUPABASE_ANON = ANON;

// ─── Stripe mode toggle (test / live) ───────────────────────────────────────
// Default: live (production).
// Read priority: URL param > sessionStorage > localStorage.
// - URL ?mode=test|live: aktivira mod ZA TAJ TAB (sessionStorage), ne trajno.
//   Tako ako admin pošalje test link drugoj osobi, ona je u testu samo dok
//   tab traje — ne ostaje zaglavljena nakon ponovne posjete bez parametra.
// - Toggle u admin panelu (setStripeMode): trajno u localStorage.
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
    return localStorage.getItem(STRIPE_MODE_KEY) === "test" ? "test" : "live";
  } catch { return "live"; }
}
export function setStripeMode(m) {
  const v = m === "test" ? "test" : "live";
  try {
    localStorage.setItem(STRIPE_MODE_KEY, v);
    sessionStorage.setItem(STRIPE_MODE_KEY, v); // sync da reload ne dođe u koliziju
  } catch {}
  window.dispatchEvent(new CustomEvent("kw:mode-change", { detail: m }));
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
