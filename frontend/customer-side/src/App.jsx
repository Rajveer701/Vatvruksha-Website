import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { Toaster } from 'react-hot-toast'
import { Send } from 'lucide-react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { CatalogueProvider } from './context/CatalogueContext'
import Layout from './components/layout/Layout'
import HomePage from './pages/HomePage'
import ShopPage from './pages/ShopPage'
import CategoryPage from './pages/CategoryPage'
import ProductPage from './pages/ProductPage'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import WishlistPage from './pages/WishlistPage'
import AboutPage from './pages/AboutPage'
import ContactPage from './pages/ContactPage'
import AccountPage from './pages/AccountPage'
import OrderHistoryPage from './pages/OrderHistoryPage'
import OrderDetailPage from './pages/OrderDetailPage'
import AddressBookPage from './pages/AddressBookPage'
import LoginPage from './pages/LoginPage'
import NotFoundPage from './pages/NotFoundPage'

// Requires sign-in; sends unauthenticated users to login, preserving intended route.
function RequireAuth({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  return user ? children : <Navigate to="/login" replace />
}

// Requires email verification for checkout; shows verification prompt otherwise.
function RequireVerified({ children }) {
  const { user, isEmailVerified, sendVerificationEmail, refreshIdToken } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (!isEmailVerified) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="bg-white rounded-2xl border border-cream-dark p-8 md:p-10 shadow-sm text-center">
          <div className="text-4xl mb-4">📧</div>
          <h2 className="font-serif text-2xl font-bold text-brown mb-3">Verify your email</h2>
          <p className="text-brown-light text-sm mb-6">
            Please verify your email address before you can place an order.
          </p>
          <button
            onClick={() => {
              sendVerificationEmail().then(() => refreshIdToken())
            }}
            className="btn-primary mb-4 inline-flex items-center justify-center gap-2"
          >
            <Send size={16} /> Resend verification email
          </button>
          <p className="text-xs text-brown-light">
            Check your inbox, then click the link and return here.
          </p>
        </div>
      </div>
    )
  }
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <HelmetProvider>
        <BrowserRouter>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#2B1A14',
                color: '#FFF8EC',
                fontFamily: 'Poppins, sans-serif',
                fontSize: '0.875rem',
                borderRadius: '0.5rem',
                boxShadow: '0 8px 32px rgba(43,26,20,0.25)',
              },
              success: {
                iconTheme: { primary: '#C9962B', secondary: '#FFF8EC' },
              },
            }}
          />
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<CatalogueProvider><Layout /></CatalogueProvider>}>
              <Route path="/" element={<HomePage />} />
              <Route path="/shop" element={<ShopPage />} />
              <Route path="/category/:slug" element={<CategoryPage />} />
              <Route path="/product/:id" element={<ProductPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route
                path="/checkout"
                element={
                  <RequireAuth>
                    <RequireVerified>
                      <CheckoutPage />
                    </RequireVerified>
                  </RequireAuth>
                }
              />
              <Route path="/wishlist" element={<WishlistPage />} />
              <Route path="/orders" element={<OrderHistoryPage />} />
              <Route path="/orders/:orderId" element={<OrderDetailPage />} />
              <Route path="/account/addresses" element={<AddressBookPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/account" element={<AccountPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </HelmetProvider>
    </AuthProvider>
  )
}
