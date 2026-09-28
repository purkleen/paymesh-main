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
 * The balance is $1,250.00 by default so there is something to split;
 * ?balance=5000 in the URL changes it.
 */

import { button, checkbox, icon, asset, merchantPayment, busy, isBusy } from "../../ds.js";
import { esc, money, tokens, formAlert, showFormError, clearFormError } from "../../ui.js";
import { MERCHANT, ORDER } from "../../config.js";

const TOTAL = ORDER.total;
const BALANCE = Number(new URLSearchParams(location.search).get("balance")) || 1250;
const PAY_MS = 1400;

const CARDS = [
  { id: "visa-9876", scheme: "visa", label: "Visa ending in 9876", expiry: "Expiry 06/2027" },
  { id: "mc-9833", scheme: "mastercard", label: "Mastercard ending in 9833", expiry: "Expiry 06/2027" },
];

const BILLING = ["12 Marlow Gardens", "BS7 9QT, Bristol", "United Kingdom"];

const cents = (n) => Math.round(n * 100) / 100;
const same = (a, b) => Math.abs(a - b) < 0.005;
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

/** Amount field with quick-pick chips; `chips` is [{ label, value }]. */
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
                     aria-pressed="false">${esc(c.label)}</button>`
        )
        .join("")}
    </div>
  </div>`;

const percentChips = (of) => [25, 50, 100].map((p) => ({ label: `${p}%`, value: cents((of * p) / 100) }));

/* --------------------------------------------------------------------------
   Widget
   -------------------------------------------------------------------------- */

export default {
  render() {
    return `
    <main class="sw-stage">
      <section class="ds-card sw" aria-label="Payment">
        <h2 class="ds-card__title">Payment</h2>
        <div class="ds-card__body">
          ${merchantPayment(MERCHANT, money(TOTAL), tokens(TOTAL))}
          <div class="sw-main" data-main></div>
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
    </main>`;
  },

  mount(root) {
    const main = root.querySelector("[data-main]");
    const state = {
      split: false,
      fromBalance: maxFromBalance(),
      cardId: null,
      fromCard: 0,
      cardEdited: false, // once the buyer types a card amount, stop following the remainder
    };
    const remaining = () => cents(Math.max(0, TOTAL - state.fromBalance));

    /* Structure changes (switch, card choice) redraw the sections; typing only syncs numbers. */
    const draw = () => {
      main.innerHTML = `
        <section class="sw-section">
          <div class="sw-section__head">
            <h3 class="ds-h2">Paymesh Balance</h3>
            <label class="sw-switch">
              <input type="checkbox" data-split ${state.split ? "checked" : ""} />
              <span class="sw-switch__track" aria-hidden="true"></span>
              <span class="sw-switch__label">Split payment</span>
            </label>
          </div>
          <div class="sw-item" aria-checked="true">
            <div class="sw-item__row">
              <span class="sw-square" aria-hidden="true"></span>
              <span class="ds-option__main"><span class="ds-option__title">Paymesh balance</span></span>
              ${amounts(BALANCE)}
            </div>
            ${state.split ? amountEditor("balance", state.fromBalance, percentChips(maxFromBalance())) : ""}
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
                { label: `Remaining ${money(remaining())}`, value: remaining() },
                ...percentChips(remaining()),
              ])
            : ""
        }
      </div>`;
    };

    /** Numbers that follow the amounts without redrawing (so a field keeps focus while typing). */
    const sync = () => {
      if (state.cardId && !state.cardEdited) state.fromCard = remaining();

      const rem = main.querySelector("[data-remaining]");
      if (rem) rem.innerHTML = amounts(remaining());

      const remainingChip = main.querySelector('[data-chip="card"]');
      if (remainingChip) {
        remainingChip.dataset.value = remaining();
        remainingChip.textContent = `Remaining ${money(remaining())}`;
        const [, ...pct] = main.querySelectorAll('[data-chip="card"]');
        percentChips(remaining()).forEach((c, i) => (pct[i].dataset.value = c.value));
      }

      [
        ["balance", state.fromBalance],
        ["card", state.fromCard],
      ].forEach(([name, value]) => {
        const field = main.querySelector(`[data-amount="${name}"]`);
        if (field && document.activeElement !== field) field.value = money(value);
        // Highlight the first chip that matches the amount.
        let lit = false;
        main.querySelectorAll(`[data-chip="${name}"]`).forEach((chip) => {
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
      state.fromCard = cents(Math.min(Math.max(value, 0), remaining()));
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
        // "Remaining" puts the card back on following the remainder.
        else setCard(value, !chip.textContent.startsWith("Remaining"));
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

      if (!state.split && BALANCE < TOTAL) {
        return showFormError(
          root,
          `Your Paymesh balance doesn't cover ${money(TOTAL)}. Turn on Split payment to pay the rest by card.`
        );
      }
      if (state.split && remaining() > 0 && !state.cardId) {
        return showFormError(root, `Choose a card to pay the remaining ${money(remaining())}.`);
      }
      if (state.split && state.cardId && !same(state.fromCard, remaining())) {
        return showFormError(
          root,
          `The balance and card amounts need to add up to ${money(TOTAL)} — ${money(
            cents(remaining() - state.fromCard)
          )} is still to cover.`
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

    draw();
  },
};
