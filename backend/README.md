# Armut Backend

Express + SQLite API that serves the Armut Next.js frontend — storefront,
vendor console, and admin console — implementing the exact REST contract the
frontend's `lib/api.js` calls in **live** mode.

## Quick start

```bash
cd backend
cp .env.example .env      # adjust PORT / JWT_SECRET / CORS_ORIGIN if needed
npm install
npm run seed              # create + populate data/armut.db (prints logins)
npm start                 # http://localhost:4000
```

`npm run dev` runs with `--watch` for auto-reload. `npm run seed` is idempotent —
run it any time to reset the database to the demo dataset.

## Connect the frontend

1. Start this API (`npm start`).
2. Start the frontend (`npm run dev` in the repo root → http://localhost:3000).
3. Click the **API** pill (bottom-left of any page), choose **Live API**, enter
   `http://localhost:4000`, and **Apply & reload**.

The whole app now runs against this backend. (For a permanent switch, hard-code
`{ mode:'live', baseUrl }` in `lib/config.js` and drop `<EnvSwitch/>`.)

## Default accounts

| Role     | Email                    | Password    |
| -------- | ------------------------ | ----------- |
| Admin    | `admin@armut.com`        | `admin123`  |
| Vendor   | `studio@armutmodern.com` | `vendor123` |
| Vendor   | `hello@bosphoruswood.com`| `vendor123` |
| Customer | `ada@example.com`        | `client123` |

New customers can also self-register via the storefront sign-up.

## What it does

- **Auth** — bcrypt-hashed passwords, JWT bearer tokens, three isolated scopes
  (store / vendor / admin). A token for one scope can't reach another's routes.
- **Storefront** — catalog (banners + rooms + products), product detail,
  sign-up/login, saved delivery addresses, order history, and checkout (an order
  is split into one order per vendor, stock is reserved as it is placed).
- **Order email** — every placed order emails the admins and confirms to the
  customer over SMTP. Sending is best-effort: it never blocks or fails checkout,
  and is skipped entirely when SMTP is not configured. See `.env.example`.
- **Vendor console** — dashboard, product CRUD, order-status updates, store
  profile, and image uploads. Everything is scoped to the signed-in vendor.
- **Admin console** — marketplace overview (vendors, products, orders, customers
  with computed sales/spend), vendor approval/suspension, product moderation,
  **site-content management** (home slider + "Shop by Room" tiles), and uploads.
- **Uploads** — real image files stored on disk under `uploads/`, served from
  `/uploads/*`, returned as absolute URLs. Max 8 MB, images only.

## API surface (all under `/api/v1`)

```
Store    GET  /catalog
         GET  /products/:id                            (includes reviews)
         POST /products/:id/reviews                    (customer token)
         POST /auth/signup | /auth/login | /auth/logout
         GET  /addresses                               (customer token)
         POST /addresses   PUT/DELETE /addresses/:id   (customer token)
         GET  /orders                                  (customer token, history)
         POST /orders                                  (customer token)

Vendor   POST /vendor/auth/login | /vendor/auth/logout
         GET  /vendor/dashboard
         POST /vendor/products      PUT/DELETE /vendor/products/:id
         PATCH /vendor/orders/:id
         PUT  /vendor/store
         POST /vendor/uploads                          (multipart "file")

Admin    POST /admin/auth/login | /admin/auth/logout
         GET  /admin/overview
         POST /admin/vendors        PATCH/DELETE /admin/vendors/:id
         PATCH /admin/products/:id   DELETE /admin/products/:id
         GET  /admin/content         PUT /admin/content   (home slider + rooms)
         POST /admin/uploads                             (multipart "file")
```

## Layout

```
backend/
  src/
    server.js          Express app: CORS, static uploads, routers, error handler
    db.js              SQLite connection + schema
    seed.js            Reconciles the frontend fixtures into one dataset
                       (refuses to run against a non-empty database)
    auth.js            bcrypt + JWT + role middleware
    mailer.js          SMTP order notifications (admin alert + customer receipt)
    ratelimit.js       per-IP/email throttle on the credential endpoints
    upload.js          multer config + absolute-URL builder
    helpers.js         validation + row→API-shape mappers
    routes/            store.js · vendor.js · admin.js
  data/                SQLite file (gitignored, created by seed)
  uploads/             uploaded images (gitignored)
```
