// Cloudflare Pages Function: POST /api/school-book -> trial-lesson request to the school's Telegram.
// Set BOT_TOKEN and CHAT_ID in Pages → Settings → Environment variables (as secrets).
// Without them the endpoint answers {ok:true, demo:true} so the public demo never leaks anything.

const clean = (v, max) => String(v ?? "").replace(/[<>&]/g, "").trim().slice(0, max);
const LEVELS = { unknown: "не знає", A1: "A1", A2: "A2", B1: "B1", B2: "B2+" };
const COURSES = { general: "General English", business: "Business English", it: "IT English", club: "Speaking Club" };
const TIMES = { morning: "ранок 7–11", day: "день 11–17", evening: "вечір 17–22", weekend: "вихідні" };

function validContact(v) {
  if (/^@?[a-zA-Z][a-zA-Z0-9_]{4,31}$/.test(v)) return true;               // Telegram username
  const digits = v.replace(/\D/g, "");
  return /^[\d\s()+-]+$/.test(v) && digits.length >= 9 && digits.length <= 15;
}

export async function onRequestPost({ request, env }) {
  let d;
  try { d = await request.json(); } catch { return Response.json({ ok: false, error: "bad json" }, { status: 400 }); }
  if (d.website) return Response.json({ ok: true });                 // honeypot
  const name = clean(d.name, 60), contact = clean(d.contact, 40);
  if (name.length < 2 || !validContact(contact)) {
    return Response.json({ ok: false, error: "invalid" }, { status: 422 });
  }
  if (!env.BOT_TOKEN || !env.CHAT_ID) return Response.json({ ok: true, demo: true });

  const tg = /^@?[a-zA-Z]/.test(contact) ? `@${contact.replace(/^@/, "")}` : contact;
  const text = [
    "🎓 <b>Заявка на пробний урок</b>",
    `👤 ${name}, ${tg}`,
    `📚 ${COURSES[d.course] || "—"} · рівень: ${LEVELS[d.level] || "—"}`,
    d.test ? `🧪 Тест на сайті: ${clean(d.test, 20)}` : "",
    `🕒 Зручно: ${TIMES[d.time] || "—"}`,
    d.comment ? `💬 ${clean(d.comment, 300)}` : "",
    d.lang === "en" ? "🌐 англомовна версія сайту" : "",
  ].filter(Boolean).join("\n");
  const r = await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: env.CHAT_ID, text, parse_mode: "HTML" }),
  });
  return Response.json({ ok: r.ok }, { status: r.ok ? 200 : 502 });
}
