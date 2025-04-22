// File: backend/src/auth/auth.controller.ts
// Version: 1.0.0

import { Request, Response } from 'express';
import { Prisma } from '@prisma/client'; // Importa Prisma para manejar errores específicos
// Importa funciones del servicio de auth (estas importaciones son CORRECTAS)
import { hashPassword, comparePassword, generateToken, findUserByEmail, createUser } from './auth.service';

// Define el DTO (Data Transfer Object) para el registro de usuario
// Esto describe la estructura de los datos que esperamos en el cuerpo de la petición POST /auth/register
// Exportamos esta interfaz para que pueda ser usada en auth.service.ts
export interface RegisterUserDto {
  email: string;
  password: string;
  name?: string; // Opcional
  phone?: string; // Opcional
  businessId: string;
  role: 'BUSINESS_ADMIN' | 'CUSTOMER_FINAL'; // Solo permitimos estos roles para registro publico via API
}

/**
 * Handles user registration.
 * POST /auth/register
 * Expected body: RegisterUserDto
 */
export const register = async (req: Request, res: Response) => {
  // Extrae los datos del cuerpo de la petición (req.body)
  const { email, password, name, phone, businessId, role }: RegisterUserDto = req.body;

  // Validación básica de los datos de entrada
  if (!email || !password || !businessId || !role) {
    // Si faltan campos requeridos, responde con un error 400
    return res.status(400).json({ message: 'Email, password, businessId, and role are required.' });
  }

  // Validar que el rol proporcionado sea uno de los permitidos para registro via API
  if (role !== 'BUSINESS_ADMIN' && role !== 'CUSTOMER_FINAL') {
       // Si el rol no es válido, responde con un error 400
       return res.status(400).json({ message: 'Invalid role specified. Allowed roles are BUSINESS_ADMIN or CUSTOMER_FINAL.' });
  }

  try {
    // 1. Verificar si ya existe un usuario con ese email en la base de datos
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      // Si el usuario ya existe, responde con un error 409 Conflict
      return res.status(409).json({ message: 'User with that email already exists.' });
    }

    // 2. Hashear la contraseña proporcionada por el usuario
    const hashedPassword = await hashPassword(password);

    // 3. Crear el usuario en la base de datos llamando a la función de servicio
    // Pasamos los datos, asegurándonos de usar la contraseña HASHED
    const newUser = await createUser({
      email,
      password: hashedPassword, // <-- Usamos la contraseña hasheada
      name,
      phone,
      businessId,
      role // <-- Usamos el rol validado
    });

    // 4. Generar un JSON Web Token para el usuario recién creado
    const token = generateToken(newUser);

    // 5. Responder al cliente con los datos del nuevo usuario (excepto la contraseña) y el token
    // Usamos object destructuring para excluir la contraseña del objeto de respuesta
    const { password: _, ...userWithoutPassword } = newUser;
    res.status(201).json({ user: userWithoutPassword, token }); // 201 Created - indica que un recurso fue creado exitosamente

  } catch (error) {
    // Manejo de errores
    // Si el error es el que lanzamos en el servicio cuando el businessId no existe
     if (error instanceof Error && error.message.includes('Business with ID')) {
         return res.status(400).json({ message: error.message });
     }
     // Manejo de otros posibles errores de base de datos de Prisma
     if (error instanceof Prisma.PrismaClientKnownRequestError) {
         // P2002 es el código de error de Prisma para "Unique constraint failed" (violación de restricción única)
         if (error.code === 'P2002') {
             return res.status(409).json({ message: `Duplicate field: ${error.meta?.target}` });
         }
         // Puedes añadir manejo para otros códigos de error de Prisma si es necesario
     }

    // Para cualquier otro error inesperado
    console.error('Error during registration:', error); // Loggea el error en el servidor
    res.status(500).json({ message: 'Server error during registration.' }); // Responde con un error genérico 500
  }
};


/**
 * Handles user login.
 * POST /auth/login
 * Expected body: { email: string, password: string }
 */
export const login = async (req: Request, res: Response) => {
  // Extrae email y password del cuerpo de la petición
  const { email, password } = req.body;

  // Validación básica
  if (!email || !password) {
    // Si faltan email o password, responde con un error 400
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    // 1. Buscar al usuario por email en la base de datos
    const user = await findUserByEmail(email);
    if (!user) {
      // Si el usuario no existe o la contraseña es incorrecta, responder con un error 401
      // Es importante usar un mensaje genérico para no dar pistas sobre si el email existe o no
      return res.status(401).json({ message: 'Invalid credentials.' }); // 401 Unauthorized
    }

    // 2. Comparar la contraseña proporcionada con la contraseña hasheada almacenada en la base de datos
    const passwordMatch = await comparePassword(password, user.password);
    if (!passwordMatch) {
       // Si las contraseñas no coinciden, responder con un error 401
       // Usar un mensaje genérico para no dar pistas sobre si la contraseña es incorrecta
       return res.status(401).json({ message: 'Invalid credentials.' }); // 401 Unauthorized
    }

    // 3. Generar un JSON Web Token para el usuario autenticado
    const token = generateToken(user);

    // 4. Responder al cliente con los datos del usuario (excepto la contraseña) y el token
    const { password: _, ...userWithoutPassword } = user; // Excluye la contraseña
    res.status(200).json({ user: userWithoutPassword, token }); // 200 OK - indica éxito

  } catch (error) {
    // Para cualquier error inesperado durante el login
    console.error('Error during login:', error); // Loggea el error en el servidor
    res.status(500).json({ message: 'Server error during login.' }); // Responde con un error genérico 500
  }
};


// Puedes añadir mas funciones de controlador de autenticacion aqui en el futuro
// Por ejemplo: forgotPassword, resetPassword, verifyEmail, etc.


// End of File: backend/src/auth/auth.controller.ts