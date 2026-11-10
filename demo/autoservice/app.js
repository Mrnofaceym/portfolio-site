/* Мотор Сервіс — demo car-service site.
 * Smart booking: car -> services (live total & duration) -> date + free slot -> contacts -> POST BOOK_URL
 * BOOK_URL is a Cloudflare Pages Function (functions/api/autoservice-book.js) that forwards to Telegram. */
const BOOK_URL = "/api/autoservice-book";

/* ---------- data ---------- */
const ICONS = {
  diag: '<path d="M3 5h18v11H3z"/><path d="M8 20h8M12 16v4"/><path d="M6 12l3-3 2 2 4-4 3 3"/>',
  oil: '<path d="M12 3c3 4.5 5 7.4 5 10a5 5 0 0 1-10 0c0-2.6 2-5.5 5-10z"/><path d="M10 14a2 2 0 0 0 2 2"/>',
  brakes: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="2.5"/><path d="M17 5.5a9 9 0 0 1 2.5 4"/>',
  chassis: '<path d="M4 18h16"/><path d="M7 18V9l5-4 5 4v9"/><path d="M10 13h4"/>',
  suspension: '<path d="M12 3v3M12 18v3"/><path d="M8 6h8M8 18h8"/><path d="M9 8l6 2-6 2 6 2-6 2"/>',
  tires: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4"/><path d="M12 3.5v4.5M12 16v4.5M3.5 12H8M16 12h4.5"/>',
  align: '<path d="M7 4l-2 16M17 4l2 16"/><path d="M4 12h16"/><path d="M10 9l-3 3 3 3M14 9l3 3-3 3"/>',
  ac: '<path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9"/><path d="M9.5 4.5L12 6l2.5-1.5M9.5 19.5L12 18l2.5 1.5"/>',
  electric: '<path d="M13 3L5 13h6l-1 8 8-10h-6z"/>',
};
const SERVICES = [
  { id: "diag", min: 40, price: 600, img: "diag",
    uk: ["Комп'ютерна діагностика", "Сканування всіх блоків, розшифровка помилок, звіт у Telegram"],
    en: ["Computer diagnostics", "Scan of all ECUs, decoded fault codes, report in Telegram"] },
  { id: "oil", min: 30, price: 450, img: "oil",
    uk: ["Заміна оливи та фільтра", "Олива двигуна й масляний фільтр, скидання сервісного інтервалу"],
    en: ["Oil & filter change", "Engine oil and oil filter, service interval reset"] },
  { id: "brakes", min: 60, price: 700, img: "brakes",
    uk: ["Гальмівні колодки (вісь)", "Заміна колодок, перевірка дисків, супортів і рідини"],
    en: ["Brake pads (per axle)", "Pad replacement, check of discs, calipers and fluid"] },
  { id: "chassis", min: 30, price: 400, img: "lift",
    uk: ["Діагностика ходової", "На підйомнику з люфт-детектором, перелік зносу з фото"],
    en: ["Suspension check", "On a lift with a play detector, wear list with photos"] },
  { id: "suspension", min: 120, price: 1200, img: "lift",
    uk: ["Ремонт підвіски", "Амортизатори, важелі, сайлентблоки, стійки стабілізатора"],
    en: ["Suspension repair", "Shock absorbers, control arms, bushings, stabilizer links"] },
  { id: "tires", min: 45, price: 800, img: "tires",
    uk: ["Шиномонтаж R13–R17", "Зняття, монтаж і балансування 4 коліс"],
    en: ["Tire fitting R13–R17", "Removal, fitting and balancing of 4 wheels"] },
  { id: "align", min: 45, price: 900, img: "wheel",
    uk: ["Розвал-сходження 3D", "Налаштування кутів коліс на 3D-стенді, роздруківка «до/після»"],
    en: ["3D wheel alignment", "Wheel angles set on a 3D stand, before/after printout"] },
  { id: "ac", min: 50, price: 1100, img: "mechanic",
    uk: ["Заправка кондиціонера", "Тест герметичності, вакуумування, фреон і олива"],
    en: ["A/C recharge", "Leak test, vacuuming, refrigerant and oil"] },
  { id: "electric", min: 60, price: 700, img: "diag",
    uk: ["Автоелектрика", "Акумулятор, генератор, стартер, проводка, світло"],
    en: ["Auto electrics", "Battery, alternator, starter, wiring, lights"] },
];
const SYMPTOMS = [
  { id: "knock", svc: ["chassis", "suspension"],
    uk: ["Стукіт у підвісці", "Найчастіше винні стійки стабілізатора, сайлентблоки або опорні підшипники. Почніть з діагностики ходової — за 30 хвилин покажемо зношені деталі прямо на підйомнику."],
    en: ["Knocking in the suspension", "Usually stabilizer links, bushings or strut bearings. Start with a suspension check: in 30 minutes we'll show you the worn parts right on the lift."] },
  { id: "ce", svc: ["diag"],
    uk: ["Горить Check Engine", "Це може бути дрібниця (датчик, кришка бака) або пропуски запалювання. Комп'ютерна діагностика прочитає коди й покаже справжню причину, а не «міняємо все підряд»."],
    en: ["Check Engine light is on", "It may be minor (a sensor, the fuel cap) or a misfire. Computer diagnostics reads the codes and finds the real cause instead of “replace everything”."] },
  { id: "squeal", svc: ["brakes"],
    uk: ["Скрипить при гальмуванні", "Зазвичай колодки стерлися до індикатора зносу або підклинює супорт. Не відкладайте: стерті колодки швидко псують гальмівні диски."],
    en: ["Squealing when braking", "Usually pads worn down to the wear indicator or a sticking caliper. Don't wait: worn pads quickly ruin the brake discs."] },
  { id: "pull", svc: ["align", "chassis"],
    uk: ["Авто тягне вбік", "Збиті кути коліс після ями, різний тиск у шинах або знос рульових тяг. Перевіримо ходову й налаштуємо розвал-сходження."],
    en: ["Car pulls to one side", "Wheel angles knocked out by a pothole, uneven tire pressure or worn tie rods. We'll check the suspension and align the wheels."] },
  { id: "vibe", svc: ["tires", "align"],
    uk: ["Вібрує кермо на швидкості", "Найчастіше — дисбаланс коліс або деформований диск. Балансування входить у шиномонтаж, а після нього варто перевірити кути."],
    en: ["Steering wheel shakes at speed", "Most often unbalanced wheels or a bent rim. Balancing is included in tire fitting; checking the alignment afterwards is a good idea."] },
  { id: "acwarm", svc: ["ac"],
    uk: ["Кондиціонер дме теплим", "Найімовірніше, у системі бракує фреону через мікровитік. Перевіримо герметичність і заправимо з точним дозуванням."],
    en: ["A/C blows warm air", "Most likely the system is low on refrigerant due to a small leak. We'll leak-test it and recharge with an exact dose."] },
  { id: "start", svc: ["electric", "diag"],
    uk: ["Погано заводиться", "Перевіримо акумулятор під навантаженням, генератор і стартер, а також помилки блоку керування двигуном."],
    en: ["Hard to start", "We'll load-test the battery, check the alternator and starter, and read the engine ECU fault codes."] },
  { id: "service", svc: ["oil", "chassis"],
    uk: ["Пора на планове ТО", "Кожні 10–15 тис. км: олива з фільтром плюс огляд ходової, щоб дрібниця не стала дорогим ремонтом. Бот у Telegram нагадає про наступне ТО."],
    en: ["Time for regular service", "Every 10–15k km: oil and filter plus a suspension check, so small issues don't become costly repairs. Our Telegram bot will remind you next time."] },
];
const MAKES = ["Toyota", "Volkswagen", "Skoda", "Renault", "Hyundai", "Kia", "Ford", "Nissan", "Mazda", "Honda", "Mitsubishi", "BMW", "Mercedes-Benz",
  "Audi", "Lexus", "Opel", "Peugeot", "Citroën", "Chevrolet", "Subaru", "Suzuki", "Volvo", "Tesla", "Daewoo", "ZAZ", "BYD", "Chery"];

/* ---------- i18n ---------- */
const T = {
  en: {
    nav_services: "Services & prices", nav_symptoms: "What's wrong?", nav_why: "Why us", nav_faq: "FAQ", nav_contacts: "Contacts", nav_book: "Book now",
    demo_pill: "Demo project", fab: "Book a visit",
    hero_tag: "Free bays available today", hero_title: "Car repair with no surprises <span>on the final bill</span>",
    hero_sub: "Diagnostics, servicing, brakes, suspension and tires. We agree on the price before any work starts, and you can watch the repair live.",
    hero_book: "Book diagnostics in 1 minute", hero_prices: "Service prices",
    fact_years: "years in business", fact_lifts: "car lifts", fact_mo: "mo.", fact_warranty: "warranty on work", fact_rating: "customer rating",
    srv_eyebrow: "Services & prices", srv_title: "A transparent price list, no hidden extras",
    srv_note: "Labour prices for passenger cars. Parts at the supplier's invoice price; no markup on parts you bring.",
    srv_hint: "Tap a service and it instantly appears in the online booking below.",
    sym_eyebrow: "Symptom → what to check", sym_title: "Something wrong with your car? Pick what you notice",
    sym_note: "We'll tell you where to start and add the right services to your booking in one tap.",
    bk_eyebrow: "Online booking", bk_title: "Book a car service in 1 minute",
    bk_note: "See the price and duration right away. The service advisor confirms via Telegram or a call.",
    st1: "Car", st2: "Services", st3: "Date & time", st4: "Contacts",
    p1_t: "Tell us about your car", f_make: "Make", f_make_ph: "Choose a make", f_model: "Model", f_year: "Year", f_km: "Mileage, km", f_fuel: "Engine",
    fuel_petrol: "Petrol", fuel_diesel: "Diesel", fuel_lpg: "LPG/petrol", fuel_hybrid: "Hybrid", fuel_ev: "Electric",
    p2_t: "What needs to be done?", p2_hint: "Not sure? Choose “Computer diagnostics” and the mechanic will advise on the rest.",
    p3_t: "Pick a convenient day and time", lg_free: "free", lg_busy: "taken",
    p4_t: "Where should we send the confirmation?", f_name: "Name", f_phone: "Phone", f_comment: "Note for the mechanic",
    f_comment_ph: "The knock appears when cold, car is under warranty…", f_remind: "Remind me about the next service in Telegram",
    b_back: "Back", b_next: "Next", b_submit: "Confirm booking",
    sum_t: "WORK ORDER", sum_car: "Car", sum_when: "When", sum_time: "Estimated time", sum_total: "Labour cost",
    sum_note: "The final price is agreed after inspection — nothing is replaced without your “yes”.",
    why_eyebrow: "Why us", why_title: "A service you can trust with your keys", why_badge: "months of warranty on work and parts",
    w1_t: "12-month warranty", w1_p: "On the work and the parts we fit. In writing, on the work order.",
    w2_t: "Genuine or quality alternatives", w2_p: "We show you the box and the receipt. You choose: genuine, OEM or a budget alternative.",
    w3_t: "Price before work starts", w3_p: "The estimate arrives in Telegram. Extra work only after you confirm it.",
    w4_t: "Watch the repair", w4_p: "A lounge with a window into the workshop and coffee. Or photos and videos sent straight to your messenger.",
    tg_p: "<b>A Telegram bot will remind you about servicing.</b> It knows your mileage and last visit, tells you when to change oil and tires, and keeps your car's service history.",
    how_eyebrow: "How it works", how_title: "From request to keys in 4 steps",
    h1_t: "Book online", h1_p: "Choose services and a free time. Confirmation arrives within minutes.",
    h2_t: "Diagnostics", h2_p: "The mechanic inspects the car with you and shows what really needs attention.",
    h3_t: "Estimate & approval", h3_p: "You get the exact price in Telegram. We start only after your “yes”.",
    h4_t: "Handover & warranty", h4_p: "We return the old parts and give you the work order and a 12-month warranty.",
    rev_eyebrow: "Reviews", rev_title: "What drivers say", rev_note: "Sample reviews to demonstrate the design.",
    rev1: "“Booked on the website in the evening, the car was on the lift next morning. They showed me the worn bushings live, and the price matched the estimate to the hryvnia.”",
    rev2: "“Check Engine was on, another shop told me to replace the catalytic converter. Here they found an oxygen sensor: 1,800 UAH instead of 20 thousand.”",
    rev3: "“I like that the bot reminds me about oil changes by itself. Third year servicing both our cars here.”",
    faq_eyebrow: "FAQ", faq_title: "Frequently asked questions", faq_note: "Didn't find an answer? Leave a note in the booking form and the mechanic will call you back.",
    q1: "How long does diagnostics take, and can I wait?", a1: "Computer diagnostics takes 30–40 minutes, a suspension check about 30. You can wait in the lounge with Wi-Fi and coffee and watch through the window into the workshop.",
    q2: "Can I bring my own parts?", a2: "Yes. We fit your parts at the same labour price. The warranty then covers the work, and the parts are covered by the seller.",
    q3: "Will the price change after inspection?", a3: "The website shows “from” labour prices. After inspection you get an exact estimate, and we do nothing without your confirmation.",
    q4: "How can I pay?", a4: "Cash, card, Apple Pay / Google Pay, or a bank invoice with VAT for companies.",
    q5: "Do you service hybrids and EVs?", a5: "Yes: suspension, brakes, A/C and tires for everyone. High-voltage systems are handled by a certified technician, so please specify the engine type when booking.",
    q6: "How do Telegram service reminders work?", a6: "After your visit the bot remembers the mileage and date. When an oil change or seasonal tire swap is due, it sends a message with a booking button.",
    c_eyebrow: "Contacts", c_title: "Come over: your bay is waiting", c_addr_t: "Address", c_addr: "7 Motorna St. (demo address)",
    c_hours_t: "Hours", c_hours: "Mon–Fri 8:00–19:00 · Sat 9:00–16:00 · Sun closed", c_phone_t: "Phone", c_demo: "(demo)",
    c_book: "Book online", c_map: "Map · demo",
    demo: "Demo project. Website by",
    title: "Motor Service — car repair, diagnostics and servicing", logo: "Motor<b>Service</b>", brand: "Motor Service",
    a_lang: "Language / Мова", a_menu: "Menu", a_price: "Price list", a_sym: "Symptoms", a_date: "Date", a_time: "Time", a_sum: "Summary",
    n1: "Oleh", n2: "Iryna", n3: "Andrii",
  },
};
const MSG = {
  uk: {
    uah: "грн", from: "від", h: "год", min: "хв", none: "Оберіть послуги", add: "Додати до запису", added: "Додано до онлайн-запису ✓", toBook: "Перейти до запису",
    check: "Що перевірити", pick: "Оберіть симптом зліва — підкажемо, що перевірити і скільки це коштує.",
    km_next: (n) => `Наступне ТО — орієнтовно на <b>${n} км</b>. Бот у Telegram нагадає вчасно.`,
    km_high: " З таким пробігом радимо додати <b>діагностику ходової</b>.",
    ev_oil: "для електро не потрібно",
    long: "Тривалий ремонт: авто може залишитися в нас до наступного дня — майстер узгодить деталі.",
    ends: (t, e) => `Початок о ${t}, орієнтовне завершення о <b>${e}</b>.`,
    no_slots: "На цей день вільних годин немає — оберіть інший.",
    wd: ["нд", "пн", "вт", "ср", "чт", "пт", "сб"], mon: ["січ", "лют", "бер", "кві", "тра", "чер", "лип", "сер", "вер", "жов", "лис", "гру"],
    e_car: "Вкажіть марку, модель і рік авто.", e_km: "Пробіг — лише цифри.", e_svc: "Оберіть хоча б одну послугу.", e_time: "Оберіть дату й вільний час.",
    e_contact: "Перевірте ім'я та номер телефону.", sending: "Надсилаємо…",
    ok: "Запис прийнято! Майстер-приймальник підтвердить його протягом 15 хвилин.",
    demo: "Демо-режим: на справжньому сайті запис миттєво прийшов би в Telegram СТО. Усе інше працює!",
    err: "Не вдалося надіслати. Спробуйте ще раз за хвилину.",
  },
  en: {
    uah: "UAH", from: "from", h: "h", min: "min", none: "Choose services", add: "Add to booking", added: "Added to your online booking ✓", toBook: "Go to booking",
    check: "What to check", pick: "Pick a symptom on the left — we'll suggest what to check and how much it costs.",
    km_next: (n) => `Next service due at about <b>${n} km</b>. Our Telegram bot will remind you.`,
    km_high: " At this mileage we recommend adding a <b>suspension check</b>.",
    ev_oil: "not needed for EVs",
    long: "A long job: the car may stay with us until the next day — the advisor will arrange details.",
    ends: (t, e) => `Starts at ${t}, estimated finish at <b>${e}</b>.`,
    no_slots: "No free time on this day — please pick another.",
    wd: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"], mon: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    e_car: "Please enter the car make, model and year.", e_km: "Mileage: digits only.", e_svc: "Choose at least one service.", e_time: "Choose a date and a free time.",
    e_contact: "Please check your name and phone number.", sending: "Sending…",
    ok: "Booking received! Our service advisor will confirm it within 15 minutes.",
    demo: "Demo mode: on a real site this booking would instantly reach the service's Telegram. Everything else works!",
    err: "Couldn't send. Please try again in a minute.",
  },
};

const uk = {};
let lang = "uk";
try { lang = localStorage.getItem("lang") || "uk"; } catch (e) {}
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const M = () => MSG[lang];
const L = (o) => o[lang] || o.uk;
const pad = (n) => String(n).padStart(2, "0");
const money = (n) => `${n.toLocaleString("uk-UA").replace(/\s/g, " ")} ${M().uah}`;
const dur = (m) => { const h = Math.floor(m / 60), r = m % 60; return h ? `${h} ${M().h}${r ? ` ${r} ${M().min}` : ""}` : `${r} ${M().min}`; };
const svc = (id) => SERVICES.find((s) => s.id === id);

function applyLang() {
  document.documentElement.lang = lang === "en" ? "en" : "uk";
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
  $$("[data-i18n-aria]").forEach((el) => {
    const k = "aria:" + el.dataset.i18nAria;
    if (!(k in uk)) uk[k] = el.getAttribute("aria-label");
    el.setAttribute("aria-label", lang === "en" && T.en[el.dataset.i18nAria] ? T.en[el.dataset.i18nAria] : uk[k]);
  });
  if (!("title" in uk)) uk.title = document.title;
  document.title = lang === "en" ? T.en.title : uk.title;
  $("#lang").textContent = lang === "en" ? "UA" : "EN";
  showPhoto(state.photo);
  renderPrice(); renderSvc(); renderSymptoms(); renderDates(); renderSlots(); kmHint(); updateSummary();
}
$("#lang").addEventListener("click", () => {
  lang = lang === "en" ? "uk" : "en";
  try { localStorage.setItem("lang", lang); } catch (e) {}
  msg("");
  applyLang();
});

/* ---------- nav ---------- */
const nav = $("#nav");
const fab = $("#fab");
const onScroll = () => {
  nav.classList.toggle("is-solid", scrollY > 40);
  const b = $("#book").getBoundingClientRect();
  fab.classList.toggle("is-on", scrollY > innerHeight * .8 && (b.top > innerHeight || b.bottom < 0));
};
addEventListener("scroll", onScroll, { passive: true });
onScroll();
$("#burger").addEventListener("click", () => {
  const open = nav.classList.toggle("is-open");
  $("#burger").setAttribute("aria-expanded", open);
});
$$("#links a").forEach((a) => a.addEventListener("click", () => { nav.classList.remove("is-open"); $("#burger").setAttribute("aria-expanded", false); }));

/* ---------- state ---------- */
const state = { step: 1, services: new Set(), date: "", time: "", sym: "", photo: "diag" };
const form = $("#bookForm");
const F = form.elements;
const total = () => [...state.services].reduce((a, id) => a + svc(id).price, 0);
const minutes = () => [...state.services].reduce((a, id) => a + svc(id).min, 0);

function toggleService(id, on) {
  const want = on ?? !state.services.has(id);
  if (want && id === "oil" && F.fuel.value === "ev") return;
  want ? state.services.add(id) : state.services.delete(id);
  $("#svcList").classList.remove("is-bad");
  renderPrice(); renderSvc(); renderDates(); renderSlots(); updateSummary();
}

/* ---------- price list ---------- */
const icon = (id) => `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[id] || ICONS.diag}</svg>`;
const CHECK = '<path d="M5 12.5l4.5 4.5L19 7.5"/>';
function renderPrice() {
  $("#priceList").innerHTML = SERVICES.map((s) => {
    const [n, d] = L(s), on = state.services.has(s.id);
    return `<li class="${on ? "is-on" : ""}"><button type="button" data-id="${s.id}" aria-pressed="${on}">
      <span class="ico">${on ? `<svg viewBox="0 0 24 24" aria-hidden="true">${CHECK}</svg>` : icon(s.id)}</span>
      <h3>${n}</h3>
      <span class="cost"><b>${M().from} ${money(s.price)}</b><small>≈ ${dur(s.min)}</small></span>
      <p>${d}</p></button></li>`;
  }).join("");
}
function showPhoto(id) {
  state.photo = id;
  const s = svc(id), ph = $("#srvPhoto"), src = `img/${s.img}.webp`;
  $("#srvCap").textContent = `${L(s)[0]} · ${M().from} ${money(s.price)}`;
  if (ph.getAttribute("src") === src) return;
  ph.style.opacity = 0;
  setTimeout(() => { ph.src = src; ph.onload = () => (ph.style.opacity = 1); }, 180);
}
$("#priceList").addEventListener("mouseover", (e) => { const b = e.target.closest("button"); if (b) showPhoto(b.dataset.id); });
$("#priceList").addEventListener("focusin", (e) => { const b = e.target.closest("button"); if (b) showPhoto(b.dataset.id); });
$("#priceList").addEventListener("click", (e) => {
  const b = e.target.closest("button"); if (!b) return;
  toggleService(b.dataset.id);
  $(`#priceList button[data-id="${b.dataset.id}"]`).focus({ preventScroll: true });
});

/* ---------- booking: step 1 (car) ---------- */
$("#make").insertAdjacentHTML("beforeend", MAKES.map((m) => `<option>${m}</option>`).join("") + `<option value="other" data-i18n="make_other">Інша</option>`);
T.en.make_other = "Other";
const thisYear = new Date().getFullYear();
for (let y = thisYear; y >= 1990; y--) F.year.insertAdjacentHTML("beforeend", `<option${y === thisYear - 8 ? " selected" : ""}>${y}</option>`);

function kmHint() {
  const km = parseInt(F.mileage.value.replace(/\D/g, ""), 10);
  const box = $("#kmHint");
  if (!km || km < 100) { box.innerHTML = ""; return; }
  const next = (Math.floor(km / 10000) + 1) * 10000;
  box.innerHTML = M().km_next(next.toLocaleString("uk-UA").replace(/\s/g, " ")) + (km >= 90000 && !state.services.has("chassis") ? M().km_high : "");
}
F.mileage.addEventListener("input", () => {
  const digits = F.mileage.value.replace(/\D/g, "").slice(0, 7);
  F.mileage.value = digits ? Number(digits).toLocaleString("uk-UA").replace(/\s/g, " ") : "";
  F.mileage.classList.remove("is-bad");
  kmHint();
});
form.addEventListener("change", (e) => {
  if (e.target.name === "fuel") { if (F.fuel.value === "ev") state.services.delete("oil"); renderSvc(); renderPrice(); updateSummary(); }
  if (["make", "model", "year"].includes(e.target.name)) { e.target.classList.remove("is-bad"); updateSummary(); }
});
F.model.addEventListener("input", () => { F.model.classList.remove("is-bad"); updateSummary(); });

/* ---------- booking: step 2 (services) ---------- */
function renderSvc() {
  const ev = F.fuel.value === "ev";
  $("#svcList").innerHTML = SERVICES.map((s) => {
    const off = ev && s.id === "oil";
    return `<label${off ? ' class="is-off"' : ""}><input type="checkbox" value="${s.id}"${state.services.has(s.id) ? " checked" : ""}${off ? " disabled" : ""}>
      <span class="svc__box"><b>${L(s)[0]}</b><small>${off ? M().ev_oil : `${M().from} ${money(s.price)} · ${dur(s.min)}`}</small></span></label>`;
  }).join("");
}
$("#svcList").addEventListener("change", (e) => { if (e.target.matches("input")) toggleService(e.target.value, e.target.checked); kmHint(); });

/* ---------- booking: step 3 (date & slots) ---------- */
const isoDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
function hours(d) { const wd = d.getDay(); return wd === 0 ? null : wd === 6 ? [9, 16] : [8, 19]; }
function hash(str) { let h = 2166136261; for (const c of str) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; }
const blockBusy = (date, m) => hash(`${date}|${m}|bay`) % 100 < 27;          // demo: ~1/4 of half-hours already booked
const jobLen = () => Math.min(Math.max(30, Math.ceil(minutes() / 30) * 30), 240); // long jobs: car stays, we only need a start window

function slotsFor(date) {
  const d = new Date(date + "T00:00:00"), h = hours(d);
  if (!h) return [];
  const len = jobLen(), now = Date.now(), out = [];
  for (let m = h[0] * 60; m + len <= h[1] * 60; m += 30) {
    const t = `${pad(m / 60 | 0)}:${pad(m % 60)}`;
    if (new Date(`${date}T${t}:00`) - now < 60 * 60 * 1000) continue;      // past and too-soon times are hidden
    let busy = false;
    for (let b = m; b < m + len; b += 30) if (blockBusy(date, b)) { busy = true; break; }
    out.push({ t, m, busy });
  }
  return out;
}
function renderDates() {
  const days = [];
  for (let i = 0; days.length < 12 && i < 21; i++) {
    const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + i);
    if (hours(d) && slotsFor(isoDate(d)).some((s) => !s.busy)) days.push(d);
  }
  if (!days.some((d) => isoDate(d) === state.date)) state.date = days[0] ? isoDate(days[0]) : "";
  $("#dates").innerHTML = days.map((d) => {
    const iso = isoDate(d), on = iso === state.date;
    return `<button type="button" class="date${on ? " is-on" : ""}" role="radio" aria-checked="${on}" data-date="${iso}">
      <small>${M().wd[d.getDay()]}</small><b>${d.getDate()}</b><small>${M().mon[d.getMonth()]}</small></button>`;
  }).join("");
}
const fmtTime = (m) => `${pad(m / 60 | 0)}:${pad(m % 60)}`;
function renderSlots() {
  const slots = state.date ? slotsFor(state.date) : [];
  if (!slots.some((s) => !s.busy && s.t === state.time)) state.time = "";
  $("#slots").innerHTML = slots.length ? slots.map((s) =>
    `<button type="button" class="slot${s.t === state.time ? " is-on" : ""}" role="radio" aria-checked="${s.t === state.time}" data-time="${s.t}"${s.busy ? " disabled" : ""}>${s.t}</button>`).join("")
    : `<p class="slots__empty">${M().no_slots}</p>`;
  const hint = $("#slotHint");
  if (minutes() > 240) hint.innerHTML = M().long;
  else if (state.time) { const [hh, mm] = state.time.split(":").map(Number); hint.innerHTML = M().ends(state.time, fmtTime(hh * 60 + mm + Math.max(minutes(), 30))); }
  else hint.innerHTML = "";
}
$("#dates").addEventListener("click", (e) => {
  const b = e.target.closest(".date"); if (!b) return;
  state.date = b.dataset.date; renderDates(); renderSlots(); updateSummary();
});
$("#slots").addEventListener("click", (e) => {
  const b = e.target.closest(".slot"); if (!b || b.disabled) return;
  state.time = b.dataset.time; $("#slots").classList.remove("is-bad"); renderSlots(); updateSummary();
});

/* ---------- summary ticket ---------- */
function updateSummary() {
  const make = F.make.value === "other" ? (lang === "en" ? "Other" : "Інша") : F.make.value;
  const car = [make, F.model.value.trim(), make ? F.year.value : ""].filter(Boolean).join(" ");
  $("#sumCar").textContent = car || "—";
  if (state.date && state.time && state.step >= 3) {
    const d = new Date(state.date + "T12:00:00");
    $("#sumWhen").textContent = `${M().wd[d.getDay()]}, ${d.getDate()} ${M().mon[d.getMonth()]} · ${state.time}`;
  } else $("#sumWhen").textContent = "—";
  const items = SERVICES.filter((s) => state.services.has(s.id));
  $("#sumList").innerHTML = items.length ? items.map((s) => `<li><span>${L(s)[0]}</span><span>${money(s.price)}</span></li>`).join("")
    : `<li class="empty">${M().none}</li>`;
  $("#sumDur").textContent = `≈ ${dur(minutes())}`;
  $("#sumTotal").textContent = `${items.length ? M().from + " " : ""}${money(total())}`;
}

/* ---------- steps ---------- */
function msg(text, cls) { const p = $("#formMsg"); p.textContent = text; p.className = "form__msg " + (cls || ""); }
function validate(step) {
  $$(".is-bad", form).forEach((x) => x.classList.remove("is-bad"));
  const bad = [];
  let err = "";
  if (step === 1) {
    if (!F.make.value) bad.push(F.make);
    if (!F.model.value.trim()) bad.push(F.model);
    if (!F.year.value) bad.push(F.year);
    if (bad.length) err = M().e_car;
  } else if (step === 2) {
    if (!state.services.size) { bad.push($("#svcList")); err = M().e_svc; }
  } else if (step === 3) {
    if (!state.date || !state.time) { bad.push($("#slots")); err = M().e_time; }
  } else if (step === 4) {
    if (F.name.value.trim().length < 2) bad.push(F.name);
    const digits = F.phone.value.replace(/\D/g, "");
    if (digits.length < 9 || digits.length > 13 || /[^\d\s()+-]/.test(F.phone.value)) bad.push(F.phone);
    if (bad.length) err = M().e_contact;
  }
  if (bad.length) {
    bad.forEach((x) => x.classList.add("is-bad"));
    (bad[0].focus ? bad[0] : form).focus?.({ preventScroll: false });
    msg(err, "err");
    return false;
  }
  msg("");
  return true;
}
function go(step) {
  state.step = step;
  $$(".pane").forEach((p) => p.classList.toggle("is-on", +p.dataset.pane === step));
  $$("#steps li").forEach((li) => { const s = +li.dataset.s; li.classList.toggle("is-on", s === step); li.classList.toggle("is-done", s < step); });
  $("#back").style.visibility = step === 1 ? "hidden" : "visible";
  $("#next").hidden = step === 4;
  $("#submit").hidden = step !== 4;
  if (step === 3) { renderDates(); renderSlots(); }
  updateSummary();
}
$("#next").addEventListener("click", () => {
  if (!validate(state.step)) return;
  go(state.step + 1);
  const top = $("#bookForm").getBoundingClientRect().top;
  if (top < 0) $("#bookForm").scrollIntoView({ behavior: "smooth", block: "start" });
});
$("#back").addEventListener("click", () => { msg(""); go(Math.max(1, state.step - 1)); });
$("#steps").addEventListener("click", (e) => {
  const li = e.target.closest("li.is-done"); if (li) { msg(""); go(+li.dataset.s); }
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (state.step !== 4) return $("#next").click();
  for (const s of [1, 2, 3]) if (!validate(s)) { go(s); return validate(s); }
  if (!validate(4)) return;
  if (F.website.value) return;                                   // honeypot: bots fill it
  const btn = $("#submit");
  btn.disabled = true;
  msg(M().sending);
  const data = {
    make: F.make.value, model: F.model.value.trim(), year: F.year.value, mileage: F.mileage.value.replace(/\D/g, ""), fuel: F.fuel.value,
    services: [...state.services], total: total(), minutes: minutes(), date: state.date, time: state.time,
    name: F.name.value.trim(), phone: F.phone.value.trim(), comment: F.comment.value.trim(), remind: F.remind.checked, website: F.website.value, lang,
  };
  const done = (text) => {
    msg(text, "ok");
    F.comment.value = ""; state.services.clear(); state.time = "";
    renderPrice(); renderSvc(); go(1);
  };
  try {
    const r = await fetch(BOOK_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    const j = await r.json().catch(() => ({}));
    if (r.ok && j.ok) done(j.demo ? M().demo : M().ok);
    else if (!("ok" in j)) done(M().demo);              // static hosting without the function (e.g. 501/404)
    else msg(M().err, "err");
  } catch (err) {
    done(M().demo);
  } finally {
    btn.disabled = false;
  }
});

/* ---------- symptom helper ---------- */
function renderSymptoms() {
  $("#symChips").innerHTML = SYMPTOMS.map((s) =>
    `<button type="button" class="sym__chip${s.id === state.sym ? " is-on" : ""}" role="radio" aria-checked="${s.id === state.sym}" data-id="${s.id}">${L(s)[0]}</button>`).join("");
  const s = SYMPTOMS.find((x) => x.id === state.sym), card = $("#symCard");
  if (!s) { card.innerHTML = `<p class="sym__empty">${M().pick}</p>`; return; }
  const items = s.svc.map(svc), sum = items.reduce((a, x) => a + x.price, 0), mins = items.reduce((a, x) => a + x.min, 0);
  const all = s.svc.every((id) => state.services.has(id) || (id === "oil" && F.fuel.value === "ev"));
  card.innerHTML = `<h3>${L(s)[0]}</h3><p>${L(s)[1]}</p>
    <p class="sym__lbl">${M().check}</p>
    <div class="sym__svc">${items.map((x) => `<div><span>${L(x)[0]}</span><span class="mono">${M().from} ${money(x.price)}</span></div>`).join("")}</div>
    <button type="button" class="btn" id="symAdd">${all ? M().toBook : M().add} · ${M().from} ${money(sum)} · ≈ ${dur(mins)}</button>
    ${all ? `<p class="sym__added">${M().added}</p>` : ""}`;
}
$("#symChips").addEventListener("click", (e) => {
  const b = e.target.closest(".sym__chip"); if (!b) return;
  state.sym = b.dataset.id; renderSymptoms();
});
$("#symCard").addEventListener("click", (e) => {
  if (!e.target.closest("#symAdd")) return;
  const s = SYMPTOMS.find((x) => x.id === state.sym);
  s.svc.forEach((id) => toggleService(id, true));
  renderSymptoms(); kmHint();
  $("#book").scrollIntoView({ behavior: "smooth" });
});

/* ---------- reveal on scroll ---------- */
const io = new IntersectionObserver((es) => es.forEach((en) => {
  if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
}), { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
$$(".reveal").forEach((el) => io.observe(el));

$("#yr").textContent = new Date().getFullYear();
go(1);
applyLang();
