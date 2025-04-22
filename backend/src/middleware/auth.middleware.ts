// File: backend/src/middleware/auth.middleware.ts
// Version: 1.0.1 (Select name and points)

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient, UserRole } from '@prisma/client'; // Quitamos User que no usamos directamente aquí

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET as string;

if (!JWT_SECRET) { console.error('FATAL ERROR: JWT_SECRET is not defined in auth.middleware.'); }

// Extendemos la interfaz Request de Express para añadir la propiedad 'user'
// con los campos que ahora sí vamos a seleccionar
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: UserRole;
        businessId: string;
        isActive: boolean;
        name?: string | null; // Añadido
        points: number;       // Añadido
      };
    }
  }
}

export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) { return res.sendStatus(401); }

  jwt.verify(token, JWT_SECRET, async (err: any, payload: any) => {
    if (err) {
        console.error('JWT verification failed:', err.message);
      return res.sendStatus(403);
    }

    try {
        // --- CAMBIO AQUÍ: Añadimos name y points al select ---
        const user = await prisma.user.findUnique({
            where: { id: payload.userId },
            select: {
                id: true,
                email: true,
                role: true,
                businessId: true,
                isActive: true,
                name: true,     // <-- AÑADIDO
                points: true    // <-- AÑADIDO
            }
        });
        // --- FIN CAMBIO ---

        if (!user || !user.isActive) {
             console.warn(`Attempted access with inactive/non-existent user ID: ${payload.userId}`);
             return res.sendStatus(403); // Usar 403 (Prohibido) es más adecuado que 401 aquí
        }

        // Adjuntamos el usuario con todos los datos seleccionados
        req.user = user;
        next();

    } catch (dbError) {
        console.error('Database error during token authentication:', dbError);
        res.status(500).json({ message: 'Server error during authentication.' });
    }
  });
};

// End of File: backend/src/middleware/auth.middleware.ts