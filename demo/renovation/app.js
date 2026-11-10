/* Майстер Дім — demo renovation company site.
 * Calculator: prices per m² (UAH, 2026) live in PRICE below — edit them in one place.
 * Lead form: POST LEAD_URL (Cloudflare Pages Function -> Telegram), calculation attached. */
const LEAD_URL = "/api/renovation-book";   // functions/api/renovation-book.js

/* ---------- pricing model ---------- */
const PRICE = {
  type: {                      // labour ₴/m², rough materials ₴/m², m² finished per week
    cosmetic: { rate: 3200, mat: 1300, prod: 15 },
    capital: { rate: 6500, mat: 2900, prod: 6 },
    design: { rate: 11000, mat: 4200, prod: 4.5 },
  },
  room: {                      // k: price multiplier (more work per m²), t: time multiplier
    flat: { k: 1, t: 1, area: 60 },
    kitchen: { k: 1.35, t: 1.6, area: 12 },
    bath: { k: 2.6, t: 3, area: 5 },
    house: { k: 1.1, t: 1.1, area: 120 },
  },
  demo: 450, elec: 950, plumb: 700,  // ₴/m² (elec & plumbing scale with room k)
  matDiscount: 0.1,
  proj: 900, projMin: 25000,
  minOrder: 15000,
};

/* ---------- i18n ---------- */
const T = {
  en: {
    demo_bar: "Demo project: the company, prices and contacts are fictional, made for a portfolio",
    nav_services: "Services", nav_calc: "Calculator", nav_works: "Projects", nav_prices: "Prices", nav_faq: "FAQ", nav_cta: "Free site visit",
    hero_eyebrow: "Apartment & house renovation · Kyiv region",
    hero_title: "Renovation without surprises: <span class=\"hl\">the price is fixed</span> in the contract",
    hero_sub: "From a cosmetic refresh to a turnkey designer renovation. One site manager, a weekly photo report and a 3-year warranty on all work.",
    hero_calc: "Estimate the cost", hero_works: "Our projects",
    fact_years_u: "years", fact_warranty: "warranty on work", fact_measure: "site visit & measuring", fact_fixed: "estimate never grows",
    chip_a_t: "Kitchen, 14 m²", chip_a_s: "handed over 3 days early", chip_b_s: "Full renovation from",
    srv_eyebrow: "Services", srv_title: "What we do", srv_p: "We take the whole job — from demolition to the final clean-up — or do individual works.",
    from: "from", pt: "point", pcs: "pc",
    srv1_t: "Cosmetic renovation", srv1_p: "Filling, painting, wallpaper, new flooring. A dust-free refresh in 2–4 weeks.",
    srv2_t: "Full renovation", srv2_p: "Wall levelling, screed, new wiring and plumbing, re-planning.",
    srv3_t: "Designer renovation", srv3_p: "Building a design project under the designer's supervision, with complex finishes.",
    srv4_t: "Turnkey bathroom", srv4_p: "Waterproofing, tiles and porcelain, wall-hung toilets, walk-in showers.",
    srv5_t: "Kitchen", srv5_p: "Water and power for appliances, backsplash, furniture installation.",
    srv6_t: "Electrics", srv6_p: "Rewiring, a new panel, RCDs, prep for a generator or inverter.",
    calc_eyebrow: "Calculator", calc_title: "How much will your renovation cost",
    calc_p: "A preliminary estimate at 2026 prices. We'll prepare the exact quote after a free site visit.",
    c_area: "Area", c_type: "Renovation type", c_room: "Space", c_opts: "Extras",
    t_cosmetic: "Cosmetic", t_capital: "Full", t_design: "Designer",
    r_flat: "Apartment / rooms", r_kitchen: "Kitchen", r_bath: "Bathroom / WC", r_house: "Private house",
    o_demo: "Demolition & waste removal", o_elec: "New electrics", o_plumb: "Plumbing", o_mat: "Rough materials from us",
    o_mat_s: "bought with a 10% discount", o_proj: "Design project", o_proj_s: "900 ₴/m², min. 25,000 ₴",
    res_label: "Estimated cost", res_time: "Duration", res_cta: "Get an exact quote",
    res_note: "Preliminary estimate: labour prices, excluding finishing materials (tiles, laminate, fixtures, furniture).",
    ba_eyebrow: "Before & after", ba_title: "The same room 9 weeks later",
    ba_p: "Full renovation of a 28 m² living room: plastering, screed, new wiring, underfloor heating and painting. Drag the slider to compare.",
    ba_l1: "area", ba_l2: "weeks", ba_l3: "extra charges over the quote", ba_before: "Before", ba_after: "After",
    st_eyebrow: "How we work", st_title: "6 steps from request to keys",
    st1_t: "Request & consultation", st1_p: "We discuss the task, budget and timing. We reply within 30 minutes.", st1_d: "Day 1",
    st2_t: "Free site visit", st2_p: "The site manager comes with a laser measure, photographs the place and checks walls and utilities.", st2_d: "1–2 days",
    st3_t: "Quote & contract", st3_p: "A detailed quote for every item. The price and schedule are fixed in the contract.", st3_d: "3 days",
    st4_t: "Rough works", st4_p: "Demolition, electrics, plumbing, plaster, screed. Hidden works are photographed.", st4_d: "40% of the time",
    st5_t: "Finishing", st5_p: "Tiles, flooring, painting, doors, fixtures and lighting.", st5_d: "50% of the time",
    st6_t: "Handover & warranty", st6_p: "Cleaning, acceptance by checklist, a completion certificate and a 3-year warranty card.", st6_d: "Finish",
    w_eyebrow: "Portfolio", w_title: "Our projects", w_all: "All", w_flat: "Apartments", w_kitchen: "Kitchens", w_bath: "Bathrooms",
    w1_t: "Scandinavian-style living room", w1_s: "Full · 28 m² · 9 weeks",
    w2_t: "Kitchen with an island", w2_s: "Designer · 14 m² · 6 weeks",
    w3_t: "Bathroom with a walk-in shower", w3_s: "Turnkey · 5 m² · 4 weeks",
    w4_t: "Bedroom with a wardrobe", w4_s: "Full · 16 m² · 5 weeks",
    w5_t: "Porcelain tile laying", w5_s: "WC · 4 m² · 2 weeks",
    w6_t: "Oak laminate, class 33", w6_s: "Cosmetic · 52 m² · 3 weeks",
    w_note: "Photos in this demo are illustrations generated for the portfolio.",
    p_eyebrow: "Prices", p_title: "Price list for individual works",
    p_p: "Labour prices without materials, valid for 2026. Minimum order — 15,000 ₴.", p_cta: "Estimate the whole renovation",
    pg_walls: "Walls & ceiling", pg_floor: "Floors & tiles", pg_eng: "Utilities",
    p1: "Plastering walls on guides", p2: "Filling for paint (2 coats)", p3: "Painting walls and ceiling", p4: "Plasterboard ceiling",
    p5: "Floor screed up to 5 cm", p6: "Laying laminate", p7: "Standard-size tiles", p8: "Porcelain 120×60 and larger",
    p9: "Electrical point (socket, switch)", p10: "Assembling a distribution panel", p11: "Plumbing point", p12: "Installing a wall-hung toilet frame",
    g_years: "years<br>warranty", g_title: "A warranty you can read",
    g_p: "Every promise is in the contract, not just words. If something goes wrong, we fix it at our own cost.",
    g1: "Fixed price: the quote doesn't change without your signature", g2: "Pay by stages — after each stage is accepted",
    g3: "Weekly photo and video report in Telegram", g4: "A 0.1% penalty for each day of delay caused by us",
    rev1: "“We did a full renovation of a two-room flat. The quote really didn't grow by a single hryvnia, and the Friday photo reports were very reassuring — we live in another city.”",
    rev1_n: "Iryna", rev1_s: "Full renovation, 54 m²",
    rev2: "“The bathroom was done in four weeks, as promised. The tiler is a true jeweller: straight joints, neat cuts.”",
    rev2_n: "Oleh", rev2_s: "Turnkey bathroom, 5 m²",
    rev3: "“The calculator on the website showed almost the same amount as the final quote. Nice when there are no surprises.”",
    rev3_n: "Nataliia", rev3_s: "Cosmetic renovation, 42 m²",
    rev_note: "Reviews are for demonstration.",
    faq_eyebrow: "FAQ", faq_title: "Frequently asked questions",
    q1: "Can the price change during the renovation?", a1: "No. The quote is fixed in the contract. It can only change if you add works yourself — and only after signing an addendum.",
    q2: "How does payment work?", a2: "A 15% advance at the start, then payment for each completed stage after acceptance. We work under a contract as a sole proprietor; pay by bank transfer or card.",
    q3: "Who buys the materials?", a3: "Whatever suits you. We can buy rough materials ourselves with partner discounts of up to 10%. Finishing materials (tiles, laminate, fixtures) are usually chosen by the client; we help calculate quantities.",
    q4: "Can I live in the apartment during the renovation?", a4: "With a cosmetic renovation, yes — we do the rooms one by one. For a full renovation it's better to move out at least for the rough works: it's faster and safer.",
    q5: "What does the warranty cover?", a5: "All our work for 3 years: cracks, loose tiles, leaks, wiring faults. We come out for a warranty case within 48 hours.",
    q6: "Do I need approval for re-planning?", a6: "If load-bearing walls or wet areas are affected, yes. We'll tell you which documents are needed and recommend a trusted engineer.",
    l_eyebrow: "Request", l_title: "Get an exact quote",
    l_p: "Your request goes straight to the site manager's Telegram. We'll call within 30 minutes and arrange a free site visit.",
    lp1: "Site visit and quote are free", lp2: "No spam: just one call", lp3: "We work daily 8:00–20:00",
    f_name: "Name", f_phone: "Phone", f_comment: "Comment", f_comment_ph: "Address or district, condition of the flat, desired timing…",
    f_calc: "Your estimate", f_calc_rm: "Remove", f_calc_add: "+ Attach the calculator estimate", f_submit: "Send request",
    f_legal: "By clicking the button you agree to the processing of your contact details for a call-back.",
    ft_p: "Turnkey apartment and house renovation with a fixed price and a 3-year warranty.",
    ft_phone: "Phone", demo_mark: "(demo)", ft_addr_t: "Office", ft_addr: "1 Budivelna St. (demo address)", ft_hours_t: "Hours", ft_hours: "Daily 8:00–20:00",
    ft_brand: "Maister Dim", demo: "Demo project. Website by", fab: "Estimate",
    logo: "Maister<b>Dim</b>", logo_al: "Maister Dim", menu_al: "Menu", area_al: "Area, m²", after_al: "After renovation",
    before_al: "Before renovation", ba_al: "Before / after", rev1_i: "I", rev2_i: "O", rev3_i: "N",
    // dynamic
    l_work: "Labour", l_demo: "Demolition", l_elec: "Electrics", l_plumb: "Plumbing", l_mat: "Rough materials (−10%)", l_proj: "Design project",
    l_min: "Minimum order", per_m: "≈ {v} ₴/m²", w1: "week", w2: "weeks", w5: "weeks",
    sum_opts: "extras", sum_none: "no extras",
    room_flat: "apartment", room_kitchen: "kitchen", room_bath: "bathroom", room_house: "house",
    type_cosmetic: "Cosmetic renovation", type_capital: "Full renovation", type_design: "Designer renovation",
    opt_demo: "demolition", opt_elec: "electrics", opt_plumb: "plumbing", opt_mat: "rough materials", opt_proj: "design project",
    msg_check: "Please check the highlighted fields.", msg_sending: "Sending…",
    msg_ok: "Thank you! The request has been received — we'll call within 30 minutes.",
    msg_demo: "Demo mode: on a real site this request (with your estimate) would go to the site manager's Telegram. Everything else works!",
    msg_err: "Couldn't send. Please call us or try again in a minute.",
  },
};
const uk = {
  l_work: "Роботи", l_demo: "Демонтаж", l_elec: "Електрика", l_plumb: "Сантехніка", l_mat: "Чорнові матеріали (−10%)", l_proj: "Дизайн-проєкт",
  l_min: "Мінімальне замовлення", per_m: "≈ {v} ₴/м²", w1: "тиждень", w2: "тижні", w5: "тижнів",
  sum_opts: "додатково", sum_none: "без додаткових робіт",
  room_flat: "квартира", room_kitchen: "кухня", room_bath: "ванна / санвузол", room_house: "будинок",
  type_cosmetic: "Косметичний ремонт", type_capital: "Капітальний ремонт", type_design: "Дизайнерський ремонт",
  opt_demo: "демонтаж", opt_elec: "електрика", opt_plumb: "сантехніка", opt_mat: "чорнові матеріали", opt_proj: "дизайн-проєкт",
  msg_check: "Перевірте, будь ласка, виділені поля.", msg_sending: "Надсилаємо…",
  msg_ok: "Дякуємо! Заявку отримано — зателефонуємо протягом 30 хвилин.",
  msg_demo: "Демо-режим: на справжньому сайті заявка (разом із розрахунком) прийшла б прорабу в Telegram. Усе інше працює!",
  msg_err: "Не вдалося надіслати. Зателефонуйте нам або спробуйте за хвилину.",
};
const alUk = {};
let lang = "uk";
try { lang = localStorage.getItem("lang") || "uk"; } catch (e) {}

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const t = (k) => (lang === "en" ? T.en[k] : uk[k]) || uk[k] || k;
const fmt = (n) => Math.round(n).toLocaleString(lang === "en" ? "en-US" : "uk-UA");

function applyLang() {
  document.documentElement.lang = lang;
  $$("[data-i18n]").forEach((el) => {
    const k = el.dataset.i18n;
    if (!(k in uk)) uk[k] = el.innerHTML;
    el.innerHTML = lang === "en" && T.en[k] ? T.en[k] : uk[k];
  });
  $$("[data-i18n-ph]").forEach((el) => {
    const k = el.dataset.i18nPh;
    if (!(k in uk)) uk[k] = el.placeholder;
    el.placeholder = lang === "en" && T.en[k] ? T.en[k] : uk[k];
  });
  $$("[data-i18n-al]").forEach((el) => {             // aria-label / alt
    const k = el.dataset.i18nAl, attr = el.hasAttribute("alt") ? "alt" : "aria-label";
    if (!(k in alUk)) alUk[k] = el.getAttribute(attr);
    el.setAttribute(attr, lang === "en" && T.en[k] ? T.en[k] : alUk[k]);
  });
  // unit labels (₴/м², м²) in static prices
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n; (n = walker.nextNode());) {
    if (/[мm]²/.test(n.nodeValue)) n.nodeValue = n.nodeValue.replace(/[мm]²/g, lang === "en" ? "m²" : "м²");
  }
  msg("");
  if (!uk.doc_title) uk.doc_title = document.title;
  document.title = lang === "en" ? "Maister Dim — turnkey apartment renovation" : uk.doc_title;
  $("#lang").textContent = lang === "en" ? "UA" : "EN";
  shown = calc.total;                                   // re-render numbers in the new locale without animating
  render(false);
}

$("#lang").addEventListener("click", () => {
  lang = lang === "en" ? "uk" : "en";
  try { localStorage.setItem("lang", lang); } catch (e) {}
  applyLang();
});

/* ---------- nav ---------- */
const nav = $("#nav");
const onScroll = () => nav.classList.toggle("is-solid", scrollY > 40);
addEventListener("scroll", onScroll, { passive: true });
onScroll();
$("#burger").addEventListener("click", () => {
  const open = nav.classList.toggle("is-open");
  $("#burger").setAttribute("aria-expanded", open);
});
$$("#links a").forEach((a) => a.addEventListener("click", () => { nav.classList.remove("is-open"); $("#burger").setAttribute("aria-expanded", false); }));

/* ---------- calculator ---------- */
const cf = $("#calcForm");
const areaRange = $("#areaRange"), areaNum = $("#areaNum");
const areaBy = Object.fromEntries(Object.entries(PRICE.room).map(([k, v]) => [k, v.area]));
let calc = { total: 0 };
let shown = 0;
let touched = false;

const readState = () => ({
  area: Math.min(500, Math.max(4, Math.round(+areaNum.value || 4))),
  type: cf.elements.type.value,
  room: cf.elements.room.value,
  opts: $$("input[name=opt]:checked", cf).map((i) => i.value),
});

function compute(s) {
  const ty = PRICE.type[s.type], rm = PRICE.room[s.room], has = (o) => s.opts.includes(o);
  const lines = [["l_work", s.area * ty.rate * rm.k]];
  if (has("demo")) lines.push(["l_demo", s.area * PRICE.demo]);
  if (has("elec")) lines.push(["l_elec", s.area * PRICE.elec * rm.k]);
  if (has("plumb")) lines.push(["l_plumb", s.area * PRICE.plumb * rm.k]);
  if (has("mat")) lines.push(["l_mat", s.area * ty.mat * rm.k * (1 - PRICE.matDiscount)]);
  if (has("proj")) lines.push(["l_proj", Math.max(PRICE.projMin, s.area * PRICE.proj)]);
  let total = lines.reduce((a, [, v]) => a + v, 0);
  if (total < PRICE.minOrder) { lines.push(["l_min", PRICE.minOrder - total]); total = PRICE.minOrder; }
  total = Math.round(total / 100) * 100;
  // duration: finishing pace by type × room complexity, plus demolition and design phases
  let w = (s.area * rm.t) / ty.prod;
  if (has("demo")) w += s.area > 30 ? 1 : 0.5;
  if (has("proj")) w += 3;
  const lo = Math.max(1, Math.round(w));
  const hi = lo + Math.max(1, Math.round(lo * 0.2));
  return { ...s, lines, total, lo, hi };
}

const plural = (n) => {
  if (lang === "en") return n === 1 ? t("w1") : t("w5");
  const a = n % 10, b = n % 100;
  if (a === 1 && b !== 11) return t("w1");
  if (a >= 2 && a <= 4 && (b < 12 || b > 14)) return t("w2");
  return t("w5");
};
const weeksText = (c) => `${c.lo}–${c.hi} ${plural(c.hi)}`;

function summary(c) {
  const opts = c.opts.map((o) => t("opt_" + o));
  return `${t("type_" + c.type)} · ${t("room_" + c.room)} · ${c.area} ${lang === "en" ? "m²" : "м²"} · ` +
    `${opts.length ? t("sum_opts") + ": " + opts.join(", ") : t("sum_none")} · ≈ ${fmt(c.total)} ₴ · ${weeksText(c)}`;
}

let raf;
function animateTotal(to) {
  cancelAnimationFrame(raf);
  const from = shown, t0 = performance.now(), dur = 450;
  const step = (now) => {
    const p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 3);
    shown = from + (to - from) * e;
    $("#total").textContent = fmt(shown);
    if (p < 1) raf = requestAnimationFrame(step);
  };
  raf = requestAnimationFrame(step);
}

function render(animate = true) {
  calc = compute(readState());
  if (animate && !matchMedia("(prefers-reduced-motion: reduce)").matches) animateTotal(calc.total);
  else { cancelAnimationFrame(raf); shown = calc.total; $("#total").textContent = fmt(calc.total); }
  $("#perM").textContent = t("per_m").replace("{v}", fmt(calc.total / calc.area));
  $("#lines").innerHTML = calc.lines.map(([k, v]) => `<li><span>${t(k)}</span><span>${fmt(v)} ₴</span></li>`).join("");
  $("#weeks").textContent = weeksText(calc);
  $("#areaOut").textContent = `${calc.area} ${lang === "en" ? "m²" : "м²"}`;
  $("#fabSum").textContent = `≈ ${fmt(calc.total)} ₴`;
  areaRange.style.setProperty("--fill", `${((Math.min(calc.area, 200) - 4) / 196) * 100}%`);
  if (attached) $("#calcSummary").textContent = summary(calc);
  if (typeof updateFab === "function") updateFab();
}

function setArea(v, from) {
  v = Math.round(+v);
  if (!Number.isFinite(v)) return;
  if (from !== areaRange) areaRange.value = Math.min(200, Math.max(4, v));
  if (from !== areaNum) areaNum.value = v;
  areaBy[cf.elements.room.value] = Math.min(500, Math.max(4, v));
}
areaRange.addEventListener("input", () => { setArea(areaRange.value, areaRange); touched = true; render(); });
areaNum.addEventListener("input", () => { if (areaNum.value === "") return; setArea(areaNum.value, areaNum); touched = true; render(); });
areaNum.addEventListener("change", () => { setArea(readState().area); render(); });   // clamp on blur

cf.addEventListener("change", (e) => {
  touched = true;
  if (e.target.name === "room") setArea(areaBy[e.target.value]);            // each space remembers its own area
  if (e.target.name === "type" && e.target.value === "design") cf.querySelector("input[value=proj]").checked = true;
  if (e.target !== areaNum) render();
});

/* ---------- lead form + attached calculation ---------- */
let attached = false;
function attach(on) {
  attached = on;
  $("#calcBox").hidden = !on;
  $("#calcAdd").hidden = on;
  if (on) $("#calcSummary").textContent = summary(calc);
}
$("#toLead").addEventListener("click", () => {
  attach(true);
  $("#lead").scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  setTimeout(() => form.elements.name.focus({ preventScroll: true }), 700);
});
$("#calcX").addEventListener("click", () => attach(false));
$("#calcAdd").addEventListener("click", () => attach(true));

const form = $("#leadForm");
form.elements.phone.addEventListener("input", (e) => { e.target.value = e.target.value.replace(/[^\d+()\s-]/g, ""); });
function msg(text, cls) { const p = $("#formMsg"); p.textContent = text; p.className = "form__msg " + (cls || ""); }

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const f = form.elements;
  const bad = [];
  const digits = f.phone.value.replace(/\D/g, "").length;
  if (f.name.value.trim().length < 2) bad.push(f.name);
  if (digits < 9 || digits > 13) bad.push(f.phone);
  $$(".is-bad", form).forEach((x) => x.classList.remove("is-bad"));
  if (bad.length) { bad.forEach((x) => x.classList.add("is-bad")); bad[0].focus(); return msg(t("msg_check"), "err"); }
  if (f.website.value) return;                                   // honeypot: bots fill it
  const btn = form.querySelector("button[type=submit]");
  btn.disabled = true;
  msg(t("msg_sending"));
  const data = {
    name: f.name.value.trim(), phone: f.phone.value.trim(), comment: f.comment.value.trim(), website: f.website.value,
    calc: attached ? summary(calc) : "", total: attached ? calc.total : 0,
  };
  try {
    const r = await fetch(LEAD_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    const j = await r.json().catch(() => ({}));
    if (r.ok && j.ok) { msg(j.demo ? t("msg_demo") : t("msg_ok"), "ok"); form.reset(); attach(false); }
    else if (!("ok" in j)) msg(t("msg_demo"), "ok");   // static hosting without the function (e.g. 501/404)
    else msg(t("msg_err"), "err");
  } catch (err) {
    msg(t("msg_demo"), "ok");
  } finally {
    btn.disabled = false;
  }
});
$$("input", form).forEach((i) => i.addEventListener("input", () => i.classList.remove("is-bad")));

/* ---------- before / after slider ---------- */
const cmp = $("#cmp"), cmpRange = $("#cmpRange");
const setPos = (p) => { p = Math.min(100, Math.max(0, p)); cmp.style.setProperty("--pos", p + "%"); cmpRange.value = p; };
let dragging = false;
const fromEvent = (e) => { const r = cmp.getBoundingClientRect(); setPos(((e.clientX - r.left) / r.width) * 100); };
cmp.addEventListener("pointerdown", (e) => { dragging = true; cmp.setPointerCapture(e.pointerId); fromEvent(e); });
cmp.addEventListener("pointermove", (e) => { if (dragging) fromEvent(e); });
["pointerup", "pointercancel"].forEach((ev) => cmp.addEventListener(ev, () => (dragging = false)));
cmpRange.addEventListener("input", () => setPos(+cmpRange.value));
cmpRange.style.pointerEvents = "none";                            // pointer handled above; the range stays for keyboard
// one-time hint sweep when the slider first comes into view
const hint = new IntersectionObserver(([en]) => {
  if (!en.isIntersecting) return;
  hint.disconnect();
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const keys = [[0, 50], [700, 72], [1400, 30], [2100, 50]], t0 = performance.now();
  const step = (now) => {
    if (dragging) return;
    const el = now - t0;
    const i = keys.findIndex(([ms]) => ms > el);
    if (i === -1) return setPos(50);
    const [a, pa] = keys[i - 1], [b, pb] = keys[i], p = (el - a) / (b - a), e = p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
    setPos(pa + (pb - pa) * e);
    requestAnimationFrame(step);
  };
  setTimeout(() => requestAnimationFrame(step), 500);
}, { threshold: 0.6 });
hint.observe(cmp);

/* ---------- portfolio filter ---------- */
$("#wTabs").addEventListener("click", (e) => {
  const b = e.target.closest(".tab");
  if (!b) return;
  const f = b.dataset.f;
  $$("#wTabs .tab").forEach((x) => { x.classList.toggle("is-active", x === b); x.setAttribute("aria-selected", x === b); });
  $$("#wGrid .work").forEach((w) => {
    const show = f === "all" || w.dataset.cat === f;
    w.classList.toggle("is-hidden", !show);
    w.classList.remove("is-entering");
    if (show) { void w.offsetWidth; w.classList.add("is-entering"); }
  });
  $("#wGrid").classList.toggle("is-filtered", f !== "all");
});

/* ---------- FAQ: one open at a time, animated ---------- */
$$("#faqList details").forEach((d) => {
  const sum = d.querySelector("summary"), body = d.querySelector(".faq__a");
  sum.addEventListener("click", (e) => {
    e.preventDefault();
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { d.open = !d.open; return; }
    if (d.open) {
      body.animate([{ height: body.offsetHeight + "px" }, { height: 0 }], { duration: 250, easing: "ease" }).onfinish = () => (d.open = false);
    } else {
      $$("#faqList details[open]").forEach((o) => o !== d && (o.open = false));
      d.open = true;
      body.animate([{ height: 0, opacity: 0 }, { height: body.offsetHeight + "px", opacity: 1 }], { duration: 280, easing: "ease" });
    }
  });
});

/* ---------- mobile floating total ---------- */
const vis = { calc: true, lead: false };
const fab = $("#fab");
const updateFab = () => fab.classList.toggle("is-on", touched && !vis.calc && !vis.lead);
const fabIO = new IntersectionObserver((es) => {
  es.forEach((en) => (vis[en.target.id] = en.isIntersecting));
  updateFab();
});
fabIO.observe($("#calc"));
fabIO.observe($("#lead"));

/* ---------- reveal on scroll ---------- */
const io = new IntersectionObserver((es) => es.forEach((en) => {
  if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
}), { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
$$(".reveal").forEach((el) => io.observe(el));

$("#year").textContent = new Date().getFullYear();
applyLang();
