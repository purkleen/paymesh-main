/**
 * Add card — card details, customer information and billing address.
 * Reached from the payment sheet when a brand-new wallet has no funding card.
 */

import {
  shell,
  field,
  countryField,
  phoneField,
  wireCountryFields,
  addressLookupField,
  wireAddressLookup,
  isValidPhone,
  phoneHint,
  values,
  showError,
  clearError,
  formAlert,
  showFormError,
  clearFormError,
  MISSING_FIELDS,
} from "../ui.js";
import { icons } from "../icons.js";
import { getState, attachTopupCard } from "../store.js";
import { cardAdded } from "../flow.js";
import { go } from "../router.js";

const sectionTitle = (t) => `<h2 class="h3" style="margin:30px 0 4px">${t}</h2>`;

export default {
  render() {
    const { session } = getState();

    return shell({
      content: `
      <p style="margin:0 0 18px">
        <button class="link" data-action="back">${icons.arrowLeft(16)} Back to Payment</button>
      </p>
      <h1 class="h1" style="font-size:24px">Add card</h1>

      ${sectionTitle("Card details")}
      ${field({ label: "Cardholder's name", name: "cardName", required: true, autofocus: true })}
      ${field({ label: "Card number", name: "cardNumber", required: true })}
      ${field({ label: "Expiration day (MM/YY)", name: "expiry", required: true, placeholder: "MM/YY" })}
      ${field({
        label: "CVC Security number",
        name: "cvc",
        required: true,
        hint: "3-digit number at the back of your card",
      })}

      ${sectionTitle("Customer information")}
      ${phoneField()}
      ${field({ label: "Full name", name: "name", value: session.name, required: true })}
      ${field({ label: "Email address", name: "email", value: session.email, required: true, type: "email" })}

      ${sectionTitle("Billing address")}
      ${countryField()}
      ${addressLookupField()}
      ${field({ label: "Street address", name: "street", required: true })}
      ${field({ label: "Building, apartment, floor, suite, unit office, etc.", name: "street2" })}
      ${field({ label: "City", name: "city", required: true })}
      ${field({ label: "State", name: "state" })}

      <div style="height:28px"></div>
      <button class="btn btn--primary" data-action="add">Add card</button>
      ${formAlert()}
      <button class="link under-action" data-action="back">or cancel and go back to Payment process</button>`,
    });
  },

  mount(root) {
    wireCountryFields(root);

    root.querySelectorAll('[data-action="back"]').forEach((b) =>
      b.addEventListener("click", () => go("#/payment"))
    );

    // Light formatting so the fields behave like real card inputs.
    const number = root.querySelector("#f-cardNumber");
    number.addEventListener("input", () => {
      number.value = number.value.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
    });

    const expiry = root.querySelector("#f-expiry");
    expiry.addEventListener("input", () => {
      const digits = expiry.value.replace(/\D/g, "").slice(0, 4);
      expiry.value = digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
    });

    const cvc = root.querySelector("#f-cvc");
    cvc.addEventListener("input", () => {
      cvc.value = cvc.value.replace(/\D/g, "").slice(0, 3);
    });

    // Picking a suggested address fills the rest of the billing block.
    wireAddressLookup(root, (address) => {
      const fill = (name, value) => {
        const el = root.querySelector(`#f-${name}`);
        if (!el) return;
        el.value = value;
        clearError(root, name);
      };
      fill("street", address.line1);
      fill("street2", address.line2);
      fill("city", address.city);
      fill("state", address.state);
      clearError(root, "postcode");
    });

    root.querySelector('[data-action="add"]').addEventListener("click", () => {
      const v = values(root);
      const required = ["cardName", "cardNumber", "expiry", "cvc", "name", "email", "postcode", "street", "city"];
      let ok = true;

      required.forEach((n) => clearError(root, n));
      clearFormError(root);
      required.forEach((n) => {
        if (!v[n]) {
          showError(root, n, "This field is required.");
          ok = false;
        }
      });
      if (ok && v.cardNumber.replace(/\s/g, "").length < 12) {
        showError(root, "cardNumber", "Enter a valid card number.");
        ok = false;
      }
      if (ok && !/^\d{2}\/\d{2}$/.test(v.expiry)) {
        showError(root, "expiry", "Use the MM/YY format.");
        ok = false;
      }
      clearError(root, "phone");
      if (!isValidPhone(v.phone, v.country)) {
        showError(root, "phone", phoneHint(v.country));
        ok = false;
      }
      if (!ok) {
        showFormError(root, MISSING_FIELDS);
        root.querySelector('[aria-invalid="true"]')?.scrollIntoView({ block: "center", behavior: "smooth" });
        return;
      }

      attachTopupCard();
      cardAdded();
    });
  },
};
