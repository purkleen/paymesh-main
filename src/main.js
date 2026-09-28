/** Paymesh prototype — route table and boot. */

import { register, start, render } from "./router.js";
import { wireCommon } from "./ui.js";
import { subscribe, setScenario, getState } from "./store.js";
import { ACTIVE_SCENARIOS } from "./config.js";
import { mountDevPanel } from "./devpanel.js";

import merchant from "./screens/merchant.js";
import login from "./screens/login.js";
import otp from "./screens/otp.js";
import { accounts, confirm } from "./screens/google.js";
import { email as signupEmail, account as signupAccount, details as signupDetails } from "./screens/signup.js";
import ready from "./screens/ready.js";
import payment from "./screens/payment.js";
import addCard from "./screens/addcard.js";
import authorize from "./screens/authorize.js";
import success from "./screens/success.js";
import appHome from "./screens/app.js";
import { requirePassword } from "./screens/gate.js";
import menu from "./screens/menu.js";
import * as reg2 from "./screens/v2/register.js";
import * as pay2 from "./screens/v2/checkout.js";

register("#/menu", menu);
register("#/", merchant);
register("#/login", login);
register("#/otp", otp);
register("#/google/accounts", accounts);
register("#/google/confirm", confirm);
register("#/signup", signupEmail);
register("#/signup/account", signupAccount);
register("#/signup/details", signupDetails);
register("#/ready", ready);
register("#/payment", payment);
register("#/add-card", addCard);
register("#/authorize", authorize);
register("#/success", success);
register("#/app", appHome);

// Registration — new version (journey 9), built on the design system
register("#/v2/signup", reg2.signup);
register("#/v2/account", reg2.account);
register("#/v2/verify", reg2.verify);
register("#/v2/contact", reg2.contact);
register("#/v2/address", reg2.addressSearch);
register("#/v2/address/confirm", reg2.addressConfirm);
register("#/v2/identity", reg2.identity);
register("#/v2/welcome", pay2.welcome);
register("#/v2/add-card", pay2.addCardScreen);
register("#/v2/payment", pay2.payment);
register("#/v2/authorize", pay2.authorize);
register("#/v2/success", pay2.success);
register("#/404", {
  render: () => `
    <div class="page page--center">
      <div class="stack center">
        <h1 class="h1">Screen not found</h1>
        <p class="lede">That route isn't part of the prototype.</p>
        <p style="margin-top:20px"><a class="link" href="#/">Back to the merchant page</a></p>
      </div>
    </div>`,
});

// ?journey=5 (or ?journey=register) deep-links straight into one of the seven
// journeys, so a review link can open exactly the flow being discussed.
const requested = new URLSearchParams(location.search).get("journey");
if (requested) {
  const scenario = ACTIVE_SCENARIOS.find(
    (s) => s.id === requested || String(s.number) === requested
  );
  // A refresh mid-journey keeps its state; only a new journey or a bare link re-seeds.
  if (scenario && (scenario.id !== getState().scenarioId || !location.hash)) {
    setScenario(scenario.id);
    if (!location.hash) location.hash = scenario.fromMerchant ? "#/" : scenario.entry;
  }
}

const root = document.getElementById("root");
wireCommon(root);

// The password screen comes first; nothing else renders until it's passed.
await requirePassword(root);

const repaintDevPanel = mountDevPanel(document.getElementById("devbar"));
if (repaintDevPanel) subscribe(repaintDevPanel);

// A bare visit (no screen in the URL) opens the menu of prototypes.
start(root, "#/menu");

// Keyboard shortcut: R restarts the current journey from its first screen.
addEventListener("keydown", (e) => {
  if (e.key.toLowerCase() === "r" && (e.metaKey || e.ctrlKey) && e.shiftKey) {
    e.preventDefault();
    document.querySelector('[data-act="restart"]')?.click();
    render();
  }
});
