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
  update("session", {
    email: account.email,
    name: account.name,
    firstName: account.name.split(" ")[0],
    lastName: account.name.split(" ").slice(1).join(" "),
    viaGoogle: true,
  });
  go(currentScenario().id === "register-v2" ? "#/v2/verify" : "#/otp");
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

/* --------------------------------------------------------------------------
   Registration — new version (journey 9, Figma page "Registration new version")
   sign up → create account → verify email → contact details → address
   → verify identity → welcome → add card → payment → complete order → done
   -------------------------------------------------------------------------- */

/** Session fields for a first and last name, plus the combined `name` other screens show. */
const names = (firstName, lastName) => ({ firstName, lastName, name: `${firstName} ${lastName}` });

export const v2 = {
  emailSubmitted(email) {
    update("session", { email });
    update("flow", { registering: true });
    go("#/v2/account");
  },

  accountCreated({ firstName, lastName }) {
    update("session", names(firstName, lastName));
    go("#/v2/verify");
  },

  codeVerified() {
    update("session", { verified: true, loggedIn: true });
    go("#/v2/contact");
  },

  contactSubmitted({ phone, country }) {
    update("session", { phone, country });
    go("#/v2/address");
  },

  /** A lookup result was picked — confirm it on the address form. */
  addressFound(address) {
    update("flow", { draft: { ...getState().flow.draft, address } });
    go("#/v2/address/confirm");
  },

  addressManual() {
    update("flow", { draft: { ...getState().flow.draft, address: null } });
    go("#/v2/address/confirm");
  },

  addressConfirmed(address) {
    update("wallet", { address });
    go("#/v2/identity");
  },

  identityVerified() {
    update("wallet", { registered: true });
    update("flow", { registering: false });
    go("#/v2/welcome");
  },

  /** A brand-new wallet has no card yet, so it is added before the payment sheet. */
  continueToPayment() {
    go(getState().wallet.cards.length ? "#/v2/payment" : "#/v2/add-card");
  },

  addCardRequested() {
    go("#/v2/add-card");
  },

  cardAdded() {
    go("#/v2/payment");
  },

  paymentConfirmed() {
    go("#/v2/authorize");
  },

  transferAuthorized() {
    const id = Array.from({ length: 24 }, () => Math.floor(Math.random() * 10)).join("");
    update("flow", { receipt: { id, at: Date.now() } });
    go("#/v2/success");
  },
};
