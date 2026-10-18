import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { ArrowRight, Search, Package, AlertTriangle, Clock } from 'lucide-react'
import { useAdminAuth } from '../context/AuthContext'
import { fetchProducts } from '../functions/queries'
import { DEFAULT_LOW_STOCK_THRESHOLD } from '../../../shared/constants.js'
import { formatINR } from '../../../shared/money.js'
import PendingActionButton from '../components/PendingActionButton'

export default function InventoryPage() {
  const { user } = useAdminAuth()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [threshold, setThreshold] = useState(DEFAULT_LOW_STOCK_THRESHOLD)

  // Flatten variants across all products for variant-level inventory view
  const [variantRows, setVariantRows] = useState([])

  useEffect(() => {
    if (!user) return
    loadInventory()
  }, [user, searchQuery, threshold])

  const loadInventory = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetchProducts({ pageSize: 500 })
      setProducts(res.items)

      const rows = []
      for (const p of res.items) {
        const variants = p.variants || {}
        for (const [variantId, v] of Object.entries(variants)) {
          const stock = v.stock ?? 0
          const isLowStock = stock > 0 && stock <= threshold
          const isOOS = stock === 0
          const matchesSearch =
            !searchQuery ||
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            variantId.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (v.sku || '').toLowerCase().includes(searchQuery.toLowerCase())
          if (!matchesSearch) continue
          rows.push({
            productId: p.id,
            productName: p.name,
            variantId,
            label: v.label || variantId,
            sku: v.sku || '—',
            stock,
            isActive: v.isActive !== false,
            productIsActive: p.isActive !== false,
            isLowStock,
            isOOS,
            price: v.price ?? 0,
          })
        }
      }
      // Sort: out of stock first, then low stock, then by product name
      rows.sort((a, b) => {
        if (b.isOOS && !a.isOOS) return 1
        if (a.isOOS && !b.isOOS) return -1
        if (b.isLowStock && !a.isLowStock) return 1
        if (a.isLowStock && !b.isLowStock) return -1
        return a.productName.localeCompare(b.productName)
      })
      setVariantRows(rows)
    } catch (err) {
      setError(err?.message || 'Could not load inventory.')
    } finally {
      setLoading(false)
    }
  }

  const lowStockCount = variantRows.filter((r) => r.isLowStock).length
  const oosCount = variantRows.filter((r) => r.isOOS).length

  const handleAdjustStock = (row) => {
    toast.info('Stock adjustment is disabled — use a transactional function (services/pendingEndpoints.js).')
  }

  if (loading) return null

  return (
    <>
      <Helmet>
        <title>Inventory — Vatvruksha Admin</title>
      </Helmet>

      <div className="mb-6">
        <p className="text-sm uppercase tracking-[0.2em] text-gold font-semibold">Inventory</p>
        <h1 className="font-serif text-3xl text-brown mt-2">Variant-Level Stock</h1>
        <p className="text-brown-light text-sm mt-1">
          Inventory lives at products/{productId}.variants.{variantId}.stock.
          Variants are embedded — global stock queries require scanning product docs.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-cream-dark p-4">
          <p className="text-xs font-semibold text-gold-dark uppercase">Total Variants</p>
          <p className="font-serif text-xl font-bold text-brown">{variantRows.length}</p>
        </div>
        <div className="bg-orange-50 rounded-xl border border-orange-100 p-4">
          <p className="text-xs font-semibold text-orange-700 uppercase">
            Low Stock (stock 1 to {threshold})
          </p>
          <p className="font-serif text-xl font-bold text-orange-700">{lowStockCount}</p>
        </div>
        <div className="bg-red-50 rounded-xl border border-red-100 p-4">
          <p className="text-xs font-semibold text-red-700 uppercase">Out of Stock (stock == 0)</p>
          <p className="font-serif text-xl font-bold text-red-700">{oosCount}</p>
        </div>
        <div className="bg-maroon-50 rounded-xl border border-maroon-100 p-4">
          <p className="text-xs font-semibold text-maroon uppercase">Threshold</p>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value) || 5)}
              className="w-20 rounded border border-cream-dark px-2 py-1.5 bg-cream text-brown focus:outline-none focus:border-maroon"
            />
            <p className="text-xs text-brown-light">default 5 (pending confirmation)</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search product, variant, SKU…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-72 sm:w-96 rounded-xl border border-cream-dark px-3 py-2 bg-cream text-brown focus:outline-none focus:border-maroon"
          />
        </div>
        <div className="text-xs text-brown-light">
          {variantRows.length} variant rows scanned from {products.length} products
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th className="w-48">Product</th>
              <th className="w-24">Variant</th>
              <th className="w-24">SKU</th>
              <th className="w-16">Stock</th>
              <th className="w-20">Status</th>
              <th className="w-24">Price (₹)</th>
              <th className="w-20">Adjustment</th>
            </tr>
          </thead>
          <tbody>
            {variantRows.map((row) => {
              let statusVariant = 'bg-cream text-brown border-cream-dark'
              let statusText = 'Active'
              if (!row.productIsActive || !row.isActive) {
                statusVariant = 'status-cancelled'
                statusText = 'Inactive'
              } else if (row.isOOS) {
                statusVariant = 'status-expired'
                statusText = 'Out of Stock'
              } else if (row.isLowStock) {
                statusVariant = 'status-pending_payment'
                statusText = 'Low Stock'
              }
              return (
                <tr key={`${row.productId}-${row.variantId}`} className="border-b border-cream-dark hover:bg-maroon-50/30 transition-colors">
                  <td className="font-medium text-brown line-clamp-1">
                    {row.productName}
                  </td>
                  <td className="font-mono text-xs text-brown">{row.variantId}</td>
                  <td className="text-xs text-brown-light">{row.sku}</td>
                  <td className={`font-semibold ${row.isOOS ? 'text-red-700' : row.isLowStock ? 'text-orange-700' : 'text-brown'}`}>
                    {row.stock}
                  </td>
                  <td>
                    <span className={`badge status-badge ${statusVariant}`}>{statusText}</span>
                  </td>
                  <td className="text-brown-light">{formatINR(row.price)}</td>
                  <td>
                    {row.isActive !== false && row.productIsActive !== false ? (
                      <button
                        onClick={() => handleAdjustStock(row)}
                        className="btn-pending text-xs"
                        title="Stock adjustment requires transactional backend function"
                      >
                        Adjust
                      </button>
                    ) : (
                      <span className="text-xs text-brown-light opacity-50">—</span>
                    )}
                  </td>
                </tr>
              )
            })}
            {variantRows.length === 0 && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-brown-light">
                  No variant rows found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-6 p-4 rounded-xl bg-maroon-50 border border-maroon-100 text-sm">
        <p className="font-medium text-maroon mb-1">
          ⏳ Stock mutation disabled pending transactional backend function
        </p>
        <p className="text-brown-light">
          Never write an old whole product document back to change stock — it can
          overwrite concurrent sales. Use a transactional stock function when
          implemented (see services/pendingEndpoints.js#adjustStock).
        </p>
      </div>
    </>
  )
}
