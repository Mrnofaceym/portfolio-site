// ===== Contacts: fill these in =====
const CONFIG = {
  telegram: "",          // e.g. "maksym_dev" (without @)
  email: "MrmaksymBusiness@gmail.com", // business email
};

// ===== English translations (Ukrainian is the default text in index.html) =====
const EN = {
  "nav.services": "Services", "nav.work": "Work", "nav.process": "Process", "nav.faq": "FAQ", "nav.cta": "Contact",
  "hero.tag": "Open for new projects",
  "hero.title": "Telegram bots, websites and <span class=\"hl\">automation</span> that work for you",
  "hero.lead": "I build bots for client booking, lead collection and sales, landing pages and scripts that save hours of routine work. I deploy them on a server 24/7 and stay in touch after delivery.",
  "hero.cta1": "Discuss a project", "hero.cta2": "See my work",
  "hero.f1": "your bot never sleeps", "hero.f2b": "from 3 days", "hero.f2": "to a working bot", "hero.f3": "languages I speak",
  "hero.phone": "Live example: salon booking bot",
  "srv.h": "Services & prices",
  "srv.sub": "The exact price depends on the task — message me and I'll quote it after a short chat. No hidden fees.",
  "srv.1.h": "Telegram bots", "srv.1.p": "Client booking, lead forms, catalog and orders, broadcasts, reminders, admin panel.",
  "srv.2.h": "Landing pages & websites", "srv.2.p": "One-page sites for services and products: responsive, fast, with a lead form and your own domain.",
  "srv.3.h": "Automation", "srv.3.p": "Scripts and integrations: Google Sheets, notifications, file processing, data collection, content generation.",
  "srv.4.h": "Hosting & support", "srv.4.p": "Server deployment, auto-restart, updates and small fixes after the project is delivered.",
  "from": "from", "permonth": "/mo",
  "work.h": "Work", "work.sub": "Real projects you can open and check yourself.",
  "work.1.kind": "Telegram bot · booking", "work.1.h": "Online booking bot for a beauty salon",
  "work.1.p": "Clients pick a service, date and free time slot themselves — no calls or chats. The master gets a notification about every booking, and the client gets a reminder. Runs on a server 24/7.",
  "work.try": "Try the bot", "work.code": "Code on GitHub",
  "work.2.kind": "Automation · content", "work.2.h": "Short video production pipeline",
  "work.2.p": "A system that turns a script into a finished video automatically: voice-over, subtitles, AI illustrations, animation, sound effects and editing. One video in ~1 hour instead of a day of manual work.",
  "work.3.kind": "Website · portfolio", "work.3.h": "This website",
  "work.3.p": "A bilingual responsive landing page without site builders: clean HTML/CSS/JS, fast loading, hosted on Cloudflare with HTTPS. I can build the same for your business.",
  "stack.h": "Tech I use",
  "proc.h": "How we work",
  "proc.1.h": "Request", "proc.1.p": "You briefly describe the task — on Telegram or by email.",
  "proc.2.h": "Discussion", "proc.2.p": "I clarify the details and propose a solution, price and deadline.",
  "proc.3.h": "Prepayment", "proc.3.p": "50% to start, the rest once everything works.",
  "proc.4.h": "Development", "proc.4.p": "I show intermediate results so you can see the progress.",
  "proc.5.h": "Revisions", "proc.5.p": "I polish it until you're happy with everything.",
  "proc.6.h": "Launch", "proc.6.p": "I deploy it to a server and hand over the code and instructions.",
  "about.h": "About me",
  "about.p1": "I'm Maksym from Ukraine. I build Telegram bots, websites and automation in Python. I love it when routine that takes hours starts doing itself in seconds.",
  "about.p2": "I work honestly: realistic deadlines, visible progress, and I don't disappear after payment. If a task isn't a good fit for me, I'll tell you right away.",
  "about.me": "Maksym", "about.role": "Developer · bots, websites, automation",
  "about.soon": "The team is growing", "about.soonp": "New people will appear here soon",
  "faq.h": "FAQ",
  "faq.1.q": "How long does it take to build a bot?", "faq.1.a": "A simple bot takes 3–5 days, a more complex one with an admin panel and payments takes 1–2 weeks. I give an exact deadline after we discuss it.",
  "faq.2.q": "What do you need from me?", "faq.2.a": "A description of the task in your own words, texts for the bot or site (or I'll help write them) and access to Telegram to create the bot via @BotFather.",
  "faq.3.q": "How does payment work?", "faq.3.a": "50% prepayment and 50% after delivery. We agree on the payment method individually.",
  "faq.4.q": "Where will the bot run?", "faq.4.a": "I can host it on my server (with support) or on yours. The bot runs 24/7 and restarts itself if something fails.",
  "faq.5.q": "Do I get the source code?", "faq.5.a": "Yes. After payment you get the full code, setup instructions and all access.",
  "faq.6.q": "What if I need changes later?", "faq.6.a": "Small fixes within 14 days after delivery are free. After that — by agreement or as part of support.",
  "ct.h": "Got a task? Let's talk", "ct.p": "Describe what you need — I'll reply within a day and suggest a solution. The consultation is free.",
};
const META = {
  uk: { title: "Maksym — Telegram-боти та сайти", desc: "Розробка Telegram-ботів, лендингів та автоматизації. Запуск на сервері 24/7, підтримка після здачі." },
  en: { title: "Maksym — Telegram bots & websites", desc: "Telegram bots, landing pages and automation. 24/7 server deployment and support after delivery." },
};

// remember original Ukrainian texts
const UK = {};
document.querySelectorAll("[data-i18n]").forEach(el => { UK[el.dataset.i18n] = el.textContent; });
document.querySelectorAll("[data-i18n-html]").forEach(el => { UK[el.dataset.i18nHtml] = el.innerHTML; });

function setLang(lang) {
  const dict = lang === "en" ? EN : UK;
  document.querySelectorAll("[data-i18n]").forEach(el => { const v = dict[el.dataset.i18n]; if (v) el.textContent = v; });
  document.querySelectorAll("[data-i18n-html]").forEach(el => { const v = dict[el.dataset.i18nHtml]; if (v) el.innerHTML = v; });
  document.documentElement.lang = lang;
  document.title = META[lang].title;
  document.querySelector('meta[name="description"]').content = META[lang].desc;
  document.querySelectorAll(".lang button").forEach(b => b.classList.toggle("is-on", b.dataset.lang === lang));
  try { localStorage.setItem("lang", lang); } catch (e) {}
}

document.querySelectorAll(".lang button").forEach(b => b.addEventListener("click", () => setLang(b.dataset.lang)));
let start = "uk";
try { start = localStorage.getItem("lang") || (navigator.language.startsWith("uk") || navigator.language.startsWith("ru") ? "uk" : "en"); } catch (e) {}
setLang(start);

// contacts
const tg = document.getElementById("ct-tg"), mail = document.getElementById("ct-mail");
if (CONFIG.telegram) tg.href = "https://t.me/" + CONFIG.telegram; else tg.style.display = "none";
if (CONFIG.email) { mail.href = "mailto:" + CONFIG.email; document.getElementById("ct-mail-t").textContent = CONFIG.email; }
else mail.style.display = "none";

document.getElementById("year").textContent = new Date().getFullYear();

// reveal on scroll
const io = "IntersectionObserver" in window ? new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
}), { threshold: .12 }) : null;
document.querySelectorAll(".card, .work, .steps li, .member, .faq details, .contact, .stack").forEach(el => {
  if (io) { el.classList.add("reveal"); io.observe(el); }
});
