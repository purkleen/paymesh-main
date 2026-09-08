/**
 * Prototype control panel — jump between the seven journeys without walking
 * back through the merchant page. Hidden entirely with ?dev=0.
 */

import { SCENARIOS } from "./config.js";
import { getState, setScenario, resetScenario, currentScenario } from "./store.js";
import { go } from "./router.js";
import { esc } from "./ui.js";

const STORAGE_KEY = "paymesh.dev.open";

export function mountDevPanel(host) {
  if (new URLSearchParams(location.search).get("dev") === "0") {
    host.remove();
    return;
  }

  let open = sessionStorage.getItem(STORAGE_KEY) === "1";

  const paint = () => {
    const { scenarioId } = getState();
    host.className = "dev";
    host.innerHTML = `
      <div class="dev__panel" ${open ? "" : "hidden"}>
        <p class="dev__title">Journeys</p>
        ${SCENARIOS.map(
          (s) => `
          <button class="dev__item" data-scenario="${s.id}" aria-current="${s.id === scenarioId}">
            <span class="dev__num">${s.number}.</span>${esc(s.title)}
          </button>`
        ).join("")}
        <div class="dev__foot">
          <button data-act="restart">Restart journey</button>
          <button data-act="merchant">Merchant page</button>
        </div>
      </div>
      <button class="dev__toggle" data-act="toggle" aria-expanded="${open}">
        <span class="dev__dot"></span>
        Journey ${currentScenario().number} of ${SCENARIOS.length}
      </button>`;
  };

  host.addEventListener("click", (e) => {
    const scenarioBtn = e.target.closest("[data-scenario]");
    if (scenarioBtn) {
      const scenario = SCENARIOS.find((s) => s.id === scenarioBtn.dataset.scenario);
      setScenario(scenario.id);
      go(scenario.fromMerchant ? "#/" : scenario.entry);
      paint();
      return;
    }

    const act = e.target.closest("[data-act]")?.dataset.act;
    if (act === "toggle") {
      open = !open;
      sessionStorage.setItem(STORAGE_KEY, open ? "1" : "0");
      paint();
    } else if (act === "restart") {
      const scenario = currentScenario();
      resetScenario();
      go(scenario.fromMerchant ? "#/" : scenario.entry);
      paint();
    } else if (act === "merchant") {
      go("#/");
    }
  });

  paint();
  return paint;
}
