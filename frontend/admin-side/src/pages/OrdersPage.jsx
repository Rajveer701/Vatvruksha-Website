import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { ArrowRight, Search, Filter, Clock, AlertCircle } from 'lucide-react'
import { useAdminAuth } from '../context/AuthContext'
import { fetchOrders, searchOrderById } from '../functions/queries'
import { formatINR } from '../../../shared/money.js'

const STATUS_FILTERS = [
  { value: '', label: 'All statuses' },
  { value: 'pending_payment', label: 'Pending Payment' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'payment_failed', label: 'Payment Failed' },
  { value: 'expired', label: 'Expired' },
]

export default function OrdersPage() {
  const { user } = useAdminAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [lastDoc, setLastDoc] = useState(null)
  const [hasMore, setHasMore] = useState(true)

  useEffect(() => {
    if (!user) return
    loadOrders()
  }, [user, statusFilter, searchQuery])

  const loadOrders = async (reset = true) => {
    setLoading(true)
    setError(null)
    try {
      let items = []
      let newLastDoc = null
      let newHasMore = false

      if (searchQuery) {
        // Exact order-ID search
        items = await searchOrderById(searchQuery)
      } else {
        const res = await fetchOrders({
          status: statusFilter || undefined,
          pageSize: 15,
          startAfterDoc: reset ? null : lastDoc,
        })
        items = res.items
        newLastDoc = res.lastDoc
        newHasMore = res.hasMore
      }

      if (reset) {
        setOrders(items)
        setLastDoc(newLastDoc)
        setHasMore(newHasMore)
      } else {
        setOrders((prev) => [...prev, ...items])
        setLastDoc(newLastDoc)
        setHasMore(newHasMore)
      }
    } catch (err) {
      setError(err?.message || 'Could not load orders.')
    } finally {
      setLoading(false)
    }
  }

  const loadMore = () => {
    if (hasMore && !loading) loadOrders(false)
  }

  const statusLabel = (s) => {
    switch (s) {
      case 'pending_payment': return 'Pending Payment'
      case 'confirmed': return 'Confirmed'
      case 'shipped': return 'Shipped'
      case 'delivered': return 'Delivered'
      case 'payment_failed': return 'Payment Failed'
      case 'expired': return 'Expired'
      case 'cancelled': return 'Cancelled'
      default: return String(s).replace('_', ' ')
    }
  }

  const statusVariant = (s) => {
    switch (s) {
      case 'delivered': return 'status-delivered'
      case 'confirmed': return 'status-confirmed'
      case 'shipped': return 'status-shipped'
      case 'pending_payment': return 'status-pending_payment'
      case 'payment_failed': return 'status-payment_failed'
      case 'expired': return 'status-expired'
      case 'cancelled': return 'status-cancelled'
      default: return 'bg-cream text-brown border-cream-dark'
    }
  }

  const paymentVariant = (s) => {
    switch (s) {
      case 'pending': return 'payment-pending'
      case 'paid': return 'payment-paid'
      case 'failed': return 'payment-failed'
      default: return 'payment-pending'
    }
  }

  if (loading) return null

  return (
    <>
      <Helmet>
        <title>Orders — Vatvruksha Admin</title>
      </Helmet>

      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-gold font-semibold">Orders</p>
          <h1 className="font-serif text-3xl text-brown mt-2">Manage Orders</h1>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search exact order ID…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-64 sm:w-80 rounded-xl border border-cream-dark px-3 py-2 bg-cream text-brown focus:outline-none focus:border-maroon"
          />
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <div className="flex gap-2">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`px-3 py-1.5 rounded text-xs font-medium border transition-colors ${
                statusFilter === f.value
                  ? 'bg-maroon text-white border-maroon'
                  : 'bg-cream text-brown border-cream-dark hover:bg-maroon-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="text-xs text-brown-light">
          {orders.length} order{orders.length !== 1 ? 's' : ''}{searchQuery
            ? ` matching "${searchQuery}"`
            : ''}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th className="w-20">Order ID</th>
              <th>Date</th>
              <th className="w-48">Customer</th>
              <th className="w-20">Total</th>
              <th className="w-24">Payment</th>
              <th className="w-24">Order Status</th>
              <th className="w-16">Exception</th>
              <th className="w-20">Action</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => {
              const isException =
                order.payment?.needsReview === true ||
                (order.paymentMethod === 'paytm' &&
                  order.payment?.status === 'pending')
              return (
                <tr key={order.id} className="border-b border-cream-dark hover:bg-maroon-50/30 transition-colors">
                  <td className="font-mono font-semibold text-brown">
                    {order.orderNumber || order.id}
                  </td>
                  <td className="text-brown-light">
                    {new Date(order.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                  <td>
                    <p className="font-medium text-brown">
                      {order.customer?.name || '—'}
                    </p>
                    <p className="text-xs text-brown-light">
                      {order.customer?.mobile || '—'}
                    </p>
                  </td>
                  <td className="font-semibold text-brown">
                    {formatINR(order.totals?.total ?? 0)}
                  </td>
                  <td>
                    <span className={`badge status-badge ${paymentVariant(order.payment?.status || order.paymentMethod)}`}>
                      {(order.paymentMethod || 'cod').toUpperCase()} ·
                      {order.payment?.status || 'pending'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge status-badge ${statusVariant(order.status)}`}>
                      {statusLabel(order.status)}
                    </span>
                  </td>
                  <td>
                    {isException ? (
                      <span className="badge status-badge status-expired" title="Payment needs review / pending too long">
                        ⚠ Review
                      </span>
                    ) : (
                      <span className="badge status-badge status-delivered" style={{ opacity: 0.5 }}>
                        ✓
                      </span>
                    )}
                  </td>
                  <td>
                    <ArrowRight
                      size={14}
                      className="mr-1 text-brown-light"
                    />
                    <a
                      href={`/admin/orders/${order.id}`}
                      className="text-maroon font-medium hover:underline"
                    >
                      View
                    </a>
                  </td>
                </tr>
              )
            })}
            {orders.length === 0 && (
              <tr>
                <td colSpan={8} className="py-8 text-center text-brown-light">
                  No orders found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {hasMore && (
        <div className="mt-4 flex justify-center">
          <button
            onClick={loadMore}
            disabled={loading}
            className="btn-primary inline-flex items-center gap-2 disabled:opacity-60"
          >
            Load More Orders
          </button>
        </div>
      )}
    </>
  )
}
