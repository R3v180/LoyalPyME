// backend/src/superadmin/superadmin.service.ts
import { PrismaClient, Business, Prisma, SuperAdminActionType, BusinessPayment, UserRole } from '@prisma/client';
import { differenceInCalendarMonths, getMonth, getYear, format } from 'date-fns';
import { es } from 'date-fns/locale';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET as string;

// --- TIPOS ---

export type SuperAdminBusinessListItem = Pick<
    Business,
    'id' | 'name' | 'slug' | 'isActive' | 'isLoyaltyCoreActive' | 'isCamareroActive' | 'createdAt' | 'monthlyPrice' | 'currency'
> & {
    paymentStatus: 'PAID' | 'PENDING' | 'OVERDUE' | 'NOT_CONFIGURED';
    lastPayment?: { month: number, year: number };
    pendingMonths: number;
};

type ModuleFieldInBusiness = 'isLoyaltyCoreActive' | 'isCamareroActive';


// --- SERVICIOS PRINCIPALES ---

/**
 * Obtiene todos los negocios y calcula su estado de suscripción.
 */
export const getAllBusinesses = async (): Promise<SuperAdminBusinessListItem[]> => {
    console.log("[SuperAdminService] Fetching all businesses for Super Admin panel...");
    try {
        const businesses = await prisma.business.findMany({
            orderBy: { name: 'asc' },
            include: {
                payments: {
                    orderBy: [{ year: 'desc' }, { month: 'desc' }],
                }
            }
        });

        const now = new Date();
        return businesses.map(business => {
            const lastPaymentRecord = business.payments[0];
            const lastPayment = lastPaymentRecord ? { month: lastPaymentRecord.month, year: lastPaymentRecord.year } : null;
            
            const monthsSinceCreation = differenceInCalendarMonths(now, business.createdAt);
            const paidMonthsCount = business.payments.length;
            const pendingMonths = Math.max(0, monthsSinceCreation - paidMonthsCount);
            
            let paymentStatus: 'PAID' | 'PENDING' | 'OVERDUE' | 'NOT_CONFIGURED' = 'PAID';

            if (!business.monthlyPrice || business.monthlyPrice.toNumber() === 0) {
                paymentStatus = 'NOT_CONFIGURED';
            } else if (pendingMonths > 1) {
                paymentStatus = 'OVERDUE';
            } else if (pendingMonths === 1) {
                paymentStatus = 'PENDING';
            }

            return {
                id: business.id,
                name: business.name,
                slug: business.slug,
                isActive: business.isActive,
                isLoyaltyCoreActive: business.isLoyaltyCoreActive,
                isCamareroActive: business.isCamareroActive,
                createdAt: business.createdAt,
                monthlyPrice: business.monthlyPrice,
                currency: business.currency,
                paymentStatus: paymentStatus,
                lastPayment: lastPayment || undefined,
                pendingMonths: pendingMonths,
            };
        });

    } catch (error) {
        console.error("[SuperAdminService] Error fetching all businesses:", error);
        throw new Error("Error al obtener la lista de negocios desde la base de datos.");
    }
};

/**
 * Cambia el estado 'isActive' general de un negocio y crea un log de auditoría.
 */
export const toggleBusinessStatus = async (businessId: string, isActive: boolean, adminId: string): Promise<Business> => {
    console.log(`[SuperAdminService] Toggling general isActive status for business ${businessId} to ${isActive} by admin ${adminId}`);
    try {
        const business = await prisma.business.findUnique({ where: { id: businessId } });
        if (!business) {
            throw new Error(`Negocio con ID ${businessId} no encontrado.`);
        }
        
        const updatedBusiness = await prisma.business.update({
            where: { id: businessId },
            data: { isActive },
        });

        await createAuditLog({
            adminUserId: adminId,
            actionType: SuperAdminActionType.BUSINESS_STATUS_TOGGLED,
            targetBusinessId: businessId,
            details: { oldValue: business.isActive, newValue: isActive }
        });

        return updatedBusiness;
    } catch (error) {
        handleServiceError(error, `Error toggling status for business ${businessId}`);
        throw error;
    }
};

/**
 * Cambia el estado de un módulo específico y crea un log de auditoría.
 */
export const toggleModule = async (
    businessId: string,
    moduleField: ModuleFieldInBusiness,
    isActiveModule: boolean,
    adminId: string
): Promise<Business> => {
    console.log(`[SuperAdminService] Toggling module '${moduleField}' for business ${businessId} to ${isActiveModule} by admin ${adminId}`);
    try {
        const business = await prisma.business.findUnique({ where: { id: businessId } });
        if (!business) {
            throw new Error(`Negocio con ID ${businessId} no encontrado.`);
        }

        const dataToUpdate: Prisma.BusinessUpdateInput = { [moduleField]: isActiveModule };
        const updatedBusiness = await prisma.business.update({
            where: { id: businessId },
            data: dataToUpdate,
        });

        await createAuditLog({
            adminUserId: adminId,
            actionType: moduleField === 'isLoyaltyCoreActive' ? SuperAdminActionType.MODULE_LOYALTY_TOGGLED : SuperAdminActionType.MODULE_CAMARERO_TOGGLED,
            targetBusinessId: businessId,
            details: { oldValue: business[moduleField], newValue: isActiveModule, module: moduleField }
        });

        return updatedBusiness;
    } catch (error) {
        handleServiceError(error, `Error toggling module ${moduleField} for business ${businessId}`);
        throw error;
    }
};

/**
 * Establece o actualiza el precio de la suscripción mensual para un negocio.
 */
export const setBusinessSubscriptionPrice = async (businessId: string, price: number, currency: string, adminId: string): Promise<Business> => {
  console.log(`[SuperAdminService] Setting subscription price for business ${businessId} to ${price} ${currency} by admin ${adminId}`);
  try {
    const business = await prisma.business.findUnique({ where: { id: businessId } });
    if (!business) throw new Error(`Negocio con ID ${businessId} no encontrado.`);

    const updatedBusiness = await prisma.business.update({
      where: { id: businessId },
      data: { monthlyPrice: price, currency: currency },
    });

    await createAuditLog({
        adminUserId: adminId,
        actionType: SuperAdminActionType.SUBSCRIPTION_PRICE_UPDATED,
        targetBusinessId: businessId,
        details: { 
            oldPrice: business.monthlyPrice?.toNumber() ?? null,
            newPrice: price, 
            currency: currency 
        }
    });

    return updatedBusiness;
  } catch (error) {
    handleServiceError(error, `Error setting price for business ${businessId}`);
    throw error;
  }
};

/**
 * Registra un nuevo pago manual para un negocio.
 */
export const recordManualPayment = async (businessId: string, adminId: string, paymentData: { amountPaid: number; month: number; year: number; notes?: string; paymentMethod?: string }): Promise<BusinessPayment> => {
    console.log(`[SuperAdminService] Recording manual payment for business ${businessId} by admin ${adminId}`, paymentData);
    try {
        const business = await prisma.business.findUnique({ where: { id: businessId }, select: { id: true }});
        if (!business) throw new Error(`Negocio con ID ${businessId} no encontrado para registrar pago.`);

        const newPayment = await prisma.businessPayment.create({
            data: {
                businessId: businessId,
                recordedByAdminId: adminId,
                amountPaid: paymentData.amountPaid,
                month: paymentData.month,
                year: paymentData.year,
                notes: paymentData.notes,
                paymentMethod: paymentData.paymentMethod
            }
        });

        await createAuditLog({
            adminUserId: adminId,
            actionType: SuperAdminActionType.MANUAL_PAYMENT_RECORDED,
            targetBusinessId: businessId,
            details: { 
                paymentId: newPayment.id, 
                amount: newPayment.amountPaid.toNumber(),
                period: `${paymentData.month}/${paymentData.year}` 
            }
        });

        return newPayment;
    } catch (error) {
        handleServiceError(error, `Error recording payment for business ${businessId}`);
        throw error;
    }
};

/**
 * Obtiene el historial de pagos de un negocio.
 */
export const getBusinessPaymentHistory = async (businessId: string): Promise<BusinessPayment[]> => {
    console.log(`[SuperAdminService] Fetching payment history for business ${businessId}`);
    try {
        return await prisma.businessPayment.findMany({
            where: { businessId: businessId },
            orderBy: [{ year: 'desc' }, { month: 'desc' }],
        });
    } catch (error) {
        handleServiceError(error, `Error fetching payment history for business ${businessId}`);
        throw error;
    }
};

/**
 * Calcula y devuelve los periodos (mes/año) pendientes de pago para un negocio.
 */
export const getPendingPaymentPeriods = async (businessId: string): Promise<{ year: number; month: number; label: string; }[]> => {
    console.log(`[SuperAdminService] Calculating pending payment periods for business ${businessId}`);
    try {
        const business = await prisma.business.findUnique({
            where: { id: businessId },
            select: { createdAt: true, payments: true }
        });
        if (!business) {
            throw new Error(`Negocio con ID ${businessId} no encontrado.`);
        }

        const paidPeriods = new Set(business.payments.map(p => `${p.year}-${p.month}`));
        const pendingPeriods: { year: number; month: number; label: string; }[] = [];
        
        let currentDate = business.createdAt;
        const now = new Date();

        while (currentDate <= now) {
            const year = getYear(currentDate);
            const month = getMonth(currentDate) + 1; // getMonth es 0-indexado
            const periodKey = `${year}-${month}`;

            if (!paidPeriods.has(periodKey)) {
                pendingPeriods.push({
                    year: year,
                    month: month,
                    label: format(currentDate, 'MMMM yyyy', { locale: es }) // Formato "junio 2025"
                });
            }
            
            // Avanzar al siguiente mes
            currentDate = new Date(year, month, 1); // El mes ya está 1-indexado, así que `month` es el siguiente mes
        }

        return pendingPeriods;
    } catch (error) {
        handleServiceError(error, `Error calculating pending periods for business ${businessId}`);
        throw error;
    }
};


/**
 * Genera un token de suplantación para un BUSINESS_ADMIN.
 */
export const getImpersonationToken = async (targetUserId: string, adminId: string): Promise<string> => {
    console.log(`[SuperAdminService] Admin ${adminId} requesting impersonation token for user ${targetUserId}`);
    try {
        const targetUser = await prisma.user.findUnique({ where: { id: targetUserId }});

        if (!targetUser || targetUser.role !== UserRole.BUSINESS_ADMIN) {
            throw new Error('El usuario a suplantar no existe o no es un administrador de negocio.');
        }

        const payload = {
            userId: targetUser.id,
            role: targetUser.role,
            businessId: targetUser.businessId,
            impersonated_by: adminId 
        };
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' }); 

        await createAuditLog({
            adminUserId: adminId,
            actionType: SuperAdminActionType.IMPERSONATION_STARTED,
            targetBusinessId: targetUser.businessId,
            details: { targetUserId: targetUser.id, targetUserEmail: targetUser.email }
        });

        return token;
    } catch (error) {
        handleServiceError(error, `Error generating impersonation token for user ${targetUserId}`);
        throw error;
    }
};


// --- FUNCIONES HELPERS ---

/**
 * Helper para crear una entrada en el log de auditoría del Super Admin.
 */
async function createAuditLog(data: {
    adminUserId: string;
    actionType: SuperAdminActionType;
    targetBusinessId?: string | null;
    details?: Prisma.JsonValue;
}) {
    try {
        const createData: Prisma.SuperAdminActivityLogCreateInput = {
            actionType: data.actionType,
            details: data.details || Prisma.JsonNull,
            adminUser: {
                connect: { id: data.adminUserId }
            }
        };

        if (data.targetBusinessId) {
            createData.targetBusiness = {
                connect: { id: data.targetBusinessId }
            };
        }

        await prisma.superAdminActivityLog.create({ data: createData });

    } catch (auditError) {
        console.error(`[SuperAdminService] CRITICAL: FAILED TO CREATE AUDIT LOG!`, auditError, `Original Action Data:`, data);
    }
}

/**
 * Helper para manejar y loguear errores de Prisma de forma consistente.
 */
function handleServiceError(error: unknown, contextMessage: string) {
    console.error(`[SuperAdminService] ${contextMessage}:`, error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
            throw new Error(`El registro solicitado no fue encontrado.`);
        }
        if (error.code === 'P2002') {
            throw new Error(`Error de unicidad: Ya existe un registro con estos datos (${(error.meta?.target as string[])?.join(', ')}).`);
        }
    }
}