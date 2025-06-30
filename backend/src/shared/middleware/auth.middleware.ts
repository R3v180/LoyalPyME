// backend/src/shared/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient, UserRole, Prisma } from '@prisma/client';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET as string;

if (!JWT_SECRET) {
    console.error('FATAL ERROR: JWT_SECRET is not defined in auth.middleware.');
}

// --- CORRECCIÓN 1: Actualizar la interfaz global de Express.Request ---
// Añadimos phone y imageUrl para que TypeScript los reconozca en req.user
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                email: string;
                role: UserRole;
                businessId: string | null;
                isActive: boolean;
                name?: string | null;
                phone?: string | null;      // <-- AÑADIDO
                imageUrl?: string | null;   // <-- AÑADIDO
                points?: number;
                totalSpend?: number;
                totalVisits?: number;
                currentTier?: { id: string; name: string; benefits: any[]; } | null;
                
                businessIsActive?: boolean;
                isLoyaltyCoreActive?: boolean;
                isCamareroActive?: boolean;
                businessName?: string | null;
                businessSlug?: string | null;
                businessLogoUrl?: string | null;
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
        if (err || !payload || !payload.userId || !payload.role) {
            return res.sendStatus(403);
        }

        try {
            // --- CORRECCIÓN 2: Modificar la selección de campos de Prisma ---
            const userProfileSelect: Prisma.UserSelect = {
                id: true,
                email: true,
                role: true,
                businessId: true,
                isActive: true,
                name: true,
                phone: true,      // <-- AÑADIDO
                imageUrl: true,   // <-- AÑADIDO
            };
            // --- FIN CORRECCIÓN 2 ---

            if (payload.businessId) {
                userProfileSelect.business = {
                    select: {
                        isActive: true,
                        isLoyaltyCoreActive: true,
                        isCamareroActive: true,
                        name: true,
                        slug: true,
                        logoUrl: true,
                    }
                };
            }

            if (payload.role === UserRole.CUSTOMER_FINAL && payload.businessId) {
                userProfileSelect.points = true;
                userProfileSelect.totalSpend = true;
                userProfileSelect.totalVisits = true;
                userProfileSelect.currentTier = {
                    select: {
                        id: true,
                        name: true,
                        benefits: {
                            where: { isActive: true },
                            select: { id: true, type: true, value: true, description: true }
                        }
                    }
                };
            } else if (payload.role !== UserRole.SUPER_ADMIN && !payload.businessId) {
                 return res.sendStatus(403);
            }

            const userFromDb = await prisma.user.findUnique({
                where: { id: payload.userId },
                select: userProfileSelect
            });

            if (!userFromDb || !userFromDb.isActive) {
                return res.sendStatus(403);
            }

            // @ts-ignore - Prisma genera el tipo `business` si se incluyó en el select
            const businessDataFromDb = userFromDb.business;

            if (userFromDb.role !== UserRole.SUPER_ADMIN && businessDataFromDb && !businessDataFromDb.isActive) {
                return res.sendStatus(403);
            }
            
            // --- CORRECCIÓN 3: Construir el objeto req.user con los nuevos campos ---
            // Como los campos son ahora parte del tipo, ya no necesitamos castear a 'any'.
            const reqUserObject: Express.Request['user'] = {
                id: userFromDb.id,
                email: userFromDb.email,
                role: userFromDb.role,
                businessId: userFromDb.businessId,
                isActive: userFromDb.isActive,
                name: userFromDb.name,
                phone: userFromDb.phone,
                imageUrl: userFromDb.imageUrl,
            };
            // --- FIN CORRECCIÓN 3 ---

            if (userFromDb.role === UserRole.CUSTOMER_FINAL) {
                // @ts-ignore
                reqUserObject.points = userFromDb.points;
                // @ts-ignore
                reqUserObject.totalSpend = userFromDb.totalSpend;
                // @ts-ignore
                reqUserObject.totalVisits = userFromDb.totalVisits;
                // @ts-ignore
                reqUserObject.currentTier = userFromDb.currentTier ?? null;
            }

            if (businessDataFromDb) {
                reqUserObject.businessIsActive = businessDataFromDb.isActive;
                reqUserObject.isLoyaltyCoreActive = businessDataFromDb.isLoyaltyCoreActive;
                reqUserObject.isCamareroActive = businessDataFromDb.isCamareroActive;
                reqUserObject.businessName = businessDataFromDb.name;
                reqUserObject.businessSlug = businessDataFromDb.slug;
                reqUserObject.businessLogoUrl = businessDataFromDb.logoUrl;
            } else if (userFromDb.role !== UserRole.SUPER_ADMIN && payload.businessId) {
                console.warn(`[AUTH MIDDLEWARE] Business data for businessId ${payload.businessId} was expected but not found for user ${userFromDb.id}. Module flags and business details will be undefined.`);
            }
            
            req.user = reqUserObject;
            
            console.log(`[AUTH MIDDLEWARE] User ${req.user.id} (Role: ${req.user.role}, BizId: ${req.user.businessId || 'N/A'}, Phone: ${req.user.phone || 'N/A'}) authenticated.`);

            next();
        } catch (dbError) {
            console.error('[AUTH MIDDLEWARE] Database error during user/business fetch:', dbError);
            delete req.user;
            res.status(500).json({ message: 'Server error during authentication process.' });
        }
    });
};