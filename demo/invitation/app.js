/* Wedding invitation demo: countdown, personal greeting (?guest=Ім'я), .ics, RSVP, maps, music. */
const RSVP_URL = "/api/invitation-rsvp";
const WEDDING = new Date("2027-03-20T15:00:00+02:00");   // Kyiv, winter time until 28.03
const END = new Date("2027-03-20T23:30:00+02:00");
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
$("#year").textContent = new Date().getFullYear();

/* ---------- countdown ---------- */
const units = Object.fromEntries($$("#count b").map((b) => [b.dataset.u, b]));
const pad = (n) => String(n).padStart(2, "0");
function tick() {
  let s = Math.max(0, Math.floor((WEDDING - Date.now()) / 1000));
  const d = Math.floor(s / 86400); s %= 86400;
  const v = { d, h: Math.floor(s / 3600), m: Math.floor(s / 60) % 60, s: s % 60 };
  for (const k in v) units[k].textContent = k === "d" ? v[k] : pad(v[k]);
}
tick(); setInterval(tick, 1000);

/* ---------- personal greeting: ?guest=Тарас  |  ?guest=Тарас і Ірина ---------- */
const FEM_EXC = /^(Любов|Нінель|Есфір|Рут|Юдіф|Ассоль)$/i;
const MASC_A = /^(Микола|Ілля|Кузьма|Сава|Хома|Лука|Фома|Мина|Никита|Нікіта|Сава)$/i;
function vocative(name) {
  const n = name.trim();
  if (n.length < 2 || !/^[А-ЯҐЄІЇа-яґєії'’ʼ-]+$/.test(n)) return { v: n, fem: null };
  const low = n.toLowerCase();
  const end = (s) => low.endsWith(s);
  const cut = (k, add) => n.slice(0, n.length - k) + add;
  if (/[ая]$/.test(low)) {
    const fem = !MASC_A.test(n);
    if (end("ія")) return { v: cut(1, "є"), fem };          // Марія → Маріє
    if (end("я")) return { v: cut(1, "ю"), fem };           // Таня → Таню, Ілля → Іллю
    if (end("ка") || end("га") || end("ха")) return { v: cut(1, "о"), fem }; // Ольга → Ольго
    return { v: cut(1, "о"), fem };                          // Олена → Олено, Микола → Миколо
  }
  if (FEM_EXC.test(n)) return { v: n + "е", fem: true };
  if (end("ій") || end("ай") || end("ей")) return { v: cut(1, "ю"), fem: false };  // Андрій → Андрію
  if (end("ь")) return { v: cut(1, "ю"), fem: false };      // Василь → Василю
  if (end("ко")) return { v: cut(1, "у"), fem: false };     // Марко → Марку
  if (end("о")) return { v: cut(1, "е"), fem: false };      // Петро → Петре
  if (end("к") || end("г") || end("х")) return { v: n + "у", fem: false };      // Олег → Олегу
  return { v: n + "е", fem: false };                         // Тарас → Тарасе
}
function greeting(raw) {
  const people = raw.split(/\s*(?:,|&|\+|\sі\s|\sта\s|\sй\s)\s*/).map((p) => p.trim()).filter(Boolean).slice(0, 4);
  if (!people.length) return null;
  const firsts = people.map((p) => vocative(p.split(/\s+/)[0]));
  if (firsts.length > 1) {
    const names = firsts.map((f) => f.v);
    return { title: `Дорогі ${names.slice(0, -1).join(", ")} та ${names.at(-1)}`, plural: true };
  }
  const f = firsts[0];
  const adj = f.fem === null ? "Дорогий гостю" : f.fem ? "Дорога" : "Дорогий";
  return { title: f.fem === null ? `${f.v}, ${adj.toLowerCase()}` : `${adj} ${f.v}`, plural: false, fem: f.fem };
}
const guestRaw = (new URLSearchParams(location.search).get("guest") || "").replace(/[<>]/g, "").trim().slice(0, 60);
const greet = guestRaw && greeting(guestRaw);
if (greet) {
  $("#greet").textContent = `${greet.title}, ми чекаємо саме на вас!`;
  $("#greet").hidden = false;
  const it = $("#inviteText");
  it.textContent = it.textContent.replace("Дорогі рідні та друзі!", `${greet.title}!`);
  $("#fName").value = guestRaw;
  if (greet.plural) $("#fGuests").value = String(Math.min(4, guestRaw.split(/,|&|\+|\sі\s|\sта\s|\sй\s/).length));
  document.title = `${greet.title}, запрошуємо на весілля — Олена & Андрій`;
}

/* ---------- add to calendar (.ics) ---------- */
const icsDate = (d) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
function downloadIcs() {
  const ics = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//site-cloud.uk//invitation demo//UK", "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:olena-andrii-20270320@site-cloud.uk`,
    `DTSTAMP:${icsDate(new Date())}`,
    `DTSTART:${icsDate(WEDDING)}`,
    `DTEND:${icsDate(END)}`,
    "SUMMARY:Весілля Олени та Андрія 💍",
    "LOCATION:Садиба «Тиха гавань»\\, с. Вишеньки\\, вул. Садова\\, 1 (демо-адреса)",
    "DESCRIPTION:Збір гостей о 14:30\\, церемонія о 15:00\\, банкет о 17:30. Дрес-код: ніжні природні відтінки.\\nЗапрошення: " + location.href.split("#")[0],
    "BEGIN:VALARM", "TRIGGER:-P1D", "ACTION:DISPLAY", "DESCRIPTION:Завтра весілля Олени та Андрія!", "END:VALARM",
    "END:VEVENT", "END:VCALENDAR",
  ].join("\r\n");
  const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: "olena-andrii-wedding.ics" });
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
$$("[data-ics]").forEach((b) => b.addEventListener("click", downloadIcs));

/* ---------- map switch ---------- */
const PLACES = [
  { lat: 49.2331, lon: 28.4682 },   // garden (demo)
  { lat: 49.2318, lon: 28.4710 },   // banquet hall (demo)
];
$$("[data-map]").forEach((b) => b.addEventListener("click", () => {
  const p = PLACES[+b.dataset.map], d = 0.035;
  $("#map").src = `https://www.openstreetmap.org/export/embed.html?bbox=${p.lon - d * 2}%2C${p.lat - d}%2C${p.lon + d * 2}%2C${p.lat + d}&layer=mapnik&marker=${p.lat}%2C${p.lon}`;
  $("#mapLink").href = `https://www.openstreetmap.org/?mlat=${p.lat}&mlon=${p.lon}#map=16/${p.lat}/${p.lon}`;
  $(".route").scrollIntoView({ behavior: "smooth", block: "center" });
}));

/* ---------- RSVP ---------- */
const form = $("#rsvpForm"), ifYes = $("#ifYes"), err = $("#formErr");
const attendVal = () => form.attend.value;
function syncAttend() {
  const no = attendVal() === "no";
  ifYes.classList.toggle("is-off", no);
  $$("input, select", ifYes).forEach((el) => (el.disabled = no));
}
form.addEventListener("change", (e) => { if (e.target.name === "attend") { syncAttend(); $(".choice--2").classList.remove("is-bad"); err.textContent = ""; } });
form.name.addEventListener("input", () => form.name.classList.remove("is-bad"));
syncAttend();

const FOOD = { meat: "м'ясо", fish: "риба", veg: "вегетаріанське" };
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  err.textContent = "";
  const name = form.name.value.trim(), attend = attendVal();
  let bad = false;
  if (name.length < 2) { form.name.classList.add("is-bad"); bad = true; }
  if (!attend) { $(".choice--2").classList.add("is-bad"); bad = true; }
  if (bad) { err.textContent = "Будь ласка, вкажіть ім'я та чи зможете прийти."; (name.length < 2 ? form.name : $(".choice--2 input")).focus(); return; }

  const data = {
    name, attend,
    guests: attend === "yes" ? +form.guests.value : 0,
    food: attend === "yes" ? form.food.value : "",
    song: attend === "yes" ? form.song.value.trim() : "",
    comment: form.comment.value.trim(),
    invited: guestRaw,
    website: form.website.value,
  };
  const btn = $("#sendBtn"); btn.disabled = true; btn.textContent = "Надсилаємо…";
  try {
    const r = await fetch(RSVP_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j.ok) throw new Error(j.error || r.status);
    showDone(data);
  } catch {
    err.textContent = "Не вдалося надіслати 😔 Спробуйте ще раз або зателефонуйте координатору: +380 00 000 00 00.";
    btn.disabled = false; btn.textContent = "Надіслати відповідь";
  }
});
function showDone(d) {
  const g = greeting(d.name);
  const first = g && /^Дорог(ий|а|і) /.test(g.title) ? g.title.replace(/^Дорог(ий|а|і) /, "") : d.name.split(/\s+/)[0];
  form.hidden = true; $("#done").hidden = false;
  if (d.attend === "yes") {
    $("#doneTitle").textContent = `Дякуємо, ${first}! 🤍`;
    $("#doneText").textContent = `Ми чекаємо на вас 20 березня о 14:30. Записали: ${d.guests} ${d.guests === 1 ? "гість" : "гостя"}, меню — ${FOOD[d.food]}${d.song ? `, а діджей уже шукає «${d.song}»` : ""}.`;
  } else {
    $("#doneTitle").textContent = `Шкода, ${first}!`;
    $("#doneText").textContent = "Дякуємо, що повідомили. Ми обов'язково піднімемо келих за вас 🥂";
    $("#done [data-ics]").hidden = true;
  }
  $("#done").scrollIntoView({ behavior: "smooth", block: "center" });
}

/* ---------- background music: an original music-box tune synthesized in the browser (no audio files, no copyright) ---------- */
let audio = null;
function startMusic() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const master = ctx.createGain(); master.gain.value = 0.0001;
  const delay = ctx.createDelay(); delay.delayTime.value = 0.36;
  const fb = ctx.createGain(); fb.gain.value = 0.32;
  const wet = ctx.createGain(); wet.gain.value = 0.35;
  delay.connect(fb).connect(delay); delay.connect(wet).connect(master);
  master.connect(ctx.destination);
  master.gain.exponentialRampToValueAtTime(0.22, ctx.currentTime + 1.5);
  const hz = (m) => 440 * 2 ** ((m - 69) / 12);
  // F – Dm – B♭ – C, gentle arpeggios
  const chords = [[65, 69, 72, 77], [62, 65, 69, 74], [58, 62, 65, 70], [60, 64, 67, 72]];
  const melody = [81, 79, 77, 76, 77, 74, 72, 74, 74, 72, 70, 72, 76, 74, 72, null];
  const beat = 0.42;
  function note(m, t, vol, len) {
    const o = ctx.createOscillator(), o2 = ctx.createOscillator(), g = ctx.createGain();
    o.type = "sine"; o2.type = "triangle"; o.frequency.value = hz(m); o2.frequency.value = hz(m) * 2;
    const g2 = ctx.createGain(); g2.gain.value = 0.15;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    o.connect(g); o2.connect(g2).connect(g); g.connect(master); g.connect(delay);
    o.start(t); o2.start(t); o.stop(t + len + 0.05); o2.stop(t + len + 0.05);
  }
  let bar = 0, next = ctx.currentTime + 0.1;
  const timer = setInterval(() => {
    while (next < ctx.currentTime + 1.5) {
      const ch = chords[bar % 4];
      for (let i = 0; i < 4; i++) {
        const t = next + i * beat;
        note(ch[0] - 12, t, 0.10, 1.6);
        note(ch[(i % 3) + 1], t + beat / 2, 0.06, 1.1);
        const m = melody[(bar % 4) * 4 + i];
        if (m && bar % 8 >= 4) note(m, t, 0.09, 1.4);
      }
      next += beat * 4; bar++;
    }
  }, 300);
  return { ctx, master, timer };
}
function stopMusic() {
  const { ctx, master, timer } = audio;
  master.gain.cancelScheduledValues(ctx.currentTime);
  master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
  master.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6);
  setTimeout(() => { clearInterval(timer); ctx.close(); }, 700);
  audio = null;
}
$("#music").addEventListener("click", (e) => {
  const on = !audio;
  try { if (on) audio = startMusic(); else stopMusic(); } catch { return; }
  e.currentTarget.setAttribute("aria-pressed", String(on));
});

/* ---------- nav, reveal, sticky ---------- */
const nav = $("#nav"), burger = $("#burger");
const onScroll = () => nav.classList.toggle("is-solid", scrollY > innerHeight * 0.6 || nav.classList.contains("is-open"));
addEventListener("scroll", onScroll, { passive: true }); onScroll();
burger.addEventListener("click", () => {
  const open = nav.classList.toggle("is-open");
  burger.setAttribute("aria-expanded", String(open)); onScroll();
});
$$("#links a").forEach((a) => a.addEventListener("click", () => { nav.classList.remove("is-open"); burger.setAttribute("aria-expanded", "false"); onScroll(); }));

const io = new IntersectionObserver((es) => es.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); } }),
  { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
$$(".reveal").forEach((el) => io.observe(el));

const sticky = $("#sticky");
const syncSticky = () => {
  const r = $("#rsvp").getBoundingClientRect();
  sticky.classList.toggle("is-hidden", scrollY < innerHeight * 0.7 || (r.top < innerHeight && r.bottom > 0));
};
addEventListener("scroll", syncSticky, { passive: true }); syncSticky();
