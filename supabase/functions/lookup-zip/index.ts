// ═══════════════════════════════════════════════════════════════════════════
// lookup-zip — postal code → country + city (globalno, Nominatim + CG fallback)
// POST { zip: string, country_hint?: string }
// Vraća: { matches: [{ country_code, country, city }, ...] }
// ═══════════════════════════════════════════════════════════════════════════

const corsHeaders = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Hardkodirana lista je uklonjena — jedini izvor istine je Nominatim (OSM).
// Ako ZIP nije u OSM bazi, korisnik ručno unosi grad i državu.

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST")    return json({ error: "method not allowed" }, 405);

  try {
    const { zip, country_hint } = await req.json();
    if (!zip || typeof zip !== "string") return json({ error: "missing zip" }, 400);
    const z = zip.trim();

    const matches: { country_code: string; country: string; city: string }[] = [];

    // Nominatim — jedini izvor (globalna OSM baza)
    try {
      const url = new URL("https://nominatim.openstreetmap.org/search");
      url.searchParams.set("postalcode", z);
      url.searchParams.set("format", "jsonv2");
      url.searchParams.set("addressdetails", "1");
      url.searchParams.set("limit", "5");
      if (country_hint) url.searchParams.set("countrycodes", country_hint.toLowerCase());

      const r = await fetch(url.toString(), {
        headers: {
          "User-Agent": "KotorWalls/1.0 (support@kotorwalls.com)",
          "Accept-Language": "en",
        },
      });
      if (r.ok) {
        const arr = await r.json() as any[];
        for (const p of arr) {
          const cc = (p?.address?.country_code ?? "").toUpperCase();
          const cn = p?.address?.country ?? "";
          const city = p?.address?.city ?? p?.address?.town ?? p?.address?.village
                     ?? p?.address?.municipality ?? p?.address?.county ?? "";
          if (!cc) continue;
          matches.push({ country_code: cc, country: cn, city });
          if (matches.length >= 5) break;
        }
      }
    } catch (_) { /* Nominatim fail — fallback je hardkodiran ME */ }

    return json({ matches });
  } catch (e) {
    console.error(e);
    return json({ error: String(e?.message ?? e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
