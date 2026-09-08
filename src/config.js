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
  { country: "United Kingdom", postcode: "BS7 9QT", line1: "12 Marlow Gardens", line2: "", city: "Bristol", state: "Avon" },
  { country: "United Kingdom", postcode: "BS7 9QT", line1: "14 Marlow Gardens", line2: "", city: "Bristol", state: "Avon" },
  { country: "United Kingdom", postcode: "BS7 9QT", line1: "16 Marlow Gardens", line2: "Flat 2", city: "Bristol", state: "Avon" },
  { country: "United Kingdom", postcode: "BS7 9QT", line1: "18 Marlow Gardens", line2: "", city: "Bristol", state: "Avon" },
  { country: "United Kingdom", postcode: "BS1 4ND", line1: "3 Harbour Wharf", line2: "Apartment 401", city: "Bristol", state: "Avon" },
  { country: "United Kingdom", postcode: "BS1 4ND", line1: "5 Harbour Wharf", line2: "", city: "Bristol", state: "Avon" },
  { country: "United Kingdom", postcode: "E1 6AN", line1: "72 Brune Street", line2: "Unit 3", city: "London", state: "Greater London" },
  { country: "United Kingdom", postcode: "E1 6AN", line1: "74 Brune Street", line2: "", city: "London", state: "Greater London" },
  { country: "United Kingdom", postcode: "EC2A 4NE", line1: "120 Curtain Road", line2: "Second floor", city: "London", state: "Greater London" },
  { country: "United Kingdom", postcode: "M1 4ET", line1: "9 Ducie Street", line2: "", city: "Manchester", state: "Greater Manchester" },
  { country: "United Kingdom", postcode: "EH1 1TH", line1: "41 Cockburn Street", line2: "", city: "Edinburgh", state: "Midlothian" },

  { country: "Ireland", postcode: "D02 X285", line1: "18 Fitzwilliam Square", line2: "", city: "Dublin", state: "Leinster" },
  { country: "Ireland", postcode: "D08 KP68", line1: "5 Grand Canal Quay", line2: "Apartment 12", city: "Dublin", state: "Leinster" },

  { country: "France", postcode: "75011", line1: "34 Rue Oberkampf", line2: "", city: "Paris", state: "Île-de-France" },
  { country: "France", postcode: "75011", line1: "36 Rue Oberkampf", line2: "Étage 3", city: "Paris", state: "Île-de-France" },
  { country: "France", postcode: "69002", line1: "12 Quai Perrache", line2: "", city: "Lyon", state: "Auvergne-Rhône-Alpes" },

  { country: "Germany", postcode: "10437", line1: "22 Kastanienallee", line2: "", city: "Berlin", state: "Berlin" },
  { country: "Germany", postcode: "10437", line1: "24 Kastanienallee", line2: "Aufgang B", city: "Berlin", state: "Berlin" },
  { country: "Germany", postcode: "80331", line1: "7 Sendlinger Straße", line2: "", city: "Munich", state: "Bavaria" },

  { country: "Netherlands", postcode: "1016 EA", line1: "88 Prinsengracht", line2: "", city: "Amsterdam", state: "North Holland" },
  { country: "Netherlands", postcode: "3011 WN", line1: "15 Wijnhaven", line2: "Unit 4", city: "Rotterdam", state: "South Holland" },

  { country: "Poland", postcode: "00-020", line1: "12 Chmielna", line2: "", city: "Warsaw", state: "Masovia" },
  { country: "Poland", postcode: "31-008", line1: "6 Rynek Główny", line2: "Floor 2", city: "Kraków", state: "Lesser Poland" },

  { country: "Spain", postcode: "08003", line1: "9 Carrer del Rec", line2: "", city: "Barcelona", state: "Catalonia" },
  { country: "Spain", postcode: "28004", line1: "41 Calle de Fuencarral", line2: "Piso 2", city: "Madrid", state: "Madrid" },

  { country: "United States", postcode: "10013", line1: "155 Hudson Street", line2: "Suite 300", city: "New York", state: "NY" },
  { country: "United States", postcode: "10013", line1: "157 Hudson Street", line2: "", city: "New York", state: "NY" },
  { country: "United States", postcode: "94110", line1: "3120 Folsom Street", line2: "", city: "San Francisco", state: "CA" },
];

/**
 * Countries offered, with the dial code and flag their phone field uses and
 * the local name for a postcode.
 */
export const COUNTRIES = [
  {
    name: "United Kingdom", iso: "gb", dial: "+44", postcode: "postcode",
    phone: { min: 10, max: 10, groups: [4, 6], example: "7700 900123" },
  },
  {
    name: "Ireland", iso: "ie", dial: "+353", postcode: "postcode",
    phone: { min: 9, max: 9, groups: [2, 3, 4], example: "85 123 4567" },
  },
  {
    name: "France", iso: "fr", dial: "+33", postcode: "postal code",
    phone: { min: 9, max: 9, groups: [1, 2, 2, 2, 2], example: "6 12 34 56 78" },
  },
  {
    name: "Germany", iso: "de", dial: "+49", postcode: "postal code",
    phone: { min: 10, max: 11, groups: [3, 8], example: "151 23456789" },
  },
  {
    name: "Netherlands", iso: "nl", dial: "+31", postcode: "postal code",
    phone: { min: 9, max: 9, groups: [1, 8], example: "6 12345678" },
  },
  {
    name: "Poland", iso: "pl", dial: "+48", postcode: "postal code",
    phone: { min: 9, max: 9, groups: [3, 3, 3], example: "512 345 678" },
  },
  {
    name: "Spain", iso: "es", dial: "+34", postcode: "postal code",
    phone: { min: 9, max: 9, groups: [3, 3, 3], example: "612 345 678" },
  },
  {
    name: "United States", iso: "us", dial: "+1", postcode: "ZIP code",
    phone: { min: 10, max: 10, groups: [3, 3, 4], example: "555 123 4567" },
  },
];

export const countryByName = (name) =>
  COUNTRIES.find((c) => c.name === name) || COUNTRIES[0];

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
