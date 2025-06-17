// backend/src/routes/index.ts
// Version: 1.0.0 (Centralized router mounting)

import { Router } from 'express';
import { UserRole } from '@prisma/client';

// Middlewares
import { authenticateToken } from '../middleware/auth.middleware';
import { checkRole } from '../middleware/role.middleware';

// Routers
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

// --- Router para las rutas /api ---
const apiRouter = Router();

// Rutas con su propia lógica de autenticación o semi-públicas
apiRouter.use('/auth', authRouter);
apiRouter.use('/superadmin', superAdminRouter);

// Rutas de Camarero (tienen su propia cadena de middlewares internos)
apiRouter.use('/camarero/admin', camareroAdminRouter);
apiRouter.use('/camarero/kds', camareroKdsRouter);
apiRouter.use('/camarero/staff', waiterRouter);

// Aplicar autenticación general para el resto de rutas /api
apiRouter.use(authenticateToken);

// Rutas protegidas que dependen de la autenticación general
apiRouter.use('/profile', protectedRouter);
apiRouter.use('/rewards', checkRole([UserRole.BUSINESS_ADMIN]), rewardsRouter);
apiRouter.use('/points', pointsRouter); // checkRole se aplica internamente en las rutas específicas
apiRouter.use('/customer', checkRole([UserRole.CUSTOMER_FINAL]), customerRouter);
apiRouter.use('/tiers', checkRole([UserRole.BUSINESS_ADMIN]), tierRouter);
apiRouter.use('/admin', checkRole([UserRole.BUSINESS_ADMIN]), adminRouter);
apiRouter.use('/uploads', checkRole([UserRole.BUSINESS_ADMIN, UserRole.SUPER_ADMIN]), uploadsRouter);


// --- Router para las rutas /public ---
const publicRouter = Router();
publicRouter.use('/businesses', businessRouter);
publicRouter.use('/menu', publicMenuRouter);
publicRouter.use('/order', publicOrderRouter);


// Exportar ambos routers para ser usados en el index.ts principal
export { apiRouter, publicRouter };