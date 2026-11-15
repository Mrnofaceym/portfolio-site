// Cloudflare Pages Function: POST /api/calc-lead -> lead from the embeddable price calculator
// (demo/calc/widget.js) to the owner's Telegram.
// Set BOT_TOKEN and CHAT_ID in Pages → Settings → Environment variables (as secrets).
// Without them it answers {ok:true, demo:true}, so the public demo never leaks anything.
//
// The price is recomputed here from the same JSON config the widget uses, so a visitor
// can't send "1 грн" by editing the request.

const CONFIG_BASE = "/demo/calc/configs/"; // where configs/<id>.json are served on this Pages site

// CORS: the widget is embedded on OTHER domains (Tilda, WordPress…), so the browser asks permission.
// Demo: allow any origin. For a real client, restrict it, e.g.
//   const ALLOWED = ["https://steli-podillia.com.ua", "https://www.steli-podillia.com.ua"];
//   const origin = request.headers.get("Origin");  ->  "Access-Control-Allow-Origin": ALLOWED.includes(origin) ? origin : ALLOWED[0]
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};
const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { ...CORS, "Content-Type": "application/json; charset=utf-8" } });
const clean = (v, max) => String(v ?? "").replace(/[<>&]/g, "").trim().slice(0, max);
const fmt = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, " ");

/* ---- price engine: keep in sync with widget.js ---- */
function norm(cfg, raw) {
  const v = {};
  for (const f of cfg.fields) {
    const x = raw ? raw[f.id] : undefined;
    if (f.type === "choice") v[f.id] = f.options.some((o) => o.id === x) ? x : (f.default || f.options[0].id);
    else if (f.type === "toggle") v[f.id] = typeof x === "boolean" ? x : !!f.default;
    else {
      const st = f.step || 1, n = Number(x);
      let y = Number.isFinite(n) && x !== "" && x != null ? n : (f.default ?? f.min ?? 0);
      v[f.id] = Math.round(Math.min(f.max, Math.max(f.min, y)) / st) * st;
    }
  }
  return v;
}
const qty = (f, v) => (f.per ? Math.round((f.k || 1) * (f.pow ? Math.pow(+v[f.per] || 0, f.pow) : +v[f.per] || 0) * 10) / 10 : 1);
function compute(cfg, v) {
  let sum = 0;
  for (const f of cfg.fields) {
    let price = 0, q = 1;
    if (f.type === "choice") { price = (f.options.find((o) => o.id === v[f.id]) || f.options[0]).price || 0; q = qty(f, v); }
    else if (f.type === "toggle") { if (!v[f.id]) continue; price = f.price || 0; q = qty(f, v); }
    else { price = f.price || 0; q = Math.max(0, v[f.id] - (f.free || 0)) * qty(f, v); }
    sum += Math.max(0, price * q);
  }
  const base = Math.max(sum, cfg.minTotal || 0), rg = cfg.range || [1, 1], step = cfg.round || 1;
  return { from: Math.floor(base * rg[0] / step) * step, to: Math.ceil(base * rg[1] / step) * step };
}
const describe = (cfg, v) => cfg.fields.map((f) => {
  if (f.type === "choice") return `${f.label}: ${f.options.find((o) => o.id === v[f.id]).label}`;
  if (f.type === "toggle") return v[f.id] ? `${f.label}: так` : "";
  return `${f.label}: ${v[f.id]} ${f.unit || ""}`.trim();
}).filter(Boolean);

export const onRequestOptions = () => new Response(null, { status: 204, headers: CORS });

export async function onRequestPost({ request, env }) {
  let d;
  try { d = await request.json(); } catch { return json({ ok: false, error: "bad json" }, 400); }
  if (d.website) return json({ ok: true });                                  // honeypot
  const name = clean(d.name, 60), phone = clean(d.phone, 20), id = String(d.config || "");
  if (name.length < 2 || phone.replace(/\D/g, "").length < 9 || !/^[a-z0-9-]{1,40}$/.test(id) ||
      (d.values && typeof d.values !== "object")) {
    return json({ ok: false, error: "invalid" }, 422);
  }

  let cfg;
  try {
    const url = new URL(`${CONFIG_BASE}${id}.json`, request.url);
    const r = env.ASSETS ? await env.ASSETS.fetch(url) : await fetch(url);
    if (!r.ok) throw new Error(r.status);
    cfg = await r.json();
    if (!Array.isArray(cfg.fields)) throw new Error("no fields");
  } catch { return json({ ok: false, error: "unknown config" }, 422); }

  const v = norm(cfg, d.values), p = compute(cfg, v);
  const times = (cfg.lead && cfg.lead.times) || [];
  const time = times.includes(d.time) ? d.time : "";
  if (!env.BOT_TOKEN || !env.CHAT_ID) return json({ ok: true, demo: true, from: p.from, to: p.to });

  let site = "";
  try { site = new URL(String(d.page || "")).host; } catch {}
  const text = [
    `🧮 <b>Заявка з калькулятора</b>`,
    `💰 від ${fmt(p.from)} до ${fmt(p.to)} ${cfg.currency || "грн"}`,
    ...describe(cfg, v).map((s) => `• ${clean(s, 80)}`),
    `👤 ${name}, ${phone}`,
    time && `🕐 Зателефонувати: ${clean(time, 40)}`,
    site && `🌐 ${clean(site, 80)}`,
  ].filter(Boolean).join("\n");
  const r = await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: env.CHAT_ID, text, parse_mode: "HTML" }),
  });
  return json({ ok: r.ok }, r.ok ? 200 : 502);
}
