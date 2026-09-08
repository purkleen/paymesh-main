/**
 * Journey transitions.
 *
 * Screens never decide where they go next — they call one of these, and the
 * active scenario decides. That keeps the seven Figma journeys in one place.
 */

import { getState, update, currentScenario } from "./store.js";
import { go } from "./router.js";

/** The merchant hands the buyer over to Paymesh. */
export function handOffToPaymesh() {
  const scenario = currentScenario();
  const { session } = getState();
  if (session.loggedIn) go("#/payment");
  else go(scenario.entry);
}

/** Email + password accepted on the log-in screen. */
export function loginSubmitted(email) {
  update("session", { email });
  go("#/otp");
}

/** "Sign up / log in with Google" pressed anywhere. */
export function googleRequested() {
  go("#/google/accounts");
}

export function googleAccountChosen() {
  go("#/google/confirm");
}

export function googleConfirmed(account) {
  update("session", { email: account.email, name: account.name, viaGoogle: true });
  go("#/otp");
}

/** Sign-up screen: the buyer submitted an email we don't recognise. */
export function signupEmailSubmitted(email) {
  const { flow } = getState();
  update("session", { email });
  update("flow", { registering: true });
  if (flow.useGoogle) googleRequested();
  else go("#/signup/account");
}

/** Name + password captured. */
export function accountCreated({ name }) {
  update("session", { name, firstName: name.split(" ")[0] || name });
  go("#/otp");
}

/** The one-time code was accepted. */
export function codeVerified() {
  const state = getState();
  update("session", { verified: true, loggedIn: true });

  if (state.flow.registering) return go("#/signup/details");
  if (!state.flow.fromMerchant) return go("#/app");
  return go("#/payment");
}

/** Personal details submitted at the end of registration. */
export function detailsSubmitted(details) {
  update("wallet", { registered: true, address: details.address });
  update("session", { name: details.name, firstName: details.name.split(" ")[0] || details.name });
  update("flow", { registering: false });
  go("#/ready");
}

export function continueToPayment() {
  go("#/payment");
}

export function addCardRequested() {
  go("#/add-card");
}

export function cardAdded() {
  go("#/payment");
}

/** The payment sheet finished its authorization step. */
export function paymentAuthorized() {
  go("#/authorize");
}

export function transferAuthorized() {
  go("#/success");
}

/** "Cancel and go back to <merchant>" on every Paymesh screen. */
export function backToMerchant() {
  go("#/");
}
