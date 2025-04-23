// File: backend/src/auth/auth.dto.ts
// Version: 1.0.0 (Define RegisterUserDto independently)

// Importar Enums necesarios desde Prisma Client
import { UserRole, DocumentType } from '@prisma/client';

// Definir y exportar la interfaz DTO para registro
export interface RegisterUserDto {
  email: string;
  password: string; // La contraseña aquí será la hasheada al usarla en createUser
  name?: string;
  phone: string;
  documentId: string;
  documentType: DocumentType; // Usa el Enum importado
  businessId: string;
  role: UserRole; // Usa el Enum importado
}

// End of File: backend/src/auth/auth.dto.ts