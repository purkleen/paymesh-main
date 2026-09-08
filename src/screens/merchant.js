/**
 * Demo merchant checkout — the page the buyer starts from.
 *
 * The Figma source uses a real retailer's checkout as the backdrop; this is a
 * neutral stand-in with the same structure so the hand-off reads the same.
 */

import { MERCHANT, ORDER, SCENARIOS } from "../config.js";
import { getState, setScenario } from "../store.js";
import { money, esc } from "../ui.js";
import { mark, icons, appleLogo, schemes } from "../icons.js";
import { handOffToPaymesh } from "../flow.js";
import { render as rerender } from "../router.js";

const OTHER_METHODS = [
  { id: "visa", logo: schemes.visa(), title: "x-4440" },
  { id: "gpay", logo: `<span style="font-weight:700;font-size:11px">G&nbsp;Pay</span>`, title: "Google Pay" },
  { id: "apple", logo: appleLogo(15), title: "Apple Pay" },
  { id: "card", logo: schemes.mastercard(), title: "Add new card" },
  {
    id: "instalments",
    logo: `<span style="font-size:10px;font-weight:700">Later</span>`,
    title: "Pay in 3 instalments",
    sub: "Interest-free, credit options available",
  },
];

export default {
  render() {
    const { scenarioId } = getState();

    return `
    <div class="shop">
      <div class="shop__bar">
        <div class="shop__bar-in">
          <span class="shop__brand">
            <span class="shop__mark" style="background:${MERCHANT.color}">${MERCHANT.initial}</span>
            ${esc(MERCHANT.name)} Checkout
          </span>
          <span class="small muted">Secure checkout</span>
        </div>
      </div>

      <div class="shop__promo">
        ${icons.lock(16)}
        <span><strong>Pay by Bank.</strong> Card-free payments with bank-grade security.</span>
      </div>

      <div class="shop__grid">
        <div>
          <h1 class="h2">Pay with</h1>
          <div class="pay-list" role="radiogroup" aria-label="Payment method">
            ${OTHER_METHODS.map(
              (m) => `
              <button class="pay-option" role="radio" aria-checked="false" data-method="${m.id}">
                <span class="pay-option__radio"></span>
                <span class="pay-option__logo">${m.logo}</span>
                <span class="pay-option__main">
                  <span class="pay-option__title">${esc(m.title)}</span>
                  ${m.sub ? `<span class="pay-option__sub">${esc(m.sub)}</span>` : ""}
                </span>
              </button>`
            ).join("")}

            <button class="pay-option" role="radio" aria-checked="true" data-method="paymesh">
              <span class="pay-option__radio"></span>
              <span class="pay-option__logo">${mark("var(--ink-logo)", 26)}</span>
              <span class="pay-option__main">
                <span class="pay-option__title">Paymesh</span>
                <span class="pay-option__sub">Pay from any linked account in one tap.</span>
              </span>
            </button>
          </div>
        </div>

        <aside>
          <div class="summary">
            <h2 class="h3">Order summary</h2>
            <div class="summary__row"><span>Items (${ORDER.itemCount})</span><span>${money(ORDER.subtotal)}</span></div>
            <div class="summary__row"><span>Postage</span><span>${money(ORDER.postage)}</span></div>
            <div class="summary__total"><span>Order total</span><span>${money(ORDER.total)}</span></div>
            <p class="summary__fine">
              By confirming and paying you agree to our User Agreement and acknowledge
              reading our Privacy Notice.
            </p>
            <p class="summary__handoff">You'll finish checkout on Paymesh</p>
            <button class="btn btn--primary" data-action="pay-with-paymesh">Pay with Paymesh</button>
          </div>

          <div style="margin-top:24px">
            <p class="small muted" style="margin:0 0 8px">Prototype journey</p>
            <div class="select-wrap">
              <select class="input" id="scenario-select" aria-label="Choose a prototype journey">
                ${SCENARIOS.map(
                  (s) =>
                    `<option value="${s.id}" ${s.id === scenarioId ? "selected" : ""}>${s.number}. ${esc(s.title)}</option>`
                ).join("")}
              </select>
            </div>
            <p class="small muted" style="margin-top:8px">
              ${esc(SCENARIOS.find((s) => s.id === scenarioId)?.blurb || "")}
            </p>
          </div>
        </aside>
      </div>
    </div>`;
  },

  mount(root) {
    root.querySelectorAll("[data-method]").forEach((btn) => {
      btn.addEventListener("click", () => {
        root.querySelectorAll("[data-method]").forEach((b) => b.setAttribute("aria-checked", "false"));
        btn.setAttribute("aria-checked", "true");
      });
    });

    root.querySelector("#scenario-select").addEventListener("change", (e) => {
      setScenario(e.target.value);
      rerender();
    });

    root.querySelector('[data-action="pay-with-paymesh"]').addEventListener("click", () => {
      const selected = root.querySelector('[data-method][aria-checked="true"]');
      if (!selected || selected.dataset.method !== "paymesh") {
        selected?.animate(
          [{ transform: "translateX(0)" }, { transform: "translateX(-4px)" }, { transform: "translateX(4px)" }, { transform: "translateX(0)" }],
          { duration: 220 }
        );
        return;
      }
      handOffToPaymesh();
    });
  },
};
