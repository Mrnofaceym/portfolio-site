/* «Півонія» — demo beauty studio.
 * Price list by category, masters, online booking: service -> master -> day -> free time -> contacts,
 * POST BOOK_URL (Cloudflare Pages Function -> salon's Telegram; demo mode without keys).
 * Prices can come from a Google Sheet (File → Share → Publish to web → CSV), columns:
 *   категорія | послуга | ціна | хвилин | майстри (ids через кому) | показувати
 * Empty SHEET_CSV_URL or a failed load -> the built-in SERVICES below are used. */
const BOOK_URL = "/api/salon-book";
const SHEET_CSV_URL = "";

const CATS = { nails: "💅 Нігті", hair: "✂️ Волосся", brows: "✨ Брови й вії" };
let SERVICES = [
  { id: "mani", cat: "nails", name: "Манікюр з покриттям гель-лак", min: 90, price: 550, masters: ["anna"] },
  { id: "mani-design", cat: "nails", name: "Манікюр + дизайн (до 4 нігтів)", min: 120, price: 700, masters: ["anna"] },
  { id: "ext", cat: "nails", name: "Нарощування нігтів", min: 150, price: 900, masters: ["anna"] },
  { id: "pedi", cat: "nails", name: "Педикюр з покриттям", min: 90, price: 650, masters: ["anna"] },
  { id: "cut", cat: "hair", name: "Жіноча стрижка + укладка", min: 60, price: 450, masters: ["olena"] },
  { id: "color", cat: "hair", name: "Фарбування в один тон", min: 120, price: 1200, masters: ["olena"] },
  { id: "balayage", cat: "hair", name: "Балаяж / AirTouch", min: 240, price: 2800, masters: ["olena"] },
  { id: "brows", cat: "brows", name: "Корекція і фарбування брів", min: 45, price: 350, masters: ["kateryna"] },
  { id: "lami", cat: "brows", name: "Ламінування брів", min: 60, price: 500, masters: ["kateryna"] },
  { id: "lashes", cat: "brows", name: "Ламінування вій", min: 60, price: 550, masters: ["kateryna"] },
];
const MASTERS = [
  { id: "anna", name: "Анна", role: "Майстер манікюру й педикюру", img: "img/m-anna.webp", exp: "6 років досвіду",
    about: "Акуратне вирівнювання, тонке покриття, яке тримається 3–4 тижні. Обожнює нюдові дизайни." },
  { id: "olena", name: "Олена", role: "Перукар-колорист", img: "img/m-olena.webp", exp: "9 років досвіду",
    about: "Складні фарбування, балаяж, м'які переходи. Підбере відтінок, який пасуватиме саме вам." },
  { id: "kateryna", name: "Катерина", role: "Бров- і лешмейкер", img: "img/m-kateryna.webp", exp: "4 роки досвіду",
    about: "Природна форма брів, ламінування й фарбування. Порадить домашній догляд." },
];
const FAQ = [
  ["Як скасувати або перенести запис?", "Напишіть або зателефонуйте нам хоча б за 3 години — перенесемо на зручний час без доплат."],
  ["Чи можна прийти з дитиною?", "Так, у нас є куточок з книжками й мультиками. Попередьте в коментарі до запису."],
  ["Чи стерилізуєте інструменти?", "Так: дезінфекція, ультразвукова мийка і сухожар. Крафт-пакет відкриваємо при вас."],
  ["Як оплатити?", "Готівкою або карткою після процедури. Передоплата не потрібна."],
];

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const WD = ["Нд", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
const MON = ["січ", "лют", "бер", "кві", "тра", "чер", "лип", "сер", "вер", "жов", "лис", "гру"];
const dur = (m) => (m >= 60 ? `${Math.floor(m / 60)} год${m % 60 ? ` ${m % 60} хв` : ""}` : `${m} хв`);
const masterName = (id) => (MASTERS.find((m) => m.id === id) || {}).name || "Будь-який майстер";

/* ---------- price list with category tabs ---------- */
let cat = "nails";
function renderPrices() {
  const cats = Object.keys(CATS).filter((c) => SERVICES.some((s) => s.cat === c));
  if (!cats.includes(cat)) cat = cats[0];
  $("#tabs").innerHTML = cats.map((c) => `<button type="button" class="tab${c === cat ? " is-on" : ""}" role="tab" aria-selected="${c === cat}" data-cat="${c}">${CATS[c]}</button>`).join("");
  $("#priceList").innerHTML = SERVICES.filter((s) => s.cat === cat).map((s) => `
    <div class="price__row">
      <div><b>${esc(s.name)}</b><small>${dur(s.min)} · ${esc(s.masters.map(masterName).join(", "))}</small></div>
      <span class="price__sum">${s.price} грн</span>
      <button type="button" class="btn btn--ghost" data-book="${esc(s.id)}">Записатися</button>
    </div>`).join("");
}
$("#tabs").addEventListener("click", (e) => { const b = e.target.closest("[data-cat]"); if (b) { cat = b.dataset.cat; renderPrices(); } });

function renderMasters() {
  $("#mastersGrid").innerHTML = MASTERS.map((m) => `
    <article class="master reveal">
      <img src="${m.img}" alt="${esc(m.name)}, ${esc(m.role)}" loading="lazy">
      <div><p class="tagline">${esc(m.role)}</p><h3>${esc(m.name)}</h3><p class="muted">${esc(m.exp)}</p><p>${esc(m.about)}</p>
        <button type="button" class="btn btn--ghost" data-master="${m.id}">Записатися до ${esc(m.name)}</button></div>
    </article>`).join("");
}
$("#faqList").innerHTML = FAQ.map(([q, a]) => `<details class="qa reveal"><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join("");

/* ---------- booking ---------- */
const state = { service: SERVICES[0].id, master: "", date: "", time: "" };
const fService = $("#fService"), fMaster = $("#fMaster");
const pad = (n) => String(n).padStart(2, "0");
const isoDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const svc = () => SERVICES.find((x) => x.id === state.service) || SERVICES[0];

function fillServices() {
  fService.innerHTML = Object.keys(CATS).map((c) => {
    const list = SERVICES.filter((s) => s.cat === c);
    return list.length ? `<optgroup label="${CATS[c].replace(/^\S+\s/, "")}">${list.map((s) => `<option value="${esc(s.id)}">${esc(s.name)} — ${s.price} грн</option>`).join("")}</optgroup>` : "";
  }).join("");
  if (!SERVICES.some((s) => s.id === state.service)) state.service = SERVICES[0].id;
  fService.value = state.service;
  fillMasters();
}
function fillMasters() {
  const ids = svc().masters.filter((id) => MASTERS.some((m) => m.id === id));
  fMaster.innerHTML = (ids.length > 1 ? `<option value="">Будь-який майстер</option>` : "") +
    ids.map((id) => `<option value="${id}">${esc(masterName(id))}</option>`).join("");
  if (!ids.includes(state.master)) state.master = ids.length === 1 ? ids[0] : "";
  fMaster.value = state.master;
}

const hours = (d) => (d.getDay() === 0 ? null : d.getDay() === 6 ? [10, 16] : [9, 19]);
function hash(str) { let h = 2166136261; for (const c of str) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; }
function slotsFor(dateStr) {
  const d = new Date(dateStr + "T00:00:00"), h = hours(d);
  if (!h) return [];
  const now = new Date(), out = [], step = 30;
  for (let m = h[0] * 60; m + svc().min <= h[1] * 60; m += step) {
    const t = `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
    if (new Date(`${dateStr}T${t}:00`) - now < 60 * 60 * 1000) continue;     // at least 1 h from now
    const busy = hash(dateStr + t + (state.master || svc().masters[0])) % 100 < 38;   // demo: some slots already taken
    out.push({ t, busy });
  }
  return out;
}
function renderDates() {
  const days = [];
  for (let i = 0; days.length < 14 && i < 24; i++) {
    const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + i);
    if (hours(d) && slotsFor(isoDate(d)).some((s) => !s.busy)) days.push(d);
  }
  if (!days.some((d) => isoDate(d) === state.date)) state.date = days[0] ? isoDate(days[0]) : "";
  $("#dates").innerHTML = days.map((d) => {
    const iso = isoDate(d), on = iso === state.date;
    return `<button type="button" class="date${on ? " is-on" : ""}" role="radio" aria-checked="${on}" data-date="${iso}"><small>${WD[d.getDay()]}</small><b>${d.getDate()}</b><small>${MON[d.getMonth()]}</small></button>`;
  }).join("");
  const first = days[0];
  if (first) {
    const t = slotsFor(isoDate(first)).find((s) => !s.busy).t, today = isoDate(new Date()) === isoDate(first);
    $("#nextFree").textContent = `${today ? "сьогодні" : `${WD[first.getDay()]}, ${first.getDate()} ${MON[first.getMonth()]}`} о ${t}`;
  }
}
function renderSlots() {
  const slots = state.date ? slotsFor(state.date) : [];
  if (!slots.some((s) => !s.busy && s.t === state.time)) state.time = "";
  $("#slots").innerHTML = slots.length ? slots.map((s) =>
    `<button type="button" class="slot${s.t === state.time ? " is-on" : ""}" role="radio" aria-checked="${s.t === state.time}" data-time="${s.t}"${s.busy ? " disabled" : ""}>${s.t}</button>`).join("")
    : `<p class="slots__empty">На цей день вільних вікон немає — оберіть інший.</p>`;
}
function updateSummary() {
  const el = $("#summary");
  if (!state.date || !state.time) { el.classList.remove("is-on"); return; }
  const s = svc(), d = new Date(state.date + "T00:00:00");
  el.innerHTML = `<b>${esc(s.name)}</b> · ${esc(masterName(state.master))}<br>${WD[d.getDay()]}, ${d.getDate()} ${MON[d.getMonth()]} о <b>${state.time}</b> · ${dur(s.min)} · <b>${s.price} грн</b>`;
  el.classList.add("is-on");
}
const refresh = () => { renderDates(); renderSlots(); updateSummary(); };

fService.addEventListener("change", () => { state.service = fService.value; fillMasters(); refresh(); });
fMaster.addEventListener("change", () => { state.master = fMaster.value; refresh(); });
$("#dates").addEventListener("click", (e) => { const b = e.target.closest(".date"); if (!b) return; state.date = b.dataset.date; refresh(); });
$("#slots").addEventListener("click", (e) => {
  const b = e.target.closest(".slot"); if (!b || b.disabled) return;
  state.time = b.dataset.time; renderSlots(); updateSummary(); $("#slots").classList.remove("is-bad");
});
document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-book], [data-master]"); if (!b) return;
  if (b.dataset.book) { state.service = b.dataset.book; fService.value = state.service; fillMasters(); }
  if (b.dataset.master) {
    const s = SERVICES.find((x) => x.masters.includes(b.dataset.master));
    if (s && !svc().masters.includes(b.dataset.master)) { state.service = s.id; fService.value = s.id; fillMasters(); }
    state.master = b.dataset.master; fMaster.value = state.master;
  }
  refresh();
  $("#book").scrollIntoView({ behavior: "smooth" });
});

function msg(text, cls) { const p = $("#formMsg"); p.textContent = text; p.className = "form__msg " + (cls || ""); }
$("#bookForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const f = e.target.elements;
  $$(".is-bad").forEach((x) => x.classList.remove("is-bad"));
  const bad = [];
  if (!state.time) bad.push($("#slots"));
  if (f.name.value.trim().length < 2) bad.push(f.name);
  if (f.phone.value.replace(/\D/g, "").length < 9) bad.push(f.phone);
  if (bad.length) {
    bad.forEach((x) => x.classList.add("is-bad"));
    return msg(state.time ? "Перевірте, будь ласка, ім'я та телефон." : "Оберіть вільний час.", "err");
  }
  if (f.website.value) return;
  const btn = e.target.querySelector("button[type=submit]");
  btn.disabled = true; msg("Надсилаємо…");
  const s = svc(), name = f.name.value.trim();
  try {
    const r = await fetch(BOOK_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
      service: s.name, price: s.price, master: masterName(state.master), date: state.date, time: state.time,
      name, phone: f.phone.value.trim(), website: f.website.value }) });
    if (!r.ok) throw new Error(r.status);
    const d = new Date(state.date + "T00:00:00");
    msg(`Дякуємо, ${name}! Ви записані на ${d.getDate()} ${MON[d.getMonth()]} о ${state.time}. Адміністратор підтвердить запис найближчим часом.`, "ok");
    e.target.reset(); state.time = ""; renderSlots(); updateSummary();
  } catch {
    msg("Не вдалося надіслати. Зателефонуйте нам, будь ласка: +380 00 000 00 00.", "err");
  } finally { btn.disabled = false; }
});

/* ---------- nav, reveal ---------- */
const nav = $("#nav");
const onScroll = () => nav.classList.toggle("is-solid", scrollY > 30);
addEventListener("scroll", onScroll, { passive: true }); onScroll();
$("#burger").addEventListener("click", () => $("#burger").setAttribute("aria-expanded", nav.classList.toggle("is-open")));
$$("#links a").forEach((a) => a.addEventListener("click", () => nav.classList.remove("is-open")));
const io = new IntersectionObserver((es) => es.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); } }),
  { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
const observe = () => $$(".reveal:not(.is-in)").forEach((el) => io.observe(el));
const sticky = $(".sticky-book");
const toggleSticky = () => sticky.classList.toggle("is-hidden", scrollY < 300 || $("#book").getBoundingClientRect().top < innerHeight);
addEventListener("scroll", toggleSticky, { passive: true }); toggleSticky();
$("#year").textContent = new Date().getFullYear();

function renderAll() { renderPrices(); renderMasters(); fillServices(); refresh(); observe(); }
renderAll();

/* ---------- Google Sheet: prices ---------- */
function parseCSV(text) {
  const rows = [[]]; let f = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
    else if (c === '"') q = true;
    else if (c === ",") { rows[rows.length - 1].push(f); f = ""; }
    else if (c === "\n") { rows[rows.length - 1].push(f); f = ""; rows.push([]); }
    else if (c !== "\r") f += c;
  }
  rows[rows.length - 1].push(f);
  return rows.filter((r) => r.some((x) => x.trim()));
}
async function loadSheet() {
  if (!SHEET_CSV_URL) return;
  try {
    const r = await fetch(SHEET_CSV_URL, { cache: "no-store" });
    if (!r.ok) throw new Error(r.status);
    const [head, ...rows] = parseCSV(await r.text());
    const col = (n) => head.findIndex((h) => h.trim().toLowerCase() === n);
    const C = { cat: col("категорія"), name: col("послуга"), price: col("ціна"), min: col("хвилин"), masters: col("майстри"), show: col("показувати") };
    const get = (row, k) => (C[k] >= 0 ? (row[C[k]] || "").trim() : "");
    const catId = (v) => Object.keys(CATS).find((k) => CATS[k].toLowerCase().includes(v.toLowerCase()) || k === v) || "nails";
    const list = rows.map((row, i) => ({
      id: `s${i + 1}`, cat: catId(get(row, "cat")), name: get(row, "name"),
      price: parseInt(get(row, "price").replace(/\D/g, ""), 10), min: parseInt(get(row, "min"), 10) || 60,
      masters: (get(row, "masters") || MASTERS[0].id).split(",").map((x) => x.trim()).filter(Boolean),
      hidden: /^(ні|no|0)$/i.test(get(row, "show")),
    })).filter((s) => s.name && s.price && !s.hidden);
    if (!list.length) return;
    SERVICES = list; renderAll();
  } catch (e) { console.warn("sheet not loaded, using built-in prices", e); }
}
loadSheet();
