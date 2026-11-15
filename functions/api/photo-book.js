// Cloudflare Pages Function: POST /api/photo-book -> message to the photographer's Telegram.
// Set BOT_TOKEN and CHAT_ID in Pages → Settings → Environment variables (as secrets).
// Without them it answers {ok:true, demo:true}, so the public demo never leaks anything.

const clean = (v, max) => String(v ?? "").replace(/[<>&]/g, "").trim().slice(0, max);
const PACKS = ["Міні", "Стандарт", "Весільний день"];
const KINDS = ["Весілля", "Сімейна", "Love story", "Портрет"];

export async function onRequestPost({ request, env }) {
  let d;
  try { d = await request.json(); } catch { return Response.json({ ok: false, error: "bad json" }, { status: 400 }); }
  if (d.website) return Response.json({ ok: true });                 // honeypot
  const name = clean(d.name, 60), phone = clean(d.phone, 20), comment = clean(d.comment, 500);
  const date = String(d.date || "");
  const day = /^\d{4}-\d{2}-\d{2}$/.test(date) ? new Date(date + "T00:00:00Z") : null;
  const todayUtc = new Date(new Date().toISOString().slice(0, 10) + "T00:00:00Z");
  if (name.length < 2 || phone.replace(/\D/g, "").length < 9 || !day || isNaN(day) ||
      day < todayUtc - 864e5 || day - todayUtc > 400 * 864e5 ||
      !PACKS.includes(d.pack) || !KINDS.includes(d.kind)) {
    return Response.json({ ok: false, error: "invalid" }, { status: 422 });
  }
  if (!env.BOT_TOKEN || !env.CHAT_ID) return Response.json({ ok: true, demo: true });

  const [y, m, dd] = date.split("-");
  const text = [
    "📷 <b>Нова заявка на зйомку</b>",
    `📅 ${dd}.${m}.${y}`,
    `🎞 ${d.kind} · ${d.pack} (${clean(d.hours, 20)}) · ${clean(d.price, 8)} грн`,
    `👤 ${name}, ${phone}`,
    comment && `💬 ${comment}`,
  ].filter(Boolean).join("\n");
  const r = await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: env.CHAT_ID, text, parse_mode: "HTML" }),
  });
  return Response.json({ ok: r.ok }, { status: r.ok ? 200 : 502 });
}
