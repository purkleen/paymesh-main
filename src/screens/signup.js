/**
 * Registration.
 *
 *   #/signup          → email address
 *   #/signup/account  → full name + password  (step 1 of the stepper)
 *   #/signup/details  → personal details      (step 3)
 */

import {
  shell,
  signupFooter,
  field,
  passwordField,
  socialButtons,
  helpLine,
  countryField,
  phoneField,
  cancelLink,
  wirePasswordFields,
  values,
  isEmail,
  showError,
  clearError,
  scorePassword,
} from "../ui.js";
import { stepper } from "./_stepper.js";
import { getState, update } from "../store.js";
import { render as rerender } from "../router.js";
import {
  signupEmailSubmitted,
  googleRequested,
  accountCreated,
  detailsSubmitted,
  backToMerchant,
} from "../flow.js";

/* -------------------------------------------------------------------------
   Step 0 — email address
   ------------------------------------------------------------------------- */

export const email = {
  render() {
    const { session } = getState();
    return shell({
      footer: signupFooter(),
      content: `
      <h1 class="h1">Sign up</h1>
      <p class="lede" style="margin-bottom:26px">
        Already have an account? <a class="link" href="#/login">Log back in</a> &rarr;
      </p>
      ${field({
        label: "Email address",
        name: "email",
        type: "email",
        value: session.email,
        autocomplete: "email",
        autofocus: true,
      })}
      <div style="height:22px"></div>
      <button class="btn btn--primary" data-action="create">Create account</button>
      ${socialButtons("Sign up")}
      ${helpLine()}`,
    });
  },

  mount(root) {
    const submit = () => {
      const v = values(root);
      clearError(root, "email");
      if (!isEmail(v.email)) return showError(root, "email", "Enter a valid email address.");
      signupEmailSubmitted(v.email);
    };

    root.querySelector('[data-action="create"]').addEventListener("click", submit);
    root.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && e.target.matches("input")) submit();
    });
    root.querySelectorAll("[data-social]").forEach((btn) =>
      btn.addEventListener("click", () => {
        if (btn.dataset.social === "google") googleRequested();
      })
    );
  },
};

/* -------------------------------------------------------------------------
   Step 1 — name and password
   ------------------------------------------------------------------------- */

export const account = {
  render() {
    return shell({
      center: true,
      content: `
      ${stepper(0)}
      <h1 class="h1" style="font-size:24px">Create account</h1>
      <p class="lede" style="margin-bottom:22px">
        An explanation why we need personal details will be added here.
      </p>
      ${field({ label: "Full name", name: "name", required: true, autocomplete: "name", autofocus: true })}
      ${passwordField({ label: "Password", name: "password", required: true, strength: true })}
      <div style="height:26px"></div>
      <button class="btn btn--primary" data-action="create">Create account</button>
      ${cancelLink("Cancel and go back to merchant", "cancel")}`,
    });
  },

  mount(root) {
    wirePasswordFields(root);

    const submit = () => {
      const v = values(root);
      let ok = true;
      clearError(root, "name");
      clearError(root, "password");

      if (!v.name || v.name.trim().split(/\s+/).length < 2) {
        showError(root, "name", "Enter your first and last name.");
        ok = false;
      }
      if (scorePassword(v.password) < 2) {
        showError(root, "password", "Use at least 8 characters with a number or symbol.");
        ok = false;
      }
      if (ok) accountCreated({ name: v.name });
    };

    root.querySelector('[data-action="create"]').addEventListener("click", submit);
    root.querySelector('[data-action="cancel"]').addEventListener("click", backToMerchant);
    root.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && e.target.matches("input")) submit();
    });
  },
};

/* -------------------------------------------------------------------------
   Step 2 — personal details, with the address lookup expanding to a manual form
   ------------------------------------------------------------------------- */

export const details = {
  render() {
    const { session, flow } = getState();
    const manual = Boolean(flow.draft.manualAddress);

    return shell({
      content: `
      ${stepper(2)}
      <h1 class="h1" style="font-size:24px">Your details</h1>
      <p class="lede" style="margin-bottom:22px">
        An explanation why we need personal details will be added here.
      </p>

      ${field({
        label: "Full name",
        name: "name",
        value: flow.draft.name ?? session.name,
        required: true,
        autofocus: true,
      })}
      ${countryField(flow.draft.country)}
      ${phoneField(flow.draft.phone || "")}
      ${field({
        label: "Enter postcode to find address",
        name: "postcode",
        value: flow.draft.postcode || "",
        required: true,
        hint: "Start typing to find the address",
      })}

      ${
        manual
          ? `
        ${field({ label: "Street address", name: "street", required: true })}
        ${field({ label: "Building, apartment, floor, suite, unit office, etc.", name: "street2" })}
        ${field({ label: "City", name: "city", required: true })}
        ${field({ label: "State", name: "state" })}`
          : `<p style="margin:14px 0 0">
               <button class="link" data-action="manual">Enter address manually</button>
             </p>`
      }

      <div style="height:26px"></div>
      <button class="btn btn--primary" data-action="finish">Finish registration</button>
      ${cancelLink("Cancel and go back to merchant", "cancel")}`,
    });
  },

  mount(root) {
    // Keep what has been typed so far, then re-render with the manual fields shown.
    root.querySelector('[data-action="manual"]')?.addEventListener("click", () => {
      const v = values(root);
      update("flow", { draft: { ...getState().flow.draft, ...v, manualAddress: true } });
      rerender();
    });

    root.querySelector('[data-action="cancel"]').addEventListener("click", backToMerchant);

    root.querySelector('[data-action="finish"]').addEventListener("click", () => {
      const v = values(root);
      let ok = true;
      ["name", "phone", "postcode"].forEach((n) => clearError(root, n));

      if (!v.name || v.name.trim().split(/\s+/).length < 2) {
        showError(root, "name", "Enter your first and last name.");
        ok = false;
      }
      if (!/^\d[\d\s]{6,}$/.test(v.phone || "")) {
        showError(root, "phone", "Enter a phone number.");
        ok = false;
      }
      if (!v.postcode) {
        showError(root, "postcode", "Enter your postcode.");
        ok = false;
      }
      if (!ok) return;

      detailsSubmitted({
        name: v.name,
        address: {
          line1: v.street || "12 Marlow Gardens",
          line2: v.street2 || "",
          city: v.city || "Bristol",
          postcode: v.postcode,
          country: v.country,
        },
      });
    });
  },
};
