/*! SC Calc — вбудовуваний калькулятор ціни · https://site-cloud.uk
 * Підключення:
 *   <div id="sc-calc"></div>
 *   <script src="https://site-cloud.uk/demo/calc/widget.js" data-config="ceilings" async></script>
 * Атрибути: data-config  — назва конфігу з /configs/ або URL на .json
 *           data-color   — колір кнопок і акцентів (#0E7C86)
 *           data-target  — id контейнера (за замовчуванням sc-calc)
 *           data-endpoint— куди слати заявку (за замовчуванням /api/calc-lead на домені віджета)
 * JS API: SCCalc.mount(element, {config, color, endpoint})
 * Подія:  "sc-calc:lead" на контейнері після успішної заявки (для GA / Meta Pixel). */
(() => {
  "use strict";
  const me = document.currentScript;
  const SRC = me && me.src ? me.src : location.href;
  const BASE = new URL(".", SRC).href;
  const DEF_ENDPOINT = new URL("/api/calc-lead", SRC).href;
  const cache = {};

  /* ---------- price engine (same logic lives in functions/api/calc-lead.js) ---------- */
  const fmt = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  const r1 = (n) => Math.round(n * 10) / 10;
  function norm(cfg, raw) {
    const v = {};
    for (const f of cfg.fields) {
      const x = raw ? raw[f.id] : undefined;
      if (f.type === "choice") v[f.id] = f.options.some((o) => o.id === x) ? x : (f.default || f.options[0].id);
      else if (f.type === "toggle") v[f.id] = typeof x === "boolean" ? x : !!f.default;
      else {
        const st = f.step || 1, n = Number(x);
        let y = Number.isFinite(n) && x !== "" && x != null ? n : (f.default ?? f.min ?? 0);
        y = Math.round(Math.min(f.max, Math.max(f.min, y)) / st) * st;
        v[f.id] = y;
      }
    }
    return v;
  }
  const qty = (f, v) => (f.per ? Math.round((f.k || 1) * (f.pow ? Math.pow(+v[f.per] || 0, f.pow) : +v[f.per] || 0) * 10) / 10 : 1);
  function compute(cfg, v) {
    const lines = []; let sum = 0;
    for (const f of cfg.fields) {
      let price = 0, q = 1, label = f.label;
      if (f.type === "choice") { const o = f.options.find((o) => o.id === v[f.id]) || f.options[0]; price = o.price || 0; q = qty(f, v); label = `${f.label}: ${o.label.toLowerCase()}`; }
      else if (f.type === "toggle") { if (!v[f.id]) continue; price = f.price || 0; q = qty(f, v); }
      else { price = f.price || 0; q = Math.max(0, v[f.id] - (f.free || 0)) * qty(f, v); }
      const amt = price * q;
      if (amt <= 0) continue;
      sum += amt;
      lines.push({ label, amt, note: q === 1 ? "" : `${r1(q)} ${f.unit || ""} × ${fmt(price)}` });
    }
    const base = Math.max(sum, cfg.minTotal || 0), rg = cfg.range || [1, 1], step = cfg.round || 1;
    return { lines, sum, min: base > sum, from: Math.floor(base * rg[0] / step) * step, to: Math.ceil(base * rg[1] / step) * step };
  }

  /* ---------- helpers ---------- */
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  function load(name) {
    const url = /^https?:|\.json$/.test(name) ? new URL(name, BASE).href : `${BASE}configs/${encodeURIComponent(name)}.json`;
    return (cache[url] ||= fetch(url).then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); }).catch((e) => { delete cache[url]; throw e; }));
  }

  const CSS = `:host{all:initial;display:block;contain:content}
*{box-sizing:border-box}
.sc{--c:#0E7C86;--cl:color-mix(in srgb,var(--c) 9%,#fff);--cm:color-mix(in srgb,var(--c) 30%,#fff);--cd:color-mix(in srgb,var(--c) 80%,#000);--ink:#18212b;--tx:#4a5562;--mu:#7d8793;--ln:#e3e7ec;
container-type:inline-size;font:15px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;color:var(--tx);background:#fff;border:1px solid var(--ln);border-radius:20px;padding:22px;box-shadow:0 20px 50px -30px rgba(20,30,45,.35);text-align:left;-webkit-font-smoothing:antialiased}
button,input,select{font:inherit;color:inherit}
.hd{margin-bottom:18px}.tt{font-size:1.32rem;font-weight:750;color:var(--ink);line-height:1.2;margin:0 0 4px}.st{margin:0;color:var(--mu);font-size:.92rem}
.grid{display:grid;gap:18px}
.fs{display:grid;gap:16px;margin:0}
.f{border:0;margin:0;padding:0;min-width:0}
.lb,legend{display:block;font-weight:650;color:var(--ink);font-size:.95rem;padding:0;margin-bottom:8px}
.row{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:6px}.row .lb{margin:0}
.num{display:inline-flex;align-items:center;gap:6px;border:1px solid var(--ln);border-radius:10px;padding:4px 10px;font-weight:650;color:var(--ink)}
.num input{width:3.4em;border:0;outline:0;background:none;text-align:right;font-weight:700;font-size:1rem;-moz-appearance:textfield}
.num input::-webkit-inner-spin-button{-webkit-appearance:none}
.num:focus-within{border-color:var(--c);box-shadow:0 0 0 3px var(--cl)}
.rng{-webkit-appearance:none;appearance:none;width:100%;height:28px;background:none;margin:0;cursor:pointer}
.rng::-webkit-slider-runnable-track{height:6px;border-radius:9px;background:linear-gradient(90deg,var(--c) var(--p),var(--ln) var(--p))}
.rng::-moz-range-track{height:6px;border-radius:9px;background:linear-gradient(90deg,var(--c) var(--p),var(--ln) var(--p))}
.rng::-webkit-slider-thumb{-webkit-appearance:none;width:24px;height:24px;border-radius:50%;background:#fff;border:3px solid var(--c);margin-top:-9px;box-shadow:0 2px 8px rgba(0,0,0,.18)}
.rng::-moz-range-thumb{width:18px;height:18px;border-radius:50%;background:#fff;border:3px solid var(--c)}
.rng:focus-visible{outline:none}.rng:focus-visible::-webkit-slider-thumb{box-shadow:0 0 0 5px var(--cm)}
.sc :focus-visible{outline:3px solid var(--cm);outline-offset:2px}
.sc .rng:focus-visible{outline:none}
.opts{display:grid;grid-template-columns:repeat(auto-fit,minmax(118px,1fr));gap:8px}
.opt{position:relative;cursor:pointer}
.opt input{position:absolute;opacity:0;inset:0;margin:0;cursor:pointer}
.opt span{display:block;height:100%;border:1.5px solid var(--ln);border-radius:12px;padding:10px 12px;transition:border-color .15s,background .15s}
.opt b{display:block;color:var(--ink);font-weight:650}.opt small{display:block;color:var(--mu);font-size:.8rem;line-height:1.35}.opt em{display:block;font-style:normal;font-weight:700;color:var(--c);font-size:.86rem;margin-top:2px}
.opt input:checked+span{border-color:var(--c);background:var(--cl)}
.opt input:focus-visible+span{box-shadow:0 0 0 3px var(--cm)}
.cnt,.tg{display:flex;align-items:center;justify-content:space-between;gap:12px}
.cnt .lb,.tg .lb{margin:0}
.hint{display:block;font-weight:400;color:var(--mu);font-size:.8rem}
.stp{display:flex;align-items:center;border:1px solid var(--ln);border-radius:12px;flex:none}
.stp button{width:38px;height:38px;border:0;background:none;font-size:1.25rem;line-height:1;color:var(--c);cursor:pointer;border-radius:11px}
.stp button:hover:not(:disabled){background:var(--cl)}.stp button:disabled{color:var(--ln);cursor:default}
.stp output{min-width:2.2em;text-align:center;font-weight:700;color:var(--ink)}
.tg{cursor:pointer;padding:10px 12px;border:1px solid var(--ln);border-radius:12px}
.tg input{position:absolute;opacity:0;width:1px;height:1px}
.sw{flex:none;width:44px;height:26px;border-radius:99px;background:#cfd6dd;position:relative;transition:background .2s}
.sw:after{content:"";position:absolute;top:3px;left:3px;width:20px;height:20px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.25);transition:transform .2s}
.tg input:checked~.sw{background:var(--c)}.tg input:checked~.sw:after{transform:translateX(18px)}
.tg input:focus-visible~.sw{box-shadow:0 0 0 3px var(--cm)}
.sum{background:var(--cl);border-radius:16px;padding:18px;align-self:start}
.sl{font-size:.82rem;text-transform:uppercase;letter-spacing:.08em;font-weight:700;color:var(--cd)}
.pr{margin:4px 0 10px;color:var(--ink);font-size:1.05rem;line-height:1.25}
.pr b{font-size:1.6rem;font-weight:800;letter-spacing:-.02em;white-space:nowrap}
.bdg{display:inline-block;background:#fff;color:var(--cd);font-weight:700;font-size:.85rem;border-radius:99px;padding:5px 12px;margin-bottom:12px}
details{margin-bottom:14px;font-size:.88rem}
summary{cursor:pointer;color:var(--cd);font-weight:650;list-style:none}summary::-webkit-details-marker{display:none}
summary:after{content:" ▾"}details[open] summary:after{content:" ▴"}
ul{list-style:none;margin:8px 0 0;padding:0;display:grid;gap:6px}
li{display:flex;justify-content:space-between;gap:10px;border-bottom:1px dashed var(--cm);padding-bottom:6px}
li small{display:block;color:var(--mu)}li span:last-child{white-space:nowrap;font-weight:650;color:var(--ink)}
.btn{display:flex;width:100%;align-items:center;justify-content:center;gap:8px;border:0;border-radius:12px;background:var(--c);color:#fff;font-weight:700;padding:14px 16px;cursor:pointer;transition:background .15s,transform .15s;text-align:center}
.btn:hover{background:var(--cd)}.btn:active{transform:scale(.98)}.btn:disabled{opacity:.6;cursor:wait}
.nt{margin:10px 0 0;font-size:.8rem;color:var(--mu)}
.bk{border:0;background:none;color:var(--cd);font-weight:650;cursor:pointer;padding:0;margin-bottom:12px}
.chip{background:var(--cl);border-radius:12px;padding:10px 14px;margin:0 0 16px;font-size:.9rem;color:var(--ink)}
.in{display:block;width:100%;border:1px solid var(--ln);border-radius:12px;padding:12px 14px;background:#fff;outline:0;margin-bottom:12px}
.in:focus{border-color:var(--c);box-shadow:0 0 0 3px var(--cl)}
.tms{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px}
.tms .opt span{padding:8px 12px;border-radius:99px;font-size:.88rem;color:var(--ink)}
.hp{position:absolute;left:-9999px}
.err{color:#c0392b;font-size:.88rem;margin:0 0 10px}
.ok{text-align:center;padding:18px 4px}.ok i{display:grid;place-items:center;width:58px;height:58px;margin:0 auto 12px;border-radius:50%;background:var(--c);color:#fff;font:700 1.7rem/1 system-ui;font-style:normal}
.ok .tt{margin-bottom:8px}.dm{display:inline-block;font-size:.8rem;background:#fff6d6;color:#7a5a00;border-radius:8px;padding:4px 10px;margin-top:8px}
.pw{margin-top:14px;text-align:right;font-size:.72rem;color:#a3abb4}.pw a{color:inherit}
.ld{padding:40px 0;text-align:center;color:var(--mu)}
.nr{max-width:560px;margin-inline:auto}
.mini{position:sticky;bottom:10px;z-index:2;display:flex;align-items:center;justify-content:space-between;gap:10px;background:var(--ink);color:#fff;border-radius:14px;padding:10px 10px 10px 14px;box-shadow:0 10px 30px -10px rgba(0,0,0,.45);font-size:.88rem;line-height:1.25}
.mini b{font-size:1rem;white-space:nowrap}.mini button{flex:none;border:0;border-radius:10px;background:var(--c);color:#fff;font-weight:700;padding:9px 12px;cursor:pointer}
@container (min-width:640px){.mini{display:none}}
@container (max-width:440px){.opts{grid-template-columns:1fr}.opt span{display:grid;grid-template-columns:1fr auto;column-gap:10px}.opt em{grid-row:1/3;grid-column:2;align-self:center;margin:0}}
@container (min-width:640px){.grid{grid-template-columns:minmax(0,1fr) 310px;gap:26px}.sum{position:sticky;top:16px}.sc{padding:28px}}
@container (max-width:360px){.sc{padding:16px;border-radius:16px}.pr b{font-size:1.5rem}}
@media (prefers-reduced-motion:reduce){*{transition:none!important}}`;

  /* ---------- rendering ---------- */
  function fieldHTML(f, v) {
    const id = `f-${f.id}`;
    if (f.type === "range") {
      return `<div class="f"><div class="row"><label class="lb" for="${id}">${esc(f.label)}</label><span class="num"><input type="number" inputmode="numeric" data-n="${f.id}" min="${f.min}" max="${f.max}" step="${f.step || 1}" value="${v[f.id]}" aria-label="${esc(f.label)}">${esc(f.unit || "")}</span></div>
<input class="rng" type="range" id="${id}" name="${f.id}" min="${f.min}" max="${f.max}" step="${f.step || 1}" value="${v[f.id]}"></div>`;
    }
    if (f.type === "choice") {
      return `<fieldset class="f"><legend>${esc(f.label)}</legend><div class="opts">${f.options.map((o) => `<label class="opt"><input type="radio" name="${f.id}" value="${esc(o.id)}"${v[f.id] === o.id ? " checked" : ""}><span><b>${esc(o.label)}</b>${o.desc ? `<small>${esc(o.desc)}</small>` : ""}<em>${fmt(o.price)} грн${f.per ? "/" + esc(f.unit) : ""}</em></span></label>`).join("")}</div></fieldset>`;
    }
    if (f.type === "count") {
      return `<div class="f cnt"><span class="lb" id="${id}">${esc(f.label)}${f.hint ? `<span class="hint">${esc(f.hint)}</span>` : ""}</span><span class="stp" role="group" aria-labelledby="${id}"><button type="button" data-s="${f.id}" data-d="-1" aria-label="Менше">−</button><output data-o="${f.id}">${v[f.id]}</output><button type="button" data-s="${f.id}" data-d="1" aria-label="Більше">+</button></span></div>`;
    }
    return `<label class="f tg"><span class="lb">${esc(f.label)}${f.hint ? `<span class="hint">${esc(f.hint)}</span>` : ""}</span><input type="checkbox" role="switch" name="${f.id}"${v[f.id] ? " checked" : ""}><i class="sw" aria-hidden="true"></i></label>`;
  }

  function animate(el, to) {
    const from = +el.dataset.v || 0; el.dataset.v = to;
    if (!from || matchMedia("(prefers-reduced-motion:reduce)").matches) { el.textContent = fmt(to); return; }
    const t0 = performance.now(), d = 320;
    cancelAnimationFrame(el._raf);
    const tick = (t) => { const k = Math.min(1, (t - t0) / d), e = 1 - Math.pow(1 - k, 3); el.textContent = fmt(from + (to - from) * e); if (k < 1) el._raf = requestAnimationFrame(tick); };
    el._raf = requestAnimationFrame(tick);
  }

  async function mount(host, opts = {}) {
    if (!host) return;
    const root = host.shadowRoot || host.attachShadow({ mode: "open" });
    const name = opts.config || "ceilings";
    const endpoint = opts.endpoint || DEF_ENDPOINT;
    const token = (host._scTok = (host._scTok || 0) + 1);
    root.innerHTML = `<style>${CSS}</style><div class="sc"><div class="ld">Завантаження калькулятора…</div></div>`;
    let cfg;
    try { cfg = await load(name); } catch (e) {
      if (token === host._scTok) root.querySelector(".ld").textContent = "Не вдалося завантажити калькулятор. Оновіть сторінку.";
      return;
    }
    if (token !== host._scTok) return; // a newer mount() won
    const sc = root.querySelector(".sc");
    sc.style.setProperty("--c", opts.color || cfg.color || "#0E7C86");
    const cur = cfg.currency || "грн", L = cfg.lead || {};
    let v = norm(cfg, opts.values), res;

    const pw = `<div class="pw">Калькулятор від <a href="https://site-cloud.uk" target="_blank" rel="noopener">site-cloud.uk</a></div>`;
    const calcView = () => {
      sc.innerHTML = `<div class="hd"><p class="tt">${esc(cfg.title)}</p>${cfg.subtitle ? `<p class="st">${esc(cfg.subtitle)}</p>` : ""}</div>
<div class="grid"><form class="fs" novalidate>${cfg.fields.map((f) => fieldHTML(f, v)).join("")}<div class="mini" aria-hidden="true"><span>від <b data-m="from"></b><br>до <b data-m="to"></b> ${esc(cur)}</span><button type="button" tabindex="-1" data-go>Залишити заявку</button></div></form>
<div class="sum" aria-live="polite"><div class="sl">Орієнтовна вартість</div><p class="pr">від <b data-p="from">0</b> до <b data-p="to">0</b> ${esc(cur)}</p>
${cfg.badge ? `<div class="bdg">${esc(cfg.badge)}</div>` : ""}<details><summary>З чого складається ціна</summary><ul></ul></details>
<button class="btn" type="button" data-go>${esc(L.cta || "Залишити заявку")}</button>${cfg.note ? `<p class="nt">${esc(cfg.note)}</p>` : ""}</div></div>${pw}`;
      const form = sc.querySelector("form");
      const read = (src) => {
        const raw = {};
        for (const f of cfg.fields) {
          if (f.type === "choice") raw[f.id] = (form.querySelector(`[name="${f.id}"]:checked`) || {}).value;
          else if (f.type === "toggle") raw[f.id] = form.querySelector(`[name="${f.id}"]`).checked;
          else if (f.type === "range") raw[f.id] = src && src.dataset.n === f.id ? src.value : form.querySelector(`[name="${f.id}"]`).value;
          else raw[f.id] = v[f.id];
        }
        return raw;
      };
      const sync = (skip) => {
        for (const f of cfg.fields) {
          if (f.type === "range") {
            const r = form.querySelector(`[name="${f.id}"]`), n = form.querySelector(`[data-n="${f.id}"]`);
            if (r !== skip) r.value = v[f.id];
            if (n !== skip) n.value = v[f.id];
            r.style.setProperty("--p", `${((v[f.id] - f.min) / (f.max - f.min)) * 100}%`);
          } else if (f.type === "count") {
            form.querySelector(`[data-o="${f.id}"]`).textContent = v[f.id];
            form.querySelector(`[data-s="${f.id}"][data-d="-1"]`).disabled = v[f.id] <= f.min;
            form.querySelector(`[data-s="${f.id}"][data-d="1"]`).disabled = v[f.id] >= f.max;
          }
        }
        res = compute(cfg, v);
        animate(sc.querySelector('[data-p="from"]'), res.from);
        animate(sc.querySelector('[data-p="to"]'), res.to);
        sc.querySelector('[data-m="from"]').textContent = fmt(res.from); sc.querySelector('[data-m="to"]').textContent = fmt(res.to);
        sc.querySelector("ul").innerHTML = res.lines.map((l) => `<li><span>${esc(l.label)}${l.note ? `<small>${esc(l.note)} ${esc(cur)}</small>` : ""}</span><span>${fmt(l.amt)} ${esc(cur)}</span></li>`).join("")
          + (res.min ? `<li><span>Мінімальне замовлення</span><span>${fmt(cfg.minTotal)} ${esc(cur)}</span></li>` : "");
      };
      form.addEventListener("input", (e) => {
        if (e.target.type === "number" && e.target.value === "") return; // let the user finish typing
        v = norm(cfg, read(e.target)); sync(e.target.type === "number" ? e.target : null);
      });
      form.addEventListener("change", (e) => { v = norm(cfg, read()); sync(); });
      form.addEventListener("submit", (e) => e.preventDefault());
      form.addEventListener("click", (e) => {
        const b = e.target.closest("[data-s]"); if (!b) return;
        const f = cfg.fields.find((x) => x.id === b.dataset.s);
        v = norm(cfg, { ...v, [f.id]: v[f.id] + (+b.dataset.d) * (f.step || 1) }); sync();
      });
      sc.querySelectorAll("[data-go]").forEach((b) => b.addEventListener("click", () => { leadView(); if (sc.getBoundingClientRect().top < 0) sc.scrollIntoView({ behavior: "smooth" }); }));
      sync();
    };

    const brief = () => cfg.fields.map((f) =>
      f.type === "choice" ? f.options.find((o) => o.id === v[f.id]).label.toLowerCase() : f.type === "toggle" ? (v[f.id] ? f.label.toLowerCase() : "") : f.type === "range" ? `${v[f.id]} ${f.unit || ""}` : "").filter(Boolean).join(", ");

    const leadView = () => {
      const times = L.times || [];
      sc.innerHTML = `<div class="nr"><button class="bk" type="button">← Змінити параметри</button><p class="tt">${esc(L.title || "Залиште контакти")}</p>${L.text ? `<p class="st" style="margin-bottom:14px">${esc(L.text)}</p>` : ""}
<p class="chip">Ваш розрахунок: <b>від ${fmt(res.from)} до ${fmt(res.to)} ${esc(cur)}</b><br><small>${esc(brief())}</small></p>
<form novalidate><input class="in" name="name" autocomplete="name" placeholder="Ваше ім'я" aria-label="Ваше ім'я" maxlength="60" required>
<input class="in" name="phone" type="tel" autocomplete="tel" inputmode="tel" placeholder="Телефон, напр. +380 00 000 00 00" aria-label="Телефон" maxlength="20" required>
${times.length ? `<div class="lb">Коли зручно прийняти дзвінок?</div><div class="tms">${times.map((t, i) => `<label class="opt"><input type="radio" name="time" value="${esc(t)}"${i ? "" : " checked"}><span>${esc(t)}</span></label>`).join("")}</div>` : ""}
<input class="hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true"><p class="err" hidden></p>
<button class="btn" type="submit">${esc(L.submit || "Надіслати заявку")}</button><p class="nt">Натискаючи кнопку, ви погоджуєтесь, що вам зателефонують щодо цієї заявки.</p></form></div>${pw}`;
      sc.querySelector(".bk").addEventListener("click", calcView);
      const form = sc.querySelector("form"), err = sc.querySelector(".err"), btn = form.querySelector(".btn");
      const fail = (t) => { err.textContent = t; err.hidden = false; };
      form.name.focus({ preventScroll: true });
      form.addEventListener("submit", async (e) => {
        e.preventDefault(); err.hidden = true;
        const nm = form.name.value.trim(), ph = form.phone.value.trim();
        if (nm.length < 2) return fail("Вкажіть, будь ласка, ім'я."), form.name.focus();
        if (ph.replace(/\D/g, "").length < 9) return fail("Перевірте номер телефону — потрібно щонайменше 9 цифр."), form.phone.focus();
        btn.disabled = true; btn.textContent = "Надсилаємо…";
        const time = (form.querySelector('[name="time"]:checked') || {}).value || "";
        try {
          const r = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ config: cfg.id, values: v, name: nm, phone: ph, time, website: form.website.value, page: location.href.slice(0, 300) }) });
          const d = await r.json().catch(() => ({}));
          if (!r.ok || !d.ok) throw new Error(r.status);
          host.dispatchEvent(new CustomEvent("sc-calc:lead", { bubbles: true, detail: { config: cfg.id, from: res.from, to: res.to } }));
          doneView(nm, time, d.demo);
        } catch {
          btn.disabled = false; btn.textContent = L.submit || "Надіслати заявку";
          fail(`Не вдалося надіслати. Зателефонуйте нам: ${cfg.phone || ""}`);
        }
      });
    };

    const doneView = (nm, time, demo) => {
      sc.innerHTML = `<div class="ok nr"><i aria-hidden="true">✓</i><p class="tt">Дякуємо, ${esc(nm)}!</p><p class="st">${esc(L.done || "Ми зв'яжемося з вами найближчим часом.")}${time ? ` Час дзвінка: <b>${esc(time.toLowerCase())}</b>.` : ""}</p>
<p class="chip" style="margin:14px 0 0">Ваш розрахунок: <b>від ${fmt(res.from)} до ${fmt(res.to)} ${esc(cur)}</b></p>
${demo ? `<span class="dm">Демо-режим: заявка не відправлена в Telegram</span>` : ""}<p style="margin:16px 0 0"><button class="bk" type="button">↻ Новий розрахунок</button></p></div>${pw}`;
      sc.querySelector(".bk").addEventListener("click", calcView);
    };

    calcView();
  }

  window.SCCalc = { mount, compute, norm, version: "1.0" };

  if (me) {
    const go = () => {
      const el = document.getElementById(me.dataset.target || "sc-calc");
      if (el && !el.shadowRoot) mount(el, { config: me.dataset.config, color: me.dataset.color, endpoint: me.dataset.endpoint });
    };
    document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", go) : go();
  }
})();
