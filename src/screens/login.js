/**
 * Log in to Paymesh.
 *
 * Two presentations of the same form: the split layout used when the buyer
 * arrives from the Paymesh website, and the centred layout used when a
 * merchant hands them over mid-checkout.
 */

import { logo } from "../icons.js";
import {
  shell,
  field,
  passwordField,
  socialButtons,
  helpLine,
  legalFooter,
  wirePasswordFields,
  values,
  isEmail,
  showError,
  clearError,
  formAlert,
  showFormError,
  clearFormError,
  MISSING_FIELDS,
} from "../ui.js";
import { getState } from "../store.js";
import { loginSubmitted, googleRequested } from "../flow.js";
import { RETURNING_USER } from "../config.js";

function form(prefill) {
  return `
    <h1 class="h1">Log in to Paymesh</h1>
    <p class="lede" style="margin-bottom:26px">
      Don't have an account?
      <a class="link" href="#/signup">Create new account.</a> &rarr;
    </p>

    ${field({
      label: "Email address",
      name: "email",
      type: "email",
      value: prefill,
      autocomplete: "email",
      autofocus: true,
    })}
    ${passwordField({ label: "Password", name: "password" })}

    <p style="margin:14px 0 22px">
      <a class="link" href="#" data-noop>I forgot my password</a>
    </p>

    <button class="btn btn--primary" data-action="login">Log in</button>
    ${formAlert()}
    ${socialButtons("Sign up")}
    ${helpLine()}`;
}

export default {
  render() {
    const { flow } = getState();
    const prefill = RETURNING_USER.email;

    if (!flow.fromMerchant) {
      return `
      <div class="split">
        <div class="split__left">
          <header class="page__header"><span class="logo">${logo()}</span></header>
          <div class="split__content"><div class="stack">${form(prefill)}</div></div>
          ${legalFooter()}
        </div>
        <div class="split__art" role="presentation"></div>
      </div>`;
    }

    return shell({ content: form(prefill) });
  },

  mount(root) {
    wirePasswordFields(root);

    const submit = () => {
      const v = values(root);
      let ok = true;

      clearError(root, "email");
      clearError(root, "password");
      clearFormError(root);

      if (!isEmail(v.email)) {
        showError(root, "email", "Enter a valid email address.");
        ok = false;
      }
      if (!v.password) {
        showError(root, "password", "Enter your password.");
        ok = false;
      }
      if (!ok) return showFormError(root, MISSING_FIELDS);
      loginSubmitted(v.email);
    };

    root.querySelector('[data-action="login"]').addEventListener("click", submit);
    root.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && e.target.matches("input")) submit();
    });

    root.querySelectorAll("[data-social]").forEach((btn) =>
      btn.addEventListener("click", () => {
        // Only the Google route is designed in the source file.
        if (btn.dataset.social === "google") googleRequested();
      })
    );
  },
};
