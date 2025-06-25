// backend/src/routes/activity.routes.ts (CORREGIDO)
import { Router } from 'express';
// --- RUTA CORREGIDA ---
import { getCustomerActivityHandler } from '../modules/loyalpyme/activity/activity.controller';
// --- FIN RUTA CORREGIDA ---

const activityRouter = Router();

// GET / - Obtiene el historial paginado del cliente
activityRouter.get('/', getCustomerActivityHandler);

export default activityRouter;