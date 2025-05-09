// backend/src/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient, UserRole, Prisma, User } from '@prisma/client';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET as string;

if (!JWT_SECRET) {
    console.error('FATAL ERROR: JWT_SECRET is not defined in auth.middleware.');
}

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
                points?: number;
                totalSpend?: number;
                totalVisits?: number;
                currentTier?: { id: string; name: string; benefits: any[]; } | null;
                businessIsActive?: boolean;
                isLoyaltyCoreActive?: boolean;
                isCamareroActive?: boolean;
            };
        }
    }
}

export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) { return res.sendStatus(401); }

    jwt.verify(token, JWT_SECRET, async (err: any, payload: any) => {
        if (err || !payload || !payload.userId || !payload.role) {
            console.error('[AUTH MIDDLEWARE DEBUG] JWT verification failed or invalid payload:', { err, payload });
            return res.sendStatus(403);
        }
        console.log('[AUTH MIDDLEWARE DEBUG] JWT Payload OK:', payload);

        try {
            const userProfileSelect: Prisma.UserSelect = {
                id: true, email: true, role: true, businessId: true, isActive: true, name: true,
            };

            if (payload.businessId) {
                console.log('[AUTH MIDDLEWARE DEBUG] Payload has businessId, selecting business data...');
                userProfileSelect.business = {
                    select: { isActive: true, isLoyaltyCoreActive: true, isCamareroActive: true }
                };
            }

            if (payload.role !== UserRole.SUPER_ADMIN && payload.businessId) {
                console.log('[AUTH MIDDLEWARE DEBUG] Payload is not SUPER_ADMIN and has businessId, selecting user-specific business fields...');
                userProfileSelect.points = true;
                userProfileSelect.totalSpend = true;
                userProfileSelect.totalVisits = true;
                userProfileSelect.currentTier = {
                    select: {
                        id: true, name: true,
                        benefits: { where: { isActive: true }, select: { id: true, type: true, value: true, description: true } }
                    }
                };
            } else if (payload.role !== UserRole.SUPER_ADMIN && !payload.businessId) {
                 console.error(`[AUTH MIDDLEWARE DEBUG] User role ${payload.role} requires a businessId, but none found for user ${payload.userId}.`);
                 return res.sendStatus(403);
            }
            console.log('[AUTH MIDDLEWARE DEBUG] Prisma User Select Query:', JSON.stringify(userProfileSelect, null, 2));

            const userFromDb = await prisma.user.findUnique({
                where: { id: payload.userId },
                select: userProfileSelect
            });
            console.log('[AUTH MIDDLEWARE DEBUG] User fetched from DB:', JSON.stringify(userFromDb, null, 2));


            if (!userFromDb || !userFromDb.isActive) {
                console.log(`[AUTH MIDDLEWARE DEBUG] User ${payload.userId} not found or not active in DB. Sending 403.`);
                return res.sendStatus(403);
            }

            // @ts-ignore
            const businessDataFromDb = userFromDb.business; // Intentamos acceder a la relación
            console.log('[AUTH MIDDLEWARE DEBUG] Business data from DB relation:', JSON.stringify(businessDataFromDb, null, 2));


            if (userFromDb.role !== UserRole.SUPER_ADMIN && businessDataFromDb && !businessDataFromDb.isActive) {
                console.log(`[AUTH MIDDLEWARE DEBUG] Business ${userFromDb.businessId} for user ${userFromDb.id} is not active. Denying access.`);
                return res.sendStatus(403);
            }

            const baseUser = {
                id: userFromDb.id,
                email: userFromDb.email,
                role: userFromDb.role,
                businessId: userFromDb.businessId,
                isActive: userFromDb.isActive,
                name: userFromDb.name,
            };

            let fullUserObject: Request['user'] = baseUser;

            if (userFromDb.role !== UserRole.SUPER_ADMIN) {
                // @ts-ignore
                fullUserObject.points = userFromDb.points;
                // @ts-ignore
                fullUserObject.totalSpend = userFromDb.totalSpend;
                // @ts-ignore
                fullUserObject.totalVisits = userFromDb.totalVisits;
                // @ts-ignore
                fullUserObject.currentTier = userFromDb.currentTier ?? null;
            }

            if (businessDataFromDb) { // Solo añadir si businessDataFromDb no es null/undefined
                fullUserObject.businessIsActive = businessDataFromDb.isActive;
                fullUserObject.isLoyaltyCoreActive = businessDataFromDb.isLoyaltyCoreActive;
                fullUserObject.isCamareroActive = businessDataFromDb.isCamareroActive;
            } else if (userFromDb.role !== UserRole.SUPER_ADMIN && payload.businessId) {
                // Si no es SUPER_ADMIN y TENÍA businessId en token pero no se cargó la relación business
                console.warn(`[AUTH MIDDLEWARE DEBUG] Business data for businessId ${payload.businessId} was expected but not found in userFromDb. Flags will be undefined.`);
            }
            
            req.user = fullUserObject;
            
            console.log('[AUTH MIDDLEWARE DEBUG] Final req.user object being set:', JSON.stringify(req.user, null, 2));
            console.log(`[AUTH MIDDLEWARE] User ${req.user.id} (Role: ${req.user.role}, BizId: ${req.user.businessId || 'N/A'}, BizActive: ${req.user.businessIsActive}, LCo: ${req.user.isLoyaltyCoreActive}, LCm: ${req.user.isCamareroActive}) authenticated.`);

            next();
        } catch (dbError) {
            console.error('[AUTH MIDDLEWARE DEBUG] Database error during user fetch:', dbError);
            delete req.user;
            res.status(500).json({ message: 'Server error during authentication.' });
        }
    });
};