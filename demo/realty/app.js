/* «Ключ» — demo real-estate agency.
 * Catalog with filters/sort (state mirrored in the URL, so a filtered link can be shared), favourites in localStorage,
 * listing detail as hash route #obj-N (gallery, facts, map, similar, viewing form), owner form, mortgage calculator.
 * Both forms POST JSON {type: "viewing" | "sell", ...} to LEAD_URL (Cloudflare Pages Function -> agency Telegram).
 *
 * Listings: listings.json by default. The agency can keep them in a Google Sheet instead
 * (File → Share → Publish to web → CSV) and paste the link into SHEET_CSV_URL. Columns (first row, any order):
 *   id | угода (продаж/оренда) | тип (квартира/будинок/ділянка) | назва | район | адреса | ціна ($ для продажу, грн/міс для оренди)
 *   кімнат | площа (м²) | соток | поверх | поверхів | рік | опалення | ремонт | фото (через ; — файли з img/ або https-посилання)
 *   опис | агент (andrii/iryna/sofia) | додано (2026-11-12 або 12.11.2026) | lat | lon | топ (так) | показувати (ні — приховати)
 * See README.md. Empty SHEET_CSV_URL or a failed load -> listings.json is used. */
const LEAD_URL = "/api/realty-lead";
const SHEET_CSV_URL = "";
const USD_UAH = 41.5;           // for "≈ грн" hints
const FAV_KEY = "kluch-fav";

const TYPES = { flat: "Квартира", house: "Будинок", plot: "Ділянка" };
const AGENTS = [
  { id: "andrii", name: "Андрій Коваль", role: "Будинки та ділянки", img: "img/a-andrii.webp", years: 12, deals: 310,
    about: "Засновник агентства. Знає передмістя до кожної межі ділянки й допоможе з оформленням землі." },
  { id: "iryna", name: "Ірина Мельник", role: "Квартири, іпотека", img: "img/a-iryna.webp", years: 8, deals: 205,
    about: "Підбирає квартири для сімей, супроводжує угоди з іпотекою та єОселею від заявки до ключів." },
  { id: "sofia", name: "Софія Бондар", role: "Оренда", img: "img/a-sofia.webp", years: 4, deals: 130,
    about: "Знайде квартиру в оренду за 3–5 днів, перевірить власника й складе чесний договір." },
];
const REVIEWS = [
  ["Олена та Віктор", "купили 2-кімнатну", "Шукали квартиру пів року самі — з Іриною знайшли за три тижні. Вона ж допомогла з єОселею, банк погодив з першого разу."],
  ["Сергій", "продав будинок", "Андрій чесно сказав реальну ціну, а не ту, що я хотів почути. Продали за 5 тижнів, усі документи підготували вони."],
  ["Марина", "орендує студію", "Переїжджала з іншого міста й не могла приїхати на перегляди. Софія провела відеоперегляд, усе як на фото."],
  ["Тарас", "купив ділянку", "Перевірили кадастр, межі та цільове призначення — виявилось, що сусідня ділянка мала проблеми. Дякую, що вберегли."],
];
const FAQ = [
  ["Скільки коштують ваші послуги для покупця?", "Для покупця й орендаря підбір безкоштовний. Комісію сплачує власник об'єкта, і лише після успішної угоди."],
  ["Чи можна купити через єОселю чи іпотеку?", "Так. Позначаємо об'єкти, що підходять під програму, допомагаємо зібрати документи й супроводжуємо до підписання в банку."],
  ["Як ви перевіряєте об'єкти?", "Дивимось право власності, обтяження та арешти в реєстрах, перевіряємо прописаних осіб і технічний паспорт. Кожен об'єкт оглядаємо особисто."],
  ["Можна переглянути об'єкт онлайн?", "Так, агент проведе відеоперегляд у Viber чи Telegram у зручний для вас час."],
  ["Скільки часу займає продаж квартири?", "У середньому 4–8 тижнів за ринкової ціни. Після оцінки агент покаже, за скільки продались схожі об'єкти поруч."],
];

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const num = (n) => Math.round(n).toLocaleString("uk-UA").replace(/,/g, " ");
const plural = (n, one, few, many) => { const a = n % 10, b = n % 100; return a === 1 && b !== 11 ? one : a >= 2 && a <= 4 && (b < 12 || b > 14) ? few : many; };
const imgSrc = (p) => (/^https?:|\//.test(p) ? p : `img/${p}.webp`);
const agentById = (id) => AGENTS.find((a) => a.id === id) || AGENTS[0];
const HEART = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.8 4.5c2.1 0 3.6 1.1 5.2 3 1.6-1.9 3.1-3 5.2-3 3.8 0 5.9 3.9 4.4 7.3C19.5 16.4 12 21 12 21z"/></svg>';

let LISTINGS = [];
let NEWEST = 0;

function priceText(o) { return o.deal === "rent" ? `${num(o.price)} грн<small>/міс</small>` : `$${num(o.price)}`; }
function perUnit(o) {
  if (o.type === "plot" && o.land) return o.deal === "rent" ? "" : `$${num(o.price / o.land)} за сотку`;
  if (!o.area) return "";
  return o.deal === "rent" ? `${num(o.price / o.area)} грн/м²` : `$${num(o.price / o.area)} за м² · усього ≈ ${num(o.price * USD_UAH)} грн`;
}
function factsShort(o) {
  if (o.type === "plot") return [`${o.land} сот.`, o.district];
  return [`${o.rooms} кімн.`, `${o.area} м²`, o.type === "house" ? `${o.land} сот.` : `${o.floor}/${o.floors} пов.`];
}
const isNew = (o) => NEWEST - Date.parse(o.added) <= 4 * 864e5;

/* ---------- favourites ---------- */
let fav = new Set();
try { fav = new Set(JSON.parse(localStorage.getItem(FAV_KEY) || "[]").map(Number)); } catch { /* private mode */ }
function toggleFav(id) {
  fav.has(id) ? fav.delete(id) : fav.add(id);
  try { localStorage.setItem(FAV_KEY, JSON.stringify([...fav])); } catch { /* ignore */ }
  updateFavUI();
  if (state.fav) apply();
}
function updateFavUI() {
  const n = [...fav].filter((id) => LISTINGS.some((o) => o.id === id)).length;
  $("#favCount").textContent = n; $("#favCount").dataset.n = n;
  $("#favTop").classList.toggle("has", n > 0);
  $$("[data-fav]").forEach((b) => { const on = fav.has(+b.dataset.fav); b.classList.toggle("on", on); b.setAttribute("aria-pressed", on); b.setAttribute("aria-label", on ? "Прибрати з обраного" : "Додати в обране"); });
}
document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-fav]");
  if (b) { e.preventDefault(); e.stopPropagation(); toggleFav(+b.dataset.fav); }
});
$("#favTop").addEventListener("click", () => {
  const f = $("#fForm");
  f.fav.checked = true; readForm(); apply();
  $("#catalog").scrollIntoView({ behavior: "smooth" });
});

/* ---------- filters <-> URL ---------- */
const DEFAULT = { deal: "sale", type: [], rooms: [], pmin: "", pmax: "", amin: "", amax: "", district: "", fav: false, sort: "new" };
let state = { ...DEFAULT };

function fromURL() {
  const p = new URLSearchParams(location.search);
  const list = (k) => (p.get(k) || "").split(",").filter(Boolean);
  state = {
    deal: p.get("deal") === "rent" ? "rent" : "sale",
    type: list("type").filter((t) => TYPES[t]), rooms: list("rooms").filter((r) => /^[1-4]$/.test(r)),
    pmin: p.get("pmin") || "", pmax: p.get("pmax") || "", amin: p.get("amin") || "", amax: p.get("amax") || "",
    district: p.get("district") || "", fav: p.get("fav") === "1",
    sort: ["new", "price-asc", "price-desc", "area"].includes(p.get("sort")) ? p.get("sort") : "new",
  };
}
function toURL() {
  const p = new URLSearchParams();
  if (state.deal !== "sale") p.set("deal", state.deal);
  if (state.type.length) p.set("type", state.type.join(","));
  if (state.rooms.length) p.set("rooms", state.rooms.join(","));
  ["pmin", "pmax", "amin", "amax", "district"].forEach((k) => state[k] && p.set(k, state[k]));
  if (state.fav) p.set("fav", "1");
  if (state.sort !== "new") p.set("sort", state.sort);
  const qs = p.toString().replace(/%2C/g, ",");
  history.replaceState(history.state, "", location.pathname + (qs ? `?${qs}` : "") + location.hash);
}
function toForm() {
  const f = $("#fForm");
  f.querySelector(`[name=deal][value=${state.deal}]`).checked = true;
  $$("[name=type]", f).forEach((c) => { c.checked = state.type.includes(c.value); });
  $$("[name=rooms]", f).forEach((c) => { c.checked = state.rooms.includes(c.value); });
  ["pmin", "pmax", "amin", "amax"].forEach((k) => { f[k].value = state[k]; });
  f.district.value = state.district; f.fav.checked = state.fav;
  $("#sort").value = state.sort;
  priceLabels();
}
function readForm() {
  const f = $("#fForm");
  const prevDeal = state.deal;
  state.deal = f.querySelector("[name=deal]:checked").value;
  state.type = $$("[name=type]:checked", f).map((c) => c.value);
  state.rooms = $$("[name=rooms]:checked", f).map((c) => c.value);
  if (prevDeal !== state.deal) { f.pmin.value = ""; f.pmax.value = ""; } // $ vs грн — different scales
  ["pmin", "pmax", "amin", "amax"].forEach((k) => { state[k] = f[k].value.replace(/\D/g, ""); });
  state.district = f.district.value; state.fav = f.fav.checked; state.sort = $("#sort").value;
  priceLabels();
}
function priceLabels() {
  const cur = state.deal === "rent" ? "грн/міс" : "$";
  $("#priceLegend").textContent = `Ціна, ${cur}`;
}

function matches(o, s) {
  if (o.deal !== s.deal) return false;
  if (s.type.length && !s.type.includes(o.type)) return false;
  if (s.rooms.length && !s.rooms.some((r) => (r === "4" ? o.rooms >= 4 : o.rooms === +r))) return false;
  if (s.pmin && o.price < +s.pmin) return false;
  if (s.pmax && o.price > +s.pmax) return false;
  if (s.amin && !(o.area >= +s.amin)) return false;
  if (s.amax && !(o.area && o.area <= +s.amax)) return false;
  if (s.district && o.district !== s.district) return false;
  if (s.fav && !fav.has(o.id)) return false;
  return true;
}
const SORTS = {
  new: (a, b) => (b.top ? 1 : 0) - (a.top ? 1 : 0) || Date.parse(b.added) - Date.parse(a.added),
  "price-asc": (a, b) => a.price - b.price,
  "price-desc": (a, b) => b.price - a.price,
  area: (a, b) => (b.area || b.land * 100) - (a.area || a.land * 100),
};

function card(o) {
  const ph = o.photos.length;
  return `<article class="obj">
    <div class="obj__img">
      <img src="${esc(imgSrc(o.photos[0]))}" alt="${esc(o.title)}" loading="lazy">
      <div class="obj__badges">${o.top ? '<span class="badge badge--top">ТОП</span>' : ""}${isNew(o) ? '<span class="badge badge--new">Новий</span>' : ""}<span class="badge">${TYPES[o.type]}</span></div>
      <span class="obj__photos">📷 ${ph}</span>
    </div>
    <button type="button" class="heart" data-fav="${o.id}" aria-pressed="false" aria-label="Додати в обране">${HEART}</button>
    <div class="obj__body">
      <div class="obj__price">${priceText(o)}</div>
      <a class="obj__title" href="#obj-${o.id}">${esc(o.title)}</a>
      <span class="obj__addr">📍 ${esc(o.district)} · ${esc(o.address.replace(/\s*\(демо-адреса\)/, ""))}</span>
      <div class="obj__facts">${factsShort(o).map((x) => `<span>${esc(x)}</span>`).join("")}</div>
    </div>
  </article>`;
}

function apply() {
  const list = LISTINGS.filter((o) => matches(o, state)).sort(SORTS[state.sort]);
  $("#grid").innerHTML = list.map(card).join("");
  $("#empty").hidden = list.length > 0;
  const n = list.length;
  $("#count").textContent = state.fav && !n ? "В обраному поки порожньо" : `Знайдено ${n} ${plural(n, "об'єкт", "об'єкти", "об'єктів")}`;
  $("#applyF").textContent = `Показати ${n} ${plural(n, "об'єкт", "об'єкти", "об'єктів")}`;
  const active = state.type.length + state.rooms.length + ["pmin", "pmax", "amin", "amax", "district"].filter((k) => state[k]).length + (state.fav ? 1 : 0);
  $("#fCount").textContent = active ? `· ${active}` : "";
  updateFavUI(); toURL();
}
$("#fForm").addEventListener("input", () => { readForm(); apply(); });
$("#fForm").addEventListener("submit", (e) => e.preventDefault());
$("#sort").addEventListener("change", () => { readForm(); apply(); });
const resetFilters = () => { const deal = state.deal; state = { ...DEFAULT, deal }; toForm(); apply(); };
$("#resetF").addEventListener("click", resetFilters);
$("#emptyReset").addEventListener("click", resetFilters);
const setPanel = (open) => { $("#filters").classList.toggle("is-open", open); document.body.classList.toggle("no-scroll", open); };
$("#openF").addEventListener("click", () => setPanel(true));
$("#closeF").addEventListener("click", () => setPanel(false));
$("#applyF").addEventListener("click", () => { setPanel(false); $("#catalog").scrollIntoView({ behavior: "smooth" }); });

/* ---------- hero quick search ---------- */
const qs = $("#quickSearch");
function qsState() {
  const d = new FormData(qs);
  return { ...DEFAULT, deal: d.get("deal"), type: d.get("type") ? [d.get("type")] : [], rooms: d.get("rooms") ? [d.get("rooms")] : [], pmax: String(d.get("pmax") || "").replace(/\D/g, "") };
}
function qsCount() {
  const s = qsState();
  $("#qsPriceLbl").textContent = s.deal === "rent" ? "Ціна до, грн/міс" : "Ціна до, $";
  qs.pmax.step = s.deal === "rent" ? 500 : 1000;
  const n = LISTINGS.filter((o) => matches(o, s)).length;
  $("#qsBtn").textContent = LISTINGS.length ? `Показати ${n}` : "Показати";
}
qs.addEventListener("change", (e) => { if (e.target.name === "deal") qs.pmax.value = ""; qsCount(); });
qs.addEventListener("input", qsCount);
qs.addEventListener("submit", (e) => {
  e.preventDefault();
  state = qsState(); toForm(); apply();
  $("#catalog").scrollIntoView({ behavior: "smooth" });
});

/* ---------- detail (hash route #obj-N) ---------- */
const modal = $("#modal");
let lastFocus = null;
function detail(o) {
  const a = agentById(o.agent);
  const facts = o.type === "plot"
    ? [["Площа ділянки", `${o.land} соток`], ["Район", o.district], ["Тип угоди", o.deal === "rent" ? "Оренда" : "Продаж"]]
    : [["Кімнат", o.rooms], ["Площа", `${o.area} м²`], [o.type === "house" ? "Поверхів" : "Поверх", o.type === "house" ? o.floors : `${o.floor} з ${o.floors}`],
       ["Рік побудови", o.year || "—"], ["Опалення", o.heating], ["Ремонт", o.repair]].concat(o.type === "house" ? [["Ділянка", `${o.land} соток`]] : []);
  const d = 0.004;
  const map = `https://www.openstreetmap.org/export/embed.html?bbox=${o.lon - d * 1.6},${o.lat - d},${o.lon + d * 1.6},${o.lat + d}&layer=mapnik&marker=${o.lat},${o.lon}`;
  const sim = LISTINGS.filter((x) => x.id !== o.id && x.deal === o.deal && x.type === o.type)
    .sort((x, y) => Math.abs(x.price - o.price) - Math.abs(y.price - o.price)).slice(0, 3);
  const today = new Date(); const iso = (t) => new Date(t - t.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
  return `
  <div class="gal" id="gal">
    <div class="gal__track" id="galTrack" tabindex="0" aria-label="Фото об'єкта, гортайте">${o.photos.map((p, i) => `<img src="${esc(imgSrc(p))}" alt="${esc(o.title)} — фото ${i + 1}" ${i ? 'loading="lazy"' : ""}>`).join("")}</div>
    ${o.photos.length > 1 ? `<button type="button" class="gal__nav gal__nav--prev" data-gal="-1" aria-label="Попереднє фото">‹</button><button type="button" class="gal__nav gal__nav--next" data-gal="1" aria-label="Наступне фото">›</button>
    <div class="gal__dots">${o.photos.map((_, i) => `<i${i ? "" : ' class="on"'}></i>`).join("")}</div>` : ""}
    <span class="gal__cnt" id="galCnt">1 / ${o.photos.length}</span>
  </div>
  <div class="det">
    <div>
      <div class="det__top">
        <div><p class="eyebrow">${TYPES[o.type]} · ${o.deal === "rent" ? "довгострокова оренда" : "продаж"} · ID ${o.id}</p>
          <h2 id="mTitle">${esc(o.title)}</h2>
          <p class="det__addr">📍 ${esc(o.address)}, ${esc(o.district)}</p></div>
        <button type="button" class="heart" data-fav="${o.id}" aria-pressed="false" aria-label="Додати в обране">${HEART}</button>
      </div>
      <div class="det__price">${priceText(o)}</div>
      <p class="det__ppm">${esc(perUnit(o))}</p>
      <dl class="facts">${facts.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl>
      <h3>Опис</h3>
      <p>${esc(o.desc)}</p>
      <h3>На карті</h3>
      <iframe class="map" src="${map}" title="Карта: ${esc(o.address)}" loading="lazy" referrerpolicy="no-referrer"></iframe>
      <p class="map-note">Розташування на карті приблизне. Точну адресу агент повідомить перед переглядом.</p>
    </div>
    <div class="det__side">
      <div class="card mini-agent">
        <img src="${a.img}" alt="${esc(a.name)}">
        <div><b>${esc(a.name)}</b><small>${esc(a.role)}</small><br><a href="tel:+380000000000">+380 00 000 00 00</a></div>
      </div>
      <form class="card view-form form" id="viewForm" novalidate>
        <h3>Записатися на перегляд</h3>
        <label class="fld"><span>Ваше ім'я</span><input name="name" maxlength="60" autocomplete="name" required></label>
        <label class="fld"><span>Телефон</span><input name="phone" type="tel" maxlength="20" autocomplete="tel" placeholder="+380" required></label>
        <div class="row2">
          <label class="fld"><span>Бажана дата</span><input name="date" type="date" min="${iso(today)}" value="${iso(new Date(today.getTime() + 864e5))}"></label>
          <label class="fld"><span>Час</span><select name="time"><option>Зранку</option><option selected>Вдень</option><option>Ввечері</option><option>Відеоперегляд</option></select></label>
        </div>
        <label class="fld"><span>Коментар</span><textarea name="comment" maxlength="400" rows="2" placeholder="Наприклад: цікавить торг, іпотека"></textarea></label>
        <input class="hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
        <button class="btn btn--accent btn--wide" type="submit">Записатися на перегляд</button>
        <p class="form__msg" role="status"></p>
      </form>
      ${o.deal === "sale" && o.type !== "plot" ? `<a href="#calc" class="calc-link" data-calc="${o.price}">🧮 Розрахувати іпотеку для цього об'єкта →</a>` : ""}
    </div>
  </div>
  ${sim.length ? `<div class="similar"><h3>Схожі об'єкти</h3><div class="grid">${sim.map(card).join("")}</div></div>` : ""}`;
}

function openDetail(id) {
  const o = LISTINGS.find((x) => x.id === id);
  if (!o) { closeDetail(true); return; }
  if (modal.hidden) lastFocus = document.activeElement;
  $("#mBody").innerHTML = detail(o);
  modal.hidden = false; document.body.classList.add("no-scroll");
  $(".modal__box").scrollTop = 0;
  document.title = `${o.title} — «Ключ»`;
  updateFavUI(); initGallery(); bindForm($("#viewForm"), "viewing", () => ({ object_id: o.id, object: `${o.title} (${o.address})`, price: o.deal === "rent" ? `${o.price} грн/міс` : `$${o.price}` }));
  $(".modal__x").focus({ preventScroll: true });
}
const BASE_TITLE = document.title;
function closeDetail(silent) {
  if (modal.hidden) return;
  modal.hidden = true; document.body.classList.remove("no-scroll"); $("#mBody").innerHTML = "";
  document.title = BASE_TITLE;
  if (!silent && /^#obj-/.test(location.hash)) history.replaceState(null, "", location.pathname + location.search + "#catalog");
  if (lastFocus && document.contains(lastFocus)) lastFocus.focus({ preventScroll: true });
}
function route() {
  const m = location.hash.match(/^#obj-(\d+)$/);
  if (m) openDetail(+m[1]); else closeDetail(true);
}
addEventListener("hashchange", route);
modal.addEventListener("click", (e) => {
  if (e.target.closest("[data-close]")) { e.preventDefault(); closeDetail(); }
  const c = e.target.closest("[data-calc]");
  if (c) { e.preventDefault(); setCalcPrice(+c.dataset.calc); closeDetail(); $("#calc").scrollIntoView({ behavior: "smooth" }); }
});
addEventListener("keydown", (e) => {
  if (modal.hidden) return;
  if (e.key === "Escape") closeDetail();
  if ((e.key === "ArrowRight" || e.key === "ArrowLeft") && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) galGo(e.key === "ArrowRight" ? 1 : -1);
});

function galGo(dir) {
  const t = $("#galTrack"); if (!t) return;
  const i = Math.round(t.scrollLeft / t.clientWidth), n = t.children.length;
  t.scrollTo({ left: ((i + dir + n) % n) * t.clientWidth, behavior: "smooth" });
}
function initGallery() {
  const t = $("#galTrack"), cnt = $("#galCnt"), dots = $$(".gal__dots i");
  t.addEventListener("scroll", () => {
    const i = Math.round(t.scrollLeft / t.clientWidth);
    cnt.textContent = `${i + 1} / ${t.children.length}`;
    dots.forEach((d, k) => d.classList.toggle("on", k === i));
  }, { passive: true });
  $$("[data-gal]").forEach((b) => b.addEventListener("click", () => galGo(+b.dataset.gal)));
}

/* ---------- forms -> LEAD_URL ---------- */
function bindForm(form, type, extra = () => ({})) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const msg = (t, cls) => { const m = form.querySelector(".form__msg"); m.textContent = t; m.className = `form__msg ${cls || ""}`; };
    const f = form.elements;
    const bad = [];
    if (f.name.value.trim().length < 2) bad.push(f.name);
    if (f.phone.value.replace(/\D/g, "").length < 9) bad.push(f.phone);
    if (f.address && f.address.value.trim().length < 3) bad.push(f.address);
    $$("input", form).forEach((i) => i.classList.toggle("bad", bad.includes(i)));
    if (bad.length) { msg("Перевірте підсвічені поля: ім'я, телефон" + (f.address ? ", адреса" : "") + ".", "err"); bad[0].focus(); return; }
    const data = Object.fromEntries(new FormData(form));
    const btn = form.querySelector("[type=submit]"); btn.disabled = true; msg("Надсилаємо…");
    try {
      const r = await fetch(LEAD_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type, ...data, ...extra() }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.ok) throw new Error(j.error || r.status);
      msg(type === "sell" ? "✅ Дякуємо! Агент зателефонує сьогодні й домовиться про безкоштовну оцінку." : "✅ Заявку прийнято! Агент зателефонує, щоб підтвердити час перегляду.", "ok");
      form.reset();
    } catch {
      msg("Не вдалося надіслати. Зателефонуйте нам, будь ласка: +380 00 000 00 00.", "err");
    } finally { btn.disabled = false; }
  });
  form.addEventListener("input", (e) => e.target.classList.remove("bad"));
}
bindForm($("#sellForm"), "sell");

/* ---------- mortgage calculator ---------- */
const cf = $("#calcForm");
const fill = (r) => r.style.setProperty("--p", `${((r.value - r.min) / (r.max - r.min)) * 100}%`);
function calc() {
  const P = +cf.price.value, down = +cf.down.value, years = +cf.term.value, rate = +cf.rate.value;
  const loan = P * (1 - down / 100), n = years * 12, i = rate / 1200;
  const m = loan === 0 ? 0 : i === 0 ? loan / n : (loan * i) / (1 - (1 + i) ** -n);
  $("#oPrice").textContent = `$${num(P)}`;
  $("#oDown").textContent = `${down}% · $${num(P * down / 100)}`;
  $("#oTerm").textContent = `${years} ${plural(years, "рік", "роки", "років")}`;
  $("#oRate").textContent = rate ? `${rate}% річних` : "0% (розстрочка)";
  $("#rMonthly").textContent = `$${num(m)}`;
  $("#rUah").textContent = `≈ ${num(m * USD_UAH)} грн на місяць`;
  $("#rLoan").textContent = `$${num(loan)}`;
  $("#rOver").textContent = `$${num(m * n - loan)}`;
  $("#rTotal").textContent = `$${num(m * n + P * down / 100)}`;
  $$("input[type=range]", cf).forEach(fill);
  $$("[data-rate]").forEach((b) => b.setAttribute("aria-pressed", +b.dataset.rate === rate));
}
function setCalcPrice(p) { cf.price.value = Math.min(+cf.price.max, Math.max(+cf.price.min, Math.round(p / 500) * 500)); calc(); }
cf.addEventListener("input", calc);
$$("[data-rate]").forEach((b) => b.addEventListener("click", () => { cf.rate.value = b.dataset.rate; calc(); }));
calc();

/* ---------- static sections ---------- */
$("#agentsGrid").innerHTML = AGENTS.map((a) => `
  <article class="agent">
    <img src="${a.img}" alt="${esc(a.name)}" loading="lazy">
    <div><h3>${esc(a.name)}</h3><p class="role">${esc(a.role)}</p><p>${esc(a.about)}</p>
      <div class="meta"><span><b>${a.years}</b> ${plural(a.years, "рік", "роки", "років")} досвіду</span><span><b>${a.deals}</b> угод</span></div>
      <a class="btn btn--ghost btn--small" href="tel:+380000000000">Зателефонувати</a></div>
  </article>`).join("");
$("#reviewsGrid").innerHTML = REVIEWS.map(([n, w, t]) => `
  <figure class="card review"><span class="stars" aria-label="5 з 5">★★★★★</span><p>${esc(t)}</p><b>${esc(n)}</b><small>${esc(w)}</small></figure>`).join("");
$("#faqList").innerHTML = FAQ.map(([q, a]) => `<details class="qa"><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join("");
$("#year").textContent = new Date().getFullYear();

/* ---------- nav ---------- */
const nav = $("#nav");
$("#burger").addEventListener("click", () => $("#burger").setAttribute("aria-expanded", nav.classList.toggle("is-open")));
$$("#links a").forEach((a) => a.addEventListener("click", () => { nav.classList.remove("is-open"); $("#burger").setAttribute("aria-expanded", "false"); }));

/* ---------- data ---------- */
function setData(list) {
  LISTINGS = list;
  NEWEST = Math.max(...list.map((o) => Date.parse(o.added) || 0));
  const districts = [...new Set(list.map((o) => o.district))].sort((a, b) => a.localeCompare(b, "uk"));
  $("#districtSel").innerHTML = '<option value="">Усі райони</option>' + districts.map((d) => `<option>${esc(d)}</option>`).join("");
  toForm(); apply(); qsCount(); route();
}

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
function fromSheet(text) {
  const [head, ...rows] = parseCSV(text);
  const H = head.map((h) => h.trim().toLowerCase());
  const n = (v) => { const x = parseFloat(String(v).replace(",", ".").replace(/[^\d.]/g, "")); return Number.isFinite(x) ? x : 0; };
  const date = (v) => { const m = String(v).match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/); return m ? `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}` : v || "2026-01-01"; };
  const TYPE = { "квартира": "flat", "будинок": "house", "ділянка": "plot" };
  return rows.map((r, i) => {
    const g = (k) => (r[H.indexOf(k)] ?? "").trim();
    return {
      id: n(g("id")) || i + 1, deal: /оренд|rent/i.test(g("угода")) ? "rent" : "sale", type: TYPE[g("тип").toLowerCase()] || "flat",
      title: g("назва"), district: g("район") || "Центр", address: g("адреса") || "", price: n(g("ціна")),
      rooms: n(g("кімнат")), area: n(g("площа")), land: n(g("соток")), floor: n(g("поверх")), floors: n(g("поверхів")),
      year: n(g("рік")) || null, heating: g("опалення") || "—", repair: g("ремонт") || "—",
      photos: g("фото").split(";").map((x) => x.trim().replace(/\.webp$/, "")).filter(Boolean),
      desc: g("опис"), agent: g("агент") || "iryna", added: date(g("додано")), lat: n(g("lat")) || 49.5585, lon: n(g("lon")) || 27.955,
      top: /^(так|yes|1)$/i.test(g("топ")), hidden: /^(ні|no|0)$/i.test(g("показувати")),
    };
  }).filter((o) => o.title && o.price && !o.hidden).map((o) => ({ ...o, photos: o.photos.length ? o.photos : ["hero"] }));
}

fromURL();
(async () => {
  if (SHEET_CSV_URL) {
    try {
      const r = await fetch(SHEET_CSV_URL, { cache: "no-store" });
      if (!r.ok) throw new Error(r.status);
      const list = fromSheet(await r.text());
      if (list.length) { setData(list); return; }
    } catch (e) { console.warn("sheet not loaded, using listings.json", e); }
  }
  try {
    const r = await fetch("listings.json");
    setData(await r.json());
  } catch (e) {
    $("#count").textContent = "Не вдалося завантажити об'єкти. Оновіть сторінку.";
    console.error(e);
  }
})();
