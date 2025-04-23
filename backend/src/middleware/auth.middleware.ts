// filename: backend/src/middleware/auth.middleware.ts
// --- INICIO DEL CÓDIGO COMPLETO ---
// File: backend/src/middleware/auth.middleware.ts
// Version: 1.1.0 (Include currentTier in req.user)

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
// *** CAMBIO: Importar Tier para usarlo en el tipo req.user ***
import { PrismaClient, UserRole, Tier, Prisma } from '@prisma/client';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET as string;

if (!JWT_SECRET) { console.error('FATAL ERROR: JWT_SECRET is not defined in auth.middleware.'); }

// Extendemos la interfaz Request de Express para añadir la propiedad 'user'
// con los campos que ahora sí vamos a seleccionar, incluyendo el Tier
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: UserRole;
        businessId: string;
        isActive: boolean;
        name?: string | null;
        points: number;
        // *** CAMBIO: Añadir campo para el Tier actual ***
        // Seleccionaremos solo id y name del Tier para no cargar datos innecesarios
        currentTier?: { id: string; name: string; } | null;
      };
    }
  }
}

export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) {
      // Si no hay token, simplemente pasamos al siguiente middleware o ruta.
      // Las rutas específicas que REQUIERAN autenticación deben verificar req.user.
      // Pero si usamos authenticateToken globalmente en /api, deberíamos devolver 401.
      // Vamos a mantener el 401 por consistencia con el comportamiento anterior.
      return res.sendStatus(401);
  }

  jwt.verify(token, JWT_SECRET, async (err: any, payload: any) => {
    if (err) {
        console.error('JWT verification failed:', err.message);
        // Si el token es inválido o expirado, sí es un error de autenticación.
        return res.sendStatus(403); // Forbidden (o 401 Unauthorized)
    }

    try {
        // *** CAMBIO: Añadimos include para traer el Tier actual ***
        const user = await prisma.user.findUnique({
            where: { id: payload.userId },
            // Usamos include para traer la relación con el Tier
            include: {
                currentTier: { // Nombre de la relación definida en schema.prisma
                    select: { // Seleccionamos solo los campos que necesitamos del Tier
                        id: true,
                        name: true
                    }
                }
            }
            // Ya no necesitamos el 'select' explícito anterior,
            // porque 'include' trae los campos escalares por defecto
            // y especificamos qué traer de la relación.
        });
        // *** FIN CAMBIO ***

        // Comprobamos si el usuario existe y está activo
        if (!user || !user.isActive) {
             console.warn(`Attempted access with inactive/non-existent user ID: ${payload.userId}`);
             return res.sendStatus(403); // Usar 403 (Prohibido) es más adecuado que 401 aquí
        }

        // Adjuntamos el usuario con todos los datos seleccionados (incluyendo currentTier)
        // El tipo de req.user ahora coincide con lo que devuelve la consulta
        // Tenemos que asegurarnos de que el tipo en 'declare global' coincida
        // (Lo hemos hecho arriba)

        // IMPORTANTE: Prisma devuelve la relación 'currentTier' tal cual.
        // Si el usuario no tiene tier, user.currentTier será null.
        // Si tiene tier, user.currentTier será { id: '...', name: '...' }

        // Creamos un objeto reqUser explícito para evitar problemas con tipos implícitos
        const reqUser = {
            id: user.id,
            email: user.email,
            role: user.role,
            businessId: user.businessId,
            isActive: user.isActive,
            name: user.name,
            points: user.points,
            currentTier: user.currentTier // Esto será el objeto {id, name} o null
        };

        req.user = reqUser;
        next(); // Pasar al siguiente middleware o al handler de la ruta

    } catch (dbError) {
        console.error('Database error during token authentication:', dbError);
        // Error genérico del servidor si falla la consulta a la BD
        res.status(500).json({ message: 'Server error during authentication.' });
    }
  });
};

// End of File: backend/src/middleware/auth.middleware.ts
// --- FIN DEL CÓDIGO COMPLETO ---