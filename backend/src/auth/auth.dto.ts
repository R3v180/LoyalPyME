// File: backend/src/auth/auth.dto.ts
// Version: 1.1.0 (Add DTOs for Forgot/Reset Password)

import { UserRole, DocumentType } from '@prisma/client';

// DTO para Registro (sin cambios)
export interface RegisterUserDto {
  email: string;
  password: string;
  name?: string;
  phone: string;
  documentId: string;
  documentType: DocumentType;
  businessId: string;
  role: UserRole;
}

// --- NUEVO: DTO para solicitar reseteo ---
export interface ForgotPasswordDto {
    email: string;
}
// --- FIN NUEVO ---

// --- NUEVO: DTO para realizar el reseteo ---
export interface ResetPasswordDto {
    password: string; // La nueva contraseña
    // El token vendrá por la URL (req.params)
}
// --- FIN NUEVO ---

// End of File: backend/src/auth/auth.dto.ts