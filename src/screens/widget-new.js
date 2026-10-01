/**
 * Newest payment widget (widget-new.html) — design system file, node 1444:11042.
 *
 * A collapsed card (Payment method / Billing address / Amount to pay) whose
 * "Payment method" row opens into the list of payment methods. Three scenarios,
 * one per row of the Figma section, picked with the buttons beside the widget
 * (or ?scenario=1|2|3):
 *
 *   1. The balance covers the order — one method only: the Paymesh balance or
 *      a card (radios), and whichever is chosen pays the whole amount.
 *   2. The balance doesn't cover it — by default the balance (checkbox) pays
 *      what it can and a card the remaining balance; unticking the balance puts
 *      the whole amount on the card.
 *   3. Alternative UI: the balance covers the order, but "Split payment" lets
 *      the buyer spend only some of it and top up with a card, typing the two
 *      amounts (each one fills the other with what's left).
 */

import { button, checkbox, icon, asset, merchantLogo, busy, isBusy } from "../ds.js";
import { esc, money, tokens, formAlert, showFormError, clearFormError } from "../ui.js";
import { MERCHANT } from "../config.js";

const PAY_MS = 1400;

export const SCENARIOS = [
  { id: 1, label: "Balance covers the order", total: 7000, balance: 8000, mode: "single" },
  { id: 2, label: "Balance doesn't cover the order", total: 7000, balance: 5000, mode: "short" },
  { id: 3, label: "Split payment (alternative UI)", total: 7000, balance: 8000, mode: "split" },
];

const CARDS = [{ id: "visa-9876", scheme: "visa", label: "Visa ending in 9876", expiry: "Expiry 06/2027" }];
const BILLING = { line1: "12 Marlow Gardens", rest: "BS7 9QT, Bristol, United Kingdom" };

const cents = (n) => Math.round(n * 100) / 100;
const same = (a, b) => Math.abs(a - b) < 0.005;
const parseAmount = (text) => Number(String(text).replace(/[^0-9.]/g, "")) || 0;

const scenarioFromUrl = () => {
  const n = Number(new URLSearchParams(location.search).get("scenario"));
  return SCENARIOS.find((s) => s.id === n) || SCENARIOS[0];
};

/* --------------------------------------------------------------------------
   Pieces
   -------------------------------------------------------------------------- */

const chevron = (open) => `<img class="nw-chevron ${open ? "nw-chevron--up" : ""}" src="${asset("chevron-down.svg")}" width="24" height="24" alt="" />`;

const amountPair = (n) => `
  <span class="nw-amount">
    <span class="nw-amount__usd">${money(n)}</span>
    <span class="nw-grey">${tokens(n)}</span>
  </span>`;

const control = (type, checked, pick, label) => `
  <button type="button" class="nw-control nw-control--${type}" role="${type === "radio" ? "radio" : "checkbox"}"
          aria-checked="${checked}" aria-label="${esc(label)}" data-pick="${pick}"></button>`;

const amountInput = (name, value, label) => `
  <span class="ds-input nw-input">
    <input name="${name}" data-amount="${name}" inputmode="decimal" autocomplete="off" aria-label="${esc(label)}" value="${money(value)}" />
  </span>`;

/* --------------------------------------------------------------------------
   Widget
   -------------------------------------------------------------------------- */

function create(scenario) {
  const { total, balance, mode } = scenario;
  const state = {
    open: false, // Payment method row expanded
    billingOpen: false,
    split: false, // scenario 3's switch
    // single: "balance" or a card id. short: whether the balance is ticked.
    choice: "balance",
    useBalance: true,
    cardId: mode === "short" ? CARDS[0].id : null,
    fromBalance: 0, // split mode amounts
    fromCard: 0,
  };

  /** What each method pays, for the current state. */
  const amounts = () => {
    if (mode === "short") {
      const b = state.useBalance ? Math.min(balance, total) : 0;
      return { balance: b, card: cents(total - b) };
    }
    if (mode === "split" && state.split) return { balance: state.fromBalance, card: state.fromCard };
    return state.choice === "balance" ? { balance: total, card: 0 } : { balance: 0, card: total };
  };
  const chosenCard = () => {
    if (mode === "short" || (mode === "split" && state.split)) return CARDS.find((c) => c.id === state.cardId) || null;
    return CARDS.find((c) => c.id === state.choice) || null;
  };

  const methodSummary = () => {
    const a = amounts();
    const card = a.card > 0 ? chosenCard() : null;
    if (a.balance > 0 && !card) return `<strong>Paymesh balance: ${money(balance)}</strong> <small class="nw-grey">(${tokens(balance)})</small>`;
    if (!a.balance && card) return `<strong>${esc(card.label)}</strong> <small class="nw-grey">${esc(card.expiry)}</small>`;
    if (a.balance > 0 && card)
      return `<strong>Paymesh balance: ${money(balance)}</strong> <small class="nw-grey">(${tokens(balance)})</small> + <strong>${esc(card.label)}</strong>`;
    return `<span class="nw-grey">Choose how to pay</span>`;
  };

  const balanceItem = () => {
    const a = amounts();
    const splitting = mode === "split" && state.split;
    const ctl =
      mode === "short"
        ? control("check", state.useBalance, "balance", "Use Paymesh balance")
        : control("radio", splitting || state.choice === "balance", "balance", "Pay with Paymesh balance");
    return `
      <div class="nw-item nw-item--balance" data-item="balance">
        ${ctl}
        <span class="nw-badge"><img src="${asset("nw-paymesh-mark.svg")}" width="19" height="12" alt="" /></span>
        <span class="nw-item__text">
          <span class="nw-item__title">Paymesh balance</span>
          <span><strong>${money(balance)}</strong> <small class="nw-grey">(${tokens(balance)})</small></span>
        </span>
        ${splitting ? amountInput("balance", a.balance, "Amount from your Paymesh balance") : amountPair(a.balance)}
      </div>`;
  };

  const cardItem = (card) => {
    const a = amounts();
    const splitting = mode === "split" && state.split;
    const selected = mode === "single" || (mode === "split" && !splitting) ? state.choice === card.id : state.cardId === card.id;
    const value = selected ? a.card : 0;
    return `
      <div class="nw-item" data-item="${card.id}">
        ${control("radio", selected, card.id, `Pay with ${card.label}`)}
        <img class="nw-scheme" src="${asset("visa.svg")}" width="34" height="24" alt="Visa" />
        <span class="nw-item__text">
          <span class="nw-item__title">${esc(card.label)}</span>
          <small class="nw-grey">${esc(card.expiry)}</small>
        </span>
        ${splitting ? amountInput(`card-${card.id}`, value, `Amount on ${card.label}`) : amountPair(value)}
      </div>`;
  };

  const methods = () => {
    if (!state.open)
      return `
        <button type="button" class="nw-row nw-toggle" data-toggle="methods" aria-expanded="false">
          ${icon("nw-card")}
          <span class="nw-row__content">
            <span class="nw-row__title">Payment method ${chevron(false)}</span>
            <span class="nw-row__sub" data-method-summary>${methodSummary()}</span>
          </span>
        </button>`;

    const list = [balanceItem()];
    list.push(`<hr class="nw-divider nw-divider--inset" />`);
    if (mode === "short") list.push(`<h3 class="nw-remaining">Remaining balance</h3>`);
    list.push(CARDS.map(cardItem).join(`<hr class="nw-divider nw-divider--inset" />`));

    return `
      <div class="nw-methods">
        <button type="button" class="nw-row nw-toggle" data-toggle="methods" aria-expanded="true">
          ${icon("nw-card")}
          <span class="nw-row__content"><span class="nw-row__title">Payment methods ${chevron(true)}</span></span>
        </button>
        ${
          mode === "split"
            ? `<div class="nw-switch-row">
                 <label class="sw-switch">
                   <input type="checkbox" data-split ${state.split ? "checked" : ""} />
                   <span class="sw-switch__track" aria-hidden="true"></span>
                   <span class="sw-switch__label">Split payment</span>
                 </label>
               </div>`
            : ""
        }
        <div class="nw-list" role="${mode === "short" ? "group" : "radiogroup"}" aria-label="Payment methods">
          ${list.join("")}
          <button type="button" class="ds-btn ds-btn--link nw-add" data-noop>${icon("add")}Add card</button>
        </div>
      </div>`;
  };

  const billing = () => `
    <button type="button" class="nw-row nw-toggle" data-toggle="billing" aria-expanded="${state.billingOpen}">
      ${icon("nw-pin")}
      <span class="nw-row__content">
        <span class="nw-row__title">Billing address ${chevron(state.billingOpen)}</span>
        ${
          state.billingOpen
            ? `<span class="nw-billing"><strong>${esc(BILLING.line1)}</strong><span>BS7 9QT, Bristol</span><span>United Kingdom</span></span>`
            : `<span class="nw-row__sub"><strong>${esc(BILLING.line1)}</strong><span class="nw-grey nw-grey--m">, ${esc(BILLING.rest)}</span></span>`
        }
      </span>
    </button>`;

  const markup = () => `
    <section class="ds-card nw" aria-label="Payment">
      <div class="sw-head">
        <h2 class="ds-card__title">Payment</h2>
        ${merchantLogo(MERCHANT, "nw-logo")}
      </div>
      <div class="nw-body">
        <div data-methods>${methods()}</div>
        <hr class="nw-divider" />
        <div data-billing>${billing()}</div>
        <hr class="nw-divider" />
        <div class="nw-row nw-total">
          ${icon("nw-cart")}
          <span class="nw-total__label">Amount to pay</span>
          <span class="nw-total__value">
            <span>${money(total)}</span>
            <small class="nw-grey">&asymp; ${tokens(total)}</small>
          </span>
        </div>
        <div class="nw-terms">
          ${checkbox({
            name: "terms",
            label: `I accept the terms and conditions of purchase for <a href="#" data-noop>Paymesh</a> and <a href="#" data-noop>Payhound</a>.`,
          })}
        </div>
        <div class="nw-pad ds-stack ds-stack--8">
          ${button("Continue to payment", { action: "pay" })}
          ${formAlert()}
        </div>
      </div>
    </section>
    <button type="button" class="ds-link nw-back" data-noop>&larr; Back to Payment Method</button>`;

  function mount(root) {
    const card = root.querySelector(".nw");
    const redraw = (part) => {
      if (part === "methods") card.querySelector("[data-methods]").innerHTML = methods();
      if (part === "billing") card.querySelector("[data-billing]").innerHTML = billing();
    };
    /** Split mode: keep the other field in step while one is being typed in. */
    const syncFields = (except) => {
      card.querySelectorAll("[data-amount]").forEach((field) => {
        if (field === except) return;
        const name = field.dataset.amount;
        field.value = money(name === "balance" ? state.fromBalance : state.cardId === name.slice(5) ? state.fromCard : 0);
      });
      card.querySelectorAll('[data-pick]:not([data-pick="balance"])').forEach((c) => c.setAttribute("aria-checked", String(c.dataset.pick === state.cardId)));
    };

    card.addEventListener("click", (e) => {
      if (e.target.closest("[data-noop]")) return e.preventDefault();
      const toggle = e.target.closest("[data-toggle]");
      if (toggle) {
        if (toggle.dataset.toggle === "methods") state.open = !state.open;
        else state.billingOpen = !state.billingOpen;
        return redraw(toggle.dataset.toggle);
      }
      if (e.target.closest("input")) return;
      const item = e.target.closest("[data-item]");
      if (!item) return;
      const pick = item.dataset.item;
      clearFormError(root);
      if (mode === "short") {
        if (pick === "balance") state.useBalance = !state.useBalance;
        else state.cardId = pick;
      } else if (mode === "split" && state.split) {
        if (pick === "balance") return; // the balance is always part of a split
        state.cardId = pick;
        state.fromCard = cents(Math.max(0, total - state.fromBalance));
      } else {
        state.choice = pick;
      }
      redraw("methods");
    });

    card.addEventListener("change", (e) => {
      if (!e.target.matches("[data-split]")) return;
      state.split = e.target.checked;
      // Splitting starts from nothing typed in, as in the design; turning it off
      // goes back to paying everything with the balance.
      state.choice = "balance";
      state.cardId = null;
      state.fromBalance = 0;
      state.fromCard = 0;
      clearFormError(root);
      redraw("methods");
    });

    card.addEventListener("input", (e) => {
      const field = e.target.closest("[data-amount]");
      if (!field) return;
      field.value = field.value.replace(/[^0-9.$,]/g, "");
      const value = parseAmount(field.value);
      clearFormError(root);
      if (field.dataset.amount === "balance") {
        state.fromBalance = cents(Math.min(value, balance, total));
        state.fromCard = cents(Math.max(0, total - state.fromBalance));
        if (state.fromCard > 0 && !state.cardId) state.cardId = CARDS[0].id;
      } else {
        state.cardId = field.dataset.amount.slice(5);
        state.fromCard = cents(Math.min(value, total));
        state.fromBalance = cents(Math.min(balance, Math.max(0, total - state.fromCard)));
      }
      syncFields(field);
    });
    card.addEventListener("focusout", (e) => {
      const field = e.target.closest?.("[data-amount]");
      if (field) syncFields(null);
    });

    const terms = card.querySelector('input[name="terms"]');
    terms.addEventListener("change", () => {
      terms.closest(".ds-check").dataset.invalid = "false";
      clearFormError(root);
    });

    const pay = card.querySelector('[data-action="pay"]');
    pay.addEventListener("click", () => {
      if (isBusy(pay)) return;
      clearFormError(root);
      const a = amounts();
      if (mode === "split" && state.split) {
        const sum = cents(a.balance + a.card);
        if (!same(sum, total)) {
          state.open = true;
          redraw("methods");
          return showFormError(
            root,
            sum < total
              ? `The two amounts need to add up to ${money(total)} — ${money(cents(total - sum))} still to cover.`
              : `The two amounts add up to ${money(cents(sum - total))} more than the total.`
          );
        }
      }
      if (a.card > 0 && !chosenCard()) {
        state.open = true;
        redraw("methods");
        return showFormError(root, "Choose a card for the remaining balance.");
      }
      if (!terms.checked) {
        terms.closest(".ds-check").dataset.invalid = "true";
        return showFormError(root, "Accept the terms and conditions to continue.");
      }
      busy(pay, "Processing");
      setTimeout(() => {
        pay.classList.remove("ds-btn--busy");
        delete pay.dataset.busy;
        pay.textContent = "Payment complete";
      }, PAY_MS);
    });
  }

  return { markup, mount };
}

/* The standalone page: the widget with the three scenario buttons beside it. */
const page = {
  render() {
    const current = scenarioFromUrl();
    this.widget = create(current);
    return `
    <main class="sw-stage">
      <div class="sw-wrap nw-wrap">
        <div class="sw-random" role="group" aria-label="Scenarios">
          ${SCENARIOS.map(
            (s) =>
              `<button type="button" class="sw-random__btn" data-scenario="${s.id}" aria-pressed="${s.id === current.id}">${s.id}. ${esc(s.label)}</button>`
          ).join("")}
        </div>
        ${this.widget.markup()}
      </div>
    </main>`;
  },

  mount(root) {
    this.widget.mount(root);
    root.querySelector(".sw-random").addEventListener("click", (e) => {
      const btn = e.target.closest("[data-scenario]");
      if (!btn) return;
      history.replaceState(null, "", `?scenario=${btn.dataset.scenario}`);
      root.innerHTML = page.render();
      page.mount(root);
    });
  },
};

export default page;
