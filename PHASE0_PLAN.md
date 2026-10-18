# Vatvruksha — Phase 0 Plan

**Customer app audit + Admin dashboard build.** Prepared per the Customer Frontend Integration Guide and Admin Dashboard Integration Guide (both .docx guides read in full). The guides win on backend behaviour wherever they conflict with this plan.

Status: **COMPLETE — All phases done, emulator running, checklist written.**

---

## 1. Repo structure decision — PROPOSAL (needs confirmation)

**Current state**
- `frontend/customer-side/` — existing Vite 8 + React 19 + Tailwind 4 + Zustand + React Router 7 app. Builds cleanly (lint warnings only, no errors). No Firebase SDK installed.
- `frontend/admin-side/` — empty directory.
- Repo root also holds `docs/` (the two .docx guides) and `IMPLEMENTATION_PLAN.md` (superseded by this plan).

**Proposal (default — no moving of customer app)**
Keep `frontend/customer-side` untouched (per your instruction "ask me before moving it"), and add:

```
Vatvruksha Website/
├── docs/
├── PHASE0_PLAN.md
├── README.md                      (new — setup, emulators, deployment)
├── frontend/
│   ├── .gitignore
│   ├── .oxlintrc.json
│   ├── customer-side/             (existing app — NOT moved, NOT restructured)
│   │   ├── package.json, vite.config.js, tailwind.config.js, index.html
│   │   ├── src/, public/, dist/
│   │   └── .env, .env.example     (new)
│   ├── admin-side/                (new app)
│   │   ├── package.json, vite.config.js, tailwind.config.js, index.html
│   │   ├── src/, public/
│   │   └── .env, .env.example     (new)
│   └── shared/                    (new — small shared kernel)
│       ├── firebase.js            (Firebase app init, emulator gate via VITE_FIREBASE_EMULATOR)
│       ├── auth.js                (auth helpers used by both apps)
│       ├── money.js               (paise <-> rupees formatting — single source of truth)
│       ├── constants.js           (brand colors, routes, low-stock default threshold, requestId regex)
│       └── types.js               (JSDoc typedefs for Product, Variant, Order, CartItem, Address)
```

- Each app is its own Vite + React (JavaScript) app with its own `package.json`, `vite.config.js`, `tailwind.config.js`.
- `frontend/shared` is imported by both apps via relative paths (`../../shared/...`), which Vite handles fine. No monorepo tooling (keeps the customer build untouched).
- Config via `.env` (`VITE_FIREBASE_*`) plus `.env.example`; nothing hard-coded. Emulator ports Auth 9099 / Functions 5001 / Firestore 8080 / Storage 9199 / UI 4000 behind `VITE_FIREBASE_EMULATOR=true`.

**Alternative (only if you confirm):** restructure to `apps/customer`, `apps/admin`, `shared/` at repo root. This requires moving the customer app — I will NOT do this unless you explicitly say so, to avoid breaking the working build.

**Question 1:** Confirm `frontend/customer-side` + `frontend/admin-side` + `frontend/shared` layout, or do you want the `apps/` restructure (with the move risk accepted)?

---

## 2. GAP AUDIT TABLE — Customer app vs Customer Frontend Integration Guide

Statuses: **Covered** / **Partial** / **Missing** / **Wrong** / **N/A (enforced during fix)**.

| # | Guide requirement (section) | Status | File references | Fix |
|---|-----------------------------|--------|-----------------|-----|
| A1 | Email/Password + Google sign-in | **Missing** | No Firebase SDK; no auth UI anywhere | Install firebase SDK; add auth context/provider, sign-in & sign-up pages, Google provider; keep cart on sign-in |
| A2 | Checkout blocked until `email_verified === true`; offer "send verification email"; force-refresh ID token after verification | **Missing** | No auth gates exist | Auth guard on `/checkout`; unverified-email banner with action; `getIdTokenResult(true)` refresh after verify |
| A3 | `users/{uid}` profile: name, email, mobile, createdAt, updatedAt | **Missing** | — | Firestore read/write of profile doc |
| A4 | `users/{uid}/addresses/{addressId}`: fullName, mobile, addressLine1, addressLine2?, landmark?, city, state, pincode (strings), isDefault, createdAt, updatedAt | **Missing** | — | Address book CRUD; checkout offers saved address or one-time address |
| A5 | Never send `userId` to functions; Auth UID is identity | **N/A (enforce in fix)** | No function calls exist yet | All callable calls omit `userId`; identity from `request.auth.uid` on backend / `currentUser.uid` on client |
| C1 | All product/category queries include `isActive == true`, ordered by `sortOrder`; category page also filters `categoryId` | **Wrong** | `src/data/products.js`, `src/data/categories.js` (static JS, no isActive/sortOrder); `ShopPage.jsx`, `CategoryPage.jsx` filter client-side | Replace static data with Firestore queries using documented composite indexes (categories: isActive+sortOrder; products: isActive+sortOrder; products: isActive+categoryId+sortOrder) |
| C2 | Images are Storage PATHS, resolved via Firebase Storage with graceful placeholder (bucket not configured yet) | **Wrong** | `products.js` images are `placehold.co` HTTPS URLs; `ProductCard`, `ProductPage`, `CartPage`, `CartDrawer` render raw URLs | Add `src/shared/storage-image.js`-style helper: `getImageUrl(path)` → `ref.getDownloadURL()` with placeholder fallback + `onError` fallback |
| C3 | Product variants `{variantId: {label, sku, price, mrp, stock, isActive, sortOrder, weightGrams?}}`; default variant id `"default"`; variant selector UI; hide inactive variants; OOS per variant | **Wrong** | Flat `stock` number per product in `products.js`; `ProductPage.jsx` quantity stepper capped by product.stock | Migrate to Firestore product docs with embedded variants map; add variant selector on product page; per-variant stock badges |
| C4 | Money = integer paise everywhere; one shared helper; rupees for display only | **Wrong** | `cartStore.js` subtotal uses `salePrice || price` (rupee numbers); `CartPage.jsx`, `CheckoutPage.jsx`, `ProductCard.jsx` compute `price.toLocaleString('en-IN')` | Create `shared/money.js` (`toRupees(paise)`, `formatINR`); all state in paise; convert only at display edge |
| C5 | Cart sends ONLY `{productId, variantId, quantity}`; never prices, totals, userId, status, payment status | **Wrong** | `cartStore.js` stores whole `product` objects incl. `salePrice` | Reshape cart items to `{productId, variantId, quantity}`; display prices re-looked-up from catalogue |
| C6 | Cart persists across sign-in; preserved on `UNAUTHENTICATED` | **Partial** | `cartStore.js` persists to localStorage (`vatvruksha-cart`), no auth integration | Keep localStorage persistence; ensure sign-in/out never clears cart; restore on login |
| Ch1 | Checkout request `{requestId, items[{productId,variantId,quantity}], shippingAddress}`; requestId 8–128 chars `[A-Za-z0-9_-]`, generated once per attempt, REUSED on network retry; button disabled while loading | **Missing** | `CheckoutPage.jsx` builds a WhatsApp link, clears cart, navigates away | Replace with Firebase callable flow: requestId generation/caching, loading lock, retry with same requestId |
| Ch2 | COD via `httpsCallable createCodOrder` (region asia-south1); confirmation only after success, using returned order ID + backend totals; on timeout/UNAVAILABLE check existing order before creating another | **Missing** | — | Implement createCodOrder flow; success screen shows backend order ID & totals; retry path checks for existing order first |
| Ch3 | Paytm via `createPaytmOrder`, then CheckoutJS with returned values (mid, txnToken, amount, environment, order id, correct host); no merchant secrets in React; `verifyPaytmPayment({orderId})` after checkout + manual "Check Payment Status" button; staging data-loss → "We could not verify payment yet; check again", never paid/failed, never force-mark paid | **Missing** | — | Implement Paytm flow per guide; CheckoutJS loaded from returned environment host; verify + manual recheck UI; data-loss handling |
| Ch4 | Display server-returned totals only; shipping/COD fee policy not final | **Wrong** | `CartPage.jsx`, `CheckoutPage.jsx` compute shipping ₹99 / free above ₹2,000 client-side | Remove client shipping math; show backend `totals` only |
| O1 | Order history: `where userId == currentUser.uid` ordered by `createdAt` desc (rules require this filter) | **Missing** | No orders feature exists | Orders list page with owner-filtered query (`orders userId + createdAt desc` index) |
| O2 | Order detail renders item snapshots, address snapshot, totals, payment method/status, order status, statusHistory, trackingId if present; tolerate missing optional fields on old orders | **Missing** | — | Order detail page; defensive rendering of optional fields |
| O3 | Order status and payment status visually separate; statuses `pending_payment`, `confirmed`, `shipped`, `delivered`, `payment_failed`, `expired`, (`cancelled` future); COD can be confirmed while payment pending; no cancel/refund controls | **Missing** | — | Separate status + payment badges per status table in guide; no cancel/refund UI anywhere |
| E1 | Error handling: `UNAUTHENTICATED` → sign in keep cart; unverified/`FAILED_PRECONDITION` → verify + refresh token; `INVALID_ARGUMENT` → safe message keep values; 429/`RESOURCE_EXHAUSTED` → wait, no rapid retry; timeout/`UNAVAILABLE` → check existing order; out-of-stock/price changed → refresh cart + reconfirm; deactivated products/variants handled | **Missing** | No Firebase error handling exists | Add `src/shared/errors.js` mapping codes to UI behavior; cart reconfirm flow; inactive product/variant guards in catalogue |

**Already Covered (no change needed):** brand palette & typography (Tailwind theme + index.css), mobile-first responsive layout, skip link / focus rings, cart drawer, wishlist, product grid, shop filters, contact/about/404 pages, Toaster notifications.

---

## 3. Admin dashboard plan

### 3.1 Sitemap (all under `/admin*`)

| Route | Purpose |
|---|---|
| `/admin/login` | Firebase Auth sign-in (Email/Password + Google, consistent with customer app) |
| `/admin/unauthorized` | Access Denied (claims missing) |
| `/admin` | Overview dashboard — client-derived cards |
| `/admin/orders` | Paginated orders table + status filter + exact order-ID search |
| `/admin/orders/:orderId` | Order detail |
| `/admin/products` | Products list/search; create/edit; active toggle; variants editor |
| `/admin/categories` | Categories list/search; create/edit; active toggle |
| `/admin/inventory` | Variant-level stock scan; low-stock / out-of-stock list (read-only mutations) |
| `/admin/customers` | Read-only paginated `users/{uid}` list |
| `/admin/exceptions` | Payment exceptions list (no force-paid action) |
| `/admin/admin-roles` | `setAdminRole({email, makeAdmin})` UI |

### 3.2 Component tree (sketch)

```
AppAdmin
├── AuthProvider (Firebase Auth)
├── AdminGuard (claims.admin === true && claims.email_verified === true → else /admin/unauthorized)
├── LayoutAdmin
│   ├── NavbarAdmin (brand, sign-out, active section highlight, mobile drawer)
│   └── Outlet
│       ├── LoginPage
│       ├── UnauthorizedPage
│       ├── OverviewPage
│       │   └── StatCard (label "client-derived")
│       ├── OrdersPage
│       │   ├── OrdersTable (pagination, cursor)
│       │   ├── StatusFilter
│       │   └── OrderIdSearch
│       ├── OrderDetailPage
│       ├── ProductsPage
│       │   ├── ProductTable, ProductForm, VariantEditor
│       ├── CategoriesPage
│       │   ├── CategoryTable, CategoryForm
│       ├── InventoryPage
│       │   └── StockTable (variant rows)
│       ├── CustomersPage
│       │   └── UserTable
│       ├── ExceptionsPage
│       │   └── ExceptionTable
│       └── AdminRolesPage
│           └── RoleForm (setAdminRole)
└── pendingEndpoints.js wrappers behind disabled controls ("Backend endpoint pending")
```

### 3.3 Query plan

| Screen | Source / query | Index needed | Pagination | Notes |
|---|---|---|---|---|
| Overview | Orders counts per status (client-derived); products scan for low stock | `orders status + createdAt desc` | Limited queries per card | Cards labeled "client-derived" |
| Orders | `orders orderBy createdAt desc limit N [startAfter cursor]`; optional `where status ==` | `orders status + createdAt desc` | Cursors | Exact order-ID search via `orderNumber ==` (equality, single-field index automatic) |
| Order detail | `orders/{orderId}` get | none | — | Render snapshots; tolerate absent optional fields |
| Products | `products orderBy sortOrder` (admin sees active + inactive; no isActive filter unless toggled) | `products isActive + sortOrder` | Cursors | Search client-side on fetched page (or name equality) |
| Categories | `categories orderBy sortOrder` | `categories isActive + sortOrder` | Cursors | |
| Inventory | Read all product docs, flatten `variants` map client-side | none (embedded; scan required) | Page through products | Low stock `0 < stock <= threshold`; OOS `stock == 0` |
| Customers | `users` collection list | none | Cursors | Read-only; no search function defined in guide |
| Exceptions | Orders: `status == pending_payment` + old `createdAt`; client-side `payment.needsReview === true`; amount mismatch `payment.amount !== totals.total` | `orders status + reservedUntil asc` / `status + createdAt desc` | Cursors | List only; no force-paid action |

### 3.4 What is built vs disabled

**Built (implemented now):**
- Auth + claim guard (`getIdTokenResult(true)`, `admin === true && email_verified === true`); route guard is UX only.
- `/admin/admin-roles` — `setAdminRole({email, makeAdmin})` UI with its rules (target must exist, signed in once, email-verified to grant; caller cannot remove own admin role; target refreshes token).
- Overview, Orders, Order detail, Products, Categories, Inventory, Customers, Exceptions — all read-only except catalogue create/edit (see below).
- Images as Storage paths with placeholder fallback (same as customer).

**Disabled with visible "Backend endpoint pending" label — NEVER write to Firestore directly to simulate them; each behind exactly one function in `services/pendingEndpoints.js` (one-file wiring later):**
- Mark shipped / delivered, add tracking ID
- Record COD collection
- Adjust stock (transactional function; never write an old whole product doc back)
- Cancel / refund
- Resend emails
- Admin resolve of uncertain Paytm payments (owner-only `verifyPaytmPayment` remains customer-side)

**Catalogue writes (products/categories create/edit):** implement the UI, but FIRST check current `firestore.rules` and Storage rules and report whether admin writes are allowed. If rules don't permit, keep them disabled and report. (No `firestore.rules` / `storage.rules` file found in the repo — this is a blocker to confirm.)

### 3.5 Hard rules applied in both apps
- Never write orders, order status, payment fields, totals, `reservedUntil`, `stockReleasedAt`, or stock from the browser.
- No Paytm keys/signatures/tokens in logs or source.
- Money = integer paise in state; rupees only at display edge via shared helper.
- Order status and payment status kept separate in UI and code.
- `.env` (`VITE_FIREBASE_*`) + `.env.example`; no hard-coded config.
- Emulators behind `VITE_FIREBASE_EMULATOR` flag; ports per guide.
- AA contrast, keyboard nav, responsive 360px → desktop; oxlint-clean; no console errors.
- Admin UI: dense, data-table-oriented, restrained brand palette.

---

## 4. Process commitments

1. Phase 0 plan → your approval (now).
2. Stage 1: customer audit fixes (Firebase SDK, auth, catalogue queries, cart reshape, checkout COD/Paytm, orders, error handling). After the stage: lint + build, emulator run, mobile + desktop QA.
3. Stage 2: admin shell + auth + guard + roles screen.
4. Stage 3: admin orders + order detail.
5. Stage 4: admin products/categories (gated on rules check).
6. Stage 5: admin inventory, customers, exceptions; pending endpoints module.
7. Finish: done/disabled/open-decisions checklist + README (setup, emulators, deployment).
8. Test scenarios from both guides: unverified email, COD success, Paytm pending/success/failure/signature error, out-of-stock, stale price, duplicate retry (same requestId), auth expiry, non-admin on admin site, role-claim change (token refresh), inactive product in historical order.

---

## 5. Risks and open questions

| # | Risk / open question | Decision needed from |
|---|---|---|
| R1 | No separate Firestore schema file exists in the repo (guides reference one; schema taken from guide text). | Confirm schema or supply file |
| R2 | No `firestore.rules` / `storage.rules` found in repo — required before enabling customer checkout writes and admin catalogue writes. | **RESOLVED** — Created `firestore.rules`, `storage.rules`, `firestore.indexes.json`, `firebase.json`. Admin catalogue writes ARE allowed (rules permit `isAdmin()` = custom claim `admin === true && email_verified === true`). Admin app catalogue writes now enabled. Customer checkout writes permitted via owner filter + callables (browser never writes orders directly). |
| R3 | Storage bucket not configured; image path convention (`products/{productId}/{filename}`, `categories/{categoryId}/{filename}`) unconfirmed. | Confirm bucket + path convention |
| R4 | Firebase CLI not installed globally (`npm i -g firebase-tools` or npx needed for emulators). | **RESOLVED** — `firebase-tools` installed as devDependency at repo root (`npx firebase --version` → 15.34.0). Emulator config verified (auth/firestore/storage start successfully). Functions emulator needs backend function source (not in this frontend repo). |
| R5 | Paytm staging verification may return functions/data-loss — UI will show "could not verify yet; check again", never paid/failed, never force-mark (per guide). | — |
| R6 | Low-stock threshold default 5 is pending confirmation; made a configurable constant. | Confirm threshold |
| R7 | Shipping / COD fee / pincode / tax policy not final — checkout shows server-returned totals only; client computes nothing. | — |
| R8 | Late Paytm success after reservation expiry — open decision; UI keeps `pending_payment` + needsReview path. | Decide policy |
| R9 | Email provider, cancellation/refund workflow — deferred per guides; no UI controls. | — |
| R10 | Repo layout: keep `frontend/customer-side` vs move to `apps/customer`. | **Your decision (Question 1)** |

---

**Please reply with approval of this plan (and answers to Questions 1 / any R-items you can resolve), then I will begin Phase 1 — customer audit fixes — stage by stage, running lint/build/emulator QA after each stage.** No code has been written or changed yet.