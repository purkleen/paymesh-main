/**
 * Paymesh Design System — HTML builders for the Figma components used by the
 * new registration journey. Each helper is named after its Figma component and
 * pairs with the ds- classes in styles/ds.css. Icons and illustrations are the
 * design system's own exports, kept in assets/ds/.
 *
 * Validation reuses ui.js (showError / clearError / formAlert), so fields keep
 * the `data-field` wrapper and `.field__error` slot those helpers expect.
 */

import { logo, mark, flag } from "./icons.js";
import { esc, merchantName, showError, clearError } from "./ui.js";
import { COUNTRIES, countryByName } from "./config.js";

/** Path to a design-system asset. */
export const asset = (name) => `assets/ds/${name}`;

/** An exported icon, rendered from its asset at an explicit size. */
export const icon = (name, size = 24, alt = "") =>
  `<img src="${asset(`${name}.svg`)}" width="${size}" height="${size}" alt="${esc(alt)}" />`;

/* --------------------------------------------------------------------------
   Layout — navigation, Main Content, footer-info
   -------------------------------------------------------------------------- */

/** footer-info: accepted cards, legal links and the company line. */
export const footerInfo = () => `
  <footer class="ds-footer">
    <div class="ds-footer__methods">
      <span class="ds-method"><img src="${asset("mastercard.svg")}" alt="Mastercard" /></span>
      <img class="ds-method" src="${asset("visa.svg")}" alt="Visa" />
    </div>
    <div class="ds-footer__text">
      <p class="ds-footer__line">
        By creating an account you agree to our
        <a href="#" data-noop>Terms of Service</a>
        and <a href="#" data-noop>Privacy Policy</a>.
      </p>
      <p class="ds-footer__line">
        Paymesh LTDA | Av. Presidente Juscelino Kubitschek | n° 1.545, 6° Floor |
        Vila Nova Conceição | ZIP Code 04.543-011 | São Paulo/SP - Brazil |
        CNPJ: 50.522.210/0001-18
      </p>
    </div>
  </footer>`;

/**
 * Phones: while the on-screen keyboard is open, the page's pinned CTA (page({ cta }))
 * floats just above it, as in the Flows "mobile" keyboard frames.
 */
function floatCtaAboveKeyboard(root) {
  const cta = root.querySelector(".ds-cta");
  const vv = window.visualViewport;
  if (!cta || !vv) return;
  const phone = matchMedia("(max-width: 560px)");
  const place = () => {
    if (!cta.isConnected) {
      vv.removeEventListener("resize", place);
      vv.removeEventListener("scroll", place);
      return;
    }
    const keyboard = innerHeight - vv.height - vv.offsetTop;
    const float = phone.matches && keyboard > 120;
    cta.classList.toggle("ds-cta--float", float);
    cta.style.bottom = float ? `${keyboard + 16}px` : "";
  };
  vv.addEventListener("resize", place);
  vv.addEventListener("scroll", place);
  place();
}

/**
 * A registration-* frame: logo and cancel link, centred content, footer-info.
 * @param {{content:string, cancel?:boolean, widget?:boolean, center?:boolean}} opts
 */
export function page({ content, cta = "", cancel = true, widget = false, center = false }) {
  return `
  <div class="ds-page ${cta ? "ds-page--cta" : ""}">
    <header class="ds-nav">
      <span class="logo">${logo()}<span class="logo__mark">${mark("var(--ink-logo)", 50)}</span></span>
      ${cancel ? cancelLink() : ""}
    </header>
    <main class="ds-main">
      <div class="ds-container ${widget ? "ds-container--widget" : ""} ${center ? "ds-container--center" : ""}">
        ${content}
        ${cta ? `<div class="ds-cta">${cta}</div>` : ""}
      </div>
    </main>
    ${footerInfo()}
  </div>`;
}

/** Title block: Heading/3XL/Bold plus optional body copy. */
export const header = (title, body = "", { large = false } = {}) => `
  <div class="ds-stack ds-stack--16">
    <h1 class="ds-h1 ${large ? "ds-h1--large" : ""}">${title}</h1>
    ${body ? `<p class="ds-body">${body}</p>` : ""}
  </div>`;

/* --------------------------------------------------------------------------
   Actions
   -------------------------------------------------------------------------- */

export const button = (label, { action, variant = "primary", iconName = "" } = {}) => `
  <button class="ds-btn ds-btn--${variant}" ${action ? `data-action="${action}"` : ""}>
    ${iconName ? icon(iconName, 24) : ""}${label}
  </button>`;

/** "Cancel and go back to [merchant]" — returns the buyer to the merchant (wired by `wirePage`). */
export const cancelLink = (extraClass = "") =>
  `<button class="ds-link ${extraClass}" data-ds-cancel>Back to ${esc(merchantName())}</button>`;

/** "← Back to …" under a form. */
export const backLink = (label, route) =>
  `<button class="ds-link ds-link--block" data-goto="${route}">&larr; ${label}</button>`;

/**
 * Puts a design-system button into its loading state (Spinner/White + label)
 * and returns a restore function. Buttons are never disabled; the busy flag
 * guards against a second press instead.
 */
export function busy(btn, label) {
  const original = btn.innerHTML;
  btn.dataset.busy = "1";
  btn.classList.add("ds-btn--busy");
  btn.innerHTML = `<img class="ds-spinner" src="${asset("spinner.png")}" alt="" />${label}`;
  return () => {
    delete btn.dataset.busy;
    btn.classList.remove("ds-btn--busy");
    btn.innerHTML = original;
  };
}

export const isBusy = (btn) => btn.dataset.busy === "1";

/* --------------------------------------------------------------------------
   input
   -------------------------------------------------------------------------- */

const labelFor = (name, label, { required, optional }) => `
  <label class="ds-label" for="f-${name}">
    ${esc(label)}${required ? '<span class="ds-label__req">*</span>' : ""}${
      optional ? ' <span class="ds-label__optional">(optional)</span>' : ""
    }
  </label>`;

/**
 * input — label, 52px control, optional helper text.
 * `trailing` adds an icon button: "eye" reveals a password, "close" clears.
 * `leading` puts an icon before the text (the search field).
 */
export function input({
  label,
  name,
  type = "text",
  value = "",
  placeholder = "",
  required = false,
  optional = false,
  hint = "",
  autocomplete = "",
  inputmode = "",
  autofocus = false,
  leading = "",
  trailing = "",
  after = "",
}) {
  const trailingBtn =
    trailing === "eye"
      ? `<button type="button" class="ds-input__btn" data-reveal="${name}" aria-label="Show password">${icon("eye")}</button>`
      : trailing === "close"
        ? `<button type="button" class="ds-input__btn" data-clear="${name}" aria-label="Clear ${esc(label)}">${icon("close")}</button>`
        : "";

  return `
  <div class="ds-field" data-field="${name}">
    ${label ? labelFor(name, label, { required, optional }) : ""}
    <div class="ds-input">
      ${leading ? icon(leading) : ""}
      <input id="f-${name}" name="${name}" type="${type}" value="${esc(value)}"
             placeholder="${esc(placeholder)}"
             ${label ? "" : `aria-label="${esc(placeholder || name)}"`}
             ${autocomplete ? `autocomplete="${autocomplete}"` : ""}
             ${inputmode ? `inputmode="${inputmode}"` : ""}
             ${autofocus ? "data-autofocus" : ""} />
      ${trailingBtn}${after}
    </div>
    ${hint ? `<p class="ds-hint">${esc(hint)}</p>` : ""}
    <p class="field__error" hidden></p>
  </div>`;
}

/**
 * First name + Last name, prefilled from the session. Older sessions that only
 * hold a full `name` are split on the first space.
 */
export function nameInputs(session, { required = true, autofocus = false } = {}) {
  const [first = "", ...rest] = (session.name || "").trim().split(/\s+/);
  return `
    ${input({
      label: "First name",
      name: "firstName",
      value: session.firstName || first,
      required,
      autocomplete: "given-name",
      autofocus,
    })}
    ${input({
      label: "Last name",
      name: "lastName",
      value: session.lastName ?? rest.join(" "),
      required,
      autocomplete: "family-name",
    })}`;
}

/** Validates the two name fields from `nameInputs`; true when both are filled. */
export function checkNames(root, v) {
  let ok = true;
  [
    ["firstName", "Enter your first name."],
    ["lastName", "Enter your last name."],
  ].forEach(([name, message]) => {
    clearError(root, name);
    if (!v[name]) {
      showError(root, name, message);
      ok = false;
    }
  });
  return ok;
}

/** Select — a native select dressed as an input, with the chevron-down icon. */
export function select({ label, name, options, value = "", required = false }) {
  return `
  <div class="ds-field" data-field="${name}">
    ${labelFor(name, label, { required })}
    <div class="ds-input ds-input--select">
      <select id="f-${name}" name="${name}">
        ${options.map((o) => `<option ${o === value ? "selected" : ""}>${esc(o)}</option>`).join("")}
      </select>
      ${icon("chevron-down")}
    </div>
    <p class="field__error" hidden></p>
  </div>`;
}

export const countrySelect = ({ name = "country", value, label = "Country of residence" } = {}) =>
  select({
    label,
    name,
    options: COUNTRIES.map((c) => c.name),
    value: value || COUNTRIES[0].name,
    required: true,
  });

/**
 * Phone number — flag and dial-code dropdown joined to the number.
 * Keeps the ids ui.js#wireCountryFields drives (#f-dial, #f-phone, [data-dial]).
 */
export function phoneInput({ value = "", country, showLabel = true } = {}) {
  const c = countryByName(country);
  return `
  <div class="ds-field" data-field="phone">
    <label class="ds-label ${showLabel ? "" : "sr-only"}" for="f-phone">Phone number<span class="ds-label__req">*</span></label>
    <div class="ds-phone">
      <span class="ds-phone__code">
        <span data-dial>${flag(c.iso)} ${c.dial}</span>
        ${icon("chevron-down")}
        <select class="phone__select" id="f-dial" name="dial" aria-label="Country dial code">
          ${COUNTRIES.map(
            (x) => `<option value="${esc(x.name)}" ${x.name === c.name ? "selected" : ""}>${esc(x.dial)} ${esc(x.name)}</option>`
          ).join("")}
        </select>
      </span>
      <div class="ds-input">
        <input id="f-phone" name="phone" type="tel" inputmode="tel" autocomplete="tel-national"
               value="${esc(value)}" />
      </div>
    </div>
    <p class="field__error" hidden></p>
  </div>`;
}

/** Checkbox (sm) with its label. */
export const checkbox = ({ name, label, checked = false, muted = false }) => `
  <label class="ds-check ${muted ? "ds-check--muted" : ""}" data-check="${name}">
    <input type="checkbox" name="${name}" ${checked ? "checked" : ""} />
    <span>${label}</span>
  </label>`;

/** OTP-input × 6. */
export const otp = () => `
  <div class="ds-otp" data-otp-group>
    ${Array.from({ length: 6 })
      .map(
        (_, i) =>
          `<input class="ds-otp__box" inputmode="numeric" autocomplete="${i === 0 ? "one-time-code" : "off"}"
                  maxlength="1" aria-label="Digit ${i + 1}" data-otp="${i}" ${i === 0 ? "data-autofocus" : ""} />`
      )
      .join("")}
  </div>`;

/* --------------------------------------------------------------------------
   Payment pieces
   -------------------------------------------------------------------------- */

/** Merchant Logo — the merchant's image, or its initial on its colour. */
export function merchantLogo(merchant, className = "ds-merchant__logo") {
  if (merchant.logo) return `<img class="${className}" src="${esc(merchant.logo)}" alt="" />`;
  return `<span class="${className}" style="background:${merchant.color};display:grid;place-items:center;color:#fff">${esc(merchant.initial)}</span>`;
}

/** PaymentValue — the fiat amount over its token equivalent. */
export const paymentValue = (usd, token) => `
  <div class="ds-value">
    <span class="ds-value__usd">${usd}</span>
    <span class="ds-value__token">&asymp; ${token}</span>
  </div>`;

/** Merchant-payment/Default — logo, name and amount. */
export const merchantPayment = (merchant, usd, token) => `
  <div class="ds-pay-head">
    <div class="ds-merchant">
      ${merchantLogo(merchant)}
      <span class="ds-merchant__name">${esc(merchant.name)}</span>
    </div>
    ${paymentValue(usd, token)}
  </div>`;

/* --------------------------------------------------------------------------
   Behaviour shared by every design-system screen
   -------------------------------------------------------------------------- */

/**
 * Wires the pieces every frame has: cancel links, password reveal and the
 * clear buttons. `onCancel` is supplied by the screen so this module stays
 * free of journey logic.
 */
export function wirePage(root, onCancel) {
  root.querySelectorAll("[data-ds-cancel]").forEach((el) => el.addEventListener("click", onCancel));
  floatCtaAboveKeyboard(root);

  root.querySelectorAll("[data-reveal]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const field = root.querySelector(`#f-${btn.dataset.reveal}`);
      const show = field.type === "password";
      field.type = show ? "text" : "password";
      btn.setAttribute("aria-label", show ? "Hide password" : "Show password");
      btn.style.opacity = show ? ".55" : "";
    });
  });

  // Correcting a field clears its error straight away.
  root.querySelectorAll(".ds-field").forEach((field) =>
    field.addEventListener("input", () => {
      field.querySelector("[aria-invalid]")?.removeAttribute("aria-invalid");
      const error = field.querySelector(".field__error");
      if (error) error.hidden = true;
    })
  );

  // The clear button only shows while its field has something to clear.
  root.querySelectorAll("[data-clear]").forEach((btn) => {
    const field = root.querySelector(`#f-${btn.dataset.clear}`);
    const sync = () => (btn.hidden = !field.value);
    field.addEventListener("input", sync);
    sync();
    btn.addEventListener("click", () => {
      field.value = "";
      sync();
      field.focus();
    });
  });
}
