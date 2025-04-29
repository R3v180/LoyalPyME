// filename: backend/src/auth/registration.controller.ts
// Version: 1.0.0 (Extracted registration handlers from auth.controller.ts)

import { Request, Response } from 'express';
import { Prisma, DocumentType, User } from '@prisma/client';

// DTOs necesarios para registro
import { RegisterUserDto, RegisterBusinessDto } from './auth.dto';

// Utils de Validación
import { isValidDni, isValidNie, isValidPhoneNumber } from '../utils/validation';

// Servicios necesarios
import { findUserByEmail, generateToken } from './auth.service'; // generateToken para registerBusiness
import { createUser, createBusinessAndAdmin } from './registration.service';

/**
 * Handles CUSTOMER user registration. POST /api/auth/register
 */
export const register = async (req: Request, res: Response) => {
    const { email, password, name, phone, documentId, documentType, businessId, role }: RegisterUserDto = req.body;
    // console.log(`[REG CTRL] Attempting customer registration for email: ${email}`); // Log reducido

    // Validación de campos obligatorios para cliente
    if (!email || !password || !phone || !documentId || !documentType || !businessId || !role || role !== 'CUSTOMER_FINAL') {
        // console.log('[REG CTRL] Registration failed: Missing required fields or invalid role for customer.'); // Log reducido
        return res.status(400).json({ message: 'Faltan campos obligatorios o rol inválido para registro de cliente.' }); // Corregido: inválido
    }

    try {
        // Comprobación de Email Duplicado
        const existingUser = await findUserByEmail(email);
        if (existingUser) {
            // console.log(`[REG CTRL] Registration failed: User email already exists: ${email}. Sending 409.`); // Log reducido
            return res.status(409).json({ message: 'El email ya está registrado.' });
        }

        // Validación de Formato
        if (!isValidPhoneNumber(phone)) {
             return res.status(400).json({ message: 'Formato de teléfono inválido.' }); // Corregido: teléfono, inválido
        }
        let isDocumentValid = false;
        const upperDocumentId = documentId.toUpperCase(); // Normalizar a mayúsculas
        switch (documentType) {
            case DocumentType.DNI: isDocumentValid = isValidDni(upperDocumentId); break;
            case DocumentType.NIE: isDocumentValid = isValidNie(upperDocumentId); break;
            case DocumentType.PASSPORT: isDocumentValid = upperDocumentId.trim().length > 3; break;
            case DocumentType.OTHER: isDocumentValid = upperDocumentId.trim().length > 0; break;
            default: return res.status(400).json({ message: 'Tipo de documento inválido.' }); // Corregido: inválido
        }
        if (!isDocumentValid) { return res.status(400).json({ message: `Formato de ${documentType} inválido.` }); } // Corregido: inválido

        // Llamar al Servicio createUser
        // console.log(`[REG CTRL] Calling createUser service for customer ${email}...`); // Log reducido
        const userDataForService: RegisterUserDto = {
             email, password, name, phone,
             documentId: upperDocumentId, // Enviar normalizado
             documentType, businessId, role
        };
        const newUser = await createUser(userDataForService);

        // Éxito: Responder sin datos sensibles
        // console.log(`[REG CTRL] Customer user created: ${newUser.id}.`); // Log reducido
        const {
            password: _password,
            documentId: _documentId,
            // Otros campos si fueran sensibles
            ...userWithoutSensitiveData
        } = newUser;
        console.log(`[REG CTRL] Customer registration successful for user ${newUser.id}. Sending 201.`);
        res.status(201).json({ user: userWithoutSensitiveData });

   } catch (error) {
        // Manejo de Errores (captura errores de los servicios)
        // Corregidos mensajes con acentos/ñ
        if (error instanceof Error && (error.message.includes('teléfono') || error.message.includes('documento') || error.message.includes('Business with ID') || error.message.includes('ya está registrado'))) {
             return res.status(409).json({ message: error.message }); // 409 Conflict
        }
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            const target = (error.meta?.target as string[])?.join(', ');
            console.error(`[REG CTRL] Registration failed: Unique constraint DB error on ${target}.`);
            return res.status(409).json({ message: `Error de unicidad en ${target}` }); // 409 Conflict
        }
        console.error('[REG CTRL] Error during customer registration:', error); // Mantener error log
        res.status(500).json({ message: 'Error del servidor durante el registro.' });
   }
};


/**
 * Handles registration of a new business and its initial admin user.
 * POST /api/auth/register-business
 */
export const registerBusinessHandler = async (req: Request, res: Response) => {
    const { businessName, adminEmail, adminPassword, adminName }: RegisterBusinessDto = req.body;
    console.log(`[REG CTRL] Attempting business registration for: ${businessName} / ${adminEmail}`);

    // Validación básica
    if (!businessName || !adminEmail || !adminPassword) {
        return res.status(400).json({ message: 'Nombre del negocio, email del administrador y contraseña son requeridos.' }); // Corregido: contraseña
    }
    if (businessName.trim().length < 2) {
        return res.status(400).json({ message: 'El nombre del negocio debe tener al menos 2 caracteres.' });
    }
    if (adminPassword.length < 6) {
        return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres.' }); // Corregido: contraseña
    }

    try {
        // Llamar al servicio de registro
        // console.log(`[REG CTRL] Calling createBusinessAndAdmin service for ${adminEmail}...`); // Log reducido
        const newAdminUser = await createBusinessAndAdmin({
            businessName: businessName.trim(),
            adminEmail,
            adminPassword,
            adminName: adminName?.trim()
        });

        // Generar token
        const token = generateToken(newAdminUser as User); // Necesita id, role, businessId

        // Enviar respuesta
        console.log(`[REG CTRL] Business registration successful for ${newAdminUser.email}. Sending 201.`);
        res.status(201).json({
            user: newAdminUser, // El servicio ya devuelve sin contraseña
            token: token
        });

    } catch (error: any) {
        console.error('[REG CTRL] Error during business registration:', error); // Mantener error log
        // Manejo de errores
        if (error instanceof Error) {
             // Corregidos mensajes
             if (error.message.includes('El email proporcionado ya está registrado') ||
                 error.message.includes('Ya existe un negocio con un nombre similar')) {
                 return res.status(409).json({ message: error.message }); // 409 Conflict
             }
              if (error.message.includes('nombre del negocio') || error.message.includes('Error de base de datos')) {
                   return res.status(400).json({ message: error.message }); // 400 Bad Request
              }
        }
        res.status(500).json({ message: error.message || 'Error del servidor durante el registro del negocio.' }); // Corregido: mensaje genérico
    }
};

// End of File: backend/src/auth/registration.controller.ts