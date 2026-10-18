import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { ArrowRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { fetchOrdersByUser } from '../functions/orders'
import { formatINR } from '../../../shared/money.js'

export default function OrderHistoryPage() {
  const { user, loading: authLoading } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (authLoading || !user) return
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await fetchOrdersByUser(user.uid)
        setOrders(data)
      } catch (err) {
        setError(err?.message || 'Could not load orders.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user, authLoading])

  if (authLoading) return null

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="text-4xl mb-4">🔐</div>
        <h1 className="font-serif text-2xl text-brown mb-3">Sign in to view orders</h1>
        <p className="text-brown-light mb-6">Please sign in to see your order history.</p>
        <Link to="/login" className="btn-primary inline-flex items-center gap-2">
          <ArrowRight size={16} /> Sign in
        </Link>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <Loader className="mx-auto text-maroon mb-4 animate-spin" size={32} />
        <p className="text-brown-light">Loading your orders…</p>
      </div>
    )
  }

  return (
    <>
      <Helmet>
        <title>My Orders — Vatvruksha Spiritual Vastu Bhandar</title>
        <meta
          name="description"
          content="View your order history and track your spiritual purchases."
        />
      </Helmet>

      <div className="bg-cream-dark border-b border-cream-darker">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <nav aria-label="Breadcrumb" className="text-xs text-brown-light">
            <Link to="/" className="hover:text-maroon">Home</Link>
            <span className="mx-2">›</span>
            <span className="text-brown font-medium">My Orders</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
        <div className="mb-8">
          <p className="text-sm uppercase tracking-[0.2em] text-gold font-semibold">Order History</p>
          <h1 className="font-serif text-3xl text-brown mt-2">My Orders</h1>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-700 text-sm">
            {error}
          </div>
        )}

        {orders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-cream-dark p-10 text-center">
            <div className="text-6xl mb-4">📦</div>
            <h2 className="font-serif text-2xl text-brown mb-3">No orders yet</h2>
            <p className="text-brown-light mb-6">
              Your spiritual purchases will appear here once you place an order.
            </p>
            <Link to="/shop" className="btn-primary inline-flex items-center gap-2">
              <ArrowRight size={16} /> Browse Products
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-cream-dark">
                  <th className="pb-4 text-sm font-semibold text-brown">Order ID</th>
                  <th className="pb-4 text-sm font-semibold text-brown">Date</th>
                  <th className="pb-4 text-sm font-semibold text-brown">Total</th>
                  <th className="pb-4 text-sm font-semibold text-brown">Payment</th>
                  <th className="pb-4 text-sm font-semibold text-brown">Status</th>
                  <th className="pb-4 text-sm font-semibold text-brown">Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-cream-dark hover:bg-maroon-50 transition-colors"
                  >
                    <td className="py-4 text-sm font-mono font-semibold text-brown">
                      {order.orderNumber || order.id}
                    </td>
                    <td className="py-4 text-sm text-brown-light">
                      {new Date(order.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-4 text-sm font-semibold text-brown">
                      {formatINR(order.totals?.total ?? 0)}
                    </td>
                    <td className="py-4 text-sm text-brown-light capitalize">
                      {order.paymentMethod}
                    </td>
                    <td className="py-4 text-sm">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          order.status === 'delivered'
                            ? 'bg-green-50 text-green-700'
                            : order.status === 'confirmed'
                            ? 'bg-maroon-50 text-maroon'
                            : order.status === 'pending_payment'
                            ? 'bg-gold-50 text-gold-dark'
                            : order.status === 'payment_failed'
                            ? 'bg-red-50 text-red-700'
                            : order.status === 'expired'
                            ? 'bg-orange-50 text-orange-700'
                            : 'bg-cream text-brown'
                        }`}
                      >
                        {order.status.replace('_', ' ')}
                      </span>
                      {order.payment?.status && order.payment.status !== order.status && (
                        <span className="ml-2 inline-block px-2 py-1 rounded-full text-xs font-medium bg-cream text-brown-light border border-cream-dark">
                          Payment: {order.payment.status}
                        </span>
                      )}
                    </td>
                    <td className="py-4 text-sm">
                      <Link
                        to={`/orders/${order.id}`}
                        className="text-maroon font-medium hover:underline"
                      >
                        View details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}

function Loader({ className, size }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="12" y1="2" x2="12" y2="6" />
      <line x1="12" y1="18" x2="12" y2="22" />
      <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
      <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
      <line x1="2" y1="12" x2="6" y2="12" />
      <line x1="18" y1="12" x2="22" y2="12" />
      <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
      <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
    </svg>
  )
}
