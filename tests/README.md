# Tests

Black-box suites that drive the real API over HTTP. No test framework, no
dependencies beyond `curl` and `python3` — they run anywhere the app runs,
including against a deployed environment.

```bash
./tests/run-all.sh                              # throwaway DB on :4111
BASE=https://api.armut.com ./tests/run-all.sh   # against a deployment
```

| Suite | Checks | Covers |
|---|---|---|
| `store.sh` | 26 | signup, login, address CRUD, ordering, stock, validation |
| `consoles.sh` | 26 | vendor + admin APIs, role isolation, ownership scoping |
| `e2e.sh` | 111 | the whole marketplace lifecycle across all three roles, including moderation, vendor suspension and order cancellation |
| `password-reset.sh` | 15 | forgot-password link read out of the captured email, used once, then refused |
| `mail-resilience.sh` | 5 | checkout survives every SMTP failure mode |

`e2e.sh` is the one to read first. It walks the path a real marketplace lives:

1. **Admin** invites a vendor (vendors have no self-signup, by design)
2. **Vendor** logs in with those credentials and lists a product
3. **Customer** signs up, logs in, saves a delivery address
4. **Customer** orders the vendor's product
5. **Vendor** sees the order *with its delivery address* and ships it
6. **Vendor** uploads a real image file and edits the listing — both reach the storefront
7. **Customer** reviews the product; the aggregate rating recomputes
8. **Admin** adds a room, watches it reach the catalog and the vendor's category list
9. **Admin** flags the listing (it leaves the catalog and cannot be ordered), then reinstates it
10. A **cart spanning two vendors** splits into one order per vendor — each sees
    only their own half, both halves carry the address, neither can touch the other's
11. **Admin** sees the order in the overview, then suspends and removes the vendor
12. Both emails are captured off the wire and asserted

Money and totals are asserted for **internal consistency** — the admin's spend
figure is checked against the customer's own order history, and the vendor sales
roll-up against the vendor's own orders — rather than hardcoded numbers that go
stale the moment a test above places another order.

Cross-role isolation is asserted throughout: each token is rejected by the other
two subsystems.

One check is labelled `NOTE:` rather than being a pass/fail expectation of
correctness — it records that a review requires an **account but not a
purchase**. If you decide reviews should be verified-purchase-only, that is the
check to flip.

Every run uses fresh timestamped accounts, so the suites are safely re-runnable
against the same database.

## Running against a deployment

`BASE=... ./tests/run-all.sh` skips `mail-resilience.sh` (it restarts the API
with broken SMTP settings, which only makes sense locally). Everything else is
safe but **not read-only** — it creates accounts, places orders and deletes the
vendor it created. Point it at staging, not production.

## Design and accessibility audits

Four static/rendered checks, each exiting non-zero on a finding:

| Check | What it catches |
|---|---|
| `check-imports.py` | named imports a module does not export (a bundler resolves these to `undefined` rather than failing the build) |
| `responsive-audit.py` | fixed widths, min-widths and non-reflowing grids that overflow a 375px viewport |
| `contrast-audit.py` | palette pairings below the WCAG AA minimum, in both themes (`light` \| `dark`) |
| `a11y-audit.py` | rendered markup: alt text, accessible names, labels, heading order, duplicate ids, landmarks |
| `mock-mode.mjs` | the development data source — 28 checks driving the mock engine directly, since a build cannot tell you whether its branches still run |

```bash
python3 tests/check-imports.py
python3 tests/responsive-audit.py
python3 tests/contrast-audit.py light
python3 tests/contrast-audit.py dark
python3 tests/a11y-audit.py http://localhost:3111   # needs the app running
node tests/mock-mode.mjs
```

## Accessibility audit

`a11y-audit.py` fetches each route from a running server and checks the real
rendered markup — not the source — for images without alt text, controls with no
accessible name, form fields with no label, skipped heading levels, duplicate
ids and missing landmarks.

```bash
python3 tests/a11y-audit.py http://localhost:3111
```

It exits non-zero on any finding, so it can gate a deploy.

## Static check

`check-imports.py` scans every `.jsx` file for named imports the target module
does not export. A bundler resolves those to `undefined` at runtime rather than
failing the build, so they survive `npm run build` and only show up as a
component that silently renders unstyled or blank.

```bash
python3 tests/check-imports.py
```

It caught exactly that: after a shared shell was rewritten, three admin dialogs
were importing style objects that no longer existed.

## Screenshots

`screenshot.mjs` drives headless Chrome over the DevTools protocol, so pages
can be rendered at a given viewport — including signed-in ones, by running a
snippet to seed the session before navigating.

```bash
google-chrome --headless --disable-gpu --no-sandbox \
  --remote-debugging-port=9222 --user-data-dir=/tmp/chrome-profile about:blank &

node tests/screenshot.mjs http://localhost:3111/ home.png 1440 1600
node tests/screenshot.mjs http://localhost:3111/vendor vendor.png 1440 1400 \
  "localStorage.setItem('armut.session.vendor', JSON.stringify(SESSION))"
```

Rendering found things no static check did: nine dead image URLs, a room tile
showing the wrong room, a nav rail clipping a word with no scroll affordance,
and an orphaned stat tile at middling widths.

## Helpers

- `e2e_pick.py` — pulls one value out of a JSON response, keeping quoting out of the shell.
- `smtp-sink.js` — a ~25-line SMTP server that accepts any message and appends it
  to a log, so email can be asserted without a provider.

## Catalogue imagery

`python3 tests/images-audit.py [--live] [--no-net]`

Two products sharing one photograph, or a hot-linked URL withdrawn upstream,
make a storefront look scraped rather than shot — and neither shows up in a
build. This checks the seed and the mock fixtures; `--live` adds the running
API's catalogue, `--no-net` skips the liveness requests.

`run-all.sh` runs it with `--no-net`, because whether a third-party URL is
still alive is not something a suite should fail on when the network is down.
Run the full sweep by hand:

    python3 tests/images-audit.py --live

## Motion

`node tests/motion-audit.mjs`

Whether auto-moving content can be stopped is behaviour, not markup, so this
drives a real browser: it needs Chrome on `--remote-debugging-port=9222` and
the site on :3000, and skips itself cleanly when there is no browser. It
checks that the hero has a pause control, that pausing really stops the
rotation, that resuming restarts it, that choosing a slide keeps it, and that
`prefers-reduced-motion: reduce` never rotates at all.

WCAG 2.2.2 asks for a mechanism to pause anything that moves by itself for
more than five seconds. Pausing on hover is not that mechanism, and no parser
can tell the two apart — which is why this one has to click things.
