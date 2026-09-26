/**
 * Registration — new version, from the welcome screen to the receipt.
 *
 *   #/v2/welcome    → Welcome, let's finish the payment   (registration-15)
 *   #/v2/add-card   → Add card                            (registration-04)
 *   #/v2/payment    → Payment                             (registration-10)
 *   #/v2/authorize  → Complete order / Authorizing        (registration-08, -07)
 *   #/v2/success    → Order complete                      (registration-01)
 */

import {
  page,
  header,
  button,
  backLink,
  input,
  countrySelect,
  phoneInput,
  checkbox,
  asset,
  icon,
  merchantLogo,
  merchantPayment,
  paymentValue,
  wirePage,
} from "../../ds.js";
import {
  esc,
  money,
  tokens,
  values,
  isEmail,
  showError,
  clearError,
  formAlert,
  showFormError,
  clearFormError,
  MISSING_FIELDS,
  wireCountryFields,
  isValidPhone,
  phoneHint,
  postcodeTerm,
} from "../../ui.js";
import { getState, update, addCard, selectCard, selectedCard, shortfall } from "../../store.js";
import { v2, backToMerchant } from "../../flow.js";
import { AUTHORIZE_MS, COUNTRIES } from "../../config.js";

const action = (label, name) => `
  <div class="ds-stack ds-stack--8">
    ${button(label, { action: name })}
    ${formAlert()}
  </div>`;

/** Card-scheme badge at the 45×32 size used in the Radio group item. */
const schemeBadge = (scheme) =>
  scheme === "visa"
    ? `<img src="${asset("visa-lg.svg")}" width="45" height="32" alt="Visa" />`
    : `<span class="ds-method ds-method--lg"><img src="${asset("mastercard.svg")}" alt="Mastercard" /></span>`;

const capitalise = (s) => s.charAt(0).toUpperCase() + s.slice(1);

/* -------------------------------------------------------------------------
   Welcome, <name>! Let's finish the payment
   ------------------------------------------------------------------------- */

export const welcome = {
  render() {
    const { order, session } = getState();
    return page({
      cancel: false,
      center: true,
      content: `
      <div class="ds-stack ds-stack--16 ds-stack--center">
        <img class="ds-art" src="${asset("success-check.png")}" alt="" />
        <div class="ds-stack ds-stack--24" style="align-self:stretch">
          <h1 class="ds-h1">Welcome, ${esc(session.firstName || "there")}!<br />Let's finish the payment</h1>
          ${button(order ? `Continue with ${esc(order.merchant.name)} payment` : "Continue with payment", {
            action: "continue",
          })}
        </div>
      </div>`,
    });
  },

  mount(root) {
    wirePage(root, backToMerchant);
    root.querySelector('[data-action="continue"]').addEventListener("click", v2.continueToPayment);
  },
};

/* -------------------------------------------------------------------------
   Add card — card details, customer information, billing address
   ------------------------------------------------------------------------- */

/** Visa starts with 4; Mastercard with 51–55 or 2221–2720. Null when neither. */
function cardScheme(digits) {
  if (digits.startsWith("4")) return "visa";
  const two = +digits.slice(0, 2);
  const four = +digits.slice(0, 4);
  if ((two >= 51 && two <= 55) || (four >= 2221 && four <= 2720)) return "mastercard";
  return null;
}

const addressLines = (a) => `
  <p>${esc([a.line1, a.line2].filter(Boolean).join(", "))}</p>
  <p>${esc(a.postcode)}, ${esc(a.city)}</p>
  <p>${esc(a.country || "")}</p>`;

const section = (title, body, attrs = "") => `
  <section class="ds-stack ds-stack--8" ${attrs}>
    <h2 class="ds-h2">${title}</h2>
    <div class="ds-stack ds-stack--16">${body}</div>
  </section>`;

export const addCardScreen = {
  render() {
    const { session, wallet } = getState();
    const country = session.country || COUNTRIES[0].name;
    // The address given during registration is the shipping address.
    const a = wallet.address || {};

    return page({
      content: `
      <div class="ds-stack ds-stack--24">
        <div class="ds-stack ds-stack--16">
          ${header("Add card")}
          <div class="ds-stack ds-stack--24">
            ${section(
              "Add card",
              `
              ${input({ label: "Cardholder's name", name: "cardName", value: session.name, required: true, autocomplete: "cc-name" })}
              ${input({
                label: "Card number",
                name: "cardNumber",
                required: true,
                inputmode: "numeric",
                autocomplete: "cc-number",
                autofocus: true,
                after: `<span class="ds-input__schemes">
                          <span class="ds-method" data-scheme="mastercard"><img src="${asset("mastercard.svg")}" alt="Mastercard" /></span>
                          <img class="ds-method" data-scheme="visa" src="${asset("visa.svg")}" alt="Visa" />
                        </span>`,
              })}
              ${input({ label: "Expiry date (MM/YY)", name: "expiry", placeholder: "MM/YY", required: true, inputmode: "numeric", autocomplete: "cc-exp" })}
              ${input({
                label: "CVC",
                name: "cvc",
                required: true,
                inputmode: "numeric",
                autocomplete: "cc-csc",
                hint: "3-digit number at the back of your card",
              })}`
            )}

            ${section(
              "Customer information",
              `
              ${phoneInput({ value: session.phone || "", country })}
              ${input({ label: "Full name", name: "name", value: session.name, required: true, autocomplete: "name" })}
              ${input({ label: "Email address", name: "email", type: "email", value: session.email, required: true, autocomplete: "email" })}
              ${countrySelect({ value: country })}`
            )}

            ${section(
              "Billing address",
              `
              ${checkbox({
                name: "differentAddress",
                label: "Billing address for the card is different than shipping.",
                muted: true,
              })}
              ${a.line1 ? `<div class="ds-address-summary" data-billing-summary>${addressLines(a)}</div>` : ""}
              <div class="ds-stack ds-stack--16" data-billing-fields ${a.line1 ? "hidden" : ""}>
                ${countrySelect({ name: "billingCountry", value: a.country || country })}
                ${input({ label: "Street address", name: "street", value: a.line1 || "", required: true, autocomplete: "billing address-line1" })}
                ${input({
                  label: "Building, apartment, floor, suite, unit office, etc.",
                  name: "street2",
                  value: a.line2 || "",
                  optional: true,
                  autocomplete: "billing address-line2",
                })}
                ${input({ label: "City", name: "city", value: a.city || "", required: true, autocomplete: "billing address-level2" })}
                ${input({
                  label: capitalise(postcodeTerm(a.country || country)),
                  name: "postcode",
                  value: a.postcode || "",
                  required: true,
                  autocomplete: "billing postal-code",
                })}
                ${input({ label: "County", name: "county", value: a.state || "", optional: true, autocomplete: "billing address-level1" })}
              </div>`
            )}
          </div>
        </div>

        ${checkbox({
          name: "terms",
          label: `I accept the <a href="#" data-noop>terms and conditions</a> of purchase for Paymesh.`,
        })}
        ${action("Add new card", "add")}
      </div>`,
    });
  },

  mount(root) {
    wirePage(root, backToMerchant);
    wireCountryFields(root);

    // Light formatting so the fields behave like real card inputs.
    const number = root.querySelector("#f-cardNumber");
    // From the fourth digit on, only the badge of the recognised scheme stays.
    // A full 16-digit number that matches neither gets one picked at random,
    // kept until the number changes, and the saved card uses the same one.
    const badges = [...root.querySelectorAll("[data-scheme]")];
    let scheme = null;
    let randomFor = "";
    number.addEventListener("input", () => {
      const digits = number.value.replace(/\D/g, "").slice(0, 16);
      number.value = digits.replace(/(.{4})/g, "$1 ").trim();
      scheme = digits.length >= 4 ? cardScheme(digits) : null;
      if (!scheme && digits.length === 16) {
        if (randomFor.slice(0, 16) !== digits) randomFor = digits + (Math.random() < 0.5 ? "visa" : "mastercard");
        scheme = randomFor.slice(16);
      }
      badges.forEach((b) => (b.hidden = Boolean(scheme) && b.dataset.scheme !== scheme));
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

    // Billing country decides what the postcode field is called.
    const billingCountry = root.querySelector("#f-billingCountry");
    billingCountry.addEventListener("change", () => {
      root.querySelector('label[for="f-postcode"]').innerHTML =
        `${capitalise(postcodeTerm(billingCountry.value))}<span class="ds-label__req">*</span>`;
    });

    // Billing defaults to the shipping address, shown as a summary. Ticking
    // "different" opens the fields, prefilled with that address to edit.
    const different = root.querySelector('input[name="differentAddress"]');
    const summary = root.querySelector("[data-billing-summary]");
    const fields = root.querySelector("[data-billing-fields]");
    const billingOpen = () => !summary || different.checked;
    different.addEventListener("change", () => {
      fields.hidden = !billingOpen();
      if (summary) summary.hidden = billingOpen();
    });

    const terms = root.querySelector('input[name="terms"]');
    terms.addEventListener("change", () => {
      terms.closest(".ds-check").dataset.invalid = "false";
      clearFormError(root);
    });

    root.querySelector('[data-action="add"]').addEventListener("click", () => {
      const v = values(root);
      const required = ["cardName", "cardNumber", "expiry", "cvc", "name", "email"];
      if (billingOpen()) required.push("street", "city", "postcode");
      let ok = true;

      [...required, "phone", "street", "city", "postcode"].forEach((n) => clearError(root, n));
      clearFormError(root);

      required.forEach((n) => {
        if (!v[n]) {
          showError(root, n, "This field is required.");
          ok = false;
        }
      });
      if (v.cardNumber && v.cardNumber.replace(/\s/g, "").length < 12) {
        showError(root, "cardNumber", "Enter a valid card number.");
        ok = false;
      }
      const [month, year] = v.expiry.split("/");
      if (v.expiry && (!/^\d{2}\/\d{2}$/.test(v.expiry) || +month < 1 || +month > 12)) {
        showError(root, "expiry", "Use the MM/YY format.");
        ok = false;
      }
      if (v.cvc && v.cvc.length !== 3) {
        showError(root, "cvc", "Enter the 3 digits on the back of your card.");
        ok = false;
      }
      if (v.email && !isEmail(v.email)) {
        showError(root, "email", "Enter a valid email address.");
        ok = false;
      }
      if (!isValidPhone(v.phone, v.dial)) {
        showError(root, "phone", phoneHint(v.dial));
        ok = false;
      }
      if (!ok) {
        showFormError(root, MISSING_FIELDS);
        root.querySelector('[aria-invalid="true"]')?.scrollIntoView({ block: "center", behavior: "smooth" });
        return;
      }
      if (!terms.checked) {
        terms.closest(".ds-check").dataset.invalid = "true";
        return showFormError(root, "Accept the terms and conditions to add your card.");
      }

      update("session", { name: v.name, phone: v.phone, country: v.country, email: v.email });

      // Build the card from what was typed so it reads back convincingly.
      const digits = v.cardNumber.replace(/\s/g, "");
      const cardType = scheme || "mastercard";
      addCard({
        id: `card-${Date.now()}`,
        scheme: cardType,
        label: `${cardType === "visa" ? "Visa" : "Mastercard"} ending in ${digits.slice(-4)}`,
        expiry: `Expiry ${month}/20${year}`,
      });
      v2.cardAdded();
    });
  },
};

/* -------------------------------------------------------------------------
   Payment
   ------------------------------------------------------------------------- */

function balanceOption(wallet) {
  return `
  <div class="ds-option ds-option--disabled" role="radio" aria-checked="false" aria-disabled="true">
    <span class="ds-option__radio"></span>
    <span class="ds-option__main"><span class="ds-option__title">Paymesh balance</span></span>
    <span class="ds-option__side">
      <span class="ds-amount">${money(wallet.balance)}</span>
      <span class="ds-amount-sub">${tokens(wallet.balance)}</span>
    </span>
  </div>`;
}

function cardOption(card, selectedId) {
  return `
  <button class="ds-option" role="radio" aria-checked="${card.id === selectedId}" data-card="${esc(card.id)}">
    <span class="ds-option__radio"></span>
    <span class="ds-option__main">
      <span class="ds-option__title">${esc(card.label)}</span>
      <span class="ds-option__sub">${esc(card.expiry)}</span>
    </span>
    <span class="ds-option__side">${schemeBadge(card.scheme)}</span>
  </button>`;
}

export const payment = {
  render() {
    const { order, wallet, session } = getState();
    if (!order) return page({ content: `<p class="ds-body ds-center">No pending payment.</p>` });
    const remaining = shortfall();
    const a = wallet.address;

    return page({
      widget: true,
      content: `
      <section class="ds-card">
        <h2 class="ds-card__title">Payment</h2>
        <div class="ds-card__body">
          ${merchantPayment(order.merchant, money(order.amount), tokens(order.amount))}

          <div class="ds-stack ds-stack--24">
            ${balanceOption(wallet)}

            <div class="ds-list-item">
              <div class="ds-list-item__row">
                <span class="ds-list-item__label">${icon("danger")}Remaining balance</span>
                <span class="ds-option__side">
                  <span class="ds-amount">${money(remaining)}</span>
                  <span class="ds-amount-sub">${tokens(remaining)}</span>
                </span>
              </div>
              <p class="ds-body" style="color:var(--text-primary)">
                Remaining balance will be charged from the card selected below.
              </p>
              <div class="ds-stack ds-stack--16" role="radiogroup" aria-label="Card to pay with">
                ${wallet.cards.map((c) => cardOption(c, wallet.selectedCardId)).join("")}
                <button class="ds-btn ds-btn--link ds-btn--link-l" data-action="add-card">
                  ${icon("add")}Add card
                </button>
              </div>
            </div>

            ${
              a
                ? `<div class="ds-address">
                     <span class="ds-address__name">${icon("wallet")}${esc(session.name)}</span>
                     <div class="ds-address__lines">
                       <p>${esc([a.line1, a.line2].filter(Boolean).join(", "))}</p>
                       <p>${esc(a.postcode)}, ${esc(a.city)}</p>
                     </div>
                   </div>`
                : ""
            }
          </div>

          <div class="ds-info">
            ${icon("receipt", 20)}
            <span>This payment will appear on your bank statement as <strong>Paymesh-xyz-1234</strong>.</span>
          </div>

          ${checkbox({
            name: "terms",
            label: `I accept the terms and conditions of purchase for both
                    <a href="#" data-noop>Paymesh</a> and <a href="#" data-noop>Payhound</a>.`,
          })}

          ${action("To payment", "pay")}

          <p class="ds-secure">${icon("safety", 20)}This payment is secure thanks to xyz.</p>
        </div>
      </section>`,
    });
  },

  mount(root) {
    wirePage(root, backToMerchant);
    root.querySelector('[data-action="add-card"]')?.addEventListener("click", v2.addCardRequested);

    const choices = [...root.querySelectorAll("[data-card]")];
    choices.forEach((choice) =>
      choice.addEventListener("click", () => {
        choices.forEach((c) => c.setAttribute("aria-checked", "false"));
        choice.setAttribute("aria-checked", "true");
        selectCard(choice.dataset.card);
        clearFormError(root);
      })
    );

    const terms = root.querySelector('input[name="terms"]');
    terms?.addEventListener("change", () => {
      terms.closest(".ds-check").dataset.invalid = "false";
      clearFormError(root);
    });

    root.querySelector('[data-action="pay"]')?.addEventListener("click", () => {
      clearFormError(root);
      if (shortfall() > 0 && !selectedCard()) {
        return showFormError(root, "Choose a card to pay the remaining balance, or add a new one.");
      }
      if (!terms.checked) {
        terms.closest(".ds-check").dataset.invalid = "true";
        return showFormError(root, "Accept the terms and conditions to continue.");
      }
      v2.paymentConfirmed();
    });
  },
};

/* -------------------------------------------------------------------------
   Complete order — approve the transfer, then "Authorizing"
   ------------------------------------------------------------------------- */

export const authorize = {
  render() {
    const { order } = getState();
    if (!order) return page({ content: `<p class="ds-body ds-center">No pending payment.</p>` });

    return page({
      widget: true,
      content: `
      <div class="ds-stack ds-stack--32">
        <section class="ds-card">
          <h2 class="ds-card__title">Complete order</h2>
          <div class="ds-card__body ds-card__body--32">
            <p class="ds-body" style="color:#000">
              Approve the transfer of tokens from your Paymesh wallet to pay for your order.
            </p>
            <div class="ds-transfer">
              <span class="ds-transfer__end">
                <span class="ds-transfer__logo ds-transfer__logo--paymesh">
                  <img src="${asset("paymesh-mark.svg")}" alt="" />
                </span>
                Paymesh wallet
              </span>
              ${icon("arrow-right", 32)}
              <span class="ds-transfer__end">
                ${merchantLogo(order.merchant, "ds-transfer__logo")}
                ${esc(order.merchant.name)}
              </span>
            </div>
            ${paymentValue(money(order.amount), tokens(order.amount))}
            <button class="ds-btn ds-btn--primary ds-auth" data-action="authorize">
              <span class="ds-auth__label">To payment</span>
            </button>
            <span class="sr-only" aria-live="polite" data-auth-status></span>
          </div>
        </section>
        ${backLink("Back to Payment Method", "#/v2/payment")}
      </div>`,
    });
  },

  mount(root) {
    wirePage(root, backToMerchant);
    const btn = root.querySelector('[data-action="authorize"]');
    const status = root.querySelector("[data-auth-status]");
    let timer = null;
    let state = "idle"; // idle → authorizing → ready

    revealTransfer(root.querySelector(".ds-transfer"));

    btn?.addEventListener("click", async () => {
      if (state === "ready") return v2.transferAuthorized();
      if (state !== "idle") return;
      state = "authorizing";
      status.textContent = "Authorizing the transfer…";
      await authorizeSequence(btn, () => new Promise((done) => (timer = setTimeout(done, AUTHORIZE_MS))));
      state = "ready";
      status.textContent = "Transfer authorized. Continue to finish your order.";
    });

    return { destroy: () => clearTimeout(timer) };
  },
};

/* The "To payment" → "Authorizing" → "Continue" button choreography.
   Every piece sits in the same grid cell at the button's centre, so each step
   only has to move things sideways from there. */

const reducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

const play = (el, frames, ms, easing = "cubic-bezier(.2, .7, .2, 1)") =>
  el.animate(frames, { duration: reducedMotion() ? 1 : ms, easing, fill: "forwards" }).finished;

/**
 * Paymesh wallet → merchant: both ends start together at the centre of the
 * row and slide out to their places; the arrow appears once they've landed.
 */
async function revealTransfer(row) {
  if (!row) return;
  const [from, to] = row.querySelectorAll(".ds-transfer__end");
  const arrow = row.querySelector(":scope > img");
  const centre = row.getBoundingClientRect().left + row.offsetWidth / 2;
  const offset = (el) => {
    const r = el.getBoundingClientRect();
    return centre - (r.left + r.width / 2);
  };
  const fromX = offset(from);
  const toX = offset(to);
  arrow.style.opacity = "0";

  await Promise.all([
    play(from, [{ transform: `translateX(${fromX}px)`, opacity: 0 }, { transform: "translateX(0)", opacity: 1 }], 520),
    play(to, [{ transform: `translateX(${toX}px)`, opacity: 0 }, { transform: "translateX(0)", opacity: 1 }], 520),
  ]);
  await play(arrow, [{ transform: "translateX(-8px)", opacity: 0 }, { transform: "translateX(0)", opacity: 1 }], 260);
}

const collapse = { clipPath: "inset(0 50% 0 50%)", opacity: 0 };
const open = { clipPath: "inset(0 0 0 0)", opacity: 1 };

/**
 * 1. the label collapses into the centre
 * 2. the spinner slides up from the bottom of the button and spins once
 * 3. "Authorizing" rolls out from under the spinner to the right while the
 *    spinner moves left and keeps spinning until `authorize()` resolves
 * 4. label and spinner collapse back into the centre and "Continue" opens
 */
async function authorizeSequence(btn, authorize) {
  const label = btn.querySelector(".ds-auth__label");
  const spinner = document.createElement("span");
  spinner.className = "ds-auth__spinner";
  spinner.innerHTML = `<img src="${asset("spinner.png")}" alt="" />`;
  const working = document.createElement("span");
  working.className = "ds-auth__label";
  working.textContent = "Authorizing";
  spinner.style.opacity = working.style.opacity = "0";
  btn.append(working, spinner);
  const wheel = spinner.firstElementChild;

  await play(label, [open, collapse], 220);
  label.remove();

  await play(spinner, [{ transform: "translateY(40px)", opacity: 0 }, { transform: "translateY(0)", opacity: 1 }], 280);
  await play(wheel, [{ transform: "rotate(0deg)" }, { transform: "rotate(360deg)" }], 560, "ease-in-out");

  // Final layout: [spinner] 8px [Authorizing], centred as a pair.
  const gap = 8;
  const width = working.offsetWidth;
  const spinnerX = -(width + gap) / 2;
  const labelX = (24 + gap) / 2;
  const spinning = wheel.animate([{ transform: "rotate(0deg)" }, { transform: "rotate(360deg)" }], {
    duration: 800,
    iterations: Infinity,
  });
  await Promise.all([
    play(spinner, [{ transform: "translateX(0)" }, { transform: `translateX(${spinnerX}px)` }], 420),
    // Starts tucked behind the spinner (right edge at the centre, clipped away)
    // and is revealed from its right edge as it rolls out.
    play(
      working,
      [
        { transform: `translateX(${-width / 2}px)`, clipPath: "inset(0 0 0 100%)", opacity: 0 },
        { transform: `translateX(${labelX}px)`, clipPath: "inset(0 0 0 0)", opacity: 1 },
      ],
      420
    ),
  ]);

  await authorize();

  await Promise.all([
    play(spinner, [{ transform: `translateX(${spinnerX}px) scale(1)`, opacity: 1 }, { transform: "translateX(0) scale(0)", opacity: 0 }], 260),
    play(working, [{ transform: `translateX(${labelX}px)`, ...open }, { transform: "translateX(0)", ...collapse }], 260),
  ]);
  spinning.cancel();
  spinner.remove();
  working.remove();

  const next = document.createElement("span");
  next.className = "ds-auth__label";
  next.textContent = "Continue";
  btn.append(next);
  await play(next, [collapse, open], 240);
}

/* -------------------------------------------------------------------------
   Order complete — the receipt
   ------------------------------------------------------------------------- */

/** "16 July 2026, 12:13am" plus the local zone abbreviation. */
function formatTimestamp(ms) {
  const d = new Date(ms);
  const date = d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const time = d
    .toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
    .replace(" ", "")
    .toLowerCase();
  const zone =
    new Intl.DateTimeFormat("en-GB", { timeZoneName: "short" })
      .formatToParts(d)
      .find((p) => p.type === "timeZoneName")?.value || "";
  return { text: `${date}, ${time}`, zone };
}

const shortId = (id) => `${id.slice(0, 5)}...${id.slice(-6)}`;

const confirmRow = (label, value) => `
  <div class="ds-confirm__row">
    <span class="ds-confirm__label">${label}</span>
    <span class="ds-confirm__value">${value}</span>
  </div>`;

export const success = {
  render() {
    const { order, flow } = getState();
    const receipt = flow.receipt || { id: "238290000000000000312108", at: Date.now() };
    const when = formatTimestamp(receipt.at);
    const amount = order?.amount ?? 0;

    return page({
      cancel: false,
      center: true,
      content: `
      <div class="ds-stack ds-stack--16 ds-stack--center">
        <img class="ds-art" src="${asset("success-check.png")}" alt="" />
        <div class="ds-stack ds-stack--24" style="align-self:stretch">
          <h1 class="ds-h1">Order complete</h1>
          <div class="ds-confirm">
            ${confirmRow("Paid", money(amount))}
            <span class="ds-confirm__sub">${tokens(amount)}</span>
            ${confirmRow("From", "Your Paymesh wallet")}
            ${order ? confirmRow("To", `${merchantLogo(order.merchant, "")}${esc(order.merchant.name)}`) : ""}
            ${confirmRow("Timestamp", `${esc(when.text)}${when.zone ? `<span class="ds-chip">${esc(when.zone)}</span>` : ""}`)}
            ${confirmRow(
              "Transaction ID",
              `<button class="ds-copy" data-copy="${receipt.id}" aria-label="Copy transaction ID">${icon("copy")}</button>
               <span data-copy-label>${shortId(receipt.id)}</span>`
            )}
          </div>
          ${order ? button(`Go back to ${esc(order.merchant.name)}`, { action: "back" }) : ""}
        </div>
      </div>`,
    });
  },

  mount(root) {
    wirePage(root, backToMerchant);
    root.querySelector('[data-action="back"]')?.addEventListener("click", backToMerchant);

    const copy = root.querySelector("[data-copy]");
    const label = root.querySelector("[data-copy-label]");
    let timer = null;
    copy.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(copy.dataset.copy);
        label.textContent = "Copied";
      } catch {
        label.textContent = copy.dataset.copy;
      }
      clearTimeout(timer);
      timer = setTimeout(() => (label.textContent = shortId(copy.dataset.copy)), 1600);
    });

    return { destroy: () => clearTimeout(timer) };
  },
};
