import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { ArrowRight, Search, Plus, Trash2, Edit2, EyeOff, Eye, Save, X } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useAdminAuth } from '../context/AuthContext'
import { fetchCategories } from '../functions/queries'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase.js'
import PendingActionButton from '../components/PendingActionButton'

const initialCategory = {
  name: '',
  slug: '',
  description: '',
  imagePath: '', // Storage path
  isActive: true,
  sortOrder: 0,
}

export default function CategoriesPage() {
  const { user } = useAdminAuth()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [category, setCategory] = useState(initialCategory)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user) return
    loadCategories()
  }, [user])

  const loadCategories = async () => {
    setLoading(true)
    try {
      const res = await fetchCategories({ pageSize: 100 })
      setCategories(res.items)
    } catch (err) {
      setError(err?.message || 'Could not load categories.')
    } finally {
      setLoading(false)
    }
  }

  const filtered = categories.filter(
    (c) =>
      !searchQuery ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.slug.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const openCreate = () => {
    setEditing(false)
    setCategory({ ...initialCategory })
    setFormOpen(true)
  }

  const openEdit = (c) => {
    setEditing(true)
    setCategory({ ...c })
    setFormOpen(true)
  }

  const toggleActive = async (id, current) => {
    if (!confirm(`Set category active to ${!current}?`)) return
    try {
      await setDoc(doc(db, 'categories', id), { isActive: !current, updatedAt: serverTimestamp() }, { merge: true })
      toast.success(`Category ${!current ? 'activated' : 'deactivated'}.`)
      loadCategories()
    } catch (err) {
      toast.error(err?.message || 'Could not update category.')
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setCategory((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        ...category,
        updatedAt: serverTimestamp(),
        ...(!category.id ? { createdAt: serverTimestamp() } : {}),
      }
      await setDoc(doc(db, 'categories', category.id || `cat-${Date.now()}`), payload, { merge: true })
      toast.success(`Category ${editing ? 'updated' : 'created'} successfully.`)
      setFormOpen(false)
      loadCategories()
    } catch (err) {
      toast.error(err?.message || 'Could not save category.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return null

  return (
    <>
      <Helmet>
        <title>Categories — Vatvruksha Admin</title>
      </Helmet>

      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-gold font-semibold">Catalogue</p>
          <h1 className="font-serif text-3xl text-brown mt-2">Categories</h1>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search categories…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-64 sm:w-80 rounded-xl border border-cream-dark px-3 py-2 bg-cream text-brown focus:outline-none focus:border-maroon"
          />
          <button
            onClick={openCreate}
            disabled={saving}
            className="btn-primary inline-flex items-center gap-2 disabled:opacity-60"
          >
            <Plus size={16} /> Add Category
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
                <th>Category</th>
                <th className="w-32">Slug</th>
                <th className="w-40">Image Path</th>
                <th className="w-20">Sort Order</th>
                <th className="w-16">Active</th>
                <th className="w-20">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-b border-cream-dark hover:bg-maroon-50/30 transition-colors">
                  <td className="font-medium text-brown">{c.name}</td>
                  <td className="text-xs font-mono text-brown-light">{c.slug}</td>
                  <td className="text-brown-light truncate max-w-32">{c.imagePath || '—'}</td>
                  <td className="text-brown-light">{c.sortOrder ?? 0}</td>
                  <td>
                    <span className={`badge status-badge ${c.isActive ? 'status-confirmed' : 'status-cancelled'}`}>
                      {c.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-1">
                      <button
                        onClick={() => openEdit(c)}
                        className="p-1.5 text-brown hover:text-maroon hover:bg-cream rounded-lg"
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => toggleActive(c.id, c.isActive)}
                        className="p-1.5 text-brown hover:text-maroon hover:bg-cream rounded-lg"
                        title={c.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {c.isActive ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-brown-light">
                    No categories found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="px-4 py-2 text-xs text-brown-light">
          Hard-delete is disabled — categories are deactivated via isActive=false.
        </p>
      </div>

      {/* Add/Edit Category Form */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-cream-dark w-full max-w-md max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-2xl text-brown">
                {editing ? 'Edit Category' : 'Add Category'}
              </h2>
              <button
                onClick={() => setFormOpen(false)}
                className="p-2 text-brown hover:text-maroon hover:bg-cream rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-brown mb-1">Category Name</label>
                <input
                  name="name"
                  value={category.name}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-cream-dark px-3 py-2 bg-cream text-brown focus:outline-none focus:border-maroon"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brown mb-1">Slug</label>
                <input
                  name="slug"
                  value={category.slug}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-cream-dark px-3 py-2 bg-cream text-brown focus:outline-none focus:border-maroon"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brown mb-1">Description</label>
                <input
                  name="description"
                  value={category.description}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-cream-dark px-3 py-2 bg-cream text-brown focus:outline-none focus:border-maroon"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brown mb-1">Image Path (Storage)</label>
                <input
                  name="imagePath"
                  value={category.imagePath}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-cream-dark px-3 py-2 bg-cream text-brown focus:outline-none focus:border-maroon"
                  placeholder="categories/{id}/image.jpg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brown mb-1">Sort Order</label>
                <input
                  name="sortOrder"
                  type="number"
                  value={category.sortOrder || 0}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-cream-dark px-3 py-2 bg-cream text-brown focus:outline-none focus:border-maroon"
                />
              </div>
              <div className="flex items-end gap-2">
                <label className="text-sm font-medium text-brown mb-2">Active</label>
                <input
                  type="checkbox"
                  checked={category.isActive}
                  onChange={(e) =>
                    setCategory((prev) => ({ ...prev, isActive: e.target.checked }))
                  }
                  className="accent-maroon rounded"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="btn-primary w-full py-3 disabled:opacity-60"
              >
                {saving ? 'Saving…' : editing ? 'Update Category' : 'Create Category'}
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
          Categories are written to Firestore via setDoc (merge). Hard-delete is
          disabled — deactivate via isActive=false.
        </p>
      </div>
    </>
  )
}
