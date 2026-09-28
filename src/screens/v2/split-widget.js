/**
 * Payment widget with split payment — layout from the Flows file,
 * "registration-10" (node 37:4483), 458px wide like the other registration
 * screens; behaviour first built against the design system's "Desktop - 2".
 *
 * Used in two places, each passing its own config (see `paymentWidget`):
 *   • widget.html — standalone on white, demo data from the URL, with the
 *     "Randomize amounts" buttons (the default export)
 *   • the registration journey's payment step (#/v2/payment) — the order,
 *     wallet balance, added cards and billing address from the journey state
 *
 * Three states from the design:
 *   • Split payment off  → the whole order comes out of the Paymesh balance
 *   • Split payment on   → part from the balance (amount + 25/50/100% chips),
 *                          the rest from a card
 *   • Card selected      → the card gets the remaining amount, with its own
 *                          field and "Remaining" / 25 / 50 / 100% chips
 *
 * The two amounts are independent: the balance chips are percentages of the
 * available balance, the card chips percentages of the order total. Whenever
 * they don't add up to the total, the balance gets a "Remaining" chip too,
 * which sets it to whatever makes them add up.
 *
 * When the balance can't cover the order on its own there is no switch —
 * the split is the only option, so "Remaining balance" is open from the start.
 *
 * The order is $3,456.79 and the balance $1,250.00 by default; ?total= and
 * ?balance= in the URL change them, and the "Randomize amounts" button next
 * to the widget picks new ones (about half the time the balance covers the
 * order, so both cases come up).
 */

import { button, checkbox, icon, asset, merchantLogo, busy, isBusy } from "../../ds.js";
import { esc, money, tokens, formAlert, showFormError, clearFormError } from "../../ui.js";
import { MERCHANT, ORDER } from "../../config.js";

const PAY_MS = 1400;
const DEFAULT_BALANCE = 1250;

/* Demo data for the standalone page. */
const DEMO_CARDS = [
  { id: "visa-9876", scheme: "visa", label: "Visa ending in 9876", expiry: "Expiry 06/2027" },
  { id: "mc-9833", scheme: "mastercard", label: "Mastercard ending in 9833", expiry: "Expiry 06/2027" },
];
const DEMO_BILLING = ["12 Marlow Gardens", "BS7 9QT, Bristol", "United Kingdom"];

const cents = (n) => Math.round(n * 100) / 100;
const same = (a, b) => Math.abs(a - b) < 0.005;

/*
 * The config being rendered: { total, balance, merchant, cards, billing (lines),
 * selectedCardId, onPay(result), onAddCard }. Without onPay the button ends on
 * "Payment complete"; without onAddCard "Add card" does nothing.
 */
let CFG = null;
let TOTAL = ORDER.total;
let BALANCE = DEFAULT_BALANCE;
/** The balance alone can't pay the order, so splitting isn't optional. */
let MUST_SPLIT = BALANCE < TOTAL;

function configure(cfg) {
  CFG = cfg;
  TOTAL = cents(cfg.total);
  BALANCE = cents(cfg.balance);
  MUST_SPLIT = BALANCE < TOTAL;
}

/** Standalone page: amounts from ?total= and ?balance=, demo cards and address. */
function standaloneConfig() {
  const params = new URLSearchParams(location.search);
  return {
    total: Number(params.get("total")) || ORDER.total,
    balance: params.has("balance") ? Number(params.get("balance")) || 0 : DEFAULT_BALANCE,
    merchant: MERCHANT,
    cards: DEMO_CARDS,
    billing: DEMO_BILLING,
    selectedCardId: null,
  };
}

/**
 * A new order total ($50–$5,000) and balance. `scenario` picks the case:
 * "short" — the balance can't cover the order; "covers" — it covers all of it;
 * anything else — either, about half the time each.
 */
function randomAmounts(scenario) {
  const between = (min, max) => cents(min + Math.random() * (max - min));
  const total = between(50, 5000);
  const covers = scenario === "covers" || (scenario !== "short" && Math.random() < 0.5);
  const balance = covers ? between(total, total * 1.6) : between(0, total * 0.9);
  return { total, balance };
}

const maxFromBalance = () => Math.min(BALANCE, TOTAL);
const parseAmount = (text) => Number(String(text).replace(/[^0-9.]/g, "")) || 0;

/* --------------------------------------------------------------------------
   Pieces
   -------------------------------------------------------------------------- */

const amounts = (n) => `
  <span class="sw-amounts">
    <span class="ds-amount">${money(n)}</span>
    <span class="sw-sub">${tokens(n)}</span>
  </span>`;

const schemeBadge = (scheme) =>
  scheme === "visa"
    ? `<img src="${asset("visa-lg.svg")}" width="45" height="32" alt="Visa" />`
    : `<span class="ds-method ds-method--lg"><img src="${asset("mastercard.svg")}" alt="Mastercard" /></span>`;

/** Amount field with quick-pick chips; `chips` is [{ label, value, fill? }] — `fill` marks "Remaining". */
const amountEditor = (name, value, chips) => `
  <div class="sw-editor">
    <div class="ds-input sw-editor__input">
      <input name="${name}" data-amount="${name}" inputmode="decimal" autocomplete="off"
             aria-label="${name === "balance" ? "Amount from your Paymesh balance" : "Amount on this card"}"
             value="${money(value)}" />
    </div>
    <div class="sw-chips" role="group" aria-label="Quick amounts">
      ${chips
        .map(
          (c) =>
            `<button type="button" class="sw-chip" data-chip="${name}" data-value="${c.value}"
                     ${c.fill ? "data-fill" : ""} aria-pressed="false">${esc(c.label)}</button>`
        )
        .join("")}
    </div>
  </div>`;

const PERCENTS = [25, 50, 100];
const percentChips = (of) => PERCENTS.map((p) => ({ label: `${p}%`, value: cents((of * p) / 100) }));

/**
 * The card's percentages of the order, rounded to complement the balance's:
 * the card's p% is the order minus (100 − p)% of it. On an odd-cent order
 * ($144.93) a 50% / 50% split is then $72.47 + $72.46, adding up exactly
 * instead of both rounding up to $72.47.
 */
const cardPercentChips = (total) =>
  PERCENTS.map((p) => ({ label: `${p}%`, value: cents(total - cents((total * (100 - p)) / 100)) }));

/* --------------------------------------------------------------------------
   Widget
   -------------------------------------------------------------------------- */

/** The widget card itself, for the current config. */
function cardMarkup() {
  return `
      <section class="ds-card sw" aria-label="Payment">
        <div class="sw-head">
          <h2 class="ds-card__title">Payment</h2>
          ${merchantLogo(CFG.merchant, "sw-head__logo")}
        </div>
        <div class="ds-card__body sw-body">
          <div class="sw-pad sw-total">
            <span class="sw-total__label">Amount to pay</span>
            <span class="sw-total__value">
              <span class="sw-total__usd">${money(TOTAL)}</span>
              <span class="sw-total__token">&asymp; ${tokens(TOTAL)}</span>
            </span>
          </div>
          <hr class="sw-divider" />
          <div class="sw-main" data-main></div>
          <div class="sw-pad" data-statement hidden>
            <div class="ds-info">
              ${icon("receipt", 20)}
              <span>This payment will appear on your bank statement as <strong>Paymesh-xyz-1234</strong>.</span>
            </div>
          </div>
          <div class="sw-pad">
            ${checkbox({
              name: "terms",
              label: `I accept the terms and conditions of purchase for both
                      <a href="#" data-noop>Paymesh</a> and <a href="#" data-noop>Payhound</a>.`,
            })}
          </div>
          <div class="sw-pad ds-stack ds-stack--8">
            ${button("Continue to payment", { action: "pay" })}
            ${formAlert()}
          </div>
          <p class="ds-secure">${icon("safety", 20)}This payment is secure thanks to xyz.</p>
        </div>
      </section>`;
}

/** Wires the card rendered by cardMarkup() inside `root`. */
function mountCard(root) {
  const main = root.querySelector("[data-main]");
  const cards = CFG.cards;
  const state = {
    split: MUST_SPLIT,
    fromBalance: maxFromBalance(),
    // A card chosen earlier (e.g. just added) starts selected when the split is on.
    cardId: MUST_SPLIT && cards.some((c) => c.id === CFG.selectedCardId) ? CFG.selectedCardId : null,
    fromCard: 0,
    cardEdited: false, // once the buyer types a card amount, stop following the remainder
  };
  const remaining = () => cents(Math.max(0, TOTAL - state.fromBalance));
  const cardInUse = () => Boolean(state.split && state.cardId);
  /** A "Remaining" chip is redundant when a percentage chip already offers that amount. */
  const duplicatesPercent = (value, chips) => chips.some((c) => same(c.value, value));
  const paid = () => cents(state.fromBalance + (cardInUse() ? state.fromCard : 0));
  /** What the balance would need to be for the two amounts to add up to the total. */
  const balanceFill = () => cents(Math.min(Math.max(TOTAL - state.fromCard, 0), maxFromBalance()));
  const remainingLabel = (n) => `Remaining ${money(n)}`;

  /* Structure changes (switch, card choice) redraw the sections; typing only syncs numbers. */
  const draw = () => {
    main.innerHTML = `
      <section class="sw-section sw-section--balance sw-pad" aria-label="Paymesh balance">
        <div class="sw-item" aria-checked="true">
          <div class="sw-item__row">
            <span class="sw-square" aria-hidden="true"></span>
            <span class="ds-option__main"><span class="ds-option__title">Paymesh balance</span></span>
            ${amounts(BALANCE)}
          </div>
          ${
            state.split && BALANCE > 0
              ? amountEditor("balance", state.fromBalance, [
                  { label: remainingLabel(balanceFill()), value: balanceFill(), fill: true },
                  ...percentChips(maxFromBalance()),
                ])
              : ""
          }
        </div>
        ${
          MUST_SPLIT
            ? ""
            : `<div class="sw-switch-row">
                 <label class="sw-switch">
                   <input type="checkbox" data-split ${state.split ? "checked" : ""} />
                   <span class="sw-switch__track" aria-hidden="true"></span>
                   <span class="sw-switch__label">Split payment</span>
                 </label>
               </div>`
        }
      </section>

      <hr class="sw-divider" />

      ${
        state.split
          ? `<section class="sw-section sw-pad">
               <div class="sw-section__head sw-section__head--top">
                 <h3 class="ds-h2">Remaining balance</h3>
                 <span data-remaining>${amounts(remaining())}</span>
               </div>
               <div class="sw-cards" data-cards>
                 <div class="ds-stack ds-stack--16" role="radiogroup" aria-label="Card for the remaining balance">
                   ${cards.map((card) => cardItem(card)).join("")}
                 </div>
                 <button class="ds-btn ds-btn--link" ${CFG.onAddCard ? 'data-action="add-card"' : "data-noop"}>${icon("add")}Add card</button>
               </div>
             </section>
             <hr class="sw-divider" />`
          : ""
      }

      <section class="sw-section sw-pad">
        <div class="sw-section__head">
          <h3 class="ds-h2">Billing address</h3>
          <a class="ds-link" href="#" data-noop>Edit</a>
        </div>
        <div class="sw-billing">${CFG.billing.map((l) => `<p>${esc(l)}</p>`).join("")}</div>
      </section>`;
    sync();
  };

  const cardItem = (card) => {
    const selected = card.id === state.cardId;
    return `
    <div class="sw-item" aria-checked="${selected}">
      <button type="button" class="sw-item__row sw-item__pick" role="radio" aria-checked="${selected}"
              data-card="${card.id}">
        <span class="ds-option__radio" aria-hidden="true"></span>
        <span class="ds-option__main">
          <span class="ds-option__title">${esc(card.label)}</span>
          <span class="ds-option__sub">${esc(card.expiry)}</span>
        </span>
        <span class="ds-option__side">${schemeBadge(card.scheme)}</span>
      </button>
      ${
        selected
          ? amountEditor("card", state.fromCard, [
              { label: remainingLabel(remaining()), value: remaining(), fill: true },
              ...cardPercentChips(TOTAL),
            ])
          : ""
      }
    </div>`;
  };

  /** Numbers that follow the amounts without redrawing (so a field keeps focus while typing). */
  const sync = () => {
    if (state.cardId && !state.cardEdited) state.fromCard = remaining();

    // A card is being charged, so say how it will show on the statement.
    root.querySelector("[data-statement]").hidden = !(cardInUse() && state.fromCard > 0);

    const rem = main.querySelector("[data-remaining]");
    if (rem) rem.innerHTML = amounts(remaining());

    // "Remaining" chips only show when there is more than $0 to fill and no
    // percentage chip already offers the same amount (e.g. a 50% / 50% split).
    const cardFill = main.querySelector('[data-chip="card"][data-fill]');
    if (cardFill) {
      cardFill.dataset.value = remaining();
      cardFill.textContent = remainingLabel(remaining());
      cardFill.hidden = remaining() <= 0 || duplicatesPercent(remaining(), cardPercentChips(TOTAL));
    }

    // The balance's "Remaining" chip shows while a card is chosen and there's more
    // than $0 to fill; once pressed it stays, lit, like the percentage chips.
    const balanceChip = main.querySelector('[data-chip="balance"][data-fill]');
    if (balanceChip) {
      balanceChip.dataset.value = balanceFill();
      balanceChip.textContent = remainingLabel(balanceFill());
      balanceChip.hidden =
        !cardInUse() || balanceFill() <= 0 || duplicatesPercent(balanceFill(), percentChips(maxFromBalance()));
    }

    [
      ["balance", state.fromBalance],
      ["card", state.fromCard],
    ].forEach(([name, value]) => {
      const field = main.querySelector(`[data-amount="${name}"]`);
      if (field && document.activeElement !== field) field.value = money(value);
      // Highlight the first chip that matches the amount.
      let lit = false;
      main.querySelectorAll(`[data-chip="${name}"]:not([hidden])`).forEach((chip) => {
        const on = !lit && same(Number(chip.dataset.value), value);
        chip.setAttribute("aria-pressed", String(on));
        lit ||= on;
      });
    });
  };

  const setBalance = (value) => {
    state.fromBalance = cents(Math.min(Math.max(value, 0), maxFromBalance()));
    sync();
  };
  /** Set the card amount and let the balance cover the rest, up to what's available. */
  const setCardAndBalance = (value) => {
    setCard(value);
    setBalance(balanceFill());
  };
  const setCard = (value, edited = true) => {
    state.fromCard = cents(Math.min(Math.max(value, 0), TOTAL));
    state.cardEdited = edited;
    sync();
  };

  main.addEventListener("change", (e) => {
    if (!e.target.matches("[data-split]")) return;
    state.split = e.target.checked;
    // Turning the split on starts the balance at 25% (as in the design), so
    // there's something left for a card; turning it off pays it all from the balance.
    state.fromBalance = state.split ? percentChips(maxFromBalance())[0].value : maxFromBalance();
    state.cardId = null;
    state.cardEdited = false;
    clearFormError(root);
    draw();
  });

  main.addEventListener("click", (e) => {
    const pick = e.target.closest("[data-card]");
    if (pick) {
      state.cardId = pick.dataset.card;
      state.cardEdited = false;
      clearFormError(root);
      draw();
      return;
    }
    if (e.target.closest('[data-action="add-card"]')) return CFG.onAddCard();
    const chip = e.target.closest("[data-chip]");
    if (chip) {
      const value = Number(chip.dataset.value);
      if (chip.dataset.chip === "balance") setBalance(value);
      // The card's "Remaining" puts it back on following what the balance leaves.
      else if ("fill" in chip.dataset) setCard(value, false);
      // A card percentage sets the card, and the balance makes up the rest
      // (the card's 100% takes the balance to $0.00).
      else setCardAndBalance(value);
      clearFormError(root);
    }
  });

  // Typing keeps only digits and a point; the value is clamped and formatted on blur.
  main.addEventListener("input", (e) => {
    const field = e.target.closest("[data-amount]");
    if (!field) return;
    field.value = field.value.replace(/[^0-9.$,]/g, "");
    if (field.dataset.amount === "balance") setBalance(parseAmount(field.value));
    else setCardAndBalance(parseAmount(field.value));
    clearFormError(root);
  });
  main.addEventListener("focusout", (e) => {
    const field = e.target.closest("[data-amount]");
    if (field) field.value = money(field.dataset.amount === "balance" ? state.fromBalance : state.fromCard);
  });

  const terms = root.querySelector('input[name="terms"]');
  terms.addEventListener("change", () => {
    terms.closest(".ds-check").dataset.invalid = "false";
    clearFormError(root);
  });

  const pay = root.querySelector('[data-action="pay"]');
  pay.addEventListener("click", () => {
    if (isBusy(pay) || pay.dataset.done) return;
    clearFormError(root);

    if (state.split && remaining() > 0 && !state.cardId) {
      return showFormError(root, `Choose a card to pay the remaining ${money(remaining())}.`);
    }
    if (state.split && !same(paid(), TOTAL)) {
      const gap = cents(TOTAL - paid());
      return showFormError(
        root,
        `The balance and card amounts need to add up to ${money(TOTAL)} — ${
          gap > 0 ? `${money(gap)} is still to cover.` : `that's ${money(-gap)} more than the total.`
        }`
      );
    }
    if (!terms.checked) {
      terms.closest(".ds-check").dataset.invalid = "true";
      return showFormError(root, "Accept the terms and conditions to continue.");
    }

    busy(pay, "Processing");
    setTimeout(() => {
      const result = {
        fromBalance: state.fromBalance,
        fromCard: cardInUse() ? state.fromCard : 0,
        cardId: cardInUse() ? state.cardId : null,
      };
      if (CFG.onPay) return CFG.onPay(result);
      pay.dataset.done = "1";
      pay.classList.remove("ds-btn--busy");
      delete pay.dataset.busy;
      pay.textContent = "Payment complete";
    }, PAY_MS);
  });

  draw();
}

/**
 * A widget for a config supplied at render time: `getConfig()` returns
 * { total, balance, merchant, cards, billing, selectedCardId, onPay, onAddCard }.
 */
export function paymentWidget(getConfig) {
  return {
    render() {
      configure(getConfig());
      return cardMarkup();
    },
    mount(root) {
      mountCard(root);
    },
  };
}

/* The standalone page (widget.html): the card on white with the amount scenarios beside it. */
const widget = {
  render() {
    configure(standaloneConfig());
    return `
    <main class="sw-stage">
      <div class="sw-wrap">
        <div class="sw-random" role="group" aria-label="Try other amounts">
          <button type="button" class="sw-random__btn" data-randomize="any">Randomize amounts</button>
          <button type="button" class="sw-random__btn" data-randomize="short">Insufficient Paymesh balance</button>
          <button type="button" class="sw-random__btn" data-randomize="covers">Paymesh balance covers 100%</button>
        </div>
        ${cardMarkup()}
      </div>
    </main>`;
  },

  mount(root) {
    mountCard(root);
    root.querySelector(".sw-random").addEventListener("click", (e) => {
      const btn = e.target.closest("[data-randomize]");
      if (!btn) return;
      const { total, balance } = randomAmounts(btn.dataset.randomize);
      history.replaceState(null, "", `?total=${total}&balance=${balance}`);
      root.innerHTML = widget.render();
      widget.mount(root);
    });
  },
};

export default widget;
