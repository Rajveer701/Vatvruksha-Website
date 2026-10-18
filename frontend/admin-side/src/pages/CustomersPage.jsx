import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { ArrowRight, Search, User, ShieldCheck } from 'lucide-react'
import { useAdminAuth } from '../context/AuthContext'
import { fetchUsers } from '../functions/queries'

export default function CustomersPage() {
  const { user } = useAdminAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [lastDoc, setLastDoc] = useState(null)
  const [hasMore, setHasMore] = useState(true)

  useEffect(() => {
    if (!user) return
    loadUsers(true)
  }, [user, searchQuery])

  const loadUsers = async (reset = true) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetchUsers({ pageSize: 20, startAfterDoc: reset ? null : lastDoc })
      if (reset) {
        setUsers(res.items)
        setLastDoc(res.lastDoc)
        setHasMore(res.hasMore)
      } else {
        setUsers((prev) => [...prev, ...res.items])
        setLastDoc(res.lastDoc)
        setHasMore(res.hasMore)
      }
    } catch (err) {
      setError(err?.message || 'Could not load customers.')
    } finally {
      setLoading(false)
    }
  }

  const loadMore = () => {
    if (hasMore && !loading) loadUsers(false)
  }

  const filtered = users.filter(
    (u) =>
      !searchQuery ||
      (u.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.name || u.displayName || '').toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) return null

  return (
    <>
      <Helmet>
        <title>Customers — Vatvruksha Admin</title>
      </Helmet>

      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-gold font-semibold">Customers</p>
          <h1 className="font-serif text-3xl text-brown mt-2">Customer List</h1>
          <p className="text-xs text-brown-light">
            Read-only list from users/{uid}. No customer search function currently defined.
          </p>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search email or name…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-72 sm:w-96 rounded-xl border border-cream-dark px-3 py-2 bg-cream text-brown focus:outline-none focus:border-maroon"
          />
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>User ID</th>
              <th className="w-48">Email</th>
              <th className="w-48">Name</th>
              <th className="w-24">Email Verified</th>
              <th className="w-24">Created</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id} className="border-b border-cream-dark hover:bg-maroon-50/30 transition-colors">
                <td className="font-mono text-xs text-brown">{u.id}</td>
                <td className="text-brown-light">{u.email || '—'}</td>
                <td className="text-brown-light">{u.displayName || u.name || '—'}</td>
                <td>
                  <span className={`badge status-badge ${u.emailVerified ? 'status-confirmed' : 'status-pending_payment'}`}>
                    {u.emailVerified ? 'Verified' : 'Unverified'}
                  </span>
                </td>
                <td className="text-brown-light">
                  {u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-IN') : '—'}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-brown-light">
                  No customers found
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
            <ArrowRight size={16} /> Load More Customers
          </button>
        </div>
      )}
    </>
  )
}
