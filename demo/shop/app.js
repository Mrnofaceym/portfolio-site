/* «Віск і Льон» — demo mini online shop.
 * Catalog (category / search / sort) -> product modal (gallery + variants) -> cart drawer (localStorage)
 * -> checkout (Нова Пошта / Укрпошта / самовивіз, накладений платіж / передоплата — text only, no card fields)
 * -> POST ORDER_URL (Cloudflare Pages Function: recomputes prices server-side and sends the order to Telegram).
 *
 * Goods live in products.json. Optionally a Google Sheet (File → Share → Publish to web → CSV), columns:
 *   id | категорія | назва | ціна | опис | фото | варіанти | мітка | наявність | популярність | додано
 *   фото:     c-amber, gift-box            (files in img/, without .webp; or full https:// links)
 *   варіанти: Аромат: Ваніль, Сандал / Об'єм: 180 мл, 300 мл +140   ("+140" = surcharge for this value)
 *   мітка:    нове | хіт      наявність: так | ні      додано: 2026-11-05
 * Set the same CSV link as SHEET_CSV_URL in Pages env so the server checks prices against the same table. */
const ORDER_URL = "/api/shop-order";
const SHEET_CSV_URL = "";
const CART_KEY = "vil-cart-v1";

let DATA = null;          // products.json (settings + products)
let P = [];               // products
const state = { cat: "all", q: "", sort: "pop", promo: "", delivery: "np" };

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const money = (n) => `${Math.round(n).toLocaleString("uk-UA").replace(/ /g, " ")} грн`;
const imgSrc = (n) => (/^https?:/.test(n) ? n : `img/${n}.webp`);
const byId = (id) => P.find((p) => p.id === id);
const priceOf = (p, sel = []) => p.price + (p.options || []).reduce((s, o, i) => s + (o.values[sel[i] || 0]?.add || 0), 0);
const selText = (p, sel = []) => (p.options || []).map((o, i) => o.values[sel[i] || 0]?.v).filter(Boolean).join(" · ");
const fromPrice = (p) => p.price;
const hasRange = (p) => (p.options || []).some((o) => o.values.some((v) => v.add));
const plural = (n, a, b, c) => (n % 10 === 1 && n % 100 !== 11 ? a : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? b : c);

/* ---------- catalog ---------- */
function renderChips() {
  const cats = { all: "Усе", ...DATA.categories };
  $("#chips").innerHTML = Object.entries(cats).map(([k, v]) => {
    const n = k === "all" ? P.length : P.filter((p) => p.cat === k).length;
    return `<button type="button" role="tab" class="chip${state.cat === k ? " is-on" : ""}" data-cat="${k}" aria-selected="${state.cat === k}">${esc(v)} <small>${n}</small></button>`;
  }).join("");
}
function visible() {
  const q = state.q.trim().toLowerCase();
  let list = P.filter((p) => (state.cat === "all" || p.cat === state.cat) &&
    (!q || `${p.name} ${p.desc} ${(p.options || []).map((o) => o.values.map((v) => v.v).join(" ")).join(" ")}`.toLowerCase().includes(q)));
  const sorters = {
    pop: (a, b) => b.pop - a.pop,
    new: (a, b) => (b.added || "").localeCompare(a.added || ""),
    cheap: (a, b) => a.price - b.price,
    expensive: (a, b) => b.price - a.price,
  };
  list = list.sort(sorters[state.sort]);
  return list.sort((a, b) => Number(b.stock) - Number(a.stock));      // out-of-stock goes last
}
function card(p) {
  const badge = p.badge === "new" ? `<span class="badge badge--new">нове</span>` : p.badge === "hit" ? `<span class="badge badge--hit">хіт</span>` : "";
  return `<article class="card${p.stock ? "" : " is-out"}">
    <button type="button" class="card__img" data-open="${esc(p.id)}" aria-label="${esc(p.name)} — детальніше">
      <img src="${esc(imgSrc(p.images[0]))}" alt="${esc(p.name)}" loading="lazy" onerror="this.classList.add('is-broken')">
      ${badge}${p.stock ? "" : `<span class="badge badge--out">немає в наявності</span>`}
    </button>
    <div class="card__body">
      <h3><button type="button" data-open="${esc(p.id)}">${esc(p.name)}</button></h3>
      <p class="card__meta">${esc((p.options || []).length ? `На вибір: ${p.options.map((o) => o.name.toLowerCase()).join(", ")}` : "Готовий набір")}</p>
      <div class="card__row">
        <span class="card__price">${hasRange(p) ? "від " : ""}${money(fromPrice(p))}</span>
        ${p.stock
          ? (p.options || []).length
            ? `<button type="button" class="add" data-open="${esc(p.id)}" aria-label="Обрати варіант">Обрати</button>`
            : `<button type="button" class="add" data-quick="${esc(p.id)}" aria-label="Додати в кошик">+ В кошик</button>`
          : `<button type="button" class="add add--off" data-open="${esc(p.id)}">Повідомити</button>`}
      </div>
    </div>
  </article>`;
}
function renderGrid() {
  const list = visible();
  $("#grid").innerHTML = list.length ? list.map(card).join("")
    : `<div class="empty">Нічого не знайшли за запитом «${esc(state.q)}». <button type="button" class="link" id="resetSearch">Скинути пошук</button></div>`;
  $("#found").textContent = state.q ? `Знайдено: ${list.length} ${plural(list.length, "товар", "товари", "товарів")}` : "";
}
$("#chips").addEventListener("click", (e) => {
  const b = e.target.closest("[data-cat]"); if (!b) return;
  state.cat = b.dataset.cat; renderChips(); renderGrid();
});
$$("[data-cat].btn").forEach((a) => a.addEventListener("click", () => { state.cat = a.dataset.cat; renderChips(); renderGrid(); }));
let qTimer;
$("#search").addEventListener("input", (e) => { clearTimeout(qTimer); qTimer = setTimeout(() => { state.q = e.target.value; renderGrid(); }, 150); });
$("#sort").addEventListener("change", (e) => { state.sort = e.target.value; renderGrid(); });
$("#grid").addEventListener("click", (e) => {
  if (e.target.id === "resetSearch") { state.q = ""; $("#search").value = ""; renderGrid(); return; }
  const o = e.target.closest("[data-open]"); if (o) return openProduct(o.dataset.open);
  const q = e.target.closest("[data-quick]"); if (q) addToCart(q.dataset.quick, [], 1);
});

/* ---------- product modal ---------- */
let cur = null;           // { p, sel, img, qty }
function openProduct(id) {
  const p = byId(id); if (!p) return;
  cur = { p, sel: (p.options || []).map(() => 0), img: 0, qty: 1 };
  $("#mCat").textContent = DATA.categories[p.cat] || "";
  $("#mTitle").textContent = p.name;
  $("#mDesc").textContent = p.desc || "";
  $("#mThumbs").innerHTML = p.images.length > 1 ? p.images.map((n, i) =>
    `<button type="button" data-img="${i}" aria-label="Фото ${i + 1}"><img src="${esc(imgSrc(n))}" alt="" onerror="this.classList.add('is-broken')"></button>`).join("") : "";
  $("#mOpts").innerHTML = (p.options || []).map((o, i) => `<label class="opt"><span>${esc(o.name)}</span>
    <select data-opt="${i}">${o.values.map((v, j) => `<option value="${j}">${esc(v.v)}${v.add ? ` (+${v.add} грн)` : ""}</option>`).join("")}</select></label>`).join("");
  updateModal();
  openLayer($("#modal"));
}
function updateModal() {
  const { p, sel, img, qty } = cur;
  const m = $("#mImg"); m.classList.remove("is-broken"); m.src = imgSrc(p.images[img]); m.alt = p.name;
  m.onerror = () => m.classList.add("is-broken");
  $$("#mThumbs button").forEach((b, i) => b.classList.toggle("is-on", i === img));
  $("#mPrice").textContent = money(priceOf(p, sel) * qty);
  $("#mBuy").innerHTML = p.stock
    ? `<div class="qty"><button type="button" data-mq="-1" aria-label="Менше">−</button><span>${qty}</span><button type="button" data-mq="1" aria-label="Більше">+</button></div>
       <button type="button" class="btn btn--grow" id="mAdd">Додати в кошик</button>`
    : `<p class="out-note">Цього товару зараз немає — нова партія за 1–2 тижні. Залиште номер у Telegram, і ми напишемо першими.</p>`;
}
$("#mOpts").addEventListener("change", (e) => { const s = e.target.closest("[data-opt]"); if (!s) return; cur.sel[+s.dataset.opt] = +s.value; updateModal(); });
$("#mThumbs").addEventListener("click", (e) => { const b = e.target.closest("[data-img]"); if (!b) return; cur.img = +b.dataset.img; updateModal(); });
$("#mBuy").addEventListener("click", (e) => {
  const q = e.target.closest("[data-mq]"); if (q) { cur.qty = Math.min(20, Math.max(1, cur.qty + +q.dataset.mq)); return updateModal(); }
  if (e.target.id === "mAdd") { addToCart(cur.p.id, cur.sel, cur.qty); closeLayer($("#modal")); }
});
$("#modal").addEventListener("click", (e) => { if (e.target.closest("[data-close]")) closeLayer($("#modal")); });

/* ---------- layers (modal / drawer) ---------- */
let lastFocus = null;
function openLayer(el) {
  lastFocus = document.activeElement;
  el.hidden = false; document.body.classList.add("no-scroll");
  requestAnimationFrame(() => el.classList.add("is-open"));
  setTimeout(() => $(".x", el)?.focus({ preventScroll: true }), 50);
}
function closeLayer(el) {
  el.classList.remove("is-open");
  setTimeout(() => { el.hidden = true; if (!$(".modal.is-open, .drawer.is-open")) document.body.classList.remove("no-scroll"); }, 250);
  lastFocus?.focus?.({ preventScroll: true });
}
addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  if (!$("#modal").hidden) closeLayer($("#modal")); else if (!$("#drawer").hidden) closeLayer($("#drawer"));
});

/* ---------- cart ---------- */
let cart = [];
try { cart = JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch { cart = []; }
const save = () => { try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch {} };
const keyOf = (id, sel) => `${id}|${sel.join(",")}`;
function liveCart() { return cart.filter((l) => byId(l.id)?.stock); }
function addToCart(id, sel, qty) {
  const p = byId(id); if (!p || !p.stock) return;
  sel = (p.options || []).map((_, i) => sel[i] || 0);
  const k = keyOf(id, sel), line = cart.find((l) => l.key === k);
  if (line) line.qty = Math.min(20, line.qty + qty); else cart.push({ key: k, id, sel, qty });
  save(); renderCart(); bump();
  toast(`«${p.name}» у кошику`, true);
}
function calc() {
  const lines = liveCart();
  const sub = lines.reduce((s, l) => s + priceOf(byId(l.id), l.sel) * l.qty, 0);
  const pct = DATA.promo[state.promo] || 0;
  const disc = Math.round(sub * pct / 100);
  const d = DATA.delivery[state.delivery];
  const ship = state.delivery === "pickup" || sub >= DATA.freeShippingFrom ? 0 : d.price;
  return { lines, sub, pct, disc, ship, total: sub - disc + ship, count: lines.reduce((s, l) => s + l.qty, 0) };
}
function totalsHTML(c, withShip) {
  return `<dt>Товари (${c.count})</dt><dd>${money(c.sub)}</dd>
    ${c.disc ? `<dt>Знижка ${esc(state.promo)} −${c.pct}%</dt><dd class="minus">−${money(c.disc)}</dd>` : ""}
    ${withShip ? `<dt>Доставка: ${esc(DATA.delivery[state.delivery].name)}</dt><dd>${c.ship ? money(c.ship) : "безкоштовно"}</dd>` : ""}
    <dt class="sum">${withShip ? "До сплати" : "Разом"}</dt><dd class="sum">${money(withShip ? c.total : c.sub - c.disc)}</dd>`;
}
function renderCart() {
  const c = calc();
  const n = $("#cartCount"); n.textContent = c.count; n.hidden = !c.count;
  const left = DATA.freeShippingFrom - c.sub;
  $("#ship").innerHTML = c.count ? `<p>${left > 0 ? `До безкоштовної доставки залишилось <b>${money(left)}</b>` : "🎉 У вас <b>безкоштовна доставка</b>"}</p>
    <div class="bar"><span style="width:${Math.min(100, c.sub / DATA.freeShippingFrom * 100)}%"></span></div>` : "";
  $("#lines").innerHTML = c.lines.length ? c.lines.map((l) => {
    const p = byId(l.id);
    return `<li class="line" data-key="${esc(l.key)}">
      <img src="${esc(imgSrc(p.images[0]))}" alt="" onerror="this.classList.add('is-broken')">
      <div class="line__info"><b>${esc(p.name)}</b><small>${esc(selText(p, l.sel))}</small>
        <div class="line__row"><div class="qty qty--s"><button type="button" data-q="-1" aria-label="Менше">−</button><span>${l.qty}</span><button type="button" data-q="1" aria-label="Більше">+</button></div>
        <span class="line__sum">${money(priceOf(p, l.sel) * l.qty)}</span></div>
      </div>
      <button type="button" class="rm" data-rm aria-label="Видалити">×</button>
    </li>`;
  }).join("") : `<li class="cart-empty"><span>🕯️</span><b>Кошик порожній</b><p>Загляньте в каталог — там багато затишного.</p><button type="button" class="btn btn--ghost btn--small" data-dclose data-go="catalog">До каталогу</button></li>`;
  $("#cartFoot").hidden = !c.lines.length;
  $("#totals").innerHTML = totalsHTML(c, false);
  $("#totals2").innerHTML = totalsHTML(c, true);
}
$("#lines").addEventListener("click", (e) => {
  const li = e.target.closest("[data-key]"); if (!li) return;
  const line = cart.find((l) => l.key === li.dataset.key); if (!line) return;
  const q = e.target.closest("[data-q]");
  if (q) { line.qty += +q.dataset.q; if (line.qty < 1) cart = cart.filter((l) => l !== line); else line.qty = Math.min(20, line.qty); }
  if (e.target.closest("[data-rm]")) cart = cart.filter((l) => l !== line);
  save(); renderCart();
});
$("#promoForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const code = $("#promo").value.trim().toUpperCase();
  const m = $("#promoMsg");
  if (!code) { state.promo = ""; m.textContent = ""; }
  else if (DATA.promo[code]) { state.promo = code; m.textContent = `✓ Промокод ${code} застосовано: −${DATA.promo[code]}%`; m.className = "promo__msg ok"; }
  else { state.promo = ""; m.textContent = "Такого промокоду немає. Спробуйте DEMO10"; m.className = "promo__msg err"; }
  renderCart();
});
const bump = () => { const b = $("#cartBtn"); b.classList.remove("bump"); void b.offsetWidth; b.classList.add("bump"); };

/* ---------- drawer views ---------- */
function showView(v) {
  ["vCart", "vCheckout", "vDone"].forEach((id) => { $("#" + id).hidden = id !== v; });
  $("#dTitle").textContent = { vCart: "Кошик", vCheckout: "Оформлення", vDone: "Готово" }[v];
  $("#dBack").hidden = v !== "vCheckout";
  $(".drawer__panel").scrollTop = 0;
}
$("#cartBtn").addEventListener("click", () => { showView("vCart"); openLayer($("#drawer")); });
$("#toCheckout").addEventListener("click", () => { showView("vCheckout"); renderCart(); });
$("#dBack").addEventListener("click", () => showView("vCart"));
$("#drawer").addEventListener("click", (e) => {
  const c = e.target.closest("[data-dclose]"); if (!c) return;
  closeLayer($("#drawer"));
  if (c.dataset.go) document.getElementById(c.dataset.go).scrollIntoView({ behavior: "smooth" });
});

/* ---------- checkout ---------- */
function renderDelivery() {
  $("#deliveryOpts").innerHTML = Object.entries(DATA.delivery).map(([k, d]) => `<label class="radio"><input type="radio" name="delivery" value="${k}"${state.delivery === k ? " checked" : ""}>
    <span><b>${esc(d.name)}</b><small>${k === "pickup" ? "Хмільник, вул. Затишна, 7 (демо-адреса) — безкоштовно" : `${money(d.price)}, безкоштовно від ${money(DATA.freeShippingFrom)}`}</small></span></label>`).join("");
}
function syncDelivery() {
  const np = $("#npFields"), pickup = state.delivery === "pickup";
  np.hidden = pickup;
  $("#branchLabel").textContent = state.delivery === "ukr" ? "Індекс відділення" : "Відділення / поштомат №";
  $("[name=branch]").placeholder = state.delivery === "ukr" ? "Напр., 22000" : "Напр., 12";
  renderCart();
}
$("#deliveryOpts").addEventListener("change", (e) => { state.delivery = e.target.value; syncDelivery(); });

const msg = (t, cls = "") => { const m = $("#formMsg"); m.textContent = t; m.className = "form__msg " + cls; };
function invalid(el, on) { el.classList.toggle("is-bad", on); el.setAttribute("aria-invalid", on); return on; }
$("#vCheckout").addEventListener("input", (e) => e.target.classList?.remove("is-bad"));
$("#vCheckout").addEventListener("submit", async (e) => {
  e.preventDefault();
  const f = e.target, c = calc();
  if (!c.lines.length) return showView("vCart");
  let bad = false;
  bad = invalid(f.name, f.name.value.trim().length < 2) || bad;
  bad = invalid(f.phone, f.phone.value.replace(/\D/g, "").length < 10) || bad;
  if (state.delivery !== "pickup") {
    bad = invalid(f.city, f.city.value.trim().length < 2) || bad;
    bad = invalid(f.branch, !f.branch.value.trim()) || bad;
  }
  if (bad) { msg("Перевірте поля, виділені червоним.", "err"); $(".is-bad", f)?.focus(); return; }
  const btn = $("#placeBtn"); btn.disabled = true; msg("Надсилаємо замовлення…");
  const body = {
    items: c.lines.map((l) => ({ id: l.id, sel: l.sel, qty: l.qty })),
    promo: state.promo, delivery: state.delivery, payment: f.payment.value,
    name: f.name.value.trim(), phone: f.phone.value.trim(), city: f.city.value.trim(), branch: f.branch.value.trim(),
    comment: f.comment.value.trim(), website: f.website.value, clientTotal: c.total,
  };
  try {
    const r = await fetch(ORDER_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok || !d.ok) throw new Error(d.error || r.status);
    done(d, c, body);
  } catch {
    msg("Не вдалося надіслати замовлення. Спробуйте ще раз або зателефонуйте: +380 00 000 00 00.", "err");
  } finally { btn.disabled = false; }
});
function done(d, c, body) {
  $("#orderNo").textContent = d.order || "—";
  const total = d.total ?? c.total;
  $("#doneText").textContent = `${body.name.split(" ")[0]}, ми зателефонуємо на ${body.phone} протягом робочого дня, щоб підтвердити замовлення. ` +
    (body.payment === "card" ? `Після підтвердження надішлемо реквізити для оплати ${money(total)}.` : `Сума до сплати при отриманні: ${money(total)}.`) +
    (d.demo ? " (Це демо: замовлення нікуди не відправлено.)" : "");
  $("#doneList").innerHTML = c.lines.map((l) => { const p = byId(l.id); return `<li><span>${esc(p.name)} × ${l.qty}</span><b>${money(priceOf(p, l.sel) * l.qty)}</b></li>`; }).join("");
  cart = []; state.promo = ""; $("#promo").value = ""; $("#promoMsg").textContent = "";
  save(); renderCart(); $("#vCheckout").reset(); msg("");
  showView("vDone");
}

/* ---------- misc ---------- */
let tTimer;
function toast(t, withCart) {
  const el = $("#toast");
  el.innerHTML = `<span>${esc(t)}</span>${withCart ? `<button type="button" id="toastCart">Кошик →</button>` : ""}`;
  el.classList.add("is-on"); clearTimeout(tTimer); tTimer = setTimeout(() => el.classList.remove("is-on"), 3200);
}
$("#toast").addEventListener("click", (e) => { if (e.target.id === "toastCart") { $("#toast").classList.remove("is-on"); $("#cartBtn").click(); } });
const nav = $("#nav");
const onScroll = () => nav.classList.toggle("is-solid", scrollY > 30);
addEventListener("scroll", onScroll, { passive: true }); onScroll();
$("#burger").addEventListener("click", () => $("#burger").setAttribute("aria-expanded", nav.classList.toggle("is-open")));
$$("#links a").forEach((a) => a.addEventListener("click", () => nav.classList.remove("is-open")));
const io = new IntersectionObserver((es) => es.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); } }),
  { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
$$(".reveal").forEach((el) => io.observe(el));
$("#year").textContent = new Date().getFullYear();

/* ---------- data: products.json, optional Google Sheet ---------- */
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
function productsFromCSV(text, cats) {
  const [head, ...rows] = parseCSV(text);
  const col = (n) => head.findIndex((h) => h.trim().toLowerCase() === n);
  const C = { id: col("id"), cat: col("категорія"), name: col("назва"), price: col("ціна"), desc: col("опис"), images: col("фото"),
    opts: col("варіанти"), badge: col("мітка"), stock: col("наявність"), pop: col("популярність"), added: col("додано") };
  const get = (row, k) => (C[k] >= 0 ? (row[C[k]] || "").trim() : "");
  const catId = (v) => Object.keys(cats).find((k) => k === v || cats[k].toLowerCase() === v.toLowerCase()) || Object.keys(cats)[0];
  return rows.map((row, i) => ({
    id: get(row, "id") || `p${i + 1}`, cat: catId(get(row, "cat")), name: get(row, "name"), desc: get(row, "desc"),
    price: parseInt(get(row, "price").replace(/\D/g, ""), 10),
    images: get(row, "images").split(",").map((x) => x.trim()).filter(Boolean),
    options: get(row, "opts").split("/").map((g) => g.trim()).filter(Boolean).map((g) => {
      const [name, vals = ""] = g.split(":");
      return { name: name.trim(), values: vals.split(",").map((v) => v.trim()).filter(Boolean).map((v) => {
        const m = v.match(/^(.*?)\s*\+\s*(\d+)\s*(грн)?$/); return m ? { v: m[1], add: +m[2] } : { v };
      }) };
    }).filter((o) => o.values.length),
    badge: /нов|new/i.test(get(row, "badge")) ? "new" : /хіт|hit/i.test(get(row, "badge")) ? "hit" : "",
    stock: !/^(ні|no|0|немає)$/i.test(get(row, "stock")),
    pop: parseInt(get(row, "pop"), 10) || 0, added: get(row, "added"),
  })).filter((p) => p.name && p.price);
}
function boot() {
  P = DATA.products.map((p) => ({ ...p, images: p.images?.length ? p.images : ["hero"] }));
  cart = cart.filter((l) => byId(l.id));
  renderChips(); renderGrid(); renderDelivery(); syncDelivery(); renderCart();
}
(async () => {
  try {
    DATA = await (await fetch("products.json", { cache: "no-cache" })).json();
  } catch (e) {
    $("#grid").innerHTML = `<div class="empty">Не вдалося завантажити каталог. Оновіть сторінку.</div>`; return;
  }
  boot();
  if (!SHEET_CSV_URL) return;
  try {
    const r = await fetch(SHEET_CSV_URL, { cache: "no-store" });
    if (!r.ok) throw new Error(r.status);
    const list = productsFromCSV(await r.text(), DATA.categories);
    if (list.length) { DATA.products = list; boot(); }
  } catch (e) { console.warn("sheet not loaded, using products.json", e); }
})();
