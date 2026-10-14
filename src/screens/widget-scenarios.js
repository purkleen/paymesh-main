/**
 * Payment widget scenarios (widget-scenarios.html) — "Work in progress" file,
 * node 499:3741.
 *
 * The same widget as widget-new.html, with the one saved card the Figma frame
 * shows (Visa ending in 9876). The frame has three scenarios, one per row, and
 * three states of the widget in each row; both can be picked with the buttons
 * beside the widget (or ?scenario=1|2|3&state=a|b|c). Each state only sets
 * where the widget starts — from there it's fully interactive.
 */

import { esc } from "../ui.js";
import { create, SCENARIOS } from "./widget-new.js";

const VISA = { id: "visa-9876", scheme: "visa", label: "Visa ending in 9876", expiry: "Expiry 06/2027" };

/** The three frames of each row in the Figma section, left to right. */
const STATES = {
  1: [
    { id: "a", label: "Collapsed", preset: {} },
    { id: "b", label: "Paymesh balance", preset: { open: true, choice: "balance" } },
    { id: "c", label: "Visa card", preset: { open: true, choice: VISA.id } },
  ],
  2: [
    { id: "a", label: "Collapsed", preset: {} },
    { id: "b", label: "Whole amount on card", preset: { open: true, useBalance: false } },
    { id: "c", label: "Balance + card", preset: { open: true, useBalance: true } },
  ],
  3: [
    { id: "a", label: "Collapsed", preset: {} },
    { id: "b", label: "Methods open", preset: { open: true, choice: "balance" } },
    // Split payment starts at 50/50, as it does when the switch is turned on.
    { id: "c", label: "Split payment on", preset: { open: true, split: true, useBalance: true, cardId: VISA.id, fromBalance: 3500, fromCard: 3500 } },
  ],
};

const NOTES = {
  1: "Paymesh balance is enough to cover the amount to pay, but the buyer can switch to card payment. Only one option: either the Paymesh balance, or a saved or new card.",
  2: "Paymesh balance is not enough to cover the amount to pay. The buyer can pay the whole amount by card, or (the default) split it between the Paymesh balance and a card.",
  3: "Alternative UI — split payment. The balance covers the amount to pay, but the buyer only wants to spend some of it and top up with a card.",
};

const fromUrl = () => {
  const q = new URLSearchParams(location.search);
  const scenario = SCENARIOS.find((s) => s.id === Number(q.get("scenario"))) || SCENARIOS[0];
  const state = STATES[scenario.id].find((s) => s.id === q.get("state")) || STATES[scenario.id][0];
  return { scenario, state };
};

const page = {
  render() {
    const { scenario, state } = fromUrl();
    this.widget = create(scenario, { cards: [VISA], preset: state.preset });
    return `
    <main class="sw-stage">
      <div class="sw-wrap nw-wrap">
        <div class="sw-random ws-switcher">
          <div class="ws-group" role="group" aria-label="Scenario">
            <span class="ws-group__label">Scenario</span>
            ${SCENARIOS.map(
              (s) =>
                `<button type="button" class="sw-random__btn" data-scenario="${s.id}" aria-pressed="${s.id === scenario.id}">${s.id}. ${esc(s.label)}</button>`
            ).join("")}
          </div>
          <div class="ws-group" role="group" aria-label="State">
            <span class="ws-group__label">State</span>
            ${STATES[scenario.id]
              .map(
                (s) =>
                  `<button type="button" class="sw-random__btn" data-state="${s.id}" aria-pressed="${s.id === state.id}">${s.id.toUpperCase()}. ${esc(s.label)}</button>`
              )
              .join("")}
          </div>
          <p class="ws-note">${esc(NOTES[scenario.id])}</p>
        </div>
        ${this.widget.markup()}
      </div>
    </main>`;
  },

  mount(root) {
    this.widget.mount(root);
    root.querySelector(".ws-switcher").addEventListener("click", (e) => {
      const btn = e.target.closest("[data-scenario], [data-state]");
      if (!btn) return;
      const q = new URLSearchParams(location.search);
      if (btn.dataset.scenario) {
        q.set("scenario", btn.dataset.scenario);
        q.delete("state");
      } else {
        q.set("scenario", fromUrl().scenario.id);
        q.set("state", btn.dataset.state);
      }
      history.replaceState(null, "", `?${q}`);
      root.innerHTML = page.render();
      page.mount(root);
    });
  },
};

export default page;
