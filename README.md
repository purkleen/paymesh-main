# Paymesh — interactive prototype

A clickable prototype of the Paymesh login, registration and payment flows,
built from the Figma source file. It covers the seven journeys drawn on the
canvas, end to end, with real form behaviour: validation, one-time codes,
password strength, card formatting, loading states and error recovery.

No build step, no dependencies — plain HTML, CSS and ES modules.

## The seven journeys

| # | Journey | Path through the prototype |
|---|---------|----------------------------|
| 1 | Log in from the Paymesh website | split-screen log in → verification email → one-time code → app home |
| 2 | Logged in, balance covers the order | payment → authorize → order complete |
| 3 | Logged out, balance covers the order | log in → email → code → payment → authorize → complete |
| 4 | Logged out, signs in with Google | Google chooser → confirm → email → code → payment → … |
| 5 | Registration, then add a card | sign up → create account → email → verify → details → account ready → payment → add card → top up → complete |
| 6 | Registration via Google, then add a card | sign up → Google → email → verify → details → account ready → payment → add card → … |
| 7 | Error while authorizing | payment → *Pay* fails with a mismatch error → retry succeeds |

Switch journeys from the dropdown on the merchant page, from the **Journey n of 7**
pill in the bottom-left corner, or with a query string:

```
/?journey=5
```

Add `?dev=0` to hide the prototype pill for a clean walkthrough or screen recording.

## Running it locally

Any static server will do — ES modules will not load over `file://`.

```bash
python3 -m http.server 4321
```

Then open http://localhost:4321.

## Deploying to Vercel

The repo is a static site with no build step.

```bash
npx vercel deploy --prod
```

Or connect the GitHub repo in the Vercel dashboard and accept the defaults:
framework **Other**, build command empty, output directory `.`.

## Layout

```
index.html            page shell, fonts, entry point
styles/app.css        design tokens + every component style
src/
  main.js             route table and boot
  router.js           hash router
  store.js            prototype state (mirrored into sessionStorage)
  flow.js             journey transitions — the seven flows live here
  config.js           demo data: merchant, order, users, cards, scenarios
  ui.js               page chrome, form controls, formatting helpers
  icons.js            Paymesh logo (exported from Figma) and UI glyphs
  devpanel.js         the journey switcher
  screens/            one module per screen
assets/               logo, 3D check illustration, split-login artwork
```

### Where to change things

- **Amounts, names, merchant, cards, the demo code** — `src/config.js`.
- **Colours, radii, type** — the `:root` block at the top of `styles/app.css`.
- **What happens after a screen** — `src/flow.js`, never the screens themselves.

## Notes on fidelity

- Colours, radii, spacing and the type ramp are taken from the Figma file
  (brand `#503ff1`, card surface `#efeded`, borders `#d4d4d4`, error `#ea4335`).
- Headings in the source use **Rebond Grotesque**, a licensed typeface. The CSS
  asks for it first and falls back to Space Grotesk, so the real face appears
  automatically once the licence is added. Body copy is Inter, as designed.
- The merchant checkout is a neutral stand-in ("Lumen Market"), not the real
  retailer used as a backdrop in the file, so the prototype can be shared and
  deployed without borrowing another company's branding. Change it in
  `src/config.js`. The mail client on the verification-email screen is generic
  for the same reason — its layout matches the frame, its branding does not.
- The Paymesh app home (end of journey 1) is a placeholder frame in the source
  file, so it is deliberately minimal here.

## Buttons and errors

Buttons are never disabled. Every primary action stays in its active state, and
pressing one before it can succeed reports the reason in an error status
directly beneath it — a missing card on the payment sheet, an incomplete
one-time code, empty required fields on a form (which are also outlined in
red). The one exception to instant feedback is the brief `Authorizing…` loading
state, which ignores repeat presses without dimming the button.

`formAlert()` / `showFormError()` / `clearFormError()` in `src/ui.js` provide
this pattern; use them on any new screen with a primary action.

## Prototype behaviour

- Any password is accepted, and any six digits pass the one-time-code screen —
  including the `123456` shown in the verification email.
- The verification email step shows the message inside a mail client. **Back to
  Paymesh** (or clicking the code) returns to the code screen. The email's
  contents live in `VERIFICATION_EMAIL`, the mail client's branding in
  `MAIL_CLIENT` — both in `src/config.js`.
- The postcode field suggests addresses as you type and fills the street, city
  and state when you pick one. It searches a fixed list in `src/config.js`
  (`DEMO_ADDRESSES`) — try `bs7`, `e1`, `m1` or a street name.
- Nothing is sent anywhere. State lives in memory and `sessionStorage`, so a
  refresh keeps you in place and a new tab starts clean.
