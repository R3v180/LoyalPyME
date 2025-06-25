// backend/src/routes/businesses.routes.ts (CORREGIDO)

import { Router } from 'express';
// --- RUTA CORREGIDA ---
import { handleGetPublicBusinesses } from '../shared/businesses/businesses.controller';
// --- FIN RUTA CORREGIDA ---

const businessRouter = Router();

businessRouter.get(
    '/public-list',
    handleGetPublicBusinesses
);

export default businessRouter;