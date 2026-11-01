/**
 * AmountInput — the 60fps snippet "Comma Jump Number Input Interaction"
 * (https://60fps.design/shots/family-number-input-commas-shift-place-interaction),
 * ported from SwiftUI to a plain ES module.
 *
 * A large dollar amount starts at zero, with a small converted amount below
 * it. Each digit you type rises in from below at the end of the number. When
 * the number gains a group, the commas drop down for a moment and move to
 * their new spots. Deleting walks it back the same way, down to zero.
 *
 * The motion is the snippet's:
 *   - every glyph, the row's width and its fit-to-width scale move on
 *     .spring(response: 0.22, dampingFraction: 0.88) — written out below as a
 *     CSS linear() curve sampled from that spring
 *   - a new glyph rises in from 75pt below and fades in; a deleted one sinks
 *     back the same way; the row clips them at its edge
 *   - on every change the commas dip 20pt (.easeIn, 0.08s) and come back up
 *     (.easeOut, 0.14s) while they slide to their new places
 *   - Reduce Motion: no movement at all, the values just change
 * Changes for Paymesh: the amount is typed on the phone's (or computer's)
 * own keyboard rather than an on-screen keypad; it is set in Rebond
 * Grotesque, like the balance; the line below is the other currency,
 * "= 1,234.00 USDT", with the snippet's up-and-down arrows beside it, which
 * here swap which currency leads (the "$" sinks away and a " USDT" rises in
 * after the digits, on the same spring); and there is no red line — the
 * page's button names any limit. The selection haptic is a 5ms vibration
 * where there is one.
 *
 *   const input = AmountInput({ onChange: (value) => … });
 *   container.append(input.el);
 *   input.focus();          // brings up the keyboard
 *   input.value();          // the amount, as a number
 *
 * Styles are the `.ai` block in styles/ds.css.
 */

const reduceMotion = () => !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/**
 * .spring(response: 0.22, dampingFraction: 0.88) as a CSS easing: SwiftUI's
 * response is the undamped period, so ω = 2π / 0.22, and the curve is the
 * spring's step response, sampled until it has settled.
 */
const SPRING = (() => {
  const response = 0.22;
  const zeta = 0.88;
  const w0 = (2 * Math.PI) / response;
  const wd = w0 * Math.sqrt(1 - zeta * zeta);
  const at = (t) => 1 - Math.exp(-zeta * w0 * t) * (Math.cos(wd * t) + ((zeta * w0) / wd) * Math.sin(wd * t));
  let duration = 0.05;
  while (duration < 2 && !(Math.abs(1 - at(duration)) < 0.001 && Math.abs(1 - at(duration + 0.05)) < 0.001)) duration += 0.01;
  const steps = 40;
  const points = Array.from({ length: steps + 1 }, (_, i) => at((duration * i) / steps).toFixed(4));
  return { easing: `linear(${points.join(", ")})`, ms: Math.round(duration * 1000) };
})();

const USDT_PER_USD = 1;
const money = (n) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** "1234567.8" → "1,234,567.8" — the snippet's formattedAmount */
const group = (amount) => {
  const [whole, fraction] = amount.split(".");
  const out = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return fraction === undefined ? out : `${out}.${fraction}`;
};

export function AmountInput({ onChange = () => {}, icon = "" } = {}) {
  let amount = "0";
  /* which currency the big figure is in; the line below is the other */
  let lead = "usd";
  let dipTimer = 0;

  const el = document.createElement("div");
  el.className = "ai";
  el.innerHTML = `
    <label class="ai-row">
      <span class="ai-frame" aria-hidden="true"><span class="ai-glyphs"></span></span>
      <input class="ai-field" type="text" inputmode="decimal" autocomplete="off" autocorrect="off" spellcheck="false"
        enterkeyhint="done" aria-label="Amount in US dollars" />
    </label>
    <div class="ai-sub">
      <span class="ai-other" aria-live="polite"></span>
      <button type="button" class="ai-swap" data-ai-swap>${icon}</button>
    </div>
    <span class="ai-measure" aria-hidden="true"></span>`;

  const frame = el.querySelector(".ai-frame");
  const row = el.querySelector(".ai-glyphs");
  const field = el.querySelector(".ai-field");
  const other = el.querySelector(".ai-other");
  const swap = el.querySelector(".ai-swap");
  const measurer = el.querySelector(".ai-measure");
  const glyphEls = new Map();

  el.style.setProperty("--ai-spring", SPRING.easing);
  el.style.setProperty("--ai-spring-ms", `${SPRING.ms}ms`);

  const value = () => Number(amount) || 0;

  /* the snippet's glyphs: "$", then each character, with a comma before
     every group of three in the whole part — ids keyed by place, so a comma
     is the same comma as it moves. In USDT the small mark comes after. */
  const glyphs = () => {
    const out = lead === "usd" ? [{ id: "dollar", text: "$", small: true }] : [];
    const whole = amount.indexOf(".") === -1 ? amount.length : amount.indexOf(".");
    [...amount].forEach((ch, i) => {
      if (i > 0 && i < whole && (whole - i) % 3 === 0) out.push({ id: `comma${(whole - i) / 3}`, text: ",", small: false });
      out.push({ id: `digit${i}`, text: ch, small: false });
    });
    if (lead === "usdt") out.push({ id: "usdt", text: "\u2009USDT", small: true });
    let x = 0;
    for (const g of out) {
      measurer.className = `ai-measure${g.small ? " is-small" : ""}`;
      measurer.textContent = g.text;
      g.width = measurer.getBoundingClientRect().width;
      g.x = x;
      x += g.width;
    }
    return { list: out, width: Math.max(x, 1) };
  };

  const place = (node, g, y = 0) => {
    node.style.width = `${g.width}px`;
    node.style.transform = `translate(${g.x}px, ${y}px)`;
  };

  /** Lays the row out; `animate` is false for the first paint. */
  const layout = (animate) => {
    const still = !animate || reduceMotion();
    el.toggleAttribute("data-still", still);
    const { list, width } = glyphs();
    const ids = new Set(list.map((g) => g.id));

    // deleted glyphs sink back below the baseline and go
    for (const [id, node] of glyphEls) {
      if (ids.has(id)) continue;
      glyphEls.delete(id);
      if (still) node.remove();
      else {
        node.style.transform = `${node.style.transform.replace(/,\s*[-\d.]+px\)$/, ", 75px)")}`;
        node.style.opacity = "0";
        setTimeout(() => node.remove(), SPRING.ms);
      }
    }

    for (const g of list) {
      let node = glyphEls.get(g.id);
      if (!node) {
        // a new glyph rises in from 75pt below
        node = document.createElement("span");
        node.className = `ai-glyph${g.small ? " is-small" : ""}${g.text === "," ? " is-comma" : ""}`;
        node.innerHTML = "<span></span>";
        node.dataset.id = g.id;
        node.firstChild.textContent = g.text;
        node.style.transition = "none";
        place(node, g, still ? 0 : 75);
        node.style.opacity = still ? "1" : "0";
        row.append(node);
        glyphEls.set(g.id, node);
        if (!still) {
          node.getBoundingClientRect();
          node.style.transition = "";
          place(node, g, 0);
          node.style.opacity = "1";
        } else node.style.transition = "";
      } else {
        node.firstChild.textContent = g.text;
        place(node, g, 0);
      }
    }

    // the row is as wide as its glyphs, scaled down to fit 320pt
    const room = Math.min(320, frame.parentElement.clientWidth || 320);
    row.style.width = `${width}px`;
    row.style.transform = `scale(${Math.min(1, room / width)})`;

    // the line below: the same amount in the other currency
    const converted = lead === "usd" ? value() * USDT_PER_USD : value() / USDT_PER_USD;
    other.textContent = lead === "usd" ? `= ${money(converted)} USDT` : `= $${money(converted)}`;
    const name = lead === "usd" ? "US dollars" : "USDT";
    field.setAttribute("aria-label", `Amount in ${name}`);
    field.setAttribute("aria-valuetext", lead === "usd" ? `$${group(amount)}` : `${group(amount)} USDT`);
    swap.setAttribute("aria-label", `Enter the amount in ${lead === "usd" ? "USDT" : "US dollars"}`);
    swap.title = "Swap currency";
  };

  /** The snippet's comma dip: down 20pt over 0.08s, back over 0.14s. */
  const dip = () => {
    if (reduceMotion()) return;
    clearTimeout(dipTimer);
    el.setAttribute("data-dip", "");
    dipTimer = setTimeout(() => el.removeAttribute("data-dip"), 80);
  };

  const update = (next) => {
    if (next === amount) return;
    navigator.vibrate?.(5);
    dip();
    amount = next;
    layout(true);
    onChange(value());
  };

  /** The snippet's enter(_:), one key at a time. */
  const enter = (key) => {
    let next = amount;
    if (key === "delete") {
      next = next.slice(0, -1) || "0";
    } else if (key === ".") {
      if (next.includes(".")) return;
      next += ".";
    } else {
      const dot = next.indexOf(".");
      if (dot !== -1 && next.length - dot > 2) return;
      if (next.replace(".", "").length >= 10) return;
      next = next === "0" ? key : next + key;
    }
    update(next);
  };

  /* The system keyboard. The field always holds one zero-width space, so a
     delete always has something to delete and is always reported; every
     edit is cancelled and played into the amount instead. */
  const PAD = "​";
  const reset = () => {
    field.value = PAD;
    field.setSelectionRange(1, 1);
  };
  field.addEventListener("beforeinput", (e) => {
    e.preventDefault();
    if (e.inputType.startsWith("delete")) enter("delete");
    else for (const ch of e.data || "") {
      if (/[0-9]/.test(ch)) enter(ch);
      else if (ch === "." || ch === ",") enter(".");
    }
    reset();
  });
  // anything the browser let through regardless (some Android keyboards)
  field.addEventListener("input", () => {
    const typed = field.value.replace(PAD, "");
    if (field.value === "") enter("delete");
    for (const ch of typed) {
      if (/[0-9]/.test(ch)) enter(ch);
      else if (ch === "." || ch === ",") enter(".");
    }
    reset();
  });
  field.addEventListener("focus", reset);
  reset();

  /* the arrows: swap which currency leads, the figure carrying over (they
     are worth the same, a dollar to a USDT); the keyboard stays up */
  swap.addEventListener("click", () => {
    navigator.vibrate?.(5);
    lead = lead === "usd" ? "usdt" : "usd";
    layout(true);
    onChange(value());
    field.focus({ preventScroll: true });
  });

  // laid out once the element is in the page and its fonts are in — Rebond
  // loads only when first asked for, so ask
  requestAnimationFrame(() => layout(false));
  document.fonts?.ready.then(() => layout(false));
  document.fonts?.load('700 76px "Rebond Grotesque"').then(() => layout(false), () => {});

  return {
    el,
    focus: () => field.focus({ preventScroll: true }),
    /** Lays the row out again without motion — after it is (re)inserted. */
    refresh: () => layout(false),
    /** Back to zero, without motion. */
    reset: () => {
      amount = "0";
      layout(false);
      onChange(0);
    },
    value,
    /** Which currency the amount is typed in: "usd" or "usdt". */
    currency: () => lead,
    /** The amount as typed, grouped: "1,234.5" */
    text: () => group(amount),
    destroy: () => clearTimeout(dipTimer),
  };
}
