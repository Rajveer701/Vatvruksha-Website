import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { ShieldAlert, ArrowRight } from 'lucide-react'

export default function UnauthorizedPage() {
  return (
    <>
      <Helmet>
        <title>Access Denied — Vatvruksha Admin</title>
      </Helmet>

      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <ShieldAlert className="mx-auto text-red-600 mb-6" size={64} />
        <h1 className="font-serif text-3xl text-brown mb-3">Access Denied</h1>
        <p className="text-brown-light mb-6 max-w-sm mx-auto">
          Your account does not have admin access, or your email is not verified.
          Please contact an administrator to request the admin role, then verify
          your email and sign in again.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/admin/login"
            className="btn-primary inline-flex items-center justify-center gap-2"
          >
            <ArrowRight size={16} /> Sign In Again
          </Link>
        </div>
      </div>
    </>
  )
}
