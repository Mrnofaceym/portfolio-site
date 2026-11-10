/* Зерно — demo cafe site.
 * Menu: Google Sheet published as CSV (MENU_CSV_URL) with columns
 *   category,name,name_en,desc,desc_en,price   (category: coffee|breakfast|dessert|cold)
 * Falls back to menu.json when the URL is empty or unreachable.
 * Booking: POST BOOK_URL (Cloudflare Pages Function -> Telegram). */
const MENU_CSV_URL = "";
const BOOK_URL = "/api/cafe-book";   // Cloudflare Pages Function (functions/api/cafe-book.js)

const T = {
  en: {
    nav_menu: "Menu", nav_about: "About", nav_gallery: "Atmosphere", nav_contacts: "Contacts", nav_book: "Book a table",
    hero_eyebrow: "Café & roastery · since 2019", hero_title: "Coffee worth<br><em>waking up for</em>",
    hero_sub: "We roast every week, bake every morning and serve breakfast until closing.",
    hero_book: "Book a table", hero_menu: "See the menu",
    fact_open: "open every day", fact_origins: "origins a year", fact_rating: "guest rating",
    about_eyebrow: "About us", about_title: "From green bean to your cup",
    about_p1: "We pick farm lots ourselves, roast them in small batches and dial in the grind every morning, so every cup tastes consistent and the espresso is never bitter.",
    about_p2: "Besides coffee: all-day breakfast and pastries from our own oven. Come to work, meet friends or just sit by the window with a book.",
    card1_t: "Roasted in-house", card1_p: "Fresh beans every week, also to take home.",
    card2_t: "Champion baristas", card2_p: "Two of our baristas are national championship finalists.",
    card3_t: "Pastry at 7 am", card3_p: "Croissants and cinnamon rolls fresh from the oven.",
    menu_eyebrow: "Menu", menu_title: "On the menu today", menu_source: "The owner edits this menu in Google Sheets",
    menu_live: "Live from Google Sheets",
    tab_coffee: "Coffee", tab_breakfast: "Breakfast", tab_dessert: "Pastry & desserts", tab_cold: "Cold drinks",
    gal_eyebrow: "Atmosphere", gal_title: "A place you'll want to come back to",
    rev_eyebrow: "Reviews", rev_title: "What guests say",
    rev1: "“The best flat white in town. I come every morning before work and the baristas already know my order.”",
    rev2: "“Syrnyky like grandma's, and the cheesecake is a work of art. A cosy place to work on a laptop.”",
    rev3: "“Booked a table on the website in a minute — the terrace in the evening is a dream.”",
    book_eyebrow: "Booking", book_title: "Book a table",
    book_p: "Your request goes straight to our manager's Telegram — we'll confirm by phone within 15 minutes.",
    perk1: "Terrace from May to October", perk2: "Tables for groups up to 10", perk3: "Power sockets at every table",
    f_name: "Name", f_phone: "Phone", f_date: "Date", f_time: "Time", f_guests: "Guests", f_comment: "Wishes",
    f_comment_ph: "Terrace, high chair, birthday…", f_submit: "Send request",
    c_eyebrow: "Contacts", c_title: "Drop in for coffee", c_addr_t: "Address", c_addr: "12 Coffee St. (demo address)",
    c_hours_t: "Opening hours", c_hours: "Mon–Fri 7:30–21:00 · Sat–Sun 8:30–22:00", c_phone_t: "Phone",
    demo: "Demo project. Website by",
    msg_check: "Please check the highlighted fields.", msg_sending: "Sending…",
    msg_ok: "Thank you! We've received your request and will call you within 15 minutes.",
    msg_demo: "Demo mode: on a real site this request would go to the café's Telegram. Everything else works!",
    msg_err: "Couldn't send. Please call us or try again in a minute.",
  },
};
const uk = {};                                      // original Ukrainian texts are taken from the HTML
let lang = "uk";
try { lang = localStorage.getItem("lang") || "uk"; } catch (e) {}

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const t = (k) => (lang === "en" ? T.en[k] : uk[k]) || uk[k] || k;

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
  $("#lang").textContent = lang === "en" ? "UA" : "EN";
  renderMenu();
}
uk.menu_live = "Меню підтягується наживо з Google Таблиці";
["msg_check", "msg_sending", "msg_ok", "msg_demo", "msg_err"].forEach((k) => (uk[k] = {
  msg_check: "Перевірте, будь ласка, виділені поля.", msg_sending: "Надсилаємо…",
  msg_ok: "Дякуємо! Заявку отримано — зателефонуємо протягом 15 хвилин.",
  msg_demo: "Демо-режим: на справжньому сайті заявка прийшла б у Telegram кав'ярні. Усе інше працює!",
  msg_err: "Не вдалося надіслати. Зателефонуйте нам або спробуйте за хвилину.",
}[k]));

$("#lang").addEventListener("click", () => {
  lang = lang === "en" ? "uk" : "en";
  try { localStorage.setItem("lang", lang); } catch (e) {}
  applyLang();
});

/* nav */
const nav = $("#nav");
const onScroll = () => nav.classList.toggle("is-solid", scrollY > 40);
addEventListener("scroll", onScroll, { passive: true });
onScroll();
$("#burger").addEventListener("click", () => {
  const open = nav.classList.toggle("is-open");
  $("#burger").setAttribute("aria-expanded", open);
});
$$("#links a").forEach((a) => a.addEventListener("click", () => nav.classList.remove("is-open")));

/* menu */
let MENU = [];
let cat = "coffee";
const PHOTOS = { coffee: "img/flat-white.webp", breakfast: "img/toast.webp", dessert: "img/cheesecake.webp", cold: "img/iced.webp" };

function parseCSV(text) {
  const rows = [];
  let row = [], cell = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') q = false;
      else cell += ch;
    } else if (ch === '"') q = true;
    else if (ch === ",") { row.push(cell); cell = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell); rows.push(row); row = []; cell = "";
    } else cell += ch;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const [head, ...body] = rows.filter((r) => r.some((c) => c.trim()));
  return body.map((r) => Object.fromEntries(head.map((h, i) => [h.trim(), (r[i] || "").trim()])));
}

async function loadMenu() {
  if (MENU_CSV_URL) {
    try {
      const r = await fetch(MENU_CSV_URL, { cache: "no-store" });
      if (r.ok) {
        MENU = parseCSV(await r.text());
        if (MENU.length) { $("#menuSource").dataset.i18n = "menu_live"; return; }
      }
    } catch (e) { /* fall back */ }
  }
  MENU = await (await fetch("menu.json")).json();
}

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

function renderMenu() {
  const list = $("#menuList");
  if (!list || !MENU.length) return;
  list.innerHTML = MENU.filter((m) => m.category === cat).map((m, i) => `
    <li class="menu__item" style="animation-delay:${i * 60}ms">
      <h3>${esc(lang === "en" && m.name_en ? m.name_en : m.name)}</h3>
      <span class="menu__price">${esc(m.price)} ₴</span>
      <p>${esc(lang === "en" && m.desc_en ? m.desc_en : m.desc)}</p>
    </li>`).join("");
  const ph = $("#menuPhoto");
  if (!ph.src.endsWith(PHOTOS[cat])) {
    ph.style.opacity = 0;
    setTimeout(() => { ph.src = PHOTOS[cat]; ph.onload = () => (ph.style.opacity = 1); }, 200);
  }
}

$("#tabs").addEventListener("click", (e) => {
  const b = e.target.closest(".tab");
  if (!b) return;
  cat = b.dataset.cat;
  $$(".tab").forEach((x) => { x.classList.toggle("is-active", x === b); x.setAttribute("aria-selected", x === b); });
  renderMenu();
});

/* booking form */
const form = $("#bookForm");
const dateIn = form.elements.date;
const today = new Date();
const iso = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
dateIn.min = iso(today);
dateIn.max = iso(new Date(today.getTime() + 30 * 864e5));
dateIn.value = iso(today);

function fillTimes() {
  const sel = $("#timeSel");
  const d = new Date(dateIn.value || today);
  const weekend = [0, 6].includes(d.getDay());
  const [from, to] = weekend ? [9, 21] : [8, 20];
  const isToday = dateIn.value === iso(today);
  sel.innerHTML = "";
  for (let h = from; h <= to; h++) for (const m of [0, 30]) {
    if (isToday && (h < today.getHours() + 1 || (h === today.getHours() + 1 && m < today.getMinutes()))) continue;
    const v = `${String(h).padStart(2, "0")}:${m ? "30" : "00"}`;
    sel.insertAdjacentHTML("beforeend", `<option>${v}</option>`);
  }
  if (!sel.options.length && isToday) {            // closed for today: jump to tomorrow
    dateIn.value = iso(new Date(today.getTime() + 864e5));
    return fillTimes();
  }
  if (!sel.options.length) sel.insertAdjacentHTML("beforeend", `<option value="">—</option>`);
}
dateIn.addEventListener("change", fillTimes);
fillTimes();

function msg(text, cls) { const p = $("#formMsg"); p.textContent = text; p.className = "form__msg " + (cls || ""); }

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const f = form.elements;
  const bad = [];
  if (f.name.value.trim().length < 2) bad.push(f.name);
  if (f.phone.value.replace(/\D/g, "").length < 9) bad.push(f.phone);
  if (!f.date.value) bad.push(f.date);
  if (!f.time.value) bad.push(f.time);
  $$(".is-bad", form).forEach((x) => x.classList.remove("is-bad"));
  if (bad.length) { bad.forEach((x) => x.classList.add("is-bad")); bad[0].focus(); return msg(t("msg_check"), "err"); }
  if (f.website.value) return;                                   // honeypot: bots fill it
  const btn = form.querySelector("button[type=submit]");
  btn.disabled = true;
  msg(t("msg_sending"));
  const data = Object.fromEntries(new FormData(form));
  try {
    const r = await fetch(BOOK_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    const j = await r.json().catch(() => ({}));
    if (r.ok && j.ok) { msg(j.demo ? t("msg_demo") : t("msg_ok"), "ok"); form.reset(); dateIn.value = iso(today); fillTimes(); }
    else if (!("ok" in j)) msg(t("msg_demo"), "ok");   // static hosting without the function
    else msg(t("msg_err"), "err");
  } catch (err) {
    msg(t("msg_demo"), "ok");
  } finally {
    btn.disabled = false;
  }
});

/* reveal on scroll */
const io = new IntersectionObserver((es) => es.forEach((en) => {
  if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
}), { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
$$(".reveal").forEach((el) => io.observe(el));

$("#year").textContent = new Date().getFullYear();
loadMenu().then(applyLang).catch(applyLang);
