# Firestore Schema — Vatvruksha Swami Maharaj Spiritual Vastu Bhandar

This document defines the Firestore data schema referenced by the Customer Frontend Integration Guide and Admin Dashboard Integration Guide.

## Security rules

See `firestore.rules` at repo root. Key enforcement points:
- **Orders**: browser can only `read` orders where `userId == auth.uid` (owner filter required). Writes are **not** permitted from the browser — orders are created/updated only via callable Cloud Functions (`createCodOrder`, `createPaytmOrder`).
- **Products / Categories**: public read; admin write requires `request.auth.token.admin == true` AND `request.auth.token.email_verified == true`. Hard-delete is disabled — set `isActive = false` instead.
- **Users / Addresses**: owner-only access (`auth.uid == userId`).
- **Storage**: public read for `products/*` and `categories/*` paths; all writes denied until upload flow is confirmed.

## Composite indexes (`firestore.indexes.json`)

| Collection | Fields | Purpose |
|---|---|---|
| categories | `isActive` ASC, `sortOrder` ASC | Public category listing |
| products | `isActive` ASC, `sortOrder` ASC | Public product listing |
| products | `isActive` ASC, `categoryId` ASC, `sortOrder` ASC | Category page |
| orders | `userId` ASC, `createdAt` DESC | Customer order history |
| orders | `status` ASC, `createdAt` DESC | Admin orders by status |
| orders | `status` ASC, `reservedUntil` ASC | Admin expiry / exceptions |

## Documents

### users/{userId} (profile)

| Field | Type | Notes |
|---|---|---|
| name | string | |
| email | string | from Auth |
| mobile | string | not OTP-verified |
| createdAt | timestamp | |
| updatedAt | timestamp | |

### users/{userId}/addresses/{addressId}

| Field | Type | Notes |
|---|---|---|
| fullName | string | |
| mobile | string | |
| addressLine1 | string | |
| addressLine2 | string | optional |
| landmark | string | optional |
| city | string | |
| state | string | |
| pincode | string | |
| isDefault | boolean | |
| createdAt | timestamp | |
| updatedAt | timestamp | |

### products/{productId}

| Field | Type | Notes |
|---|---|---|
| name | string | |
| slug | string | |
| description | string | |
| categoryId | string | references categories/{id} |
| images | string[] | Storage paths, NOT URLs (e.g. `products/{id}/file.jpg`) |
| specs | object | optional |
| variants | map<variantId, Variant> | `"default"` if no options |
| isActive | boolean | never hard-delete |
| sortOrder | number | |
| createdAt | timestamp | |
| updatedAt | timestamp | |

**Variant** (value of `variants` map):

| Field | Type | Notes |
|---|---|---|
| label | string | |
| sku | string | |
| price | number | integer paise |
| mrp | number | integer paise |
| stock | number | |
| isActive | boolean | hide inactive variants |
| sortOrder | number | |
| weightGrams | number | optional |

Variant IDs: stable keys using lowercase letters, digits, underscore only (no dots/slashes/spaces).

### categories/{categoryId}

| Field | Type | Notes |
|---|---|---|
| name | string | |
| slug | string | |
| description | string | optional |
| imagePath | string | Storage path, optional |
| isActive | boolean | public side filters active only |
| sortOrder | number | |
| createdAt | timestamp | |
| updatedAt | timestamp | |

### orders/{orderId}

| Field | Type | Notes |
|---|---|---|
| orderNumber | string | |
| userId | string | owner filter required |
| customer | object | `{name, email, mobile}` snapshot |
| shippingAddress | object | snapshot of address fields |
| items | object[] | snapshots: `{productId, variantId, name, quantity, price(paise)}` |
| totals | object | `{subtotal, shipping, codFee, total}` — all integer paise, backend-authoritative |
| paymentMethod | string | `"cod"` \| `"paytm"` |
| payment | object | `{status, amount(paise), transactionRef?, verifiedAt?, needsReview?}` |
| status | string | `pending_payment` \| `confirmed` \| `shipped` \| `delivered` \| `payment_failed` \| `expired` \| `cancelled` |
| statusHistory | object[] | `{status, timestamp, actor?}` |
| trackingId | string | optional |
| reservedUntil | timestamp | optional (Paytm ~15 min reservation) |
| stockReleasedAt | timestamp | optional |
| createdAt | timestamp | |
| updatedAt | timestamp | |
| schemaVersion | number | optional |

### Money

All money is **integer paise** in Firestore and in client state. Convert to rupees only at the display edge (`formatINR(paise)`).

## Backend callables (not in this frontend repo)

| Function | Region | Purpose |
|---|---|---|
| createCodOrder | asia-south1 | COD checkout |
| createPaytmOrder | asia-south1 | Paytm checkout, returns CheckoutJS values |
| verifyPaytmPayment | asia-south1 | Owner-only Paytm verification |
| setAdminRole | asia-south1 | Admin claim management |
| expirePendingPaytmOrders | asia-south1 | Scheduled job (not browser-callable) |

Not yet exported (admin UI keeps controls disabled): mark shipped/delivered, record COD collection, adjust stock (transactional), cancel/refund, admin resolve of uncertain Paytm payments.

## Open decisions

- Storage bucket name and image path convention (`products/{productId}/{filename}`, `categories/{categoryId}/{filename}`)
- Shipping / COD fee / pincode / tax policy (not final)
- Low-stock threshold (default 5, pending confirmation)
- Late Paytm success after reservation expiry
- Email provider
- Cancellation / refund workflow
