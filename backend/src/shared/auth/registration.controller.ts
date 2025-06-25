// filename: backend/src/auth/registration.controller.ts
// Version: 1.0.2 (Remove Swagger annotations)

import { Request, Response } from 'express';
import { Prisma, DocumentType, User } from '@prisma/client';

// DTOs necesarios para registro
import { RegisterUserDto, RegisterBusinessDto } from './auth.dto';
// Utils de Validación
import { isValidDni, isValidNie, isValidPhoneNumber } from '../utils/validation';

// Servicios necesarios
import { findUserByEmail, generateToken } from './auth.service';
import { createUser, createBusinessAndAdmin } from './registration.service';

// SIN ANOTACIÓN @openapi
export const register = async (req: Request, res: Response) => {
    const { email, password, name, phone, documentId, documentType, businessId, role }: RegisterUserDto = req.body;

    if (!email || !password || !phone || !documentId || !documentType || !businessId || !role || role !== 'CUSTOMER_FINAL') {
        return res.status(400).json({ message: 'Faltan campos obligatorios o rol inválido para registro de cliente.' });
    }

    try {
        const existingUser = await findUserByEmail(email);
        if (existingUser) {
            return res.status(409).json({ message: 'El email ya está registrado.' });
        }

        if (!isValidPhoneNumber(phone)) {
             return res.status(400).json({ message: 'Formato de teléfono inválido.' });
        }
        let isDocumentValid = false;
        const upperDocumentId = documentId.toUpperCase();
        switch (documentType) {
            case DocumentType.DNI: isDocumentValid = isValidDni(upperDocumentId); break;
            case DocumentType.NIE: isDocumentValid = isValidNie(upperDocumentId); break;
            case DocumentType.PASSPORT: isDocumentValid = upperDocumentId.trim().length > 3; break;
            case DocumentType.OTHER: isDocumentValid = upperDocumentId.trim().length > 0; break;
            default: return res.status(400).json({ message: 'Tipo de documento inválido.' });
        }
        if (!isDocumentValid) { return res.status(400).json({ message: `Formato de ${documentType} inválido.` }); }

        const userDataForService: RegisterUserDto = {
             email, password, name, phone,
             documentId: upperDocumentId, // Enviar normalizado
             documentType, businessId, role
        };
        const newUser = await createUser(userDataForService);

        const {
            password: _password,
            documentId: _documentId,
            resetPasswordToken: _resetToken,
            resetPasswordExpires: _resetExpires,
            ...userWithoutSensitiveData
        } = newUser;
        console.log(`[REG CTRL] Customer registration successful for user ${newUser.id}. Sending 201.`);
        res.status(201).json({ user: userWithoutSensitiveData });
    } catch (error) {
        if (error instanceof Error && (error.message.includes('teléfono') || error.message.includes('documento') || error.message.includes('Business with ID') || error.message.includes('ya está registrado'))) {
             return res.status(409).json({ message: error.message });
        }
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            const target = (error.meta?.target as string[])?.join(', ');
            console.error(`[REG CTRL] Registration failed: Unique constraint DB error on ${target}.`);
            return res.status(409).json({ message: `Error de unicidad en ${target}` });
        }
        console.error('[REG CTRL] Error during customer registration:', error);
        res.status(500).json({ message: 'Error del servidor durante el registro.' });
    }
};


// SIN ANOTACIÓN @openapi
export const registerBusinessHandler = async (req: Request, res: Response) => {
    const { businessName, adminEmail, adminPassword, adminName }: RegisterBusinessDto = req.body;
    console.log(`[REG CTRL] Attempting business registration for: ${businessName} / ${adminEmail}`);

    if (!businessName || !adminEmail || !adminPassword) {
        return res.status(400).json({ message: 'Nombre del negocio, email del administrador y contraseña son requeridos.' });
    }
    if (businessName.trim().length < 2) {
        return res.status(400).json({ message: 'El nombre del negocio debe tener al menos 2 caracteres.' });
    }
    if (adminPassword.length < 6) {
        return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres.' });
    }

    try {
        const newAdminUser = await createBusinessAndAdmin({
            businessName: businessName.trim(),
            adminEmail,
            adminPassword,
            adminName: adminName?.trim()
        });
        const token = generateToken(newAdminUser as User);

        console.log(`[REG CTRL] Business registration successful for ${newAdminUser.email}. Sending 201.`);
        res.status(201).json({
            user: newAdminUser,
            token: token
        });
    } catch (error: any) {
        console.error('[REG CTRL] Error during business registration:', error);
        if (error instanceof Error) {
             if (error.message.includes('El email proporcionado ya está registrado') ||
                 error.message.includes('Ya existe un negocio con un nombre similar')) {
                 return res.status(409).json({ message: error.message });
             }
              if (error.message.includes('nombre del negocio') || error.message.includes('Error de base de datos')) {
                   return res.status(400).json({ message: error.message });
              }
        }
        res.status(500).json({ message: error.message || 'Error del servidor durante el registro del negocio.' });
    }
};

// End of File: backend/src/auth/registration.controller.ts