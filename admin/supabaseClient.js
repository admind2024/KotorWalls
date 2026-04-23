// Supabase klijent — koristi se iz admin-a i widget-a
// Potrebne env varijable u .env: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY

const URL  = import.meta.env.VITE_SUPABASE_URL;
const ANON = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const SUPABASE_URL  = URL;
export const SUPABASE_ANON = ANON;

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
  const res = await fetch(`${URL}/functions/v1/${fn}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey:        ANON,
      Authorization: `Bearer ${ANON}`,
    },
    body: JSON.stringify(body ?? {}),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`${fn} ${res.status}: ${t}`);
  }
  return res.json();
}
