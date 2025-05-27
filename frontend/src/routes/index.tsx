// frontend/src/routes/index.tsx
// Version: 1.1.0 (Corrected KDS routing structure)

console.log("[Routes Index] Archivo src/routes/index.tsx cargado."); 

import { Routes, Route, Navigate, Outlet } from 'react-router-dom';

// Layouts y Protección
import PrivateRoute from '../components/PrivateRoute'; 
import MainLayout from '../components/layout/MainLayout';
import PublicLayout from '../components/layout/PublicLayout';

// Importar UserRole desde la ubicación correcta (probablemente types/customer)
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

// Páginas Módulo Camarero (Admin y KDS)
import MenuManagementPage from '../pages/admin/camarero/MenuManagementPage';
import KitchenDisplayPage from '../pages/admin/camarero/KitchenDisplayPage'; 


function AppRoutes() {
  console.log("[Routes Index] Función AppRoutes() ejecutándose."); 

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

        {/* --- ESTRUCTURA DE RUTAS /admin REVISADA --- */}
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
            </Route>

            {/* Ruta KDS bajo /admin/kds (roles KDS) */}
            <Route 
                path="kds" // Relativa a /admin -> /admin/kds
                element={
                    <PrivateRoute allowedRoles={[UserRole.KITCHEN_STAFF, UserRole.BAR_STAFF, UserRole.BUSINESS_ADMIN]}>
                        <KitchenDisplayPage />
                    </PrivateRoute>
                } 
            />
            
            <Route index element={
                <PrivateRoute allowedRoles={[UserRole.BUSINESS_ADMIN, UserRole.KITCHEN_STAFF, UserRole.BAR_STAFF]}>
                    {/* Lógica de redirección inteligente podría ir aquí si es necesario, o simplemente redirigir a la primera opción */}
                    {/* Por ahora, si se accede a /admin sin subruta y el usuario es KITCHEN_STAFF o BAR_STAFF pero no BUSINESS_ADMIN,
                        podríamos redirigir a /admin/kds. Si es BUSINESS_ADMIN, a /admin/dashboard.
                        De momento, una redirección genérica a dashboard si tiene alguno de esos roles.
                        Si no es BUSINESS_ADMIN pero sí KDS_STAFF, PrivateRoute ya lo gestionará para "dashboard".
                        Podemos dejar que el PrivateRoute de "dashboard" falle para KDS_STAFF y que el de "kds" permita.
                        La navegación directa a /admin/kds desde el login es el flujo principal para KDS_STAFF.
                    */}
                    <Navigate to="dashboard" replace /> 
                </PrivateRoute>
            } />
        </Route>
        {/* --- FIN ESTRUCTURA /admin REVISADA --- */}

        <Route
            path="/customer/dashboard"
            element={ <PrivateRoute allowedRoles={[UserRole.CUSTOMER_FINAL]}><CustomerDashboardPage /></PrivateRoute> }
        />
        
      </Route>
      
    </Routes>
  );
}

export default AppRoutes;