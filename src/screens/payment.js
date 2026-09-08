/**
 * The payment sheet.
 *
 * Covers all three states drawn in the Figma file:
 *   • balance covers the order            → Pay
 *   • brand-new wallet with no card       → Add new card, error under Pay
 *   • balance short after adding a card   → "Missing" row + top-up card choice
 * plus the authorization error from scenario 7.
 */

import {
  shellRaw,
  money,
  tokens,
  esc,
  formAlert,
  showFormError,
  clearFormError,
  busy,
  isBusy,
} from "../ui.js";
import { icons, schemes } from "../icons.js";
import { getState, update, balanceCovers, shortfall } from "../store.js";
import { paymentAuthorized, addCardRequested, backToMerchant } from "../flow.js";
import { AUTHORIZE_MS } from "../config.js";

const ERROR_TEXT = `The retailer amounts don't match the overall total. Please confirm your
split details and retry. If you keep having the issue with the payment please`;

function balanceRow(wallet) {
  // Prompt for a card only while the wallet has none at all — once one has been
  // added it shows up as the top-up choice further down the sheet.
  const sub = wallet.fundingCard
    ? wallet.fundingCard.label
    : wallet.topupCard
      ? ""
      : "You need to add a card for the first payment";

  return `
  <div class="row">
    <span class="row__icon">${icons.wallet(20)}</span>
    <span class="row__main">
      <span class="row__title">Paymesh balance</span>
      ${sub ? `<span class="row__sub">${esc(sub)}</span>` : ""}
    </span>
    <span class="row__side">
      <span class="row__amount">${money(wallet.balance)}</span>
      <span class="row__amount-sub">${tokens(wallet.balance)}</span>
    </span>
  </div>`;
}

function missingRow(amount) {
  return `
  <div class="row rowline row--danger">
    <span class="row__icon">${icons.missing(20)}</span>
    <span class="row__main"><span class="row__title">Missing:</span></span>
    <span class="row__side">
      <span class="row__amount">${money(amount)}</span>
      <span class="row__amount-sub">${tokens(amount)}</span>
    </span>
  </div>
  <p class="note">Your Paymesh balance doesn't cover this payment. Choose a card to top up the difference.</p>`;
}

function topupChoice(card) {
  return `
  <div class="rowline">
    <button class="choice" role="radio" aria-checked="true" data-topup>
      <span class="choice__brand">${schemes[card.scheme] ? schemes[card.scheme]() : ""}</span>
      <span class="choice__main">
        <span class="row__title">${esc(card.label)}</span>
        <span class="row__sub">${esc(card.expiry)}</span>
      </span>
      <span class="choice__radio"></span>
    </button>
  </div>`;
}

function addressRow(name, address) {
  if (!address) return "";
  return `
  <div class="row rowline">
    <span class="row__icon">${icons.pin(20)}</span>
    <span class="row__main">
      <span class="row__title">${esc(name)}</span>
      <span class="row__sub">${esc(address.line1)}</span>
      <span class="row__sub">${esc(address.postcode)}, ${esc(address.city)}</span>
    </span>
  </div>`;
}

export default {
  render() {
    const { order, wallet, session } = getState();
    if (!order) return shellRaw({ content: `<p class="center">No pending payment.</p>` });

    const covers = balanceCovers();
    const needsCard = !covers && !wallet.topupCard;
    const missing = shortfall();

    return shellRaw({
      content: `
      <section class="card">
        <div class="card__head"><h2>Payment</h2></div>
        <div class="card__body">

          <div class="merchant">
            <span class="merchant__logo" style="background:${order.merchant.color}">
              ${esc(order.merchant.initial)}
            </span>
            <span class="merchant__name">${esc(order.merchant.name)}</span>
          </div>

          <div class="amount">
            <div class="amount__value">${money(order.amount)}</div>
            <div class="amount__sub">${tokens(order.amount)}</div>
          </div>

          <div class="rowline"></div>
          ${balanceRow(wallet)}

          ${needsCard ? `<div style="padding-bottom:14px">
              <button class="btn btn--secondary" data-action="add-card">Add new card</button>
            </div>` : ""}

          ${!covers && wallet.topupCard ? missingRow(missing) : ""}
          ${wallet.topupCard ? topupChoice(wallet.topupCard) : ""}

          ${addressRow(session.name, wallet.address)}

          <div style="height:8px"></div>
          <button class="btn btn--primary" data-action="pay">Pay</button>
          ${formAlert()}

          <button class="link under-action" data-action="cancel">or cancel and go back to merchant</button>
        </div>
      </section>`,
    });
  },

  mount(root) {
    const payBtn = root.querySelector('[data-action="pay"]');
    let timer = null;

    root.querySelector('[data-action="add-card"]')?.addEventListener("click", addCardRequested);
    root.querySelector('[data-action="cancel"]').addEventListener("click", backToMerchant);

    payBtn.addEventListener("click", () => {
      if (isBusy(payBtn)) return;

      const { flow, wallet } = getState();

      // Second press, once authorization has succeeded.
      if (payBtn.dataset.state === "ready") return paymentAuthorized();

      // Nothing to pay with yet — say so rather than blocking the button.
      if (!balanceCovers() && !wallet.topupCard) {
        showFormError(
          root,
          "Add a card to cover this payment before continuing."
        );
        root.querySelector('[data-action="add-card"]')?.focus();
        return;
      }

      clearFormError(root);
      const attempts = flow.authAttempts + 1;
      update("flow", { authAttempts: attempts });

      const done = busy(payBtn, "Authorizing...");

      timer = setTimeout(() => {
        if (flow.failFirstAuth && attempts === 1) {
          done("Pay");
          payBtn.dataset.state = "idle";
          showFormError(root, `${ERROR_TEXT} <a href="#" data-noop>contact us</a>.`);
        } else {
          done("Continue");
          payBtn.dataset.state = "ready";
          payBtn.focus();
        }
      }, AUTHORIZE_MS);
    });

    return { destroy: () => clearTimeout(timer) };
  },
};
