/**
 * shuffleDigits — every digit inside an element spins through random digits
 * and lands on its own, left to right, over a second; the wallet
 * dashboard's balance uses it to reveal itself.
 *
 *   const stop = shuffleDigits(el);           // 1s
 *   shuffleDigits(el, { duration: 800 });
 *
 * Each digit is held at its final width while it spins, so the figure never
 * jitters sideways; commas, dots and letters stay as they are. The first
 * digit lands a third of the way in and the last at the end. When it is done
 * the element's text is put back exactly as it was. Under Reduce Motion it
 * does nothing. Returns a function that stops it at once, on the final
 * figure.
 *
 * Styles are the `.shuf` rule in styles/ds.css.
 */

const reduceMotion = () => !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export function shuffleDigits(root, { duration = 1000, every = 70 } = {}) {
  if (!root || reduceMotion()) return () => {};

  // wrap every digit in a span of its own
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const texts = [];
  while (walker.nextNode()) if (/\d/.test(walker.currentNode.data)) texts.push(walker.currentNode);
  const cells = [];
  for (const node of texts) {
    const frag = document.createDocumentFragment();
    for (const ch of node.data) {
      if (!/\d/.test(ch)) {
        frag.append(ch);
        continue;
      }
      const el = document.createElement("span");
      el.className = "shuf";
      el.textContent = ch;
      cells.push({ el, final: ch });
      frag.append(el);
    }
    node.replaceWith(frag);
  }
  if (!cells.length) return () => {};

  // hold each at its final width, so a wider random digit doesn't push the rest
  for (const c of cells) c.el.style.width = `${c.el.getBoundingClientRect().width}px`;
  // when each lands: the first a third of the way in, the last at the end
  cells.forEach((c, i) => (c.at = duration * (cells.length === 1 ? 1 : 0.35 + (0.65 * i) / (cells.length - 1))));

  let raf = 0;
  let lastSpin = -Infinity;
  const start = performance.now();
  const finish = () => {
    cancelAnimationFrame(raf);
    // back to plain text, as it was
    for (const c of cells) if (c.el.isConnected) c.el.replaceWith(c.final);
    root.normalize();
  };
  const tick = (now) => {
    const t = now - start;
    if (t >= duration) return finish();
    // a new random digit every 70ms or so (`every`), until each one lands
    const spin = now - lastSpin >= every;
    if (spin) lastSpin = now;
    for (const c of cells) {
      if (t >= c.at) c.el.textContent = c.final;
      else if (spin) c.el.textContent = String(Math.floor(Math.random() * 10));
    }
    raf = requestAnimationFrame(tick);
  };
  for (const c of cells) c.el.textContent = String(Math.floor(Math.random() * 10));
  raf = requestAnimationFrame(tick);
  return finish;
}
