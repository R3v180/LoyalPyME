// File: backend/src/middleware/auth.middleware.ts
// Version: 1.0.0

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient, User, UserRole } from '@prisma/client'; // Importa PrismaClient y tipos de usuario

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET as string;

// Validar que JWT_SECRET esta definido al iniciar la aplicacion (aunque ya lo validamos en auth.service, es buena practica aqui tambien si este middleware pudiera usarse independientemente)
if (!JWT_SECRET) {
    console.error('FATAL ERROR: JWT_SECRET is not defined in auth.middleware.');
    // Considerar salir del proceso o manejar de forma mas robusta en produccion
}

// Extendemos la interfaz Request de Express para añadir la propiedad 'user'
// Esto permite que TypeScript sepa que 'req.user' existe y que tipo de datos contiene
declare global {
  namespace Express {
    interface Request {
      user?: { // La propiedad user puede ser opcional (si la ruta no necesita autenticacion)
        id: string;
        email: string;
        role: UserRole; // Usamos el tipo UserRole de Prisma
        businessId: string;
        isActive: boolean; // Podriamos necesitar verificar si el usuario esta activo
        // Añadir otros campos del usuario si son frecuentemente necesarios en las rutas protegidas
      };
    }
  }
}

/**
 * Middleware to protect routes, verify JWT, and attach user info to the request.
 * @param req - Express Request object.
 * @param res - Express Response object.
 * @param next - Express NextFunction.
 */
export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  // Obtener el token del header de Autorizacion (formato: "Bearer TOKEN")
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Extraer el token despues de "Bearer "

  // Si no hay token, responder con 401 Unauthorized
  if (token == null) {
    return res.sendStatus(401); // 401 Unauthorized
  }

  // Verificar el token
  jwt.verify(token, JWT_SECRET, async (err: any, payload: any) => {
    // Si el token no es valido (err es diferente de null), responder con 403 Forbidden
    if (err) {
        console.error('JWT verification failed:', err.message);
      return res.sendStatus(403); // 403 Forbidden (token invalido)
    }

    // El token es valido, el payload contiene los datos que pusimos al generarlo (userId, role, businessId)
    // Ahora, opcionalmente (pero recomendado), buscar al usuario en la base de datos
    // para asegurar que el usuario existe y esta activo.
    try {
        const user = await prisma.user.findUnique({
            where: { id: payload.userId },
            select: { // Seleccionamos solo los campos que necesitamos en el middleware y el controlador
                id: true,
                email: true,
                role: true,
                businessId: true,
                isActive: true,
            }
        });

        // Si el usuario no se encuentra o no esta activo, el token es tecnicamente valido pero el usuario no lo es
        if (!user || !user.isActive) {
             console.warn(`Attempted access with inactive or non-existent user ID from token: ${payload.userId}`);
             return res.sendStatus(403); // 403 Forbidden
        }

        // Usuario encontrado y activo, adjuntar los datos del usuario al objeto req
        req.user = user; // Adjuntamos el objeto user completo (o los campos seleccionados) a req.user

        // Pasar al siguiente middleware o manejador de ruta
        next();

    } catch (dbError) {
        // Manejar errores de base de datos durante la busqueda del usuario
        console.error('Database error during token authentication:', dbError);
        res.status(500).json({ message: 'Server error during authentication.' });
    }
  });
};


// Puedes añadir otros middlewares aqui en el futuro (ej: roleMiddleware para verificar roles)


// End of File: backend/src/middleware/auth.middleware.ts