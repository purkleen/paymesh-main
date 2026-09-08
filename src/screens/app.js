/**
 * Paymesh app home.
 *
 * Where the "log in from the Paymesh website" journey ends. The source file
 * leaves this frame as a placeholder, so this is deliberately minimal: enough
 * to show the session landed somewhere real, no invented product surface.
 */

import { shell, money, tokens, esc } from "../ui.js";
import { getState } from "../store.js";
import { RETURNING_USER } from "../config.js";

const ACTIVITY = [
  { label: "Top-up from Visa •4567", amount: 1200.0 },
  { label: "Northwind Supplies", amount: -284.5 },
  { label: "Aurora Stays", amount: -1130.0 },
];

export default {
  render() {
    const { session, wallet } = getState();

    return shell({
      content: `
      <div class="app-home">
        <h1 class="h1" style="font-size:28px">Paymesh app</h1>
        <p class="lede">Welcome back, ${esc(session.firstName || RETURNING_USER.firstName)}.</p>

        <div class="balance-card">
          <div class="balance-card__label">Paymesh balance</div>
          <div class="balance-card__value">${money(wallet.balance)}</div>
          <div class="balance-card__sub">${tokens(wallet.balance)}</div>
        </div>

        <div class="activity">
          <h2 class="h3">Recent activity</h2>
          ${ACTIVITY.map(
            (a) => `
            <div class="activity__item">
              <span>${esc(a.label)}</span>
              <span>${a.amount < 0 ? "−" : "+"}${money(Math.abs(a.amount))}</span>
            </div>`
          ).join("")}
        </div>
      </div>`,
    });
  },
};
