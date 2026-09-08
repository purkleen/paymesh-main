/** Three-step progress indicator used across the registration screens. */

import { icons } from "../icons.js";

const STEPS = ["Create account", "Verify email", "Your details"];

/** @param {number} current zero-based index of the active step */
export function stepper(current) {
  return `
  <nav class="stepper" aria-label="Registration progress">
    ${STEPS.map((label, i) => {
      const state = i < current ? "done" : i === current ? "current" : "todo";
      const dot = { done: icons.circleCheck, current: icons.circleDashed, todo: icons.circle }[state];
      return `<span class="step step--${state}" ${state === "current" ? 'aria-current="step"' : ""}>
                <span class="step__dot">${dot(20)}</span>${label}
              </span>`;
    }).join("")}
  </nav>`;
}
