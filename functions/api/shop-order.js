// Cloudflare Pages Function: POST /api/shop-order -> order message to the shop's Telegram.
// Env (Pages → Settings → Environment variables, as secrets):
//   BOT_TOKEN, CHAT_ID   — Telegram bot and chat. Without them it answers {ok:true, demo:true, order}.
//   SHEET_CSV_URL        — optional: the same published Google Sheet CSV the site uses for goods.
//   PRODUCTS_URL         — optional: where products.json lives (default /demo/shop/products.json on this site).
// Prices are NEVER taken from the client: every line is recomputed from the products list here.

const clean = (v, max) => String(v ?? "").replace(/[<>&]/g, "").replace(/\s+/g, " ").trim().slice(0, max);
const money = (n) => `${Math.round(n).toLocaleString("uk-UA").replace(/ /g, " ")} грн`;
const PAY = { cod: "Накладений платіж", card: "Передоплата на картку" };

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
// Same column format as app.js: id | назва | ціна | варіанти | наявність (others ignored here)
function productsFromCSV(text) {
  const [head, ...rows] = parseCSV(text);
  const col = (n) => head.findIndex((h) => h.trim().toLowerCase() === n);
  const C = { id: col("id"), name: col("назва"), price: col("ціна"), opts: col("варіанти"), stock: col("наявність") };
  const get = (row, k) => (C[k] >= 0 ? (row[C[k]] || "").trim() : "");
  return rows.map((row, i) => ({
    id: get(row, "id") || `p${i + 1}`, name: get(row, "name"), price: parseInt(get(row, "price").replace(/\D/g, ""), 10),
    options: get(row, "opts").split("/").map((g) => g.trim()).filter(Boolean).map((g) => {
      const [name, vals = ""] = g.split(":");
      return { name: name.trim(), values: vals.split(",").map((v) => v.trim()).filter(Boolean).map((v) => {
        const m = v.match(/^(.*?)\s*\+\s*(\d+)\s*(грн)?$/); return m ? { v: m[1], add: +m[2] } : { v };
      }) };
    }).filter((o) => o.values.length),
    stock: !/^(ні|no|0|немає)$/i.test(get(row, "stock")),
  })).filter((p) => p.name && p.price);
}

async function loadCatalog(request, env) {
  const url = env.PRODUCTS_URL || new URL("/demo/shop/products.json", request.url).href;
  const data = await (await fetch(url, { cf: { cacheTtl: 60 } })).json();
  if (env.SHEET_CSV_URL) {
    try {
      const r = await fetch(env.SHEET_CSV_URL);
      if (r.ok) { const list = productsFromCSV(await r.text()); if (list.length) data.products = list; }
    } catch { /* fall back to products.json */ }
  }
  return data;
}

function orderNo() {
  const d = new Date(Date.now() + 2 * 3600e3);                       // ~Kyiv time is fine for a label
  const p = (n) => String(n).padStart(2, "0");
  return `VL-${p(d.getUTCDate())}${p(d.getUTCMonth() + 1)}-${Math.floor(1000 + Math.random() * 9000)}`;
}

export async function onRequestPost({ request, env }) {
  let d;
  try { d = await request.json(); } catch { return Response.json({ ok: false, error: "bad json" }, { status: 400 }); }
  if (d.website) return Response.json({ ok: true, demo: true, order: orderNo() });   // honeypot

  const name = clean(d.name, 60), phone = clean(d.phone, 20);
  const delivery = String(d.delivery || ""), payment = String(d.payment || "");
  const city = clean(d.city, 60), branch = clean(d.branch, 60), comment = clean(d.comment, 400);
  if (name.length < 2 || phone.replace(/\D/g, "").length < 10 || !PAY[payment] ||
      !Array.isArray(d.items) || !d.items.length || d.items.length > 50) {
    return Response.json({ ok: false, error: "invalid" }, { status: 422 });
  }

  let cat;
  try { cat = await loadCatalog(request, env); } catch { return Response.json({ ok: false, error: "catalog" }, { status: 503 }); }
  const dl = cat.delivery?.[delivery];
  if (!dl || (delivery !== "pickup" && (city.length < 2 || !branch))) return Response.json({ ok: false, error: "delivery" }, { status: 422 });

  const lines = [];
  for (const it of d.items) {
    const p = cat.products.find((x) => x.id === it.id);
    const qty = Math.floor(Number(it.qty));
    if (!p || !p.stock || !(qty >= 1 && qty <= 20)) return Response.json({ ok: false, error: "item" }, { status: 422 });
    const sel = (p.options || []).map((o, i) => {
      const j = Number(it.sel?.[i] ?? 0);
      return Number.isInteger(j) && o.values[j] ? j : -1;
    });
    if (sel.includes(-1)) return Response.json({ ok: false, error: "variant" }, { status: 422 });
    const unit = p.price + (p.options || []).reduce((s, o, i) => s + (o.values[sel[i]].add || 0), 0);
    const variant = (p.options || []).map((o, i) => o.values[sel[i]].v).join(", ");
    lines.push({ name: p.name, variant, qty, unit, sum: unit * qty });
  }
  const sub = lines.reduce((s, l) => s + l.sum, 0);
  const promo = clean(d.promo, 20).toUpperCase();
  const pct = cat.promo?.[promo] || 0;
  const disc = Math.round(sub * pct / 100);
  const ship = delivery === "pickup" || sub >= cat.freeShippingFrom ? 0 : dl.price;
  const total = sub - disc + ship;
  const order = orderNo();

  if (!env.BOT_TOKEN || !env.CHAT_ID) return Response.json({ ok: true, demo: true, order, total });

  const text = [
    `🛍 <b>Нове замовлення ${order}</b>`,
    "",
    ...lines.map((l) => `• ${clean(l.name, 80)}${l.variant ? ` <i>(${clean(l.variant, 120)})</i>` : ""}\n   ${l.qty} × ${money(l.unit)} = <b>${money(l.sum)}</b>`),
    "",
    `Товари: ${money(sub)}`,
    pct ? `Промокод ${promo}: −${pct}% (−${money(disc)})` : null,
    `Доставка: ${ship ? money(ship) : "безкоштовно"}`,
    `💰 <b>Разом: ${money(total)}</b>`,
    "",
    `👤 ${name}, ${phone}`,
    `🚚 ${dl.name}${delivery === "pickup" ? "" : `: ${city}, ${delivery === "ukr" ? "індекс" : "відд."} ${branch}`}`,
    `💳 ${PAY[payment]}`,
    comment ? `💬 ${comment}` : null,
  ].filter((x) => x !== null).join("\n");
  const r = await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: env.CHAT_ID, text, parse_mode: "HTML" }),
  });
  return r.ok ? Response.json({ ok: true, order, total }) : Response.json({ ok: false, error: "telegram" }, { status: 502 });
}
