# Paymesh — interactive prototype

A clickable prototype of the Paymesh login, registration and payment flows,
built from the Figma source file. It covers the seven journeys drawn on the
canvas, a top-up flow and the redesigned registration, end to end, with real
form behaviour: validation,
one-time codes,
password strength, card formatting, loading states and error recovery.

No build step, no dependencies — plain HTML, CSS and ES modules.

## The journeys

| # | Journey | Path through the prototype |
|---|---------|----------------------------|
| 1 | Log in from the Paymesh website | split-screen log in → one-time code → app home |
| 2 | Logged in, balance covers the order | payment → authorize → order complete |
| 3 | Logged out, balance covers the order | log in → code → payment → authorize → complete |
| 4 | Logged out, signs in with Google | Google chooser → confirm → code → payment → … |
| 5 | Registration, then add a card | sign up → create account → verify → details → account ready → payment → add card → top up → complete |
| 6 | Registration via Google, then add a card | sign up → Google → verify → details → account ready → payment → add card → … |
| 7 | Error while authorizing | payment → *Pay* fails with a mismatch error → retry succeeds |
| 8 | Logged in, balance falls short | payment → pick a saved card (or add one) to top up → authorize → complete |
| 9 | Registration — new version | sign up → create account → verify email → phone number → search for address → confirm address → verify identity → welcome → add card → payment (the split-payment widget, `/widget`) → complete order → order complete |

> **Journeys 1–8 are switched off for now.** Their screens and code are kept,
> but only journey 9 is offered. To bring one back, remove its id from
> `DISABLED_SCENARIOS` in `src/config.js`.

Switch journeys from the dropdown on the merchant page, from the **Journey n**
pill in the bottom-left corner, or with a query string:

```
/?journey=9
```

Add `?dev=0` to hide the prototype pill for a clean walkthrough or screen recording.

## Password

A password screen sits in front of the prototype (`src/screens/gate.js`).
Each browser is asked once; after that the unlock is remembered in
localStorage. The password is checked in the browser against a SHA-256 hash
(`ACCESS_PASSWORD_SHA256` in `src/config.js`), so it isn't readable in the
source — but it's a soft gate for sharing, not real security. To change it:

```bash
printf '%s' 'new-password' | shasum -a 256
```

and paste the result into `ACCESS_PASSWORD_SHA256`. For real protection, turn
on Vercel's Deployment Protection for the project.

## Menu of prototypes

After the password, opening the site's plain address shows a text-only menu
(`#/menu`, `src/screens/menu.js`). It links to the registration journey,
the payment widget (`/widget`), the newest payment widget (`/widget-new`) and
the payment widget scenarios (`/widget-scenarios`, every scenario and state of
Figma node 499:3741, picked with `?scenario=1|2|3&state=a|b|c`) and the wallet
dashboard (`/dashboard`, Figma node 646:16528 — see below) on:

- **main** — the production site, https://paymesh-main.vercel.app
- **every other branch** — read live from the GitHub API, so a branch appears
  as soon as it's pushed, linked to the Vercel deployment of its latest commit
  ("Building…" or "Not deployed yet" until there is one)

Deep links such as `/?journey=9` skip the menu; the dev panel's **Menu**
button goes back to it, and its **Wallet** button opens the wallet dashboard. Branch previews live on their own `vercel.app`
addresses, so the password is asked again there, and Vercel may ask for a
Vercel login first, depending on the project's Deployment Protection setting.

## Wallet dashboard

`dashboard.html` is the logged-in wallet home from the *Work in progress* file
(node 646:16528, "Desktop-large (XL)"), in the dark theme: side menu, balance
and recent transactions. Code in `src/screens/dashboard.js`, styles at the end
of `styles/ds.css` (`.db-*`, with the dark values of the colour variables).

- **Stealth Mode**: tapping the balance (or the eye) hides it the way the
  60fps *Hide Sensitive Number* does — the figures dissolve into five
  shimmering stars (thin small ones over the other currency) and come back
  on the next tap. It hides every transaction amount too — Home, the
  Transactions page, Recipients' totals and the details page — with the
  snippet's small stars at a fixed width, so lists don't shift, and stays on
  between pages; see *Hide sensitive number* below; the arrows swap whether it leads with
  US dollars or USDT.
- Transaction rows use the frame's hover (row 2) and pressed (row 3) colours.
- **See all** and the menu's **Transactions** open the Transactions page
  (`#transactions`, Figma node 1141:4323): the list grouped by day (Today,
  Yesterday, 20 October, Friday), a search that filters as you type (names,
  amounts, dates and day headings) — the design system's Search component
  (*Paymesh Design System* node 1484:15499: a 2px focus border and a close
  button that clears it, also used on Recipients) — the **All / In / Out** badges,
  **Filters**, which shows and hides those badges, and **Sort by date**, a
  menu of newest / oldest first and largest / smallest amount (sorting by
  amount drops the day headings). The frame dates every row 13 Oct 2026; here each row
  takes its group's date.
- The data is 20 example recipients, 10 people and 10 businesses
  (`RECIPIENT_LIST` in `src/screens/dashboard.js`), and 13 transactions with
  13 of them over the last 60 days: two today, two yesterday ("today" is
  13 Oct 2026). The transactions are random but come from a fixed seed, so
  every visit shows the same history. Home runs **Paymesh balance**, the latest five transactions, a row of
  **payees** (everyone you've paid, most recently paid first, names on up to
  two lines; the four most recent on phones; **See all** opens Recipients,
  and a payee opens their transactions) and **Analysis**; the
  recipients without a transaction say "No transactions yet". Airbnb keeps its logo;
  everyone else has an initials avatar in one of eight colours (red,
  orange, yellow, green, teal, blue, purple, pink — `--avatar-*` in
  `styles/ds.css`), taken in turn A–Z.
- At the bottom of Home, **Analysis** shows what was spent: Bencho's
  *Stacked bars* (MIT, bencho.dev/licence) ported from React + framer-motion
  to a plain module in `src/components/stacked-bars.js`, styles under `.stb`
  at the end of `styles/ds.css`. The total spent, **Week** / **Month**, and
  one bar per day in the brand colour for what was spent that day (there are
  no spending categories yet, so nothing is stacked). Week is the last 7
  days and Month the last 30, so a day never changes; run along it for the
  day and its total. It has no card of its own (`inline` in the component).
  The figures are seeded example data, not the transaction list. Text uses
  the design system's styles, and Bencho's tokens are mapped onto the
  dashboard's, so both themes work.
- Any transaction, on Home or the Transactions page, opens its **details**
  (`#tx/<id>`): the checkout's "Order complete" receipt (Figma node
  1147:5103) inside the dashboard — "Payment sent" or "Payment received",
  the amount in dollars and USDT, from and to (your wallet and the
  recipient, with their avatar), the time in UTC and a transaction ID that
  copies in full. Its button goes back to the list the transaction came
  from, and the menu keeps Transactions selected. The checkout's merchant
  bar and legal footer are left out; the dashboard's own header and menu
  stand in. Each ID is 24 digits worked out from the transaction, so it
  stays the same between visits.
- **Recipients** (`#recipients`, not in Figma yet) lists all 20 recipients,
  A–Z under a heading per first letter, with the total of their
  transactions, last transaction date and transaction count. Like
  Transactions, its title sits level with the top of the menu. Its search filters as you type; picking
  someone opens Transactions searched to them.
- **Light mode** in the menu (above Settings) switches the dashboard to the
  design system's light colours, and **Dark mode** switches back; the
  browser remembers the choice. Icons are masks in the theme's icon colour,
  so one set of SVGs serves both. The rise and fall colours have no light
  value in Figma yet, so light mode uses #15803d and #d92d20.
- **Cards** and **Settings** aren't designed yet and say so. **Fold menu** collapses the menu to its icons;
  **Log out** returns to the menu of prototypes.
- Under 1000px the menu is icons only. On phones (640px and under) it moves
  behind a hamburger button next to the avatar, opening as a full-screen
  sheet under the header (links and Escape close it).
- **Add funds** sits under the balance, on every screen size (across the
  column on phones). Its page (`#add-funds`) isn't designed yet and says so.

## Hide sensitive number (Stealth Mode)

`stealth.html` (also in the menu of prototypes) is the 60fps snippet *Hide
Sensitive Number Interaction*, from the shot
[family-stealth-mode-shimmer-effect-interaction](https://60fps.design/shots/family-stealth-mode-shimmer-effect-interaction),
ported from SwiftUI: a $588.04 balance that, when tapped, dissolves into five
rounded stars with a soft highlight sweeping across them, while the dollar
change folds away and only the percentage stays. Tap again to bring it back.

The motion is the snippet's: SwiftUI's `.easeInOut(duration: 0.15)` as
`cubic-bezier(0.42, 0, 0.58, 1)` over 150ms (100ms linear under Reduce
Motion, which also drops the scale, the change row's animation and the
sweep), the number scaling to 0.96, the change folding from 49px to 0, and a
1.6s sweep drawn at up to 60fps from the moment of the tap. Component in
`src/components/hide-sensitive-number.js`, styles under `.hsn` in
`styles/ds.css`.

The wallet dashboard's balance uses the same stars (`privacyStars` from that
module) and the same timing to hide its figures, with the snippet's greys
mirrored in dark mode so the stars stay as quiet against black as they are
against white. There the stars are drawn as Rebond Grotesque Bold's asterisk —
the balance's own typeface — rather than the snippet's rounded spokes, in
the same places, at the same size, with the same greys and sweep.

## Running it locally

Any static server will do — ES modules will not load over `file://`. The
included one turns off browser caching, so edits show up on a normal refresh:

```bash
python3 serve.py
```

Then open http://localhost:4321 (`python3 serve.py 4322` for another port).
Plain `python3 -m http.server` works too, but the browser may keep serving old
JavaScript after a change until you hard-refresh (Cmd+Shift+R).

## Deploying to Vercel

The repo is a static site with no build step.

```bash
npx vercel deploy --prod
```

Or connect the GitHub repo in the Vercel dashboard and accept the defaults:
framework **Other**, build command empty, output directory `.`.

**Web Analytics** is wired up with the script tag at the bottom of
`index.html` — the static-site route, since there's no bundler for the
`@vercel/analytics` package. Turn it on under the project's Analytics tab and
it starts collecting on the next deploy. The script 404s on a local server,
which is expected and harmless.

## Layout

```
index.html            page shell, fonts, entry point
styles/app.css        design tokens + every component style (journeys 1–8)
styles/ds.css         Paymesh Design System tokens and components (journey 9)
src/
  main.js             route table and boot
  router.js           hash router
  store.js            prototype state (mirrored into sessionStorage)
  flow.js             journey transitions — every flow lives here
  config.js           demo data: merchant, order, users, cards, scenarios
  ui.js               page chrome, form controls, formatting helpers
  ds.js               design-system component builders (journey 9)
  icons.js            Paymesh logo (exported from Figma) and UI glyphs
  devpanel.js         the journey switcher
  screens/            one module per screen
  screens/v2/         the redesigned registration (register.js, checkout.js)
assets/               logo, 3D check illustration, split-login artwork
assets/ds/            icons and illustrations exported from the design system
```

## The design system (journey 9)

Journey 9 is built from the Figma page **Registration new version** in the
*Paymesh Design System* file, and uses the file's variables and components
rather than one-off styles:

- **Tokens** — `styles/ds.css` declares the Figma variables as CSS custom
  properties with matching names: `text/primary` → `--text-primary`,
  `action/primary/default` → `--action-primary-default`, `spacing/16` →
  `--spacing-16`, `radius/xl` → `--radius-xl`, and the type styles
  (`Heading/3XL/Bold` → `--heading-3xl`, `Button/L` → `--button-l`, …).
  Component styles only reference these tokens.
- **Components** — `src/ds.js` has one builder per Figma component: `page`
  (navigation + Main Content + footer-info), `button`, `input`, `select`,
  `phoneInput` (Phone number), `otp` (OTP-input), `checkbox`, `merchantLogo`,
  `paymentValue`, `merchantPayment`. The payment widget, radio group item,
  payment list item, info box and confirmation list item are styled in
  `ds.css` under the same names.
- **Assets** — icons and illustrations are the design system's own exports
  (`assets/ds/`), not redrawn.

Validation reuses `ui.js` (`showError`, `formAlert`, …), so the
never-disabled-button pattern below applies here too.

Where the Figma frames are placeholders or inconsistent, the prototype makes
a call: the address form adds the postcode field the design left out (its
"County" field showed a postcode), "Remaining balance" shows the real amount
due, the receipt's button returns to the merchant, and the checkbox's checked
state uses the brand colour rather than the component's leftover purple.

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
- The merchant is Airbnb, matching the payment screens in the Figma file. Its
  name, logo and colour are one object (`MERCHANT`) in `src/config.js`, so
  swapping in a different merchant is a single edit.
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

- Any password is accepted, and any six digits pass the one-time-code screen.
- Changing the country of residence updates the phone field's flag and dial
  code, and what the address field calls a postcode — "postcode" in the UK and
  Ireland, "ZIP code" in the US, "postal code" elsewhere. Countries and those
  four values live in `COUNTRIES` (`src/config.js`); the flags are drawn inline
  in `src/icons.js`.
- The phone field accepts digits only, capped and grouped to the selected
  country's format (10 digits as `7700 900123` in the UK, 9 as
  `6 12 34 56 78` in France, and so on). Formats live in `COUNTRIES`.
- The postcode field suggests addresses after two characters and fills the
  street, city and state when you pick one. Suggestions are scoped to the
  selected country and never come back empty — close matches first, the
  country's other addresses otherwise. Type `bs7`, `10013`, or anything at all.
  The list is `DEMO_ADDRESSES` in `src/config.js`.
- When the balance falls short, the payment sheet lists the wallet's cards and
  asks for one to be chosen; **Add new card** appends a card built from the
  digits you type and selects it. Cards live in `SAVED_CARDS` (`src/config.js`).
- Nothing is sent anywhere. State lives in memory and `sessionStorage`, so a
  refresh keeps you in place and a new tab starts clean.
