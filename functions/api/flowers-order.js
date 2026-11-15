// Cloudflare Pages Function: POST /api/flowers-order -> message to the flower shop's Telegram.
// Set BOT_TOKEN and CHAT_ID in Pages → Settings → Environment variables (as secrets).
// Without them it answers {ok:true, demo:true}, so the public demo never leaks anything.

const clean = (v, max) => String(v ?? "").replace(/[<>&]/g, "").trim().slice(0, max);
const digits = (v) => clean(v, 20).replace(/\D/g, "");

export async function onRequestPost({ request, env }) {
  let d;
  try { d = await request.json(); } catch { return Response.json({ ok: false, error: "bad json" }, { status: 400 }); }
  if (d.website) return Response.json({ ok: true });                 // honeypot
  const name = clean(d.name, 60), phone = clean(d.phone, 20), rname = clean(d.rname, 60), rphone = clean(d.rphone, 20);
  const zone = clean(d.zone, 40), address = clean(d.address, 120);
  const yesterday = new Date(Date.now() - 24 * 3600 * 1000).toISOString().slice(0, 10);   // timezone-tolerant "not in the past"
  if (name.length < 2 || digits(phone).length < 9 || rname.length < 2 || digits(rphone).length < 9 || !clean(d.bouquet, 80) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(d.date || "") || d.date < yesterday || !/^\d{2}:\d{2}–\d{2}:\d{2}$/.test(d.slot || "") ||
      (zone !== "Самовивіз" && address.length < 5)) {
    return Response.json({ ok: false, error: "invalid" }, { status: 422 });
  }
  if (!env.BOT_TOKEN || !env.CHAT_ID) return Response.json({ ok: true, demo: true });

  const [y, m, day] = d.date.split("-");
  const card = clean(d.card, 200);
  const text = [
    "💐 <b>Нове замовлення</b>",
    `🌸 ${clean(d.bouquet, 80)} · ${Number(d.price) || 0} грн`,
    d.details ? `   ${clean(d.details, 120)}` : "",
    `📅 ${day}.${m}.${y}, ${d.slot}`,
    `🚚 ${zone}${address ? `: ${address}` : ""}`,
    `🎁 Отримувач: ${rname}, ${rphone}`,
    card ? `💌 Листівка: «${card}»` : "",
    d.anonymous ? "🤫 <b>АНОНІМНО</b> — не називати відправника" : "",
    `👤 Замовник: ${name}, ${phone}`,
    `💰 Разом: ${Number(d.total) || 0} грн`,
  ].filter(Boolean).join("\n");
  const r = await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: env.CHAT_ID, text, parse_mode: "HTML" }),
  });
  return Response.json({ ok: r.ok }, { status: r.ok ? 200 : 502 });
}
