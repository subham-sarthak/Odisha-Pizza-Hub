import { Navigate, Route, Routes } from "react-router-dom";
import AdminRoute from "./components/AdminRoute.jsx";
import Layout from "./components/Layout.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import AdminReportsPage from "./pages/AdminReportsPage.jsx";
import CartPage from "./pages/CartPage.jsx";
import CategoryItemsPage from "./pages/CategoryItemsPage.jsx";
import CustomerDashboard from "./pages/CustomerDashboard.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import KitchenDisplay from "./pages/KitchenDisplay.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import MenuPage from "./pages/MenuPage.jsx";
import OffersPage from "./pages/OffersPage.jsx";
import OrderHistoryDashboard from "./pages/OrderHistoryDashboard.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";
import SectionMenuPage from "./pages/SectionMenuPage.jsx";
import VerifyEmail from "./pages/VerifyEmail.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/auth" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/admin-login" element={<LoginPage mode="admin" />} />
      <Route
        path="/admin-dashboard"
        element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/orders"
        element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        }
      />
      <Route
        path="/kitchen-display"
        element={
          <AdminRoute>
            <KitchenDisplay />
          </AdminRoute>
        }
      />
      <Route
        path="/kitchen"
        element={
          <AdminRoute>
            <KitchenDisplay />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/analytics"
        element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/order-reports"
        element={
          <AdminRoute>
            <AdminReportsPage />
          </AdminRoute>
        }
      />

      <Route element={<Layout />}>
        <Route path="/menu" element={<MenuPage />} />
        <Route path="/offers" element={<OffersPage />} />
        <Route
          path="/order-history"
          element={
            <ProtectedRoute role="customer">
              <OrderHistoryDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders"
          element={
            <ProtectedRoute role="customer">
              <OrderHistoryDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="/sections" element={<SectionMenuPage />} />
        <Route path="/category/:categoryName" element={<CategoryItemsPage />} />
        <Route
          path="/cart"
          element={
            <ProtectedRoute role="customer">
              <CartPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute role="customer">
              <CustomerDashboard />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/menu" replace />} />
    </Routes>
  );
}
