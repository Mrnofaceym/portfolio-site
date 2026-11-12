/* «Липовий двір» — demo guest house in Khmilnyk.
 * Booking: room -> check-in/check-out on a calendar (busy nights hidden) -> contacts,
 * POST BOOK_URL (Cloudflare Pages Function -> owner's Telegram; demo mode without keys). */
const BOOK_URL = "/api/rooms-book";
const LONG_STAY = 10, LONG_DISCOUNT = 0.10;

const ROOMS = [
  { id: "double", img: "img/room-double.webp", name: "Двомісна з садом", price: 750, max: 2, area: 16,
    perks: ["Двоспальне ліжко", "Санвузол з душем", "Вид на сад"] },
  { id: "twin", img: "img/room-twin.webp", name: "Двомісна, два ліжка", price: 650, max: 2, area: 14,
    perks: ["Два окремі ліжка", "Санвузол з душем", "Зручно для подруг або мами з донькою"] },
  { id: "family", img: "img/room-family.webp", name: "Сімейна", price: 950, max: 4, area: 22,
    perks: ["Двоспальне ліжко + 2 додаткові місця", "Санвузол з душем", "Холодильник у кімнаті"] },
  { id: "studio", img: "img/studio.webp", name: "Студія з кухнею", price: 1100, max: 3, area: 24,
    perks: ["Власна міні-кухня", "Окремий вхід", "Ідеально для курсу 14–21 день"] },
];

const FAQ = [
  ["Наскільки далеко до санаторіїв?", "Близько 7 хвилин пішки до санаторної зони та бюветів. Дорога — через парк біля річки."],
  ["Чи можна записатися на радонові ванни без путівки?", "Так, у більшості санаторіїв процедури можна оплатити окремо. Підкажемо, куди звернутися, і допоможемо записатися заздалегідь."],
  ["Чи потрібна передоплата?", "Після підтвердження бронювання — передоплата за 1 добу на картку. Решту оплачуєте при заїзді. Скасування за 3 дні до заїзду — безкоштовно."],
  ["Чи є знижки на довге проживання?", `Так, від ${LONG_STAY} ночей — знижка ${LONG_DISCOUNT * 100}% на весь термін. Більшість курсів лікування — 10–14 днів.`],
  ["Чи можна з тваринами?", "Невеликих тварин — за домовленістю. Напишіть про це в побажаннях до бронювання."],
];

const $ = (s, el = document) => el.querySelector(s);
const MONTHS = ["Січень", "Лютий", "Березень", "Квітень", "Травень", "Червень", "Липень", "Серпень", "Вересень", "Жовтень", "Листопад", "Грудень"];
const fmtMoney = (n) => n.toLocaleString("uk-UA").replace(/,/g, " ") + " грн";
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const nightsWord = (n) => (n % 10 === 1 && n % 100 !== 11 ? "ніч" : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? "ночі" : "ночей");
const fmtDate = (s) => { const [y, m, d] = s.split("-"); return `${d}.${m}.${y}`; };

/* ---- rooms ---- */
$("#roomsGrid").innerHTML = ROOMS.map((r) => `
  <article class="room reveal">
    <img src="${r.img}" alt="${r.name}" loading="lazy">
    <div class="room__body">
      <div class="room__top"><h3>${r.name}</h3><span class="room__price"><b>${r.price} грн</b> / доба</span></div>
      <p class="room__meta">👤 до ${r.max} гостей · ${r.area} м²</p>
      <ul>${r.perks.map((p) => `<li>${p}</li>`).join("")}</ul>
      <button class="btn btn--ghost btn--wide" type="button" data-room="${r.id}">Обрати дати</button>
    </div>
  </article>`).join("");

/* ---- faq ---- */
$("#faqList").innerHTML = FAQ.map(([q, a]) => `<details class="qa reveal"><summary>${q}</summary><p>${a}</p></details>`).join("");

/* ---- demo busy nights: deterministic per room, so the calendar looks lived-in ---- */
const today = new Date(); today.setHours(0, 0, 0, 0);
function busyNights(roomId) {
  let seed = [...roomId].reduce((a, c) => a + c.charCodeAt(0), 0);
  const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  const busy = new Set();
  let d = addDays(today, Math.floor(rnd() * 4));
  while (d < addDays(today, 120)) {
    const len = 4 + Math.floor(rnd() * 10);           // a stay of 4–13 nights
    for (let i = 0; i < len; i++) busy.add(iso(addDays(d, i)));
    d = addDays(d, len + 8 + Math.floor(rnd() * 16)); // then a free gap (often long enough for a 10+ night course)
  }
  return busy;
}

/* ---- booking form ---- */
const form = $("#bookForm"), fRoom = $("#fRoom"), fGuests = $("#fGuests");
fRoom.innerHTML = ROOMS.map((r) => `<option value="${r.id}">${r.name} — ${r.price} грн</option>`).join("");
let state = { room: ROOMS[0], busy: busyNights(ROOMS[0].id), start: null, end: null, month: new Date(today.getFullYear(), today.getMonth(), 1) };

function fillGuests() {
  const cur = +fGuests.value || 1;
  fGuests.innerHTML = Array.from({ length: state.room.max }, (_, i) => `<option${i + 1 === Math.min(cur, state.room.max) ? " selected" : ""}>${i + 1}</option>`).join("");
}
function setRoom(id) {
  state.room = ROOMS.find((r) => r.id === id);
  state.busy = busyNights(id);
  state.start = state.end = null;
  fRoom.value = id;
  fillGuests(); renderCal(); renderSummary();
}
fRoom.addEventListener("change", () => setRoom(fRoom.value));
document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-room]");
  if (!b) return;
  setRoom(b.dataset.room);
  $("#book").scrollIntoView({ behavior: "smooth" });
});

const rangeFree = (a, b) => { for (let d = a; d < b; d = addDays(d, 1)) if (state.busy.has(iso(d))) return false; return true; };

function renderCal() {
  const m = state.month, first = new Date(m.getFullYear(), m.getMonth(), 1);
  const lead = (first.getDay() + 6) % 7, days = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate();
  $("#calTitle").textContent = `${MONTHS[m.getMonth()]} ${m.getFullYear()}`;
  $("#calPrev").disabled = m <= new Date(today.getFullYear(), today.getMonth(), 1);
  let html = "<span></span>".repeat(lead);
  for (let i = 1; i <= days; i++) {
    const d = new Date(m.getFullYear(), m.getMonth(), i), k = iso(d);
    const past = d < today, busy = state.busy.has(k);
    // a busy night can still be a check-out day if the previous night is free and a start is chosen
    const canCheckout = busy && state.start && !state.end && d > state.start && rangeFree(state.start, d);
    const cls = ["day"];
    if (past) cls.push("is-past");
    else if (busy && !canCheckout) cls.push("is-busy");
    if (state.start && iso(state.start) === k) cls.push("is-start");
    if (state.end && iso(state.end) === k) cls.push("is-end");
    if (state.start && state.end && d > state.start && d < state.end) cls.push("is-in");
    // after choosing check-in, dim days that can't be a check-out (a busy night lies between)
    if (state.start && !state.end && !past && !busy && d > state.start && !rangeFree(state.start, d)) cls.push("is-far");
    const off = past || (busy && !canCheckout);
    html += `<button type="button" class="${cls.join(" ")}" data-d="${k}"${off ? " disabled" : ""}>${i}</button>`;
  }
  $("#calGrid").innerHTML = html;
}
$("#calPrev").addEventListener("click", () => { state.month = new Date(state.month.getFullYear(), state.month.getMonth() - 1, 1); renderCal(); });
$("#calNext").addEventListener("click", () => { state.month = new Date(state.month.getFullYear(), state.month.getMonth() + 1, 1); renderCal(); });
$("#calGrid").addEventListener("click", (e) => {
  const b = e.target.closest("[data-d]");
  if (!b) return;
  const [y, mo, da] = b.dataset.d.split("-").map(Number), d = new Date(y, mo - 1, da);
  if (!state.start || state.end || d <= state.start || !rangeFree(state.start, d)) {
    if (state.busy.has(iso(d))) return;          // can't check in on a busy night
    state.start = d; state.end = null;
  } else {
    state.end = d;
  }
  renderCal(); renderSummary();
});

function calc() {
  if (!state.start || !state.end) return null;
  const nights = Math.round((state.end - state.start) / 864e5);
  const base = nights * state.room.price;
  const disc = nights >= LONG_STAY ? Math.round(base * LONG_DISCOUNT) : 0;
  return { nights, base, disc, total: base - disc };
}
function renderSummary() {
  const s = $("#summary"), c = calc();
  if (!state.start) { s.innerHTML = "<span class='muted'>Оберіть день заїзду в календарі.</span>"; return; }
  if (!c) { s.innerHTML = `Заїзд <b>${fmtDate(iso(state.start))}</b>. Тепер оберіть день виїзду.`; return; }
  const hint = c.disc ? `<span class="ok">Знижка ${LONG_DISCOUNT * 100}% за довге проживання: −${fmtMoney(c.disc)}</span>`
    : `<span class="muted">Ще ${LONG_STAY - c.nights} ${nightsWord(LONG_STAY - c.nights)} — і знижка ${LONG_DISCOUNT * 100}%.</span>`;
  s.innerHTML = `<div><b>${state.room.name}</b> · ${fmtDate(iso(state.start))} → ${fmtDate(iso(state.end))} · ${c.nights} ${nightsWord(c.nights)}</div>
    <div class="summary__total">${fmtMoney(c.total)}</div>${hint}`;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const msg = $("#formMsg"), fd = new FormData(form), c = calc();
  const name = fd.get("name").trim(), phone = fd.get("phone").trim();
  form.querySelectorAll(".bad").forEach((x) => x.classList.remove("bad"));
  let bad = false;
  if (name.length < 2) { form.name.classList.add("bad"); bad = true; }
  if (phone.replace(/\D/g, "").length < 9) { form.phone.classList.add("bad"); bad = true; }
  if (!c) { $("#cal").classList.add("bad"); bad = true; }
  if (bad) { msg.className = "form__msg err"; msg.textContent = c ? "Перевірте, будь ласка, ім'я та телефон." : "Оберіть дати заїзду та виїзду в календарі."; return; }
  const btn = form.querySelector("button[type=submit]");
  btn.disabled = true; msg.className = "form__msg"; msg.textContent = "Надсилаємо…";
  try {
    const r = await fetch(BOOK_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
      room: state.room.name, guests: fGuests.value, checkin: iso(state.start), checkout: iso(state.end),
      nights: c.nights, total: c.total, name, phone, note: fd.get("note"), website: fd.get("website"),
    }) });
    if (!r.ok) throw new Error(r.status);
    msg.className = "form__msg ok";
    msg.textContent = `Дякуємо, ${name}! Заявку на ${fmtDate(iso(state.start))}–${fmtDate(iso(state.end))} отримано — господиня передзвонить протягом 15 хвилин.`;
    form.reset(); setRoom(state.room.id);
  } catch {
    msg.className = "form__msg err"; msg.textContent = "Не вдалося надіслати. Зателефонуйте нам, будь ласка: +380 00 000 00 00.";
  } finally { btn.disabled = false; }
});

/* ---- nav, reveal ---- */
const nav = $("#nav"), burger = $("#burger"), links = $("#links");
addEventListener("scroll", () => nav.classList.toggle("is-solid", scrollY > 30), { passive: true });
burger.addEventListener("click", () => { const o = links.classList.toggle("is-open"); burger.setAttribute("aria-expanded", o); });
links.addEventListener("click", (e) => { if (e.target.tagName === "A") { links.classList.remove("is-open"); burger.setAttribute("aria-expanded", false); } });
const io = new IntersectionObserver((es) => es.forEach((x) => { if (x.isIntersecting) { x.target.classList.add("in"); io.unobserve(x.target); } }), { threshold: 0.12 });
document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
const sticky = $(".sticky-book");
const toggleSticky = () => sticky.classList.toggle("is-hidden", scrollY < 300 || $("#book").getBoundingClientRect().top < innerHeight);
addEventListener("scroll", toggleSticky, { passive: true }); toggleSticky();
$("#year").textContent = new Date().getFullYear();

fillGuests(); renderCal(); renderSummary();
