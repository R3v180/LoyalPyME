// frontend/src/types/superadmin.types.ts

// El tipo de dato que la API /superadmin/businesses devuelve para cada negocio
export interface SuperAdminBusiness {
    id: string;
    name: string;
    slug: string;
    isActive: boolean;
    isLoyaltyCoreActive: boolean;
    isCamareroActive: boolean;
    createdAt: string;
    monthlyPrice: string | number | null; // La API puede enviar Decimal como string
    currency: string;
    paymentStatus: 'PAID' | 'PENDING' | 'OVERDUE';
    lastPayment?: { month: number; year: number };
    pendingMonths: number;
}

// El tipo de dato para un registro de pago individual
export interface BusinessPayment {
    id: string;
    paymentDate: string;
    amountPaid: number;
    month: number;
    year: number;
    paymentMethod: string | null;
    notes: string | null;
}