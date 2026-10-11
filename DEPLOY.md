# Deploying Armut with Dokploy

Two services: **web** (Next.js storefront, vendor and admin consoles) and **api**
(Express + SQLite). `docker-compose.yml` builds both; Dokploy supplies the
domains and TLS.

---

## 1. Create the application

In Dokploy: **Project → Create Service → Compose**, point it at this repository,
and set *Compose Path* to `docker-compose.yml`.

## 2. Set the environment

Paste the following into the application's **Environment** tab and fill in the
blanks. `.env.deploy.example` is the same list with comments.

```
SITE_URL=https://armut.com
API_PUBLIC_URL=https://api.armut.com
CORS_ORIGIN=https://armut.com,https://www.armut.com
JWT_SECRET=<paste a generated secret>

SMTP_HOST=smtp.yourprovider.com
SMTP_PORT=587
SMTP_USER=<smtp username>
SMTP_PASS=<smtp password>
MAIL_FROM=Armut <no-reply@armut.com>
ADMIN_NOTIFY_EMAILS=orders@armut.com
STORE_NAME=Armut
```

Generate the secret with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

`SITE_URL`, `API_PUBLIC_URL` and `CORS_ORIGIN` are required — compose refuses to
start without them, and the API refuses to boot in production with the default
`JWT_SECRET`.

> **`NEXT_PUBLIC_*` values are compiled into the frontend bundle.** Changing
> `SITE_URL` or `API_PUBLIC_URL` requires a **rebuild**, not just a restart.

### Two URLs for the API, and why

The browser and the Next server both talk to the API, but not over the same
route:

| Variable | Used by | Value |
|---|---|---|
| `API_PUBLIC_URL` | the browser, compiled into the bundle | `https://api.armut.com` |
| `API_INTERNAL_URL` | the Next server, at render time | `http://api:4000` |

`docker-compose.yml` sets `API_INTERNAL_URL` for you. It matters because
server-rendered pages (home, category, product detail, sitemap) fetch the
catalogue while rendering. Without it those fetches go back out through the
proxy — or fail outright, in which case the page falls back to the bundled
fixtures and a product that exists only in the database returns **404**.

It also means the `web` image can be built before the API is reachable: the
build falls back to fixtures for the prerendered pages, and the first request
after deploy re-renders them against the live API.

## 3. Attach the domains

In the application's **Domains** tab add two entries:

| Service | Host | Container port |
|---|---|---|
| `web` | `armut.com` | `3000` |
| `api` | `api.armut.com` | `4000` |

Enable HTTPS (Let's Encrypt) on both. The hosts must match `SITE_URL` and
`API_PUBLIC_URL` exactly, or the browser will block the API calls on CORS.

## 4. Deploy, then seed once

Hit **Deploy**. On the first deploy only, create the admin/vendor accounts and
the starter catalog by running this in the `api` container's terminal:

```bash
node src/seed.js
```

It refuses to run against a database that already has rows, so you cannot wipe
live orders by re-running it by mistake. (`npm run reset` overrides that — it
deletes everything. Never point it at production data.)

Then sign into `https://armut.com/admin` and change the seeded passwords.

## 5. Verify

```bash
curl https://api.armut.com/health
# {"status":"ok","db":"ok","mail":"configured"}
```

`"mail":"disabled"` means SMTP is not configured — orders will still be placed,
but no admin alert or customer confirmation is sent.

Then walk the storefront end to end:

1. Sign up, then open **Your Account** (the person icon in the header).
2. Save a delivery address, edit it, and mark it default.
3. Add something to the cart and check out with that address.
4. The order appears under **Order History**, and the vendor sees it — with the
   delivery address — under Orders in `/vendor`.

The admins in `ADMIN_NOTIFY_EMAILS` should receive a "New order #… " email within
seconds, and the customer a confirmation.

---

## Persistence

The API writes to two named Docker volumes:

| Volume | Mount | Contents |
|---|---|---|
| `armut-data` | `/data` | `armut.db` — accounts, catalog, orders, addresses |
| `armut-uploads` | `/uploads` | product and banner images uploaded from the consoles |

**Back both up.** SQLite is a single file; the safe way to copy it hot is:

```bash
docker run --rm -v armut-data:/data -v "$PWD:/backup" alpine \
  sh -c "apk add -q sqlite && sqlite3 /data/armut.db \".backup /backup/armut-$(date +%F).db\""
```

Never copy `armut.db` with `cp` while the API is running — the WAL file means you
can get a torn snapshot.

Because the database is a file on a volume, the `api` service must stay at **one
replica**. Scaling it horizontally would corrupt the database; scale `web` instead.

## Email

Any SMTP provider works (Postmark, Resend, SES, Mailgun, your own). Two rules:

- `MAIL_FROM` must be a domain the provider is authorised to send for — otherwise
  mail is silently dropped or spam-filed. Set up SPF and DKIM for it.
- Port 465 implies TLS; anything else uses STARTTLS. Override with `SMTP_SECURE=true|false`.

Delivery failures are logged (`[mail] failed to send …`) and never fail the
order — a customer's checkout will not break because the mail server is down.

What gets sent: a welcome email at sign-up, an order confirmation to the
customer, a new-order alert to admins, a customer update when a vendor marks
their order Shipped, Delivered or Cancelled (once per real change), and the two
password-reset emails (the link, then a "your password was changed" notice).
Links in the emails use `STORE_URL`; without it they are sent without buttons.

Reset links are built from `STORE_URL`, which `docker-compose.yml` fills from
`SITE_URL`. In production the API refuses to derive the link from the request,
so a missing `SITE_URL` means no reset email is sent (it logs
`[auth] password reset requested but STORE_URL is not set`) rather than one that
points somewhere an attacker chose. Links expire after an hour, work once, and
requesting a new one retires the old one; only a hash of the token is stored.

## Local development

```bash
# API
cd backend && cp .env.example .env && npm install && npm run seed && npm run dev

# storefront
cp .env.example .env.local     # set NEXT_PUBLIC_API_URL=http://localhost:4000
npm install && npm run dev
```

Without `NEXT_PUBLIC_API_URL` the app runs on the built-in mock fixtures, and the
pill at the bottom-left switches between mock and a live API. That switch is a
development tool: it is compiled out of a production build unless you set
`NEXT_PUBLIC_ENABLE_API_SWITCH=true`.

To exercise the compose stack locally:

```bash
cp .env.deploy.example .env     # set SITE_URL=http://localhost:3000, API_PUBLIC_URL=http://localhost:4000
docker compose up --build
```

Then seed it once and check a page that renders on the server:

```bash
docker compose exec api node src/seed.js
curl -s localhost:3000/product/1 | grep -o 'Minimalist Sofa' | head -1
```

## Seeded accounts

`node src/seed.js` creates these. **Change the passwords before going live.**

| Role | Email | Password |
|---|---|---|
| Admin | `admin@armut.com` | `admin123` |
| Vendor | `hello@bosphoruswood.com` | `vendor123` |
| Customer | `ada@example.com` | `client123` |
