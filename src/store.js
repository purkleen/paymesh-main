/**
 * Prototype state.
 *
 * One mutable object plus a subscribe/notify pair. State is mirrored into
 * sessionStorage so a refresh keeps you where you were mid-journey.
 */

import {
  SCENARIOS,
  DEFAULT_SCENARIO,
  RETURNING_USER,
  ORDER,
  MERCHANT,
  TOPUP_CARD,
} from "./config.js";

const KEY = "paymesh.prototype.v1";

const listeners = new Set();

function blankState(scenarioId) {
  const scenario = SCENARIOS.find((s) => s.id === scenarioId) || SCENARIOS[0];
  const seed = scenario.seed;

  return {
    scenarioId: scenario.id,

    /** Session / identity */
    session: {
      loggedIn: seed.loggedIn,
      verified: seed.loggedIn,
      email: seed.registered ? RETURNING_USER.email : "",
      name: seed.registered ? RETURNING_USER.name : "",
      firstName: seed.registered ? RETURNING_USER.firstName : "",
      viaGoogle: false,
    },

    /** Wallet */
    wallet: {
      registered: seed.registered,
      balance: seed.hasBalance ? RETURNING_USER.balance : 0,
      fundingCard: seed.registered ? RETURNING_USER.fundingCard : null,
      topupCard: null,
      address: seed.registered ? { ...RETURNING_USER.address } : null,
    },

    /** The order handed over by the merchant (null in the direct-login journey) */
    order: scenario.fromMerchant
      ? { merchant: MERCHANT, amount: ORDER.total, token: ORDER.token }
      : null,

    /** Journey flags */
    flow: {
      fromMerchant: scenario.fromMerchant,
      useGoogle: seed.useGoogle,
      failFirstAuth: seed.failFirstAuth,
      authAttempts: 0,
      registering: !seed.registered,
      /** where the one-time-code screen should go once the code is accepted */
      otpNext: null,
      /** scratch space for multi-step forms */
      draft: {},
    },
  };
}

let state = load() || blankState(DEFAULT_SCENARIO);

function load() {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function persist() {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* private browsing — the prototype still works, it just won't survive a refresh */
  }
}

export function getState() {
  return state;
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function notify() {
  persist();
  listeners.forEach((fn) => fn(state));
}

/** Shallow-merge a patch into one top-level slice of state. */
export function update(slice, patch) {
  state[slice] = { ...state[slice], ...patch };
  notify();
}

export function setScenario(id) {
  state = blankState(id);
  notify();
}

/** Restart the current scenario from its first screen. */
export function resetScenario() {
  setScenario(state.scenarioId);
}

export function currentScenario() {
  return SCENARIOS.find((s) => s.id === state.scenarioId) || SCENARIOS[0];
}

/** True when the wallet balance alone can settle the order. */
export function balanceCovers() {
  if (!state.order) return true;
  return state.wallet.balance >= state.order.amount;
}

/** The shortfall the buyer has to top up with a card. */
export function shortfall() {
  if (!state.order) return 0;
  return Math.max(0, state.order.amount - state.wallet.balance);
}

/** Mark the wallet as funded by the card added during registration. */
export function attachTopupCard() {
  update("wallet", { topupCard: { ...TOPUP_CARD } });
}
