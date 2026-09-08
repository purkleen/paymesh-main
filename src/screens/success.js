/** "Order complete!" — the end of every payment journey. */

import { shellRaw } from "../ui.js";
import { backToMerchant } from "../flow.js";

export default {
  render() {
    return shellRaw({
      content: `
      <div class="result" style="width:396px;max-width:100%">
        <video class="result__art" width="240" height="240" autoplay muted playsinline
               poster="assets/check-3d.png" aria-hidden="true">
          <source src="assets/success.mp4" type="video/mp4" />
        </video>
        <h1 class="result__title">Order complete!</h1>
        <p class="result__body">
          Your payment has been authorized and sent. A receipt is on its way to your inbox.
        </p>
        <button class="btn btn--primary" data-action="back">Go back to merchant page</button>
      </div>`,
    });
  },

  mount(root) {
    root.querySelector('[data-action="back"]').addEventListener("click", backToMerchant);
  },
};
