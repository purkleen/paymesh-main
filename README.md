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

- **Stealth Mode**: tapping the balance hides it the way the
  60fps *Hide Sensitive Number* does — the figures dissolve into five
  shimmering asterisks in the figures' own text style (`******` for the
  balance; a row's amount becomes `*******` in white and its USDT line goes
  blank, as frame 1174:6801 draws it) and come back
  on the next tap. It hides every transaction amount too — Home, the
  Transactions page, Recipients' totals and the details page — each in that
  amount's own text style, over it in the same spot so lists don't shift, and stays on
  between pages; see *Hide sensitive number* below; the arrows swap whether it leads with
  US dollars or USDT.
- Transaction rows use the frame's hover (row 2) and pressed (row 3) colours.
- **Transactions ›** on Home and the menu's **Transactions** open the
  Transactions page (`#transactions`, Figma nodes 1282:5368 / 1282:5698 in
  Section 1282:6150): a back arrow over the title, a search that filters as
  you type (names, amounts, dates and day headings — the design system's
  Search component, *Paymesh Design System* node 1484:15499, with a focus
  border and a close button that clears it), **All / Received / Sent**, then
  the list grouped by day (Today, Yesterday, 28 October). Dates no longer
  carry a time zone, money out is in the primary ink and money in green.
- The data is 20 example recipients, 10 people and 10 businesses
  (`RECIPIENT_LIST` in `src/screens/dashboard.js`), and 13 payments (plus one top-up, below) with
  13 of them over the last 60 days: two today, two yesterday ("today" is
  13 Oct 2026). The transactions are random but come from a fixed seed, so
  every visit shows the same history. Home is laid out from the frames *Desktop-large (XL)*
  1174:6581 (shown) and 1174:6801 (Stealth Mode): **Balance** (Rebond Bold
  40px, the cents in grey) with the other currency under it — tap the
  balance for Stealth Mode, the line under it to swap which currency leads —
  and a pill **Add funds**; **Transactions**, the latest five in a card;
  **Recent payees**, tiles of everyone you've paid, most recently paid
  first (four on phones; **See all** opens Recipients, a payee opens their
  transactions); and the spending chart in a card with no heading (as
  frame 1197:7204 draws it); the
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
  (`#tx/<id>`, Figma node 1197:7059): a back arrow, the party's avatar and
  name, the amount in dollars with USDT under it (hidden in Stealth Mode),
  then a **Transaction details** card — a green **Complete** status, from
  and to (your wallet and the party, with their avatar), the date, and a
  transaction ID and hash that each copy in full (the value gives way to a green
  "✓ COPIED!" for 3 seconds, nodes 1202:7583 / 1202:7732); money in, such as
  a top-up or a refund, shows its amount in green (#57D172) — then **Export PDF** (the
  browser's print dialog, printing the details alone, to save as PDF) and
  "Something wrong with this transaction? Request refund or contact our
  support" (those two pages aren't designed yet and say so). The back
  arrow returns to the list the transaction came from. Each ID is 24 digits
  and each hash 64 hex digits, both worked out from the transaction, so
  they stay the same between visits.
- On phones, Add funds, Pay with and a transaction's details are full
  screens, as the frames draw them: no header, a back arrow to leave, and
  the main button 16px from the foot of the screen. The details' layout
  follows node 1206:304 (Export PDF is the 44px Button M).
- **Recipients** (`#recipients`, node 1282:5481) lists all 20 recipients,
  A–Z under a heading per first letter, with the total of their
  transactions, last transaction date and transaction count, under a back
  arrow, the title and a search. Picking someone (here, on Home's payees or
  in Send again) opens **their page** (`#recipient/<name>`, node 1282:5589):
  their avatar and name, a search of their transactions ("Search
  transactions, dates"), and those transactions by day.
- **Light mode** in the menu (above Settings) switches the dashboard to the
  design system's light colours, and **Dark mode** switches back; the
  browser remembers the choice. Icons are masks in the theme's icon colour,
  so one set of SVGs serves both. The rise and fall colours have no light
  value in Figma yet, so light mode uses #15803d and #d92d20.
- **Settings** (`#settings`, node 1282:5026): cards of rows — Cards and Add
  card; Personal details, Security and Statements; Light / Dark mode and
  Home layout — and Log out at the foot. The frame's rows are placeholders
  ("Add card"), so these are the wallet's own; pages not designed yet say
  so. **Cards** isn't designed yet either. **Fold menu** collapses the menu to its icons;
  **Log out** returns to the menu of prototypes.
- Under 1000px the menu is icons only. On phones (640px and under) a menu
  button at the top right (node 1234:2620) opens the menu as a full-screen
  sheet under the header (the button, a link or Escape closes it).
- Home v1 follows node 1282:4883 (Section 1282:6150): the balance; an
  **Invite friends, earn £50** banner (its glass ring drawn in CSS, as
  Figma's image host is out of reach); **Transactions ›**, the three latest
  straight on the page; **Recent payees ›**; and **Spending analysis**. On
  phones, Transactions, Recipients, a recipient and Settings are full
  screens with a back arrow, like Add funds. Earlier, Home followed node 1234:2620: a plain white "Paymesh"; a big grey
  **Balance** (Rebond Semibold 40px) over the figure, the USDT line in
  Rebond Semibold 16px; transactions, payee tiles and the spending chart in
  bordered #161818 panels with 18px corners; on Home, money going out is in
  the primary ink with its cents in grey, and dates drop "UTC"; on phones,
  a soft glow of the brand colour behind the top.
- **Home layout** in the menu (v1 / v2) switches between two Homes; the
  browser remembers the choice. v1 is the one above. v2 is a second layout
  made from the same pieces to compare against it: the balance centred in a
  hero card (with a soft brand-colour glow inside) with **Add funds** and
  **See activity** under it; **Send again**, the people and places you last
  paid as bare avatars with first names in a sideways row; then **Latest**
  (the five newest transactions) and **Spending** (the chart). Stealth Mode,
  the currency swap and the shuffle work the same in both.
- The balance **shuffles** into place: its digits spin through random
  digits for a second (a new digit every 70ms) and land left to right
  (`src/components/shuffle-digits.js`) — on arriving at Home, on coming out
  of Stealth Mode and on swapping currency. Each digit holds its final
  width, so the figure doesn't jitter; Reduce Motion turns it off.
- One transaction is a **top-up** (node 1202:7506): $500 added this morning
  from the Visa, under your own name and avatar. Its details are green
  (+$500.00), from "Visa ending **** 4567" to your Paymesh wallet.

## Add funds

**Add funds**, under the balance, opens `#add-funds` (Figma nodes 1197:7118,
1197:7161, 1197:6978, 1197:7021, restyled by 1210:523 / 1211:1328) with the
keyboard already up: a bar with the back arrow and "Add funds" centred, then
the amount, with roughly the same amount in
the other currency under it ("≈ 25 USDT"); four preset amounts — **$25**,
**$50**, **$100**, **$500** — that type themselves in and light up while the
amount matches; **Pay with**, the card to charge in a
row that opens its own screen (`#pay-with`, node 1197:6932, "Add funds
with — Select payment method": the Visa the wallet is funded
from and the two saved cards, from `src/config.js`, each with its logo and
expiry and a tick by the chosen one, then **Add card**, whose page isn't
designed yet; picking a card comes back with it chosen and the amount still
there); and an **Add funds** button
that is never disabled. Over the limit ($10,000 a top-up) the line under the
amount turns red and says "Your limit is $10,000" as you type — past $50,000,
"Woah! It's way over $10,000 limit!" — and the button
does nothing; with nothing entered it asks for an amount. Otherwise it goes back to Home, since the payment
itself isn't designed yet.

The amount is the 60fps snippet *Comma Jump Number Input Interaction*
([family-number-input-commas-shift-place-interaction](https://60fps.design/shots/family-number-input-commas-shift-place-interaction)),
ported from SwiftUI. Each digit rises in from below at the end of the
number, and when the number gains a group of three the commas dip for a
moment and slide to their new places. Deleting walks it all back to $0.

The motion is the snippet's: `.spring(response: 0.22, dampingFraction:
0.88)` as a CSS `linear()` curve sampled from that spring, glyphs rising 75pt,
and the commas dipping 20pt on `.easeIn(0.08)` and `.easeOut(0.14)`. Reduce
Motion turns it off. What changed for Paymesh:
- it is typed on the phone's or computer's own keyboard, not an on-screen
  keypad, through an invisible field over the amount that opens the decimal
  keyboard
- it is set in Rebond Grotesque Bold, like the balance, the "$" as large
  as the digits
- the line under it, 24px under the digits and in the tertiary grey
  (`#97979D` in the dark theme), is the other currency, "≈ 1,234 USDT" (Inter Medium 15px), with the
  snippet's up-and-down arrows beside it. Here they swap which currency
  leads: the "$" sinks away and "USDT" rises in after the digits, on the
  same spring
- its red line is the top-up limit ("Your limit is $10,000", with the danger
  icon) in place of the other currency, rather than "Not enough ETH"

Component in `src/components/amount-input.js`, styles under `.ai` in
`styles/ds.css`.

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
against white. There the stars are "*****" set in the hidden figure's own text style —
its font, size, weight and colour, as the "••••••" was before — rather than
the snippet's drawn spokes; the sweep lifts each one toward the background
by as much as the snippet lightens it, on the same 1.6s cycle.

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
