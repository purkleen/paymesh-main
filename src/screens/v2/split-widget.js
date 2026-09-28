/**
 * Payment widget with split payment — Figma "Desktop - 2" (node 1300:27859).
 *
 * Standalone: rendered on its own white page by src/widget.js, outside the
 * journeys. Three states from the design:
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

import { button, checkbox, icon, asset, merchantPayment, busy, isBusy } from "../../ds.js";
import { esc, money, tokens, formAlert, showFormError, clearFormError } from "../../ui.js";
import { MERCHANT, ORDER } from "../../config.js";

const PAY_MS = 1400;
const DEFAULT_BALANCE = 1250;

const CARDS = [
  { id: "visa-9876", scheme: "visa", label: "Visa ending in 9876", expiry: "Expiry 06/2027" },
  { id: "mc-9833", scheme: "mastercard", label: "Mastercard ending in 9833", expiry: "Expiry 06/2027" },
];

const BILLING = ["12 Marlow Gardens", "BS7 9QT, Bristol", "United Kingdom"];

const cents = (n) => Math.round(n * 100) / 100;
const same = (a, b) => Math.abs(a - b) < 0.005;

/* Amounts come from the URL (see readAmounts) and change when randomized. */
let TOTAL = ORDER.total;
let BALANCE = DEFAULT_BALANCE;
/** The balance alone can't pay the order, so splitting isn't optional. */
let MUST_SPLIT = BALANCE < TOTAL;

function readAmounts() {
  const params = new URLSearchParams(location.search);
  TOTAL = cents(Number(params.get("total")) || ORDER.total);
  BALANCE = cents(params.has("balance") ? Number(params.get("balance")) || 0 : DEFAULT_BALANCE);
  MUST_SPLIT = BALANCE < TOTAL;
}

/** A new order total ($50–$5,000) and a balance that covers it about half the time. */
function randomAmounts() {
  const between = (min, max) => cents(min + Math.random() * (max - min));
  const total = between(50, 5000);
  const balance = Math.random() < 0.5 ? between(total, total * 1.6) : between(0, total * 0.9);
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

const percentChips = (of) => [25, 50, 100].map((p) => ({ label: `${p}%`, value: cents((of * p) / 100) }));

/* --------------------------------------------------------------------------
   Widget
   -------------------------------------------------------------------------- */

const widget = {
  render() {
    readAmounts();
    return `
    <main class="sw-stage">
      <div class="sw-wrap">
      <button type="button" class="sw-random" data-randomize
              title="New order total and Paymesh balance">Randomize amounts</button>
      <section class="ds-card sw" aria-label="Payment">
        <h2 class="ds-card__title">Payment</h2>
        <div class="ds-card__body">
          ${merchantPayment(MERCHANT, money(TOTAL), tokens(TOTAL))}
          <div class="sw-main" data-main></div>
          <div class="ds-info" data-statement hidden>
            ${icon("receipt", 20)}
            <span>This payment will appear on your bank statement as <strong>Paymesh-xyz-1234</strong>.</span>
          </div>
          ${checkbox({
            name: "terms",
            label: `I accept the terms and conditions of purchase for both
                    <a href="#" data-noop>Paymesh</a> and <a href="#" data-noop>Payhound</a>.`,
          })}
          <div class="ds-stack ds-stack--8">
            ${button("To payment", { action: "pay" })}
            ${formAlert()}
          </div>
          <p class="ds-secure">${icon("safety", 20)}This payment is secure thanks to xyz.</p>
        </div>
      </section>
      </div>
    </main>`;
  },

  mount(root) {
    const main = root.querySelector("[data-main]");
    const state = {
      split: MUST_SPLIT,
      fromBalance: maxFromBalance(),
      cardId: null,
      fromCard: 0,
      cardEdited: false, // once the buyer types a card amount, stop following the remainder
    };
    const remaining = () => cents(Math.max(0, TOTAL - state.fromBalance));
    const paid = () => cents(state.fromBalance + (state.cardId ? state.fromCard : 0));
    /** What the balance would need to be for the two amounts to add up to the total. */
    const balanceFill = () => cents(Math.min(Math.max(TOTAL - state.fromCard, 0), maxFromBalance()));
    const remainingLabel = (n) => `Remaining ${money(n)}`;

    /* Structure changes (switch, card choice) redraw the sections; typing only syncs numbers. */
    const draw = () => {
      main.innerHTML = `
        <section class="sw-section">
          <div class="sw-section__head">
            <h3 class="ds-h2">Paymesh Balance</h3>
            ${
              MUST_SPLIT
                ? ""
                : `<label class="sw-switch">
                     <input type="checkbox" data-split ${state.split ? "checked" : ""} />
                     <span class="sw-switch__track" aria-hidden="true"></span>
                     <span class="sw-switch__label">Split payment</span>
                   </label>`
            }
          </div>
          <div class="sw-item" aria-checked="true">
            <div class="sw-item__row">
              <span class="sw-square" aria-hidden="true"></span>
              <span class="ds-option__main"><span class="ds-option__title">Paymesh balance</span></span>
              ${amounts(BALANCE)}
            </div>
            ${
              state.split
                ? amountEditor("balance", state.fromBalance, [
                    { label: remainingLabel(balanceFill()), value: balanceFill(), fill: true },
                    ...percentChips(maxFromBalance()),
                  ])
                : ""
            }
          </div>
        </section>

        ${
          state.split
            ? `<section class="sw-section">
                 <div class="sw-section__head sw-section__head--top">
                   <h3 class="ds-h2">Remaining balance</h3>
                   <span data-remaining>${amounts(remaining())}</span>
                 </div>
                 <div class="ds-stack ds-stack--16" role="radiogroup" aria-label="Card for the remaining balance">
                   ${CARDS.map((card) => cardItem(card)).join("")}
                 </div>
                 <button class="ds-btn ds-btn--link ds-btn--link-l" data-noop>${icon("add")}Add card</button>
               </section>`
            : ""
        }

        <section class="sw-section">
          <div class="sw-section__head sw-section__head--baseline">
            <h3 class="ds-h2">Billing address</h3>
            <a class="ds-link" href="#" data-noop>Edit</a>
          </div>
          <div class="sw-billing">${BILLING.map((l) => `<p>${esc(l)}</p>`).join("")}</div>
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
                ...percentChips(TOTAL),
              ])
            : ""
        }
      </div>`;
    };

    /** Numbers that follow the amounts without redrawing (so a field keeps focus while typing). */
    const sync = () => {
      if (state.cardId && !state.cardEdited) state.fromCard = remaining();

      // A card is being charged, so say how it will show on the statement.
      root.querySelector("[data-statement]").hidden = !(state.split && state.cardId);

      const rem = main.querySelector("[data-remaining]");
      if (rem) rem.innerHTML = amounts(remaining());

      const cardFill = main.querySelector('[data-chip="card"][data-fill]');
      if (cardFill) {
        cardFill.dataset.value = remaining();
        cardFill.textContent = remainingLabel(remaining());
      }

      // The balance's "Remaining" chip only shows while the amounts don't add up
      // and pressing it would change the balance (it can't go past what's available).
      const balanceChip = main.querySelector('[data-chip="balance"][data-fill]');
      if (balanceChip) {
        balanceChip.dataset.value = balanceFill();
        balanceChip.textContent = remainingLabel(balanceFill());
        balanceChip.hidden = !state.cardId || same(paid(), TOTAL) || same(balanceFill(), state.fromBalance);
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
    const setCard = (value, edited = true) => {
      state.fromCard = cents(Math.min(Math.max(value, 0), TOTAL));
      state.cardEdited = edited;
      sync();
    };

    main.addEventListener("change", (e) => {
      if (!e.target.matches("[data-split]")) return;
      state.split = e.target.checked;
      if (!state.split) {
        state.fromBalance = maxFromBalance();
        state.cardId = null;
        state.cardEdited = false;
      }
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
      const chip = e.target.closest("[data-chip]");
      if (chip) {
        const value = Number(chip.dataset.value);
        if (chip.dataset.chip === "balance") setBalance(value);
        // The card's "Remaining" puts it back on following what the balance leaves.
        else setCard(value, !("fill" in chip.dataset));
        clearFormError(root);
      }
    });

    // Typing keeps only digits and a point; the value is clamped and formatted on blur.
    main.addEventListener("input", (e) => {
      const field = e.target.closest("[data-amount]");
      if (!field) return;
      field.value = field.value.replace(/[^0-9.$,]/g, "");
      if (field.dataset.amount === "balance") setBalance(parseAmount(field.value));
      else setCard(parseAmount(field.value));
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
        pay.dataset.done = "1";
        pay.classList.remove("ds-btn--busy");
        delete pay.dataset.busy;
        pay.textContent = "Payment complete";
      }, PAY_MS);
    });

    root.querySelector("[data-randomize]").addEventListener("click", () => {
      const { total, balance } = randomAmounts();
      history.replaceState(null, "", `?total=${total}&balance=${balance}`);
      root.innerHTML = widget.render();
      widget.mount(root);
    });

    draw();
  },
};

export default widget;
