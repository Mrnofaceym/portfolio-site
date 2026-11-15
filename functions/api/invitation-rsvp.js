// Cloudflare Pages Function: POST /api/invitation-rsvp -> RSVP message to the couple's Telegram.
// Set BOT_TOKEN and CHAT_ID in Pages → Settings → Environment variables (as secrets).
// Without them it answers {ok:true, demo:true}, so the public demo never leaks anything.

const clean = (v, max) => String(v ?? "").replace(/[<>&]/g, "").trim().slice(0, max);
const FOOD = { meat: "🥩 м'ясо", fish: "🐟 риба", veg: "🥗 вегетаріанське" };

export async function onRequestPost({ request, env }) {
  let d;
  try { d = await request.json(); } catch { return Response.json({ ok: false, error: "bad json" }, { status: 400 }); }
  if (d.website) return Response.json({ ok: true });                 // honeypot
  const name = clean(d.name, 60), attend = d.attend;
  const guests = Number(d.guests);
  if (name.length < 2 || !["yes", "no"].includes(attend) ||
      (attend === "yes" && (!Number.isInteger(guests) || guests < 1 || guests > 4 || !FOOD[d.food]))) {
    return Response.json({ ok: false, error: "invalid" }, { status: 422 });
  }
  if (!env.BOT_TOKEN || !env.CHAT_ID) return Response.json({ ok: true, demo: true });

  const comment = clean(d.comment, 500), song = clean(d.song, 100), invited = clean(d.invited, 60);
  const text = (attend === "yes" ? [
    "💌 <b>Новий гість підтвердив присутність</b>",
    `👤 ${name}${invited && invited !== name ? ` (посилання для: ${invited})` : ""}`,
    `👥 Гостей: ${guests}`,
    `🍽 ${FOOD[d.food]}`,
    song && `🎵 ${song}`,
    comment && `💬 ${comment}`,
  ] : [
    "😔 <b>Гість не зможе прийти</b>",
    `👤 ${name}${invited && invited !== name ? ` (посилання для: ${invited})` : ""}`,
    comment && `💬 ${comment}`,
  ]).filter(Boolean).join("\n");
  const r = await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: env.CHAT_ID, text, parse_mode: "HTML" }),
  });
  return Response.json({ ok: r.ok }, { status: r.ok ? 200 : 502 });
}
