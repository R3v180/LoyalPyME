// frontend/src/routes/index.tsx (MODIFICADO)
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';

// --- SHARED ---
import PrivateRoute from '../shared/components/PrivateRoute';
import MainLayout from '../shared/components/layout/MainLayout';
import PublicLayout from '../shared/components/layout/PublicLayout';
import PublicRouteOnly from '../shared/components/PublicRouteOnly'; // <-- NUEVA IMPORTACIÓN
import { UserRole } from '../shared/types/user.types';

// --- PÁGINAS PÚBLICAS ---
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import ForgotPasswordPage from '../pages/ForgotPasswordPage';
import ResetPasswordPage from '../pages/ResetPasswordPage';
import RegisterBusinessPage from '../pages/RegisterBusinessPage';
import HomePage from '../pages/HomePage';

// --- PÁGINAS DE MÓDULOS ---
// Módulo Camarero
import PublicMenuViewPage from '../modules/camarero/pages/PublicMenuViewPage';
import OrderStatusPage from '../modules/camarero/pages/OrderStatusPage';
import KitchenDisplayPage from '../modules/camarero/pages/admin/camarero/KitchenDisplayPage';
import MenuManagementPage from '../modules/camarero/pages/admin/camarero/MenuManagementPage';
import WaiterOrderManagementPage from '../modules/camarero/pages/admin/camarero/WaiterOrderManagementPage';
import WaiterPickupPage from '../modules/camarero/pages/admin/camarero/WaiterPickupPage';
// Módulo LoyalPyME
import CustomerDashboardPage from '../modules/loyalpyme/pages/CustomerDashboardPage';
import AdminOverview from '../modules/loyalpyme/pages/admin/AdminOverview';
import AdminRewardsManagement from '../modules/loyalpyme/pages/admin/AdminRewardsManagement';
import AdminGenerateQr from '../modules/loyalpyme/pages/admin/AdminGenerateQr';
import TierSettingsPage from '../modules/loyalpyme/pages/admin/tiers/TierSettingsPage';
import TierManagementPage from '../modules/loyalpyme/pages/admin/tiers/TierManagementPage';
import AdminCustomerManagementPage from '../modules/loyalpyme/pages/admin/AdminCustomerManagementPage';
// Módulo SuperAdmin
import SuperAdminPage from '../modules/superadmin/pages/SuperAdminPage';


function AppRoutes() {
  return (
    <Routes>
      {/* Rutas Públicas */}
      <Route element={<PublicLayout />}>
        {/* --- CAMBIO: ENVOLVER RUTAS DE AUTH EN PublicRouteOnly --- */}
        <Route element={<PublicRouteOnly />}>
          {/* Estas rutas solo serán accesibles si el usuario NO está logueado */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/register-business" element={<RegisterBusinessPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        </Route>
        {/* --- FIN DEL CAMBIO --- */}
        
        {/* Estas rutas son siempre públicas, para usuarios logueados o no */}
        <Route path="/" element={<HomePage />} />
        <Route path="/m/:businessSlug/:tableIdentifier?" element={<PublicMenuViewPage />} />
        <Route path="/order-status/:orderId" element={<OrderStatusPage />} />
      </Route>

      {/* Rutas Protegidas (sin cambios) */}
      <Route element={<MainLayout />}>
        <Route
            path="/superadmin"
            element={ <PrivateRoute allowedRoles={[UserRole.SUPER_ADMIN]}><SuperAdminPage /></PrivateRoute> }
        />
        <Route path="/admin" element={<Outlet />}>
            <Route path="dashboard" element={<PrivateRoute allowedRoles={[UserRole.BUSINESS_ADMIN]}><Outlet /></PrivateRoute>}>
                <Route index element={<AdminOverview />} />
                <Route path="rewards" element={<AdminRewardsManagement />} />
                <Route path="generate-qr" element={<AdminGenerateQr />} />
                <Route path="tiers/settings" element={<TierSettingsPage />} />
                <Route path="tiers/manage" element={<TierManagementPage />} />
                <Route path="customers" element={<AdminCustomerManagementPage />} />
                <Route path="camarero/menu-editor" element={<MenuManagementPage />} />
            </Route>
            <Route path="kds" element={<PrivateRoute allowedRoles={[UserRole.KITCHEN_STAFF, UserRole.BAR_STAFF, UserRole.BUSINESS_ADMIN]}><KitchenDisplayPage /></PrivateRoute>} />
            <Route path="camarero/pickup" element={<PrivateRoute allowedRoles={[UserRole.WAITER, UserRole.BUSINESS_ADMIN]}><WaiterPickupPage /></PrivateRoute>} />
            <Route path="camarero/orders" element={<PrivateRoute allowedRoles={[UserRole.WAITER, UserRole.BUSINESS_ADMIN]}><WaiterOrderManagementPage /></PrivateRoute>} />
            <Route index element={<PrivateRoute allowedRoles={[UserRole.BUSINESS_ADMIN, UserRole.KITCHEN_STAFF, UserRole.BAR_STAFF, UserRole.WAITER]}><Navigate to="dashboard" replace /></PrivateRoute>} />
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