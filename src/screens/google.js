/**
 * Google sign-in hand-off — the account chooser and the confirmation page,
 * matching the two dark frames in the Figma file.
 */

import { googleG } from "../icons.js";
import { esc } from "../ui.js";
import { GOOGLE_ACCOUNT } from "../config.js";
import { googleAccountChosen, googleConfirmed } from "../flow.js";
import { go } from "../router.js";

const chrome = (inner) => `
  <div class="google-page">
    <div class="google-card">
      <span class="google-brand">${googleG(18)} Sign in with Google</span>
      ${inner}
    </div>
    <div class="google-foot">
      <span>English (United Kingdom)</span><span>Help</span><span>Privacy</span><span>Terms</span>
    </div>
  </div>`;

export const accounts = {
  render() {
    return chrome(`
      <h1>Choose an account</h1>
      <p>to continue to paymesh.com</p>

      <div class="google-list">
        <button class="google-item" data-action="choose">
          <span class="google-avatar">${esc(GOOGLE_ACCOUNT.initials)}</span>
          <span>
            <span class="google-item__name">${esc(GOOGLE_ACCOUNT.name)}</span><br />
            <span class="google-item__mail">${esc(GOOGLE_ACCOUNT.email)}</span>
          </span>
        </button>
        <button class="google-item" data-action="other">
          <span class="google-avatar" style="background:#3c4043">+</span>
          <span class="google-item__name">Use another account</span>
        </button>
      </div>

      <p class="google-fine">
        Before using this app, you can review paymesh.com's Privacy Policy and Terms of Service.
      </p>`);
  },

  mount(root) {
    root.querySelector('[data-action="choose"]').addEventListener("click", googleAccountChosen);
    root.querySelector('[data-action="other"]').addEventListener("click", googleAccountChosen);
  },
};

export const confirm = {
  render() {
    return chrome(`
      <h1>You're signing back in<br />to paymesh.com</h1>

      <div style="display:flex;align-items:center;gap:12px;margin:26px 0 22px">
        <span class="google-avatar">${esc(GOOGLE_ACCOUNT.initials)}</span>
        <span class="google-item__mail">${esc(GOOGLE_ACCOUNT.email)}</span>
      </div>

      <p class="google-fine" style="margin-top:0">
        Review paymesh.com's privacy policy and Terms of Service to understand how
        paymesh.com will process and protect your data.
        <br /><br />
        To make changes at any time, go to your Google Account.
        <br /><br />
        Learn more about Sign in with Google.
      </p>

      <div class="google-actions">
        <button class="google-btn" data-action="cancel">Cancel</button>
        <button class="google-btn google-btn--filled" data-action="continue">Continue</button>
      </div>`);
  },

  mount(root) {
    root.querySelector('[data-action="continue"]').addEventListener("click", () =>
      googleConfirmed(GOOGLE_ACCOUNT)
    );
    root.querySelector('[data-action="cancel"]').addEventListener("click", () => go("#/login"));
  },
};
