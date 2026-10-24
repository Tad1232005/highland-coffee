import { Navigate, Route, Routes } from 'react-router-dom'
import { Loading, SiteLayout } from '../components'
import { useAuth } from '../context/useAuth'
import { Cart } from '../pages/Cart'
import { Checkout } from '../pages/Checkout'
import { Home } from '../pages/Home'
import { Login } from '../pages/Login'
import { Menu } from '../pages/Menu'
import { MyOrders } from '../pages/MyOrders'
import { NotFound } from '../pages/NotFound'
import { ProductDetail } from '../pages/ProductDetail'
import { Register } from '../pages/Register'
import { AdminCategories } from '../pages/admin/AdminCategories'
import { AdminAnalytics } from '../pages/admin/AdminAnalytics'
import { AdminDashboard } from '../pages/admin/AdminDashboard'
import { AdminLayout } from '../pages/admin/AdminLayout'
import { AdminLogin } from '../pages/admin/AdminLogin'
import { AdminOrders } from '../pages/admin/AdminOrders'
import { AdminProducts } from '../pages/admin/AdminProducts'

function RequireAuth({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <Loading label="Đang kiểm tra phiên đăng nhập" />
  if (!user) return <Navigate to="/login" replace />
  return children
}

function RequireAdmin({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <Loading label="Đang kiểm tra phiên đăng nhập" />
  if (!user) return <Navigate to="/admin/login" replace />
  if (user.role !== 'admin') return <Navigate to="/my-orders" replace />
  return children
}

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/menu" element={<Menu />} />
        <Route path="/products/:id" element={<ProductDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route
          path="/checkout"
          element={
            <RequireAuth>
              <Checkout />
            </RequireAuth>
          }
        />
        <Route
          path="/my-orders"
          element={
            <RequireAuth>
              <MyOrders />
            </RequireAuth>
          }
        />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<NotFound />} />
      </Route>

      <Route path="/admin/login" element={<AdminLogin />} />
      <Route
        path="/admin"
        element={
          <RequireAdmin>
            <AdminLayout />
          </RequireAdmin>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="analytics" element={<AdminAnalytics />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="categories" element={<AdminCategories />} />
      </Route>
    </Routes>
  )
}
