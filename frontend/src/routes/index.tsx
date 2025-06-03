// frontend/src/routes/index.tsx
// Version: 1.1.2 (Add WaiterOrderManagementPage route)

console.log("[Routes Index] Archivo src/routes/index.tsx cargado. v1.1.2"); // Actualizar versión en log

import { Routes, Route, Navigate, Outlet } from 'react-router-dom';

// Layouts y Protección
import PrivateRoute from '../components/PrivateRoute';
import MainLayout from '../components/layout/MainLayout';
import PublicLayout from '../components/layout/PublicLayout';

// Importar UserRole
import { UserRole } from '../types/customer';

// Páginas Públicas
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import ForgotPasswordPage from '../pages/ForgotPasswordPage';
import ResetPasswordPage from '../pages/ResetPasswordPage';
import RegisterBusinessPage from '../pages/RegisterBusinessPage';
import PublicMenuViewPage from '../pages/PublicMenuViewPage';
import OrderStatusPage from '../pages/OrderStatusPage';

// Página de Cliente
import CustomerDashboardPage from '../pages/CustomerDashboardPage';

// Páginas Específicas de Admin (Business Admin LCo)
import AdminOverview from '../pages/admin/AdminOverview';
import AdminRewardsManagement from '../pages/admin/AdminRewardsManagement';
import AdminGenerateQr from '../pages/admin/AdminGenerateQr';
import TierSettingsPage from '../pages/admin/tiers/TierSettingsPage';
import TierManagementPage from '../pages/admin/tiers/TierManagementPage';
import AdminCustomerManagementPage from '../pages/admin/AdminCustomerManagementPage';

// Página Super Admin
import SuperAdminPage from '../pages/admin/SuperAdminPage';

// Páginas Módulo Camarero
import MenuManagementPage from '../pages/admin/camarero/MenuManagementPage';
import KitchenDisplayPage from '../pages/admin/camarero/KitchenDisplayPage';
import WaiterPickupPage from '../pages/admin/camarero/WaiterPickupPage';
// ---- NUEVA IMPORTACIÓN ----
import WaiterOrderManagementPage from '../pages/admin/camarero/WaiterOrderManagementPage'; // Ajusta la ruta si es diferente
// ---- FIN NUEVA IMPORTACIÓN ----

function AppRoutes() {
  console.log("[Routes Index] Función AppRoutes() ejecutándose. v1.1.2"); // Actualizar versión en log

  return (
    <Routes>
      {/* Rutas Públicas (usan PublicLayout) */}
      <Route element={<PublicLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/register-business" element={<RegisterBusinessPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        <Route path="/m/:businessSlug/:tableIdentifier?" element={<PublicMenuViewPage />} />
        <Route path="/order-status/:orderId" element={<OrderStatusPage />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Route>

      {/* Rutas Protegidas (usan MainLayout y PrivateRoute) */}
      <Route element={<MainLayout />}>

        <Route
            path="/superadmin"
            element={ <PrivateRoute allowedRoles={[UserRole.SUPER_ADMIN]}><SuperAdminPage /></PrivateRoute> }
        />

        <Route path="/admin" element={<Outlet />}>

            <Route
                path="dashboard"
                element={<PrivateRoute allowedRoles={[UserRole.BUSINESS_ADMIN]}><Outlet /></PrivateRoute>}
            >
                <Route index element={<AdminOverview />} />
                <Route path="rewards" element={<AdminRewardsManagement />} />
                <Route path="generate-qr" element={<AdminGenerateQr />} />
                <Route path="tiers/settings" element={<TierSettingsPage />} />
                <Route path="tiers/manage" element={<TierManagementPage />} />
                <Route path="customers" element={<AdminCustomerManagementPage />} />
                <Route path="camarero/menu-editor" element={<MenuManagementPage />} />
            </Route>

            <Route
                path="kds"
                element={
                    <PrivateRoute allowedRoles={[UserRole.KITCHEN_STAFF, UserRole.BAR_STAFF, UserRole.BUSINESS_ADMIN]}>
                        <KitchenDisplayPage />
                    </PrivateRoute>
                }
            />

            <Route
                path="camarero/pickup"
                element={
                    <PrivateRoute allowedRoles={[UserRole.WAITER, UserRole.BUSINESS_ADMIN]}>
                        <WaiterPickupPage />
                    </PrivateRoute>
                }
            />

            {/* ---- NUEVA RUTA PARA GESTIÓN DE PEDIDOS DEL CAMARERO ---- */}
            <Route
                path="camarero/orders" // La ruta final será /admin/camarero/orders
                element={
                    <PrivateRoute allowedRoles={[UserRole.WAITER, UserRole.BUSINESS_ADMIN]}>
                        <WaiterOrderManagementPage />
                    </PrivateRoute>
                }
            />
            {/* ---- FIN NUEVA RUTA ---- */}

            <Route index element={
                <PrivateRoute allowedRoles={[UserRole.BUSINESS_ADMIN, UserRole.KITCHEN_STAFF, UserRole.BAR_STAFF, UserRole.WAITER]}>
                    <Navigate to="dashboard" replace />
                </PrivateRoute>
            } />
        </Route>

        <Route
            path="/customer/dashboard"
            element={ <PrivateRoute allowedRoles={[UserRole.CUSTOMER_FINAL]}><CustomerDashboardPage /></PrivateRoute> }
        />

      </Route>

    </Routes>
  );
}

export default AppRoutes;