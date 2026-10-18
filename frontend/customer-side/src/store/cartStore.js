import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Cart item shape (client state): { productId, variantId, quantity }
// Prices/totals are NEVER stored as authoritative — they are re-looked-up from the
// catalogue at display time. Only {productId, variantId, quantity} is sent to the backend.
const useCartStore = create(
  persist(
    (set, get) => ({
      items: [], // { productId, variantId, quantity }

      addItem: (productId, variantId = 'default', quantity = 1) => {
        const { items } = get()
        const existing = items.find(
          (i) => i.productId === productId && i.variantId === variantId
        )
        if (existing) {
          set({
            items: items.map((i) =>
              i.productId === productId && i.variantId === variantId
                ? { ...i, quantity: i.quantity + quantity }
                : i
            ),
          })
        } else {
          set({ items: [...items, { productId, variantId, quantity }] })
        }
      },

      removeItem: (productId, variantId = 'default') => {
        set({
          items: get().items.filter(
            (i) => !(i.productId === productId && i.variantId === variantId)
          ),
        })
      },

      updateQuantity: (productId, variantId, quantity) => {
        if (quantity < 1) return
        set({
          items: get().items.map((i) =>
            i.productId === productId && i.variantId === variantId
              ? { ...i, quantity }
              : i
          ),
        })
      },

      clearCart: () => set({ items: [] }),

      // Computed helpers
      get totalItems() {
        return get().items.reduce((sum, i) => sum + i.quantity, 0)
      },

      // Look up a cart item by product/variant
      findItem: (productId, variantId = 'default') =>
        get().items.find((i) => i.productId === productId && i.variantId === variantId),
    }),
    {
      name: 'vatvruksha-cart',
    }
  )
)

export default useCartStore
