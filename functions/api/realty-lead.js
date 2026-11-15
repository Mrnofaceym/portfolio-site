// Cloudflare Pages Function: POST /api/realty-lead -> message to the agency's Telegram.
// type = "viewing" (request to view a listing) | "sell" (owner wants to sell / rent out).
// Set BOT_TOKEN and CHAT_ID in Pages → Settings → Environment variables (as secrets).
// Without them it answers {ok:true, demo:true}, so the public demo never leaks anything.

const clean = (v, max) => String(v ?? "").replace(/[<>&]/g, "").trim().slice(0, max);

export async function onRequestPost({ request, env }) {
  let d;
  try { d = await request.json(); } catch { return Response.json({ ok: false, error: "bad json" }, { status: 400 }); }
  if (d.website) return Response.json({ ok: true });                 // honeypot
  const type = d.type === "sell" ? "sell" : d.type === "viewing" ? "viewing" : "";
  const name = clean(d.name, 60), phone = clean(d.phone, 20);
  if (!type || name.length < 2 || phone.replace(/\D/g, "").length < 9) {
    return Response.json({ ok: false, error: "invalid" }, { status: 422 });
  }
  let text;
  if (type === "viewing") {
    const object = clean(d.object, 160);
    if (!object) return Response.json({ ok: false, error: "invalid" }, { status: 422 });
    const date = /^\d{4}-\d{2}-\d{2}$/.test(d.date || "") ? d.date.split("-").reverse().join(".") : "будь-коли";
    text = [
      "🏠 <b>Запис на перегляд</b>",
      `📌 ${object} · ${clean(d.price, 20)} · ID ${clean(d.object_id, 6)}`,
      `📅 ${date}, ${clean(d.time, 20)}`,
      `👤 ${name}, ${phone}`,
      d.comment ? `💬 ${clean(d.comment, 400)}` : "",
    ];
  } else {
    const address = clean(d.address, 120);
    if (address.length < 3) return Response.json({ ok: false, error: "invalid" }, { status: 422 });
    text = [
      `🔑 <b>Власник: ${clean(d.goal, 20) || "Продати"}</b>`,
      `🏷 ${clean(d.ptype, 40)}${d.area ? `, ${clean(d.area, 6)} м²` : ""}`,
      `📍 ${address}`,
      d.price ? `💰 Очікує: ${clean(d.price, 30)}` : "",
      `👤 ${name}, ${phone}`,
    ];
  }
  if (!env.BOT_TOKEN || !env.CHAT_ID) return Response.json({ ok: true, demo: true });

  const r = await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: env.CHAT_ID, text: text.filter(Boolean).join("\n"), parse_mode: "HTML" }),
  });
  return Response.json({ ok: r.ok }, { status: r.ok ? 200 : 502 });
}
