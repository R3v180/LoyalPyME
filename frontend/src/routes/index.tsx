// frontend/src/routes/index.tsx
// Version: 1.1.1 (Add WaiterPickupPage route)

console.log("[Routes Index] Archivo src/routes/index.tsx cargado. v1.1.1");

import { Routes, Route, Navigate, Outlet } from 'react-router-dom';

// Layouts y Protección
import PrivateRoute from '../components/PrivateRoute';
import MainLayout from '../components/layout/MainLayout';
import PublicLayout from '../components/layout/PublicLayout';

// Importar UserRole
import { UserRole } from '../types/customer'; // Asegúrate que esta ruta es correcta

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

// Páginas Módulo Camarero (Admin, KDS y Nueva Página de Camarero)
import MenuManagementPage from '../pages/admin/camarero/MenuManagementPage';
import KitchenDisplayPage from '../pages/admin/camarero/KitchenDisplayPage';
import WaiterPickupPage from '../pages/admin/camarero/WaiterPickupPage'; // <--- NUEVA IMPORTACIÓN

function AppRoutes() {
  console.log("[Routes Index] Función AppRoutes() ejecutándose. v1.1.1");

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

        {/* --- ESTRUCTURA DE RUTAS /admin --- */}
        <Route path="/admin" element={<Outlet />}> {/* Ruta padre /admin */}

            {/* Rutas bajo /admin/dashboard (solo BUSINESS_ADMIN) */}
            <Route
                path="dashboard" // Relativa a /admin -> /admin/dashboard
                element={<PrivateRoute allowedRoles={[UserRole.BUSINESS_ADMIN]}><Outlet /></PrivateRoute>}
            >
                <Route index element={<AdminOverview />} />
                <Route path="rewards" element={<AdminRewardsManagement />} />
                <Route path="generate-qr" element={<AdminGenerateQr />} />
                <Route path="tiers/settings" element={<TierSettingsPage />} />
                <Route path="tiers/manage" element={<TierManagementPage />} />
                <Route path="customers" element={<AdminCustomerManagementPage />} />
                <Route path="camarero/menu-editor" element={<MenuManagementPage />} />
                 {/*
                   La ruta para camarero/pickup-station la pondremos fuera de /dashboard
                   para que pueda tener sus propios permisos (WAITER y BUSINESS_ADMIN)
                   sin estar anidada bajo una ruta que solo permite BUSINESS_ADMIN.
                 */}
            </Route>

            {/* Ruta KDS bajo /admin/kds (roles KDS y BUSINESS_ADMIN) */}
            <Route
                path="kds" // Relativa a /admin -> /admin/kds
                element={
                    <PrivateRoute allowedRoles={[UserRole.KITCHEN_STAFF, UserRole.BAR_STAFF, UserRole.BUSINESS_ADMIN]}>
                        <KitchenDisplayPage />
                    </PrivateRoute>
                }
            />

            {/* --- NUEVA RUTA PARA INTERFAZ DE CAMARERO --- */}
            {/* La montaremos bajo /admin/waiter/ para agrupar funcionalidades de staff */}
            <Route
                path="camarero/pickup" // Resulta en /admin/camarero/pickup
                element={
                    <PrivateRoute allowedRoles={[UserRole.WAITER, UserRole.BUSINESS_ADMIN]}>
                        <WaiterPickupPage />
                    </PrivateRoute>
                }
            />
            {/* --- FIN NUEVA RUTA --- */}

            {/* Redirección para /admin (si no es BUSINESS_ADMIN, KDS o WAITER, PrivateRoute se encarga) */}
            <Route index element={
                <PrivateRoute allowedRoles={[UserRole.BUSINESS_ADMIN, UserRole.KITCHEN_STAFF, UserRole.BAR_STAFF, UserRole.WAITER]}>
                    {/*
                        Redirección inteligente:
                        - Si es BUSINESS_ADMIN -> /admin/dashboard
                        - Si es KITCHEN_STAFF o BAR_STAFF (y no BUSINESS_ADMIN) -> /admin/kds
                        - Si es WAITER (y no BUSINESS_ADMIN) -> /admin/waiter/pickup
                        Por ahora, una simple a /admin/dashboard es suficiente si es BUSINESS_ADMIN,
                        y los otros roles deberían ser redirigidos a sus páginas específicas al hacer login.
                        Si un usuario KDS o WAITER llega a /admin, la redirección a 'dashboard' fallará el PrivateRoute
                        de 'dashboard' y lo dejará en una página en blanco o error de ruta.
                        La navegación directa desde el login a su página correcta es la mejor aproximación.
                    */}
                    <Navigate to="dashboard" replace />
                </PrivateRoute>
            } />
        </Route>
        {/* --- FIN ESTRUCTURA /admin --- */}

        <Route
            path="/customer/dashboard"
            element={ <PrivateRoute allowedRoles={[UserRole.CUSTOMER_FINAL]}><CustomerDashboardPage /></PrivateRoute> }
        />

      </Route>

    </Routes>
  );
}

export default AppRoutes;