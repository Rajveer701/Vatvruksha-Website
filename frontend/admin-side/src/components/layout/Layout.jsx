import { Outlet, useNavigate } from 'react-router-dom'
import { LogOut, Menu, X } from 'lucide-react'
import { useAdminAuth } from '../../context/AuthContext'

export default function Layout() {
  const { user, handleSignOut, isAdmin, loading } = useAdminAuth()
  const navigate = useNavigate()

  if (loading) return null

  const handleSignOutClick = async () => {
    try {
      await handleSignOut()
      navigate('/admin/login')
    } catch {
      // error handled by context
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-cream-dark bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <span className="font-serif text-maroon font-bold text-xl leading-tight">
                🪔 Vatvruksha
              </span>
              <span className="text-[0.65rem] text-gold-dark font-medium uppercase tracking-widest">
                Admin Dashboard
              </span>
            </div>

            <nav className="hidden md:flex items-center gap-6" aria-label="Admin navigation">
              <a
                href="/admin"
                className="text-sm font-medium text-brown hover:text-maroon transition-colors"
              >
                Overview
              </a>
              <a
                href="/admin/orders"
                className="text-sm font-medium text-brown hover:text-maroon transition-colors"
              >
                Orders
              </a>
              <a
                href="/admin/products"
                className="text-sm font-medium text-brown hover:text-maroon transition-colors"
              >
                Products
              </a>
              <a
                href="/admin/categories"
                className="text-sm font-medium text-brown hover:text-maroon transition-colors"
              >
                Categories
              </a>
              <a
                href="/admin/inventory"
                className="text-sm font-medium text-brown hover:text-maroon transition-colors"
              >
                Inventory
              </a>
              <a
                href="/admin/customers"
                className="text-sm font-medium text-brown hover:text-maroon transition-colors"
              >
                Customers
              </a>
              <a
                href="/admin/exceptions"
                className="text-sm font-medium text-brown hover:text-maroon transition-colors"
              >
                Exceptions
              </a>
              <a
                href="/admin/admin-roles"
                className="text-sm font-medium text-brown hover:text-maroon transition-colors"
              >
                Admin Roles
              </a>
            </nav>

            <div className="flex items-center gap-3">
              <span className="hidden sm:block text-xs text-brown-light">
                {user?.email}
              </span>
              <button
                onClick={handleSignOutClick}
                className="p-2 rounded-lg text-brown hover:text-maroon hover:bg-cream-dark transition-colors"
                aria-label="Sign out"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main id="main-content" className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {!isAdmin && !loading && (
          <div className="text-center py-20">
            <h1 className="font-serif text-3xl text-brown mb-3">Access Denied</h1>
            <p className="text-brown-light mb-6">
              You do not have admin access to this dashboard.
            </p>
          </div>
        )}
        <Outlet />
      </main>

      <footer className="border-t border-cream-dark bg-white py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-xs text-brown-light">
          &copy; {new Date().getFullYear()} Vatvruksha Swami Maharaj Spiritual Vastu Bhandar.
          &nbsp;Admin dashboard — internal use only.
        </div>
      </footer>
    </div>
  )
}
