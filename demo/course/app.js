const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const LEAD_URL = "/api/course-lead";
const MON = ["січня", "лютого", "березня", "квітня", "травня", "червня", "липня", "серпня", "вересня", "жовтня", "листопада", "грудня"];

/* ---------- start date: always the 1st of a month at least 10 days ahead, 19:00 Kyiv ---------- */
const now = new Date();
let start = new Date(now.getFullYear(), now.getMonth() + 1, 1, 19, 0, 0);
if (start - now < 10 * 864e5) start = new Date(now.getFullYear(), now.getMonth() + 2, 1, 19, 0, 0);
const short = `${start.getDate()} ${MON[start.getMonth()]}`;
$$("[data-start-short]").forEach((el) => (el.textContent = short));
$$("[data-start-long]").forEach((el) => (el.textContent = `${short} о 19:00`));

/* seats: shrink slowly as the start approaches (demo) */
const days = Math.max(0, Math.ceil((start - now) / 864e5));
const seats = Math.max(3, Math.min(9, 3 + Math.floor(days / 6)));
$("#seatsLeft").textContent = seats;
$$("[data-seats]").forEach((el) => (el.textContent = seats));

const pad = (n) => String(n).padStart(2, "0");
const cd = Object.fromEntries($$("[data-cd]").map((el) => [el.dataset.cd, el]));
function tick() {
  let t = Math.max(0, Math.floor((start - Date.now()) / 1000));
  const d = Math.floor(t / 86400); t %= 86400;
  cd.d.textContent = pad(d); cd.h.textContent = pad(Math.floor(t / 3600));
  cd.m.textContent = pad(Math.floor((t % 3600) / 60)); cd.s.textContent = pad(t % 60);
}
tick(); setInterval(tick, 1000);

/* ---------- program accordion: one week open at a time ---------- */
$$(".week").forEach((w) => w.addEventListener("toggle", () => {
  if (w.open) $$(".week").forEach((o) => o !== w && (o.open = false));
}));

/* ---------- tier buttons -> preselect in the form ---------- */
$$("[data-tier]").forEach((b) => b.addEventListener("click", () => {
  const r = $(`#applyForm input[name=tier][value=${b.dataset.tier}]`);
  if (r) r.checked = true;
  $("#apply").scrollIntoView({ behavior: "smooth" });
  setTimeout(() => $("#fName").focus({ preventScroll: true }), 600);
}));

/* ---------- video review modal ---------- */
const modal = $("#modal");
let lastFocus;
$$(".vid").forEach((v) => v.addEventListener("click", () => {
  lastFocus = v;
  $("#modalImg").src = v.dataset.video;
  $("#modalTitle").textContent = v.dataset.title;
  modal.hidden = false; document.body.style.overflow = "hidden";
  $(".modal__x").focus();
}));
function closeModal() { modal.hidden = true; document.body.style.overflow = ""; lastFocus?.focus(); }
modal.addEventListener("click", (e) => { if (e.target === modal || e.target.closest("[data-close]")) closeModal(); });
addEventListener("keydown", (e) => { if (e.key === "Escape" && !modal.hidden) closeModal(); });

/* ---------- forms ---------- */
async function send(payload) {
  const r = await fetch(LEAD_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
  if (!r.ok) throw new Error(r.status);
  return r.json();
}
const setMsg = (el, text, cls = "") => { el.textContent = text; el.className = "form__msg " + cls; };

$("#magnetForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const f = e.target, el = f.elements, msg = $("#magnetMsg");
  $$(".is-bad", f).forEach((x) => x.classList.remove("is-bad"));
  const contact = el.contact.value.trim();
  const ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(contact) || (/^[\d\s()+-]+$/.test(contact) && contact.replace(/\D/g, "").length >= 9);
  if (!ok) { $(".mform__row", f).classList.add("is-bad"); return setMsg(msg, "Вкажіть email або номер телефону.", "err"); }
  if (!el.consent.checked) { el.consent.closest(".check").classList.add("is-bad"); return setMsg(msg, "Потрібна згода на обробку даних.", "err"); }
  if (el.website.value) return;
  const btn = $("button", f); btn.disabled = true; setMsg(msg, "Надсилаємо…");
  try {
    await send({ type: "magnet", contact, consent: true, website: el.website.value });
    setMsg(msg, contact.includes("@") ? "Готово! Урок уже летить на вашу пошту 💌" : "Готово! Надішлемо урок у месенджер на цей номер 💌", "ok");
    f.reset();
  } catch {
    setMsg(msg, "Не вдалося надіслати. Спробуйте ще раз або напишіть нам: +380 00 000 00 00.", "err");
  } finally { btn.disabled = false; }
});

const TIER_NAMES = { solo: "Самостійний", support: "З підтримкою", vip: "VIP" };
$("#applyForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const f = e.target, el = f.elements, msg = $("#applyMsg");
  $$(".is-bad", f).forEach((x) => x.classList.remove("is-bad"));
  const name = el.name.value.trim(), phone = el.phone.value.trim();
  const tg = el.telegram.value.trim().replace(/^@?/, "@");
  const bad = [];
  if (name.length < 2) bad.push(el.name);
  if (phone.replace(/\D/g, "").length < 9) bad.push(el.phone);
  if (tg.length > 1 && !/^@[A-Za-z0-9_]{4,32}$/.test(tg)) bad.push(el.telegram);
  if (bad.length) { bad.forEach((x) => x.classList.add("is-bad")); bad[0].focus(); return setMsg(msg, "Перевірте, будь ласка, виділені поля.", "err"); }
  if (!el.consent.checked) { el.consent.closest(".check").classList.add("is-bad"); return setMsg(msg, "Позначте, будь ласка, згоду внизу форми.", "err"); }
  if (el.website.value) return;
  const btn = $("button[type=submit]", f); btn.disabled = true; setMsg(msg, "Надсилаємо…");
  try {
    await send({ type: "apply", name, phone, telegram: tg.length > 1 ? tg : "", tier: el.tier.value,
      question: el.question.value.trim(), consent: true, website: el.website.value });
    setMsg(msg, `Дякуємо, ${name}! Заявку на тариф «${TIER_NAMES[el.tier.value]}» отримано. Менеджер зателефонує вам протягом дня.`, "ok");
    f.reset();
  } catch {
    setMsg(msg, "Не вдалося надіслати. Зателефонуйте нам, будь ласка: +380 00 000 00 00.", "err");
  } finally { btn.disabled = false; }
});

/* ---------- nav, reveal, sticky ---------- */
const nav = $("#nav");
const onScroll = () => nav.classList.toggle("is-solid", scrollY > 30);
addEventListener("scroll", onScroll, { passive: true }); onScroll();
$("#burger").addEventListener("click", () => $("#burger").setAttribute("aria-expanded", nav.classList.toggle("is-open")));
$$("#links a").forEach((a) => a.addEventListener("click", () => { nav.classList.remove("is-open"); $("#burger").setAttribute("aria-expanded", "false"); }));
const io = new IntersectionObserver((es) => es.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); } }),
  { threshold: 0.1, rootMargin: "0px 0px -40px 0px" });
$$(".reveal").forEach((el) => io.observe(el));

const sticky = $("#sticky");
const toggleSticky = () => {
  const inForm = ["#apply", "#magnet"].some((s) => { const r = $(s).getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0; });
  sticky.classList.toggle("is-hidden", scrollY < 500 || inForm);
};
addEventListener("scroll", toggleSticky, { passive: true }); toggleSticky();
