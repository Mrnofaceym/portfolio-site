/* «Посмішка» — demo dental clinic site.
 * Online booking: service -> doctor -> date -> free slot -> contacts, POST BOOK_URL
 * (Cloudflare Pages Function -> clinic's Telegram; demo mode without keys). */
const BOOK_URL = "/api/dentist-book";

const SERVICES = [
  { id: "check", icon: "🔍", uk: "Консультація та огляд", en: "Consultation & check-up", ukd: "Огляд, 3D-знімок за потреби і план лікування з цінами.", end: "Exam, 3D scan if needed and a priced treatment plan.", price: 0, min: 30, docs: ["olena", "andrii", "maria"] },
  { id: "hygiene", icon: "✨", uk: "Професійна гігієна", en: "Professional cleaning", ukd: "Ультразвук, Air Flow, полірування і фторування.", end: "Ultrasonic scaling, Air Flow, polishing and fluoride.", price: 1400, min: 60, docs: ["olena", "maria"] },
  { id: "caries", icon: "🦷", uk: "Лікування карієсу", en: "Cavity treatment", ukd: "Під мікроскопом, з комп'ютерною анестезією.", end: "Under a microscope, with computer-controlled anaesthesia.", price: 1200, min: 60, docs: ["olena", "andrii"] },
  { id: "implant", icon: "🔩", uk: "Імплантація", en: "Dental implants", ukd: "Імпланти зі Швейцарії, гарантія 5 років.", end: "Swiss implants with a 5-year warranty.", price: 16500, min: 90, docs: ["andrii"] },
  { id: "veneers", icon: "💎", uk: "Вініри", en: "Veneers", ukd: "Керамічні вініри з цифровим дизайном усмішки.", end: "Ceramic veneers with digital smile design.", price: 9800, min: 60, docs: ["andrii", "olena"] },
  { id: "braces", icon: "😁", uk: "Брекети та елайнери", en: "Braces & aligners", ukd: "Сапфірові брекети або прозорі капи.", end: "Sapphire braces or clear aligners.", price: 24000, min: 45, docs: ["maria"] },
  { id: "kids", icon: "🧸", uk: "Дитяча стоматологія", en: "Children's dentistry", ukd: "Адаптаційний візит, лікування молочних зубів.", end: "Gentle first visit, treatment of baby teeth.", price: 700, min: 45, docs: ["maria", "olena"] },
];
const DOCTORS = [
  { id: "olena", img: "img/doc-olena.webp", uk: "Олена Коваль", en: "Olena Koval", ukr: "Терапевт, ендодонтист", enr: "General dentist, endodontist", years: 14, tags: ["Мікроскоп", "Ендодонтія"], tags_en: ["Microscope", "Endodontics"] },
  { id: "andrii", img: "img/doc-andrii.webp", uk: "Андрій Мельник", en: "Andrii Melnyk", ukr: "Хірург-імплантолог, ортопед", enr: "Implant surgeon, prosthodontist", years: 18, tags: ["Імплантація", "Вініри"], tags_en: ["Implants", "Veneers"] },
  { id: "maria", img: "img/doc-maria.webp", uk: "Марія Бойко", en: "Maria Boiko", ukr: "Ортодонт, дитячий стоматолог", enr: "Orthodontist, paediatric dentist", years: 7, tags: ["Брекети", "Діти"], tags_en: ["Braces", "Kids"] },
];
const FAQ = [
  ["Чи буде боляче?", "Ні. Ми використовуємо комп'ютерну анестезію: препарат вводиться повільно і точно, тому навіть укол майже не відчувається.",
   "Will it hurt?", "No. We use computer-controlled anaesthesia: it is delivered slowly and precisely, so even the injection is barely felt."],
  ["Скільки коштує перша консультація?", "Консультація з оглядом безкоштовна. 3D-знімок, якщо він потрібен, — 650 грн.",
   "How much is the first visit?", "The consultation with an exam is free. A 3D scan, if needed, is 650 UAH."],
  ["Чи можна розстрочку?", "Так, на імплантацію, вініри та брекети — розстрочка 0% до 12 місяців від банків-партнерів.",
   "Do you offer instalments?", "Yes — 0% instalments for up to 12 months on implants, veneers and braces."],
  ["Як скасувати або перенести запис?", "Напишіть або зателефонуйте адміністратору не пізніше ніж за 3 години — перенесемо без жодних штрафів.",
   "How do I cancel or reschedule?", "Message or call us at least 3 hours ahead — we'll reschedule free of charge."],
  ["З якого віку приймаєте дітей?", "З 2 років. Перший візит — знайомство з кабінетом у формі гри, без лікування.",
   "From what age do you see children?", "From age 2. The first visit is a playful introduction to the clinic, no treatment."],
];

const T = {
  en: {
    nav_services: "Services", nav_doctors: "Doctors", nav_why: "Why us", nav_faq: "FAQ", nav_contacts: "Contacts", nav_book: "Book",
    hero_pill: "Free slots available today", hero_title: "A healthy smile <span>without pain or stress</span>",
    hero_sub: "We treat under a microscope, with computer-controlled anaesthesia and a fixed price in your treatment plan. The first consultation is free.",
    hero_book: "Book an appointment", hero_prices: "Prices", st_years: "years of experience", st_patients: "patients", st_rating: "Google rating",
    fl_a_t: "5-year warranty", fl_a_p: "on implants", fl_b_t: "No queues", fl_b_p: "book online in a minute",
    srv_eyebrow: "Services & prices", srv_title: "Everything for healthy teeth in one clinic",
    srv_note: "Your doctor fixes the exact price in the treatment plan after the exam — it won't change.",
    why_eyebrow: "Why patients choose us", why_title: "Treatment you don't have to fear",
    w1_t: "Computer anaesthesia", w1_p: "No numb cheeks for half a day — only the tooth being treated goes numb.",
    w2_t: "3D diagnostics in 10 minutes", w2_p: "We spot problems before they hurt and show you the scan.",
    w3_t: "Fixed price", w3_p: "We sign a treatment plan — no surprise extras along the way.",
    w4_t: "Class B sterilisation", w4_p: "Instruments in sealed individual packs, opened in front of you.",
    doc_eyebrow: "Our doctors", doc_title: "Doctors families trust",
    kids_eyebrow: "Children's dentistry", kids_title: "The first visit is a game",
    kids_p: "We introduce your child to the room, let them hold the “magic” tools and only treat when they're ready. A gift and a bravery certificate after every visit.",
    kids_btn: "Book for a child", rev_eyebrow: "Reviews", rev_title: "What patients say",
    rev1: "“I've been scared of dentists since childhood. Here I had a filling for the first time and felt nothing. Thank you, Dr Olena!”",
    rev2: "“Got an implant. They explained everything, showed the 3D scan, and the price in the contract didn't change by a single hryvnia.”",
    rev3: "“Booked online at 11 pm for the morning, and at 9:05 I was already in the chair. Very convenient.”",
    book_eyebrow: "Online booking", book_title: "Book in 1 minute",
    book_p: "Choose a service, a doctor and a free time. Our administrator instantly gets your request in Telegram and confirms it.",
    step1: "Service and doctor", step2: "Date and time", step3: "Your contacts",
    f_service: "Service", f_doctor: "Doctor", f_date: "Date", f_time: "Free time", f_name: "Name", f_phone: "Phone", f_submit: "Confirm booking",
    faq_eyebrow: "FAQ", faq_title: "Frequently asked questions",
    c_eyebrow: "Contacts", c_title: "We look forward to seeing you", c_addr_t: "Address", c_addr: "5 Zdorova St., 2nd floor (demo address)",
    c_hours_t: "Hours", c_hours: "Mon–Fri 9:00–19:00 · Sat 10:00–15:00 · Sun closed", c_phone_t: "Phone", c_btn: "Book online",
    foot_name: "Posmishka Dental Clinic", demo: "Demo project. Website by",
  },
};
const UK_MSG = {
  free: "безкоштовно", from: "від", uah: "грн", min: "хв", choose: "Обрати", years: "років досвіду", no_slots: "На цей день вільних годин немає — оберіть інший.",
  any_doc: "Будь-який лікар", pick_date: "Оберіть дату", check: "Перевірте, будь ласка, виділені поля.", sending: "Надсилаємо…",
  ok: "Готово! Адміністратор підтвердить запис протягом 15 хвилин.", demo: "Демо-режим: на справжньому сайті запис прийшов би в Telegram клініки. Усе інше працює!",
  err: "Не вдалося надіслати. Зателефонуйте нам, будь ласка.", sum: (s, d, dt, t) => `Ви записуєтесь: <b>${s}</b> · ${d} · <b>${dt}, ${t}</b>`,
  wd: ["Нд", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"], mon: ["січ", "лют", "бер", "кві", "тра", "чер", "лип", "сер", "вер", "жов", "лис", "гру"],
};
const EN_MSG = {
  free: "free", from: "from", uah: "UAH", min: "min", choose: "Choose", years: "years of experience", no_slots: "No free time on this day — please pick another.",
  any_doc: "Any doctor", pick_date: "Pick a date", check: "Please check the highlighted fields.", sending: "Sending…",
  ok: "Done! Our administrator will confirm within 15 minutes.", demo: "Demo mode: on a real site this booking would go to the clinic's Telegram. Everything else works!",
  err: "Couldn't send. Please give us a call.", sum: (s, d, dt, t) => `You're booking: <b>${s}</b> · ${d} · <b>${dt}, ${t}</b>`,
  wd: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"], mon: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
};

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const uk = {};
let lang = "uk";
try { lang = localStorage.getItem("lang") || "uk"; } catch (e) {}
const M = () => (lang === "en" ? EN_MSG : UK_MSG);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

/* ---------- rendering ---------- */
function price(s) {
  if (!s.price) return M().free;
  return `${M().from} ${s.price.toLocaleString("uk-UA")} ${M().uah}`;
}
function renderServices() {
  $("#servicesGrid").innerHTML = SERVICES.map((s) => `
    <article class="srv reveal is-in">
      <div class="srv__icon" aria-hidden="true">${s.icon}</div>
      <h3>${esc(lang === "en" ? s.en : s.uk)}</h3>
      <p>${esc(lang === "en" ? s.end : s.ukd)}</p>
      <div class="srv__price"><b>${price(s)}</b><button type="button" data-book="${s.id}">${M().choose} →</button></div>
    </article>`).join("") + `
    <article class="srv srv--cta reveal is-in">
      <div class="srv__icon" aria-hidden="true">💬</div>
      <h3>${lang === "en" ? "Not sure what you need?" : "Не знаєте, що потрібно?"}</h3>
      <p>${lang === "en" ? "Book a free consultation — the doctor will examine you and give a treatment plan with fixed prices." : "Запишіться на безкоштовну консультацію — лікар огляне і складе план лікування з фіксованими цінами."}</p>
      <div class="srv__price"><button type="button" class="btn-mini" data-book="check">${lang === "en" ? "Free consultation" : "Безкоштовна консультація"} →</button></div>
    </article>`;
}
function renderDoctors() {
  $("#doctorsGrid").innerHTML = DOCTORS.map((d) => `
    <article class="doc reveal is-in">
      <img src="${d.img}" alt="${esc(lang === "en" ? d.en : d.uk)}" loading="lazy">
      <div class="doc__body">
        <h3>${esc(lang === "en" ? d.en : d.uk)}</h3>
        <div class="doc__role">${esc(lang === "en" ? d.enr : d.ukr)}</div>
        <div class="doc__meta"><span class="tag">${d.years} ${M().years}</span>${(lang === "en" ? d.tags_en : d.tags).map((t) => `<span class="tag">${esc(t)}</span>`).join("")}</div>
      </div>
    </article>`).join("");
}
function renderFaq() {
  $("#faqList").innerHTML = FAQ.map((f, i) => `
    <details class="reveal is-in"${i === 0 ? " open" : ""}><summary>${esc(lang === "en" ? f[2] : f[0])}</summary><p>${esc(lang === "en" ? f[3] : f[1])}</p></details>`).join("");
}

function applyLang() {
  document.documentElement.lang = lang;
  $$("[data-i18n]").forEach((el) => {
    const k = el.dataset.i18n;
    if (!(k in uk)) uk[k] = el.innerHTML;
    el.innerHTML = lang === "en" && T.en[k] ? T.en[k] : uk[k];
  });
  $("#lang").textContent = lang === "en" ? "UA" : "EN";
  renderServices(); renderDoctors(); renderFaq(); fillServices(); renderDates(); renderSlots(); updateSummary();
}
$("#lang").addEventListener("click", () => {
  lang = lang === "en" ? "uk" : "en";
  try { localStorage.setItem("lang", lang); } catch (e) {}
  applyLang();
});

/* ---------- nav ---------- */
const nav = $("#nav");
const onScroll = () => nav.classList.toggle("is-solid", scrollY > 30);
addEventListener("scroll", onScroll, { passive: true });
onScroll();
$("#burger").addEventListener("click", () => $("#burger").setAttribute("aria-expanded", nav.classList.toggle("is-open")));
$$("#links a").forEach((a) => a.addEventListener("click", () => nav.classList.remove("is-open")));

/* ---------- booking ---------- */
const state = { service: "check", doctor: "", date: "", time: "" };
const fService = $("#fService"), fDoctor = $("#fDoctor");
const pad = (n) => String(n).padStart(2, "0");
const isoDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

function fillServices() {
  fService.innerHTML = SERVICES.map((s) => `<option value="${s.id}">${esc(lang === "en" ? s.en : s.uk)} — ${price(s)}</option>`).join("");
  fService.value = state.service;
  fillDoctors();
}
function fillDoctors() {
  const s = SERVICES.find((x) => x.id === state.service);
  const docs = DOCTORS.filter((d) => s.docs.includes(d.id));
  fDoctor.innerHTML = (docs.length > 1 ? `<option value="">${M().any_doc}</option>` : "") +
    docs.map((d) => `<option value="${d.id}">${esc(lang === "en" ? d.en : d.uk)}</option>`).join("");
  if (!docs.some((d) => d.id === state.doctor)) state.doctor = docs.length > 1 ? "" : docs[0].id;
  fDoctor.value = state.doctor;
}

function hours(d) {                       // working hours per weekday
  const wd = d.getDay();
  if (wd === 0) return null;
  return wd === 6 ? [10, 15] : [9, 19];
}
function hash(str) { let h = 2166136261; for (const c of str) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; }

function slotsFor(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  const h = hours(d);
  if (!h) return [];
  const s = SERVICES.find((x) => x.id === state.service);
  const now = new Date();
  const out = [];
  for (let m = h[0] * 60; m + s.min <= h[1] * 60; m += 30) {
    const t = `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
    const when = new Date(`${dateStr}T${t}:00`);
    if (when - now < 60 * 60 * 1000) continue;                       // at least 1 h from now
    const busy = hash(dateStr + t + (state.doctor || "any")) % 100 < 32;   // demo: ~1/3 already taken
    out.push({ t, busy });
  }
  return out;
}

function renderDates() {
  const box = $("#dates");
  const days = [];
  for (let i = 0, d = new Date(); days.length < 12 && i < 20; i++, d = new Date(Date.now() + i * 864e5)) {
    if (!hours(d)) continue;
    const iso = isoDate(d);
    if (!slotsFor(iso).some((s) => !s.busy)) continue;
    days.push(d);
  }
  if (!days.some((d) => isoDate(d) === state.date)) state.date = days[0] ? isoDate(days[0]) : "";
  box.innerHTML = days.map((d) => {
    const iso = isoDate(d);
    return `<button type="button" class="date${iso === state.date ? " is-on" : ""}" role="radio" aria-checked="${iso === state.date}" data-date="${iso}">
      <small>${M().wd[d.getDay()]}</small><b>${d.getDate()}</b><small>${M().mon[d.getMonth()]}</small></button>`;
  }).join("");
}
function renderSlots() {
  const box = $("#slots");
  const slots = state.date ? slotsFor(state.date) : [];
  if (!slots.some((s) => !s.busy && s.t === state.time)) state.time = "";
  box.innerHTML = slots.length ? slots.map((s) =>
    `<button type="button" class="slot${s.t === state.time ? " is-on" : ""}" role="radio" aria-checked="${s.t === state.time}" data-time="${s.t}"${s.busy ? " disabled" : ""}>${s.t}</button>`).join("")
    : `<p class="slots__empty">${M().no_slots}</p>`;
}
function updateSummary() {
  const el = $("#summary");
  if (!state.date || !state.time) { el.classList.remove("is-on"); return; }
  const s = SERVICES.find((x) => x.id === state.service);
  const d = DOCTORS.find((x) => x.id === state.doctor);
  const dt = new Date(state.date + "T00:00:00");
  el.innerHTML = M().sum(esc(lang === "en" ? s.en : s.uk), esc(d ? (lang === "en" ? d.en : d.uk) : M().any_doc),
    `${M().wd[dt.getDay()]} ${dt.getDate()} ${M().mon[dt.getMonth()]}`, state.time);
  el.classList.add("is-on");
}

fService.addEventListener("change", () => { state.service = fService.value; fillDoctors(); renderDates(); renderSlots(); updateSummary(); });
fDoctor.addEventListener("change", () => { state.doctor = fDoctor.value; renderDates(); renderSlots(); updateSummary(); });
$("#dates").addEventListener("click", (e) => {
  const b = e.target.closest(".date"); if (!b) return;
  state.date = b.dataset.date; renderDates(); renderSlots(); updateSummary();
});
$("#slots").addEventListener("click", (e) => {
  const b = e.target.closest(".slot"); if (!b || b.disabled) return;
  state.time = b.dataset.time; renderSlots(); updateSummary(); $("#slots").classList.remove("is-bad");
});
document.addEventListener("click", (e) => {               // "Choose →" on a service card
  const b = e.target.closest("[data-book]"); if (!b) return;
  state.service = b.dataset.book; fService.value = state.service; fillDoctors(); renderDates(); renderSlots(); updateSummary();
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
  if (bad.length) { bad.forEach((x) => x.classList.add("is-bad")); (bad[0].focus || (() => {})).call(bad[0]); return msg(M().check, "err"); }
  if (f.website.value) return;
  const btn = e.target.querySelector("button[type=submit]");
  btn.disabled = true; msg(M().sending);
  const s = SERVICES.find((x) => x.id === state.service), d = DOCTORS.find((x) => x.id === state.doctor);
  const payload = { service: s.uk, doctor: d ? d.uk : "Будь-який", date: state.date, time: state.time,
                    name: f.name.value.trim(), phone: f.phone.value.trim(), website: f.website.value };
  try {
    const r = await fetch(BOOK_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const j = await r.json().catch(() => ({}));
    if (r.ok && j.ok) { msg(j.demo ? M().demo : M().ok, "ok"); e.target.reset(); state.time = ""; renderSlots(); updateSummary(); }
    else if (!("ok" in j)) msg(M().demo, "ok");
    else msg(M().err, "err");
  } catch (err) { msg(M().demo, "ok"); }
  finally { btn.disabled = false; }
});

/* ---------- reveal ---------- */
const io = new IntersectionObserver((es) => es.forEach((en) => {
  if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
}), { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
$$(".reveal").forEach((el) => io.observe(el));

$("#year").textContent = new Date().getFullYear();
applyLang();
