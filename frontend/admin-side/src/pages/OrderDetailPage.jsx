import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { ArrowRight, Clock, AlertCircle, RotateCw } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useAdminAuth } from '../context/AuthContext'
import { fetchOrderById } from '../functions/queries'
import { callVerifyPaytmPayment } from '../functions/checkout'
import { formatINR } from '../../../shared/money.js'
import PendingActionButton from '../components/PendingActionButton'

export default function OrderDetailPage() {
  const { orderId } = useParams()
  const { user, refreshClaims } = useAdminAuth()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [verifying, setVerifying] = useState(false)

  useEffect(() => {
    if (!user) return
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await fetchOrderById(orderId)
        setOrder(data)
      } catch (err) {
        setError(err?.message || 'Could not load order details.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user, orderId])

  if (loading) return null
  if (error) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <AlertCircle className="mx-auto text-red-600 mb-6" size={48} />
        <h1 className="font-serif text-2xl text-brown mb-3">Order not found</h1>
        <p className="text-brown-light mb-6">{error}</p>
        <Link to="/admin/orders" className="btn-primary inline-flex items-center gap-2">
          <ArrowRight size={16} /> Back to Orders
        </Link>
      </div>
    )
  }
  if (!order) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <AlertCircle className="mx-auto text-red-600 mb-6" size={48} />
        <h1 className="font-serif text-2xl text-brown mb-3">Order not found</h1>
        <Link to="/admin/orders" className="btn-primary inline-flex items-center gap-2">
          <ArrowRight size={16} /> Back to Orders
        </Link>
      </div>
    )
  }

  const handleRecheckPayment = async () => {
    setVerifying(true)
    try {
      await refreshClaims()
      const resp = await callVerifyPaytmPayment({ orderId: order.id })
      const data = resp.data || resp
      const { status, paymentStatus, ok } = data

      if (!ok || status === 'data-loss' || paymentStatus === 'data-loss') {
        toast.error('We could not verify payment yet; check again.')
        return
      }

      toast.success('Payment status updated.')
      setOrder((prev) => ({
        ...prev,
        paymentStatus: paymentStatus ?? status,
        status: status ?? prev.status,
      }))
    } catch (err) {
      toast.error(err?.message || 'Verification failed.')
    } finally {
      setVerifying(false)
    }
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

  return (
    <>
      <Helmet>
        <title>Order {order.orderNumber || order.id} — Vatvruksha Admin</title>
      </Helmet>

      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-gold font-semibold">Order Details</p>
          <h1 className="font-serif text-3xl text-brown mt-2">
            Order #{order.orderNumber || order.id}
          </h1>
        </div>
        <Link to="/admin/orders" className="btn-ghost inline-flex items-center gap-2">
          <ArrowRight size={14} /> Back to Orders
        </Link>
      </div>

      {order.paymentMethod === 'paytm' &&
        order.payment?.status === 'pending' && (
          <div className="mb-6 p-4 rounded-xl bg-gold-50 border border-gold-200 text-sm">
            <div className="flex items-start gap-3">
              <Clock className="text-gold-dark mt-0.5 w-5 h-5" />
              <div>
                <p className="font-medium text-brown">Paytm payment pending</p>
                <p className="text-brown-light">
                  Awaiting server verification. Do not fulfil or release stock while uncertain.
                </p>
                <button
                  onClick={handleRecheckPayment}
                  disabled={verifying}
                  className="mt-3 text-sm font-medium text-maroon hover:underline flex items-center gap-1"
                >
                  <RotateCw size={14} className={verifying ? 'animate-spin' : ''} />
                  {verifying ? 'Verifying…' : 'Check Payment Status'}
                </button>
              </div>
            </div>
          </div>
        )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: customer + address */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-white rounded-2xl border border-cream-dark p-6">
            <h3 className="font-serif text-xl text-brown mb-4">Customer</h3>
            <div className="space-y-2 text-sm text-brown-light">
              <p className="font-medium text-brown">
                {order.customer?.name || '—'}
              </p>
              <p>{order.customer?.email || '—'}</p>
              <p>{order.customer?.mobile || '—'}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-cream-dark p-6">
            <h3 className="font-serif text-xl text-brown mb-4">Shipping Address</h3>
            <div className="space-y-2 text-sm text-brown-light">
              <p>{order.shippingAddress?.fullName || '—'}</p>
              <p>{order.shippingAddress?.mobile || '—'}</p>
              <p>{order.shippingAddress?.addressLine1 || '—'}</p>
              {order.shippingAddress?.addressLine2 && (
                <p>{order.shippingAddress.addressLine2}</p>
              )}
              {order.shippingAddress?.landmark && (
                <p>{order.shippingAddress.landmark}</p>
              )}
              <p>
                {order.shippingAddress?.city || '—'},{' '}
                {order.shippingAddress?.state || '—'} -{' '}
                {order.shippingAddress?.pincode || '—'}
              </p>
            </div>
          </div>
        </div>

        {/* Right: items + totals */}
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-white rounded-2xl border border-cream-dark p-6">
            <h3 className="font-serif text-xl text-brown mb-4">Items</h3>
            <div className="space-y-4">
              {(order.items || []).map((item) => (
                <div key={`${item.productId}-${item.variantId}`} className="flex gap-4 border-b border-cream-dark pb-4 last:border-0 last:pb-0">
                  <div className="flex-1">
                    <p className="font-medium text-brown line-clamp-1">
                      {item.name}
                    </p>
                    {item.variantId && item.variantId !== 'default' && (
                      <p className="text-xs text-brown-light">
                        Variant: {item.variantId}
                      </p>
                    )}
                    <p className="text-sm text-brown-light">
                      Qty: {item.quantity}
                    </p>
                    <p className="text-sm font-semibold text-brown">
                      {formatINR(item.price ?? 0)}
                    </p>
                  </div>
                </div>
              ))}
              {(!order.items || order.items.length === 0) && (
                <p className="text-brown-light text-sm">No item snapshots available.</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-cream-dark p-6">
            <h3 className="font-serif text-xl text-brown mb-4">Totals</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-brown-light">
                <span>Subtotal</span>
                <span>{formatINR(order.totals?.subtotal ?? 0)}</span>
              </div>
              <div className="flex justify-between text-brown-light">
                <span>Shipping</span>
                <span>{formatINR(order.totals?.shipping ?? 0)}</span>
              </div>
              <div className="flex justify-between text-brown-light">
                <span>COD Fee</span>
                <span>{formatINR(order.totals?.codFee ?? 0)}</span>
              </div>
              <div className="border-t border-cream-dark pt-3 flex justify-between text-base font-bold text-brown">
                <span>Total</span>
                <span>{formatINR(order.totals?.total ?? 0)}</span>
              </div>
            </div>
            <div className="mt-4 space-y-1 text-xs text-brown-light">
              <div className="flex justify-between">
                <span>Payment method</span>
                <span className="capitalize">{order.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span>Payment status</span>
                <span className={`badge status-badge ${statusVariant(order.payment?.status || 'pending')}`}>
                  {order.payment?.status || 'pending'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Order status</span>
                <span className={`badge status-badge ${statusVariant(order.status)}`}>
                  {statusLabel(order.status)}
                </span>
              </div>
              {order.trackingId && (
                <div className="flex justify-between">
                  <span>Tracking ID</span>
                  <span className="font-mono">{order.trackingId}</span>
                </div>
              )}
              {order.reservedUntil && (
                <div className="flex justify-between">
                  <span>Reserved until</span>
                  <span>{new Date(order.reservedUntil).toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Payment refs */}
          {order.paymentMethod === 'paytm' && order.payment && (
            <div className="bg-white rounded-2xl border border-cream-dark p-6">
              <h3 className="font-serif text-xl text-brown mb-4">Payment References</h3>
              <div className="space-y-2 text-sm text-brown-light">
                <div className="flex justify-between">
                  <span>Transaction ref</span>
                  <span className="font-mono">{order.payment.transactionRef || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Amount</span>
                  <span>{formatINR(order.payment.amount ?? 0)}</span>
                </div>
                {order.payment.verifiedAt && (
                  <div className="flex justify-between">
                    <span>Verified at</span>
                    <span>{new Date(order.payment.verifiedAt).toLocaleString()}</span>
                  </div>
                )}
                {order.payment.needsReview && (
                  <p className="mt-2 text-xs text-red-700 bg-red-50 p-2 rounded">
                    ⚠️ This payment needs manual review.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status history */}
      <div className="mt-8 bg-white rounded-2xl border border-cream-dark p-6">
        <h3 className="font-serif text-xl text-brown mb-4">Status History</h3>
        <div className="space-y-4">
          {(order.statusHistory || []).map((entry, idx) => (
            <div key={idx} className="flex gap-3 text-sm">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-cream-dark flex items-center justify-center text-xs font-semibold text-brown">
                {idx + 1}
              </div>
              <div>
                <p className="font-medium text-brown">{entry.status || '—'}</p>
                {entry.timestamp && (
                  <p className="text-xs text-brown-light">
                    {new Date(entry.timestamp).toLocaleString('en-IN')}
                  </p>
                )}
                {entry.actor && <p className="text-xs text-brown-light">By: {entry.actor}</p>}
              </div>
            </div>
          ))}
          {(!order.statusHistory || order.statusHistory.length === 0) && (
            <p className="text-brown-light text-sm">No status history available.</p>
          )}
        </div>
      </div>

      {/* Disabled backend-pending actions */}
      <div className="mt-8 bg-maroon-50/20 rounded-2xl border border-maroon-100 p-6">
        <h3 className="font-serif text-xl text-brown mb-4">Order Actions</h3>
        <p className="text-xs text-brown-light mb-4">
          The following controls are disabled until the corresponding backend
          endpoints are exported. No writes are made to Firestore directly.
        </p>
        <div className="flex flex-wrap gap-4">
          <PendingActionButton label="Mark Shipped" tooltip="Mark shipped / delivered, add tracking ID — backend endpoint pending" />
          <PendingActionButton label="Add Tracking ID" tooltip="Add tracking ID — backend endpoint pending" />
          {order.paymentMethod === 'cod' && order.payment?.status === 'pending' && (
            <PendingActionButton label="Record COD Collection" tooltip="Record COD collection — backend endpoint pending" />
          )}
          <PendingActionButton label="Cancel / Refund" tooltip="Cancel / refund — deferred until backend workflow exists" />
        </div>
      </div>
    </>
  )
}
