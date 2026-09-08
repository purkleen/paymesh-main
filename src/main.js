/** Paymesh prototype — route table and boot. */

import { register, start, render } from "./router.js";
import { wireCommon } from "./ui.js";
import { subscribe, setScenario } from "./store.js";
import { SCENARIOS } from "./config.js";
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
  const scenario = SCENARIOS.find(
    (s) => s.id === requested || String(s.number) === requested
  );
  if (scenario) {
    setScenario(scenario.id);
    if (!location.hash) location.hash = scenario.fromMerchant ? "#/" : scenario.entry;
  }
}

const root = document.getElementById("root");
wireCommon(root);

const repaintDevPanel = mountDevPanel(document.getElementById("devbar"));
if (repaintDevPanel) subscribe(repaintDevPanel);

start(root, "#/");

// Keyboard shortcut: R restarts the current journey from its first screen.
addEventListener("keydown", (e) => {
  if (e.key.toLowerCase() === "r" && (e.metaKey || e.ctrlKey) && e.shiftKey) {
    e.preventDefault();
    document.querySelector('[data-act="restart"]')?.click();
    render();
  }
});
