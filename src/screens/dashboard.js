/**
 * Wallet dashboard (dashboard.html) — "Work in progress" file, node 646:16528
 * ("Desktop-large (XL)").
 *
 * Dark theme, side menu, balance and recent transactions, as drawn. What the
 * frame implies is wired up:
 *   - the eye hides and shows the balance
 *   - the arrows swap which currency the balance leads with (USD ↔ USDT)
 *   - transaction rows have the frame's hover (row 2) and pressed (row 3) states
 *   - "See all" and the menu's Transactions open the full list
 *   - Fold menu collapses the menu to its icons (and back)
 *   - Recipients, Cards and Settings aren't designed yet, so they say so
 *   - Log out goes back to the prototype menu
 * The page is in the URL hash (#home, #transactions, …), so Back works.
 */

import { esc } from "../ui.js";

const ICON = "assets/ds/";
const USER = { name: "Arthur Brown", initials: "AB" };
const BALANCE = 23562.89;

const AIRBNB = { party: "Airbnb", logo: `${ICON}db-merchant-airbnb.jpg`, amount: -1200 };
const JAMES = { party: "James Wilson", initials: "JW", amount: 4500 };

/** The eight rows of the frame — Airbnb and James Wilson, alternating. */
const RECENT = Array.from({ length: 8 }, (_, i) => ({ ...(i % 2 ? JAMES : AIRBNB), date: "13 Oct 2026 · 11:13 UTC" }));

/** The full list behind "See all": the same pair, a day apart, going back. */
const ALL = Array.from({ length: 16 }, (_, i) => {
  const day = 13 - Math.floor(i / 2);
  return { ...(i % 2 ? JAMES : AIRBNB), date: `${String(day).padStart(2, "0")} Oct 2026 · 11:13 UTC` };
});

const NAV = [
  { id: "home", label: "Home", icon: "db-home.svg" },
  { id: "transactions", label: "Transactions", icon: "db-transactions.svg" },
  { id: "recipients", label: "Recipients", icon: "db-recipients.svg" },
  { id: "cards", label: "Cards", icon: "db-card.svg" },
];
const PAGES = new Set([...NAV.map((n) => n.id), "settings"]);

const num = (n) => Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const sign = (n) => (n < 0 ? "−" : "+");

const icon = (file) => `<img class="db-icon" src="${ICON}${file}" width="24" height="24" alt="" />`;

const avatar = (t) =>
  t.logo
    ? `<img class="db-avatar db-avatar--logo" src="${t.logo}" width="32" height="32" alt="" />`
    : `<span class="db-avatar">${esc(t.initials)}</span>`;

/** Transaction — one row of the list. */
const row = (t) => `
  <li>
    <button type="button" class="db-tx">
      ${avatar(t)}
      <span class="db-tx__info">
        <span class="db-tx__line db-tx__line--main">
          <span class="db-tx__party">${esc(t.party)}</span>
          <span class="db-tx__amount ${t.amount < 0 ? "is-expense" : "is-income"}">${sign(t.amount)}$${num(t.amount)}</span>
        </span>
        <span class="db-tx__line db-tx__line--sub">
          <span class="db-tx__date">${esc(t.date)}</span>
          <span class="db-tx__usdt">${sign(t.amount)}${num(t.amount)} USDT</span>
        </span>
      </span>
    </button>
  </li>`;

const navButton = ({ id, label, icon: file }, current) => `
  <a class="db-nav__item" href="#${id}" ${id === current ? `aria-current="page"` : ""} title="${label}">
    ${icon(file)}<span class="db-nav__label">${label}</span>
  </a>`;

/** The balance block: big figure, eye, and the other currency with the swap arrows. */
function balance({ hidden, lead }) {
  const [whole, cents] = num(BALANCE).split(".");
  const usd = lead === "usd";
  const big = `${usd ? "$" : ""}${hidden ? "••••••" : whole}<span class="db-balance__cents">${hidden ? "" : `.${cents}`}${usd ? "" : " USDT"}</span>`;
  const small = hidden ? (usd ? "•••••• USDT" : "$••••••") : usd ? `${num(BALANCE)} USDT` : `$${num(BALANCE)}`;

  return `
    <section class="db-balance" aria-label="Balance">
      <h2 class="db-balance__label">Balance</h2>
      <div class="db-balance__row">
        <p class="db-balance__amount">${big}</p>
        <button type="button" class="db-iconbtn" data-toggle-hide aria-pressed="${hidden}"
          aria-label="${hidden ? "Show balance" : "Hide balance"}" title="${hidden ? "Show balance" : "Hide balance"}">
          ${hidden ? `<span class="db-icon db-icon--eye" aria-hidden="true"></span>` : icon("db-eye-off.svg")}
        </button>
      </div>
      <div class="db-balance__row db-balance__row--sub">
        <p class="db-balance__other">${small}</p>
        <button type="button" class="db-iconbtn" data-swap aria-label="Show balance in ${usd ? "USDT" : "US dollars"} first"
          title="Swap currency">${icon("db-swap.svg")}</button>
      </div>
    </section>`;
}

function main(state) {
  switch (state.page) {
    case "home":
      return `
        ${balance(state)}
        <section class="db-section" aria-labelledby="db-recent">
          <div class="db-section__head">
            <h2 id="db-recent">Transactions</h2>
            <a href="#transactions" class="db-link">See all</a>
          </div>
          <ul class="db-txlist">${RECENT.map(row).join("")}</ul>
        </section>`;
    case "transactions":
      return `
        <section class="db-section" aria-labelledby="db-all">
          <div class="db-section__head"><h2 id="db-all">Transactions</h2></div>
          <ul class="db-txlist">${ALL.map(row).join("")}</ul>
        </section>`;
    default: {
      const label = state.page[0].toUpperCase() + state.page.slice(1);
      return `
        <section class="db-section">
          <div class="db-section__head"><h2>${label}</h2></div>
          <p class="db-empty">This page isn&rsquo;t in the design yet. <a href="#home" class="db-link">Back to Home</a></p>
        </section>`;
    }
  }
}

function render(state) {
  return `
  <div class="db ${state.folded ? "is-folded" : ""}">
    <header class="db-header">
      <a href="#home" class="db-logo">Paymesh</a>
      <div class="db-user">
        <span class="db-avatar">${USER.initials}</span>
        <span class="db-user__name">${esc(USER.name)}</span>
      </div>
    </header>

    <nav class="db-nav" aria-label="Main">
      <div class="db-nav__group">${NAV.map((n) => navButton(n, state.page)).join("")}</div>
      <div class="db-nav__group db-nav__group--foot">
        <button type="button" class="db-nav__item db-nav__fold" data-fold aria-expanded="${!state.folded}"
          title="${state.folded ? "Unfold menu" : "Fold menu"}">
          ${icon("db-panel-left-close.svg")}<span class="db-nav__label">${state.folded ? "Unfold menu" : "Fold menu"}</span>
        </button>
        ${navButton({ id: "settings", label: "Settings", icon: "db-settings.svg" }, state.page)}
        <a class="db-nav__item" href="./" title="Log out">${icon("db-log-out.svg")}<span class="db-nav__label">Log out</span></a>
      </div>
    </nav>

    <main class="db-main">${main(state)}</main>
  </div>`;
}

export default {
  mount(root) {
    const pageFromHash = () => {
      const id = location.hash.slice(1);
      return PAGES.has(id) ? id : "home";
    };
    const state = { page: pageFromHash(), hidden: false, lead: "usd", folded: false };
    const draw = () => (root.innerHTML = render(state));

    root.addEventListener("click", (e) => {
      if (e.target.closest("[data-toggle-hide]")) state.hidden = !state.hidden;
      else if (e.target.closest("[data-swap]")) state.lead = state.lead === "usd" ? "usdt" : "usd";
      else if (e.target.closest("[data-fold]")) state.folded = !state.folded;
      else return;
      draw();
    });

    addEventListener("hashchange", () => {
      state.page = pageFromHash();
      draw();
      scrollTo(0, 0);
    });

    draw();
  },
};
