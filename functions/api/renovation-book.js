// Cloudflare Pages Function: POST /api/renovation-book -> lead message to the site manager's Telegram.
// Set BOT_TOKEN and CHAT_ID in Pages → Settings → Environment variables (as secrets).
// Without them the endpoint answers {ok:true, demo:true} so the public demo never leaks anything.

const clean = (v, max) => String(v ?? "").replace(/[<>&]/g, "").trim().slice(0, max);

export async function onRequestPost({ request, env }) {
  let d;
  try { d = await request.json(); } catch { return Response.json({ ok: false, error: "bad json" }, { status: 400 }); }
  if (d.website) return Response.json({ ok: true });                 // honeypot
  const name = clean(d.name, 60), phone = clean(d.phone, 20);
  const digits = phone.replace(/\D/g, "").length;
  if (name.length < 2 || digits < 9 || digits > 13) {
    return Response.json({ ok: false, error: "invalid" }, { status: 422 });
  }
  if (!env.BOT_TOKEN || !env.CHAT_ID) return Response.json({ ok: true, demo: true });

  const total = Number(d.total) > 0 ? Math.round(Number(d.total)).toLocaleString("uk-UA") : "";
  const text = [
    "🛠 <b>Нова заявка на ремонт</b>",
    `👤 ${name}, ${phone}`,
    d.calc ? `🧮 ${clean(d.calc, 400)}` : "🧮 без розрахунку",
    total ? `💰 Орієнтовно: ${total} ₴` : "",
    d.comment ? `💬 ${clean(d.comment, 500)}` : "",
  ].filter(Boolean).join("\n");
  const r = await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: env.CHAT_ID, text, parse_mode: "HTML" }),
  });
  return Response.json({ ok: r.ok }, { status: r.ok ? 200 : 502 });
}
