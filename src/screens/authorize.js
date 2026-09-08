/**
 * "Complete order" — approve the transfer of tokens out of the Paymesh wallet.
 */

import { shellRaw, money, tokens, esc, busy, isBusy } from "../ui.js";
import { mark, icons } from "../icons.js";
import { getState } from "../store.js";
import { transferAuthorized, backToMerchant } from "../flow.js";
import { AUTHORIZE_MS } from "../config.js";

export default {
  render() {
    const { order } = getState();
    if (!order) return shellRaw({ content: `<p class="center">No pending payment.</p>` });

    return shellRaw({
      content: `
      <section class="card">
        <div class="card__head">
          <h2>Complete order</h2>
          <p>Approve the transfer of tokens from your Paymesh wallet to pay for your order.</p>
        </div>
        <div class="card__body">
          <div class="amount" style="margin-top:4px">
            <div class="amount__label">To pay</div>
            <div class="amount__value">${money(order.amount)}</div>
            <div class="amount__sub">${tokens(order.amount)}</div>
          </div>

          <div class="transfer">
            <span class="transfer__end">
              <span class="transfer__avatar" style="background:var(--brand)">${mark("#fff", 24)}</span>
              <span class="transfer__label">Your Paymesh wallet</span>
            </span>
            <span class="transfer__arrow">${icons.chevronRight(20)}</span>
            <span class="transfer__end">
              <span class="transfer__avatar" style="background:${order.merchant.color};font-weight:700">
                ${esc(order.merchant.initial)}
              </span>
              <span class="transfer__label">${esc(order.merchant.name)}</span>
            </span>
          </div>

          <button class="btn btn--primary" data-action="authorize">Authorize transfer</button>
          <button class="link under-action" data-action="cancel">or cancel and go back to merchant</button>
        </div>
      </section>`,
    });
  },

  mount(root) {
    const btn = root.querySelector('[data-action="authorize"]');
    let timer = null;

    btn?.addEventListener("click", () => {
      if (isBusy(btn)) return;
      busy(btn, "Authorizing...");
      timer = setTimeout(transferAuthorized, AUTHORIZE_MS);
    });

    root.querySelector('[data-action="cancel"]')?.addEventListener("click", backToMerchant);

    return { destroy: () => clearTimeout(timer) };
  },
};
