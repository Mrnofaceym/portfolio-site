// Showcase page: switches the live widget between configs/colours and keeps the embed snippet in sync.
const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const WIDGET_URL = "https://site-cloud.uk/demo/calc/widget.js";

const SITES = {
  ceilings: {
    url: "🔒 steli-podillia.com.ua", logo: "Стелі Поділля", nav: "Каталог · Роботи · Ціни · Контакти",
    h: "Натяжні стелі у Вінниці та Хмельнику — монтаж за 1 день",
    p: "Німецькі полотна, гарантія 12 років, прибираємо за собою. Порахуйте вартість просто зараз.",
    foot: "© Стелі Поділля · вигаданий сайт для демонстрації", cls: "",
  },
  cleaning: {
    url: "🔒 chysto-dim.com.ua", logo: "Чистий Дім", nav: "Послуги · Ціни · Відгуки · Контакти",
    h: "Прибирання квартир і будинків — приїдемо сьогодні",
    p: "Перевірені клінерки, власна хімія та інвентар. Дізнайтеся ціну за хвилину.",
    foot: "© Чистий Дім · вигаданий сайт для демонстрації", cls: "is-clean",
  },
};
const state = { cfg: "ceilings", color: "" };

function renderSnippet() {
  const attrs = [`<span class="a">src</span>=<span class="s">"${WIDGET_URL}"</span>`, `<span class="a">data-config</span>=<span class="s">"${state.cfg}"</span>`];
  if (state.color) attrs.push(`<span class="a">data-color</span>=<span class="s">"${state.color}"</span>`);
  $("#snippet").innerHTML =
    `<span class="c">&lt;!-- 1. Місце, де з'явиться калькулятор --&gt;</span>\n<span class="t">&lt;div</span> <span class="a">id</span>=<span class="s">"sc-calc"</span><span class="t">&gt;&lt;/div&gt;</span>\n\n` +
    `<span class="c">&lt;!-- 2. Сам віджет --&gt;</span>\n<span class="t">&lt;script</span> ${attrs.join("\n        ")}\n        <span class="a">async</span><span class="t">&gt;&lt;/script&gt;</span>`;
}

function apply() {
  const s = SITES[state.cfg];
  $("#fakeUrl").textContent = s.url; $("#fakeLogo").textContent = s.logo; $("#fakeNav").textContent = s.nav;
  $("#fakeH").textContent = s.h; $("#fakeP").textContent = s.p; $("#fakeFoot").textContent = s.foot;
  $("#fake").className = `fake ${s.cls}`;
  if (window.SCCalc) SCCalc.mount($("#sc-calc"), { config: state.cfg, color: state.color || undefined });
  renderSnippet();
}

$$(".tab").forEach((b) => b.addEventListener("click", () => {
  $$(".tab").forEach((t) => { t.classList.toggle("is-on", t === b); t.setAttribute("aria-selected", t === b); });
  state.cfg = b.dataset.cfg; apply();
}));
$$(".swatches .sw").forEach((b) => b.addEventListener("click", () => {
  $$(".swatches .sw").forEach((t) => { t.classList.toggle("is-on", t === b); t.setAttribute("aria-checked", t === b); });
  state.color = b.dataset.color; apply();
}));

$("#copy").addEventListener("click", async (e) => {
  const text = $("#snippet").textContent;
  try { await navigator.clipboard.writeText(text); }
  catch {
    const ta = Object.assign(document.createElement("textarea"), { value: text });
    document.body.append(ta); ta.select(); document.execCommand("copy"); ta.remove();
  }
  e.target.textContent = "Скопійовано ✓"; e.target.classList.add("is-done");
  setTimeout(() => { e.target.textContent = "Копіювати"; e.target.classList.remove("is-done"); }, 1800);
});

// real widget size for the stat
fetch("widget.js").then((r) => r.blob()).then((b) => { $("#kb").textContent = `~${Math.round(b.size / 1024)} КБ`; }).catch(() => {});
$("#year").textContent = new Date().getFullYear();
renderSnippet();
