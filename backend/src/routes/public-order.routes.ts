// backend/src/routes/public-order.routes.ts
// Version: 1.0.0 (Initial router for public order creation)

import { Router } from 'express';
// Importaremos el handler del controlador cuando lo creemos
import { createPublicOrderHandler } from '../public/order.controller'; // Ajustar ruta si es necesario

const publicOrderRouter = Router();

// Ruta para que un cliente cree un nuevo pedido para un negocio específico
// POST /public/order/:businessSlug
publicOrderRouter.post(
    '/:businessSlug', // El businessSlug viene de la URL
    createPublicOrderHandler
);

export default publicOrderRouter;