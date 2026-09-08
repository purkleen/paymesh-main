/**
 * Shared rendering helpers: page chrome, form controls, formatting.
 * Screens return HTML strings; behaviour is wired up in their `mount`.
 */

import { logo, icons, googleG, appleLogo, flag } from "./icons.js";
import { go } from "./router.js";
import { ORDER, COUNTRIES, DEMO_ADDRESSES, countryByName } from "./config.js";

/* --------------------------------------------------------------------------
   Formatting
   -------------------------------------------------------------------------- */

export const money = (n) =>
  `${ORDER.symbol}${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const tokens = (n) =>
  `${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${ORDER.token}`;

export const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );

/* --------------------------------------------------------------------------
   Page chrome
   -------------------------------------------------------------------------- */

export const legalFooter = () => `
  <footer class="page__footer">
    <a href="#/legal/terms" data-noop>Terms of Service</a> and
    <a href="#/legal/privacy" data-noop>Privacy Policy</a>.
  </footer>`;

/**
 * Standard Paymesh screen: logo top-left, centred column, legal footer.
 * @param {{content:string, center?:boolean, wide?:boolean}} opts
 */
export function shell({ content, center = false, wide = false, footer = legalFooter() }) {
  return `
  <div class="page ${center ? "page--center" : ""}">
    <header class="page__header"><span class="logo">${logo()}</span></header>
    <div class="page__body">
      <div class="stack ${wide ? "stack--wide" : ""}">${content}</div>
    </div>
    ${footer}
  </div>`;
}

/** Footer variant shown while creating an account. */
export const signupFooter = () => `
  <footer class="page__footer">
    By creating account you agree to our
    <a href="#" data-noop>Terms of Service</a> and <a href="#" data-noop>Privacy Policy</a>.
  </footer>`;

/** Same chrome, but the child owns its own width (payment card screens). */
export function shellRaw({ content, center = true }) {
  return `
  <div class="page ${center ? "page--center" : ""}">
    <header class="page__header"><span class="logo">${logo()}</span></header>
    <div class="page__body"><div>${content}</div></div>
    ${legalFooter()}
  </div>`;
}

/* --------------------------------------------------------------------------
   Buttons
   -------------------------------------------------------------------------- */

export const primary = (label, attrs = "") =>
  `<button class="btn btn--primary" ${attrs}>${label}</button>`;

export const secondary = (label, attrs = "") =>
  `<button class="btn btn--secondary" ${attrs}>${label}</button>`;

export const socialButtons = (verb = "Sign up") => `
  <div class="or"><span>OR</span></div>
  <button class="btn btn--secondary" data-social="google" style="margin-bottom:12px">
    ${googleG()} ${verb} with Google
  </button>
  <button class="btn btn--secondary" data-social="apple">
    ${appleLogo()} ${verb} with Apple
  </button>`;

export const helpLine = () => `
  <p class="center" style="margin-top:20px;font-size:14px">
    Need help? <a class="link" href="#" data-noop>Contact us</a>
  </p>`;

export const cancelLink = (label, action) =>
  `<button class="link under-action" data-action="${action}">${label}</button>`;

/* --------------------------------------------------------------------------
   Form controls
   -------------------------------------------------------------------------- */

export function field({
  label,
  name,
  type = "text",
  value = "",
  placeholder = "",
  required = false,
  hint = "",
  autocomplete = "",
  autofocus = false,
}) {
  return `
  <div class="field" data-field="${name}">
    <label class="field__label" for="f-${name}">
      ${esc(label)}${required ? '<span class="field__req">*</span>' : ""}
    </label>
    <input class="input" id="f-${name}" name="${name}" type="${type}"
           value="${esc(value)}" placeholder="${esc(placeholder)}"
           ${autocomplete ? `autocomplete="${autocomplete}"` : ""}
           ${autofocus ? "data-autofocus" : ""} />
    ${hint ? `<p class="field__hint">${esc(hint)}</p>` : ""}
    <p class="field__error" hidden></p>
  </div>`;
}

export function passwordField({ label = "Password", name = "password", value = "", required = false, strength = false, autofocus = false }) {
  return `
  <div class="field" data-field="${name}">
    <label class="field__label" for="f-${name}">
      ${esc(label)}${required ? '<span class="field__req">*</span>' : ""}
    </label>
    <div class="input-affix">
      <input class="input" id="f-${name}" name="${name}" type="password"
             value="${esc(value)}" autocomplete="current-password" ${autofocus ? "data-autofocus" : ""} />
      <button type="button" class="input-affix__btn" data-reveal="${name}" aria-label="Show password">
        ${icons.eye(20)}
      </button>
    </div>
    ${strength ? strengthMeter() : ""}
    <p class="field__error" hidden></p>
  </div>`;
}

const strengthMeter = () => `
  <div class="strength" data-strength data-level="0">
    <div class="strength__head">
      <span class="strength__title">Password strength</span>
      <span class="strength__label"></span>
    </div>
    <div class="strength__bars">
      <span></span><span></span><span></span><span></span>
    </div>
  </div>`;

const STRENGTH_LABELS = ["", "Weak", "Fair", "Good", "Strong"];

export function selectField({ label, name, options, value = "", required = false }) {
  return `
  <div class="field" data-field="${name}">
    <label class="field__label" for="f-${name}">
      ${esc(label)}${required ? '<span class="field__req">*</span>' : ""}
    </label>
    <div class="select-wrap">
      <select class="input" id="f-${name}" name="${name}">
        ${options.map((o) => `<option ${o === value ? "selected" : ""}>${esc(o)}</option>`).join("")}
      </select>
    </div>
    <p class="field__error" hidden></p>
  </div>`;
}

export const countryField = (value) =>
  selectField({
    label: "Country of residence",
    name: "country",
    options: COUNTRIES.map((c) => c.name),
    value: value || COUNTRIES[0].name,
    required: true,
  });

/* --------------------------------------------------------------------------
   Postcode → address lookup
   -------------------------------------------------------------------------- */

const normalise = (s) => String(s).toLowerCase().replace(/\s+/g, "");

/**
 * Addresses to offer once at least two characters have been typed.
 *
 * Close matches come first, but a lookup never comes back empty — if nothing
 * matches, the country's addresses are suggested anyway so there is always
 * something to pick.
 */
export function suggestAddresses(query, country) {
  if (normalise(query).length < 2) return [];

  const q = normalise(query);
  const inCountry = DEMO_ADDRESSES.filter((a) => a.country === country);
  const pool = inCountry.length ? inCountry : DEMO_ADDRESSES;

  const hits = pool.filter(
    (a) => normalise(a.postcode).startsWith(q) || normalise(`${a.line1}${a.city}`).includes(q)
  );
  return (hits.length ? hits : pool).slice(0, 8);
}

/** What this country calls a postcode, e.g. "ZIP code" in the US. */
export const postcodeTerm = (country) => countryByName(country).postcode;

/** Postcode field that suggests addresses as you type. */
export function addressLookupField(value = "", country) {
  return `
  <div class="field" data-field="postcode">
    <label class="field__label" for="f-postcode" data-postcode-label>
      Enter ${esc(postcodeTerm(country))} to find address<span class="field__req">*</span>
    </label>
    <div class="combo">
      <input class="input" id="f-postcode" name="postcode" type="text"
             value="${esc(value)}" autocomplete="off" spellcheck="false"
             role="combobox" aria-expanded="false" aria-autocomplete="list"
             aria-controls="address-results" />
      <ul class="combo__list" id="address-results" role="listbox"
          aria-label="Matching addresses" hidden></ul>
    </div>
    <p class="field__hint">Start typing to find the address</p>
    <p class="field__error" hidden></p>
  </div>`;
}

/**
 * Wires the lookup. `onSelect(address)` receives the chosen address so the
 * screen can fill in the rest of the form.
 */
export function wireAddressLookup(root, onSelect) {
  const input = root.querySelector("#f-postcode");
  const list = root.querySelector("#address-results");
  if (!input || !list) return;

  let matches = [];
  let active = -1;

  const close = () => {
    list.hidden = true;
    list.innerHTML = "";
    input.setAttribute("aria-expanded", "false");
    active = -1;
  };

  const paint = () => {
    if (!matches.length) {
      close();
      return;
    }
    list.innerHTML = matches
      .map(
        (a, i) => `
        <li class="combo__opt" role="option" id="addr-${i}" data-index="${i}"
            aria-selected="${i === active}">
          ${esc([a.line1, a.line2].filter(Boolean).join(", "))}
          <small>${esc(a.city)}, ${esc(a.postcode)}</small>
        </li>`
      )
      .join("");
    list.hidden = false;
    input.setAttribute("aria-expanded", "true");
  };

  const choose = (index) => {
    const address = matches[index];
    if (!address) return;
    input.value = address.postcode;
    close();
    onSelect(address);
  };

  input.addEventListener("input", () => {
    // Letters, digits and spaces only — postcodes carry no punctuation.
    const cleaned = input.value.replace(/[^A-Za-z0-9 ]/g, "");
    if (cleaned !== input.value) input.value = cleaned;

    const country = root.querySelector("#f-country")?.value;
    matches = suggestAddresses(cleaned, country);
    active = -1;
    paint();
  });

  input.addEventListener("keydown", (e) => {
    if (list.hidden || !matches.length) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      active = (active + (e.key === "ArrowDown" ? 1 : -1) + matches.length) % matches.length;
      paint();
      input.setAttribute("aria-activedescendant", `addr-${active}`);
    } else if (e.key === "Enter" && active >= 0) {
      e.preventDefault();
      choose(active);
    } else if (e.key === "Escape") {
      close();
    }
  });

  // mousedown, not click — blur would close the list first
  list.addEventListener("mousedown", (e) => {
    const option = e.target.closest("[data-index]");
    if (!option) return;
    e.preventDefault();
    choose(Number(option.dataset.index));
  });

  input.addEventListener("blur", () => setTimeout(close, 120));
}

export function phoneField(value = "", country) {
  const c = countryByName(country);
  return `
  <div class="field" data-field="phone">
    <label class="field__label" for="f-phone">Phone number<span class="field__req">*</span></label>
    <div class="phone">
      <span class="phone__code" data-dial>${flag(c.iso)} ${c.dial}</span>
      <input class="input" id="f-phone" name="phone" type="tel" inputmode="tel"
             value="${esc(value)}" placeholder="add your number" />
    </div>
    <p class="field__error" hidden></p>
  </div>`;
}

/** Spaces digits into a country's phone grouping, e.g. 7700 900123. */
const groupDigits = (digits, groups) => {
  const out = [];
  let i = 0;
  for (const size of groups) {
    if (i >= digits.length) break;
    out.push(digits.slice(i, i + size));
    i += size;
  }
  if (i < digits.length) out.push(digits.slice(i));
  return out.join(" ");
};

/** True when the number has a plausible length for the country. */
export function isValidPhone(value, country) {
  const { min, max } = countryByName(country).phone;
  const digits = String(value).replace(/\D/g, "");
  return digits.length >= min && digits.length <= max;
}

/** "United Kingdom numbers are 10 digits, e.g. 7700 900123." */
export function phoneHint(country) {
  const c = countryByName(country);
  const length = c.phone.min === c.phone.max ? `${c.phone.max}` : `${c.phone.min}–${c.phone.max}`;
  return `${c.name} numbers are ${length} digits, e.g. ${c.phone.example}.`;
}

/**
 * Keeps the country-dependent parts of an address form in step with the
 * country select: the phone flag, dial code and number format, and what a
 * postcode is called.
 */
export function wireCountryFields(root) {
  const select = root.querySelector("#f-country");
  const dial = root.querySelector("[data-dial]");
  const postcodeLabel = root.querySelector("[data-postcode-label]");
  const phone = root.querySelector("#f-phone");

  const country = () => countryByName(select ? select.value : undefined);

  // Digits only, capped and grouped to the selected country's format.
  const formatPhone = () => {
    if (!phone) return;
    const { max, groups } = country().phone;
    phone.value = groupDigits(phone.value.replace(/\D/g, "").slice(0, max), groups);
  };

  phone?.addEventListener("input", formatPhone);
  formatPhone();

  select?.addEventListener("change", () => {
    const c = country();
    if (dial) dial.innerHTML = `${flag(c.iso)} ${c.dial}`;
    if (postcodeLabel) {
      postcodeLabel.innerHTML = `Enter ${esc(c.postcode)} to find address<span class="field__req">*</span>`;
    }
    formatPhone();
  });
}

/* --------------------------------------------------------------------------
   Validation helpers
   -------------------------------------------------------------------------- */

/**
 * Error status shown directly under a primary action.
 * Buttons are never disabled — pressing one with something missing surfaces
 * the reason here instead.
 */
export const formAlert = () => `<div data-form-error hidden></div>`;

/** @param {string} html message; may contain links */
export function showFormError(root, html) {
  const box = root.querySelector("[data-form-error]");
  if (!box) return;
  box.innerHTML = `
    <div class="alert" role="alert">
      <span class="alert__icon">${icons.alert(16)}</span>
      <span>${html}</span>
    </div>`;
  box.hidden = false;
}

export function clearFormError(root) {
  const box = root.querySelector("[data-form-error]");
  if (!box) return;
  box.hidden = true;
  box.innerHTML = "";
}

/** Standard message when required fields are empty or invalid. */
export const MISSING_FIELDS =
  "Some details are missing or incorrect. Check the highlighted fields and try again.";

export function showError(root, name, message) {
  const wrap = root.querySelector(`[data-field="${name}"]`);
  if (!wrap) return;
  const input = wrap.querySelector("input, select");
  const err = wrap.querySelector(".field__error");
  if (input) input.setAttribute("aria-invalid", "true");
  if (err) {
    err.textContent = message;
    err.hidden = false;
  }
}

export function clearError(root, name) {
  const wrap = root.querySelector(`[data-field="${name}"]`);
  if (!wrap) return;
  const input = wrap.querySelector("input, select");
  const err = wrap.querySelector(".field__error");
  if (input) input.removeAttribute("aria-invalid");
  if (err) err.hidden = true;
}

export const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v).trim());

export function values(root) {
  const out = {};
  root.querySelectorAll("input[name], select[name]").forEach((el) => {
    out[el.name] = el.value.trim();
  });
  return out;
}

/** 0–4 score, one point per filled segment of the sign-up strength meter. */
export function scorePassword(v) {
  if (!v) return 0;
  let score = 0;
  if (v.length >= 8) score++;
  if (v.length >= 12) score++;
  if (/[A-Z]/.test(v) && /[a-z]/.test(v)) score++;
  if (/\d/.test(v) || /[^A-Za-z0-9]/.test(v)) score++;
  return Math.min(4, Math.max(1, score));
}

/* --------------------------------------------------------------------------
   Behaviour shared by several screens
   -------------------------------------------------------------------------- */

/** Wires password reveal toggles and the strength meter. */
export function wirePasswordFields(root) {
  root.querySelectorAll("[data-reveal]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const input = root.querySelector(`#f-${btn.dataset.reveal}`);
      const show = input.type === "password";
      input.type = show ? "text" : "password";
      btn.innerHTML = show ? icons.eyeOff(20) : icons.eye(20);
      btn.setAttribute("aria-label", show ? "Hide password" : "Show password");
    });
  });

  const meter = root.querySelector("[data-strength]");
  if (!meter) return;
  const input = meter.closest("[data-field]").querySelector("input");
  const label = meter.querySelector(".strength__label");
  const paint = () => {
    const score = scorePassword(input.value);
    meter.dataset.level = String(score);
    label.textContent = STRENGTH_LABELS[score];
  };
  input.addEventListener("input", paint);
  paint();
}

/** Global click handling for `data-noop` links and `data-goto` navigation. */
export function wireCommon(root) {
  root.addEventListener("click", (e) => {
    const noop = e.target.closest("[data-noop]");
    if (noop) {
      e.preventDefault();
      return;
    }
    const nav = e.target.closest("[data-goto]");
    if (nav) {
      e.preventDefault();
      go(nav.dataset.goto);
    }
  });
}

/**
 * Puts a button into its loading state and returns a restore function.
 * The button keeps its active styling; a `busy` flag guards against a second
 * press rather than the `disabled` attribute.
 */
export function busy(button, label) {
  button.dataset.busy = "1";
  button.classList.add("btn--busy");
  button.innerHTML = `<span class="btn__spinner"></span>${label}`;

  return (finalLabel) => {
    delete button.dataset.busy;
    button.classList.remove("btn--busy");
    button.textContent = finalLabel;
  };
}

/** True while a button is mid-action, so repeat presses can be ignored. */
export const isBusy = (button) => button.dataset.busy === "1";

/** Countdown used under the one-time-code inputs. */
export function startResendCountdown(el, seconds) {
  let left = seconds;
  const paint = () => {
    el.innerHTML =
      left > 0
        ? `Didn't receive the code? Resend code in ${left} seconds...`
        : `Didn't receive the code? <button class="link" data-noop>Resend code</button>`;
  };
  paint();
  const id = setInterval(() => {
    left -= 1;
    paint();
    if (left <= 0) clearInterval(id);
  }, 1000);
  return () => clearInterval(id);
}
