LoyalPyME - Estado del Proyecto y Hoja de Ruta
Fecha de Última Actualización: 27 de Abril de 2025

1. Resumen del Proyecto
   LoyalPyME es una plataforma web integral (Frontend + Backend) para gestionar programas de fidelización digital para Pequeñas y Medianas Empresas (PyMEs). Su objetivo es ser una solución robusta, mantenible y escalable que permita a los negocios retener clientes y a los clientes disfrutar de beneficios por su lealtad.

Propósito: Proporcionar a las PyMEs una herramienta web completa para crear, gestionar y operar un programa de fidelización digital (puntos, niveles, recompensas), y ofrecer a los clientes finales una experiencia digital simple para participar en estos programas.

Visión de Evolución (Fases Futuras): LoyalPyME está diseñado para expandirse más allá del núcleo de fidelización, incluyendo herramientas de comunicación (email, publicaciones, chat), análisis avanzado (CRM ligero), una aplicación móvil nativa, y potencialmente la creación de ecosistemas de fidelización compartidos y funcionalidades sociales (mapa de actividad anónima, eventos) para sectores específicos como el ocio. (Nota: Esta visión puede refinarse).

Funcionalidad Principal (Fase 1 - Núcleo Operativo Actual):

Negocios (Admins): Definir niveles (tiers), recompensas; gestionar clientes (ver lista, ajustar puntos, cambiar nivel, marcar favorito, activar/desactivar, ver/editar notas, acciones masivas); generar códigos QR para transacciones de puntos.
Clientes Finales: Registrarse; acumular puntos (validando QR); ver su estado (puntos, nivel, beneficios); ver recompensas disponibles (normales y regaladas); canjear recompensas/regalos. 2. Tecnologías
Frontend: React, TypeScript, Vite, Mantine UI (v7+), Axios, React Router DOM v6, qrcode.react, react-qr-reader, Zod, @mantine/form, @mantine/notifications, @mantine/modals. Corre en localhost:5173.
Backend: Node.js, Express, TypeScript, Prisma, PostgreSQL, JWT para autenticación, bcryptjs, dotenv, node-cron, uuid, cors, ts-node, ts-node-dev (instalado, aunque yarn dev no funciona actualmente). Corre en localhost:3000. 3. Autenticación y Acceso
Basada en JWT. Token y datos de usuario almacenados en localStorage.
axiosInstance (frontend) con baseURL: 'http://localhost:3000/api' añade Authorization: Bearer <token> automáticamente.
Middleware authenticateToken (backend) valida token y adjunta req.user.
Roles (UserRole enum) y middleware checkRole protegen rutas específicas.
Rutas Públicas (/auth/\*) usan axios base con URL completa.
Se usan credenciales de prueba. 4. Estado Actual (Fase 1 - Funcionalidades Clave y Refactorización Completadas)
Se ha completado una fase intensiva de refactorización y desarrollo del núcleo funcional.

Refactorización Backend: Completada. Servicios y controladores divididos por responsabilidad (auth, customer (separando lógica admin), tiers (config, crud, benefits, logic), rewards, points). Validaciones en utils.
Refactorización Frontend: Completada para los componentes principales identificados.
MainLayout.tsx: Extraídos hook useLayoutUserData, componentes AppHeader, AdminNavbar.
AdminCustomerManagementPage.tsx: Extraídos hook useAdminCustomers, componente CustomerTable.
CustomerDashboardPage.tsx: Extraídos hooks useUserProfileData, useCustomerRewardsData, componentes UserInfoDisplay, RewardList, QrValidationSection.
Depuración Post-Refactorización: Completada. Resueltos múltiples errores 404 y bugs menores encontrados tras la refactorización y primeras implementaciones.
Flujo de Trabajo Backend (Temporal): Se utiliza yarn build && node dist/index.js debido a problemas persistentes con yarn dev (usando ts-node o ts-node-dev).
Funcionalidades Verificadas:
Registro (Admin/Cliente) y Login (JWT).
Recuperación de Contraseña.
Sistema de Tiers (Backend Completo: CRUDs, Config, Lógica Cron).
Gestión de Recompensas (Admin CRUD FE+BE).
Generación QR (Admin FE+BE).
Validación QR (Cliente FE+BE: asigna puntos, actualiza métricas, trigger tiers).
Panel Cliente (Info básica, puntos, nivel, lista/canje recompensas y regalos).
Panel Admin (Layout, Sidebar, Logout).
Gestión Clientes Admin:
Lista paginada y ordenable de clientes.
Búsqueda básica por nombre/email.
Acciones Individuales: Ajustar Puntos, Cambiar Nivel, Asignar Recompensa (Regalo), Marcar/Desmarcar Favorito, Activar/Desactivar Cliente (FE+BE).
Modal Ver Detalles: Muestra datos completos (incluyendo Notas Admin).
Notas Admin: Funcionalidad completa de Ver, Editar y Guardar notas (FE+BE).
Acciones Masivas: Selección de filas, Activar/Desactivar, Eliminar (con confirmación), Ajustar Puntos (con modal input) (FE+BE). 5. Hoja de Ruta y Tareas Pendientes
Hemos completado la refactorización y la implementación de las funcionalidades centrales y acciones de administración básicas.

Fase 1 - Tareas Restantes (Pulido y Mejoras):

Implementar Filtros Completos en AdminCustomerManagementPage: Añadir UI (checkbox/select para Estado Activo, Favorito; ¿quizás Nivel?) y conectar con el hook useAdminCustomers y el backend para filtrar la lista. (Pendiente FE + posible ajuste BE)
Optimizar/Mejorar Búsqueda y Paginación en AdminCustomerManagementPage: Evaluar si la implementación actual de búsqueda (backend) y paginación (frontend/backend) es suficiente o necesita mejoras de rendimiento (índices DB?) o de experiencia de usuario (UI paginación). (Pendiente Análisis/Implementación)
Limpieza General: Eliminar código comentado obsoleto, TODOs resueltos, console.log de depuración innecesarios. Centralizar tipos/interfaces (CustomerDetails, Reward, etc.) en archivos src/types/. Revisión general de código y consistencia. (Pendiente)
Fase 2+: Hoja de Ruta Futura (Expansión y Potencial) - Objetivo: 3-6 semanas adicionales después de Fase 1
(Según visión inicial)

Expansión de reglas de fidelización y tipos de recompensa (ej: descuentos %).
Herramientas de comunicación y marketing web (email básico, publicaciones en portal).
Segmentación avanzada y acciones masivas complejas.
Comenzar análisis básico de clientes.
Fase 3+ (Largo Plazo):
(Según visión inicial)

Desarrollo de la aplicación móvil nativa.
Análisis avanzado y funcionalidades de CRM ligero.
Implementación de funcionalidades de ecosistema y potencial social (chat, mapa actividad, etc.). 6. Estructura del Código (Actualizada)
Backend (backend/src/):
index.ts, prisma/, middleware/, utils/, routes/ (auth, customer, admin, points, rewards, tiers, protected), módulos (auth/, customer/, admin/, points/, rewards/, tiers/).
Frontend (frontend/src/):
main.tsx, App.tsx, routes/index.tsx, services/axiosInstance.ts, theme.ts, hooks/ (useAdminCustomers, useCustomerRewardsData, useUserProfileData), pages/ (Públicas, Cliente, Admin (AdminCustomerManagementPage, AdminGenerateQr, AdminOverview, AdminRewardsManagement), Admin/Tiers (TierManagementPage, TierSettingsPage)), components/ (layout/ (MainLayout, AppHeader, AdminNavbar), PrivateRoute, admin/ (CustomerTable, AdjustPointsModal, ChangeTierModal, AssignRewardModal, CustomerDetailsModal, BulkAdjustPointsModal, tiers/), customer/ (UserInfoDisplay, RewardList, QrValidationSection)). 7. Flujo de Trabajo Acordado
Proporcionar este archivo actualizado y TROUBLESHOOTING_GUIDE.md (si aplica) al inicio de la sesión.
Continuar con la implementación de las tareas restantes de la Fase 1 (lista en Sección 5).
IMPORTANTE: Para modificar archivos existentes, primero pasar el código completo actual del archivo.
El asistente devolverá siempre el código 100% completo y limpio del archivo modificado, con cabecera // filename: y // Version: actualizada. Un archivo por mensaje.
Flujo Backend: Usar yarn build + node dist/index.js para probar cambios. 8. Información Adicional
Backend usa .env (DATABASE_URL, JWT_SECRET).
Frontend usa @mantine/modals, requiere ModalsProvider.
Licencia: AGPL v3.0. 9. Próximo Paso
Elegir la siguiente tarea de la lista de "Fase 1 - Tareas Restantes" (Filtros, Búsqueda/Paginación, Limpieza) para comenzar la implementación.
