// filename: backend/src/routes/businesses.routes.ts
// Version: 1.1.3 (Remove Swagger annotation for debugging)

import { Router } from 'express';
import { handleGetPublicBusinesses } from '../businesses/businesses.controller';

const businessRouter = Router();

// --- TEMPORALMENTE SIN ANOTACIÓN SWAGGER ---
businessRouter.get(
    '/public-list',
    handleGetPublicBusinesses
);

// --- Rutas Protegidas Futuras ---
// Añadir anotaciones aquí si se implementan

export default businessRouter;

// End of file: backend/src/routes/businesses.routes.ts