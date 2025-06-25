// filename: backend/src/auth/auth.dto.ts
// --- INICIO DEL CÓDIGO COMPLETO ---
// File: backend/src/auth/auth.dto.ts
// Version: 1.2.0 (Add RegisterBusinessDto)

import { UserRole, DocumentType } from '@prisma/client';

// DTO para Registro de Cliente (existente)
export interface RegisterUserDto {
  email: string;
  password: string;
  name?: string;
  phone: string; // Teléfono del cliente
  documentId: string; // Documento del cliente
  documentType: DocumentType; // Tipo doc cliente
  businessId: string; // ID del negocio al que se une
  role: UserRole; // Debe ser CUSTOMER_FINAL
}

// DTO para solicitar reseteo (existente)
export interface ForgotPasswordDto {
    email: string;
}

// DTO para realizar el reseteo (existente)
export interface ResetPasswordDto {
    password: string; // La nueva contraseña
    // El token vendrá por la URL (req.params)
}

// --- NUEVO: DTO para registrar un Negocio y su Admin ---
export interface RegisterBusinessDto {
    businessName: string;   // Nombre del nuevo negocio
    adminEmail: string;     // Email para el usuario administrador inicial
    adminPassword: string;  // Contraseña para ese administrador
    adminName?: string;      // Nombre opcional para el administrador
    // No necesitamos más datos por ahora para el MVP (slug se generará, etc.)
    // No pasamos role porque siempre será BUSINESS_ADMIN
    // No pasamos businessId porque se va a crear uno nuevo
}
// --- FIN NUEVO ---


// End of File: backend/src/auth/auth.dto.ts
// --- FIN DEL CÓDIGO COMPLETO ---