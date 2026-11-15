// Cloudflare Pages Function: POST /api/course-lead -> message to the author's Telegram.
// Two kinds of requests:  type=apply  (application for a tier)  and  type=magnet  (free lesson).
// Set BOT_TOKEN and CHAT_ID in Pages → Settings → Environment variables (as secrets).
// Without them it answers {ok:true, demo:true}, so the public demo never leaks anything.

const clean = (v, max) => String(v ?? "").replace(/[<>&]/g, "").trim().slice(0, max);
const TIERS = { solo: "Самостійний", support: "З підтримкою", vip: "VIP" };
const bad = () => Response.json({ ok: false, error: "invalid" }, { status: 422 });

export async function onRequestPost({ request, env }) {
  let d;
  try { d = await request.json(); } catch { return Response.json({ ok: false, error: "bad json" }, { status: 400 }); }
  if (d.website) return Response.json({ ok: true });                 // honeypot
  if (d.consent !== true) return bad();

  let text;
  if (d.type === "magnet") {
    const contact = clean(d.contact, 80);
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(contact);
    const isPhone = contact.replace(/\D/g, "").length >= 9 && /^[\d\s()+-]+$/.test(contact);
    if (!isEmail && !isPhone) return bad();
    text = ["🎁 <b>Безкоштовний урок</b>", `📩 ${contact}`].join("\n");
  } else if (d.type === "apply") {
    const name = clean(d.name, 60), phone = clean(d.phone, 20);
    const tg = clean(d.telegram, 33).replace(/^@?/, "@");
    if (name.length < 2 || phone.replace(/\D/g, "").length < 9 || !TIERS[d.tier]) return bad();
    if (tg.length > 1 && !/^@[A-Za-z0-9_]{4,32}$/.test(tg)) return bad();
    const q = clean(d.question, 600);
    text = [
      "🌿 <b>Нова заявка на курс</b>",
      `💼 Тариф: ${TIERS[d.tier]}`,
      `👤 ${name}, ${phone}`,
      tg.length > 1 ? `✈️ ${tg}` : "",
      q ? `💬 ${q}` : "",
    ].filter(Boolean).join("\n");
  } else {
    return bad();
  }

  if (!env.BOT_TOKEN || !env.CHAT_ID) return Response.json({ ok: true, demo: true });
  const r = await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: env.CHAT_ID, text, parse_mode: "HTML" }),
  });
  return Response.json({ ok: r.ok }, { status: r.ok ? 200 : 502 });
}
