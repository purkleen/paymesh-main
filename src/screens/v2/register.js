/**
 * Registration — new version, account and identity steps.
 * Built from the Figma page "Registration new version" with the design-system
 * components in src/ds.js.
 *
 *   #/v2/signup           → Sign up                          (registration-02)
 *   #/v2/account          → Create account                   (registration-18)
 *   #/v2/verify           → Enter the 6-digit code           (registration-14)
 *   #/v2/contact          → Your details: name and phone     (registration-13)
 *   #/v2/address          → Search for address               (registration-13)
 *   #/v2/address/confirm  → Your details: the address        (registration-06)
 *   #/v2/identity         → Verify identity                  (registration-16)
 */

import {
  page,
  header,
  button,
  backLink,
  input,
  phoneInput,
  nameInputs,
  checkNames,
  otp,
  asset,
  icon,
  busy,
  isBusy,
  wirePage,
} from "../../ds.js";
import {
  esc,
  values,
  isEmail,
  showError,
  clearError,
  formAlert,
  showFormError,
  clearFormError,
  MISSING_FIELDS,
  wireCountryFields,
  wireAddressLookup,
  isValidPhone,
  phoneHint,
  postcodeTerm,
  startResendCountdown,
  wireOtpInputs,
} from "../../ui.js";
import { getState } from "../../store.js";
import { v2, googleRequested, backToMerchant } from "../../flow.js";
import { RESEND_SECONDS, RESEND_AGAIN_SECONDS, ACCOUNT_MS, IDENTITY_MS } from "../../config.js";

/** Primary button with its error status underneath. */
const action = (label, name) => `
  <div class="ds-stack ds-stack--8">
    ${button(label, { action: name })}
    ${formAlert()}
  </div>`;



/**
 * Enter in any text field presses the screen's primary button. Bound to this
 * screen's page element, not the router's persistent root, so the handler
 * goes away with the screen.
 */
const submitOnEnter = (root, submit) =>
  root.querySelector(".ds-page").addEventListener("keydown", (e) => {
    if (e.key === "Enter" && e.target.matches("input:not([data-otp]):not([role='combobox'])")) submit();
  });

const capitalise = (s) => s.charAt(0).toUpperCase() + s.slice(1);

/* -------------------------------------------------------------------------
   Sign up
   ------------------------------------------------------------------------- */

export const signup = {
  render() {
    const { session } = getState();
    return page({
      content: `
      <div class="ds-stack ds-stack--32">
        <div class="ds-stack ds-stack--16">
          <h1 class="ds-h1">Sign up</h1>
          <p class="ds-body">
            Already have an account?
            <button class="ds-link" data-action="login">Log back in &rarr;</button>
          </p>
        </div>
        <div class="ds-stack ds-stack--24">
          ${input({
            label: "Email address",
            name: "email",
            type: "email",
            value: session.email,
            autocomplete: "email",
            autofocus: true,
          })}
          ${action("Create account", "create")}
          <div class="ds-or">or</div>
          <div class="ds-stack ds-stack--16 ds-social">
            ${button("Sign up with Google", { action: "google", variant: "secondary", iconName: "google" })}
            ${button("Sign up with Apple", { action: "apple", variant: "secondary", iconName: "apple" })}
          </div>
          <p class="ds-body ds-center">
            Need help? <a class="ds-link" href="#" data-noop>Contact us</a>
          </p>
        </div>
      </div>`,
    });
  },

  mount(root) {
    wirePage(root, backToMerchant);

    const submit = () => {
      const { email } = values(root);
      clearError(root, "email");
      clearFormError(root);
      if (!isEmail(email)) {
        showError(root, "email", "Enter a valid email address.");
        return showFormError(root, "Enter the email address you want to sign up with.");
      }
      v2.emailSubmitted(email);
    };

    root.querySelector('[data-action="create"]').addEventListener("click", submit);
    submitOnEnter(root, submit);

    root.querySelector('[data-action="google"]').addEventListener("click", googleRequested);
    root.querySelector('[data-action="apple"]').addEventListener("click", () =>
      showFormError(root, "Sign up with Apple isn't part of this prototype — use your email or Google.")
    );

    // The log-in journeys are switched off for now (see DISABLED_SCENARIOS in config.js).
    root.querySelector('[data-action="login"]').addEventListener("click", () =>
      showFormError(root, "Logging back in isn't part of this prototype yet — sign up to continue.")
    );
  },
};

/* -------------------------------------------------------------------------
   Create account — full name and password
   ------------------------------------------------------------------------- */

export const account = {
  render() {
    const { session } = getState();
    return page({
      content: `
      <div class="ds-stack ds-stack--24">
        <div class="ds-stack ds-stack--24">
          <div class="ds-stack ds-stack--16">
            ${header(
              "Create account",
              `After creating an account we will send you a verification code to
               <strong>${esc(session.email || "your email")}</strong> to confirm your email address.`
            )}
            ${nameInputs(session, { required: false, autofocus: true })}
            ${input({
              label: "Password",
              name: "password",
              type: "password",
              autocomplete: "new-password",
              trailing: "eye",
            })}
          </div>
          ${action("Continue to email verification", "create")}
        </div>
      </div>`,
    });
  },

  mount(root) {
    wirePage(root, backToMerchant);
    const btn = root.querySelector('[data-action="create"]');
    let timer = null;

    const submit = () => {
      if (isBusy(btn)) return;
      const v = values(root);
      let ok = true;
      clearError(root, "password");
      clearFormError(root);

      if (!checkNames(root, v)) ok = false;
      if (v.password.length < 8) {
        showError(root, "password", "Use at least 8 characters.");
        ok = false;
      }
      if (!ok) return showFormError(root, MISSING_FIELDS);

      busy(btn, "Continue to email verification");
      timer = setTimeout(() => v2.accountCreated({ firstName: v.firstName, lastName: v.lastName }), ACCOUNT_MS);
    };

    btn.addEventListener("click", submit);
    submitOnEnter(root, submit);
    return { destroy: () => clearTimeout(timer) };
  },
};

/* -------------------------------------------------------------------------
   Enter the 6-digit code we sent you
   ------------------------------------------------------------------------- */

export const verify = {
  render() {
    const { session } = getState();
    return page({
      content: `
      <div class="ds-stack ds-stack--24">
        <div class="ds-stack ds-stack--24">
          <div class="ds-stack ds-stack--16">
            ${header(
              "Enter the 6-digit code we sent you",
              `We sent the code to <strong>${esc(session.email || "your email")}</strong>. This helps us
               keep your account secure by verifying that it's really you.`
            )}
            <div style="padding-top:var(--spacing-16)">${otp()}</div>
            <p class="ds-small ds-center" data-resend></p>
          </div>
          ${action("Verify your email", "verify")}
        </div>
      </div>`,
    });
  },

  mount(root) {
    wirePage(root, backToMerchant);
    const group = root.querySelector("[data-otp-group]");
    const inputs = [...root.querySelectorAll("[data-otp]")];
    const stopCountdown = startResendCountdown(root.querySelector("[data-resend]"), RESEND_SECONDS, {
      resendSeconds: RESEND_AGAIN_SECONDS,
    });
    // Six digits don't move the page on — the buyer presses "Verify your email".
    const code = wireOtpInputs(root, submit, { autoSubmit: false });

    // Any six digits are accepted — this is a prototype, not a real check.
    function submit() {
      const entered = code();
      if (entered.length < 6) {
        group.dataset.invalid = "true";
        showFormError(root, "Enter all six digits of the code we sent you.");
        inputs[entered.length].focus();
        return;
      }
      stopCountdown();
      v2.codeVerified();
    }

    root.querySelector('[data-action="verify"]').addEventListener("click", submit);
    return { destroy: stopCountdown };
  },
};

/* -------------------------------------------------------------------------
   Your phone number
   ------------------------------------------------------------------------- */

export const contact = {
  render() {
    const { session } = getState();
    return page({
      content: `
      <div class="ds-stack ds-stack--24">
        <div class="ds-stack ds-stack--24">
          <div class="ds-stack ds-stack--16">
            ${header("Your phone number")}
            ${phoneInput({ value: session.phone || "", country: session.country })}
          </div>
          ${action("Continue to address", "continue")}
        </div>
      </div>`,
    });
  },

  mount(root) {
    wirePage(root, backToMerchant);
    wireCountryFields(root);
    root.querySelector("#f-phone").focus();

    const submit = () => {
      const v = values(root);
      clearError(root, "phone");
      clearFormError(root);

      if (!isValidPhone(v.phone, v.dial)) {
        showError(root, "phone", phoneHint(v.dial));
        return showFormError(root, MISSING_FIELDS);
      }
      v2.contactSubmitted({ phone: v.phone, country: v.dial });
    };

    root.querySelector('[data-action="continue"]').addEventListener("click", submit);
    submitOnEnter(root, submit);
  },
};

/* -------------------------------------------------------------------------
   Search for address
   ------------------------------------------------------------------------- */

export const addressSearch = {
  render() {
    return page({
      content: `
      <div class="ds-stack ds-stack--24">
        <div class="ds-stack ds-stack--16">
          ${header("Search for address", "Start typing postcode, city, or street name to find your address.")}
          <div class="ds-field" data-field="search" style="padding-top:var(--spacing-16)">
            <div class="ds-combo">
              <div class="ds-input">
                ${icon("search")}
                <input id="f-search" name="search" type="text" autocomplete="off" spellcheck="false"
                       aria-label="Search for your address" data-autofocus
                       role="combobox" aria-expanded="false" aria-autocomplete="list"
                       aria-controls="address-results" />
              </div>
              <ul class="ds-combo__list" id="address-results" role="listbox"
                  aria-label="Matching addresses" hidden></ul>
            </div>
            <p class="field__error" hidden></p>
          </div>
        </div>
        <button class="ds-btn ds-btn--link" data-action="manual">Find address manually</button>
        ${backLink("Back to phone number", "#/v2/contact")}
      </div>`,
    });
  },

  mount(root) {
    wirePage(root, backToMerchant);
    const country = () => getState().session.country;

    wireAddressLookup(root, (address) => v2.addressFound(address), {
      input: "#f-search",
      country,
      postcodeOnly: false,
    });

    root.querySelector('[data-action="manual"]').addEventListener("click", v2.addressManual);

    // Enter before picking a result points at the list rather than failing silently.
    root.querySelector("#f-search").addEventListener("keydown", (e) => {
      if (e.key !== "Enter" || root.querySelector("#address-results").hidden === false) return;
      showError(root, "search", "Type at least two characters, then pick your address from the list.");
    });
  },
};

/* -------------------------------------------------------------------------
   Your details — the address, filled from the lookup or typed in
   ------------------------------------------------------------------------- */

export const addressConfirm = {
  render() {
    const { flow, wallet, session } = getState();
    const a = flow.draft.address || wallet.address || {};
    const term = postcodeTerm(session.country);

    return page({
      content: `
      <div class="ds-stack ds-stack--24">
        <div class="ds-stack ds-stack--24">
          <div class="ds-stack ds-stack--16">
            ${header("Your details")}
            ${input({ label: "Street address", name: "street", value: a.line1 || "", required: true, trailing: "close", autocomplete: "address-line1", autofocus: !a.line1 })}
            ${input({
              label: "Building, apartment, floor, suite, unit office, etc.",
              name: "street2",
              value: a.line2 || "",
              optional: true,
              trailing: "close",
              autocomplete: "address-line2",
            })}
            ${input({ label: "City", name: "city", value: a.city || "", required: true, trailing: "close", autocomplete: "address-level2" })}
            ${input({ label: capitalise(term), name: "postcode", value: a.postcode || "", required: true, trailing: "close", autocomplete: "postal-code" })}
            ${input({ label: "County", name: "county", value: a.state || "", optional: true, trailing: "close", autocomplete: "address-level1" })}
          </div>
          ${action("Continue to ID verification", "continue")}
        </div>
        ${backLink("Back to phone number", "#/v2/contact")}
      </div>`,
    });
  },

  mount(root) {
    wirePage(root, backToMerchant);
    const term = postcodeTerm(getState().session.country);

    const submit = () => {
      const v = values(root);
      const required = { street: "Enter your street address.", city: "Enter your city.", postcode: `Enter your ${term}.` };
      let ok = true;
      Object.keys(required).forEach((n) => clearError(root, n));
      clearFormError(root);
      Object.entries(required).forEach(([n, message]) => {
        if (!v[n]) {
          showError(root, n, message);
          ok = false;
        }
      });
      if (!ok) return showFormError(root, MISSING_FIELDS);

      v2.addressConfirmed({
        line1: v.street,
        line2: v.street2,
        city: v.city,
        postcode: v.postcode.toUpperCase(),
        state: v.county,
        country: getState().session.country,
      });
    };

    root.querySelector('[data-action="continue"]').addEventListener("click", submit);
    submitOnEnter(root, submit);
  },
};

/* -------------------------------------------------------------------------
   Verify identity — hand-off to Persona, simulated
   ------------------------------------------------------------------------- */

export const identity = {
  render() {
    return page({
      center: true,
      content: `
      <div class="ds-stack ds-stack--16 ds-stack--center">
        <img class="ds-art" src="${asset("id-card.png")}" alt="" />
        <div class="ds-stack ds-stack--48 ds-stack--center" style="align-self:stretch">
          <div class="ds-stack ds-stack--24" style="align-self:stretch">
            ${header(
              "Verify identity",
              "We need a few details to verify your identity with our trusted verification partner, Persona."
            )}
            ${action("Start verification", "start")}
          </div>
          <img src="${asset("persona.svg")}" width="95" height="24" alt="Persona" />
        </div>
      </div>`,
    });
  },

  mount(root) {
    wirePage(root, backToMerchant);
    const btn = root.querySelector('[data-action="start"]');
    let timer = null;

    btn.addEventListener("click", () => {
      if (isBusy(btn)) return;
      busy(btn, "Verifying with Persona…");
      timer = setTimeout(v2.identityVerified, IDENTITY_MS);
    });

    return { destroy: () => clearTimeout(timer) };
  },
};
