/* «Марта Світло» — demo photographer portfolio.
 * Hero crossfade slideshow, filterable masonry gallery with lightbox (arrows, swipe, Esc, neighbour preload),
 * packages, booking: date on a calendar (busy dates greyed out) -> package, type, contacts,
 * POST BOOK_URL (Cloudflare Pages Function -> photographer's Telegram; demo mode without keys).
 * Every image exists in two sizes: <name>-800.webp and <name>-1600.webp (long edge). */
const BOOK_URL = "/api/photo-book";

const CATS = { all: "Усі", wedding: "Весілля", family: "Сім'я", love: "Love story", portrait: "Портрет" };
// [file, category, wide?, caption]
const PHOTOS = [
  ["w-wheat", "wedding", 1, "Олена й Андрій, вечірнє поле"],
  ["w-veil", "wedding", 0, "Ранок нареченої"],
  ["l-forest", "love", 0, "Осінь удвох"],
  ["f-picnic", "family", 1, "Пікнік у парку"],
  ["p-man", "portrait", 0, "Діловий портрет"],
  ["w-rings", "wedding", 1, "Деталі весільного дня"],
  ["f-mother", "family", 0, "Мама й син"],
  ["l-pier", "love", 1, "Love story на озері"],
  ["w-bouquet", "wedding", 0, "Букет нареченої"],
  ["p-lavender", "portrait", 1, "Портрет у лаванді"],
  ["w-dance", "wedding", 1, "Перший танець"],
];
const PACKS = [
  { id: "mini", name: "Міні", time: "1 година", price: 2500, ready: "Фото за 7 днів",
    items: ["1 локація", "30+ фото в авторській обробці", "Онлайн-галерея на 1 рік", "Підказки з одягу й локації"] },
  { id: "standard", name: "Стандарт", time: "2 години", price: 4200, ready: "Фото за 10 днів", top: true,
    items: ["До 2 локацій, зміна образу", "70+ фото в авторській обробці", "5 фото з ретушшю шкіри", "Онлайн-галерея на 1 рік"] },
  { id: "wedding", name: "Весільний день", time: "до 10 годин", price: 16000, ready: "Фото за 30 днів, 30 тизерів — за 3 дні",
    items: ["Збори, церемонія, прогулянка, банкет", "500+ фото в авторській обробці", "Зустріч до весілля й таймінг дня", "Фотокнига 20×20 см у подарунок"] },
];
const FAQ = [
  ["Що вдягнути на фотосесію?", "Однотонний одяг природних відтінків: беж, молочний, сірий, пудровий, джинс. Уникайте великих логотипів і неонових кольорів. Для сімейної зйомки одягніться в одній гамі, але не однаково. Перед зйомкою надішлю підбірку прикладів."],
  ["Де знімаємо? Чи є студія?", "Влітку — поля, парки, берег річки, старе місто. Взимку й у негоду — орендована світла студія (оренда входить у пакет «Стандарт»). Можна знімати й удома: це найтепліші сімейні фото."],
  ["Коли будуть готові фото?", "Міні — за 7 днів, Стандарт — за 10 днів, весілля — за 30 днів. Після весілля вже за 3 дні надсилаю 30 тизерів, щоб було чим поділитися з рідними."],
  ["Скільки фото ми отримаємо?", "Кількість вказана в кожному пакеті — це мінімум. Усі кадри в авторській кольоровій обробці, у повному розмірі для друку й окремо — для соцмереж."],
  ["Як забронювати дату?", "Залиште заявку на цій сторінці — я передзвоню й підтверджу дату. Дата закріплюється після передоплати 30%, решта — в день зйомки."],
  ["Що, якщо піде дощ?", "Перенесемо зйомку на найближчу вільну дату без доплат. Або знімемо з парасольками — іноді це найатмосферніші кадри."],
];

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const money = (n) => n.toLocaleString("uk-UA").replace(/\s/g, " ") + " грн";
const src = (f, size) => `img/${f}-${size}.webp`;
const srcset = (f, wide) => `${src(f, 800)} ${wide ? 800 : 450}w, ${src(f, 1600)} ${wide ? 1600 : 900}w`;

/* ---------- hero slideshow (crossfade) ---------- */
const slides = $$("#slides img");
let cur = 0, timer;
$("#dots").innerHTML = slides.map((_, i) => `<button type="button" role="tab" aria-label="Слайд ${i + 1}"${i ? "" : ' class="is-on"'}></button>`).join("");
const dots = $$("#dots button");
function loadSlide(img) { if (img.dataset.srcset) { img.srcset = img.dataset.srcset; delete img.dataset.srcset; } }
function show(i) {
  loadSlide(slides[(i + 1) % slides.length]);            // warm up the next one
  slides[cur].classList.remove("is-on"); dots[cur].classList.remove("is-on");
  cur = (i + slides.length) % slides.length;
  loadSlide(slides[cur]);
  slides[cur].classList.add("is-on"); dots[cur].classList.add("is-on");
}
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const play = () => { clearInterval(timer); timer = setInterval(() => show(cur + 1), reduce ? 9000 : 5500); };
addEventListener("load", () => { loadSlide(slides[1]); play(); });
$("#dots").addEventListener("click", (e) => { const i = dots.indexOf(e.target.closest("button")); if (i >= 0) { show(i); play(); } });
document.addEventListener("visibilitychange", () => (document.hidden ? clearInterval(timer) : play()));

/* ---------- gallery ---------- */
let filter = "all";
$("#filters").innerHTML = Object.entries(CATS).map(([k, v]) =>
  `<button type="button" class="filter${k === filter ? " is-on" : ""}" role="tab" aria-selected="${k === filter}" data-f="${k}">${v}</button>`).join("");
$("#gallery").innerHTML = PHOTOS.map(([f, c, w, cap], i) => `
  <button type="button" class="tile" data-i="${i}" data-cat="${c}" aria-label="Відкрити фото: ${esc(cap)}">
    <img src="${src(f, 800)}" srcset="${srcset(f, w)}" sizes="(max-width: 600px) 50vw, (max-width: 1000px) 50vw, 390px"
      width="${w ? 1600 : 900}" height="${w ? 900 : 1600}" alt="${esc(cap)}" loading="lazy" decoding="async">
    <figcaption>${esc(CATS[c])} · ${esc(cap)}</figcaption>
  </button>`).join("");
$$(".tile img").forEach((img) => {
  if (img.complete && img.naturalWidth) img.classList.add("is-loaded");
  else img.addEventListener("load", () => img.classList.add("is-loaded"), { once: true });
});
$("#filters").addEventListener("click", (e) => {
  const b = e.target.closest("[data-f]"); if (!b || b.dataset.f === filter) return;
  filter = b.dataset.f;
  $$(".filter").forEach((x) => { const on = x === b; x.classList.toggle("is-on", on); x.setAttribute("aria-selected", on); });
  $$(".tile").forEach((t) => {
    const vis = filter === "all" || t.dataset.cat === filter;
    t.classList.toggle("is-hidden", !vis);
    t.classList.remove("is-pop"); if (vis) { void t.offsetWidth; t.classList.add("is-pop"); }
  });
});
const visible = () => $$(".tile:not(.is-hidden)").map((t) => +t.dataset.i);

/* ---------- lightbox ---------- */
const lb = $("#lb"), lbImg = $("#lbImg");
let list = [], pos = 0, lastFocus = null;
const preloaded = new Set();
function preload(i) {
  const f = PHOTOS[i][0]; if (preloaded.has(f)) return;
  preloaded.add(f); const im = new Image(); im.src = src(f, 1600);
}
function lbShow(p) {
  pos = (p + list.length) % list.length;
  const [f, c, , cap] = PHOTOS[list[pos]];
  lbImg.classList.add("is-loading");
  lbImg.onload = () => lbImg.classList.remove("is-loading");
  lbImg.src = src(f, 1600); lbImg.alt = cap;
  if (lbImg.complete) lbImg.classList.remove("is-loading");
  $("#lbCap").textContent = `${CATS[c]} · ${cap} — ${pos + 1} / ${list.length}`;
  preload(list[(pos + 1) % list.length]); preload(list[(pos - 1 + list.length) % list.length]);
}
function lbOpen(i) {
  list = visible(); lastFocus = document.activeElement;
  lb.hidden = false; document.body.classList.add("no-scroll");
  lbShow(list.indexOf(i)); $("#lbClose").focus();
}
function lbClose() { lb.hidden = true; document.body.classList.remove("no-scroll"); lbImg.removeAttribute("src"); lastFocus?.focus(); }
$("#gallery").addEventListener("click", (e) => { const t = e.target.closest(".tile"); if (t) lbOpen(+t.dataset.i); });
$("#lbClose").addEventListener("click", lbClose);
$("#lbPrev").addEventListener("click", () => lbShow(pos - 1));
$("#lbNext").addEventListener("click", () => lbShow(pos + 1));
lb.addEventListener("click", (e) => { if (e.target === lb || e.target.classList.contains("lb__fig")) lbClose(); });
document.addEventListener("keydown", (e) => {
  if (lb.hidden) return;
  if (e.key === "Escape") lbClose();
  else if (e.key === "ArrowRight") lbShow(pos + 1);
  else if (e.key === "ArrowLeft") lbShow(pos - 1);
  else if (e.key === "Tab") {                                   // keep focus inside the dialog
    const f = $$(".lb__btn"), i = f.indexOf(document.activeElement);
    e.preventDefault(); f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
  }
});
let sx = 0, sy = 0;
lb.addEventListener("touchstart", (e) => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
lb.addEventListener("touchend", (e) => {
  const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
  if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) lbShow(pos + (dx < 0 ? 1 : -1));
  else if (dy > 90 && Math.abs(dy) > Math.abs(dx)) lbClose();     // swipe down closes
}, { passive: true });

/* ---------- packages, faq ---------- */
$("#packs").innerHTML = PACKS.map((p) => `
  <article class="pack${p.top ? " pack--top" : ""} reveal">
    ${p.top ? '<span class="pack__badge">Найчастіше обирають</span>' : ""}
    <h3>${esc(p.name)}</h3><p class="pack__time">${esc(p.time)} зйомки</p>
    <p class="pack__price">${money(p.price)}</p>
    <ul>${p.items.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
    <p class="pack__ready">⏱ ${esc(p.ready)}</p>
    <button type="button" class="btn ${p.top ? "" : "btn--ghost"} btn--wide" data-pack="${p.id}">Обрати дату</button>
  </article>`).join("");
$("#faqList").innerHTML = FAQ.map(([q, a]) => `<details class="qa reveal"><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join("");

/* ---------- booking calendar ---------- */
const MONTHS = ["Січень", "Лютий", "Березень", "Квітень", "Травень", "Червень", "Липень", "Серпень", "Вересень", "Жовтень", "Листопад", "Грудень"];
const MON_G = ["січня", "лютого", "березня", "квітня", "травня", "червня", "липня", "серпня", "вересня", "жовтня", "листопада", "грудня"];
const WD = ["неділя", "понеділок", "вівторок", "середа", "четвер", "пʼятниця", "субота"];
const pad = (n) => String(n).padStart(2, "0");
const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const today = new Date(); today.setHours(0, 0, 0, 0);
const MAX_MONTHS = 12;
function hash(str) { let h = 2166136261; for (const c of str) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; }
// Demo busy dates: deterministic, so the calendar looks lived-in. Summer Saturdays are mostly taken by weddings,
// the next few weeks are busier than far-away months.
function isBusy(d) {
  const k = iso(d), r = hash("marta" + k) % 100, wd = d.getDay(), m = d.getMonth();
  const days = (d - today) / 864e5;
  if (d.getTime() === today.getTime()) return true;
  if (wd === 6) return r < (m >= 4 && m <= 8 ? 88 : 45);
  if (wd === 0) return r < 40;
  if (wd === 5) return r < 30;
  return r < (days < 30 ? 35 : 15);
}
const state = { date: null, month: new Date(today.getFullYear(), today.getMonth(), 1) };
function renderCal() {
  const m = state.month, first = new Date(m.getFullYear(), m.getMonth(), 1);
  const lead = (first.getDay() + 6) % 7, days = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate();
  const minM = new Date(today.getFullYear(), today.getMonth(), 1), maxM = new Date(today.getFullYear(), today.getMonth() + MAX_MONTHS - 1, 1);
  $("#calTitle").textContent = `${MONTHS[m.getMonth()]} ${m.getFullYear()}`;
  $("#calPrev").disabled = m <= minM; $("#calNext").disabled = m >= maxM;
  let html = "<span></span>".repeat(lead);
  for (let i = 1; i <= days; i++) {
    const d = new Date(m.getFullYear(), m.getMonth(), i), k = iso(d);
    const past = d < today, busy = !past && isBusy(d), on = state.date === k;
    const cls = ["day", past && "is-past", busy && "is-busy", on && "is-on", d.getTime() === today.getTime() && "is-today"].filter(Boolean).join(" ");
    const label = `${i} ${MON_G[d.getMonth()]}${busy ? ", зайнято" : past ? "" : ", вільно"}`;
    html += `<button type="button" class="${cls}" data-d="${k}" aria-label="${label}" aria-pressed="${on}"${past || busy ? " disabled" : ""}>${i}</button>`;
  }
  $("#calGrid").innerHTML = html;
}
$("#calPrev").addEventListener("click", () => { state.month = new Date(state.month.getFullYear(), state.month.getMonth() - 1, 1); renderCal(); });
$("#calNext").addEventListener("click", () => { state.month = new Date(state.month.getFullYear(), state.month.getMonth() + 1, 1); renderCal(); });
$("#calGrid").addEventListener("click", (e) => {
  const b = e.target.closest(".day"); if (!b || b.disabled) return;
  state.date = b.dataset.d; $("#cal").classList.remove("is-bad"); renderCal(); updateSummary();
});

const fPack = $("#fPack"), fKind = $("#fKind");
fPack.innerHTML = PACKS.map((p) => `<option value="${p.id}">${esc(p.name)} · ${esc(p.time)} — ${money(p.price)}</option>`).join("");
fPack.value = "standard";
const pack = () => PACKS.find((p) => p.id === fPack.value);
fPack.addEventListener("change", () => { if (fPack.value === "wedding") fKind.value = "Весілля"; else if (fKind.value === "Весілля") fKind.value = "Сімейна"; updateSummary(); });
fKind.addEventListener("change", () => { if (fKind.value === "Весілля") fPack.value = "wedding"; else if (fPack.value === "wedding") fPack.value = "standard"; updateSummary(); });
document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-pack]"); if (!b) return;
  fPack.value = b.dataset.pack; fPack.dispatchEvent(new Event("change"));
  $("#book").scrollIntoView({ behavior: "smooth" });
});
const human = (k) => { const d = new Date(k + "T00:00:00"); return `${d.getDate()} ${MON_G[d.getMonth()]} ${d.getFullYear()}, ${WD[d.getDay()]}`; };
function updateSummary() {
  const el = $("#summary");
  if (!state.date) { el.classList.remove("is-on"); return; }
  const p = pack();
  el.innerHTML = `<b>${esc(human(state.date))}</b><br>${esc(fKind.value)} · пакет «${esc(p.name)}», ${esc(p.time)} · <b>${money(p.price)}</b>`;
  el.classList.add("is-on");
}

function msg(text, cls) { const p = $("#formMsg"); p.textContent = text; p.className = "form__msg " + (cls || ""); }
$("#bookForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const f = e.target.elements;
  $$(".is-bad").forEach((x) => x.classList.remove("is-bad"));
  const bad = [];
  if (!state.date) bad.push($("#cal"));
  if (f.name.value.trim().length < 2) bad.push(f.name);
  if (f.phone.value.replace(/\D/g, "").length < 9) bad.push(f.phone);
  if (bad.length) {
    bad.forEach((x) => x.classList.add("is-bad"));
    return msg(state.date ? "Перевірте, будь ласка, ім'я та телефон." : "Оберіть вільну дату в календарі.", "err");
  }
  if (f.website.value) return;
  const btn = e.target.querySelector("button[type=submit]");
  btn.disabled = true; msg("Надсилаємо…");
  const p = pack(), name = f.name.value.trim();
  try {
    const r = await fetch(BOOK_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
      date: state.date, pack: p.name, hours: p.time, price: p.price, kind: fKind.value,
      name, phone: f.phone.value.trim(), comment: f.comment.value.trim(), website: f.website.value }) });
    if (!r.ok) throw new Error(r.status);
    msg(`Дякую, ${name}! Заявку на ${human(state.date)} отримано. Я зателефоную вам сьогодні або завтра, щоб усе узгодити.`, "ok");
    f.name.value = f.phone.value = f.comment.value = ""; state.date = null; renderCal(); updateSummary();
  } catch {
    msg("Не вдалося надіслати. Зателефонуйте, будь ласка: +380 00 000 00 00.", "err");
  } finally { btn.disabled = false; }
});
renderCal();

/* ---------- nav, reveal, sticky ---------- */
const nav = $("#nav");
const onScroll = () => nav.classList.toggle("is-solid", scrollY > innerHeight * 0.8);
addEventListener("scroll", onScroll, { passive: true }); onScroll();
$("#burger").addEventListener("click", () => $("#burger").setAttribute("aria-expanded", nav.classList.toggle("is-open")));
$$("#links a").forEach((a) => a.addEventListener("click", () => { nav.classList.remove("is-open"); $("#burger").setAttribute("aria-expanded", false); }));
const io = new IntersectionObserver((es) => es.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); } }),
  { threshold: 0.1, rootMargin: "0px 0px -40px 0px" });
$$(".reveal").forEach((el) => io.observe(el));
const sticky = $(".sticky-book");
const toggleSticky = () => sticky.classList.toggle("is-hidden", scrollY < innerHeight || $("#book").getBoundingClientRect().top < innerHeight);
addEventListener("scroll", toggleSticky, { passive: true }); toggleSticky();
$("#year").textContent = new Date().getFullYear();
