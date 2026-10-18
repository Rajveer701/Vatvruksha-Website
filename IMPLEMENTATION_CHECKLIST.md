# Implementation Checklist — Vatvruksha Customer + Admin

## ✅ DONE

### Phase 0 — Plan
- Repo structure decided: `frontend/customer-side` (untouched) + `frontend/admin-side` (new) + `frontend/shared` (pure JS kernel)
- Gap audit table completed for customer app vs Customer Frontend Integration Guide
- Admin sitemap, component tree, query plan defined
- Risks and open questions documented

### Phase 1 — Customer App Audit & Fix
- **Auth**: Email/Password + Google sign-in; checkout blocked until `email_verified=true`; "send verification email" + force-refresh ID token (`getIdToken(user, true)`)
- **Profile**: `users/{uid}` + `users/{uid}/addresses` full CRUD
- **Catalogue**: Firestore queries `isActive == true` ordered by `sortOrder`; category page filters `categoryId`; all 6 composite indexes in `firestore.indexes.json`
- **Images**: Storage paths resolved via `getDownloadURL()` with graceful placeholder fallback
- **Variants**: `{variantId: {label,sku,price,mrp,stock,isActive,sortOrder,weightGrams?}}`; default variant `"default"`; variant selector UI; inactive variants hidden; per-variant OOS
- **Money**: integer paise in state; `formatINR()` single display-edge helper
- **Cart**: `{productId, variantId, quantity}` only; persists across sign-in (localStorage)
- **Checkout**: `requestId` (8–128 chars, reused on retry), button disabled while loading; COD via `createCodOrder` (server totals, order ID); Paytm via `createPaytmOrder` → CheckoutJS (env host from backend, no secrets) → `verifyPaytmPayment({orderId})` + manual "Check Payment Status"; staging data-loss → "could not verify yet; check again", never paid/failed/force-marked; server-returned totals only
- **Orders**: history (`userId == uid`, `createdAt desc`), detail page, separate order/payment status badges, no cancel/refund
- **Error handling**: all guide codes mapped (UNAUTHENTICATED, FAILED_PRECONDITION, INVALID_ARGUMENT, 429, timeout/UNAVAILABLE, OOS/price changed)

### Phase 2 — Admin Dashboard (new app at `frontend/admin-side/`)
- **Auth + claim guard**: `getIdTokenResult(true)`, requires `admin === true && email_verified === true`; route guard is UX-only
- **`setAdminRole` UI**: target must exist/signed in/email-verified; caller cannot remove own admin; target refreshes token
- **Screens (9)**: Overview, Orders, Order Detail, Products, Categories, Inventory, Customers, Exceptions, Admin Roles
- **Catalogue writes enabled**: `firestore.rules` permits admin writes via custom claim
- **`services/pendingEndpoints.js`**: disabled backend-pending controls with visible "Backend endpoint pending" labels (mark shipped/delivered, record COD collection, adjust stock, cancel/refund, resend email, resolve Paytm)

### Security & Config
- `firestore.rules`, `storage.rules`, `firestore.indexes.json`, `firebase.json` created
- All 6 composite indexes defined
- Admin writes allowed via `request.auth.token.admin == true && email_verified == true`
- Orders are browser read-only (owner filter); writes via callables only
- No Paytm secrets in React; `.env` + `.env.example` per app
- Emulator ports per guide (Auth 9099, Functions 5001, Firestore 8080, Storage 9199, UI 4000)

### QA
- `npm run build` — clean for both apps ✅
- `npm run lint` — warnings only, no errors ✅
- Firebase Emulator Suite running and verified on all ports ✅
- Both dev servers running against emulators ✅

### Documentation
- `docs/firestore-schema.md` — schema reference
- `README.md` — setup, emulators, deployment
- `PHASE0_PLAN.md` — updated with final status

## ⏳ DISABLED (pending backend work)

| Control | Reason | Location |
|---|---|---|
| Mark shipped / delivered + tracking ID | Backend endpoint not exported | `services/pendingEndpoints.js#markOrderShipped` |
| Record COD collection | Backend endpoint not exported | `services/pendingEndpoints.js#recordCODCollection` |
| Adjust stock | Requires transactional function; never write whole product doc | `services/pendingEndpoints.js#adjustStock` |
| Cancel / refund | Deferred until backend workflow exists | `services/pendingEndpoints.js#cancelOrder`, `#refundOrder` |
| Resend emails | Email provider TBD | `services/pendingEndpoints.js#resendEmail` |
| Admin resolve of uncertain Paytm | `verifyPaytmPayment` is owner-only; admin review function TBD | `services/pendingEndpoints.js#resolvePaytmPayment` |
| Paytm force-mark paid | Never — per guide, never force-mark paid | Not implemented (by design) |
| Functions emulator | Requires backend function source (not in this frontend repo) | `npx firebase emulators:start` (functions port 5001) |

## 📋 OPEN DECISIONS

1. **Storage bucket name** — not configured yet; image `getDownloadURL()` falls back to placeholder
2. **Image path convention** — `products/{productId}/{filename}`, `categories/{categoryId}/{filename}` (suggested, unconfirmed)
3. **Shipping / COD fee / pincode / tax policy** — not final; checkout shows server-returned totals only
4. **Low-stock threshold** — default 5 (configurable constant, pending confirmation)
5. **Late Paytm success after reservation expiry** — policy TBD
6. **Email provider** — TBD
7. **Cancellation / refund workflow** — deferred until backend exists

## 🧪 TEST SCENARIOS (from guides)

To test against running emulators:

```bash
# Terminal 1: emulators (already running)
cd /Users/rajveer/Desktop/Vatvruksha Website
npx firebase emulators:start --only auth,firestore,storage --project demo-project

# Terminal 2: customer app
cd frontend/customer-side
npm run dev   # connects to emulators via VITE_FIREBASE_EMULATOR=true

# Terminal 3: admin app
cd frontend/admin-side
npm run dev   # connects to emulators via VITE_FIREBASE_EMULATOR=true
```

**Scenarios to verify:**
1. Unverified email → checkout blocked, "send verification email" offered, token refresh after verify
2. COD success → confirmation shows backend order ID + totals
3. Paytm pending/success/failure/signature error → correct status handling, "Check Payment Status" button
4. Staging data-loss → "We could not verify payment yet; check again", never paid/failed
5. Out of stock / stale price → cart refresh + reconfirm
6. Duplicate retry (same `requestId`) → no duplicate order
7. Auth expiry → sign in, cart preserved
8. Non-admin on admin site → route denied (Access Denied)
9. Role-claim change → force-refresh ID token
10. Inactive product in historical order → snapshot still renders

**Note**: Paytm functions (`createPaytmOrder`, `verifyPaytmPayment`) and `setAdminRole` require backend function source deployed to the Functions emulator (port 5001). The frontend repo does not include function source.

## 🚀 DEPLOYMENT

1. Set `.env` production values (not emulator)
2. `npx firebase deploy --only firestore:rules,firestore:indexes`
3. `npx firebase deploy --only storage`
4. Deploy backend callable functions (separate backend repo, region `asia-south1`)
5. Build customer: `cd frontend/customer-side && npm run build`
6. Build admin: `cd frontend/admin-side && npm run build`
