/**
 * Hash router.
 *
 * Hash routes keep the prototype deployable as a plain static site — no
 * rewrite rules, and every screen is directly linkable for review.
 */

const routes = new Map();
let mounted = null;
let root = null;

export function register(path, screen) {
  routes.set(path, screen);
}

export function go(path, { replace = false } = {}) {
  if (replace) location.replace(`${location.pathname}${location.search}${path}`);
  else location.hash = path.replace(/^#/, "");
}

export function currentPath() {
  return location.hash || "#/";
}

export function start(rootEl, fallback = "#/") {
  root = rootEl;
  addEventListener("hashchange", render);
  if (!location.hash) go(fallback, { replace: true });
  render();
}

export function render() {
  const path = currentPath();
  const screen = routes.get(path) || routes.get("#/404");

  if (mounted && typeof mounted.destroy === "function") mounted.destroy();
  mounted = null;

  if (!screen) {
    root.innerHTML = "";
    return;
  }

  root.innerHTML = `<div class="fade-in">${screen.render()}</div>`;
  root.scrollTop = 0;
  scrollTo(0, 0);

  if (typeof screen.mount === "function") {
    mounted = screen.mount(root) || null;
  }
  const focusTarget = root.querySelector("[data-autofocus]");
  if (focusTarget) focusTarget.focus();
}
