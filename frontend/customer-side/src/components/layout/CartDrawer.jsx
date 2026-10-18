import { Link, useNavigate } from 'react-router-dom'
import { X, ShoppingCart, Trash2, Plus, Minus, ArrowRight } from 'lucide-react'
import useCartStore from '../../store/cartStore'
import useCartDrawerStore from '../../store/cartDrawerStore'
import { useCatalogue } from '../../context/CatalogueContext'
import { formatINR } from '../../../../shared/money.js'
import Image from '../ui/Image'

export default function CartDrawer() {
  const { isOpen, close } = useCartDrawerStore()
  const items = useCartStore((s) => s.items)
  const removeItem = useCartStore((s) => s.removeItem)
  const updateQuantity = useCartStore((s) => s.updateQuantity)
  const navigate = useNavigate()
  const { products: allProducts } = useCatalogue()

  const productById = {}
  allProducts.forEach((p) => {
    productById[p.id] = p
  })

  const subtotal = items.reduce((sum, item) => {
    const product = productById[item.productId]
    const price = product?.variants?.[item.variantId]?.price ?? 0
    return sum + price * item.quantity
  }, 0)

  const freeShippingThreshold = 200000 // ₹2,000 in paise (placeholder pending policy)
  const freeShippingProgress = Math.min((subtotal / freeShippingThreshold) * 100, 100)
  const amountLeft = Math.max(freeShippingThreshold - subtotal, 0)

  const handleCheckout = () => {
    close()
    navigate('/checkout')
  }

  if (!isOpen) return null

  return (
    <>
      <div className="drawer-overlay" onClick={close} aria-hidden="true" />

      <div
        className="fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-cream flex flex-col shadow-2xl animate-slide-in-right"
        role="dialog"
        aria-label="Shopping cart"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-maroon text-cream">
          <div className="flex items-center gap-2">
            <ShoppingCart size={20} />
            <h2 className="font-serif text-lg font-semibold">Your Cart</h2>
            {items.length > 0 && (
              <span className="bg-gold text-brown text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {items.reduce((s, i) => s + i.quantity, 0)}
              </span>
            )}
          </div>
          <button
            onClick={close}
            className="p-1 text-cream/80 hover:text-cream transition-colors"
            aria-label="Close cart"
          >
            <X size={22} />
          </button>
        </div>

        {/* Free Shipping Progress */}
        {items.length > 0 && (
          <div className="px-5 py-3 bg-gold-50 border-b border-gold/20">
            {amountLeft === 0 ? (
              <p className="text-xs text-green-700 font-semibold text-center">
                🎉 You've unlocked FREE shipping!
              </p>
            ) : (
              <p className="text-xs text-brown text-center mb-1.5">
                Add{' '}
                <strong>{formatINR(amountLeft)}</strong>{' '}
                more for FREE shipping
              </p>
            )}
            <div className="h-2 bg-cream-darker rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-saffron to-gold rounded-full transition-all duration-500"
                style={{ width: `${freeShippingProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-4 py-12">
              <div className="text-6xl">🛒</div>
              <p className="font-serif text-xl text-brown">Your cart is empty</p>
              <p className="text-sm text-brown-light">
                Add some divine idols to begin your journey
              </p>
              <button
                onClick={() => { close(); navigate('/shop') }}
                className="btn-primary mt-2"
              >
                Explore Shop
              </button>
            </div>
          ) : (
            items.map((item) => {
              const product = productById[item.productId]
              const variant = product?.variants?.[item.variantId]
              const price = variant?.price ?? 0
              const imagePath =
                product?.images?.[0] || (variant?.imagePath ?? null)

              if (!product) return null

              return (
                <div
                  key={`${item.productId}-${item.variantId}`}
                  className="flex gap-3 bg-white rounded-xl p-3 shadow-sm border border-cream-dark"
                >
                  <Link
                    to={`/product/${item.productId}`}
                    onClick={close}
                  >
                    <Image
                      src={imagePath}
                      alt={product.name}
                      className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                    />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/product/${item.productId}`}
                      onClick={close}
                      className="text-sm font-medium text-brown hover:text-maroon transition-colors line-clamp-2"
                    >
                      {product.name}
                    </Link>
                    {variant && variant.label && variant.label !== 'default' && (
                      <p className="text-xs text-brown-light mt-0.5">
                        {variant.label}
                      </p>
                    )}
                    <p className="text-sm font-semibold text-maroon mt-1">
                      {formatINR(price)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end justify-between">
                    <button
                      onClick={() =>
                        removeItem(item.productId, item.variantId)
                      }
                      className="text-brown-light hover:text-red-500 transition-colors p-1"
                      aria-label="Remove item"
                    >
                      <Trash2 size={14} />
                    </button>
                    {/* Quantity */}
                    <div className="flex items-center gap-1 bg-cream rounded-lg">
                      <button
                        onClick={() =>
                          updateQuantity(
                            item.productId,
                            item.variantId,
                            item.quantity - 1
                          )
                        }
                        className="p-1 hover:text-maroon transition-colors"
                        aria-label="Decrease quantity"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="text-sm font-semibold w-5 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(
                            item.productId,
                            item.variantId,
                            item.quantity + 1
                          )
                        }
                        className="p-1 hover:text-maroon transition-colors"
                        aria-label="Increase quantity"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="px-5 py-4 border-t border-cream-dark bg-white space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-brown-light">Subtotal</span>
              <span className="font-serif text-lg font-bold text-brown">
                {formatINR(subtotal)}
              </span>
            </div>
            <button
              onClick={handleCheckout}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3"
            >
              Checkout
              <ArrowRight size={16} />
            </button>
            <Link
              to="/cart"
              onClick={close}
              className="block text-center text-sm text-maroon font-medium hover:underline py-1"
            >
              View Full Cart
            </Link>
          </div>
        )}
      </div>
    </>
  )
}
