/**
 * Demo data for the prototype.
 * Everything a reviewer is likely to want to change lives in this file.
 */

/** The shop the buyer is checking out from. */
export const MERCHANT = {
  name: "Lumen Market",
  color: "#e8385a",
  initial: "L",
};

/** The order being paid for. Amounts mirror the Figma source. */
export const ORDER = {
  currency: "USD",
  symbol: "$",
  itemCount: 3,
  subtotal: 3402.91,
  postage: 53.88,
  total: 3456.79,
  token: "USDT",
};

/** The returning buyer used across the login and payment scenarios. */
export const RETURNING_USER = {
  email: "arthur.brown@protonmail.com",
  name: "James Whitfield",
  firstName: "James",
  balance: 5983.89,
  fundingCard: { scheme: "visa", label: "Visa ending with 4567" },
  address: {
    line1: "12 Marlow Gardens",
    line2: "",
    city: "Bristol",
    postcode: "BS7 9QT",
    country: "United Kingdom",
  },
};

/** Google account offered by the account chooser. */
export const GOOGLE_ACCOUNT = {
  name: "Jamie Whitfield",
  email: "jamie.whitfield@example.com",
  initials: "JW",
};

/** The card a brand new user adds during registration, used to top up. */
export const TOPUP_CARD = {
  scheme: "mastercard",
  label: "Mastercard ending in 1234",
  expiry: "Expiry 06/2027",
};

/** Seconds shown on the "resend code" countdown. */
export const RESEND_SECONDS = 26;

/** How long the simulated authorization takes, in ms. */
export const AUTHORIZE_MS = 1600;

/**
 * Addresses returned by the postcode lookup. A real integration would call a
 * lookup service; this stands in for it, matching on postcode or street text.
 */
export const DEMO_ADDRESSES = [
  { postcode: "BS7 9QT", line1: "12 Marlow Gardens", line2: "", city: "Bristol", state: "Avon" },
  { postcode: "BS7 9QT", line1: "14 Marlow Gardens", line2: "", city: "Bristol", state: "Avon" },
  { postcode: "BS7 9QT", line1: "16 Marlow Gardens", line2: "Flat 2", city: "Bristol", state: "Avon" },
  { postcode: "BS7 9QT", line1: "18 Marlow Gardens", line2: "", city: "Bristol", state: "Avon" },
  { postcode: "BS1 4ND", line1: "3 Harbour Wharf", line2: "Apartment 401", city: "Bristol", state: "Avon" },
  { postcode: "BS1 4ND", line1: "5 Harbour Wharf", line2: "", city: "Bristol", state: "Avon" },
  { postcode: "E1 6AN", line1: "72 Brune Street", line2: "Unit 3", city: "London", state: "Greater London" },
  { postcode: "E1 6AN", line1: "74 Brune Street", line2: "", city: "London", state: "Greater London" },
  { postcode: "EC2A 4NE", line1: "120 Curtain Road", line2: "Second floor", city: "London", state: "Greater London" },
  { postcode: "M1 4ET", line1: "9 Ducie Street", line2: "", city: "Manchester", state: "Greater Manchester" },
  { postcode: "EH1 1TH", line1: "41 Cockburn Street", line2: "", city: "Edinburgh", state: "Midlothian" },
];

export const COUNTRIES = [
  "United Kingdom",
  "Ireland",
  "France",
  "Germany",
  "Netherlands",
  "Poland",
  "Spain",
  "United States",
];

/**
 * The seven journeys captured in the Figma file.
 * `entry` is the route the merchant hand-off (or the direct visit) lands on.
 */
export const SCENARIOS = [
  {
    id: "direct-login",
    number: 1,
    title: "Log in from the Paymesh website",
    blurb: "Not a checkout — the user signs in to the wallet app itself.",
    entry: "#/login",
    fromMerchant: false,
    seed: { loggedIn: false, registered: true, hasBalance: true, useGoogle: false, failFirstAuth: false },
  },
  {
    id: "logged-in",
    number: 2,
    title: "Logged in, balance covers the order",
    blurb: "Session already active — straight to the payment sheet.",
    entry: "#/payment",
    fromMerchant: true,
    seed: { loggedIn: true, registered: true, hasBalance: true, useGoogle: false, failFirstAuth: false },
  },
  {
    id: "logged-out",
    number: 3,
    title: "Logged out, balance covers the order",
    blurb: "Email and password, then the one-time code, then pay.",
    entry: "#/login",
    fromMerchant: true,
    seed: { loggedIn: false, registered: true, hasBalance: true, useGoogle: false, failFirstAuth: false },
  },
  {
    id: "google-login",
    number: 4,
    title: "Logged out, signs in with Google",
    blurb: "Google account chooser, then the one-time code, then pay.",
    entry: "#/login",
    fromMerchant: true,
    seed: { loggedIn: false, registered: true, hasBalance: true, useGoogle: true, failFirstAuth: false },
  },
  {
    id: "register",
    number: 5,
    title: "Registration, then add a card",
    blurb: "Unrecognised email → sign up, verify, details, add a card, pay.",
    entry: "#/signup",
    fromMerchant: true,
    seed: { loggedIn: false, registered: false, hasBalance: false, useGoogle: false, failFirstAuth: false },
  },
  {
    id: "register-google",
    number: 6,
    title: "Registration via Google, then add a card",
    blurb: "Same as 5 but the account is created with Google.",
    entry: "#/signup",
    fromMerchant: true,
    seed: { loggedIn: false, registered: false, hasBalance: false, useGoogle: true, failFirstAuth: false },
  },
  {
    id: "auth-error",
    number: 7,
    title: "Error while authorizing the payment",
    blurb: "The first attempt fails with a mismatch error; the retry succeeds.",
    entry: "#/login",
    fromMerchant: true,
    seed: { loggedIn: false, registered: true, hasBalance: true, useGoogle: false, failFirstAuth: true },
  },
];

export const DEFAULT_SCENARIO = "logged-in";
