# Vatvruksha Swami Maharaj Spiritual Vastu Bhandar — Implementation Plan

## 1) Project status

I reviewed the existing frontend scaffold and confirmed the project already includes:
- React + Vite setup
- React Router structure
- Tailwind styling foundations
- Product/category data files
- Store/cart/wishlist setups
- Several core pages and UI components already in place

The plan below is therefore designed as a production refactor + completion plan, not a greenfield project.

## 2) Sitemap

- `/` — Home page
  - Announcement bar
  - Header with nav, search, wishlist, account, cart
  - Hero banner
  - 9 deity category tiles
  - Product collection grid
  - Tabbed products section
  - Why choose us
  - Trust strip
  - Footer
- `/shop` — Shop page
  - Filters: category, material, price range
  - Sort control
  - Product grid
  - Search results support
- `/category/:slug` — Category landing page
  - Hero banner with category identity
  - Filtered shop view with category pre-selected
- `/product/:id` — Product detail page
  - Image gallery
  - Price, discount, size/material details
  - Quantity selector
  - Add to cart, wishlist, order on WhatsApp
  - Related products
- `/wishlist` — Wishlist page
- `/cart` — Full cart page
- `/checkout` — Checkout form and order summary
- `/about` — About us page
- `/contact` — Contact page with map placeholder and inquiry form
- `/account` — My Account placeholder route
- `/404` — Not Found page

## 3) Component tree

```text
App
├── HelmetProvider
├── BrowserRouter
├── Toaster
├── Layout
│   ├── SkipLink
│   ├── AnnouncementBar
│   ├── Navbar
│   │   ├── Logo / Brand
│   │   ├── NavLinks
│   │   ├── SearchBar with suggestions
│   │   ├── WishlistButton
│   │   ├── AccountButton
│   │   └── CartButton
│   ├── MainContent
│   │   ├── HomePage
│   │   │   ├── HeroBanner
│   │   │   ├── CategoryTile (9 + extra categories)
│   │   │   ├── SectionTitle
│   │   │   ├── ProductCard grid
│   │   │   ├── TabbedProducts
│   │   │   ├── WhyChooseUs
│   │   │   ├── TrustStrip
│   │   │   └── Newsletter / CTA
│   │   ├── ShopPage
│   │   │   ├── FilterSidebar
│   │   │   ├── ProductGrid
│   │   │   ├── SortControls
│   │   │   └── SkeletonCard list
│   │   ├── CategoryPage
│   │   │   └── ShopPage(preCategory)
│   │   ├── ProductPage
│   │   │   ├── ProductGallery
│   │   │   ├── ProductMeta
│   │   │   ├── ProductActions
│   │   │   ├── ProductTabs / Description
│   │   │   └── RelatedProducts
│   │   ├── CartPage
│   │   │   ├── CartItem
│   │   │   ├── OrderSummary
│   │   │   └── EmptyCartState
│   │   ├── CheckoutPage
│   │   │   ├── CheckoutForm
│   │   │   ├── CheckoutSummary
│   │   │   └── ValidationFeedback
│   │   ├── WishlistPage
│   │   │   └── ProductCard grid
│   │   ├── AboutPage
│   │   ├── ContactPage
│   │   │   ├── ContactForm
│   │   │   ├── BusinessInfo
│   │   │   └── MapPlaceholder
│   │   ├── AccountPage
│   │   └── NotFoundPage
│   ├── CartDrawer
│   │   ├── CartItems
│   │   ├── QuantityStepper
│   │   └── DrawerSummary
│   ├── FloatingWhatsApp
│   └── Footer
│       ├── Column links
│       ├── Social icons
│       └── Contact details
└── hooks / utils / stores
    ├── useDebouncedSearch
    ├── useSeoMeta
    ├── cartStore (persisted)
    ├── wishlistStore (persisted)
    ├── cartDrawerStore
    ├── whatsapp util
    └── product utils
```

## 4) Data schema

### Product schema

```js
{
  id: 'gan-001',
  name: 'Panchadhatu Ganesh Murti — 12 Inch',
  slug: 'panchadhatu-ganesh-murti-12-inch',
  category: 'ganesha',
  tags: ['best', 'sale'],
  price: 2499,
  salePrice: 1899,
  material: 'Panchadhatu',
  size: '12 inch',
  weight: '1.2 kg',
  description: 'Premium handcrafted murti...',
  images: ['url1', 'url2', 'url3'],
  stock: 12,
  rating: 4.8,
  reviewCount: 56,
  featured: true,
  isNew: false,
  categoryName: 'Ganesha'
}
```

### Category schema

```js
{
  id: 'ganesha',
  slug: 'ganesha',
  name: 'Ganesha',
  devanagari: 'गणेश',
  description: 'Handcrafted Ganesha idols for auspicious beginnings.',
  color: '#E8741A',
  image: '/images/categories/ganesha.jpg'
}
```

### Store config schema

File: `src/config/store.js`

```js
export const STORE = {
  name: 'Vatvruksha Swami Maharaj Spiritual Vastu Bhandar',
  shortName: 'Vatvruksha Bhandar',
  whatsapp: '919999999999',
  phone: '+91 99999 99999',
  email: 'info@vatvruksha.com',
  address: { ... },
  freeShippingThreshold: 2000,
  currency: '₹',
  currencyCode: 'INR',
  social: { ... },
  hours: 'Mon–Sat: 9:00 AM – 8:00 PM'
}
```

### Cart store schema

```js
[
  {
    id: 'gan-001',
    quantity: 1,
    price: 1899,
    salePrice: 1899,
    name: 'Panchadhatu Ganesh Murti — 12 Inch'
  }
]
```

### Wishlist schema

```js
['gan-001', 'ram-001']
```

## 5) Design tokens

### Core palette
- Saffron: `#E8741A`
- Deep Maroon: `#7A1F2B`
- Gold: `#C9962B`
- Cream: `#FFF8EC`
- Dark Brown Text: `#2B1A14`
- Warm light neutrals for backgrounds and dividers

### Typography
- Headings: Playfair Display / Cormorant Garamond / similar serif
- Body: Inter / Poppins / similar sans-serif
- Use strong serif for hero headings and product titles, clean sans for interface copy

### Layout principles
- Mobile-first spacing scale with comfortable tap targets
- Rounded cards with soft shadows
- Thin gold divider lines and mandala-inspired ornaments
- Subtle hover transitions, no heavy motion
- Warm gradients only on selected surfaces, not overused

### Buttons / UI patterns
- Primary: saffron background, white/cream text, gold hover tint
- Secondary: cream background, maroon border/text
- Sale badge: maroon, cream text
- Quantity controls: rounded pill or soft rectangle with neutral border
- Section spacing: multi-breakpoint spacing tuned for 360px to 1440px+

## 6) Build stages

### Stage A — Project setup + design tokens + layout
- Confirm and finalize Tailwind configuration
- Add global theme tokens in `src/index.css`
- Set up fonts via CSS import and base styling
- Finalize fixed layout shell: announcement bar, header, footer, cart drawer, floating WhatsApp
- Create a stable responsive container and utility classes

### Stage B — Home page
- Build `HeroBanner`
- Add 9 core deity tiles + 3 extra category tiles
- Implement “Our Collection” product grid
- Add tabbed product section (Best Sellers / New Arrivals / On Sale)
- Add “Why Choose Us” and trust strip
- Finalize footer and CTA styling

### Stage C — Shop / Category / Product
- Implement robust product filtering and sorting
- Add live search with suggestions in header
- Add category and product detail pages
- Add related products and product image gallery
- Integrate wishlist and cart actions

### Stage D — Cart / Wishlist / Checkout
- Persist cart and wishlist to localStorage
- Add slide-in cart drawer and dedicated cart page
- Implement quantity updates and removal logic
- Calculate subtotal and free-shipping progress
- Build checkout form with validation and WhatsApp order message generation

### Stage E — About / Contact / 404
- About page with trust story and business details
- Contact page with form, map placeholder, phone, address, timings
- 404 page with sensible call to action
- Add SEO meta titles/descriptions for all routes

### Stage F — Polish, accessibility, QA
- Validate keyboard focus states and semantic markup
- Add loading/skeleton states
- Add toast notifications for actions
- Run lint/build and fix console issues
- Test at mobile and desktop viewport widths

## 7) Technical decisions and assumptions

- Use Zustand for cart/wishlist persistence because it matches the current setup and keeps the app lightweight.
- Keep all product data in `src/data/products.js` as the source of truth; this can later be swapped with CMS/API in a clean adapter layer.
- Use `wa.me` prefilled order links with message text generated from cart items and checkout form.
- Keep all product images as generated placeholders or local public placeholders to satisfy the brief and allow easy replacement later.
- Use the exact business metadata in `src/config/store.js` so the client only edits one file.
- The provided reference site is used as a layout inspiration only, not copied directly. Copying text/images/logo is explicitly avoided.

## 8) Risk check / sensible choices

- Since the reference site is not directly available in the browser from this environment, we will follow the described page order and layout structure, while keeping all original text, assets, and branding independent.
- For a production-ready e-commerce flow, cart and wishlist persistence will rely on localStorage, with the data structures kept clean enough to be later replaced by a backend or CMS.
- The “My Account” route will be a lightweight placeholder page unless specifically expanded later, to maintain the requested routing without introducing unnecessary complexity.

## 9) Definition of done

The project is considered complete when all required routes and features work, the design matches the devotional luxury direction, mobile responsiveness is good, the app builds without lint/runtime issues, and the code is organized for future backend integration.

## 10) Phase 2 (explicitly deferred)

- Razorpay integration
- Real payment flow
- Backend admin/CMS integration
- Real product images and catalog management
- Live inventory API
- Advanced analytics / CRM

This is intentionally left as a clean extension point, not implemented in the current build.
