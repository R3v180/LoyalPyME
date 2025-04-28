// filename: backend/src/routes/businesses.routes.ts
// Version: 1.0.0

import { Router } from 'express';
// Importamos el handler del controlador que creamos
import { handleGetPublicBusinesses } from '../businesses/businesses.controller'; // Ajusta la ruta si moviste el controlador

const businessRouter = Router();

// --- Rutas Públicas para Negocios ---

// GET /public-list --> Devuelve la lista de negocios (ID y Nombre) para el desplegable de registro
// NOTA: Esta ruta se montará en una base como /public/businesses o /api/businesses
// y NO llevará autenticación aplicada globalmente en index.ts para esta ruta específica.
businessRouter.get(
    '/public-list',          // La ruta específica
    handleGetPublicBusinesses // El handler que obtiene y devuelve los datos
);


// --- Rutas Protegidas para Negocios (Ejemplos Futuros) ---
// Aquí podrían ir rutas futuras que SÍ requieran autenticación y/o roles de admin
// Por ejemplo, para que un SuperAdmin gestione negocios o un BusinessAdmin vea detalles
// router.get('/:businessId/details', authenticateToken, checkRole(['BUSINESS_ADMIN']), handleGetBusinessDetails);


// Exportamos el router para usarlo en index.ts
export default businessRouter;

// End of file: backend/src/routes/businesses.routes.ts