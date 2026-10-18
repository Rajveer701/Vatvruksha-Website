import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { ArrowRight, Clock, Truck, Package, CreditCard, AlertCircle } from 'lucide-react'
import { useAdminAuth } from '../context/AuthContext'
import { fetchOrders } from '../functions/queries'
import StatCard from '../components/StatCard'

const ICONS = {
  orders: ArrowRight,
  pending: Clock,
  confirmed: Package,
  shipped: Truck,
  delivered: CreditCard,
  cod: AlertCircle,
}

export default function OverviewPage() {
  const { user } = useAdminAuth()
  const [stats, setStats] = useState({
    newOrders: 0,
    pendingPaytm: 0,
    confirmed: 0,
    shipped: 0,
    delivered: 0,
    codDue: 0,
    exceptions: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!user) return
    const load = async () => {
      setLoading(true)
      try {
        // Fetch all recent orders and derive stats client-side (guide: client-derived cards)
        const all = []
        let lastDoc = null
        let hasMore = true
        while (hasMore && all.length < 500) {
          const res = await fetchOrders({ pageSize: 100, startAfterDoc: lastDoc })
          all.push(...res.items)
          lastDoc = res.lastDoc
          hasMore = res.hasMore && all.length < 500
        }

        const now = Date.now()
        const derived = {
          newOrders: all.filter((o) => o.status === 'pending_payment').length,
          pendingPaytm: all.filter(
            (o) => o.paymentMethod === 'paytm' && o.payment?.status === 'pending'
          ).length,
          confirmed: all.filter((o) => o.status === 'confirmed').length,
          shipped: all.filter((o) => o.status === 'shipped').length,
          delivered: all.filter((o) => o.status === 'delivered').length,
          codDue: all.filter(
            (o) => o.paymentMethod === 'cod' && o.payment?.status === 'pending'
          ).length,
          exceptions: all.filter(
            (o) =>
              o.payment?.needsReview === true ||
              (o.paymentMethod === 'paytm' &&
                o.payment?.status === 'pending' &&
                now - new Date(o.createdAt).getTime() > 24 * 60 * 60 * 1000)
          ).length,
        }
        setStats(derived)
      } catch (err) {
        setError(err?.message || 'Could not load overview data.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user])

  if (loading) return null

  return (
    <>
      <Helmet>
        <title>Overview — Vatvruksha Admin</title>
      </Helmet>

      <div className="mb-8">
        <p className="text-sm uppercase tracking-[0.2em] text-gold font-semibold">Dashboard</p>
        <h1 className="font-serif text-3xl text-brown mt-2">Overview</h1>
        <p className="text-brown-light text-sm mt-1">
          All cards below are <strong>client-derived</strong> (computed from
          downloaded orders) unless an aggregate endpoint is added.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="New Orders"
          value={stats.newOrders}
          subtitle="Orders created today"
          icon={<ICONS.orders className="w-5 h-5" />}
        />
        <StatCard
          title="Pending Paytm"
          value={stats.pendingPaytm}
          subtitle="Awaiting server verification"
          icon={<ICONS.pending className="w-5 h-5" />}
        />
        <StatCard
          title="Confirmed"
          value={stats.confirmed}
          subtitle="Accepted orders"
          icon={<ICONS.confirmed className="w-5 h-5" />}
        />
        <StatCard
          title="Shipped"
          value={stats.shipped}
          subtitle="Dispatched orders"
          icon={<ICONS.shipped className="w-5 h-5" />}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Delivered"
          value={stats.delivered}
          subtitle="Completed orders"
          icon={<ICONS.delivered className="w-5 h-5" />}
        />
        <StatCard
          title="COD Due"
          value={stats.codDue}
          subtitle="Cash to collect"
          icon={<ICONS.cod className="w-5 h-5" />}
        />
        <StatCard
          title="Exceptions"
          value={stats.exceptions}
          subtitle="Needs manual review"
          icon={<AlertCircle className="w-5 h-5" />}
        />
        <StatCard
          title="Low Stock"
          value="—"
          subtitle="Variant-level scan pending"
          icon={<Package className="w-5 h-5" />}
        />
      </div>

      <div className="bg-white rounded-2xl border border-cream-dark p-6 shadow-sm">
        <h3 className="font-serif text-xl text-brown mb-4">Recent Orders</h3>
        <p className="text-xs text-brown-light mb-4">
          Use the Orders page for full pagination and filtering.
        </p>
      </div>
    </>
  )
}
