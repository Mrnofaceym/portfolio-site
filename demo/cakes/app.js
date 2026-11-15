/* «Медовик» — demo home bakery.
 * Catalog with category tabs, «Зібрати торт» order builder with a live price estimate,
 * POST ORDER_URL (Cloudflare Pages Function -> confectioner's Telegram; demo mode without keys).
 * Catalog prices can come from a Google Sheet (File → Share → Publish to web → CSV), columns:
 *   категорія | назва | опис | ціна | одиниця | фото | показувати
 * Empty SHEET_CSV_URL or a failed load -> the built-in CATALOG below is used. */
const ORDER_URL = "/api/cakes-order";
const SHEET_CSV_URL = "";

const CATS = { cakes: "🎂 Торти", bento: "🍱 Бенто", cupcakes: "🧁 Капкейки", desserts: "🍰 Десерти" };
let CATALOG = [
  { cat: "cakes", name: "Медовик класичний", desc: "8 тонких медових коржів, сметанно-вершковий крем. Наш фірмовий.", price: 650, unit: "кг", img: "img/medovik.webp", badge: "Хіт", fill: "medovik" },
  { cat: "cakes", name: "Шоколад — вишня", desc: "Шоколадний бісквіт, вишневе конфі, ганаш на бельгійському шоколаді.", price: 720, unit: "кг", img: "img/chocolate.webp", fill: "choco" },
  { cat: "cakes", name: "Ягідний «відкритий» торт", desc: "Ванільний бісквіт, крем-чіз і сезонні ягоди зверху.", price: 780, unit: "кг", img: "img/naked.webp", fill: "berry" },
  { cat: "cakes", name: "Дитячий торт", desc: "Яскравий крем, посипка, макаронс. Без барвників-«хімії».", price: 700, unit: "кг", img: "img/kids.webp", fill: "vanilla" },
  { cat: "cakes", name: "Весільний торт", desc: "Від 3 кг, 2–3 яруси, живі квіти. Дегустація перед замовленням.", price: 800, unit: "кг", img: "img/wedding.webp", fill: "berry" },
  { cat: "bento", name: "Бенто-торт 450 г", desc: "Маленький торт на 2–4 особи в крафтовій коробці з ложечками.", price: 420, unit: "шт", img: "img/bento.webp", badge: "Подарунок", kind: "bento" },
  { cat: "bento", name: "Бенто + 2 капкейки", desc: "Набір «на двох»: бенто-торт з написом і два капкейки.", price: 560, unit: "шт", img: "img/bento.webp", kind: "bento" },
  { cat: "cupcakes", name: "Капкейки ванільні", desc: "Ванільний бісквіт, крем-чіз, свіжа ягода. Від 6 штук.", price: 75, unit: "шт", img: "img/cupcakes.webp", kind: "cupcakes" },
  { cat: "cupcakes", name: "Капкейки солона карамель", desc: "Шоколадне тісто, начинка з карамелі, карамельний крем.", price: 85, unit: "шт", img: "img/cupcakes.webp", kind: "cupcakes" },
  { cat: "desserts", name: "Чізкейк Нью-Йорк", desc: "Ніжний, щільний, з полуницею й м'ятою.", price: 690, unit: "кг", img: "img/cheesecake.webp" },
  { cat: "desserts", name: "Десертний бокс «Свято»", desc: "16 мініатюр: макаронс, еклери, тарталетки. Ідеально на роботу.", price: 780, unit: "шт", img: "img/box.webp", badge: "Новинка" },
  { cat: "desserts", name: "Кенді-бар під ключ", desc: "Солодкий стіл на весілля, хрестини чи день народження — від 20 гостей.", price: 3500, unit: "від", img: "img/table.webp" },
];

const KINDS = [
  { id: "cake", name: "Торт", note: "від 1 кг" },
  { id: "bento", name: "Бенто-торт", note: "450 г, 420 грн" },
  { id: "cupcakes", name: "Капкейки", note: "від 6 шт" },
];
const CAKE_KG = [1, 1.5, 2, 2.5, 3, 4];
const CUP_QTY = [6, 9, 12, 24];
const BENTO_PRICE = 420, CUP_PRICE = 80;
const FILLINGS = [
  { id: "medovik", name: "Медовик", desc: "медові коржі, сметанний крем", kg: 650 },
  { id: "choco", name: "Шоколад — вишня", desc: "ганаш, вишневе конфі", kg: 720 },
  { id: "vanilla", name: "Ванільна хмаринка", desc: "бісквіт, крем-чіз, полуниця", kg: 690 },
  { id: "velvet", name: "Червоний оксамит", desc: "какао-бісквіт, вершковий сир", kg: 700 },
  { id: "snickers", name: "Снікерс", desc: "арахіс, карамель, нуга", kg: 740 },
  { id: "berry", name: "Лісова ягода", desc: "ваніль, мус зі смородини", kg: 780 },
];
const DECOR = [
  { id: "berries", name: "Свіжі ягоди", price: 180 },
  { id: "flowers", name: "Живі квіти", price: 250 },
  { id: "macarons", name: "Макаронс", price: 120 },
  { id: "topper", name: "Топер з написом", price: 150 },
  { id: "figures", name: "Фігурки з мастики", price: 350 },
  { id: "gold", name: "Золотий декор", price: 90 },
];
const DELIVERY = [
  { id: "pickup", name: "Самовивіз", note: "безкоштовно", price: 0 },
  { id: "courier", name: "Доставка по місту", note: "+100 грн", price: 100 },
];
const FAQ = [
  ["У дитини алергія — чи можете врахувати?", "Так. Напишіть у побажаннях, на що алергія (горіхи, лактоза, цитрусові тощо). Можемо зробити торт без горіхів, на безлактозних вершках або без барвників. Глютен повністю виключити не можемо — працюємо на одній кухні."],
  ["За скільки днів треба замовляти?", "Мінімум за 2 дні, бенто й капкейки — іноді на завтра (уточнюйте). На вихідні й свята краще за 5–7 днів, весільні торти — за 3–4 тижні."],
  ["Яка передоплата?", "30% після підтвердження замовлення — на картку. Решту — при отриманні. Якщо скасовуєте за 2+ дні, повертаємо передоплату повністю."],
  ["Як зберігати торт?", "У холодильнику при +2…+6 °C до 72 годин. Діставайте за 20–30 хвилин до подачі — так смак розкриється краще."],
  ["Чи можна зробити торт за фото?", "Так, надішліть фото в побажаннях або в Telegram. Кондитер підкаже, що реально повторити і скільки це коштуватиме."],
];

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const money = (n) => `${Math.round(n).toLocaleString("uk-UA")} грн`;
const pad = (n) => String(n).padStart(2, "0");
const isoDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const MON = ["січня", "лютого", "березня", "квітня", "травня", "червня", "липня", "серпня", "вересня", "жовтня", "листопада", "грудня"];
const kgLabel = (kg) => `${String(kg).replace(".", ",")} кг`;

/* ---------- catalog ---------- */
let cat = "cakes";
function renderCatalog() {
  const cats = Object.keys(CATS).filter((c) => CATALOG.some((s) => s.cat === c));
  if (!cats.includes(cat)) cat = cats[0];
  $("#tabs").innerHTML = cats.map((c) => `<button type="button" class="tab${c === cat ? " is-on" : ""}" role="tab" aria-selected="${c === cat}" data-cat="${c}">${CATS[c]}</button>`).join("");
  $("#cards").innerHTML = CATALOG.filter((s) => s.cat === cat).map((s, i) => `
    <article class="card">
      <img src="${esc(s.img || "img/hero.webp")}" alt="${esc(s.name)}" loading="lazy">
      <div class="card__body">
        ${s.badge ? `<span class="badge">${esc(s.badge)}</span>` : ""}
        <h3>${esc(s.name)}</h3>
        <p>${esc(s.desc)}</p>
        <div class="card__foot">
          <span class="card__price">${s.unit === "від" ? `<small>від </small>${money(s.price)}` : `${money(s.price)} <small>/ ${esc(s.unit)}</small>`}</span>
          <button type="button" class="btn btn--ghost" data-pick="${CATALOG.indexOf(s)}">Замовити</button>
        </div>
      </div>
    </article>`).join("");
}
$("#tabs").addEventListener("click", (e) => { const b = e.target.closest("[data-cat]"); if (b) { cat = b.dataset.cat; renderCatalog(); } });

$("#faqList").innerHTML = FAQ.map(([q, a]) => `<details class="qa reveal"><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join("");

/* ---------- order builder ---------- */
const state = { kind: "cake", size: 2, filling: "medovik", decor: new Set(), delivery: "pickup" };
const form = $("#orderForm");
const minDate = () => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + 2); return d; };
const opt = (attr, val, on, title, note) => `<button type="button" class="opt${on ? " is-on" : ""}" data-${attr}="${esc(val)}" aria-pressed="${on}">${title}${note ? `<small>${note}</small>` : ""}</button>`;

function renderBuilder() {
  $("#kinds").innerHTML = KINDS.map((k) => opt("kind", k.id, k.id === state.kind, k.name, k.note)).join("");
  const isCake = state.kind === "cake", isCup = state.kind === "cupcakes";
  $("#weightBlock").hidden = state.kind === "bento";
  $("#weightBlock legend").firstChild.textContent = isCup ? "2. Кількість " : "2. Вага ";
  const sizes = isCup ? CUP_QTY : CAKE_KG;
  if (state.kind !== "bento" && !sizes.includes(state.size)) state.size = isCup ? 6 : 2;
  $("#weights").innerHTML = sizes.map((v) => opt("size", v, v === state.size, isCup ? `${v} шт` : kgLabel(v))).join("");
  $("#guests").textContent = isCake ? `≈ ${Math.round(state.size * 7)} порцій` : "";
  $("#fillings").innerHTML = FILLINGS.map((f) => opt("filling", f.id, f.id === state.filling, f.name,
    `${esc(f.desc)}${isCake ? ` · ${f.kg} грн/кг` : ""}`)).join("");
  $("#decor").innerHTML = DECOR.map((d) => `<label class="check"><input type="checkbox" value="${d.id}"${state.decor.has(d.id) ? " checked" : ""}>${esc(d.name)}<small>+${d.price} грн</small></label>`).join("");
  $("#delivery").innerHTML = DELIVERY.map((d) => opt("delivery", d.id, d.id === state.delivery, d.name, d.note)).join("");
  $("#addrWrap").hidden = state.delivery !== "courier";
  renderSum();
}

function calc() {
  const f = FILLINGS.find((x) => x.id === state.filling) || FILLINGS[0];
  const lines = [];
  if (state.kind === "cake") lines.push([`Торт «${f.name}», ${kgLabel(state.size)}`, state.size * f.kg]);
  else if (state.kind === "bento") lines.push([`Бенто-торт «${f.name}», 450 г`, BENTO_PRICE]);
  else lines.push([`Капкейки «${f.name}», ${state.size} шт`, state.size * CUP_PRICE]);
  DECOR.filter((d) => state.decor.has(d.id)).forEach((d) => lines.push([d.name, d.price]));
  const dl = DELIVERY.find((d) => d.id === state.delivery);
  if (dl.price) lines.push([dl.name, dl.price]);
  const total = lines.reduce((s, l) => s + l[1], 0);
  return { lines, total, filling: f };
}
function renderSum() {
  const { lines, total } = calc();
  const date = form.elements.date.value;
  let when = "";
  if (date) { const d = new Date(date + "T00:00:00"); when = `<li><span>Дата</span><span>${d.getDate()} ${MON[d.getMonth()]}, ${esc(form.elements.time.value)}</span></li>`; }
  $("#sum").innerHTML = `<h3>Ваше замовлення</h3>
    <ul>${lines.map(([n, p]) => `<li><span>${esc(n)}</span><span>${money(p)}</span></li>`).join("")}${when}</ul>
    <div class="sum__total"><span>Орієнтовно</span><b>${money(total)}</b></div>
    <p class="sum__pre">Передоплата 30%: <b>${money(Math.round(total * 0.3 / 10) * 10)}</b></p>`;
}

form.addEventListener("click", (e) => {
  const b = e.target.closest(".opt"); if (!b) return;
  if (b.dataset.kind) { state.kind = b.dataset.kind; }
  if (b.dataset.size) state.size = Number(b.dataset.size);
  if (b.dataset.filling) state.filling = b.dataset.filling;
  if (b.dataset.delivery) state.delivery = b.dataset.delivery;
  renderBuilder();
});
$("#decor").addEventListener("change", (e) => {
  const c = e.target; if (c.type !== "checkbox") return;
  c.checked ? state.decor.add(c.value) : state.decor.delete(c.value); renderSum();
});
form.elements.date.addEventListener("change", () => { form.elements.date.classList.remove("is-bad"); renderSum(); });
form.elements.time.addEventListener("change", renderSum);

const fDate = $("#fDate");
fDate.min = isoDate(minDate());
$("#fTime").innerHTML = Array.from({ length: 10 }, (_, i) => `<option>${pad(10 + i)}:00</option>`).join("");
$("#fTime").value = "12:00";
const md = minDate();
$("#nearest").textContent = `з ${md.getDate()} ${MON[md.getMonth()]}`;

document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-pick]"); if (!b) return;
  const item = CATALOG[Number(b.dataset.pick)]; if (!item) return;
  state.kind = item.kind || "cake";
  if (item.fill) state.filling = item.fill;
  if (state.kind === "cupcakes") state.size = 6;
  if (item.name.includes("Весільний")) { state.size = 3; state.decor.add("flowers"); }
  if (item.cat === "desserts") form.elements.comment.value = `Цікавить: ${item.name}`;
  renderBuilder();
  $("#builder").scrollIntoView({ behavior: "smooth" });
});

function msg(text, cls) { const p = $("#formMsg"); p.textContent = text; p.className = "form__msg " + (cls || ""); }
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const f = form.elements;
  $$(".is-bad", form).forEach((x) => x.classList.remove("is-bad"));
  const bad = [];
  if (!f.date.value || f.date.value < fDate.min) bad.push(f.date);
  if (state.delivery === "courier" && f.address.value.trim().length < 5) bad.push(f.address);
  if (f.name.value.trim().length < 2) bad.push(f.name);
  if (f.phone.value.replace(/\D/g, "").length < 9) bad.push(f.phone);
  if (bad.length) {
    bad.forEach((x) => x.classList.add("is-bad"));
    bad[0].focus({ preventScroll: true }); bad[0].scrollIntoView({ behavior: "smooth", block: "center" });
    return msg(bad.includes(f.date) ? "Оберіть дату — не раніше ніж за 2 дні." : "Перевірте, будь ласка, виділені поля.", "err");
  }
  if (f.website.value) return;
  const btn = form.querySelector("button[type=submit]");
  btn.disabled = true; msg("Надсилаємо…");
  const { lines, total, filling } = calc(), name = f.name.value.trim();
  const kind = KINDS.find((k) => k.id === state.kind).name;
  try {
    const r = await fetch(ORDER_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
      kind, size: state.kind === "cake" ? kgLabel(state.size) : state.kind === "cupcakes" ? `${state.size} шт` : "450 г",
      filling: filling.name, decor: DECOR.filter((d) => state.decor.has(d.id)).map((d) => d.name),
      inscription: f.inscription.value.trim(), date: f.date.value, time: f.time.value,
      delivery: DELIVERY.find((d) => d.id === state.delivery).name, address: f.address.value.trim(),
      name, phone: f.phone.value.trim(), comment: f.comment.value.trim(), total, website: f.website.value }) });
    if (!r.ok) throw new Error(r.status);
    const d = new Date(f.date.value + "T00:00:00");
    msg(`Дякуємо, ${name}! Замовлення на ${d.getDate()} ${MON[d.getMonth()]} прийнято (≈ ${money(total)}). Кондитер зв'яжеться з вами протягом години.`, "ok");
    ["name", "phone", "comment", "inscription", "address"].forEach((k) => (f[k].value = ""));
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
const toggleSticky = () => { const r = $("#builder").getBoundingClientRect(); sticky.classList.toggle("is-hidden", scrollY < 300 || (r.top < innerHeight && r.bottom > 0)); };
addEventListener("scroll", toggleSticky, { passive: true }); toggleSticky();
$("#year").textContent = new Date().getFullYear();

function renderAll() { renderCatalog(); renderBuilder(); observe(); }
renderAll();

/* ---------- Google Sheet: catalog ---------- */
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
    const C = { cat: col("категорія"), name: col("назва"), desc: col("опис"), price: col("ціна"), unit: col("одиниця"), img: col("фото"), show: col("показувати") };
    const get = (row, k) => (C[k] >= 0 ? (row[C[k]] || "").trim() : "");
    const catId = (v) => Object.keys(CATS).find((k) => CATS[k].toLowerCase().includes(v.toLowerCase()) || k === v) || "cakes";
    const list = rows.map((row) => {
      const c = catId(get(row, "cat"));
      return { cat: c, name: get(row, "name"), desc: get(row, "desc"), price: parseInt(get(row, "price").replace(/\D/g, ""), 10),
        unit: get(row, "unit") || "шт", img: get(row, "img") || `img/${{ cakes: "medovik", bento: "bento", cupcakes: "cupcakes", desserts: "box" }[c]}.webp`,
        kind: c === "bento" ? "bento" : c === "cupcakes" ? "cupcakes" : undefined, hidden: /^(ні|no|0)$/i.test(get(row, "show")) };
    }).filter((s) => s.name && s.price && !s.hidden);
    if (!list.length) return;
    CATALOG = list; renderCatalog();
  } catch (e) { console.warn("sheet not loaded, using built-in catalog", e); }
}
loadSheet();
