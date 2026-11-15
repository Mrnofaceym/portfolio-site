/* «Ромашка» — demo flower shop.
 * Catalog with occasion/price filters, quick-order modal (recipient, address, time slot, postcard, anonymous),
 * «Зібрати свій букет» builder, POST ORDER_URL (Cloudflare Pages Function -> shop's Telegram; demo mode without keys).
 * Catalog can come from a Google Sheet (File → Share → Publish to web → CSV), columns:
 *   назва | опис | ціна | приводи (через кому) | фото | показувати
 * Empty SHEET_CSV_URL or a failed load -> the built-in BOUQUETS below are used. */
const ORDER_URL = "/api/flowers-order";
const SHEET_CSV_URL = "";

const OCCASIONS = { all: "Усі", birthday: "🎂 День народження", love: "❤️ Коханій", mom: "🌷 Мамі", wedding: "💍 Весілля", just: "☀️ Просто так" };
const PRICES = { all: ["Будь-яка ціна", 0, Infinity], low: ["до 800 грн", 0, 800], mid: ["800–1500 грн", 800, 1500], high: ["від 1500 грн", 1500, Infinity] };
let BOUQUETS = [
  { name: "Ніжність", desc: "Піоновидні троянди, евкаліпт, пудровий папір.", price: 1450, tags: ["birthday", "love", "mom"], img: "img/peony.webp" },
  { name: "Класика: 25 червоних троянд", desc: "Червоні троянди 60 см у крафті зі стрічкою.", price: 1900, tags: ["love"], img: "img/red-roses.webp" },
  { name: "Весняний настрій", desc: "15 тюльпанів мікс у білому папері.", price: 850, tags: ["mom", "just", "birthday"], img: "img/tulips.webp" },
  { name: "Капелюшна коробка", desc: "Троянди й гортензія в круглій коробці. Не потрібна ваза.", price: 1650, tags: ["birthday", "mom"], img: "img/box.webp" },
  { name: "Букет нареченої", desc: "Троянди, ранункулюси, шовкова стрічка. Бутоньєрка — у подарунок.", price: 2200, tags: ["wedding"], img: "img/wedding.webp" },
  { name: "Білий шовк", desc: "Хризантеми й евкаліпт — стоять до 3 тижнів.", price: 690, tags: ["just", "mom"], img: "img/chrysanthemum.webp" },
  { name: "Сонячний", desc: "Соняшники, ромашки й польові квіти в крафті.", price: 750, tags: ["birthday", "just"], img: "img/sunflowers.webp" },
  { name: "Кошик «Пастель»", desc: "Велика композиція в кошику: троянди, гвоздики, еустома.", price: 2400, tags: ["birthday", "mom", "wedding"], img: "img/basket.webp" },
  { name: "25 білих троянд", desc: "Моно-букет з білих троянд у ніжно-зеленому папері.", price: 1950, tags: ["wedding", "love"], img: "img/white-roses.webp" },
  { name: "Блакитна мрія", desc: "Гортензія й білі троянди у скляній вазі.", price: 980, tags: ["just", "birthday", "love"], img: "img/vase.webp" },
];
const FLOWERS = [
  { id: "rose", name: "Троянди", price: 70 },
  { id: "peony", name: "Піоновидні троянди", price: 95 },
  { id: "tulip", name: "Тюльпани", price: 45 },
  { id: "chrys", name: "Хризантеми", price: 55 },
  { id: "eustoma", name: "Еустома", price: 80 },
  { id: "mix", name: "Мікс на смак флориста", price: 75 },
];
const COUNTS = [5, 9, 15, 25, 51];
const WRAPS = [
  { id: "kraft", name: "Крафт + стрічка", price: 0 },
  { id: "paper", name: "Кольоровий папір", price: 60 },
  { id: "box", name: "Капелюшна коробка", price: 250 },
  { id: "basket", name: "Кошик", price: 350 },
];
const GREEN_PRICE = 80;
const ZONES = [
  { id: "pickup", name: "Самовивіз", price: 0, note: "вул. Садова, 3 — щодня 8:00–20:00" },
  { id: "center", name: "Центр міста", price: 80, note: "~60–90 хв · безкоштовно від 1500 грн" },
  { id: "city", name: "Інші райони", price: 120, note: "~90–120 хв по місту" },
  { id: "suburb", name: "Передмістя до 10 км", price: 200, note: "за домовленістю про час" },
];
const SLOTS = [["09:00–12:00", 9, 12], ["12:00–15:00", 12, 15], ["15:00–18:00", 15, 18], ["18:00–20:00", 18, 20]];
const FAQ = [
  ["Чи можна замовити анонімно?", "Так. Поставте галочку «Анонімно» — кур'єр не назве відправника, а в листівці буде лише ваш текст (або без підпису)."],
  ["Як швидко доставите?", "Замовлення до 18:00 доставляємо того ж дня. У центрі — зазвичай за 60–90 хвилин, але ви обираєте зручний проміжок часу."],
  ["Чи надсилаєте фото букета?", "Завжди. Перед виїздом кур'єра надсилаємо фото букета у Viber чи Telegram — якщо щось не так, переробимо."],
  ["Скільки стоятимуть квіти?", "Троянди — 7–10 днів, хризантеми — до 3 тижнів, тюльпани — 5–7 днів. До кожного букета додаємо підживлення й інструкцію."],
  ["Як оплатити?", "Карткою за посиланням після підтвердження, або готівкою/карткою при самовивозі. Букет збираємо після оплати."],
  ["Отримувача немає вдома — що буде?", "Кур'єр зателефонує вам і отримувачу, зачекає 15 хвилин або привезе пізніше того ж дня безкоштовно."],
];

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const money = (n) => `${Math.round(n).toLocaleString("uk-UA")} грн`;
const pad = (n) => String(n).padStart(2, "0");
const isoDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const MON = ["січня", "лютого", "березня", "квітня", "травня", "червня", "липня", "серпня", "вересня", "жовтня", "листопада", "грудня"];

/* ---------- catalog with filters ---------- */
const filt = { occ: "all", price: "all" };
function renderCatalog() {
  $("#occasions").innerHTML = Object.entries(OCCASIONS).map(([k, v]) => `<button type="button" class="chip${k === filt.occ ? " is-on" : ""}" aria-pressed="${k === filt.occ}" data-occ="${k}">${v}</button>`).join("");
  $("#prices").innerHTML = Object.entries(PRICES).map(([k, v]) => `<button type="button" class="chip${k === filt.price ? " is-on" : ""}" aria-pressed="${k === filt.price}" data-price="${k}">${v[0]}</button>`).join("");
  const [, lo, hi] = PRICES[filt.price];
  const list = BOUQUETS.filter((b) => (filt.occ === "all" || b.tags.includes(filt.occ)) && b.price >= lo && b.price < hi);
  $("#cards").innerHTML = list.map((b) => `
    <article class="card">
      <img src="${esc(b.img)}" alt="Букет «${esc(b.name)}»" loading="lazy">
      <div class="card__body">
        <div class="tags">${b.tags.map((t) => `<span>${esc((OCCASIONS[t] || t).replace(/^\S+\s/, ""))}</span>`).join("")}</div>
        <h3>${esc(b.name)}</h3>
        <p>${esc(b.desc)}</p>
        <div class="card__foot">
          <span class="card__price">${money(b.price)}</span>
          <button type="button" class="btn" data-buy="${BOUQUETS.indexOf(b)}">Замовити</button>
        </div>
      </div>
    </article>`).join("");
  $("#empty").hidden = list.length > 0;
}
$(".filters").addEventListener("click", (e) => {
  const b = e.target.closest(".chip"); if (!b) return;
  if (b.dataset.occ) filt.occ = b.dataset.occ;
  if (b.dataset.price) filt.price = b.dataset.price;
  renderCatalog();
});
$("#zones").innerHTML = ZONES.map((z) => `<div class="zone reveal"><h3>${esc(z.name)}</h3><b>${z.price ? money(z.price) : "0 грн"}</b><p>${esc(z.note)}</p></div>`).join("");
$("#faqList").innerHTML = FAQ.map(([q, a]) => `<details class="qa reveal"><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join("");

/* ---------- build your own bouquet ---------- */
const bb = { flower: "rose", count: 15, wrap: "kraft", green: false };
const opt = (attr, val, on, title, note) => `<button type="button" class="opt${on ? " is-on" : ""}" data-${attr}="${esc(val)}" aria-pressed="${on}">${title}${note ? `<small>${note}</small>` : ""}</button>`;
function bbCalc() {
  const f = FLOWERS.find((x) => x.id === bb.flower), w = WRAPS.find((x) => x.id === bb.wrap);
  const price = f.price * bb.count + w.price + (bb.green ? GREEN_PRICE : 0);
  return { price, name: `Свій букет: ${f.name.toLowerCase()} × ${bb.count}`, desc: `${w.name}${bb.green ? ", зелень" : ""}` };
}
function renderBuilder() {
  $("#bbFlower").innerHTML = FLOWERS.map((f) => opt("flower", f.id, f.id === bb.flower, f.name, `${f.price} грн/шт`)).join("");
  $("#bbCount").innerHTML = COUNTS.map((c) => opt("count", c, c === bb.count, String(c))).join("");
  $("#bbWrap").innerHTML = WRAPS.map((w) => opt("wrap", w.id, w.id === bb.wrap, w.name, w.price ? `+${w.price} грн` : "безкоштовно")).join("");
  const c = bbCalc();
  $("#bbDesc").textContent = `${c.name}, ${c.desc}`;
  $("#bbPrice").textContent = money(c.price);
}
$("#bb").addEventListener("click", (e) => {
  const b = e.target.closest(".opt"); if (!b) return;
  if (b.dataset.flower) bb.flower = b.dataset.flower;
  if (b.dataset.count) bb.count = Number(b.dataset.count);
  if (b.dataset.wrap) bb.wrap = b.dataset.wrap;
  renderBuilder();
});
$("#bbGreen").addEventListener("change", (e) => { bb.green = e.target.checked; renderBuilder(); });

/* ---------- quick order modal ---------- */
const modal = $("#modal"), form = $("#orderForm"), fDate = $("#fDate"), fZone = $("#fZone");
const order = { item: null, slot: "" };
fZone.innerHTML = ZONES.map((z) => `<option value="${z.id}">${esc(z.name)}${z.price ? ` — ${z.price} грн` : ""}</option>`).join("");
fZone.value = "center";
const slotOpen = (dateStr, end) => {
  const now = new Date();
  if (dateStr !== isoDate(now)) return true;
  return now.getHours() * 60 + now.getMinutes() + 90 <= end * 60;     // need ~1.5 h to make & deliver
};
function firstDate() { const d = new Date(); if (!SLOTS.some((s) => slotOpen(isoDate(d), s[2]))) d.setDate(d.getDate() + 1); return isoDate(d); }
function renderSlots() {
  const ds = fDate.value;
  $("#slots").innerHTML = SLOTS.map(([t, , end]) => {
    const ok = ds && slotOpen(ds, end);
    if (!ok && order.slot === t) order.slot = "";
    return `<button type="button" class="slot${order.slot === t ? " is-on" : ""}" role="radio" aria-checked="${order.slot === t}" data-slot="${t}"${ok ? "" : " disabled"}>${t}</button>`;
  }).join("");
}
function deliveryPrice() {
  const z = ZONES.find((x) => x.id === fZone.value);
  return z.id === "center" && order.item.price >= 1500 ? 0 : z.price;
}
function renderTotal() {
  const dp = deliveryPrice(), z = ZONES.find((x) => x.id === fZone.value);
  $("#addrWrap").hidden = z.id === "pickup";
  $("#mTitle").textContent = z.id === "pickup" ? "Оформлення самовивозу" : "Оформлення доставки";
  $("#mTotal").innerHTML = `<div><span>Букет</span><span>${money(order.item.price)}</span></div>
    <div><span>${esc(z.name)}</span><span>${z.id === "pickup" ? "безкоштовно" : dp ? money(dp) : "безкоштовно 🎁"}</span></div>
    <div class="t"><span>Разом</span><span>${money(order.item.price + dp)}</span></div>`;
}
function openOrder(item) {
  order.item = item;
  $("#mItem").innerHTML = `<img src="${esc(item.img)}" alt=""><div><b>${esc(item.name)}</b><span>${esc(item.desc)}</span></div>`;
  fDate.min = isoDate(new Date());
  if (!fDate.value || fDate.value < fDate.min) fDate.value = firstDate();
  msg("");
  renderSlots(); renderTotal();
  if (typeof modal.showModal === "function") modal.showModal(); else modal.setAttribute("open", "");
  form.elements.name.focus({ preventScroll: true });
}
const closeModal = () => (modal.close ? modal.close() : modal.removeAttribute("open"));
$("#mClose").addEventListener("click", closeModal);
modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });
document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-buy]"); if (!b) return;
  openOrder(BOUQUETS[Number(b.dataset.buy)]);
});
$("#bbOrder").addEventListener("click", () => { const c = bbCalc(); openOrder({ name: c.name, desc: c.desc, price: c.price, img: "img/florist.webp" }); });
fDate.addEventListener("change", () => { fDate.classList.remove("is-bad"); renderSlots(); });
fZone.addEventListener("change", renderTotal);
$("#slots").addEventListener("click", (e) => {
  const b = e.target.closest(".slot"); if (!b || b.disabled) return;
  order.slot = b.dataset.slot; renderSlots(); $("#slots").classList.remove("is-bad");
});

function msg(text, cls) { const p = $("#formMsg"); p.textContent = text; p.className = "form__msg " + (cls || ""); }
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const f = form.elements, pickup = fZone.value === "pickup";
  $$(".is-bad", form).forEach((x) => x.classList.remove("is-bad"));
  const bad = [];
  if (f.name.value.trim().length < 2) bad.push(f.name);
  if (f.phone.value.replace(/\D/g, "").length < 9) bad.push(f.phone);
  if (f.rname.value.trim().length < 2) bad.push(f.rname);
  if (f.rphone.value.replace(/\D/g, "").length < 9) bad.push(f.rphone);
  if (!fDate.value || fDate.value < fDate.min) bad.push(fDate);
  if (!pickup && f.address.value.trim().length < 5) bad.push(f.address);
  if (!order.slot) bad.push($("#slots"));
  if (bad.length) {
    bad.forEach((x) => x.classList.add("is-bad"));
    bad[0].scrollIntoView({ behavior: "smooth", block: "center" });
    return msg(bad.length === 1 && !order.slot ? "Оберіть час доставки." : "Заповніть, будь ласка, виділені поля.", "err");
  }
  if (f.website.value) return;
  const btn = form.querySelector("button[type=submit]");
  btn.disabled = true; msg("Надсилаємо…");
  const total = order.item.price + deliveryPrice(), name = f.name.value.trim();
  try {
    const r = await fetch(ORDER_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
      bouquet: order.item.name, details: order.item.desc, price: order.item.price, total,
      zone: ZONES.find((z) => z.id === fZone.value).name, address: pickup ? "" : f.address.value.trim(),
      date: fDate.value, slot: order.slot, card: f.card.value.trim(), anonymous: f.anon.checked,
      name, phone: f.phone.value.trim(), rname: f.rname.value.trim(), rphone: f.rphone.value.trim(), website: f.website.value }) });
    if (!r.ok) throw new Error(r.status);
    const d = new Date(fDate.value + "T00:00:00");
    msg(`Дякуємо, ${name}! Замовлення прийнято: ${d.getDate()} ${MON[d.getMonth()]}, ${order.slot} (${money(total)}). Надішлемо фото букета перед доставкою.`, "ok");
    ["rname", "rphone", "address", "card"].forEach((k) => (f[k].value = "")); f.anon.checked = false;
  } catch {
    msg("Не вдалося надіслати. Зателефонуйте нам, будь ласка: +380 00 000 00 00 або напишіть у Telegram.", "err");
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
const toggleSticky = () => { const r = $("#catalog").getBoundingClientRect(); sticky.classList.toggle("is-hidden", scrollY < 300 || (r.top < innerHeight && r.bottom > 0)); };
addEventListener("scroll", toggleSticky, { passive: true }); toggleSticky();
$("#year").textContent = new Date().getFullYear();
{ const late = !SLOTS.some((s) => slotOpen(isoDate(new Date()), s[2])); $("#todayNote").textContent = late ? "завтра з 9:00" : "сьогодні до 20:00"; }

function renderAll() { renderCatalog(); renderBuilder(); observe(); }
renderAll();

/* ---------- Google Sheet: bouquets ---------- */
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
    const C = { name: col("назва"), desc: col("опис"), price: col("ціна"), tags: col("приводи"), img: col("фото"), show: col("показувати") };
    const get = (row, k) => (C[k] >= 0 ? (row[C[k]] || "").trim() : "");
    const occId = (v) => Object.keys(OCCASIONS).find((k) => k === v || OCCASIONS[k].toLowerCase().includes(v.toLowerCase()));
    const list = rows.map((row) => ({
      name: get(row, "name"), desc: get(row, "desc"), price: parseInt(get(row, "price").replace(/\D/g, ""), 10),
      tags: get(row, "tags").split(",").map((x) => occId(x.trim())).filter((x) => x && x !== "all"),
      img: get(row, "img") || "img/peony.webp", hidden: /^(ні|no|0)$/i.test(get(row, "show")),
    })).filter((b) => b.name && b.price && !b.hidden);
    if (!list.length) return;
    BOUQUETS = list; renderCatalog();
  } catch (e) { console.warn("sheet not loaded, using built-in bouquets", e); }
}
loadSheet();
