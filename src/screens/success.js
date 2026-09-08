/** "Order complete!" — the end of every payment journey. */

import { shellRaw, esc, merchantName } from "../ui.js";
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
        <button class="btn btn--primary" data-action="back">Go back to ${esc(merchantName())}</button>
      </div>`,
    });
  },

  mount(root) {
    root.querySelector('[data-action="back"]').addEventListener("click", backToMerchant);

    // The `autoplay` attribute covers most cases; this catches the rest, and
    // rewinds so the animation always plays from the start on arrival.
    const video = root.querySelector("video");
    if (video) {
      video.currentTime = 0;
      video.play().catch(() => {
        /* autoplay blocked — the poster frame stands in */
      });
    }
  },
};
