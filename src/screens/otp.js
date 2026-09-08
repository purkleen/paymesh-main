/**
 * "Enter the 6-digit code we sent you".
 *
 * Used both as the second factor after logging in and as the email
 * verification step inside registration (where it carries the stepper).
 */

import {
  shell,
  startResendCountdown,
  esc,
  cancelLink,
  merchantName,
  formAlert,
  showFormError,
  clearFormError,
} from "../ui.js";
import { stepper } from "./_stepper.js";
import { getState } from "../store.js";
import { codeVerified, backToMerchant } from "../flow.js";
import { RESEND_SECONDS } from "../config.js";
import { go } from "../router.js";

const boxes = () =>
  Array.from({ length: 6 })
    .map(
      (_, i) =>
        `<input class="otp__box" inputmode="numeric" maxlength="1" aria-label="Digit ${i + 1}"
                data-otp="${i}" ${i === 0 ? "data-autofocus" : ""} />`
    )
    .join("");

export default {
  render() {
    const { session, flow } = getState();
    const registering = flow.registering;

    return shell({
      center: true,
      content: `
      ${registering ? stepper(1) : ""}
      <h1 class="h1" style="font-size:24px">Enter the 6-digit code we sent you</h1>
      <p class="lede" style="margin-bottom:0">
        We sent the code to <strong>${esc(session.email || "your email")}</strong>.
        This helps us keep your account secure by verifying that it's really you.
      </p>

      <div class="otp" data-otp-group>${boxes()}</div>
      <p class="resend" data-resend></p>

      <button class="btn btn--primary" data-action="verify">Verify code</button>
      ${formAlert()}
      ${cancelLink(
        registering || flow.fromMerchant
          ? `Cancel and go back to ${esc(merchantName())}`
          : "Cancel and go back to log in",
        "cancel"
      )}`,
    });
  },

  mount(root) {
    const group = root.querySelector("[data-otp-group]");
    const inputs = [...root.querySelectorAll("[data-otp]")];
    const stopCountdown = startResendCountdown(root.querySelector("[data-resend]"), RESEND_SECONDS);

    const code = () => inputs.map((i) => i.value).join("");

    inputs.forEach((input, i) => {
      input.addEventListener("input", () => {
        input.value = input.value.replace(/\D/g, "").slice(0, 1);
        group.dataset.invalid = "false";
        clearFormError(root);
        if (input.value && i < inputs.length - 1) inputs[i + 1].focus();
        if (code().length === 6) verify();
      });
      input.addEventListener("keydown", (e) => {
        if (e.key === "Backspace" && !input.value && i > 0) inputs[i - 1].focus();
        if (e.key === "Enter") verify();
      });
      input.addEventListener("paste", (e) => {
        const text = (e.clipboardData || window.clipboardData).getData("text").replace(/\D/g, "");
        if (!text) return;
        e.preventDefault();
        text.split("").slice(0, 6).forEach((ch, idx) => (inputs[idx].value = ch));
        inputs[Math.min(text.length, 5)].focus();
        if (code().length === 6) verify();
      });
    });

    // Any six digits are accepted — this is a prototype, not a real check.
    function verify() {
      const entered = code();

      if (entered.length < 6) {
        group.dataset.invalid = "true";
        showFormError(root, "Enter all six digits of the code we sent you.");
        inputs[entered.length].focus();
        return;
      }

      clearFormError(root);
      stopCountdown();
      codeVerified();
    }

    root.querySelector('[data-action="verify"]').addEventListener("click", verify);

    root.querySelector('[data-action="cancel"]').addEventListener("click", () => {
      stopCountdown();
      const { flow } = getState();
      if (flow.fromMerchant) backToMerchant();
      else go("#/login");
    });

    return { destroy: stopCountdown };
  },
};
