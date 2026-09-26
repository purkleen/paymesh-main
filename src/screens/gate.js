/**
 * Password screen shown before the prototype loads.
 *
 * A soft gate for sharing the prototype: the check runs in the browser against
 * a SHA-256 hash, so the password isn't readable in the source, but anyone who
 * edits the page's code could get past it. Once the right password is entered
 * the browser remembers it (localStorage), so reviewers are asked only once.
 */

import { page, header, button, input, wirePage } from "../ds.js";
import { formAlert, showFormError, clearFormError, showError, clearError } from "../ui.js";
import { ACCESS_PASSWORD_SHA256 } from "../config.js";

const KEY = "paymesh.prototype.unlocked";

const isUnlocked = () => {
  try {
    return localStorage.getItem(KEY) === ACCESS_PASSWORD_SHA256;
  } catch {
    return false;
  }
};

const remember = () => {
  try {
    localStorage.setItem(KEY, ACCESS_PASSWORD_SHA256);
  } catch {
    /* private browsing — they'll be asked again next visit */
  }
};

async function sha256(text) {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

const render = () =>
  page({
    cancel: false,
    content: `
    <form class="ds-stack ds-stack--24" data-gate novalidate>
      <div class="ds-stack ds-stack--16">
        ${header("Enter password", "This prototype is private. Enter the password you were given to view it.")}
        ${input({
          label: "Password",
          name: "password",
          type: "password",
          autocomplete: "current-password",
          autofocus: true,
          trailing: "eye",
        })}
      </div>
      <div class="ds-stack ds-stack--8">
        ${button("View prototype", { action: "unlock" })}
        ${formAlert()}
      </div>
    </form>`,
  });

/**
 * Resolves once the visitor is allowed in — straight away if this browser has
 * unlocked the prototype before, otherwise after the password screen.
 */
export function requirePassword(root) {
  if (isUnlocked()) return Promise.resolve();

  return new Promise((resolve) => {
    root.innerHTML = `<div class="fade-in">${render()}</div>`;
    wirePage(root, () => {});
    const form = root.querySelector("[data-gate]");
    const field = root.querySelector("#f-password");
    field.focus();

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      clearError(root, "password");
      clearFormError(root);

      if ((await sha256(field.value)) !== ACCESS_PASSWORD_SHA256) {
        showError(root, "password", "That password isn't right.");
        showFormError(root, "Check the password and try again.");
        field.select();
        return;
      }
      remember();
      root.innerHTML = "";
      resolve();
    });
  });
}
