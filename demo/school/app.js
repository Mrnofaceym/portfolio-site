/* Speak Up — demo online English school.
 * Level test, tariffs with monthly/package toggle, demo checkout (no real card data),
 * trial-lesson form -> POST BOOK_URL (Cloudflare Pages Function -> Telegram). */
const BOOK_URL = "/api/school-book";   // functions/api/school-book.js

/* ---------- i18n ---------- */
const T = {
  en: {
    demo_tag: "Demo project", demo_bar: "A fictional school for a portfolio: prices, teachers and reviews are examples.",
    nav_test: "Level test", nav_courses: "Courses", nav_teachers: "Teachers", nav_pricing: "Pricing", nav_faq: "FAQ", nav_trial: "Free trial",
    hero_pill: "Enrolling new groups — November 2026",
    hero_title: "Speak English <span class=\"hl\">without fear</span> in 4 months",
    hero_sub: "Online lessons for adults with a teacher who adapts to your schedule, job and goals. You do 80% of the talking.",
    hero_trial: "Free trial lesson", hero_test: "Take the level test",
    fact_min: "minutes per lesson", fact_levels: "all levels", fact_rating: "student rating",
    chip1_t: "Lesson starts", chip1_s: "in 10 min · Zoom", chip3_s: "new words a month",
    mq_netflix: "Netflix without subtitles",
    test_eyebrow: "Level test · 2 minutes", test_title: "Find out your level right now",
    test_p: "6 short questions from easy to hard. At the end you get your estimated level and the course to start with. Your teacher will confirm it in the trial lesson.",
    lvl_a1: "Beginner", lvl_a2: "Elementary", lvl_b1: "Intermediate", lvl_b2: "Upper-intermediate",
    courses_eyebrow: "Courses", courses_title: "A programme for your goal",
    c_gen_p: "Grammar, vocabulary and real conversation for travel, relocation and everyday life.", tag_ind: "1:1 or group",
    c_bus_p: "Emails, calls, negotiations and presentations. Cases from your actual job.", tag_1on1: "1:1",
    c_it_p: "Stand-ups, code reviews, interviews with international companies and tech vocabulary.", tag_interview: "mock interviews",
    c_club_p: "Weekly conversation meetups of up to 8 people, on topics from films to careers.", tag_weekly: "every Wednesday",
    how_eyebrow: "How it works", how_title: "From the first lesson to fluent conversation",
    s1_t: "Trial lesson", s1_p: "30 minutes with a methodologist: we define your level, goal and pace.",
    s2_t: "Personal plan", s2_p: "We match a teacher and a programme to your job and schedule.",
    s3_t: "Online lessons", s3_p: "45 minutes in Zoom with an interactive whiteboard. Lesson recordings are saved.",
    s4_t: "15-minute homework", s4_p: "Short exercises in the app and voice messages in a Telegram chat with your teacher.",
    t_eyebrow: "Teachers", t_title: "People you'll want to talk to", t_note: "We hire 1 in 15 candidates. Demo profiles, AI-generated photos.",
    t1_n: "Iryna", t1_r: "Business English · 9 years", t1_p: "Prepares students for negotiations and presentations; spent 4 years at an international company.",
    t2_n: "Dmytro", t2_r: "IT English · 6 years", t2_p: "Former QA engineer. Knows what interviewers ask and what a real stand-up sounds like.",
    t3_n: "Sofiia", t3_r: "General · Speaking Club · 4 years", t3_p: "Runs the speaking club and helps you break the language barrier from lesson one.",
    p_eyebrow: "Pricing", p_title: "Clear plans, no hidden fees", p_month: "Monthly", p_pack: "3-month package", p_save: "up to −15%",
    p_note: "The first lesson is free. If you didn't like a lesson, we'll refund it, no questions asked.",
    r_eyebrow: "Results", r_title: "Progress you can see in numbers",
    r_p: "Every 8 weeks: a progress test and a report on what you can already do and what we work on next.",
    st1: "students have studied with us", st2: "move up a level in 4 months", st3: "teachers on the team", st4: "stay after the first month", r_demo: "* demo data for illustration",
    rev_eyebrow: "Reviews", rev_title: "What students say",
    rev1: "“I'd been ‘learning’ English for years but was afraid to speak. By the third lesson here I had a 10-minute small talk without even noticing.”",
    rev1_n: "Oksana", rev1_s: "A2 → B1 · General · demo review",
    rev2: "“I was preparing for an interview with a European company. Three mock interviews with Dmytro and I got the offer on the first try.”",
    rev2_n: "Artem", rev2_s: "B1 → B2 · IT English · demo review",
    rev3: "“Love that lessons are at 7:30 am, before work. Homework in the app takes 15 minutes on the metro.”",
    rev3_n: "Nataliia", rev3_s: "B1 · Business · demo review",
    ava1: "O", ava2: "A", ava3: "N",
    faq_eyebrow: "Questions", faq_title: "FAQ",
    q1: "I don't know any English. Is this for me?", a1: "Yes. General English starts at A1: in the first lessons the teacher speaks slowly and explains difficult things in Ukrainian.",
    q2: "What do I need for lessons?", a2: "A laptop or tablet, a headset with a microphone and a stable connection. No textbooks needed — all materials are on the platform.",
    q3: "Can I reschedule or skip a lesson?", a3: "You can reschedule for free with 8 hours' notice. Unused package lessons roll over to the next month.",
    q4: "Can I change my teacher?", a4: "Of course. Message your manager and we'll find another teacher within a day at no extra cost.",
    q5: "How do I pay? Are instalments available?", a5: "By card online, Apple Pay or Google Pay. The 3-month package can be paid in bank instalments (in a real project).",
    q6: "Do you issue a certificate?", a6: "Yes, after finishing a level you get a personal school certificate with your final test results.",
    tr_eyebrow: "Trial lesson", tr_title: "Book a free trial lesson",
    tr_p: "Your request goes straight to our manager's Telegram — we'll message you within 15 minutes and find a convenient time.",
    perk1: "30 minutes with a methodologist", perk2: "Accurate level assessment", perk3: "A personal study plan",
    f_name: "Name", f_contact: "Phone or Telegram", f_contact_ph: "+380 __ ___ __ __ or @username", f_level: "Level", o_unknown: "Not sure",
    f_course: "Course", f_time: "Preferred time", tm_morning: "Morning 7–11", tm_day: "Day 11–17", tm_evening: "Evening 17–22", tm_weekend: "Weekends",
    f_comment: "Comment", f_comment_ph: "Goal: interview, relocation, travel…", f_submit: "Book a trial lesson",
    foot_p: "Online English school for adults.", foot_nav: "Navigation", foot_contacts: "Contacts", foot_demo_c: "(demo contacts)",
    demo: "Demo project. Website by",
    co_warn: "Demo payment — no money is charged", co_title: "Checkout", co_card: "Card",
    co_hint: "There are no fields for a real card here. In a real project this button would open a secure LiqPay, WayForPay or Stripe page.",
    co_pay: "Pay (demo)", co_ok_t: "Payment successful (demo)", co_ok_order: "Order",
    co_ok_p: "No money was charged. On a real site the student would get a receipt by e-mail and the manager a Telegram notification.",
    co_ok_btn: "Great",
    aria_close: "Close", aria_period: "Billing period", aria_method: "Payment method", aria_card: "Demo card", aria_menu: "Menu",
  },
};

/* texts generated by JS */
const D = {
  uk: {
    q_task: "Оберіть правильний варіант", back: "← Назад", q_of: "з", restart: "Пройти ще раз",
    res_score: "Правильних відповідей: {n} з 6", res_book: "Записатися на пробний урок", res_your: "Ваш орієнтовний рівень",
    lv: {
      A1: ["Початковий", "Ви знаєте базові слова та фрази. Почнемо з вимови, простих конструкцій і впевненості.", "General English з рівня A1, 2 уроки на тиждень"],
      A2: ["Елементарний", "Ви розумієте прості тексти й можете розповісти про себе. Час прибрати страх говорити.", "General English + Speaking Club"],
      B1: ["Середній", "Ви вже спілкуєтеся на знайомі теми. Далі — робоча лексика та складніша граматика.", "Business English або IT English, 1:1"],
      B2: ["Вище середнього", "Ви впевнено говорите. Відшліфуємо точність, вимову та підготуємося до співбесід.", "Business / IT English + мок-співбесіди"],
    },
    badge: "Результат тесту: {lv} ({n}/6) — викладач врахує його на пробному уроці",
    per_month: "/ міс", per_lesson: "≈ {p} за урок", pack_total: "{t} за 3 місяці · ≈ {p} за урок", choose: "Обрати тариф", popular: "Популярний",
    period_m: "1 місяць", period_p: "3 місяці (пакет)",
    sum_plan: "Тариф", sum_period: "Період", sum_lessons: "Уроків", sum_price: "Вартість", sum_disc: "Знижка пакета", sum_total: "До сплати",
    msg_check: "Перевірте, будь ласка, виділені поля.", msg_sending: "Надсилаємо…",
    msg_ok: "Дякуємо! Заявку отримано — напишемо вам протягом 15 хвилин.",
    msg_demo: "Демо-режим: на справжньому сайті заявка прийшла б у Telegram школи. Усе інше працює!",
    msg_err: "Не вдалося надіслати. Напишіть нам у Telegram або спробуйте за хвилину.",
  },
  en: {
    q_task: "Choose the correct option", back: "← Back", q_of: "of", restart: "Take it again",
    res_score: "Correct answers: {n} of 6", res_book: "Book a trial lesson", res_your: "Your estimated level",
    lv: {
      A1: ["Beginner", "You know basic words and phrases. We'll start with pronunciation, simple structures and confidence.", "General English from A1, 2 lessons a week"],
      A2: ["Elementary", "You understand simple texts and can talk about yourself. Time to lose the fear of speaking.", "General English + Speaking Club"],
      B1: ["Intermediate", "You can talk about familiar topics. Next: work vocabulary and more advanced grammar.", "Business English or IT English, 1:1"],
      B2: ["Upper-intermediate", "You speak confidently. We'll polish accuracy and pronunciation and prepare for interviews.", "Business / IT English + mock interviews"],
    },
    badge: "Test result: {lv} ({n}/6) — your teacher will take it into account in the trial lesson",
    per_month: "/ month", per_lesson: "≈ {p} per lesson", pack_total: "{t} for 3 months · ≈ {p} per lesson", choose: "Choose plan", popular: "Popular",
    period_m: "1 month", period_p: "3 months (package)",
    sum_plan: "Plan", sum_period: "Period", sum_lessons: "Lessons", sum_price: "Price", sum_disc: "Package discount", sum_total: "Total",
    msg_check: "Please check the highlighted fields.", msg_sending: "Sending…",
    msg_ok: "Thank you! We've received your request and will message you within 15 minutes.",
    msg_demo: "Demo mode: on a real site this request would go to the school's Telegram. Everything else works!",
    msg_err: "Couldn't send. Message us on Telegram or try again in a minute.",
  },
};

const uk = {};                                      // original Ukrainian texts are taken from the HTML
let lang = "uk";
try { lang = localStorage.getItem("lang") === "en" ? "en" : "uk"; } catch (e) {}

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const d = (k) => D[lang][k];
const fill = (s, o) => s.replace(/\{(\w+)\}/g, (_, k) => o[k]);
const num = (n) => n.toLocaleString(lang === "en" ? "en-US" : "uk-UA");
const money = (n) => num(n) + " ₴";

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
  $$("[data-i18n-aria]").forEach((el) => {
    const k = el.dataset.i18nAria;
    if (!(k in uk)) uk[k] = el.getAttribute("aria-label");
    el.setAttribute("aria-label", lang === "en" && T.en[k] ? T.en[k] : uk[k]);
  });
  $("#lang").textContent = lang === "en" ? "UA" : "EN";
  renderQuiz();
  renderPlans();
  renderBadge();
  if (!$("#checkout").hidden && order) renderSummary();
  const m = $("#formMsg");
  if (m.dataset.k) m.textContent = d(m.dataset.k);
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

/* ---------- level test ---------- */
const QUIZ = [
  { q: "She <u>___</u> a teacher from Lviv.", o: ["are", "is", "am", "be"], a: 1 },
  { q: "I <u>___</u> to the seaside last summer.", o: ["go", "gone", "went", "have go"], a: 2 },
  { q: "How long <u>___</u> in Kyiv?", o: ["do you live", "are you living", "you lived", "have you lived"], a: 3 },
  { q: "If I <u>___</u> more free time, I would learn Spanish.", o: ["had", "have", "will have", "would have"], a: 0 },
  { q: "The report <u>___</u> by Friday, otherwise the client will be upset.", o: ["must finish", "must be finished", "must finishing", "must have finish"], a: 1 },
  { q: "I'd rather you <u>___</u> my laptop without asking.", o: ["don't use", "not use", "didn't use", "won't use"], a: 2 },
];
const LEVEL_COURSE = { A1: "general", A2: "general", B1: "business", B2: "it" };
let step = 0;
const answers = [];
let result = null;            // { level, score } once finished
let booked = null;            // test result passed to the form

const levelFor = (n) => (n <= 1 ? "A1" : n <= 3 ? "A2" : n <= 5 ? "B1" : "B2");

function renderQuiz() {
  const body = $("#qBody");
  const done = step >= QUIZ.length;
  $("#qBar").style.width = `${(done ? 1 : step / QUIZ.length) * 100}%`;
  $("#qCount").textContent = done ? "✓" : `${step + 1} / ${QUIZ.length}`;
  if (done) {
    const score = answers.reduce((s, v, i) => s + (v === QUIZ[i].a ? 1 : 0), 0);
    const level = levelFor(score);
    result = { level, score };
    const [name, text, course] = d("lv")[level];
    body.innerHTML = `<div class="res">
      <div class="res__badge">${level}</div>
      <p class="res__score">${fill(d("res_score"), { n: score })}</p>
      <h3>${d("res_your")}: ${name}</h3>
      <p>${text}</p>
      <div class="res__rec">→ <b>${course}</b></div>
      <div class="res__cta">
        <button type="button" class="btn btn--lime" id="qBook">${d("res_book")}</button>
        <button type="button" class="linkbtn" id="qRestart">${d("restart")}</button>
      </div></div>`;
    return;
  }
  const it = QUIZ[step];
  body.innerHTML = `<div class="q" key="${step}">
    <p class="q__task">${d("q_task")}</p>
    <p class="q__text">${it.q}</p>
    <div class="q__opts">${it.o.map((o, i) => `<button type="button" class="opt${answers[step] === i ? " is-picked" : ""}" data-i="${i}">${o}</button>`).join("")}</div>
    </div>
    <div class="quiz__nav"><button type="button" class="linkbtn" id="qBack" ${step ? "" : "disabled"}>${d("back")}</button></div>`;
}

let advancing = false;
$("#quiz").addEventListener("click", (e) => {
  const opt = e.target.closest(".opt");
  if (opt && !advancing) {
    answers[step] = +opt.dataset.i;
    $$(".opt", $("#quiz")).forEach((b) => b.classList.toggle("is-picked", b === opt));
    advancing = true;
    setTimeout(() => { step++; advancing = false; renderQuiz(); }, 320);
    return;
  }
  if (e.target.closest("#qBack") && step > 0) { step--; renderQuiz(); }
  if (e.target.closest("#qRestart")) { step = 0; answers.length = 0; result = null; renderQuiz(); }
  if (e.target.closest("#qBook") && result) {
    booked = { ...result };
    const f = $("#trialForm").elements;
    f.level.value = result.level;
    f.course.value = LEVEL_COURSE[result.level];
    renderBadge();
    $("#trial").scrollIntoView({ behavior: "smooth" });
    setTimeout(() => f.name.focus({ preventScroll: true }), 700);
  }
});

function renderBadge() {
  const b = $("#testBadge");
  if (!booked) { b.hidden = true; return; }
  b.hidden = false;
  b.textContent = "✓ " + fill(d("badge"), { lv: booked.level, n: booked.score });
}

/* ---------- pricing ---------- */
const PLANS = [
  { id: "group", lessons: 8, month: 2400, disc: 10,
    uk: { name: "Міні-група", desc: "Група до 6 людей одного рівня", f: ["8 групових уроків на місяць", "Speaking Club 1 раз на тиждень", "Домашка в застосунку", "Записи уроків"] },
    en: { name: "Mini-group", desc: "Up to 6 people of the same level", f: ["8 group lessons a month", "Speaking Club once a week", "Homework in the app", "Lesson recordings"] } },
  { id: "solo", lessons: 8, month: 4800, disc: 15, pop: true,
    uk: { name: "Індивідуальний", desc: "1:1 з викладачем у зручний час", f: ["8 індивідуальних уроків на місяць", "Програма під вашу ціль", "Speaking Club без обмежень", "Telegram-чат з викладачем", "Звіт про прогрес кожні 8 тижнів"] },
    en: { name: "Individual", desc: "1:1 with a teacher at a time that suits you", f: ["8 one-to-one lessons a month", "A programme built around your goal", "Unlimited Speaking Club", "Telegram chat with your teacher", "Progress report every 8 weeks"] } },
  { id: "intense", lessons: 12, month: 6900, disc: 15,
    uk: { name: "Інтенсив", desc: "Для співбесіди чи переїзду", f: ["12 індивідуальних уроків на місяць", "Мок-співбесіди англійською", "Перевірка резюме та листів", "Speaking Club без обмежень", "Пріоритетний вибір викладача"] },
    en: { name: "Intensive", desc: "For an interview or relocation", f: ["12 one-to-one lessons a month", "Mock job interviews in English", "CV and e-mail review", "Unlimited Speaking Club", "Priority teacher choice"] } },
];
let period = "month";
const round10 = (n) => Math.round(n / 10) * 10;
function priceOf(p, per = period) {
  const months = per === "pack" ? 3 : 1;
  const perMonth = per === "pack" ? round10(p.month * (1 - p.disc / 100)) : p.month;
  const total = perMonth * months;
  return { months, perMonth, total, base: p.month * months, save: p.month * months - total, lesson: round10(perMonth / p.lessons) };
}

function renderPlans(animate) {
  $("#plans").innerHTML = PLANS.map((p) => {
    const L = p[lang], pr = priceOf(p);
    const pack = period === "pack";
    return `<article class="plan${p.pop ? " plan--pop" : ""}">
      ${p.pop ? `<span class="plan__flag">★ ${d("popular")}</span>` : ""}
      <h3 class="plan__name">${L.name}</h3>
      <p class="plan__desc">${L.desc}</p>
      <div class="plan__price">${pack ? `<span class="plan__old">${money(p.month)}</span>` : ""}<b class="${animate ? "is-flip" : ""}">${num(pr.perMonth)}<span class="cur">₴</span></b><small>${d("per_month")}</small></div>
      <p class="plan__per">${pack ? fill(d("pack_total"), { t: money(pr.total), p: money(pr.lesson) }) + `<span class="plan__disc">−${p.disc}%</span>` : fill(d("per_lesson"), { p: money(pr.lesson) })}</p>
      <ul>${L.f.map((x) => `<li>${x}</li>`).join("")}</ul>
      <button type="button" class="btn${p.pop ? " btn--lime" : ""}" data-plan="${p.id}">${d("choose")}</button>
    </article>`;
  }).join("");
}

$("#billing").addEventListener("click", (e) => {
  const b = e.target.closest(".toggle__opt");
  if (!b || b.dataset.period === period) return;
  period = b.dataset.period;
  $$(".toggle__opt").forEach((x) => { x.classList.toggle("is-active", x === b); x.setAttribute("aria-checked", x === b); });
  renderPlans(true);
});

/* ---------- demo checkout ---------- */
const modal = $("#checkout");
let order = null, lastFocus = null;

function renderSummary() {
  const p = PLANS.find((x) => x.id === order.plan), pr = priceOf(p, order.period);
  const rows = [
    [d("sum_plan"), p[lang].name],
    [d("sum_period"), d(order.period === "pack" ? "period_p" : "period_m")],
    [d("sum_lessons"), p.lessons * pr.months],
    [d("sum_price"), money(pr.base)],
  ];
  if (pr.save) rows.push([`${d("sum_disc")} −${p.disc}%`, "−" + money(pr.save), "disc"]);
  rows.push([d("sum_total"), money(pr.total), "total"]);
  $("#coSum").innerHTML = rows.map(([k, v, c]) => `<dt class="${c || ""}">${k}</dt><dd class="${c || ""}">${v}</dd>`).join("");
  $("#coPayAmt").textContent = "· " + money(pr.total);
}

function openCheckout(planId) {
  order = { plan: planId, period };
  lastFocus = document.activeElement;
  $("#coMain").hidden = false;
  $("#coDone").hidden = true;
  $("#coPay").disabled = false;
  $("#coPay").classList.remove("is-busy");
  renderSummary();
  modal.hidden = false;
  document.body.classList.add("is-locked");
  $(".modal__x").focus();
}
function closeCheckout() {
  modal.hidden = true;
  document.body.classList.remove("is-locked");
  $$(".confetti").forEach((c) => c.remove());
  if (lastFocus) lastFocus.focus({ preventScroll: true });
}

$("#plans").addEventListener("click", (e) => {
  const b = e.target.closest("[data-plan]");
  if (b) openCheckout(b.dataset.plan);
});
modal.addEventListener("click", (e) => { if (e.target.closest("[data-close]")) closeCheckout(); });
addEventListener("keydown", (e) => {
  if (modal.hidden) return;
  if (e.key === "Escape") closeCheckout();
  if (e.key === "Tab") {                                   // keep focus inside the dialog
    const f = $$("button:not([disabled])", $(".modal__box")).filter((x) => x.offsetParent);
    if (!f.length) return;
    if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
  }
});
$(".co__methods").addEventListener("click", (e) => {
  const m = e.target.closest(".co__m");
  if (m) $$(".co__m").forEach((x) => x.classList.toggle("is-active", x === m));
});
$("#coPay").addEventListener("click", () => {
  const btn = $("#coPay");
  btn.disabled = true;
  btn.classList.add("is-busy");
  setTimeout(() => {                                       // fake processing; nothing is sent anywhere
    $("#coOrder").textContent = "#SU-" + String(Date.now()).slice(-6);
    $("#coMain").hidden = true;
    $("#coDone").hidden = false;
    $("#coDone .btn").focus();
    confetti();
  }, 1400);
});
function confetti() {
  const box = $(".modal__box");
  const colors = ["#C8F55A", "#5848E8", "#FF6F59", "#FFD66B"];
  for (let i = 0; i < 36; i++) {
    const c = document.createElement("i");
    c.className = "confetti";
    c.style.left = Math.random() * 100 + "%";
    c.style.background = colors[i % colors.length];
    c.style.setProperty("--dx", (Math.random() - 0.5) * 160 + "px");
    c.style.setProperty("--r", Math.random() * 720 + "deg");
    c.style.animationDelay = Math.random() * 0.3 + "s";
    box.appendChild(c);
    setTimeout(() => c.remove(), 2000);
  }
}

/* ---------- trial form ---------- */
const form = $("#trialForm");
function msg(k, cls) { const p = $("#formMsg"); p.dataset.k = k || ""; p.textContent = k ? d(k) : ""; p.className = "form__msg " + (cls || ""); }
const validContact = (v) => {
  v = v.trim();
  if (/^@?[a-zA-Z][a-zA-Z0-9_]{4,31}$/.test(v)) return true;      // Telegram username
  const digits = v.replace(/\D/g, "");
  return /^[\d\s()+-]+$/.test(v) && digits.length >= 9 && digits.length <= 15;
};
function done(k) { msg(k, "ok"); form.reset(); booked = null; renderBadge(); }
$$("input, select, textarea", form).forEach((x) => x.addEventListener("input", () => x.classList.remove("is-bad")));

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const f = form.elements;
  const bad = [];
  if (f.name.value.trim().length < 2) bad.push(f.name);
  if (!validContact(f.contact.value)) bad.push(f.contact);
  $$(".is-bad", form).forEach((x) => x.classList.remove("is-bad"));
  if (bad.length) { bad.forEach((x) => x.classList.add("is-bad")); bad[0].focus(); return msg("msg_check", "err"); }
  if (f.website.value) return;                                   // honeypot: bots fill it
  const btn = form.querySelector("button[type=submit]");
  btn.disabled = true;
  msg("msg_sending");
  const data = Object.fromEntries(new FormData(form));
  if (booked) data.test = `${booked.level} (${booked.score}/6)`;
  data.lang = lang;
  try {
    const r = await fetch(BOOK_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    const j = await r.json().catch(() => ({}));
    if (r.ok && j.ok) done(j.demo ? "msg_demo" : "msg_ok");
    else if (!("ok" in j)) done("msg_demo");          // static hosting without the function
    else msg("msg_err", "err");
  } catch (err) {
    done("msg_demo");
  } finally {
    btn.disabled = false;
  }
});

/* ---------- counters & reveal ---------- */
function countUp(el) {
  const to = +el.dataset.count, suf = el.dataset.suffix || "", t0 = performance.now(), dur = 1400;
  const tick = (now) => {
    const k = Math.min(1, (now - t0) / dur), v = Math.round(to * (1 - Math.pow(1 - k, 3)));
    el.textContent = v.toLocaleString("uk-UA") + suf;
    if (k < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const io = new IntersectionObserver((es) => es.forEach((en) => {
  if (!en.isIntersecting) return;
  en.target.classList.add("is-in");
  $$("[data-count]", en.target).forEach((c) => (reduce ? (c.textContent = (+c.dataset.count).toLocaleString("uk-UA") + (c.dataset.suffix || "")) : countUp(c)));
  io.unobserve(en.target);
}), { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
$$(".reveal").forEach((el) => io.observe(el));

$("#year").textContent = new Date().getFullYear();
applyLang();
