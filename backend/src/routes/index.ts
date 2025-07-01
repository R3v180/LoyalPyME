// backend/src/routes/index.ts
// VERSIÓN CORREGIDA - ELIMINA EL MIDDLEWARE DE ROL GLOBAL PARA /rewards

import { Router } from 'express';
import { UserRole } from '@prisma/client';

// Middlewares
import { authenticateToken } from '../shared/middleware/auth.middleware';
import { checkRole } from '../shared/middleware/role.middleware';

// Routers
import authRouter from './auth.routes';
import protectedRouter from './protected.routes';
import rewardsRouter from './rewards.routes'; // Importa el router que ya corregimos
import pointsRouter from './points.routes';
import customerRouter from './customer.routes';
import tierRouter from './tiers.routes';
import adminRouter from './admin.routes';
import uploadsRouter from './uploads.routes';
import superAdminRouter from './superadmin.routes';
import camareroAdminRouter from './camarero-admin.routes';
import camareroKdsRouter from './camarero-kds.routes';
import waiterRouter from './waiter.routes';
import businessRouter from './businesses.routes';
import publicMenuRouter from './public-menu.routes';
import publicOrderRouter from './public-order.routes';

// Router para las rutas /api
const apiRouter = Router();

// Rutas con su propia lógica de autenticación o semi-públicas
apiRouter.use('/auth', authRouter);
apiRouter.use('/superadmin', superAdminRouter);

// Rutas de Camarero
apiRouter.use('/camarero/admin', camareroAdminRouter);
apiRouter.use('/camarero/kds', camareroKdsRouter);
apiRouter.use('/camarero/staff', waiterRouter);

// Aplicar autenticación general A PARTIR DE AQUÍ
apiRouter.use(authenticateToken);

// --- CORRECCIÓN CLAVE AQUÍ ---
// Montamos /rewards SIN el middleware checkRole. La lógica de roles
// ya está dentro de rewards.routes.ts para cada ruta específica.
apiRouter.use('/rewards', rewardsRouter);
// --- FIN DE LA CORRECCIÓN ---

// Rutas protegidas que sí tienen un rol común
apiRouter.use('/profile', protectedRouter); // No necesita rol, solo autenticación
apiRouter.use('/points', pointsRouter); // La lógica de rol está dentro
apiRouter.use('/customer', checkRole([UserRole.CUSTOMER_FINAL]), customerRouter);
apiRouter.use('/tiers', checkRole([UserRole.BUSINESS_ADMIN]), tierRouter);
apiRouter.use('/admin', checkRole([UserRole.BUSINESS_ADMIN]), adminRouter);
apiRouter.use('/uploads', checkRole([UserRole.BUSINESS_ADMIN, UserRole.SUPER_ADMIN]), uploadsRouter);

// Router para las rutas /public (sin cambios)
const publicRouterApi = Router();
publicRouterApi.use('/businesses', businessRouter);
publicRouterApi.use('/menu', publicMenuRouter);
publicRouterApi.use('/order', publicOrderRouter);

export { apiRouter, publicRouterApi as publicRouter };