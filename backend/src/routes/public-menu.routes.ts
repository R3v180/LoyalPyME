// backend/src/routes/public-menu.routes.ts
import { Router } from 'express';
import { getPublicDigitalMenuHandler } from '../public/menu.controller'; // Ajustaremos la ruta si el controlador está en otra carpeta

const publicMenuRouter = Router();

publicMenuRouter.get(
    '/business/:businessSlug',
    getPublicDigitalMenuHandler
);

export default publicMenuRouter; // <--- ESTA LÍNEA ES CRUCIAL