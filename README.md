# Paymesh — interactive prototype

A clickable prototype of the Paymesh login, registration and payment flows,
built from the Figma source file. It covers the seven journeys drawn on the
canvas, end to end, with real form behaviour: validation, one-time codes,
password strength, card formatting, loading states and error recovery.

No build step, no dependencies — plain HTML, CSS and ES modules.

## The seven journeys

| # | Journey | Path through the prototype |
|---|---------|----------------------------|
| 1 | Log in from the Paymesh website | split-screen log in → one-time code → app home |
| 2 | Logged in, balance covers the order | payment → authorize → order complete |
| 3 | Logged out, balance covers the order | log in → code → payment → authorize → complete |
| 4 | Logged out, signs in with Google | Google chooser → confirm → code → payment → … |
| 5 | Registration, then add a card | sign up → create account → verify → details → account ready → payment → add card → top up → complete |
| 6 | Registration via Google, then add a card | sign up → Google → verify → details → account ready → payment → add card → … |
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
  `src/config.js`.
- The Paymesh app home (end of journey 1) is a placeholder frame in the source
  file, so it is deliberately minimal here.

## Prototype behaviour

- Any password is accepted; the one-time code is always `123456` and the
  **Fill code** button in the demo-inbox strip enters it for you.
- Nothing is sent anywhere. State lives in memory and `sessionStorage`, so a
  refresh keeps you in place and a new tab starts clean.
