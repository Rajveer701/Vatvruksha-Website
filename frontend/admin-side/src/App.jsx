import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { Toaster } from 'react-hot-toast'
import { AdminAuthProvider, useAdminAuth } from './context/AuthContext'
import Layout from './components/layout/Layout'
import LoginPage from './pages/LoginPage'
import UnauthorizedPage from './pages/UnauthorizedPage'
import OverviewPage from './pages/OverviewPage'
import OrdersPage from './pages/OrdersPage'
import OrderDetailPage from './pages/OrderDetailPage'
import ProductsPage from './pages/ProductsPage'
import CategoriesPage from './pages/CategoriesPage'
import InventoryPage from './pages/InventoryPage'
import CustomersPage from './pages/CustomersPage'
import ExceptionsPage from './pages/ExceptionsPage'
import AdminRolesPage from './pages/AdminRolesPage'

// Redirects unauthenticated users to login, preserving the intended route.
function RequireAuth({ children }) {
  const { user, loading } = useAdminAuth()
  const location = useLocation()
  if (loading) return null
  if (!user) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />
  }
  return children
}

// Requires admin claims (admin === true && email_verified === true).
function RequireAdmin({ children }) {
  const { isAdmin, loading } = useAdminAuth()
  if (loading) return null
  if (!isAdmin) return <Navigate to="/admin/unauthorized" replace />
  return children
}

export default function App() {
  return (
    <AdminAuthProvider>
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
            <Route path="/admin/login" element={<LoginPage />} />
            <Route path="/admin/unauthorized" element={<UnauthorizedPage />} />
            <Route element={<Layout />}>
              <Route element={<RequireAuth><RequireAdmin /></RequireAuth>}>
                <Route path="/admin" element={<OverviewPage />} />
                <Route path="/admin/orders" element={<OrdersPage />} />
                <Route path="/admin/orders/:orderId" element={<OrderDetailPage />} />
                <Route path="/admin/products" element={<ProductsPage />} />
                <Route path="/admin/categories" element={<CategoriesPage />} />
                <Route path="/admin/inventory" element={<InventoryPage />} />
                <Route path="/admin/customers" element={<CustomersPage />} />
                <Route path="/admin/exceptions" element={<ExceptionsPage />} />
                <Route path="/admin/admin-roles" element={<AdminRolesPage />} />
              </Route>
            </Route>
            <Route path="/" element={<Navigate to="/admin" replace />} />
          </Routes>
        </BrowserRouter>
      </HelmetProvider>
    </AdminAuthProvider>
  )
}
