// Cloudflare Pages Function: POST /api/rooms-book -> message to the owner's Telegram.
// Set BOT_TOKEN and CHAT_ID in Pages → Settings → Environment variables (as secrets).
// Without them it answers {ok:true, demo:true}, so the public demo never leaks anything.

const clean = (v, max) => String(v ?? "").replace(/[<>&]/g, "").trim().slice(0, max);
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const fmt = (s) => s.split("-").reverse().join(".");

export async function onRequestPost({ request, env }) {
  let d;
  try { d = await request.json(); } catch { return Response.json({ ok: false, error: "bad json" }, { status: 400 }); }
  if (d.website) return Response.json({ ok: true });                 // honeypot
  const name = clean(d.name, 60), phone = clean(d.phone, 20);
  if (name.length < 2 || phone.replace(/\D/g, "").length < 9 ||
      !DATE.test(d.checkin || "") || !DATE.test(d.checkout || "") || d.checkout <= d.checkin) {
    return Response.json({ ok: false, error: "invalid" }, { status: 422 });
  }
  if (!env.BOT_TOKEN || !env.CHAT_ID) return Response.json({ ok: true, demo: true });

  const note = clean(d.note, 200);
  const text = [
    "🏡 <b>Нове бронювання</b>",
    `🛏 ${clean(d.room, 60)} · гостей: ${clean(d.guests, 2)}`,
    `📅 ${fmt(d.checkin)} → ${fmt(d.checkout)} (${clean(d.nights, 3)} ноч.)`,
    `💰 ${clean(d.total, 10)} грн`,
    `👤 ${name}, ${phone}`,
    note && `📝 ${note}`,
  ].filter(Boolean).join("\n");
  const r = await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: env.CHAT_ID, text, parse_mode: "HTML" }),
  });
  return Response.json({ ok: r.ok }, { status: r.ok ? 200 : 502 });
}
