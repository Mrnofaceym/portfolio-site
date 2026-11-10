// Cloudflare Pages Function: POST /api/autoservice-book -> message to the car service's Telegram.
// Set BOT_TOKEN and CHAT_ID in Pages → Settings → Environment variables (as secrets).
// Without them the endpoint answers {ok:true, demo:true} so the public demo never leaks anything.

const SERVICES = {   // id -> [name, price from, minutes]; prices are recomputed here, the browser total is not trusted
  diag: ["Комп'ютерна діагностика", 600, 40], oil: ["Заміна оливи та фільтра", 450, 30], brakes: ["Гальмівні колодки (вісь)", 700, 60],
  chassis: ["Діагностика ходової", 400, 30], suspension: ["Ремонт підвіски", 1200, 120], tires: ["Шиномонтаж R13–R17", 800, 45],
  align: ["Розвал-сходження 3D", 900, 45], ac: ["Заправка кондиціонера", 1100, 50], electric: ["Автоелектрика", 700, 60],
};
const FUEL = { petrol: "бензин", diesel: "дизель", lpg: "газ/бензин", hybrid: "гібрид", ev: "електро" };
const clean = (v, max) => String(v ?? "").replace(/[<>&]/g, "").trim().slice(0, max);

export async function onRequestPost({ request, env }) {
  let d;
  try { d = await request.json(); } catch { return Response.json({ ok: false, error: "bad json" }, { status: 400 }); }
  if (d.website) return Response.json({ ok: true });                 // honeypot
  const name = clean(d.name, 60), phone = clean(d.phone, 20);
  const ids = (Array.isArray(d.services) ? d.services : []).filter((id) => id in SERVICES).slice(0, 12);
  if (name.length < 2 || phone.replace(/\D/g, "").length < 9 || !ids.length || !clean(d.make, 40) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(d.date || "") || !/^\d{2}:\d{2}$/.test(d.time || "")) {
    return Response.json({ ok: false, error: "invalid" }, { status: 422 });
  }
  if (!env.BOT_TOKEN || !env.CHAT_ID) return Response.json({ ok: true, demo: true });

  const sum = ids.reduce((a, id) => a + SERVICES[id][1], 0);
  const mins = ids.reduce((a, id) => a + SERVICES[id][2], 0);
  const km = String(d.mileage || "").replace(/\D/g, "").slice(0, 7);
  const [y, m, day] = d.date.split("-");
  const text = [
    "🔧 <b>Новий запис на СТО</b>",
    `🚗 ${clean(d.make, 40)} ${clean(d.model, 40)}, ${clean(d.year, 4)} · ${FUEL[d.fuel] || "—"}${km ? ` · ${Number(km).toLocaleString("uk-UA")} км` : ""}`,
    `📅 ${day}.${m}.${y} о ${d.time} (≈ ${Math.floor(mins / 60)} год ${mins % 60} хв)`,
    ...ids.map((id) => `• ${SERVICES[id][0]} — від ${SERVICES[id][1]} грн`),
    `💰 Разом: від ${sum} грн`,
    `👤 ${name}, ${phone}`,
    d.comment ? `💬 ${clean(d.comment, 300)}` : "",
    d.remind ? "🔔 Нагадати про ТО в Telegram" : "",
  ].filter(Boolean).join("\n");
  const r = await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: env.CHAT_ID, text, parse_mode: "HTML" }),
  });
  return Response.json({ ok: r.ok }, { status: r.ok ? 200 : 502 });
}
