import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { ArrowRight, Search, Plus, Trash2, Edit2, EyeOff, Eye, Save, X } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useAdminAuth } from '../context/AuthContext'
import { fetchProducts } from '../functions/queries'
import { formatINR } from '../../../shared/money.js'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase.js'
import PendingActionButton from '../components/PendingActionButton'

// Validate variantId: lowercase letters, digits, underscore only
const VARIANT_ID_REGEX = /^[a-z0-9_]+$/

const initialProduct = {
  name: '',
  slug: '',
  description: '',
  categoryId: '',
  images: [], // Storage paths
  variants: {
    default: {
      label: 'Default',
      sku: '',
      price: 0, // paise
      mrp: 0, // paise
      stock: 0,
      isActive: true,
      sortOrder: 0,
    },
  },
  isActive: true,
  sortOrder: 0,
}

export default function ProductsPage() {
  const { user } = useAdminAuth()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [product, setProduct] = useState(initialProduct)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user) return
    loadProducts()
  }, [user])

  const loadProducts = async () => {
    setLoading(true)
    try {
      const res = await fetchProducts({ pageSize: 100 })
      setProducts(res.items)
    } catch (err) {
      setError(err?.message || 'Could not load products.')
    } finally {
      setLoading(false)
    }
  }

  const filtered = products.filter(
    (p) =>
      !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.slug.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const openCreate = () => {
    setEditing(false)
    setProduct({ ...initialProduct })
    setFormOpen(true)
  }

  const openEdit = (p) => {
    setEditing(true)
    // deep copy
    setProduct({
      ...p,
      variants: { ...p.variants },
      images: [...(p.images || [])],
    })
    setFormOpen(true)
  }

  const toggleActive = async (id, current) => {
    if (!confirm(`Set product active to ${!current}?`)) return
    try {
      await setDoc(doc(db, 'products', id), { isActive: !current, updatedAt: serverTimestamp() }, { merge: true })
      toast.success(`Product ${!current ? 'activated' : 'deactivated'}.`)
      loadProducts()
    } catch (err) {
      toast.error(err?.message || 'Could not update product.')
    }
  }

  const addVariant = () => {
    setProduct((prev) => ({
      ...prev,
      variants: { ...prev.variants },
    }))
  }

  const setVariantField = (variantId, field, value) => {
    setProduct((prev) => ({
      ...prev,
      variants: {
        ...prev.variants,
        [variantId]: { ...prev.variants[variantId], [field]: value },
      },
    }))
  }

  const removeVariant = (variantId) => {
    if (variantId === 'default') return
    setProduct((prev) => {
      const { [variantId]: _, ...rest } = prev.variants
      return { ...prev, variants: rest }
    })
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setProduct((prev) => ({ ...prev, [name]: value }))
  }

  const handleImagePathChange = (index, value) => {
    setProduct((prev) => {
      const images = [...prev.images]
      images[index] = value
      return { ...prev, images }
    })
  }

  const addImagePath = () => {
    setProduct((prev) => ({ ...prev, images: [...prev.images, ''] }))
  }

  const removeImagePath = (index) => {
    setProduct((prev) => {
      const images = [...prev.images]
      images.splice(index, 1)
      return { ...prev, images }
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    // Validate variant IDs
    for (const vid of Object.keys(product.variants)) {
      if (!VARIANT_ID_REGEX.test(vid)) {
        toast.error(`Invalid variant ID "${vid}": use lowercase letters, digits, underscore only`)
        return
      }
    }
    setSaving(true)
    try {
      const payload = {
        ...product,
        updatedAt: serverTimestamp(),
        ...(!product.id ? { createdAt: serverTimestamp() } : {}),
      }
      await setDoc(doc(db, 'products', product.id || `prod-${Date.now()}`), payload, { merge: true })
      toast.success(`Product ${editing ? 'updated' : 'created'} successfully.`)
      setFormOpen(false)
      loadProducts()
    } catch (err) {
      toast.error(err?.message || 'Could not save product.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return null

  return (
    <>
      <Helmet>
        <title>Products — Vatvruksha Admin</title>
      </Helmet>

      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-gold font-semibold">Catalogue</p>
          <h1 className="font-serif text-3xl text-brown mt-2">Products</h1>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search products…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-64 sm:w-80 rounded-xl border border-cream-dark px-3 py-2 bg-cream text-brown focus:outline-none focus:border-maroon"
          />
          <button
            onClick={openCreate}
            disabled={saving}
            className="btn-primary inline-flex items-center gap-2 disabled:opacity-60"
          >
            <Plus size={16} /> Add Product
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-cream-dark overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Product</th>
                <th className="w-32">Slug</th>
                <th className="w-20">Category</th>
                <th className="w-24">Price (₹)</th>
                <th className="w-20">Stock</th>
                <th className="w-16">Active</th>
                <th className="w-20">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-b border-cream-dark hover:bg-maroon-50/30 transition-colors">
                  <td className="font-medium text-brown line-clamp-1">
                    {p.name}
                  </td>
                  <td className="text-xs font-mono text-brown-light">{p.slug}</td>
                  <td className="text-brown-light">{p.categoryId || '—'}</td>
                  <td className="text-brown-light">
                    {formatINR(p.variants?.default?.price ?? 0)}
                  </td>
                  <td className="text-brown-light">
                    {p.variants?.default?.stock ?? 0}
                  </td>
                  <td>
                    <span className={`badge status-badge ${p.isActive ? 'status-confirmed' : 'status-cancelled'}`}>
                      {p.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-1">
                      <button
                        onClick={() => openEdit(p)}
                        className="p-1.5 text-brown hover:text-maroon hover:bg-cream rounded-lg"
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => toggleActive(p.id, p.isActive)}
                        className="p-1.5 text-brown hover:text-maroon hover:bg-cream rounded-lg"
                        title={p.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {p.isActive ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-brown-light">
                    No products found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="px-4 py-2 text-xs text-brown-light">
          Hard-delete is disabled — products are deactivated via isActive=false.
        </p>
      </div>

      {/* Add/Edit Product Form */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-cream-dark w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-2xl text-brown">
                {editing ? 'Edit Product' : 'Add Product'}
              </h2>
              <button
                onClick={() => setFormOpen(false)}
                className="p-2 text-brown hover:text-maroon hover:bg-cream rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-brown mb-1">Product Name</label>
                  <input
                    name="name"
                    value={product.name}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-cream-dark px-3 py-2 bg-cream text-brown focus:outline-none focus:border-maroon"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-brown mb-1">Slug</label>
                  <input
                    name="slug"
                    value={product.slug}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-cream-dark px-3 py-2 bg-cream text-brown focus:outline-none focus:border-maroon"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-brown mb-1">Category ID</label>
                  <input
                    name="categoryId"
                    value={product.categoryId}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-cream-dark px-3 py-2 bg-cream text-brown focus:outline-none focus:border-maroon"
                    placeholder="e.g. ganesha"
                  />
                </div>
                <div className="flex items-end gap-2">
                  <label className="text-sm font-medium text-brown mb-2">Active</label>
                  <input
                    type="checkbox"
                    checked={product.isActive}
                    onChange={(e) =>
                      setProduct((prev) => ({ ...prev, isActive: e.target.checked }))
                    }
                    className="accent-maroon rounded"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-brown mb-1">Description</label>
                <textarea
                  name="description"
                  value={product.description}
                  onChange={handleChange}
                  rows="3"
                  className="w-full rounded-xl border border-cream-dark px-3 py-2 bg-cream text-brown focus:outline-none focus:border-maroon"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-brown mb-1">Image Paths (Storage)</label>
                <p className="text-xs text-brown-light mb-2">One path per line, e.g. products/{id}/image1.jpg</p>
                {product.images.map((path, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <input
                      value={path}
                      onChange={(e) => handleImagePathChange(i, e.target.value)}
                      className="flex-1 rounded-xl border border-cream-dark px-3 py-2 bg-cream text-brown text-sm focus:outline-none focus:border-maroon"
                    />
                    <button
                      type="button"
                      onClick={() => removeImagePath(i)}
                      className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addImagePath}
                  className="text-xs text-maroon hover:underline flex items-center gap-1"
                >
                  <Plus size={12} /> Add image path
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-brown mb-1">Sort Order</label>
                <input
                  name="sortOrder"
                  type="number"
                  value={product.sortOrder || 0}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-cream-dark px-3 py-2 bg-cream text-brown focus:outline-none focus:border-maroon"
                />
              </div>

              {/* Variants editor */}
              <div className="border border-cream-dark rounded-xl p-4 bg-cream/40">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-brown">Variants</h3>
                  <button
                    type="button"
                    onClick={() => {
                      const vid = `variant_${Date.now()}`
                      setProduct((prev) => ({
                        ...prev,
                        variants: {
                          ...prev.variants,
                          [vid]: {
                            label: 'Variant',
                            sku: '',
                            price: 0,
                            mrp: 0,
                            stock: 0,
                            isActive: true,
                            sortOrder: 0,
                          },
                        },
                      }))
                    }}
                    className="text-xs text-maroon hover:underline flex items-center gap-1"
                  >
                    <Plus size={12} /> Add Variant
                  </button>
                </div>
                <div className="space-y-3">
                  {Object.entries(product.variants).map(([variantId, variant]) => (
                    <div key={variantId} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center border-b border-cream-dark pb-2">
                      <div className="md:col-span-2">
                        <label className="text-xs font-medium text-brown block mb-1">Variant ID</label>
                        <input
                          value={variantId}
                          onChange={(e) => {
                            const newId = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_')
                            setProduct((prev) => {
                              const variants = { ...prev.variants }
                              delete variants[variantId]
                              variants[newId] = variant
                              return { ...prev, variants }
                            })
                          }}
                          className="w-full rounded border border-cream-dark px-2 py-1.5 bg-cream text-brown text-xs font-mono focus:outline-none focus:border-maroon"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-xs font-medium text-brown block mb-1">Label</label>
                        <input
                          value={variant.label || ''}
                          onChange={(e) => setVariantField(variantId, 'label', e.target.value)}
                          className="w-full rounded border border-cream-dark px-2 py-1.5 bg-cream text-brown text-xs focus:outline-none focus:border-maroon"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-xs font-medium text-brown block mb-1">SKU</label>
                        <input
                          value={variant.sku || ''}
                          onChange={(e) => setVariantField(variantId, 'sku', e.target.value)}
                          className="w-full rounded border border-cream-dark px-2 py-1.5 bg-cream text-brown text-xs focus:outline-none focus:border-maroon"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-xs font-medium text-brown block mb-1">Price (paise)</label>
                        <input
                          type="number"
                          value={variant.price || ''}
                          onChange={(e) => setVariantField(variantId, 'price', Number(e.target.value) || 0)}
                          className="w-full rounded border border-cream-dark px-2 py-1.5 bg-cream text-brown text-xs focus:outline-none focus:border-maroon"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-xs font-medium text-brown block mb-1">MRP (paise)</label>
                        <input
                          type="number"
                          value={variant.mrp || ''}
                          onChange={(e) => setVariantField(variantId, 'mrp', Number(e.target.value) || 0)}
                          className="w-full rounded border border-cream-dark px-2 py-1.5 bg-cream text-brown text-xs focus:outline-none focus:border-maroon"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-xs font-medium text-brown block mb-1">Stock</label>
                        <input
                          type="number"
                          value={variant.stock || ''}
                          onChange={(e) => setVariantField(variantId, 'stock', Number(e.target.value) || 0)}
                          className="w-full rounded border border-cream-dark px-2 py-1.5 bg-cream text-brown text-xs focus:outline-none focus:border-maroon"
                        />
                      </div>
                      <div className="md:col-span-2 flex items-end">
                        <label className="text-xs font-medium text-brown mb-2 block">Active</label>
                        <input
                          type="checkbox"
                          checked={variant.isActive !== false}
                          onChange={(e) => setVariantField(variantId, 'isActive', e.target.checked)}
                          className="accent-maroon rounded"
                        />
                      </div>
                      {variantId !== 'default' && (
                        <div className="md:col-span-2 flex items-end">
                          <button
                            type="button"
                            onClick={() => removeVariant(variantId)}
                            className="w-full py-1.5 text-red-600 hover:text-red-700 text-xs rounded hover:bg-red-50 border border-red-100"
                          >
                            <Trash2 size={14} /> Remove
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="btn-primary w-full py-3 disabled:opacity-60"
              >
                {saving ? 'Saving…' : editing ? 'Update Product' : 'Create Product'}
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="mt-6 p-4 rounded-xl bg-gold-50 border border-gold-200 text-sm">
        <p className="font-medium text-gold-dark mb-1">
          ℹ️ Catalogue writes enabled
        </p>
        <p className="text-brown-light">
          Products are written to Firestore via setDoc (merge). Hard-delete is
          disabled — deactivate via isActive=false. Stock adjustment must use a
          transactional function (see services/pendingEndpoints.js#adjustStock).
        </p>
      </div>
    </>
  )
}
