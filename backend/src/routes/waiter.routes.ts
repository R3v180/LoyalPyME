// backend/src/routes/waiter.routes.ts
// Version: 1.0.0 (Initial routes for waiter interface: get ready items, mark as served)

import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { checkRole } from '../middleware/role.middleware';
import { checkModuleActive } from '../middleware/module.middleware';
import { UserRole } from '@prisma/client'; // Para definir los roles permitidos

// Importar los handlers del controlador de camarero que acabamos de crear
import {
    getReadyForPickupItemsHandler,
    markOrderItemServedHandler
} from '../camarero/waiter.controller'; // Ajusta la ruta si tu estructura es diferente

const waiterRouter = Router();

// === Middlewares aplicados a TODAS las rutas definidas en este router ===
// 1. Autenticación: Asegura que el usuario está logueado y req.user está disponible.
waiterRouter.use(authenticateToken);

// 2. Módulo Activo: Asegura que el módulo 'CAMARERO' está activo para el negocio del usuario.
waiterRouter.use(checkModuleActive('CAMARERO'));

// 3. Roles Permitidos: Define qué roles pueden acceder a estas funcionalidades.
//    Tanto WAITER como BUSINESS_ADMIN (para supervisión o si un admin ayuda) deberían tener acceso.
waiterRouter.use(checkRole([UserRole.WAITER, UserRole.BUSINESS_ADMIN]));


// === Definición de Rutas para la Interfaz de Camarero ===
// El prefijo general (ej. /api/camarero/staff) se aplicará en index.ts al montar este router.

/**
 * @openapi
 * /camarero/staff/ready-for-pickup:
 *   get:
 *     tags:
 *       - Camarero Staff
 *     summary: Obtiene ítems listos para recoger por el camarero.
 *     description: Devuelve una lista de OrderItems que han sido marcados como READY por el KDS y están pendientes de ser servidos. Protegido para roles WAITER y BUSINESS_ADMIN con módulo CAMARERO activo.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Lista de ítems listos para recoger obtenida con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ReadyPickupItemDto' # Asegúrate que este DTO esté definido en tu Swagger global (index.ts)
 *       '401':
 *         description: No autorizado (token no válido o ausente).
 *       '403':
 *         description: Prohibido (rol no permitido o módulo no activo).
 *       '500':
 *         description: Error interno del servidor.
 */
waiterRouter.get('/ready-for-pickup', getReadyForPickupItemsHandler);

/**
 * @openapi
 * /camarero/staff/order-items/{orderItemId}/status:
 *   patch:
 *     tags:
 *       - Camarero Staff
 *     summary: Marca un ítem de pedido como SERVIDO.
 *     description: Permite al camarero actualizar el estado de un OrderItem específico a SERVED. También desencadena la lógica para actualizar el estado general del pedido a COMPLETED si todos los ítems están servidos.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: orderItemId
 *         in: path
 *         required: true
 *         description: ID del OrderItem a marcar como servido.
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MarkOrderItemServedPayloadDto' # Este DTO espera newStatus: "SERVED"
 *     responses:
 *       '200':
 *         description: Ítem de pedido marcado como SERVIDO con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OrderItemStatusUpdateResponseDto'
 *       '400':
 *         description: Payload inválido o ID de ítem faltante.
 *       '401':
 *         description: No autorizado.
 *       '403':
 *         description: Prohibido (rol no permitido o módulo no activo).
 *       '404':
 *         description: Ítem de pedido no encontrado.
 *       '409':
 *         description: Conflicto (ej. el ítem no estaba en estado READY).
 *       '500':
 *         description: Error interno del servidor.
 */
waiterRouter.patch('/order-items/:orderItemId/status', markOrderItemServedHandler);

// Podrías considerar una ruta más específica si el payload de MarkOrderItemServedPayloadDto fuera vacío
// y la acción estuviera implícita en la ruta:
// waiterRouter.patch('/order-items/:orderItemId/mark-served', markOrderItemServedHandler);


export default waiterRouter;