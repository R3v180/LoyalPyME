// backend/src/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient, UserRole, Prisma, User } from '@prisma/client'; // User ya estaba importado

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET as string;

if (!JWT_SECRET) {
    console.error('FATAL ERROR: JWT_SECRET is not defined in auth.middleware.');
    // Considerar process.exit(1) en un escenario real si esto es crítico
}

// Definición de req.user (Asegúrate de que este tipo global ya incluya los nuevos campos o ajústalo)
// Esta declaración ya estaba en tu archivo original, la adaptamos.
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
                currentTier?: { id: string; name: string; benefits: any[]; } | null; // 'any[]' para benefits es genérico, considera tiparlo mejor si es posible
                
                // Flags del negocio
                businessIsActive?: boolean;
                isLoyaltyCoreActive?: boolean;
                isCamareroActive?: boolean;

                // --- NUEVOS CAMPOS PARA EL NEGOCIO ---
                businessName?: string | null;
                businessSlug?: string | null;
                businessLogoUrl?: string | null;
                // --- FIN NUEVOS CAMPOS ---
            };
        }
    }
}

export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
        console.log('[AUTH MIDDLEWARE] No token provided. Sending 401.');
        return res.sendStatus(401);
    }

    jwt.verify(token, JWT_SECRET, async (err: any, payload: any) => {
        if (err || !payload || !payload.userId || !payload.role) {
            console.error('[AUTH MIDDLEWARE] JWT verification failed or invalid payload:', { err, payload_userId: payload?.userId, payload_role: payload?.role });
            return res.sendStatus(403); // Token inválido o corrupto
        }
        // console.log('[AUTH MIDDLEWARE DEBUG] JWT Payload OK:', payload);

        try {
            // Define el tipo de selección para Prisma, incluyendo campos del negocio
            const userProfileSelect: Prisma.UserSelect = {
                id: true,
                email: true,
                role: true,
                businessId: true, // Necesario para la lógica de negocio y para obtener los detalles del negocio
                isActive: true,
                name: true,
            };

            // Si el usuario tiene un businessId (es decir, no es SUPER_ADMIN que no tiene businessId directo)
            if (payload.businessId) {
                // console.log('[AUTH MIDDLEWARE DEBUG] Payload has businessId, selecting business data...');
                userProfileSelect.business = { // Seleccionar la relación 'business'
                    select: {
                        isActive: true,
                        isLoyaltyCoreActive: true,
                        isCamareroActive: true,
                        name: true,         // <--- AÑADIDO
                        slug: true,         // <--- AÑADIDO
                        logoUrl: true,      // <--- AÑADIDO (Opcional, pero útil para el header)
                    }
                };
            }

            // Si el rol es CUSTOMER_FINAL y tiene businessId (para asegurar que no se intente para SUPER_ADMIN)
            if (payload.role === UserRole.CUSTOMER_FINAL && payload.businessId) {
                // console.log('[AUTH MIDDLEWARE DEBUG] Role is CUSTOMER_FINAL, selecting LCo specific fields...');
                userProfileSelect.points = true;
                userProfileSelect.totalSpend = true;
                userProfileSelect.totalVisits = true;
                userProfileSelect.currentTier = {
                    select: {
                        id: true,
                        name: true,
                        benefits: { // Considerar si realmente se necesitan todos los beneficios aquí
                            where: { isActive: true },
                            select: { id: true, type: true, value: true, description: true }
                        }
                    }
                };
            } else if (payload.role !== UserRole.SUPER_ADMIN && !payload.businessId) {
                 // Esto es un caso anómalo: un rol que no es SUPER_ADMIN debería tener un businessId.
                 console.error(`[AUTH MIDDLEWARE] User role ${payload.role} requires a businessId, but none found for user ${payload.userId}. Denying access.`);
                 return res.sendStatus(403); // Prohibido
            }
            // console.log('[AUTH MIDDLEWARE DEBUG] Prisma User Select Query:', JSON.stringify(userProfileSelect, null, 2));

            const userFromDb = await prisma.user.findUnique({
                where: { id: payload.userId },
                select: userProfileSelect
            });
            // console.log('[AUTH MIDDLEWARE DEBUG] User fetched from DB:', JSON.stringify(userFromDb, null, 2));

            if (!userFromDb || !userFromDb.isActive) {
                console.log(`[AUTH MIDDLEWARE] User ${payload.userId} not found or not active in DB. Sending 403.`);
                return res.sendStatus(403); // Usuario no encontrado o inactivo
            }

            // Extraer datos del negocio si existen en el usuario cargado
            // @ts-ignore Prisma genera el tipo `business` en `userFromDb` si se incluyó en el select
            const businessDataFromDb = userFromDb.business;
            // console.log('[AUTH MIDDLEWARE DEBUG] Business data from DB relation:', JSON.stringify(businessDataFromDb, null, 2));


            // Si el usuario no es SUPER_ADMIN y su negocio asociado NO está activo, denegar acceso
            if (userFromDb.role !== UserRole.SUPER_ADMIN && businessDataFromDb && !businessDataFromDb.isActive) {
                console.log(`[AUTH MIDDLEWARE] Business ${userFromDb.businessId} for user ${userFromDb.id} is not active. Denying access.`);
                return res.sendStatus(403); // Negocio inactivo
            }
            
            // Construir el objeto req.user
            const reqUserObject: Express.Request['user'] = {
                id: userFromDb.id,
                email: userFromDb.email,
                role: userFromDb.role,
                businessId: userFromDb.businessId,
                isActive: userFromDb.isActive,
                name: userFromDb.name,
            };

            // Añadir campos específicos de LCo si es CUSTOMER_FINAL
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

            // Añadir flags y detalles del negocio si existen
            if (businessDataFromDb) {
                reqUserObject.businessIsActive = businessDataFromDb.isActive;
                reqUserObject.isLoyaltyCoreActive = businessDataFromDb.isLoyaltyCoreActive;
                reqUserObject.isCamareroActive = businessDataFromDb.isCamareroActive;
                reqUserObject.businessName = businessDataFromDb.name;           // <--- AÑADIDO
                reqUserObject.businessSlug = businessDataFromDb.slug;           // <--- AÑADIDO
                reqUserObject.businessLogoUrl = businessDataFromDb.logoUrl;     // <--- AÑADIDO
            } else if (userFromDb.role !== UserRole.SUPER_ADMIN && payload.businessId) {
                // Caso borde: El token tenía businessId, pero no se pudo cargar la info del negocio.
                // Esto podría indicar un problema de datos (ej. negocio borrado pero usuario aún lo referencia).
                // Por seguridad, podríamos denegar o loguear y continuar con flags undefined/null.
                console.warn(`[AUTH MIDDLEWARE] Business data for businessId ${payload.businessId} was expected but not found for user ${userFromDb.id}. Module flags and business details will be undefined.`);
            }
            
            req.user = reqUserObject; // Asignar el objeto construido a req.user
            
            // console.log('[AUTH MIDDLEWARE DEBUG] Final req.user object being set:', JSON.stringify(req.user, null, 2));
            console.log(`[AUTH MIDDLEWARE] User ${req.user.id} (Role: ${req.user.role}, BizId: ${req.user.businessId || 'N/A'}, BizSlug: ${req.user.businessSlug || 'N/A'}) authenticated.`);

            next();
        } catch (dbError) {
            console.error('[AUTH MIDDLEWARE] Database error during user/business fetch:', dbError);
            delete req.user; // Limpiar req.user en caso de error
            res.status(500).json({ message: 'Server error during authentication process.' });
        }
    });
};