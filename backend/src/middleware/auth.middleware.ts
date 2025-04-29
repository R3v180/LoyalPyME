// filename: backend/src/middleware/auth.middleware.ts
// Version: 1.2.0 (Remove excessive debug logs)

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient, UserRole, Prisma } from '@prisma/client'; // Removed unused Tier import

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET as string;

// Critical error check remains
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
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
        // No log needed here, just send 401
        return res.sendStatus(401); // No autorizado (sin token)
    }

    jwt.verify(token, JWT_SECRET, async (err: any, payload: any) => {
        if (err) {
            console.error('[AUTH MIDDLEWARE] JWT verification failed:', err.message); // Keep error log
            return res.sendStatus(403); // Prohibido (token inválido)
        }

        try {
            // Fetch user from DB
            const user = await prisma.user.findUnique({
                where: { id: payload.userId },
                include: {
                    currentTier: { select: { id: true, name: true } }
                }
            });

            // Check if user exists and is active
            if (!user || !user.isActive) {
                 // console.warn(`[AUTH MIDDLEWARE] User ${payload.userId} not found or inactive, sending 403.`); // Optional: Keep warn if needed
                return res.sendStatus(403); // Prohibido (usuario no encontrado o inactivo)
            }

            // Attach user data to request object
            // Selecting specific fields for req.user is slightly safer
            const reqUser = {
                id: user.id,
                email: user.email,
                role: user.role,
                businessId: user.businessId,
                isActive: user.isActive,
                name: user.name,
                points: user.points,
                currentTier: user.currentTier
            };
            req.user = reqUser;

            // Proceed to the next middleware/handler
            next();

        } catch (dbError) {
            // Log database errors during user fetch
            console.error('[AUTH MIDDLEWARE] Database error during user fetch:', dbError); // Keep error log
            // Send generic server error response
            res.status(500).json({ message: 'Server error during authentication.' });
        }
    });
};

// End of File: backend/src/middleware/auth.middleware.ts