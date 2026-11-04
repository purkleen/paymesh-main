/**
 * Wallet dashboard (dashboard.html) — "Work in progress" file, node 646:16528
 * ("Desktop-large (XL)").
 *
 * Dark theme, side menu, balance and recent transactions, as drawn. What the
 * frame implies is wired up:
 *   - Home (redesigned from nodes 1174:6581 and 1174:6801): the balance —
 *     tap it for Stealth Mode, tap the line under it to swap which currency
 *     leads — and Add funds; the five latest transactions in a card; recent
 *     payees (everyone you've paid, latest first, four on phones; See all
 *     opens Recipients); and a card with what was spent each day over a
 *     week or a month
 *     (Bencho's Stacked bars, src/components/stacked-bars.js)
 *   - transaction rows have the frame's hover (row 2) and pressed (row 3) states
 *   - "See all" and the menu's Transactions open the Transactions page
 *     (node 1141:4323): search, All / In / Out, Filters (shows and hides
 *     those) and Sort by date (or amount), with the list grouped by day
 *   - Fold menu collapses the menu to its icons (and back)
 *   - Light mode / Dark mode in the menu switches the theme; the browser
 *     remembers it
 *   - any transaction opens its details (#tx/<id>, node 1197:7059): the
 *     party and amount, then status, from, to, date, an ID and a hash that
 *     copy, Export PDF and where to get help
 *   - Recipients lists everyone in the transactions, A–Z in letter sections,
 *     with a search; picking one opens their transactions
 *   - Cards and Settings aren't designed yet, so they say so
 *   - Log out goes back to the prototype menu
 *   - under the balance, Add funds: an amount in dollars with USDT under it,
 *     typed on the system keyboard with the 60fps "Comma Jump Number Input"
 *     motion (src/components/amount-input.js), preset amounts, a $10,000
 *     limit named as you type, then the card to charge
 *   - on phones, Add funds, Pay with and a transaction are full screens
 *     with a back arrow and no header
 *   - on phones the menu opens from the menu button in the header
 *   - Home (node 1234:2620): bordered panels, a big grey "Balance", and the
 *     balance shuffling into place (src/components/shuffle-digits.js)
 *   - Home layout in the menu switches Home between v1 (node 1234:2620)
 *     and v2 (a hero balance card, Send again, Latest, Spending)
 * The page is in the URL hash (#home, #transactions, …), so Back works.
 */

import { esc } from "../ui.js";
import { StackedBars } from "../components/stacked-bars.js";
import { privacyStars } from "../components/hide-sensitive-number.js";
import { AmountInput } from "../components/amount-input.js";
import { shuffleDigits } from "../components/shuffle-digits.js";
import { RETURNING_USER, SAVED_CARDS } from "../config.js";

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
 * The transaction history: 13 payments, random but from a fixed seed, so
 * every visit shows the same ones. Two are today and two yesterday; the rest
 * are spread over the last 60 days, weighted towards recent days. Each is
 * with a different recipient, so 7 of the 20 have none yet. Businesses are
 * payments out (now and then a refund); with people, money goes both ways.
 * "Today" is 13 Oct 2026. Then one top-up, added below.
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
  // and one top-up (node 1202:7506): funds added from the Visa this
  // morning, with your own avatar and name
  list.push({
    party: USER.name,
    initials: USER.initials,
    color: "me",
    topUp: true,
    card: "Visa ending **** 4567",
    amount: 500,
    at: TODAY + (9 * 60 + 41) * 60 * 1000,
  });
  const time = (at) => new Date(at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" });
  return list.sort((a, b) => b.at - a.at).map((t) => ({ ...t, date: `${day(t.at)} · ${time(t.at)}` }));
})();

/**
 * Each transaction's ID: 24 digits, like the checkout receipt's, worked out
 * from the transaction itself so it is the same on every visit — and kept
 * off the history's seed, which would change the history.
 */
const txId = (t) => {
  let h = 2166136261;
  for (const c of `${t.party}|${t.at}`) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0;
  let id = "";
  while (id.length < 24) {
    h = (Math.imul(h, 1664525) + 1013904223) >>> 0;
    id += String(h).padStart(10, "0");
  }
  return id.slice(0, 24);
};
for (const t of TRANSACTIONS) t.id = txId(t);
const BY_ID = new Map(TRANSACTIONS.map((t) => [t.id, t]));

/** Home's list — the latest five. */
const RECENT = TRANSACTIONS.slice(0, 5);

/** Home's payees: everyone you have paid, most recently paid first. */
const PAYEES = [...new Map(TRANSACTIONS.filter((t) => t.amount < 0).map((t) => [t.party, t])).values()]
  .sort((a, b) => b.at - a.at);

/**
 * The Transactions page's groups (Section 1282:6150): Today, Yesterday, then
 * one per date, written "28 October".
 */
const GROUPS = (() => {
  const label = (at) => {
    const ago = Math.floor((TODAY + DAY - 1 - at) / DAY);
    if (ago <= 0) return "Today";
    if (ago === 1) return "Yesterday";
    return new Date(at).toLocaleDateString("en-GB", { timeZone: "UTC", day: "numeric", month: "long" });
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
  { id: "in", label: "Received" },
  { id: "out", label: "Sent" },
];


const NAV = [
  { id: "home", label: "Home", icon: "db-home.svg" },
  { id: "transactions", label: "Transactions", icon: "db-transactions.svg" },
  { id: "recipients", label: "Recipients", icon: "db-recipients.svg" },
  { id: "cards", label: "Cards", icon: "db-card.svg" },
];
const PAGES = new Set([...NAV.map((n) => n.id), "settings", "add-funds", "pay-with", "add-card", "analysis", "refund", "support", "invite", "profile", "security", "statements"]);
const PAGE_TITLES = { "add-funds": "Add funds", "add-card": "Add card", refund: "Request refund", support: "Support", invite: "Invite friends", profile: "Personal details" };
/**
 * Pages that are a step away from Home, drawn (nodes 1197:6932 – 1197:7059)
 * as full screens with a back arrow: on phones they drop the app's header.
 */
const SUBPAGES = new Set(["add-funds", "pay-with", "tx", "transactions", "recipients", "recipient", "settings"]);

/**
 * The cards Add funds can charge: the Visa the wallet is funded from, then
 * the cards saved to it (src/config.js).
 */
const CARDS = [
  { id: "visa-4567", scheme: "visa", label: RETURNING_USER.fundingCard.label.replace("with", "in"), expiry: "Expiry 03/2028" },
  ...SAVED_CARDS,
];
/**
 * The most one top-up can add. Over it the line under the amount says so
 * (node 1197:7021), and well over it — past WAY_OVER — it says so louder.
 */
const TOP_UP_LIMIT = 10000;
const WAY_OVER = 50000;
const limitWarning = (value) => {
  const limit = `$${TOP_UP_LIMIT.toLocaleString("en-US")}`;
  if (value > WAY_OVER) return `Woah! It's way over ${limit} limit!`;
  return value > TOP_UP_LIMIT ? `Your limit is ${limit}` : null;
};
/** Add funds' preset amounts (node 1197:7161). */
const PRESETS = [25, 50, 100, 500];

const num = (n) => Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const sign = (n) => (n < 0 ? "−" : "+");

/** An icon, as a mask in the theme's icon colour (see .db-icon); `tone` is an extra class. */
const icon = (file, tone = "") =>
  `<span class="db-icon${tone ? ` db-icon--${tone}` : ""}" style="-webkit-mask-image: url(${ICON}${file}); mask-image: url(${ICON}${file})" aria-hidden="true"></span>`;

/** The theme the browser last chose, if storage is there to ask. */
const THEME_KEY = "paymesh.dashboard.theme";
const savedLight = () => {
  try {
    return localStorage.getItem(THEME_KEY) === "light";
  } catch {
    return false;
  }
};
/** Which Home layout the browser last chose: "1" (node 1234:2620) or "2". */
const HOME_KEY = "paymesh.dashboard.home";
const savedHome = () => {
  try {
    return localStorage.getItem(HOME_KEY) === "2" ? "2" : "1";
  } catch {
    return "1";
  }
};
const saveHome = (version) => {
  try {
    localStorage.setItem(HOME_KEY, version);
  } catch {}
};
/** Saves the theme and matches the browser chrome to the page. */
const applyTheme = (light) => {
  try {
    localStorage.setItem(THEME_KEY, light ? "light" : "dark");
  } catch {}
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", light ? "#ffffff" : "#0e0e11");
};

/** Account avatar or merchant logo: 32px, 40 in Home's and the Transactions page's rows, 24 in the details' rows, 48 for Home's payees, 64 atop the details. */
const avatar = (t, size = 32) => {
  const cls = `db-avatar${{ 24: " db-avatar--s", 40: " db-avatar--l", 48: " db-avatar--xl", 64: " db-avatar--xxl" }[size] || ""}`;
  if (t.logo) return `<img class="${cls} db-avatar--logo" src="${t.logo}" width="${size}" height="${size}" alt="" />`;
  return `<span class="${cls} db-avatar--${t.color}">${esc(t.initials)}</span>`;
};

/**
 * An amount Stealth Mode can hide: the figure, and its stars over it in the
 * same text style. Both share one cell, so hiding amounts never shifts the
 * list. The figure is marked private, so it is also taken out of what a
 * screen reader reads.
 */
const masked = (value, count = 7) =>
  `<span class="db-mask"><span class="db-mask__value" data-private>${value}</span>${stars(count)}</span>`;

/** Transaction — one row of the list. */
/** Transaction — one row of a list: money out in the primary ink, money in green (Section 1282:6150). */
const row = (t, large = false) => `
  <li>
    <button type="button" class="db-tx" data-tx="${t.id}" aria-label="${esc(t.party)}, ${sign(t.amount)}$${num(t.amount)}, ${esc(t.date)}"
      data-label-hidden="${esc(t.party)}, amount hidden, ${esc(t.date)}">
      ${avatar(t, large ? 40 : 32)}
      <span class="db-tx__info">
        <span class="db-tx__line db-tx__line--main">
          <span class="db-tx__party">${esc(t.party)}</span>
          <span class="db-tx__amount ${t.amount < 0 ? "is-expense" : "is-income"}">${masked(`${sign(t.amount)}$${num(t.amount)}`)}</span>
        </span>
        <span class="db-tx__line db-tx__line--sub">
          <span class="db-tx__date">${esc(t.date)}</span>
          <span class="db-tx__usdt">${masked(`${sign(t.amount)}${num(t.amount)} USDT`)}</span>
        </span>
      </span>
    </button>
  </li>`;

const navButton = ({ id, label, icon: file }, current) => `
  <a class="db-nav__item" href="#${id}" ${id === current ? `aria-current="page"` : ""} title="${label}">
    ${icon(file)}<span class="db-nav__label">${label}</span>
  </a>`;

/**
 * Stealth Mode's stars: "*" set in the text style of the figure they hide,
 * as many as the frame draws (node 1174:6801) — six for the balance, seven
 * for an amount.
 */
const stars = (count) => `<span class="db-stars" aria-hidden="true">${"<span>*</span>".repeat(count)}</span>`;
const balanceLabel = (hidden) => (hidden ? "Balance hidden" : `Balance, ${num(BALANCE)} dollars`);

/**
 * The balance block: the figure, the other currency under it, and Add
 * funds. Hiding it is Stealth Mode — the 60fps "Hide Sensitive Number"
 * (src/components/hide-sensitive-number.js): tap the balance and the
 * figures dissolve into shimmering asterisks, each set in the text style of
 * the figure it hides (see `stars`). Both figures are always there under
 * their stars, so nothing shifts. Stealth
 * Mode covers every amount on the page too (see `masked`), and stays on as
 * you move between pages.
 */
function balance({ hidden, lead }) {
  // The frames (nodes 1174:6581 and 1174:6801) draw no eye and no swap
  // arrows: the balance itself is the Stealth Mode switch, and the line
  // under it swaps which currency leads.
  return `
    <section class="db-balance" aria-label="Balance">
      <h2 class="db-balance__label">Balance</h2>
      ${balanceFigures({ hidden, lead })}
      <a href="#add-funds" class="db-btn db-balance__add">${icon("add.svg", "current")}Add funds</a>
    </section>`;
}

/** The balance and the line under it — the Stealth Mode and swap controls. */
function balanceFigures({ hidden, lead }) {
  const [whole, cents] = num(BALANCE).split(".");
  const usd = lead === "usd";
  const big = `${usd ? "$" : ""}${whole}<span class="db-balance__cents">.${cents}${usd ? "" : " USDT"}</span>`;
  const small = usd ? `${num(BALANCE)} USDT` : `$${num(BALANCE)}`;
  return `
      <button type="button" class="db-balance__stealth" data-toggle-hide aria-pressed="${hidden}" aria-label="${balanceLabel(hidden)}"
        aria-description="Stealth Mode ${hidden ? "on" : "off"}. Activate to ${hidden ? "reveal" : "hide"} the balance">
        <span class="db-balance__amount">${big}</span>
        ${stars(6)}
      </button>
      <button type="button" class="db-balance__mask" data-swap aria-label="Show balance in ${usd ? "USDT" : "US dollars"} first" title="Swap currency">
        <span class="db-balance__other" data-private>${small}</span>
        ${stars(6)}
      </button>`;
}

/**
 * Home v2 — a second layout to compare with v1 (node 1234:2620), switched
 * in the menu. The same pieces, arranged differently: the balance centred in
 * a hero card with Add funds and See activity under it; "Send again", the
 * people and places you paid last as bare avatars in a row; then the latest
 * transactions and the spending chart. Stealth Mode, the swap and the
 * shuffle work as in v1.
 */
function homeV2(state) {
  return `
    <section class="db-balance db-hero db-panel" aria-label="Balance">
      <h2 class="db-hero__label">Total balance</h2>
      ${balanceFigures(state)}
      <div class="db-hero__actions">
        <a href="#add-funds" class="db-btn db-balance__add">${icon("add.svg", "current")}Add funds</a>
        <a href="#transactions" class="db-btn db-btn--outline db-hero__more">See activity</a>
      </div>
    </section>
    <section class="db-section" aria-labelledby="db-again">
      <div class="db-section__head">
        <h2 id="db-again">Send again</h2>
        <a href="#recipients" class="db-link">See all</a>
      </div>
      <ul class="db-again">${PAYEES.map(
        (t) => `<li><button type="button" class="db-again__item" data-recipient="${esc(t.party)}" title="${esc(t.party)}">
          ${avatar(t, 48)}<span class="db-again__name">${esc(t.party.split(" ")[0])}</span></button></li>`
      ).join("")}</ul>
    </section>
    <section class="db-section" aria-labelledby="db-recent">
      <div class="db-section__head">
        <h2 id="db-recent">Latest</h2>
        <a href="#transactions" class="db-link">See all</a>
      </div>
      <div class="db-card db-panel db-panel--list"><ul class="db-txlist">${RECENT.map((t) => row(t, true)).join("")}</ul></div>
    </section>
    <section class="db-section" aria-labelledby="db-spend">
      <div class="db-section__head"><h2 id="db-spend">Spending</h2></div>
      <div class="db-card db-card--analysis db-panel"><div data-spending></div></div>
    </section>`;
}

/**
 * The groups and rows left after the search and the type filter, in the
 * chosen order. The search also matches the day headings ("Friday",
 * "20 October").
 */
function filtered({ query, type = "all", party = null }) {
  const q = query.trim().toLowerCase();
  const keep = (g) => (t) =>
    (!party || t.party === party) &&
    (type === "all" || (type === "in" ? t.amount > 0 : t.amount < 0)) &&
    (!q || [g.label, t.party, t.date, `${sign(t.amount)}$${num(t.amount)}`, num(t.amount)].some((v) => v.toLowerCase().includes(q)));
  return GROUPS.map((g) => ({ ...g, items: g.items.filter(keep(g)) })).filter((g) => g.items.length);
}

/** A full screen's head: the back arrow, then (an avatar and) the title, 16px apart. */
const pageHead = ({ back, backLabel, title, id, lead = "" }) => `
  <div class="db-pagehead">
    ${backArrow(back, backLabel)}
    ${lead}
    <h2 id="${id}" class="db-tx-page__title">${title}</h2>
  </div>`;

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
      ${icon("db-search.svg")}
      <input type="search" ${attr} value="${esc(value)}" placeholder="${placeholder}" aria-label="${label}" autocomplete="off" />
    </label>
    <button type="button" class="db-search__clear" data-clear aria-label="Clear search" title="Clear search">
      <span class="db-icon--clear" aria-hidden="true"></span>
    </button>
  </div>`;


/**
 * Transactions (Section 1282:6150, nodes 1282:5368 / 1282:5698): back arrow
 * and title, the search, All / Received / Sent, then the list by day.
 */
function transactionsPage(state) {
  return `
    <section class="db-tx-page" aria-labelledby="db-all">
      <div class="db-tx-page__top">
        ${pageHead({ back: "#home", backLabel: "Back to Home", title: "Transactions", id: "db-all" })}
        ${searchField({ attr: "data-search", value: state.query, placeholder: "Search transactions, payees, amounts", label: "Search transactions" })}
      </div>
      <div class="db-types" id="db-types" role="radiogroup" aria-label="Type">${TYPES.map(
        (t) => `<button type="button" class="db-type" role="radio" data-type="${t.id}" aria-checked="${t.id === state.type}">${t.label}</button>`
      ).join("")}</div>
      <div class="db-groups" data-groups>${groupsHTML(state)}</div>
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
      if (!r) continue; // a top-up is not a recipient
      if (!r.count) r.date = t.date;
      r.count += 1;
      r.amount += t.amount;
    }
  return [...byParty.values()].sort((a, b) => a.party.localeCompare(b.party));
})();

const recipientRow = (r) => `
  <li>
    <button type="button" class="db-tx" data-recipient="${esc(r.party)}">
      ${avatar(r, 40)}
      <span class="db-tx__info">
        <span class="db-tx__line db-tx__line--main">
          <span class="db-tx__party">${esc(r.party)}</span>
          ${r.count ? `<span class="db-tx__amount ${r.amount < 0 ? "is-expense" : "is-income"}">${masked(`${sign(r.amount)}$${num(r.amount)}`)}</span>` : ""}
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

/** Recipients (node 1282:5481) — laid out like the Transactions page. */
function recipientsPage(state) {
  return `
    <section class="db-tx-page" aria-labelledby="db-recipients">
      <div class="db-tx-page__top">
        ${pageHead({ back: "#home", backLabel: "Back to Home", title: "Recipients", id: "db-recipients" })}
        ${searchField({ attr: "data-recipient-search", value: state.recipientQuery, placeholder: "Search recipients", label: "Search recipients" })}
      </div>
      <div class="db-groups" data-recipients>${recipientsHTML(state)}</div>
    </section>`;
}

/** One recipient's transactions, by day, matching the page's search. */
const personHTML = (state) => {
  const groups = filtered({ query: state.personQuery, party: state.recipient });
  return groups.length
    ? groups
        .map((g) => `<section class="db-group"><h3 class="db-group__label">${esc(g.label)}</h3><ul class="db-txlist">${g.items.map((t) => row(t, true)).join("")}</ul></section>`)
        .join("")
    : `<p class="db-empty">${RECIPIENTS.find((r) => r.party === state.recipient)?.count ? "No transactions match." : "No transactions yet."}</p>`;
};

/**
 * A recipient (node 1282:5589): back arrow, their avatar and name, a search
 * of their transactions, then those transactions by day.
 */
function recipientPage(state) {
  const r = RECIPIENTS.find((x) => x.party === state.recipient);
  return `
    <section class="db-tx-page" aria-labelledby="db-person">
      <div class="db-tx-page__top">
        ${pageHead({ back: "#recipients", backLabel: "Back to Recipients", title: esc(r.party), id: "db-person", lead: avatar(r, 48) })}
        ${searchField({ attr: "data-person-search", value: state.personQuery, placeholder: "Search transactions, dates", label: `Search transactions with ${esc(r.party)}` })}
      </div>
      <div class="db-groups" data-person>${personHTML(state)}</div>
    </section>`;
}

/**
 * Settings (node 1282:5026): groups of rows in cards, Log out at the foot.
 * The frame's rows are placeholders ("Add card"), so these are the wallet's
 * own settings; the ones without a page yet say so when opened.
 */
const settingRow = ({ href, attr = "", file, label, extra = "" }) =>
  `<li>${href
    ? `<a class="db-setting" href="${href}">`
    : `<button type="button" class="db-setting" ${attr}>`}${icon(file)}<span class="db-setting__label">${label}</span>${extra}<span class="db-setting__chevron" aria-hidden="true"></span>${href ? "</a>" : "</button>"}</li>`;
function settingsPage(state) {
  return `
    <section class="db-settings" aria-labelledby="db-settings-title">
      ${pageHead({ back: "#home", backLabel: "Back to Home", title: "Settings", id: "db-settings-title" })}
      <div class="db-settings__groups">
        <ul class="db-settings__group">
          ${settingRow({ href: "#cards", file: "db-card.svg", label: "Cards" })}
          ${settingRow({ href: "#add-card", file: "add.svg", label: "Add card" })}
        </ul>
        <ul class="db-settings__group">
          ${settingRow({ href: "#profile", file: "db-recipients.svg", label: "Personal details" })}
          ${settingRow({ href: "#security", file: "safety.svg", label: "Security" })}
          ${settingRow({ href: "#statements", file: "receipt.svg", label: "Statements" })}
        </ul>
        <ul class="db-settings__group">
          ${settingRow({ attr: "data-theme-toggle", file: state.light ? "db-moon.svg" : "db-sun.svg", label: state.light ? "Dark mode" : "Light mode" })}
          ${settingRow({ attr: "data-home-version", file: "db-home.svg", label: "Home layout", extra: `<span class="db-setting__value">v${state.home}</span>` })}
        </ul>
      </div>
      <ul class="db-settings__group db-settings__foot">
        ${settingRow({ href: "./", file: "db-log-out.svg", label: "Log out" })}
      </ul>
    </section>`;
}

/** "13 October 2026, 4:28pm", as the receipt writes it — in UTC, like the rows. */
/** "Oct 13, 2026 at 4.28 pm UTC" — the date as node 1197:7059 writes it. */
const longWhen = (at) => {
  const d = new Date(at);
  const h = d.getUTCHours();
  const month = d.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" });
  return `${month} ${d.getUTCDate()}, ${d.getUTCFullYear()} at ${h % 12 || 12}.${String(d.getUTCMinutes()).padStart(2, "0")} ${h < 12 ? "am" : "pm"}`;
};
const shortId = (id) => `${id.slice(0, 5)}...${id.slice(-6)}`;
/**
 * The transaction's on-chain hash: 64 hex digits, worked out from its ID so
 * it is the same on every visit.
 */
const txHash = (id) => {
  let h = 0x811c9dc5;
  let out = "0x";
  for (let i = 0; out.length < 66; i++) {
    h = Math.imul(h ^ id.charCodeAt(i % id.length) ^ i, 16777619) >>> 0;
    out += (h >>> 24).toString(16).padStart(2, "0");
  }
  return out;
};
const shortHash = (hash) => `${hash.slice(0, 5)}...${hash.slice(-5)}`;

/** The back arrow at the top of a full-screen step (nodes 1197:6932 – 1197:7059). */
const backArrow = (href, label, attr = "data-back") => `
  <a href="${href}" class="db-backarrow" ${attr} aria-label="${label}" title="${label}">${icon("arrow-right.svg")}</a>`;

const detailRow = (label, value) => `
  <div class="db-detail__row"><dt>${label}</dt><dd>${value}</dd></div>`;

/**
 * A value that copies: the copy icon, then the value shortened. Copied, the
 * two give way to a green "✓ Copied!" for 3 seconds (nodes 1202:7583 and
 * 1202:7732).
 */
const copyValue = (full, short, what) => `
  <button type="button" class="db-copy" data-copy="${full}" aria-label="Copy ${what}, ${short}" title="Copy ${what}">
    <span class="db-copy__value">${icon("copy.svg")}<span>${short}</span></span>
    <span class="db-copy__done" aria-hidden="true">${icon("check-brand.svg", "current")}Copied!</span>
  </button>`;

/**
 * Transaction details (node 1197:7059; a top-up, node 1202:7506, comes
 * from the card and its amount is green): the party's avatar, name and the
 * amount (in both currencies, hidden in Stealth Mode), then a card of
 * details — status, from, to, date, the transaction ID and hash, each of
 * the two copying — Export PDF (the browser's print, to save as PDF), and
 * where to go if something is wrong.
 */
function detailPage(t, back) {
  const out = t.amount < 0;
  // a top-up (node 1202:7506) comes from the card, with no avatar
  const party = t.topUp ? esc(t.card) : `${avatar(t, 24)}${esc(t.party)}`;
  const wallet = "Your Paymesh wallet";
  const hash = txHash(t.id);
  return `
    <section class="db-detail" aria-labelledby="db-detail-title">
      ${backArrow(`#${back.id}`, `Back to ${back.label}`)}
      ${avatar(t, 64)}
      <div class="db-detail__value">
        <h2 id="db-detail-title" class="db-detail__party">${esc(t.party)}</h2>
        <p class="db-detail__amount${out ? "" : " is-income"}">${masked(`${sign(t.amount)}$${num(t.amount)}`)}</p>
        <p class="db-detail__usdt">${masked(`${sign(t.amount)}${num(t.amount)} USDT`)}</p>
      </div>
      <section class="db-card db-detail__card" aria-labelledby="db-detail-card">
        <h3 id="db-detail-card" class="sr-only">Transaction details</h3>
        <dl class="db-detail__rows">
          ${detailRow("From", out ? wallet : party)}
          ${detailRow("To", out ? party : wallet)}
          ${detailRow("Status", `<span class="db-status">${icon("check-brand.svg", "current")}Completed</span>`)}
          ${detailRow("Date", longWhen(t.at))}
          ${detailRow("Transaction ID", copyValue(t.id, shortId(t.id), "transaction ID"))}
          ${detailRow("Hash", copyValue(hash, shortHash(hash), "hash"))}
        </dl>
      </section>
      <div class="db-detail__foot">
        <button type="button" class="db-btn db-btn--link" data-export>Export PDF</button>
        <p class="db-detail__help">Something wrong with this transaction?<br />
          <a href="#refund" class="db-link">Request refund</a> or <a href="#support" class="db-link">contact our support</a>.</p>
      </div>
    </section>`;
}

/** One of Home's payees: avatar and name; it opens their transactions, as Recipients does. */
const payee = (t) => `
  <li>
    <button type="button" class="db-payee" data-recipient="${esc(t.party)}" title="${esc(t.party)}">
      ${avatar(t, 48)}<span class="db-payee__name">${esc(t.party)}</span>
    </button>
  </li>`;

/** A card: its logo, name and expiry. */
const cardFace = (c) => `
  <span class="db-cardopt__logo${c.scheme === "visa" ? " db-cardopt__logo--full" : ""}">
    <img src="${ICON}${c.scheme}.svg" alt="" />
  </span>
  <span class="db-cardopt__text">
    <span class="db-cardopt__label">${esc(c.label)}</span>
    <span class="db-cardopt__sub">${esc(c.expiry)}</span>
  </span>`;

/** Pay with, on Add funds: the chosen card, in a row that opens the Pay with screen. */
function cardRow(state) {
  const chosen = CARDS.find((c) => c.id === state.card) || CARDS[0];
  return `
    <a href="#pay-with" class="db-select__button" aria-labelledby="db-paywith db-card-chosen" aria-describedby="db-card-change">
      <span id="db-card-chosen" style="display: contents">${cardFace(chosen)}</span>
      <span id="db-card-change" class="sr-only">Change card</span>
      <span class="db-select__chevron db-select__chevron--next" aria-hidden="true"></span>
    </a>`;
}

/**
 * Pay with — a screen of its own (node 1197:6932, "Add funds with"): every card, with a tick by the chosen
 * one, then Add card (its page isn't designed yet, so it says so). Picking a
 * card takes you back to Add funds with it chosen, and the amount you typed
 * still there.
 */
function payWithPage(state) {
  return `
    <section class="db-addfunds" aria-labelledby="db-paywith-title">
      ${backArrow("#add-funds", "Back to Add funds", "data-to-funds")}
      <hgroup class="db-addfunds__head">
        <h2 id="db-paywith-title" class="db-addfunds__title">Add funds with</h2>
        <p class="db-addfunds__sub">Select payment method</p>
      </hgroup>
      <ul class="db-card db-cardlist" aria-labelledby="db-paywith-title">
        ${CARDS.map(
          (c) => `<li><button type="button" class="db-select__option" data-card="${c.id}" aria-pressed="${c.id === state.card}">
            ${cardFace(c)}<span class="db-select__check" aria-hidden="true"></span></button></li>`
        ).join("")}
        <li><a href="#add-card" class="db-select__option db-select__option--add">
          <span class="db-select__add-icon">${icon("add.svg")}</span><span class="db-cardopt__label">Add card</span>
          <span class="db-select__chevron db-select__chevron--next" aria-hidden="true"></span>
        </a></li>
      </ul>
    </section>`;
}

/**
 * Add funds (nodes 1197:7118 – 1197:7021, restyled by 1210:523 / 1211:1328:
 * "Add funds" centred in a bar with the back arrow) — the amount (the 60fps "Comma
 * Jump Number Input", typed on the system keyboard, in dollars or USDT with
 * the other under it, or the limit when it's over), preset amounts, the card
 * to charge, and the button at the foot of the screen. The amount field is made once (see mount) and dropped into
 * [data-amount].
 */
function addFundsPage(state, value) {
  return `
    <section class="db-addfunds" aria-labelledby="db-addfunds-title">
      <div class="db-addfunds__bar">
        ${backArrow("#home", "Back")}
        <h2 id="db-addfunds-title" class="db-addfunds__bartitle">Add funds</h2>
        <span class="db-addfunds__spacer" aria-hidden="true"></span>
      </div>
      <div class="db-addfunds__amount">
        <div data-amount></div>
        <div class="db-presets" role="group" aria-label="Amount">
          ${PRESETS.map((n) => `<button type="button" class="db-preset" data-preset="${n}" aria-pressed="${value === n}">$${n}</button>`).join("")}
        </div>
      </div>
      <section class="db-section" aria-labelledby="db-paywith">
        <h2 id="db-paywith" class="sr-only">Pay with</h2>
        ${cardRow(state)}
      </section>
      <p class="db-addfunds__error" data-add-error role="alert"></p>
      <button type="button" class="db-btn db-addfunds__go" data-add-confirm>Add funds</button>
    </section>`;
}

function main(state, value = 0) {
  switch (state.page) {
    case "home":
      if (state.home === "2") return homeV2(state);
      return `
        ${balance(state)}
        <a href="#invite" class="db-invite db-panel">
          <span class="db-invite__text">
            <span class="db-invite__title">Invite friends, earn £50</span>
            <span class="db-invite__body">Earn £50 for each friend you invite by 26 March. T&amp;C apply.</span>
          </span>
          <span class="db-invite__art" aria-hidden="true"></span>
        </a>
        <section class="db-section" aria-labelledby="db-recent">
          <h2 class="db-section__title" id="db-recent"><a href="#transactions">Transactions<span class="db-section__chevron" aria-hidden="true"></span></a></h2>
          <ul class="db-txlist db-txlist--home">${RECENT.slice(0, 3).map((t) => row(t, true)).join("")}</ul>
        </section>
        <section class="db-section" aria-labelledby="db-payees">
          <h2 class="db-section__title" id="db-payees"><a href="#recipients">Recent payees<span class="db-section__chevron" aria-hidden="true"></span></a></h2>
          <ul class="db-payees">${PAYEES.map(payee).join("")}</ul>
        </section>
        <section class="db-section" aria-labelledby="db-spend1">
          <h2 class="db-section__title" id="db-spend1">Spending analysis</h2>
          <div class="db-card db-card--analysis db-panel"><div data-spending></div></div>
        </section>`;
    case "transactions":
      return transactionsPage(state);
    case "recipients":
      return recipientsPage(state);
    case "recipient":
      return recipientPage(state);
    case "settings":
      return settingsPage(state);
    case "tx":
      return detailPage(BY_ID.get(state.txId), state.back);
    case "add-funds":
      return addFundsPage(state, value);
    case "pay-with":
      return payWithPage(state);
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

function render(state, value) {
  return `
  <div class="db ${state.page === "home" ? `is-home is-home-v${state.home}` : ""} ${SUBPAGES.has(state.page) ? "is-sub" : ""} ${state.folded ? "is-folded" : ""} ${state.menuOpen ? "is-menu-open" : ""} ${state.light ? "is-light" : ""}"${state.hidden ? " data-stealth" : ""}>
    <header class="db-header">
      <a href="#home" class="db-logo">Paymesh</a>
      <div class="db-user">
        <span class="db-user__name">${esc(USER.name)}</span>
        <span class="db-avatar db-avatar--l db-avatar--me db-user__avatar" aria-hidden="true">${USER.initials}</span>
        <button type="button" class="db-iconbtn db-menu-btn" data-menu aria-controls="db-nav" aria-expanded="${state.menuOpen}"
          aria-label="${state.menuOpen ? "Close menu" : "Open menu"}">${icon(state.menuOpen ? "close.svg" : "db-menu.svg")}</button>
      </div>
    </header>

    <nav class="db-nav" id="db-nav" aria-label="Main">
      <div class="db-nav__group">${NAV.map((n) => navButton(n, state.page === "tx" ? "transactions" : state.page)).join("")}</div>
      <div class="db-nav__group db-nav__group--foot">
        <button type="button" class="db-nav__item db-nav__fold" data-fold aria-expanded="${!state.folded}"
          title="${state.folded ? "Unfold menu" : "Fold menu"}">
          ${icon("db-panel-left-close.svg")}<span class="db-nav__label">${state.folded ? "Unfold menu" : "Fold menu"}</span>
        </button>
        <button type="button" class="db-nav__item" data-theme-toggle title="${state.light ? "Dark mode" : "Light mode"}">
          ${icon(state.light ? "db-moon.svg" : "db-sun.svg")}<span class="db-nav__label">${state.light ? "Dark mode" : "Light mode"}</span>
        </button>
        <button type="button" class="db-nav__item db-nav__home" data-home-version title="Switch Home layout"
          aria-label="Home layout: version ${state.home}. Switch to version ${state.home === "2" ? "1" : "2"}">
          ${icon("db-home.svg")}<span class="db-nav__label">Home layout</span>
          <span class="db-nav__seg" aria-hidden="true"><span ${state.home === "1" ? "data-on" : ""}>v1</span><span ${state.home === "2" ? "data-on" : ""}>v2</span></span>
        </button>
        ${navButton({ id: "settings", label: "Settings", icon: "db-settings.svg" }, state.page)}
        <a class="db-nav__item" href="./" title="Log out">${icon("db-log-out.svg")}<span class="db-nav__label">Log out</span></a>
      </div>
    </nav>

    <main class="db-main">${main(state, value)}</main>
  </div>`;
}

export default {
  mount(root) {
    // "#tx/<id>" is a transaction's details; anything unknown is Home.
    const pageFromHash = () => {
      const id = location.hash.slice(1);
      if (id.startsWith("tx/") && BY_ID.has(id.slice(3))) {
        state.txId = id.slice(3);
        return "tx";
      }
      // "#recipient/<name>" is one recipient's page
      if (id.startsWith("recipient/")) {
        const name = decodeURIComponent(id.slice(10));
        if (RECIPIENTS.some((r) => r.party === name)) {
          if (state.recipient !== name) state.personQuery = "";
          state.recipient = name;
          return "recipient";
        }
      }
      return PAGES.has(id) ? id : "home";
    };
    // Where the details page's button goes: the list the transaction was picked from.
    const BACK = { home: { id: "home", label: "Home" }, transactions: { id: "transactions", label: "transactions" } };
    const state = { txId: null, back: BACK.transactions, recipient: null, personQuery: "" };
    Object.assign(state, { page: pageFromHash(), hidden: false, lead: "usd", folded: false, menuOpen: false, query: "", type: "all", recipientQuery: "", light: savedLight(), home: savedHome() });
    applyTheme(state.light);
    // Copies text, with the clipboard API where the page may use it and the
    // old select-and-copy where it may not (a page served over plain http).
    const copyText = (text) =>
      (navigator.clipboard?.writeText(text) ?? Promise.reject()).catch(() => {
        const area = Object.assign(document.createElement("textarea"), { value: text });
        area.setAttribute("readonly", "");
        area.style.cssText = "position:fixed;opacity:0";
        document.body.append(area);
        area.select();
        const ok = document.execCommand("copy");
        area.remove();
        if (!ok) throw new Error("copy failed");
      });
    // The spending chart (Bencho's Stacked bars) keeps its own state, so it is
    // made once and put back in its slot after every redraw.
    const spending = StackedBars({ inline: true });
    // Add funds' amount field keeps its own state and motion, so it too is
    // made once and put back after each redraw.
    const amount = AmountInput({
      icon: icon("db-swap.svg", "current"),
      warnIcon: icon("danger.svg", "current"),
      onChange: (value) => {
        const error = root.querySelector("[data-add-error]");
        if (error) error.textContent = "";
        // over the limit, the line under the amount says so, as you type
        amount.warn(limitWarning(value));
        // the preset chip for this amount, if there is one, lights up
        root.querySelectorAll("[data-preset]").forEach((b) => b.setAttribute("aria-pressed", String(+b.dataset.preset === value)));
      },
    });
    state.card = CARDS[0].id;
    // Back to Add funds from Pay with: the browser's own Back when that is
    // where we came from, so history doesn't fill up with the round trip
    let previous = null;
    const toFunds = () => {
      if (previous === "add-funds") history.back();
      else location.hash = "#add-funds";
    };
    // Stealth Mode's stars, one set per hidden figure — the balance and
    // every amount on the page — each with the snippet's shimmer. Made again
    // whenever the page or a list is redrawn, since the elements are new; `labels` brings what a screen
    // reader hears into line with what is shown.
    let stars = [];
    const labels = () => {
      root.querySelectorAll("[data-private]").forEach((el) => el.toggleAttribute("aria-hidden", state.hidden));
      root.querySelectorAll("[data-label-hidden]").forEach((el) => {
        el.dataset.labelShown ??= el.getAttribute("aria-label");
        el.setAttribute("aria-label", state.hidden ? el.dataset.labelHidden : el.dataset.labelShown);
      });
    };
    const attachStars = () => {
      stars.forEach((s) => s.destroy());
      stars = [...root.querySelectorAll(".db-stars")].map((el) => {
        const s = privacyStars(el);
        s.set(state.hidden);
        return s;
      });
      labels();
    };
    // The balance reveals itself with its digits shuffling for a second,
    // a new digit every 70ms: on arriving at Home, on coming out of
    // Stealth Mode and on swapping which currency leads.
    let shuffleNext = true;
    let stopShuffle = () => {};
    const shuffleBalance = () => {
      stopShuffle();
      const figures = [...root.querySelectorAll(".db-balance__amount, .db-balance__other")];
      if (!figures.length || state.hidden) return;
      // Rebond is measured for the held widths, so wait for it
      const run = () => {
        const stops = figures.filter((el) => el.isConnected).map((el) => shuffleDigits(el, { duration: 1000, every: 70 }));
        stopShuffle = () => stops.forEach((stop) => stop());
      };
      document.fonts?.status === "loaded" ? run() : document.fonts.ready.then(run);
    };
    const draw = () => {
      stopShuffle();
      root.innerHTML = render(state, amount.value());
      root.querySelector("[data-spending]")?.replaceWith(spending.el);
      const slot = root.querySelector("[data-amount]");
      if (slot) {
        slot.replaceWith(amount.el);
        amount.refresh();
      }
      attachStars();
      if (shuffleNext && state.page === "home") shuffleBalance();
      shuffleNext = false;
    };

    // Stealth Mode: flipped on the elements already there rather than by a
    // redraw, so the snippet's cross-fade plays (a redrawn element has no
    // "before" to transition from).
    const toggleStealth = () => {
      navigator.vibrate?.(10);
      state.hidden = !state.hidden;
      root.querySelector(".db").toggleAttribute("data-stealth", state.hidden);
      stars.forEach((s) => s.set(state.hidden));
      labels();
      const section = root.querySelector(".db-balance");
      if (!section) return;
      if (!state.hidden) shuffleBalance();
      const toggle = section.querySelector(".db-balance__stealth");
      toggle.setAttribute("aria-pressed", String(state.hidden));
      toggle.setAttribute("aria-label", balanceLabel(state.hidden));
      toggle.setAttribute("aria-description", `Stealth Mode ${state.hidden ? "on" : "off"}. Activate to ${state.hidden ? "reveal" : "hide"} the balance`);
    };

    // The keyboard on arriving at Add funds: phones (iOS above all) only
    // bring it up for a field focused inside the tap itself, and the amount
    // field isn't on the page until the hash changes and the page redraws.
    // So the tap focuses this stand-in — an invisible decimal field that is
    // always there — and the amount field takes the focus, keyboard and all,
    // once it is drawn.
    const keyboard = Object.assign(document.createElement("input"), { type: "text", inputMode: "decimal", tabIndex: -1 });
    keyboard.setAttribute("aria-hidden", "true");
    keyboard.style.cssText = "position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;font-size:16px;pointer-events:none";
    document.body.append(keyboard);
    const TO_FUNDS = 'a[href="#add-funds"], [data-to-funds], [data-card]';

    root.addEventListener("click", (e) => {
      if (e.target.closest(TO_FUNDS)) keyboard.focus({ preventScroll: true });
      // Pay with: a card is chosen, and it's back to Add funds
      if (e.target.closest("[data-card]")) {
        state.card = e.target.closest("[data-card]").dataset.card;
        return toFunds();
      }
      if (e.target.closest("[data-to-funds]")) {
        e.preventDefault();
        return toFunds();
      }
      // A back arrow: the browser's Back when we came from inside the
      // dashboard, otherwise its own link
      if (e.target.closest("[data-back]")) {
        if (previous) {
          e.preventDefault();
          history.back();
        }
        return;
      }
      if (e.target.closest("[data-preset]")) {
        amount.set(+e.target.closest("[data-preset]").dataset.preset);
        return amount.focus();
      }
      if (e.target.closest("[data-export]")) return print();
      if (e.target.closest("[data-toggle-hide]")) return toggleStealth();
      else if (e.target.closest("[data-swap]")) {
        state.lead = state.lead === "usd" ? "usdt" : "usd";
        shuffleNext = true;
      }
      else if (e.target.closest("[data-fold]")) state.folded = !state.folded;
      else if (e.target.closest("[data-theme-toggle]")) applyTheme((state.light = !state.light));
      else if (e.target.closest("[data-home-version]")) {
        // the other Home layout, and Home itself to see it
        state.home = state.home === "2" ? "1" : "2";
        saveHome(state.home);
        state.menuOpen = false;
        shuffleNext = true;
        if (state.page !== "home") {
          location.hash = "#home";
          return;
        }
      }
      else if (e.target.closest("[data-menu]")) state.menuOpen = !state.menuOpen;
      else if (e.target.closest("[data-type]")) state.type = e.target.closest("[data-type]").dataset.type;
      else if (e.target.closest("[data-clear]")) {
        // Empty the field and let the input handler redraw the list.
        const input = e.target.closest(".db-search").querySelector("input");
        input.value = "";
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.focus();
        return;
      }
      else if (e.target.closest("[data-tx]")) {
        state.back =
          state.page === "recipient"
            ? { id: `recipient/${encodeURIComponent(state.recipient)}`, label: state.recipient }
            : BACK[state.page] || BACK.transactions;
        location.hash = `#tx/${e.target.closest("[data-tx]").dataset.tx}`;
        return;
      }
      else if (e.target.closest("[data-add-confirm]")) {
        // Never disabled: an amount that can't go says why.
        const error = root.querySelector("[data-add-error]");
        const value = amount.value();
        if (!value) error.textContent = "Enter an amount to add.";
        // over the limit: the line under the amount already says so
        if (!value || value > TOP_UP_LIMIT) {
          navigator.vibrate?.(10);
          return amount.focus();
        }
        location.hash = "#home"; // the payment itself isn't designed yet
        return;
      }
      else if (e.target.closest("[data-copy]")) {
        // Copies the whole ID or hash; "Copied!" stands in for it for 3 seconds.
        const btn = e.target.closest("[data-copy]");
        copyText(btn.dataset.copy).then(
          () => {
            navigator.vibrate?.(10);
            // one "Copied!" at a time
            root.querySelectorAll("[data-copied]").forEach((other) => other.removeAttribute("data-copied"));
            btn.setAttribute("data-copied", "");
            clearTimeout(btn.copiedTimer);
            btn.copiedTimer = setTimeout(() => btn.removeAttribute("data-copied"), 3000);
          },
          () => {}
        );
        return;
      }
      else if (e.target.closest("[data-recipient]")) {
        // A recipient opens their own page (node 1282:5589).
        location.hash = `#recipient/${encodeURIComponent(e.target.closest("[data-recipient]").dataset.recipient)}`;
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
        attachStars();
      } else if (e.target.matches("[data-recipient-search]")) {
        state.recipientQuery = e.target.value;
        root.querySelector("[data-recipients]").innerHTML = recipientsHTML(state);
        attachStars();
      } else if (e.target.matches("[data-person-search]")) {
        state.personQuery = e.target.value;
        root.querySelector("[data-person]").innerHTML = personHTML(state);
        attachStars();
      }
    });

    addEventListener("keydown", (e) => {
      if (e.key === "Escape" && state.menuOpen) {
        state.menuOpen = false;
        draw();
      }
    });

    addEventListener("hashchange", () => {
      previous = state.page;
      state.page = pageFromHash();
      if (state.page === "home" && previous !== "home") shuffleNext = true;
      state.menuOpen = false;
      // Add funds starts from $0 each visit, with the keyboard up — but
      // coming back from choosing or adding a card, the amount is kept
      if (state.page === "add-funds" && previous !== "pay-with" && previous !== "add-card") amount.reset();
      draw();
      scrollTo(0, 0);
      if (state.page === "add-funds") amount.focus();
    });

    draw();
    if (state.page === "add-funds") amount.focus();
  },
};
