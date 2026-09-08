/**
 * "Your Paymesh account is ready!" — the bridge between registration and the
 * pending payment the buyer arrived with.
 */

import { shellRaw, money, tokens, esc } from "../ui.js";
import { getState } from "../store.js";
import { continueToPayment, backToMerchant } from "../flow.js";

export default {
  render() {
    const { order, session } = getState();

    return shellRaw({
      content: `
      <div class="result" style="width:425px;max-width:100%">
        <img class="result__art" src="assets/check-3d.png" alt="" width="240" height="240" />
        <h1 class="result__title">Your Paymesh account is ready!</h1>
        <p class="result__body">
          Welcome, ${esc(session.firstName || "there")}! You can continue with the payment
          using your Paymesh account.
        </p>

        ${
          order
            ? `<section class="card" style="text-align:left;margin-bottom:24px">
                 <div class="card__head"><h2>Pending payment</h2></div>
                 <div class="card__body">
                   <div class="merchant">
                     <span class="merchant__logo" style="background:${order.merchant.color}">
                       ${esc(order.merchant.initial)}
                     </span>
                     <span class="merchant__name">${esc(order.merchant.name)}</span>
                   </div>
                   <div class="amount" style="margin-bottom:4px">
                     <div class="amount__value">${money(order.amount)}</div>
                     <div class="amount__sub">${tokens(order.amount)}</div>
                   </div>
                 </div>
               </section>`
            : ""
        }

        <button class="btn btn--primary" data-action="continue">Continue with payment</button>
        <button class="link under-action" data-action="cancel">
          or cancel and go back to ${esc(order ? order.merchant.name : "the merchant")}
        </button>
      </div>`,
    });
  },

  mount(root) {
    root.querySelector('[data-action="continue"]').addEventListener("click", continueToPayment);
    root.querySelector('[data-action="cancel"]').addEventListener("click", backToMerchant);
  },
};
