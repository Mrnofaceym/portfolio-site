// Cloudflare Pages Function: POST /api/cakes-order -> message to the confectioner's Telegram.
// Set BOT_TOKEN and CHAT_ID in Pages → Settings → Environment variables (as secrets).
// Without them it answers {ok:true, demo:true}, so the public demo never leaks anything.

const clean = (v, max) => String(v ?? "").replace(/[<>&]/g, "").trim().slice(0, max);

export async function onRequestPost({ request, env }) {
  let d;
  try { d = await request.json(); } catch { return Response.json({ ok: false, error: "bad json" }, { status: 400 }); }
  if (d.website) return Response.json({ ok: true });                 // honeypot
  const name = clean(d.name, 60), phone = clean(d.phone, 20);
  const min = new Date(Date.now() + 36 * 3600 * 1000).toISOString().slice(0, 10);   // ~2 days ahead (timezone-tolerant)
  if (name.length < 2 || phone.replace(/\D/g, "").length < 9 || !clean(d.kind, 30) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(d.date || "") || d.date < min || !/^\d{2}:\d{2}$/.test(d.time || "")) {
    return Response.json({ ok: false, error: "invalid" }, { status: 422 });
  }
  if (!env.BOT_TOKEN || !env.CHAT_ID) return Response.json({ ok: true, demo: true });

  const [y, m, day] = d.date.split("-");
  const decor = Array.isArray(d.decor) ? d.decor.slice(0, 10).map((x) => clean(x, 40)).filter(Boolean) : [];
  const address = clean(d.address, 120), inscription = clean(d.inscription, 40), comment = clean(d.comment, 300);
  const text = [
    "🎂 <b>Нове замовлення</b>",
    `🍰 ${clean(d.kind, 30)} · ${clean(d.size, 20)} · ${clean(d.filling, 40)}`,
    decor.length ? `✨ Декор: ${decor.join(", ")}` : "",
    inscription ? `✍️ Напис: «${inscription}»` : "",
    `📅 ${day}.${m}.${y} о ${d.time}`,
    `🚚 ${clean(d.delivery, 30)}${address ? `: ${address}` : ""}`,
    `💰 ≈ ${Number(d.total) || 0} грн`,
    `👤 ${name}, ${phone}`,
    comment ? `💬 ${comment}` : "",
  ].filter(Boolean).join("\n");
  const r = await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: env.CHAT_ID, text, parse_mode: "HTML" }),
  });
  return Response.json({ ok: r.ok }, { status: r.ok ? 200 : 502 });
}
