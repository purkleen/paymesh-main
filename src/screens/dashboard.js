/**
 * Wallet dashboard (dashboard.html) — "Work in progress" file, node 646:16528
 * ("Desktop-large (XL)").
 *
 * Dark theme, side menu, balance and recent transactions, as drawn. What the
 * frame implies is wired up:
 *   - the eye hides and shows the balance
 *   - the arrows swap which currency the balance leads with (USD ↔ USDT)
 *   - transaction rows have the frame's hover (row 2) and pressed (row 3) states
 *   - "See all" and the menu's Transactions open the Transactions page
 *     (node 639:12567): search, Filters (money in / out) and Export (a CSV
 *     of what's shown), with the list grouped by day
 *   - Fold menu collapses the menu to its icons (and back)
 *   - Recipients lists everyone in the transactions, A–Z in letter sections,
 *     with a search; picking one opens their transactions
 *   - Cards and Settings aren't designed yet, so they say so
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

/**
 * The Transactions page's groups, as in node 639:12567. The frame dates every
 * row 13 Oct 2026; here each row carries its group's date, with "today" taken
 * as 13 Oct 2026.
 */
const GROUPS = [
  { label: "Today", date: "13 Oct 2026", rows: 2 },
  { label: "Yesterday", date: "12 Oct 2026", rows: 4 },
  { label: "13 September 2026", date: "13 Sep 2026", rows: 4 },
].map(({ label, date, rows }) => ({
  label,
  items: Array.from({ length: rows }, (_, i) => ({ ...(i % 2 ? JAMES : AIRBNB), date: `${date} · 11:13 UTC` })),
}));

const TYPES = [
  { id: "all", label: "All" },
  { id: "in", label: "Money in" },
  { id: "out", label: "Money out" },
];

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

/** The groups and rows left after the search and the type filter. */
function filtered({ query, type }) {
  const q = query.trim().toLowerCase();
  const keep = (t) =>
    (type === "all" || (type === "in" ? t.amount > 0 : t.amount < 0)) &&
    (!q || [t.party, t.date, `${sign(t.amount)}$${num(t.amount)}`, num(t.amount)].some((v) => v.toLowerCase().includes(q)));
  return GROUPS.map((g) => ({ ...g, items: g.items.filter(keep) })).filter((g) => g.items.length);
}

const groupsHTML = (state) => {
  const groups = filtered(state);
  return groups.length
    ? groups
        .map((g) => `<section class="db-group"><h3 class="db-group__label">${esc(g.label)}</h3><ul class="db-txlist">${g.items.map(row).join("")}</ul></section>`)
        .join("")
    : `<p class="db-empty">No transactions match.</p>`;
};

/** Transactions — node 639:12567. */
function transactionsPage(state) {
  return `
    <section class="db-tx-page" aria-labelledby="db-all">
      <div class="db-tx-page__head">
        <h2 id="db-all" class="db-tx-page__title">Transactions</h2>
        <div class="db-tx-page__actions">
          <button type="button" class="db-chip db-chip--primary" data-filters aria-expanded="${state.filtersOpen}">
            <img src="${ICON}db-filters.svg" width="20" height="20" alt="" />Filters${state.type === "all" ? "" : " (1)"}
          </button>
          <button type="button" class="db-chip" data-export>
            <img src="${ICON}db-export.svg" width="20" height="20" alt="" />Export
          </button>
        </div>
      </div>
      ${
        state.filtersOpen
          ? `<div class="db-filters" role="radiogroup" aria-label="Type">${TYPES.map(
              (t) => `<button type="button" class="db-filter" role="radio" data-type="${t.id}" aria-checked="${t.id === state.type}">${t.label}</button>`
            ).join("")}</div>`
          : ""
      }
      <label class="db-search">
        <img src="${ICON}db-search.svg" width="24" height="24" alt="" />
        <input type="search" data-search value="${esc(state.query)}" placeholder="Search transaction, people, businesses, etc."
          aria-label="Search transactions" autocomplete="off" />
      </label>
      <div class="db-groups" data-groups>${groupsHTML(state)}</div>
    </section>`;
}

/**
 * Recipients — everyone who appears in the transactions, once each, with how
 * many transactions there are and the latest one (the groups run newest first).
 */
const RECIPIENTS = (() => {
  const byParty = new Map();
  for (const g of GROUPS)
    for (const t of g.items) {
      const r = byParty.get(t.party);
      if (r) r.count += 1;
      else byParty.set(t.party, { ...t, count: 1 });
    }
  return [...byParty.values()].sort((a, b) => a.party.localeCompare(b.party));
})();

const recipientRow = (r) => `
  <li>
    <button type="button" class="db-tx" data-recipient="${esc(r.party)}">
      ${avatar(r)}
      <span class="db-tx__info">
        <span class="db-tx__line db-tx__line--main">
          <span class="db-tx__party">${esc(r.party)}</span>
          <span class="db-tx__amount ${r.amount < 0 ? "is-expense" : "is-income"}">${sign(r.amount)}$${num(r.amount)}</span>
        </span>
        <span class="db-tx__line db-tx__line--sub">
          <span class="db-tx__date">Last transaction ${esc(r.date.split(" · ")[0])}</span>
          <span class="db-tx__usdt">${r.count} transaction${r.count === 1 ? "" : "s"}</span>
        </span>
      </span>
    </button>
  </li>`;

/** The recipients matching the search, in a section per first letter. */
const recipientsHTML = ({ recipientQuery }) => {
  const q = recipientQuery.trim().toLowerCase();
  const sections = new Map();
  for (const r of RECIPIENTS.filter((r) => !q || r.party.toLowerCase().includes(q))) {
    const letter = /[a-z]/i.test(r.party[0]) ? r.party[0].toUpperCase() : "#";
    if (!sections.has(letter)) sections.set(letter, []);
    sections.get(letter).push(r);
  }
  return sections.size
    ? [...sections]
        .map(
          ([letter, list]) =>
            `<section class="db-group" aria-label="${letter}"><h3 class="db-group__label">${letter}</h3><ul class="db-txlist">${list.map(recipientRow).join("")}</ul></section>`
        )
        .join("")
    : `<p class="db-empty">No recipients match.</p>`;
};

/** Recipients — laid out like the Transactions page. */
function recipientsPage(state) {
  return `
    <section class="db-tx-page" aria-labelledby="db-recipients">
      <div class="db-tx-page__head">
        <h2 id="db-recipients" class="db-tx-page__title">Recipients</h2>
      </div>
      <label class="db-search">
        <img src="${ICON}db-search.svg" width="24" height="24" alt="" />
        <input type="search" data-recipient-search value="${esc(state.recipientQuery)}" placeholder="Search people and businesses"
          aria-label="Search recipients" autocomplete="off" />
      </label>
      <div class="db-groups" data-recipients>${recipientsHTML(state)}</div>
    </section>`;
}

/** Downloads what the list shows as a CSV. */
function exportCSV(state) {
  const quote = (v) => `"${String(v).replace(/"/g, '""')}"`;
  const lines = [["Date", "Party", "Amount (USD)", "Amount (USDT)"]];
  for (const g of filtered(state))
    for (const t of g.items) lines.push([t.date, t.party, (t.amount).toFixed(2), (t.amount).toFixed(2)]);
  const blob = new Blob([lines.map((l) => l.map(quote).join(",")).join("\n")], { type: "text/csv" });
  const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: "paymesh-transactions.csv" });
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 0);
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
      return transactionsPage(state);
    case "recipients":
      return recipientsPage(state);
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
    const state = { page: pageFromHash(), hidden: false, lead: "usd", folded: false, query: "", type: "all", filtersOpen: false, recipientQuery: "" };
    const draw = () => (root.innerHTML = render(state));

    root.addEventListener("click", (e) => {
      if (e.target.closest("[data-toggle-hide]")) state.hidden = !state.hidden;
      else if (e.target.closest("[data-swap]")) state.lead = state.lead === "usd" ? "usdt" : "usd";
      else if (e.target.closest("[data-fold]")) state.folded = !state.folded;
      else if (e.target.closest("[data-filters]")) state.filtersOpen = !state.filtersOpen;
      else if (e.target.closest("[data-type]")) state.type = e.target.closest("[data-type]").dataset.type;
      else if (e.target.closest("[data-export]")) return exportCSV(state);
      else if (e.target.closest("[data-recipient]")) {
        // A recipient opens the Transactions page, searched to them.
        state.query = e.target.closest("[data-recipient]").dataset.recipient;
        state.type = "all";
        location.hash = "#transactions";
        return;
      }
      else return;
      draw();
    });

    // Typing only redraws the list, so the field keeps its focus.
    root.addEventListener("input", (e) => {
      if (e.target.matches("[data-search]")) {
        state.query = e.target.value;
        root.querySelector("[data-groups]").innerHTML = groupsHTML(state);
      } else if (e.target.matches("[data-recipient-search]")) {
        state.recipientQuery = e.target.value;
        root.querySelector("[data-recipients]").innerHTML = recipientsHTML(state);
      }
    });

    addEventListener("hashchange", () => {
      state.page = pageFromHash();
      draw();
      scrollTo(0, 0);
    });

    draw();
  },
};
