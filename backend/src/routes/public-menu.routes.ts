// backend/src/routes/public-menu.routes.ts (CORREGIDO)
import { Router } from 'express';
// --- RUTA CORREGIDA ---
import { getPublicDigitalMenuHandler } from '../modules/camarero/public/menu.controller';
// --- FIN RUTA CORREGIDA ---

const publicMenuRouter = Router();

publicMenuRouter.get(
    '/business/:businessSlug',
    getPublicDigitalMenuHandler
);

export default publicMenuRouter;