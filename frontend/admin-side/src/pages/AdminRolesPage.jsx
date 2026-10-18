import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useAdminAuth } from '../context/AuthContext'
import { setAdminRole as callSetAdminRole } from '../services/pendingEndpoints'

export default function AdminRolesPage() {
  const { user, claims, refreshClaims } = useAdminAuth()
  const [email, setEmail] = useState('')
  const [makeAdmin, setMakeAdmin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const callerEmail = user?.email
  const isCallerAdmin = claims?.admin === true

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      // Caller cannot remove their own admin role
      if (email === callerEmail && !makeAdmin) {
        setError('You cannot remove your own admin role.')
        return
      }
      await callSetAdminRole({ email, makeAdmin })
      toast.success(`Admin role ${makeAdmin ? 'granted' : 'revoked'} for ${email}.`)
      setEmail('')
      // Granting requires target to refresh token; suggest it
      if (makeAdmin) {
        toast.info('Target account must refresh their ID token for the claim to take effect.')
      }
    } catch (err) {
      setError(err?.message || 'Failed to update admin role.')
    } finally {
      setLoading(false)
    }
  }

  const handleRefreshMyClaims = async () => {
    await refreshClaims()
    toast.success('ID token claims refreshed.')
  }

  return (
    <>
      <Helmet>
        <title>Admin Roles — Vatvruksha Admin</title>
      </Helmet>

      <div className="mb-6">
        <p className="text-sm uppercase tracking-[0.2em] text-gold font-semibold">Admin Management</p>
        <h1 className="font-serif text-3xl text-brown mt-2">Admin Roles</h1>
        <p className="text-brown-light text-sm mt-1">
          Uses setAdminRole with target email and makeAdmin flag. Target must
          exist, have signed in once, and be email-verified to be granted.
          Caller cannot remove their own admin role.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-cream-dark p-6 shadow-sm">
        <h3 className="font-serif text-xl text-brown mb-4">Grant / Revoke Admin Role</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-brown mb-1">Target Email</label>
            <input
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-cream-dark px-3 py-2 bg-cream text-brown focus:outline-none focus:border-maroon"
              placeholder="admin@example.com"
              required
            />
          </div>
          <div className="flex items-center gap-3">
            <input
              id="makeAdmin"
              type="checkbox"
              checked={makeAdmin}
              onChange={(e) => setMakeAdmin(e.target.checked)}
              className="accent-maroon rounded"
            />
            <label htmlFor="makeAdmin" className="text-sm text-brown">
              {makeAdmin ? 'Grant admin' : 'Revoke admin'}
            </label>
          </div>
          <p className="text-xs text-brown-light">
            Target account must sign in again (refresh ID token) for the claim
            change to take effect.
          </p>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 disabled:opacity-60"
          >
            {loading ? 'Updating…' : 'Update Admin Role'}
          </button>
        </form>
      </div>

      <div className="mt-6 bg-white rounded-2xl border border-cream-dark p-6 shadow-sm">
        <h3 className="font-serif text-xl text-brown mb-4">Current Session</h3>
        <div className="space-y-2 text-sm text-brown-light">
          <p className="flex justify-between">
            <span>Your email</span>
            <span className="font-mono">{callerEmail || '—'}</span>
          </p>
          <p className="flex justify-between">
            <span>Admin claim</span>
            <span
              className={`badge status-badge ${isCallerAdmin ? 'status-confirmed' : 'status-pending_payment'}`}
            >
              {isCallerAdmin ? 'true' : 'false / not set'}
            </span>
          </p>
          <p className="flex justify-between">
            <span>Email verified</span>
            <span
              className={`badge status-badge ${claims?.email_verified ? 'status-confirmed' : 'status-pending_payment'}`}
            >
              {claims?.email_verified ? 'true' : 'false / not set'}
            </span>
          </p>
        </div>
        <button
          onClick={handleRefreshMyClaims}
          className="btn-gold mt-4 inline-flex items-center gap-2"
        >
          <ShieldCheck size={16} /> Refresh My ID Token Claims
        </button>
        <p className="mt-2 text-xs text-brown-light">
          Role-claim change requires a token refresh (getIdTokenResult(true)).
        </p>
      </div>

      <div className="mt-6 p-4 rounded-xl bg-maroon-50 border border-maroon-100 text-sm">
        <AlertCircle className="w-5 h-5 inline mr-2" />
        <p className="font-medium text-maroon mb-1 inline">Route guard is UX only.</p>
        <p className="text-brown-light">
          The frontend route guard is UX only; rules/functions enforce
          authorization. Never let a client-side control grant admin.
        </p>
      </div>
    </>
  )
}
