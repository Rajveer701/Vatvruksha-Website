import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { ArrowRight, Search, AlertCircle, Clock, RotateCw } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useAdminAuth } from '../context/AuthContext'
import { fetchOrders } from '../functions/queries'
import { callVerifyPaytmPayment } from '../functions/checkout'
import { formatINR } from '../../../shared/money.js'

export default function ExceptionsPage() {
  const { user } = useAdminAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [verifying, setVerifying] = useState({})

  useEffect(() => {
    if (!user) return
    loadExceptions()
  }, [user])

  const loadExceptions = async () => {
    setLoading(true)
    setError(null)
    try {
      const now = Date.now()
        const all = []
      let lastDoc = null
      let hasMore = true
      while (hasMore && all.length < 500) {
        const res = await fetchOrders({ pageSize: 100, startAfterDoc: lastDoc })
        all.push(...res.items)
        lastDoc = res.lastDoc
        hasMore = res.hasMore && all.length < 500
      }

      const exceptions = all.filter((o) => {
        // payment.needsReview == true (field may be absent)
        if (o.payment?.needsReview === true) return true
        // pending too long (>24h)
        if (
          o.paymentMethod === 'paytm' &&
          o.payment?.status === 'pending' &&
          now - new Date(o.createdAt).getTime() > 24 * 60 * 60 * 1000
        )
          return true
        // amount mismatch: payment.amount !== totals.total
        if (
          o.paymentMethod === 'paytm' &&
          o.payment?.amount != null &&
          o.totals?.total != null &&
          o.payment.amount !== o.totals.total
        )
          return true
        return false
      })

      setOrders(exceptions)
    } catch (err) {
      setError(err?.message || 'Could not load exceptions.')
    } finally {
      setLoading(false)
    }
  }

  const handleReview = async (orderId) => {
    setVerifying((prev) => ({ ...prev, [orderId]: true }))
    try {
      const resp = await callVerifyPaytmPayment({ orderId })
      const data = resp.data || resp
      const { status, paymentStatus, ok } = data

      if (!ok || status === 'data-loss' || paymentStatus === 'data-loss') {
        toast.error(`Could not verify order ${orderId} yet; check again.`)
        return
      }

      toast.success(`Order ${orderId} reviewed — ${paymentStatus || status}.`)
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? { ...o, paymentStatus: paymentStatus || status, status: status || o.status }
            : o
        )
      )
    } catch (err) {
      toast.error(err?.message || 'Review failed.')
    } finally {
      setVerifying((prev) => {
        const { [orderId]: _, ...rest } = prev
        return rest
      })
    }
  }

  const reason = (o) => {
    const reasons = []
    if (o.payment?.needsReview === true) reasons.push('needsReview flag set')
    if (
      o.paymentMethod === 'paytm' &&
      o.payment?.status === 'pending' &&
      Date.now() - new Date(o.createdAt).getTime() > 24 * 60 * 60 * 1000
    )
      reasons.push('pending > 24h')
    if (
      o.paymentMethod === 'paytm' &&
      o.payment?.amount != null &&
      o.totals?.total != null &&
      o.payment.amount !== o.totals.total
    )
      reasons.push('amount mismatch')
    return reasons.join(', ') || 'payment exception'
  }

  if (loading) return null

  return (
    <>
      <Helmet>
        <title>Payment Exceptions — Vatvruksha Admin</title>
      </Helmet>

      <div className="mb-6">
        <p className="text-sm uppercase tracking-[0.2em] text-gold font-semibold">Payment Exceptions</p>
        <h1 className="font-serif text-3xl text-brown mt-2">Exceptions Queue</h1>
        <p className="text-brown-light text-sm mt-1">
          Includes pending-too-long, signature/API errors, amount mismatch,
          late success, and payment.needsReview == true. Never provide a "force
          mark paid" action.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <div className="text-xs text-brown-light font-medium">
          {orders.length} exception{orders.length !== 1 ? 's' : ''}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th className="w-20">Order ID</th>
              <th className="w-40">Customer</th>
              <th className="w-24">Total</th>
              <th className="w-24">Payment</th>
              <th className="w-24">Reason</th>
              <th className="w-28">Action</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-b border-cream-dark hover:bg-maroon-50/30 transition-colors">
                <td className="font-mono font-semibold text-brown">
                  {o.orderNumber || o.id}
                </td>
                <td className="text-brown-light">{o.customer?.name || '—'}</td>
                <td className="text-brown-light">{formatINR(o.totals?.total ?? 0)}</td>
                <td>
                  <span className="badge status-badge payment-pending">
                    {o.payment?.status || 'pending'}
                  </span>
                </td>
                <td className="text-sm text-brown-light">{reason(o)}</td>
                <td>
                  <button
                    onClick={() => handleReview(o.id)}
                    disabled={verifying[o.id]}
                    className="btn-gold text-xs py-1.5 px-3 disabled:opacity-60"
                  >
                    {verifying[o.id] ? <RotateCw size={12} className="animate-spin" /> : 'Review'}
                  </button>
                  {/* No force-paid action — intentionally omitted */}
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-brown-light">
                  No payment exceptions found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-6 p-4 rounded-xl bg-gold-50 border border-gold-200 text-sm">
        <p className="font-medium text-gold-dark mb-1">
          ⚠️ No "force mark paid" action
        </p>
        <p className="text-brown-light">
          Admin resolve of uncertain Paytm payments requires a backend review
          function (verifyPaytmPayment is owner-only). Use Review to trigger
          server-side verification. Never force-mark an order paid.
        </p>
      </div>
    </>
  )
}
