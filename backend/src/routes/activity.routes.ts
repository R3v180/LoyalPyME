// filename: backend/src/routes/activity.routes.ts
import { Router } from 'express';
import { getCustomerActivityHandler } from '../activity/activity.controller';
// NOTA: Los middlewares authenticateToken y checkRole se aplicarán en index.ts

const activityRouter = Router();

// GET / - Obtiene el historial paginado del cliente
activityRouter.get('/', getCustomerActivityHandler);

export default activityRouter;