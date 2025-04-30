// filename: backend/src/middleware/auth.middleware.ts
// Version: 1.4.0 (Include totalSpend and totalVisits in user profile)

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient, UserRole, Prisma } from '@prisma/client';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET as string;

// Critical error check remains
if (!JWT_SECRET) { console.error('FATAL ERROR: JWT_SECRET is not defined in auth.middleware.'); }

// Extendemos la interfaz Request (actualizada para incluir beneficios y métricas)
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                email: string; role: UserRole; businessId: string; isActive: boolean;
                name?: string | null; points: number;
                // --- NUEVO: Añadir totalSpend y totalVisits ---
                totalSpend: number;
                totalVisits: number;
                // --- FIN NUEVO ---
                currentTier?: {
                    id: string;
                    name: string;
                    benefits: {
                        id: string;
                        type: string;
                        value: string;
                        description: string | null;
                    }[];
                } | null;
            };
        }
    }
}

export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
        return res.sendStatus(401);
    }

    jwt.verify(token, JWT_SECRET, async (err: any, payload: any) => {
        if (err) {
            console.error('[AUTH MIDDLEWARE] JWT verification failed:', err.message);
            return res.sendStatus(403);
        }

        try {
            // --- MODIFICACIÓN: Añadir totalSpend y totalVisits al select ---
            const user = await prisma.user.findUnique({
                where: { id: payload.userId },
                select: { // Usar select en lugar de include para ser explícitos
                    id: true,
                    email: true,
                    role: true,
                    businessId: true,
                    isActive: true,
                    name: true,
                    points: true,
                    totalSpend: true, // <-- AÑADIDO
                    totalVisits: true, // <-- AÑADIDO
                    currentTier: {
                        select: {
                            id: true,
                            name: true,
                            benefits: {
                                where: { isActive: true },
                                select: {
                                    id: true,
                                    type: true,
                                    value: true,
                                    description: true
                                }
                            }
                        }
                    }
                }
            });
            // --- FIN MODIFICACIÓN ---

            // Check if user exists and is active
            if (!user || !user.isActive) {
                return res.sendStatus(403);
            }

            // Attach user data to request object
            // El tipo de req.user ya se actualizó en la declaración global
            // No necesitamos el @ts-ignore si select devuelve exactamente lo esperado
            const reqUser = {
                id: user.id,
                email: user.email,
                role: user.role,
                businessId: user.businessId,
                isActive: user.isActive,
                name: user.name,
                points: user.points,
                totalSpend: user.totalSpend, // <-- AÑADIDO
                totalVisits: user.totalVisits, // <-- AÑADIDO
                currentTier: user.currentTier
            };
            req.user = reqUser as typeof req.user; // Mantenemos el cast por seguridad

            next();
        } catch (dbError) {
            console.error('[AUTH MIDDLEWARE] Database error during user fetch:', dbError);
            res.status(500).json({ message: 'Server error during authentication.' });
        }
    });
};

// End of File: backend/src/middleware/auth.middleware.ts