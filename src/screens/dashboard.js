/**
 * Wallet dashboard (dashboard.html) — "Work in progress" file, node 646:16528
 * ("Desktop-large (XL)").
 *
 * Dark theme, side menu, balance and recent transactions, as drawn. What the
 * frame implies is wired up:
 *   - the eye hides and shows the balance
 *   - the arrows swap which currency the balance leads with (USD ↔ USDT)
 *   - under the balance, Bencho's Pull to refresh portfolio card
 *     (src/components/pull-to-refresh.js)
 *   - transaction rows have the frame's hover (row 2) and pressed (row 3) states
 *   - "See all" and the menu's Transactions open the Transactions page
 *     (node 1141:4323): search, All / In / Out, Filters (shows and hides
 *     those) and Sort by date (or amount), with the list grouped by day
 *   - Fold menu collapses the menu to its icons (and back)
 *   - Recipients lists everyone in the transactions, A–Z in letter sections,
 *     with a search; picking one opens their transactions
 *   - Cards and Settings aren't designed yet, so they say so
 *   - Log out goes back to the prototype menu
 *   - on phones the menu sits behind a hamburger button next to the avatar,
 *     and a sticky "Add funds" button runs along the bottom (its page isn't
 *     designed yet, so it says so)
 * The page is in the URL hash (#home, #transactions, …), so Back works.
 */

import { esc } from "../ui.js";
import { PullToRefresh } from "../components/pull-to-refresh.js";

const ICON = "assets/ds/";
const USER = { name: "Arthur Brown", initials: "AB" };
const BALANCE = 23562.89;

/**
 * Recipients — 10 people and 10 businesses. Airbnb keeps the logo from the
 * frame; everyone else gets an initials avatar, taking the eight avatar
 * colours in turn, A–Z (`--avatar-*` in ds.css). `range` is how much a
 * transaction with them tends to be, in dollars.
 */
const AVATAR_COLORS = ["red", "orange", "yellow", "green", "teal", "blue", "purple", "pink"];

const RECIPIENT_LIST = [
  { party: "Airbnb", kind: "business", logo: `${ICON}db-merchant-airbnb.jpg`, range: [180, 1600] },
  { party: "Aurora Stays", kind: "business", range: [240, 1400] },
  { party: "Bluebird Coffee", kind: "business", range: [4, 28] },
  { party: "Cedar & Co. Design", kind: "business", range: [350, 2800] },
  { party: "Harbor Grocers", kind: "business", range: [18, 240] },
  { party: "Lumen Electric", kind: "business", range: [60, 320] },
  { party: "Metro Transit", kind: "business", range: [3, 95] },
  { party: "Northwind Supplies", kind: "business", range: [40, 900] },
  { party: "Peak Fitness", kind: "business", range: [29, 120] },
  { party: "Pixel Print Shop", kind: "business", range: [12, 180] },
  { party: "Ava Hughes", kind: "person", range: [15, 600] },
  { party: "Emma Rodriguez", kind: "person", range: [20, 1200] },
  { party: "Ethan Brooks", kind: "person", range: [10, 400] },
  { party: "James Wilson", kind: "person", range: [500, 4500] },
  { party: "Liam Carter", kind: "person", range: [25, 800] },
  { party: "Lucas Kim", kind: "person", range: [10, 350] },
  { party: "Mia Thompson", kind: "person", range: [40, 2000] },
  { party: "Noah Patel", kind: "person", range: [15, 650] },
  { party: "Olivia Bennett", kind: "person", range: [30, 1500] },
  { party: "Sophia Nguyen", kind: "person", range: [20, 900] },
].map((r, _, list) => ({
  ...r,
  // in A–Z order, so neighbours on Recipients differ
  color: r.logo
    ? undefined
    : AVATAR_COLORS[list.filter((o) => !o.logo && o.party.localeCompare(r.party) < 0).length % AVATAR_COLORS.length],
  initials: r.party
    .split(/\s+/)
    .filter((w) => /^[a-z]/i.test(w))
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join(""),
}));

/**
 * The transaction history: 13 transactions, random but from a fixed seed, so
 * every visit shows the same ones. Two are today and two yesterday; the rest
 * are spread over the last 60 days, weighted towards recent days. Each is
 * with a different recipient, so 7 of the 20 have none yet. Businesses are
 * payments out (now and then a refund); with people, money goes both ways.
 * "Today" is 13 Oct 2026.
 */
const TODAY = Date.UTC(2026, 9, 13);
const DAY = 24 * 60 * 60 * 1000;

const TRANSACTIONS = (() => {
  let seed = 20261013;
  const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);

  const make = (r, daysAgo) => {
    const [lo, hi] = r.range;
    const size = Math.round((lo + rand() * (hi - lo)) * 100) / 100;
    const incoming = r.kind === "business" ? rand() < 0.08 : rand() < 0.5;
    const at = TODAY - daysAgo * DAY + Math.floor(rand() * DAY);
    const { range, ...shown } = r;
    return { ...shown, amount: incoming ? size : -size, at };
  };
  const someDay = () => Math.floor(rand() ** 2 * 58);

  // 13 different recipients, in a seeded shuffle
  const who = RECIPIENT_LIST.map((r) => [rand(), r])
    .sort((a, b) => a[0] - b[0])
    .slice(0, 13)
    .map(([, r]) => r);
  const list = who.map((r, i) => make(r, i < 2 ? 0 : i < 4 ? 1 : 2 + someDay()));

  // "13 Oct 2026", as in the frames (en-GB would write "Sept")
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const day = (at) => {
    const d = new Date(at);
    return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
  };
  const time = (at) => new Date(at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" });
  return list.sort((a, b) => b.at - a.at).map((t) => ({ ...t, date: `${day(t.at)} · ${time(t.at)} UTC` }));
})();

/** Home's list — the latest eight, as many rows as the frame has. */
const RECENT = TRANSACTIONS.slice(0, 8);

/**
 * The Transactions page's groups (node 1141:4323): Today, Yesterday, then one
 * per date, written "20 October, Friday".
 */
const GROUPS = (() => {
  const label = (at) => {
    const ago = Math.floor((TODAY + DAY - 1 - at) / DAY);
    if (ago <= 0) return "Today";
    if (ago === 1) return "Yesterday";
    const d = new Date(at);
    const opts = { timeZone: "UTC" };
    return `${d.toLocaleDateString("en-GB", { ...opts, day: "numeric", month: "long" })}, ${d.toLocaleDateString("en-GB", { ...opts, weekday: "long" })}`;
  };
  const groups = [];
  for (const t of TRANSACTIONS) {
    const l = label(t.at);
    if (groups.at(-1)?.label !== l) groups.push({ label: l, items: [] });
    groups.at(-1).items.push(t);
  }
  return groups;
})();

const TYPES = [
  { id: "all", label: "All" },
  { id: "in", label: "In" },
  { id: "out", label: "Out" },
];

/** Sort by date — sorting by amount drops the day headings. */
const SORTS = [
  { id: "newest", label: "Newest first", by: "date" },
  { id: "oldest", label: "Oldest first", by: "date" },
  { id: "largest", label: "Largest amount", by: "amount" },
  { id: "smallest", label: "Smallest amount", by: "amount" },
];

const NAV = [
  { id: "home", label: "Home", icon: "db-home.svg" },
  { id: "transactions", label: "Transactions", icon: "db-transactions.svg" },
  { id: "recipients", label: "Recipients", icon: "db-recipients.svg" },
  { id: "cards", label: "Cards", icon: "db-card.svg" },
];
const PAGES = new Set([...NAV.map((n) => n.id), "settings", "add-funds"]);
const PAGE_TITLES = { "add-funds": "Add funds" };

const num = (n) => Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const sign = (n) => (n < 0 ? "−" : "+");

const icon = (file) => `<img class="db-icon" src="${ICON}${file}" width="24" height="24" alt="" />`;

/** Account avatar or merchant logo; `large` is the Transactions page's 40px one. */
const avatar = (t, large = false) => {
  const size = large ? 40 : 32;
  const cls = `db-avatar${large ? " db-avatar--l" : ""}`;
  if (t.logo) return `<img class="${cls} db-avatar--logo" src="${t.logo}" width="${size}" height="${size}" alt="" />`;
  return `<span class="${cls} db-avatar--${t.color}">${esc(t.initials)}</span>`;
};

/** Transaction — one row of the list. */
const row = (t, large = false) => `
  <li>
    <button type="button" class="db-tx">
      ${avatar(t, large)}
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

/**
 * The groups and rows left after the search and the type filter, in the
 * chosen order. The search also matches the day headings ("Friday",
 * "20 October").
 */
function filtered({ query, type, sort }) {
  const q = query.trim().toLowerCase();
  const keep = (g) => (t) =>
    (type === "all" || (type === "in" ? t.amount > 0 : t.amount < 0)) &&
    (!q || [g.label, t.party, t.date, `${sign(t.amount)}$${num(t.amount)}`, num(t.amount)].some((v) => v.toLowerCase().includes(q)));
  const groups = GROUPS.map((g) => ({ ...g, items: g.items.filter(keep(g)) })).filter((g) => g.items.length);

  if (sort === "oldest") return groups.reverse().map((g) => ({ ...g, items: [...g.items].reverse() }));
  if (sort === "largest" || sort === "smallest") {
    const dir = sort === "largest" ? -1 : 1;
    const items = groups.flatMap((g) => g.items).sort((a, b) => dir * (Math.abs(a.amount) - Math.abs(b.amount)));
    return items.length ? [{ label: "", items }] : [];
  }
  return groups;
}

const groupsHTML = (state) => {
  const groups = filtered(state);
  return groups.length
    ? groups
        .map(
          (g) =>
            `<section class="db-group">${g.label ? `<h3 class="db-group__label">${esc(g.label)}</h3>` : ""}<ul class="db-txlist">${g.items
              .map((t) => row(t, true))
              .join("")}</ul></section>`
        )
        .join("")
    : `<p class="db-empty">No transactions match.</p>`;
};

/**
 * Search — Paymesh Design System node 1484:15499: search icon, the field, and
 * the close button, which clears it (shown once there's something to clear).
 */
const searchField = ({ attr, value, placeholder, label }) => `
  <div class="db-search">
    <label class="db-search__field">
      <img src="${ICON}db-search.svg" width="24" height="24" alt="" />
      <input type="search" ${attr} value="${esc(value)}" placeholder="${placeholder}" aria-label="${label}" autocomplete="off" />
    </label>
    <button type="button" class="db-search__clear" data-clear aria-label="Clear search" title="Clear search">
      <span class="db-icon--clear" aria-hidden="true"></span>
    </button>
  </div>`;

/** Sort by date — Button (secondary, S) and the menu it opens. */
function sortMenu(state) {
  const current = SORTS.find((s) => s.id === state.sort);
  return `
    <div class="db-sort" data-sort-wrap>
      <button type="button" class="db-chip db-chip--trailing" data-sort-toggle aria-haspopup="true" aria-expanded="${state.sortOpen}"
        aria-label="Sort by ${current.by}: ${current.label.toLowerCase()}">
        Sort by ${current.by}<span class="db-chevron" aria-hidden="true"></span>
      </button>
      ${
        state.sortOpen
          ? `<div class="db-sort__menu" role="radiogroup" aria-label="Sort">${SORTS.map(
              (s) => `<button type="button" class="db-sort__item" role="radio" data-sort="${s.id}" aria-checked="${s.id === state.sort}">${s.label}</button>`
            ).join("")}</div>`
          : ""
      }
    </div>`;
}

/** Transactions — node 1141:4323. */
function transactionsPage(state) {
  return `
    <section class="db-tx-page" aria-labelledby="db-all">
      <div class="db-tx-page__top">
        <div class="db-tx-page__head">
          <h2 id="db-all" class="db-tx-page__title">Transactions</h2>
          <div class="db-tx-page__actions">
            <button type="button" class="db-chip ${state.filtersOpen ? "db-chip--primary" : ""}" data-filters aria-controls="db-types"
              aria-expanded="${state.filtersOpen}">
              <span class="db-filters-icon" aria-hidden="true"></span>Filters${!state.filtersOpen && state.type !== "all" ? " (1)" : ""}
            </button>
            ${sortMenu(state)}
          </div>
        </div>
        ${searchField({ attr: "data-search", value: state.query, placeholder: "Search recipients, amounts, or transaction dates", label: "Search transactions" })}
      </div>
      <div class="db-tx-page__list">
        ${
          state.filtersOpen
            ? `<div class="db-types" id="db-types" role="radiogroup" aria-label="Type">${TYPES.map(
                (t) => `<button type="button" class="db-type" role="radio" data-type="${t.id}" aria-checked="${t.id === state.type}">${t.label}</button>`
              ).join("")}</div>`
            : ""
        }
        <div class="db-groups" data-groups>${groupsHTML(state)}</div>
      </div>
    </section>`;
}

/**
 * Recipients — all 20, with the total of their transactions, how many there
 * are and the date of the latest (the groups run newest first).
 */
const RECIPIENTS = (() => {
  const byParty = new Map(RECIPIENT_LIST.map(({ range, ...r }) => [r.party, { ...r, count: 0, amount: 0 }]));
  for (const g of GROUPS)
    for (const t of g.items) {
      const r = byParty.get(t.party);
      if (!r.count) r.date = t.date;
      r.count += 1;
      r.amount += t.amount;
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
          ${r.count ? `<span class="db-tx__amount ${r.amount < 0 ? "is-expense" : "is-income"}">${sign(r.amount)}$${num(r.amount)}</span>` : ""}
        </span>
        <span class="db-tx__line db-tx__line--sub">
          <span class="db-tx__date">${r.count ? `Last transaction ${esc(r.date.split(" · ")[0])}` : "No transactions yet"}</span>
          ${r.count ? `<span class="db-tx__usdt">${r.count} transaction${r.count === 1 ? "" : "s"}</span>` : ""}
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
      ${searchField({ attr: "data-recipient-search", value: state.recipientQuery, placeholder: "Search people and businesses", label: "Search recipients" })}
      <div class="db-groups" data-recipients>${recipientsHTML(state)}</div>
    </section>`;
}

function main(state) {
  switch (state.page) {
    case "home":
      return `
        ${balance(state)}
        <div data-pull-to-refresh></div>
        <section class="db-section" aria-labelledby="db-recent">
          <div class="db-section__head">
            <h2 id="db-recent">Transactions</h2>
            <a href="#transactions" class="db-link">See all</a>
          </div>
          <ul class="db-txlist">${RECENT.map((t) => row(t)).join("")}</ul>
        </section>`;
    case "transactions":
      return transactionsPage(state);
    case "recipients":
      return recipientsPage(state);
    default: {
      const label = PAGE_TITLES[state.page] || state.page[0].toUpperCase() + state.page.slice(1);
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
  <div class="db ${state.folded ? "is-folded" : ""} ${state.menuOpen ? "is-menu-open" : ""}">
    <header class="db-header">
      <a href="#home" class="db-logo">Paymesh</a>
      <div class="db-user">
        <span class="db-avatar">${USER.initials}</span>
        <span class="db-user__name">${esc(USER.name)}</span>
        <button type="button" class="db-iconbtn db-menu-btn" data-menu aria-controls="db-nav" aria-expanded="${state.menuOpen}"
          aria-label="${state.menuOpen ? "Close menu" : "Open menu"}">
          ${state.menuOpen ? `<span class="db-icon db-icon--close" aria-hidden="true"></span>` : icon("db-menu.svg")}
        </button>
      </div>
    </header>

    <nav class="db-nav" id="db-nav" aria-label="Main">
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

    <div class="db-addfunds">
      <a href="#add-funds" class="db-addfunds__btn"><img src="${ICON}add.svg" width="24" height="24" alt="" />Add funds</a>
    </div>
  </div>`;
}

export default {
  mount(root) {
    const pageFromHash = () => {
      const id = location.hash.slice(1);
      return PAGES.has(id) ? id : "home";
    };
    const state = { page: pageFromHash(), hidden: false, lead: "usd", folded: false, menuOpen: false, query: "", type: "all", filtersOpen: true, sort: "newest", sortOpen: false, recipientQuery: "" };
    // Pull to refresh (Bencho) keeps its own state, so it is made once and
    // put back in its slot after every redraw rather than rebuilt.
    const pull = PullToRefresh();
    const draw = () => {
      root.innerHTML = render(state);
      root.querySelector("[data-pull-to-refresh]")?.replaceWith(pull.el);
    };

    root.addEventListener("click", (e) => {
      // A click anywhere outside the sort menu closes it.
      if (state.sortOpen && !e.target.closest("[data-sort-wrap]")) {
        state.sortOpen = false;
        draw();
      }
      if (e.target.closest("[data-toggle-hide]")) state.hidden = !state.hidden;
      else if (e.target.closest("[data-swap]")) state.lead = state.lead === "usd" ? "usdt" : "usd";
      else if (e.target.closest("[data-fold]")) state.folded = !state.folded;
      else if (e.target.closest("[data-menu]")) state.menuOpen = !state.menuOpen;
      else if (e.target.closest("[data-filters]")) state.filtersOpen = !state.filtersOpen;
      else if (e.target.closest("[data-type]")) state.type = e.target.closest("[data-type]").dataset.type;
      else if (e.target.closest("[data-sort-toggle]")) state.sortOpen = !state.sortOpen;
      else if (e.target.closest("[data-sort]")) {
        state.sort = e.target.closest("[data-sort]").dataset.sort;
        state.sortOpen = false;
      }
      else if (e.target.closest("[data-clear]")) {
        // Empty the field and let the input handler redraw the list.
        const input = e.target.closest(".db-search").querySelector("input");
        input.value = "";
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.focus();
        return;
      }
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

    addEventListener("keydown", (e) => {
      if (e.key === "Escape" && (state.menuOpen || state.sortOpen)) {
        state.menuOpen = state.sortOpen = false;
        draw();
      }
    });

    addEventListener("hashchange", () => {
      state.page = pageFromHash();
      state.menuOpen = false;
      draw();
      scrollTo(0, 0);
    });

    draw();
  },
};
