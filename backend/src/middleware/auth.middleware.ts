// File: backend/src/middleware/auth.middleware.ts
// Version: 1.1.1 (Add extensive logging for debugging)

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient, UserRole, Tier, Prisma } from '@prisma/client';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET as string;

if (!JWT_SECRET) { console.error('FATAL ERROR: JWT_SECRET is not defined in auth.middleware.'); }

// Extendemos la interfaz Request (sin cambios)
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string; email: string; role: UserRole; businessId: string; isActive: boolean;
        name?: string | null; points: number;
        currentTier?: { id: string; name: string; } | null;
      };
    }
  }
}

export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  // --- LOG INICIO ---
  console.log(`[AUTH MIDDLEWARE] Executing for: ${req.method} ${req.originalUrl}`);

  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) {
     // --- LOG SIN TOKEN ---
    console.log('[AUTH MIDDLEWARE] No token found, sending 401.');
    return res.sendStatus(401);
  }

  // --- LOG TOKEN ENCONTRADO ---
  console.log('[AUTH MIDDLEWARE] Token found, verifying...');
  jwt.verify(token, JWT_SECRET, async (err: any, payload: any) => {
    if (err) {
      // --- LOG ERROR VERIFICACIÓN ---
      console.error('[AUTH MIDDLEWARE] JWT verification failed:', err.message);
      return res.sendStatus(403);
    }

    // --- LOG PAYLOAD OK ---
    console.log('[AUTH MIDDLEWARE] JWT payload valid, fetching user from DB. Payload userId:', payload?.userId);
    try {
      const user = await prisma.user.findUnique({
          where: { id: payload.userId },
          include: {
              currentTier: { select: { id: true, name: true } }
          }
      });

      if (!user || !user.isActive) {
          // --- LOG USUARIO NO ENCONTRADO O INACTIVO ---
          console.warn(`[AUTH MIDDLEWARE] User ${payload.userId} not found or inactive, sending 403.`);
          return res.sendStatus(403);
      }

      // --- LOG USUARIO ENCONTRADO Y ACTIVO ---
      console.log(`[AUTH MIDDLEWARE] User ${user.id} (${user.email}) found and active. Role: ${user.role}. Attaching req.user.`);
      const reqUser = {
          id: user.id, email: user.email, role: user.role, businessId: user.businessId,
          isActive: user.isActive, name: user.name, points: user.points,
          currentTier: user.currentTier
      };
      req.user = reqUser;

      // --- LOG ANTES DE NEXT() ---
      console.log('[AUTH MIDDLEWARE] Authentication successful, calling next().');
      next();

    } catch (dbError) {
      // --- LOG ERROR DB ---
      console.error('[AUTH MIDDLEWARE] Database error during user fetch:', dbError);
      res.status(500).json({ message: 'Server error during authentication.' });
    }
  });
};

// End of File: backend/src/middleware/auth.middleware.ts