/**
 * StackedBars — the "Stacked bars" component from Bencho
 * (https://bencho.dev), MIT licence: https://bencho.dev/licence
 *
 * Ported from React + framer-motion to a plain ES module, because this
 * prototype has no React, no npm and no build step (see the README). The
 * geometry, the timings and the comments are Bencho's; what changed:
 *   - each useState is a `let` and every change calls `paint()`, which
 *     patches the one element the component owns
 *   - framer-motion's `animate(mv, v, SPRING)` is `glide()` below: the same
 *     stiffness and damping, integrated per frame
 *   - the card is as wide as its container rather than 300px, so the plot's
 *     width is measured (`CW`) instead of fixed
 *   - it charts SPENDING: one bar a day, in one colour, for what was spent
 *     that day — there are no spending categories yet, so nothing to stack,
 *     and nothing under the baseline where Bencho's alert card puts the
 *     escalated few. Week / Month (the last 7 or 30 days) replace Day / Week.
 *     The stacking is left in place, so categories can come back as more
 *     entries in CATS and `vals`
 * Where a comment talks about state, refs or effects, it means those.
 *
 *   const chart = StackedBars();
 *   container.append(chart.el);   // and chart.destroy() when done with it
 *
 * `inline: true` drops the card and its title, for a chart that belongs to
 * something else on the page — the dashboard's balance — and puts the
 * figure where the title was.
 *
 * Styles are the `.stb` block in styles/ds.css.
 */

/* ══ Stacked bars ═════════════════════════════════════════
   An alert-volume card: a stack of four sources for every day (or
   week), and under the baseline the few that were escalated.

   ── RUN ALONG IT ────────────────────────────────────────
   The column under the pointer gets a ring round its whole stack,
   the rest step back (their colour mixed toward the slab, never
   faded), and one tooltip glides beside it on a spring with the
   date, the total and what made it up.

   ── DAY / WEEK ──────────────────────────────────────────
   Swaps the dataset; every segment eases to its new height and
   offset a beat after its left neighbour. The same transition
   grows the bars out of the baseline the first time the card is
   seen. */

const CH = 104; // room above the baseline
const BH = 0; // room below it for the escalated bars — none here, nothing goes under the line
const SEG_GAP = 2;
const LIFT = 2; // air between the baseline and the bars either side of it
const TIP_W = 132;
const SPRING = { stiffness: 380, damping: 34 };

/* what the money went on, bottom of the stack first — one entry until
   there are categories to split it by */
const CATS = ["Spent"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const LAST = Date.UTC(2026, 9, 13); // the last day shown — the dashboard's "today"
const DAY_MS = 86400000;

/* Week and Month are how many of the days are drawn */
const MODES = { Week: 7, Month: 30 };

/* a small seeded generator: the same chart on every load */
function mulberry(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* "13 Oct", the way the dashboard writes a date */
const fmtDay = (ms) => {
  const d = new Date(ms);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
};

/* Thirty days of spending, in dollars. Week is the last seven of the same
   thirty, so switching never changes what a day spent. */
function makeBars(n) {
  const rnd = mulberry(4396);
  /* a typical day's spending */
  const base = [97];
  const out = [];
  for (let i = 0; i < 30; i++) {
    const back = 29 - i; // only the last n are kept, so the data does not reshuffle with the count
    const ms = LAST - back * DAY_MS;
    const wd = new Date(ms).getUTCDay();
    const quiet = wd === 0 || wd === 6 ? 0.55 : 1;
    const surge = rnd() < 0.12 ? 1.5 : 1;
    const vals = base.map((b) => Math.round(b * quiet * (0.6 + rnd() * 0.8) * surge));
    out.push({ vals, esc: 0, label: fmtDay(ms), short: fmtDay(ms) });
  }
  return out.slice(30 - n);
}

const fmt = (v) => `$${Math.round(v).toLocaleString("en-US")}`;
const sum = (a) => a.reduce((s, v) => s + v, 0);

/* framer-motion's spring, by hand: a unit mass pulled toward the target
   with SPRING's stiffness and damping, stepped once per frame. It parks
   itself when it has arrived. */
function glide(onFrame) {
  let x = 0;
  let v = 0;
  let to = 0;
  let raf = 0;
  let prev = 0;
  const tick = (t) => {
    const dt = Math.min(0.05, prev ? (t - prev) / 1000 : 1 / 60);
    prev = t;
    v += (SPRING.stiffness * (to - x) - SPRING.damping * v) * dt;
    x += v * dt;
    if (Math.abs(to - x) < 0.01 && Math.abs(v) < 0.01) {
      x = to;
      v = 0;
      raf = 0;
      onFrame(x);
      return;
    }
    onFrame(x);
    raf = requestAnimationFrame(tick);
  };
  return {
    set(value) {
      cancelAnimationFrame(raf);
      raf = 0;
      x = to = value;
      v = 0;
      onFrame(x);
    },
    animate(value) {
      to = value;
      if (!raf) {
        prev = 0;
        raf = requestAnimationFrame(tick);
      }
    },
    stop: () => cancelAnimationFrame(raf),
  };
}

export function StackedBars({ colour = "Colour", gap = 6, inline = false } = {}) {
  let mode = "Week";
  let at = null;
  let seen = false;
  let gen = 0;
  let lastTotal = null;
  let was = null;
  /* the plot's width, measured — see the note at the top */
  let CW = 0;

  const el = document.createElement("div");
  el.className = inline ? "stb stb--inline" : "stb";
  el.dataset.colour = colour === "Colour" ? "on" : "off";
  el.innerHTML = `
    <div class="stb-head">
      <div class="stb-titles">
        <h2 class="stb-title">Spending</h2>
        <div class="stb-sub"></div>
      </div>
      <div class="stb-seg-ctl" role="tablist" aria-label="Period">
        <span class="stb-thumb" aria-hidden="true"></span>
        ${Object.keys(MODES).map((m) => `<button type="button" role="tab" class="stb-tab" data-mode="${m}">${m}</button>`).join("")}
      </div>
    </div>
    <div class="stb-figure">
      <span class="stb-num"></span>
      <span class="stb-unit">spent</span>
    </div>
    <div class="stb-plot" style="height: ${CH + 1 + BH}px">
      <span class="stb-base" style="top: ${CH}px"></span>
      <span class="stb-ring" aria-hidden="true"></span>
      <div class="stb-tip" style="width: ${TIP_W}px"></div>
    </div>
    <div class="stb-axis"><span></span><span></span></div>`;

  const q = (s) => el.querySelector(s);
  /* inline: the figure takes the title's place, above the "Last n days" */
  if (inline) q(".stb-title").replaceWith(q(".stb-figure"));
  const sub = q(".stb-sub");
  const ctl = q(".stb-seg-ctl");
  const tabs = [...el.querySelectorAll(".stb-tab")];
  const num = q(".stb-num");
  const plot = q(".stb-plot");
  const ring = q(".stb-ring");
  const tip = q(".stb-tip");
  const [axisFrom, axisTo] = el.querySelectorAll(".stb-axis span");
  let cols = [];

  /* ring and tooltip: placed at once when they appear, glide after */
  const pos = { ringX: 0, ringY: 0, ringH: 0, tipX: 0 };
  const place = () => {
    ring.style.transform = `translate(${pos.ringX}px, ${pos.ringY}px)`;
    ring.style.height = `${pos.ringH}px`;
    tip.style.transform = `translateX(${pos.tipX}px)`;
  };
  const springs = Object.fromEntries(
    Object.keys(pos).map((k) => [k, glide((v) => { pos[k] = v; place(); })])
  );

  /* one column per day: a segment per category and the refund under the line */
  const column = () => {
    const col = document.createElement("div");
    col.className = "stb-col";
    col.innerHTML =
      CATS.map((_, k) => `<span class="stb-bar" style="--c: var(--stb-c${k + 1})"></span>`).join("") +
      `<span class="stb-esc"></span>`;
    return col;
  };

  function paint() {
    const n = MODES[mode];
    const data = makeBars(n);

    /* as many columns as days, kept rather than rebuilt, so a switch
       eases the ones already there to their new heights */
    while (cols.length < n) cols.push(plot.insertBefore(column(), ring));
    while (cols.length > n) cols.pop().remove();

    /* geometry: the gap gives way before a bar gets thinner than 3px,
       so 30 bars at the widest gap still draw */
    const g = Math.max(1, Math.min(gap, (CW - 3 * n) / (n - 1)));
    const bw = Math.max(0, (CW - g * (n - 1)) / n);
    const r = Math.min(2.5, bw / 2);
    const totals = data.map((b) => sum(b.vals));
    const maxT = Math.max(...totals);
    const maxE = Math.max(1, ...data.map((b) => b.esc));
    const scale = (CH - LIFT - 2 - SEG_GAP * (CATS.length - 1)) / maxT;
    const layout = data.map((b) => {
      let y = 0;
      const segs = b.vals.map((v) => {
        const h = Math.max(2, v * scale);
        const s = { bottom: y, h };
        y += h + SEG_GAP;
        return s;
      });
      /* a day with no refund draws nothing under the line */
      return { segs, top: y - SEG_GAP, esc: b.esc ? Math.max(3, (b.esc / maxE) * (BH - LIFT - 2)) : 0 };
    });

    el.style.setProperty("--stb-r", `${r}px`);
    el.style.setProperty("--stb-rr", `${r + 3}px`);
    el.toggleAttribute("data-scrub", at !== null && at < n);

    sub.textContent = `Last ${n} days`;
    ctl.dataset.mode = mode;
    tabs.forEach((t) => {
      const on = t.dataset.mode === mode;
      t.toggleAttribute("data-on", on);
      t.setAttribute("aria-selected", String(on));
    });

    /* the headline pops in on a change, Price flow's way: every
       character is keyed by a generation, so a new total is new
       elements and each plays one short entrance, left to right.
       The first paint does not play it; only a change does. */
    const total = sum(totals);
    if (lastTotal !== total) {
      if (lastTotal !== null) gen += 1;
      lastTotal = total;
      num.setAttribute("aria-label", fmt(total));
      num.innerHTML = fmt(total)
        .split("")
        .map((ch, i) => `<span class="stb-digit"${gen > 0 ? " data-pop" : ""} style="--i: ${i}" aria-hidden="true">${ch}</span>`)
        .join("");
    }

    cols.forEach((col, i) => {
      col.style.left = `${i * (bw + g)}px`;
      col.style.width = `${bw}px`;
      col.style.setProperty("--i", i);
      col.toggleAttribute("data-on", at === i);
      const bars = col.querySelectorAll(".stb-bar");
      layout[i].segs.forEach((s, k) => {
        bars[k].style.bottom = `${BH + 1 + LIFT + (seen ? s.bottom : 0)}px`;
        bars[k].style.height = `${seen ? s.h : 0}px`;
      });
      const esc = col.querySelector(".stb-esc");
      esc.style.top = `${CH + 1 + LIFT}px`;
      esc.style.height = `${seen ? layout[i].esc : 0}px`;
    });

    ring.style.width = `${bw + 6}px`;
    axisFrom.textContent = data[0].short;
    axisTo.textContent = data[n - 1].short;

    /* the tooltip: the day, its total, the two biggest categories and
       what came back */
    const cur = at !== null && at < n ? data[at] : null;
    tip.setAttribute("aria-hidden", String(!cur));
    if (cur) {
      /* with one category the breakdown would only repeat the total, and
         with nothing under the line there is nothing to come back — so
         until there are categories it is the day and what it spent */
      const top2 = CATS.length > 1 ? cur.vals.map((v, k) => ({ v, k })).sort((a, b) => b.v - a.v).slice(0, 2) : [];
      tip.innerHTML = `
        <div class="stb-tip-head"><span>${cur.label}</span><b>${fmt(totals[at])}</b></div>
        ${top2
          .map(({ v, k }) => `<div class="stb-tip-row"><i style="--c: var(--stb-c${k + 1})"></i><span>${CATS[k]}</span><b>${fmt(v)}</b></div>`)
          .join("")}
        ${BH ? `<div class="stb-tip-row" data-esc=""><i></i><span>Refunds</span><b>${fmt(cur.esc)}</b></div>` : ""}`;
    }

    if (at === null || at >= n) {
      was = null;
      return;
    }
    const L = layout[at];
    const left = at * (bw + g);
    const x = left - 3;
    const up = seen ? L.top : 0;
    const down = seen ? L.esc : 0;
    const y = CH - LIFT - up - 3;
    /* round the bar, and the room under the line only when there is some */
    const h = up + 6 + (BH ? LIFT + 1 + LIFT + down : 0);
    /* beside the column: right while it fits there, else left */
    const right = left + bw + 8;
    const tx = right + TIP_W <= CW || left - 8 - TIP_W < 0
      ? Math.min(CW - TIP_W, right)
      : left - 8 - TIP_W;
    const go = (key, v) => {
      if (was === null) springs[key].set(v);
      else springs[key].animate(v);
    };
    go("ringX", x); go("ringY", y); go("ringH", h); go("tipX", tx);
    was = at;
  }

  /* A character that has popped stops being one that pops: the dashboard
     re-inserts this card on every redraw, and re-inserting an element
     restarts its CSS animation, so a flag left on would replay the
     entrance on every click anywhere on the page. */
  num.addEventListener("animationend", (e) => e.target.removeAttribute("data-pop"));

  const pick = (e) => {
    const b = plot.getBoundingClientRect();
    if (!b || b.width === 0) return;
    const n = MODES[mode];
    const i = Math.floor(((e.clientX - b.left) / b.width) * n);
    const next = Math.max(0, Math.min(n - 1, i));
    if (next === at) return;
    at = next;
    paint();
  };
  const leave = () => {
    if (at === null) return;
    at = null;
    paint();
  };

  plot.addEventListener("pointerdown", (e) => {
    try { plot.setPointerCapture(e.pointerId); } catch { /* scripted */ }
    pick(e);
  });
  plot.addEventListener("pointermove", pick);
  plot.addEventListener("pointerup", (e) => {
    try { plot.releasePointerCapture(e.pointerId); } catch { /* scripted */ }
    if (e.pointerType !== "mouse") leave();
  });
  plot.addEventListener("pointercancel", leave);
  plot.addEventListener("pointerleave", leave);

  tabs.forEach((t) =>
    t.addEventListener("click", () => {
      if (t.dataset.mode === mode) return;
      mode = t.dataset.mode;
      paint();
    })
  );

  /* the plot's width: everything is placed in its pixels */
  const ro = new ResizeObserver(() => {
    const w = plot.clientWidth;
    if (!w || w === CW) return;
    CW = w;
    paint();
  });
  ro.observe(plot);

  /* grow in once, the first time the card is on screen */
  let io = null;
  if (typeof IntersectionObserver === "undefined") seen = true;
  else {
    io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        seen = true;
        io.disconnect();
        paint();
      }
    }, { threshold: 0.3 });
    io.observe(el);
  }

  paint();

  return {
    el,
    destroy() {
      ro.disconnect();
      io?.disconnect();
      Object.values(springs).forEach((s) => s.stop());
    },
  };
}
