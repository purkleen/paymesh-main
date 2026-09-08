/** Three-step progress indicator used across the registration screens. */

import { icons } from "../icons.js";

const STEPS = ["Create account", "Verify email", "Your details"];

/** @param {number} current zero-based index of the active step */
export function stepper(current) {
  return `
  <nav class="stepper" aria-label="Registration progress">
    ${STEPS.map((label, i) => {
      const state = i < current ? "done" : i === current ? "current" : "todo";
      const dot =
        state === "done"
          ? `<span class="step__dot" style="color:var(--brand)">${icons.checkCircle(18)}</span>`
          : `<span class="step__dot"></span>`;
      return `<span class="step step--${state}" ${state === "current" ? 'aria-current="step"' : ""}>
                ${dot}${label}
              </span>`;
    }).join("")}
  </nav>`;
}
