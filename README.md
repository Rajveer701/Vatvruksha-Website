# Vatvruksha Swami Maharaj Spiritual Vastu Bhandar

E-commerce platform for Hindu idols, statues, and vastu items (India; INR). Two apps on one Firebase backend:

- **Customer website** — `frontend/customer-side/`
- **Admin dashboard** — `frontend/admin-side/`
- **Shared kernel** — `frontend/shared/` (Firebase config, money formatting, constants, JSDoc types)

## Stack

- Vite 8 + React 19 + JavaScript (no TypeScript build step)
- Tailwind CSS 4
- React Router 7
- Zustand (cart/wishlist persistence)
- Firebase Auth, Firestore, Storage, Cloud Functions (region `asia-south1`)
- Oxlint for linting

## Repo structure

```
Vatvruksha Website/
├── firebase.json              # Emulator + hosting config
├── firestore.rules            # Firestore security rules
├── storage.rules              # Storage security rules
├── firestore.indexes.json     # Composite indexes (required by queries)
├── PHASE0_PLAN.md             # Phase 0 plan (audit, sitemap, risks)
├── README.md                  # this file
├── package.json               # firebase-tools (dev)
├── frontend/
│   ├── .gitignore
│   ├── .oxlintrc.json
│   ├── shared/                # small shared kernel (imported by both apps)
│   │   ├── firebase.js        # (NOT here — see note below)
│   │   ├── auth.js
│   │   ├── money.js           # paise <-> rupees, single source of truth
│   │   ├── constants.js       # brand palette, status enums, requestId regex
│   │   └── types.js           # JSDoc typedefs
│   ├── customer-side/         # Customer website (existing app — NOT moved)
│   │   ├── .env / .env.example
│   │   ├── src/
│   │   │   ├── firebase.js    # Firebase app init (per-app)
│   │   │   ├── auth.js        # auth helpers (per-app)
│   │   │   ├── context/       # AuthContext, CatalogueContext
│   │   │   ├── functions/     # callable wrappers (checkout, orders, addresses)
│   │   │   ├── store/         # cartStore, wishlistStore, cartDrawerStore
│   │   │   ├── components/
│   │   │   ├── pages/         # Home, Shop, Category, Product, Cart, Checkout,
│   │   │   │                  # Login, OrderHistory, OrderDetail, AddressBook, …
│   │   │   ├── App.jsx
│   │   │   └── main.jsx
│   │   └── public/
│   └── admin-side/            # Admin dashboard (new app)
│       ├── .env / .env.example
│       ├── src/
│       │   ├── firebase.js
│       │   ├── auth.js
│       │   ├── context/AuthContext.jsx   # admin claim guard
│       │   ├── functions/                # queries, checkout
│       │   ├── services/pendingEndpoints.js  # backend-pending stubs
│       │   ├── components/               # DataTable, StatCard, PendingActionButton
│       │   ├── pages/                    # Login, Unauthorized, Overview, Orders,
│       │   │                   # OrderDetail, Products, Categories, Inventory,
│       │   │                   # Customers, Exceptions, AdminRoles
│       │   └── App.jsx
│       └── public/
```

> **Note:** `frontend/shared/` holds pure-JS modules only (money, constants, types). Firebase init lives in each app's `src/firebase.js` so each app can resolve `firebase` from its own `node_modules`.

## Environment

Copy `.env.example` to `.env` in each app and fill in your Firebase project values:

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...

# Set "true" to use the Firebase Emulator Suite
VITE_FIREBASE_EMULATOR=false
```

Never commit real credentials. Do **not** put Paytm keys/secrets in `.env` or source — Paytm secrets are backend-only.

## Firebase Emulator Suite (local development)

Ports per the integration guide:

| Emulator | Port |
|---|---|
| Auth | 9099 |
| Functions | 5001 |
| Firestore | 8080 |
| Storage | 9199 |
| Emulator UI | 4000 |

### Prerequisites

```bash
# From repo root
npm install --save-dev firebase-tools
```

### Start emulators

```bash
# Auth, Firestore, Storage (functions emulator needs backend function source)
npx firebase emulators:start --only auth,firestore,storage --project demo-project
```

To include Functions, you need function source code. Initialize functions first:

```bash
npx firebase init functions   # then select TypeScript/JavaScript
npx firebase emulators:start  # all emulators
```

### Use emulators in the apps

Set `VITE_FIREBASE_EMULATOR=true` in each app's `.env`. The apps will connect to `localhost:9099` (Auth), `localhost:8080` (Firestore), `localhost:9199` (Storage), `localhost:5001` (Functions).

> The Storage bucket is **not configured yet** — image `getDownloadURL()` calls will fall back to a graceful placeholder until the bucket is created and `storage.rules` allow reads.

### Emulator UI

Open `http://localhost:4000` (requires `firebase init` to enable UI).

## Security rules

- `firestore.rules` — owner-based access for users/addresses; public read for products/categories; admin write (custom claim `admin === true && email_verified === true`) for products/categories; orders are read-only from the browser (owner filter `userId == auth.uid`), written only via callable Cloud Functions.
- `storage.rules` — public read for `products/*` and `categories/*` paths; all writes denied until upload flow is confirmed.
- `firestore.indexes.json` — composite indexes required by all queries:
  - `categories: isActive ASC + sortOrder ASC`
  - `products: isActive ASC + sortOrder ASC`
  - `products: isActive ASC + categoryId ASC + sortOrder ASC`
  - `orders: userId ASC + createdAt DESC`
  - `orders: status ASC + createdAt DESC`
  - `orders: status ASC + reservedUntil ASC`

Deploy rules:

```bash
npx firebase deploy --only firestore:rules,firestore:indexes,storage
```

## Backend callable functions (not in this repo)

The following callables are backend-owned and must be deployed separately (region `asia-south1`):

| Function | Purpose |
|---|---|
| `createCodOrder` | COD checkout — creates confirmed order + pending payment |
| `createPaytmOrder` | Paytm checkout — returns CheckoutJS values, reserves stock |
| `verifyPaytmPayment` | Owner-only Paytm verification |
| `setAdminRole` | Grant/revoke admin claim |
| `expirePendingPaytmOrders` | Scheduled job (not browser-callable) |

Not yet exported (admin UI keeps controls disabled with "Backend endpoint pending"):
- Mark shipped/delivered + tracking ID
- Record COD collection
- Adjust stock (transactional)
- Cancel/refund
- Admin resolve of uncertain Paytm payments

## Scripts

### Customer app

```bash
cd frontend/customer-side
npm install
npm run dev      # Vite dev server
npm run build    # Production build
npm run lint     # Oxlint
npm run preview  # Preview production build
```

### Admin app

```bash
cd frontend/admin-side
npm install
npm run dev
npm run build
npm run lint
npm run preview
```

### Repo root

```bash
npx firebase emulators:start --only auth,firestore,storage --project demo-project
npx firebase deploy --only firestore:rules,firestore:indexes,storage
```

## Phases & status

### Phase 1 — Customer app audit & fix ✅ DONE

Fixed every gap vs the Customer Frontend Integration Guide:
- Auth: Email/Password + Google sign-in; checkout blocked until `email_verified=true`; "send verification email" + force-refresh ID token
- Profile: `users/{uid}` + `users/{uid}/addresses` (full CRUD)
- Catalogue: Firestore queries with `isActive == true` ordered by `sortOrder`; composite indexes
- Images: Storage paths resolved via `getDownloadURL()` with placeholder fallback
- Variants: `{variantId: {label,sku,price,mrp,stock,isActive,sortOrder,weightGrams?}}`; default variant `"default"`; per-variant stock; inactive variants hidden
- Money: integer paise in state; `formatINR()` at display edge
- Cart: `{productId, variantId, quantity}` only; persists across sign-in
- Checkout: `requestId` (reused on retry), COD via `createCodOrder`, Paytm via `createPaytmOrder` + CheckoutJS + `verifyPaytmPayment`, data-loss handling ("could not verify yet; check again", never force-paid), server-returned totals only
- Orders: history (`userId == uid`, `createdAt desc`), detail with snapshots, separate order/payment status, no cancel/refund
- Error handling: all codes from the guide mapped to UI behavior

### Phase 2 — Admin dashboard ✅ BUILT (build + lint clean)

- Auth + claim guard (`getIdTokenResult(true)`, `admin === true && email_verified === true`); route guard is UX-only
- `setAdminRole` UI with its rules
- Overview (client-derived cards), Orders (paginated + status filter + order-ID search), Order detail, Products, Categories, Inventory (variant-level scan, low/OOS), Customers (read-only paginated), Exceptions (no force-paid), Admin Roles
- Catalogue writes now **enabled** — `firestore.rules` permits admin writes via custom claim
- Backend-pending controls disabled with visible "Backend endpoint pending" label in `services/pendingEndpoints.js`

## Open decisions

- Storage bucket name and path convention (`products/{productId}/{filename}`, `categories/{categoryId}/{filename}`)
- Shipping / COD fee / pincode / tax policy (not final — checkout shows server-returned totals only)
- Low-stock threshold (default 5, pending confirmation)
- Late Paytm success after reservation expiry
- Email provider
- Cancellation / refund workflow

## Deployment

1. Set `.env` values for production (not emulator).
2. Deploy Firestore rules and indexes: `npx firebase deploy --only firestore:rules,firestore:indexes`
3. Deploy Storage rules: `npx firebase deploy --only storage`
4. Deploy backend callable functions (separate backend repo).
5. Build customer app: `cd frontend/customer-side && npm run build`
6. Host via Firebase Hosting or any static host pointing at `frontend/customer-side/dist`.
7. Build admin app similarly; host at `/admin` path or separate hosting target.

## Testing scenarios (from both guides)

Unverified email, COD success, Paytm pending/success/failure/signature error, out-of-stock, stale price, duplicate retry (same `requestId`), auth expiry, non-admin opening the admin site, role-claim change requiring token refresh, inactive product inside a historical order.
