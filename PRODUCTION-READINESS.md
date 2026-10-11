# Armut — production readiness

Status as of 2026-09-23. Every item below was verified by running it, not by reading code.

## Verification

Run everything with `./tests/run-all.sh` (starts its own throwaway API), or
`BASE=https://api.armut.com ./tests/run-all.sh` against a deployment.

| Suite | Checks | Result |
|---|---|---|
| Storefront API (`tests/store.sh`) | 26 | pass |
| Vendor + admin API (`tests/consoles.sh`) | 26 | pass |
| **Full lifecycle, all 3 roles (`tests/e2e.sh`)** | **111** | **pass** |
| Password reset by email (`tests/password-reset.sh`) | 15 | pass |
| Email resilience (`tests/mail-resilience.sh`) | 5 | pass |
| Production build (`npm run build`) | — | compiles, 28 routes |
| ESLint (whole project) | — | 0 errors |
| Docker: both images build, run non-root, healthchecks green | — | pass |
| Full suite against the **container** | 52 | pass |

Note: vendors have **no self-signup** — by design, an admin invites them. The
e2e suite tests that invite path as the vendor's real entry point.

**183 checks total.** `tests/e2e.sh` walks the path a real marketplace lives:
admin invites a vendor → vendor logs in and lists a product → customer signs up,
logs in, saves an address and orders it → vendor sees the order *with its
delivery address* and ships it → admin sees it in the overview → both emails are
captured off the wire and asserted. See `tests/README.md`.

## What you asked for

### Sign up / log in
bcrypt passwords, JWT bearer tokens, three isolated scopes (store / vendor / admin) —
a token for one scope cannot reach another's routes (tested). Credential endpoints
are rate limited (10 attempts per 15 min per IP+email). Suspended vendors cannot
log in.

### Address management
`addresses` table, `GET/POST/PUT/DELETE /api/v1/addresses`, ownership-scoped.
One default per customer, first address auto-default, default inherited on delete,
20-address cap. Managed from **two** places: inside checkout, and on the new
`/account` page (add / edit / remove / make default).

### Order placement
Address is persisted on the order. Availability and stock are validated, stock is
decremented, products that sell out flip to "Out of stock". A multi-vendor cart
splits into one order per vendor and every id is returned. Customers see their
history on `/account`; vendors see each order **with its delivery address**.

### Admin email on every order
`nodemailer` over SMTP. Admins get a "New order #… " alert; the customer gets a
confirmation (the success modal had always claimed one was sent). Recipients come
from `ADMIN_NOTIFY_EMAILS`, falling back to every admin account in the database.

Sending is best-effort and **cannot break checkout** — verified against five
failure modes: no SMTP configured, unreachable host, non-numeric port,
unresolvable hostname, and no recipients. All five still return HTTP 200 with a
placed order; the failure is logged.

### Password reset (added 2026-09-23)
"Forgot password?" on sign-in → `/forgot-password` → emailed link →
`/reset-password?token=…` → new password, signed straight in. The API answers
identically for known and unknown addresses, stores only a SHA-256 of the
token, expires it after an hour, and lets it work once. A welcome email goes
out on sign-up and a "password changed" notice after a reset.
`tests/password-reset.sh` (15 checks) reads the link out of the captured email
and uses it.

### Dokploy deployment
`docker-compose.yml` (two services, required-variable guards, named volumes for
the SQLite file and uploads), a multi-stage `Dockerfile` for each service, and
`DEPLOY.md` with the walkthrough, env table, backup procedure and SMTP notes.

## Bugs found and fixed along the way

1. **Orders silently discarded the delivery address.** The frontend sent it; the
   backend never read it. Every order ever placed had `address = NULL`.
2. **Vendors could not see where to ship.** Order payloads carried no address, so
   the fulfilment screen was unusable for its actual purpose.
3. **Live products returned 404.** Home, `/category` and `/product/[id]` were
   server-rendered from the mock fixtures, so any product not in the fixtures
   404'd and crawlers saw fake data.
4. **`npm run seed` wiped the database unconditionally.** Running it on a live
   deploy would have deleted every order and customer. It now refuses a non-empty
   database; `npm run reset` is the explicit destructive path.
5. **A broken SMTP config could 500 a committed order** — the customer would be
   told checkout failed for an order that exists.
6. **Products saved without a photo got a random Unsplash stock image** injected
   from the mock fixtures.
7. **The dev mock/live switch shipped in production builds.** Now compiled out.
8. **`JWT_SECRET` fell back to a published dev string.** Production now refuses
   to boot without a real one (32+ chars).
9. Vendor profile save could 500 on a duplicate email → proper 409/422.
10. The product form's "Assign color…" select did nothing → removed.
11. The product form silently no-op'd on invalid input → now says why.

## Before you go live

1. Set every variable in `.env.deploy.example` — `JWT_SECRET`, `CORS_ORIGIN`,
   `SITE_URL`, `API_PUBLIC_URL` are required and the stack refuses to start without them.
2. Run `node src/seed.js` **once** in the api container, then change the three
   seeded passwords (`admin123` / `vendor123` / `client123`) from the consoles.
3. Point SMTP at a domain you control, with SPF and DKIM set up for `MAIL_FROM`.
4. Set up a backup for the `armut-data` volume — `DEPLOY.md` has the hot-copy command.
5. Keep the `api` service at **one replica**. SQLite is a single file on a volume;
   scaling it horizontally would corrupt the database. Scale `web` instead.

## Imagery is hot-linked from Unsplash

All seeded product, room and banner imagery points at images.unsplash.com.
Nine of those photos had already been removed upstream, which rendered as
broken tiles and bare alt text until they were remapped. Before launch this
should be replaced with owned photography served from your own domain or CDN:
third-party images can disappear without notice, are slow from some regions,
and carry no guarantee of continued availability.

Components now degrade gracefully when an image fails — `components/ui/Thumb.jsx`
falls back to the same placeholder used when a product has no image — but that
is a safety net, not a substitute for owning the assets.

## Known gaps — product decisions, not defects

- **No payment integration.** "Confirm & Pay" places the order without charging.
- **A password reset does not sign out other devices.** Sessions are 30-day
  stateless JWTs; a reset stops the old password working but a token already
  issued stays valid until it expires. Revoking them needs a per-user token
  version checked on each request.
- **Customer status is derived** (VIP over $2000 spent), not editable by an admin.
- **Reviews need an account but not a purchase.** Any signed-in customer can
  review any product. Common enough, but if you want verified-purchase-only
  reviews it is a small change — `tests/e2e.sh` already pins the current
  behaviour so the change would be visible.
- **No browser-level UI test suite in the repo.** On 2026-09-23 every flow was
  driven in headless Chrome against the dev server — sign-up, sign-in, password
  reset, checkout, reviews, addresses, and the vendor and admin consoles — but
  those scripts were one-off and are not committed, so a regression there is
  caught only by the API suites.
