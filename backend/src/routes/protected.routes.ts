// File: backend/src/routes/protected.routes.ts
// Version: 1.0.0

import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth.middleware'; // Importa el middleware de autenticacion

const router = Router(); // Crea una nueva instancia de Express Router

// Aplica el middleware authenticateToken a todas las rutas definidas en este router
// Opcionalmente, podrias aplicarlo solo a rutas especificas: router.get('/profile', authenticateToken, ...)
router.use(authenticateToken);

// Ruta de prueba protegida - Obtener perfil del usuario autenticado
// Esta ruta solo sera alcanzada si authenticateToken permite el paso (token valido, usuario activo)
// req.user contendra los datos del usuario gracias al middleware
router.get('/profile', (req: Request, res: Response) => {
  // El middleware attachTokenUserById añade la informacion del usuario en req.user
  // Si req.user no existe aqui, es que el middleware fallo, pero authenticateToken ya manejaria eso
  if (!req.user) {
    // Esto no deberia pasar si el middleware funciona correctamente
    return res.status(401).json({ message: 'User not authenticated via middleware.' });
  }
  // Responde con la informacion del usuario adjunta por el middleware
  res.json(req.user);
});


// Puedes añadir mas rutas protegidas aqui (ej: /rewards, /business-settings)


// Exporta el router para ser usado en el archivo principal de la aplicacion (index.ts)
export default router;

// End of File: backend/src/routes/protected.routes.ts