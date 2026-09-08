/**
 * The verification email.
 *
 * Sits between entering credentials and the one-time-code screen, mirroring
 * the browser frame in the Figma file: a mail client open on the message
 * Paymesh just sent, with the code in it.
 *
 * The mail client's own branding is generic on purpose — change it in
 * `MAIL_CLIENT` (src/config.js).
 */

import { logo, mark } from "../icons.js";
import { esc } from "../ui.js";
import { VERIFICATION_EMAIL as MAIL, MAIL_CLIENT } from "../config.js";
import { emailRead } from "../flow.js";

/* Small glyphs used by the mail chrome. */
const g = (body, size = 18) =>
  `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor"
        stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;

const glyph = {
  menu: g(`<path d="M4 7h16M4 12h16M4 17h16"/>`),
  search: g(`<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/>`),
  inbox: g(`<path d="M3 13h5l1.5 2.5h5L16 13h5"/><path d="M4.6 5.4 3 13v5.5h18V13l-1.6-7.6H4.6Z"/>`),
  star: g(`<path d="m12 4 2.4 5 5.4.7-3.9 3.7 1 5.4-4.9-2.7-4.9 2.7 1-5.4L4.2 9.7 9.6 9 12 4Z"/>`),
  clock: g(`<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 1.8"/>`),
  send: g(`<path d="M4 12 20 5l-7 15-2.5-6L4 12Z"/>`),
  draft: g(`<path d="M6 3.5h7.5L19 9v11.5H6Z"/><path d="M13.5 3.5V9H19"/>`),
  spam: g(`<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V13m0 3.2v.4"/>`),
  trash: g(`<path d="M4.5 6.5h15M9 6.5V4h6v2.5M6.5 6.5 7.5 20h9l1-13.5"/>`),
  tag: g(`<path d="m11 3.5 9.5 9.5-7.5 7.5L3.5 11V3.5H11Z"/><circle cx="7.5" cy="7.5" r="1.2"/>`),
  chevronDown: g(`<path d="m7 10 5 5 5-5"/>`, 16),
  archive: g(`<rect x="3.5" y="4.5" width="17" height="4"/><path d="M5 8.5V19h14V8.5M10 12h4"/>`),
  mailOpen: g(`<path d="M3.5 10 12 4l8.5 6v9.5h-17Z"/><path d="m3.5 10 8.5 6 8.5-6"/>`),
  checkCircle: g(`<circle cx="12" cy="12" r="8.5"/><path d="m8.5 12.2 2.4 2.4 4.6-4.8"/>`),
  move: g(`<path d="M4 6.5h6l1.5 2H20V18H4Z"/><path d="m13 13 3-3-3-3"/>`),
  more: g(`<circle cx="12" cy="5.5" r="1.3" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="12" cy="18.5" r="1.3" fill="currentColor" stroke="none"/>`),
  arrowLeft: g(`<path d="M20 12H4m0 0 6-6M4 12l6 6"/>`),
  arrowRight: g(`<path d="M4 12h16m0 0-6-6m6 6-6 6"/>`),
  reload: g(`<path d="M20 12a8 8 0 1 1-2.6-5.9M20 4v5h-5"/>`),
  lock: g(`<rect x="5" y="10.5" width="14" height="9" rx="2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>`, 14),
  print: g(`<path d="M7 9V4h10v5"/><rect x="4" y="9" width="16" height="7" rx="1.5"/><path d="M7 14h10v6H7Z"/>`),
  openNew: g(`<path d="M14 4h6v6"/><path d="m20 4-8 8"/><path d="M18 14v6H4V6h6"/>`),
  reply: g(`<path d="M9 7 4 12l5 5"/><path d="M4 12h9a6 6 0 0 1 6 6v1"/>`),
  plus: g(`<path d="M12 5v14M5 12h14"/>`),
};

const RAIL = [
  { icon: "inbox", label: "Inbox", count: MAIL_CLIENT.inboxCount, active: true },
  { icon: "star", label: "Starred" },
  { icon: "clock", label: "Snoozed" },
  { icon: "send", label: "Sent" },
  { icon: "draft", label: "Drafts", count: MAIL_CLIENT.draftCount },
  { icon: "spam", label: "Spam", count: MAIL_CLIENT.spamCount },
  { icon: "trash", label: "Trash" },
  { icon: "tag", label: "Categories" },
];

const TOOLBAR = ["archive", "spam", "trash", "mailOpen", "clock", "checkCircle", "move", "tag", "more"];

export default {
  render() {
    return `
    <div class="mailwin">

      <div class="mailwin__chrome">
        <span class="mailwin__dots"><i></i><i></i><i></i></span>
        <span class="mailwin__nav">
          <button data-action="continue" title="Back to Paymesh">${glyph.arrowLeft}</button>
          <span class="is-dim">${glyph.arrowRight}</span>
          <span class="is-dim">${glyph.reload}</span>
        </span>
        <span class="mailwin__url">${glyph.lock} ${esc(MAIL_CLIENT.domain)}</span>
        <span class="is-dim">${glyph.more}</span>
      </div>

      <div class="mailapp">
        <aside class="mailapp__rail">
          <div class="mailapp__brand">${glyph.menu}<span>${esc(MAIL_CLIENT.name)}</span></div>
          <button class="mailapp__compose">${glyph.plus} Compose</button>
          <nav>
            ${RAIL.map(
              (item) => `
              <span class="mailapp__link ${item.active ? "is-active" : ""}">
                ${glyph[item.icon]}
                <span>${esc(item.label)}</span>
                ${item.count ? `<b>${item.count}</b>` : ""}
              </span>`
            ).join("")}
          </nav>
        </aside>

        <main class="mailapp__main">
          <div class="mailapp__search">${glyph.search}<span>Search mail</span></div>

          <div class="mailapp__toolbar">
            <span class="is-dim">${glyph.arrowLeft}</span>
            <span class="mailapp__tools">${TOOLBAR.map((k) => `<span class="is-dim">${glyph[k]}</span>`).join("")}</span>
            <span class="mailapp__count">${esc(MAIL_CLIENT.pagination)}</span>
          </div>

          <article class="mailmsg">
            <header class="mailmsg__subject">
              <h1>${esc(MAIL.subject)}</h1>
              <span class="mailmsg__label">Inbox</span>
              <span class="mailmsg__label mailmsg__label--alt">Promotions</span>
              <span class="mailmsg__actions is-dim">${glyph.print}${glyph.openNew}</span>
            </header>

            <div class="mailmsg__from">
              <span class="mailmsg__avatar">${mark("#fff", 22)}</span>
              <span class="mailmsg__sender">
                <b>${esc(MAIL.sender)}</b>
                <span class="is-dim">&lt;${esc(MAIL.address)}&gt;</span>
                <span class="mailmsg__to">to me ${glyph.chevronDown}</span>
              </span>
              <span class="mailmsg__meta is-dim">
                ${esc(MAIL.time)} ${glyph.star} ${glyph.reply} ${glyph.more}
              </span>
            </div>

            <div class="mailmsg__body">
              <span class="logo">${logo()}</span>
              <p class="mailmsg__lede">Please enter this code to log in:</p>
              <p class="mailmsg__code">${esc(MAIL.code)}</p>
              <p class="mailmsg__expiry">${esc(MAIL.expiry)}</p>

              <footer class="mailmsg__footer">
                ${MAIL.company.map((line) => `<span>${esc(line)}</span>`).join("")}
                <a href="#" data-noop>${esc(MAIL.address)}</a>
              </footer>
            </div>
          </article>
        </main>
      </div>

      <button class="btn btn--primary mailwin__cta" data-action="continue">
        Back to Paymesh
      </button>
    </div>`;
  },

  mount(root) {
    root.querySelectorAll('[data-action="continue"]').forEach((b) =>
      b.addEventListener("click", emailRead)
    );
    // The code itself is the thing the buyer came for — clicking it moves on.
    root.querySelector(".mailmsg__code")?.addEventListener("click", emailRead);
  },
};
