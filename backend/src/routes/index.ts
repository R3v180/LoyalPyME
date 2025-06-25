// backend/src/routes/index.ts (CORREGIDO)
import { Router } from 'express';
import { UserRole } from '@prisma/client';

// --- RUTAS CORREGIDAS ---
import { authenticateToken } from '../shared/middleware/auth.middleware';
import { checkRole } from '../shared/middleware/role.middleware';
// --- FIN RUTAS CORREGIDAS ---


// Routers (las rutas relativas aquí son correctas, no necesitan cambio)
import authRouter from './auth.routes';
import protectedRouter from './protected.routes';
import rewardsRouter from './rewards.routes';
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

// Aplicar autenticación general
apiRouter.use(authenticateToken);

// Rutas protegidas
apiRouter.use('/profile', protectedRouter);
apiRouter.use('/rewards', checkRole([UserRole.BUSINESS_ADMIN]), rewardsRouter);
apiRouter.use('/points', pointsRouter);
apiRouter.use('/customer', checkRole([UserRole.CUSTOMER_FINAL]), customerRouter);
apiRouter.use('/tiers', checkRole([UserRole.BUSINESS_ADMIN]), tierRouter);
apiRouter.use('/admin', checkRole([UserRole.BUSINESS_ADMIN]), adminRouter);
apiRouter.use('/uploads', checkRole([UserRole.BUSINESS_ADMIN, UserRole.SUPER_ADMIN]), uploadsRouter);

// Router para las rutas /public
const publicRouterApi = Router(); // Renombrado para evitar conflicto de nombres
publicRouterApi.use('/businesses', businessRouter);
publicRouterApi.use('/menu', publicMenuRouter);
publicRouterApi.use('/order', publicOrderRouter);

export { apiRouter, publicRouterApi as publicRouter };