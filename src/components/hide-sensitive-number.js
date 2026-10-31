/**
 * HideSensitiveNumber — the 60fps snippet "Hide Sensitive Number
 * Interaction" (https://60fps.design/shots/family-stealth-mode-shimmer-effect-interaction),
 * ported from SwiftUI to a plain ES module.
 *
 * Recreates the Stealth Mode balance from Family: a large dollar balance with
 * its change below. Tap the balance to hide it. The number dissolves into five
 * rounded stars while a soft highlight keeps sweeping across them, and the
 * dollar change folds away so only the percentage stays. Tap again to bring
 * the amount back.
 *
 * The motion is the snippet's, unchanged:
 *   - the toggle is SwiftUI's .easeInOut(duration: 0.15) — cubic-bezier(0.42,
 *     0, 0.58, 1) over 150ms — or .linear(duration: 0.1) under Reduce Motion
 *   - the number fades and scales to 0.96 (no scale under Reduce Motion) while
 *     the stars fade in over it, the same curve
 *   - the dollar change folds from 49px to 0 and the gap from 10 to 0; under
 *     Reduce Motion that row switches without animating
 *   - the stars' highlight sweeps once every 1.6s from the moment of the tap,
 *     drawn at up to 60fps, and stops while the stars are hidden, Reduce
 *     Motion is on or the page is in the background
 * SwiftUI-only parts have web stand-ins: the light haptic is a 10ms vibration
 * where the browser has one, and the accessibility label, value and hint are
 * aria-label, aria-pressed and aria-description.
 *
 *   const balance = HideSensitiveNumber();
 *   container.append(balance.el);   // and balance.destroy() when done with it
 *
 * The stars on their own, for hiding numbers somewhere else (the wallet
 * dashboard's balance uses them):
 *
 *   const stars = privacyStars(canvas, { large: true, dark: () => false });
 *   stars.set(true);   // shown: the sweep restarts and runs
 *   stars.destroy();
 *
 * Styles are the `.hsn` block in styles/ds.css.
 */

const EASE_IN_OUT = "cubic-bezier(0.42, 0, 0.58, 1)";

const reduceMotionQuery = window.matchMedia?.("(prefers-reduced-motion: reduce)");
const reduceMotion = () => !!reduceMotionQuery?.matches;

/* SwiftUI's Color(white:) — a grey of that brightness */
const grey = (white) => {
  const v = Math.round(white * 255);
  return `rgb(${v}, ${v}, ${v})`;
};

/**
 * The five stars, drawn into `canvas` at `phase` (0..1 through the sweep, or
 * -1 for none). `dark` mirrors the snippet's greys for a dark background, so
 * the stars stay as quiet against it and the highlight still sweeps toward
 * the background rather than away from it.
 */
function drawStars(canvas, phase, large, dark = false) {
  const ratio = window.devicePixelRatio || 1;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  if (canvas.width !== Math.round(width * ratio) || canvas.height !== Math.round(height * ratio)) {
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
  }
  const context = canvas.getContext("2d");
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  context.clearRect(0, 0, width, height);

  const step = width / 5;
  const radius = Math.min(height * 0.4, step * 0.38);
  context.lineWidth = large ? 8.4 : 1.7;
  context.lineCap = "round";
  for (let index = 0; index < 5; index++) {
    const x = step * (index + 0.5);
    const distance = index / 4 - (phase * 1.8 - 0.4);
    // A broad, low-contrast highlight passes through the rounded spokes.
    const white = phase < 0 ? 0.77 : 0.76 + 0.07 * Math.exp((-distance * distance) / 0.065);
    context.beginPath();
    for (let ray = 0; ray < 3; ray++) {
      const angle = (ray * Math.PI) / 3 + Math.PI / 6;
      const dx = Math.cos(angle) * radius;
      const dy = Math.sin(angle) * radius;
      context.moveTo(x - dx, height / 2 - dy);
      context.lineTo(x + dx, height / 2 + dy);
    }
    context.strokeStyle = grey(dark ? 1 - white : white);
    context.stroke();
  }
}

/**
 * The stars' clock: TimelineView(.animation(minimumInterval: 1 / 60, paused:
 * !stealth || reduceMotion || scenePhase != .active)) — a frame at most every
 * sixtieth of a second, the sweep's phase from the time since the stars were
 * last shown, and nothing while they are hidden, Reduce Motion is on or the
 * page is in the background.
 */
export function privacyStars(canvas, { large = true, dark = () => false } = {}) {
  let on = false;
  let shimmerStart = performance.now();
  let raf = 0;
  let lastFrame = 0;

  const phaseAt = (now) => (reduceMotion() ? -1 : ((Math.max(0, now - shimmerStart) / 1000) % 1.6) / 1.6);
  const paused = () => !on || reduceMotion() || document.visibilityState !== "visible";

  const tick = (now) => {
    raf = 0;
    if (paused()) return;
    if (now - lastFrame >= 1000 / 60 - 1) {
      lastFrame = now;
      drawStars(canvas, phaseAt(now), large, dark());
    }
    raf = requestAnimationFrame(tick);
  };
  const run = () => {
    if (paused()) {
      cancelAnimationFrame(raf);
      raf = 0;
      // the still frame: no highlight under Reduce Motion
      drawStars(canvas, phaseAt(performance.now()), large, dark());
      return;
    }
    if (!raf) raf = requestAnimationFrame(tick);
  };

  document.addEventListener("visibilitychange", run);
  reduceMotionQuery?.addEventListener?.("change", run);
  /* the canvas is sized by CSS; redraw when it is (and on first layout) */
  const ro = new ResizeObserver(run);
  ro.observe(canvas);

  return {
    /** Shows or hides; showing restarts the sweep, as the snippet's tap does. */
    set(next, { restart = true } = {}) {
      if (restart) shimmerStart = performance.now();
      on = next;
      run();
    },
    destroy() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      document.removeEventListener("visibilitychange", run);
      reduceMotionQuery?.removeEventListener?.("change", run);
    },
  };
}

/** The transition's duration and curve, for --hsn-duration and --hsn-ease. */
export const stealthTiming = () =>
  reduceMotion() ? { duration: "100ms", ease: "linear" } : { duration: "150ms", ease: EASE_IN_OUT };

export function HideSensitiveNumber() {
  let stealth = false;

  const el = document.createElement("button");
  el.type = "button";
  el.className = "hsn";
  el.dataset.testid = "stealthBalance";
  el.innerHTML = `
    <span class="hsn-amount">
      <span class="hsn-number"><span class="hsn-currency">$</span>588.04</span>
      <canvas class="hsn-stars" aria-hidden="true"></canvas>
    </span>
    <span class="hsn-change">
      <span class="hsn-dollars"><span>−$1.91</span></span>
      <span class="hsn-percent">−0.32%</span>
    </span>`;
  const stars = privacyStars(el.querySelector(".hsn-stars"), { large: true });

  const sync = () => {
    const { duration, ease } = stealthTiming();
    el.style.setProperty("--hsn-ease", ease);
    el.style.setProperty("--hsn-duration", duration);
    el.toggleAttribute("data-stealth", stealth);
    el.toggleAttribute("data-still", reduceMotion());
    el.setAttribute("aria-pressed", String(stealth));
    el.setAttribute("aria-label", stealth ? "Balance hidden" : "Portfolio balance, 588 dollars and 4 cents");
    el.setAttribute("aria-description", `Stealth Mode ${stealth ? "on" : "off"}. Activate to ${stealth ? "reveal" : "hide"} wallet amounts`);
  };

  const toggleStealth = () => {
    navigator.vibrate?.(10);
    // Reference frames 56 to 64 and 258 to 264 show a quick overlapping replacement.
    // Reduce Motion removes travel; the short dissolve still communicates the change.
    stealth = !stealth;
    sync();
    stars.set(stealth);
  };

  el.addEventListener("click", toggleStealth);
  reduceMotionQuery?.addEventListener?.("change", sync);
  sync();
  stars.set(false);

  return {
    el,
    destroy() {
      stars.destroy();
      reduceMotionQuery?.removeEventListener?.("change", sync);
    },
  };
}
