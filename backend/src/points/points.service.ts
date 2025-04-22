// File: backend/src/points/points.service.ts
// Version: 1.0.3

// Importa los tipos y el cliente de Prisma, incluyendo los modelos, enums, tipos de usuario Y la clase Prisma para manejo de errores
import { PrismaClient, QrCode, User, Business, QrCodeStatus, UserRole, Prisma } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid'; // Para generar UUIDs unicos (tokens de QR)
import { addMinutes, isAfter } from 'date-fns'; // Para manejar fechas de expiracion de forma sencilla

const prisma = new PrismaClient();
const QR_EXPIRATION_MINUTES = 30; // Tiempo de validez del QR en minutos (configurable)

/**
 * Generates QR code data for a new points transaction.
 * This creates a QrCode record in the database with status PENDING.
 * This function is typically called from the BUSINESS_ADMIN panel.
 * @param businessId - The ID of the business generating the QR (from authenticated user).
 * @param amount - The transaction amount entered by the employee.
 * @param ticketNumber - The ticket number entered by the employee (optional).
 * @returns A promise that resolves with an object containing the generated QR token and the amount.
 */
export const generateQrCodeData = async (businessId: string, amount: number, ticketNumber?: string): Promise<{ qrToken: string; amount: number }> => {
    // Validacion basica de entrada: El monto debe ser un numero positivo
    if (amount <= 0 || typeof amount !== 'number') {
        throw new Error('Transaction amount must be a positive number.');
    }

    // Genera un token unico usando UUID v4
    const token = uuidv4();
    // Calcula la fecha y hora de expiracion (ahora + minutos de expiracion)
    const expiresAt = addMinutes(new Date(), QR_EXPIRATION_MINUTES);

    try {
        // Crear el registro del QR en la base de datos (tabla qr_codes) con estado PENDING
        const qrCode = await prisma.qrCode.create({
            data: {
                token: token,
                businessId: businessId, // Asocia el QR al negocio del usuario autenticado
                amount: amount,
                ticketNumber: ticketNumber, // Puede ser null/undefined
                expiresAt: expiresAt,
                status: QrCodeStatus.PENDING, // Estado inicial: pendiente de redimir
            },
            // Selecciona solo los campos que son relevantes para devolver al frontend del panel admin
            // (el token que se usara para generar la imagen del QR y el monto)
             select: {
                 token: true,
                 amount: true
             }
        });

        // Log en consola del servidor (para debugging/monitoreo)
        // Corregido: No acceder a qrCode.expiresAt porque no esta en el select del create result
        console.log(`QR Code generated for business ${businessId} with token ${token} for amount ${amount}.`);

        // Devuelve el token y el monto que se usaran en el frontend (panel admin) para generar la imagen del QR
        return { qrToken: qrCode.token, amount: qrCode.amount };

    } catch (error: unknown) { // Tipamos error como unknown explicitamente
        // Manejo de errores en caso de fallo al crear el registro QR en la BD
        console.error('Error generating QR code data:', error);
        // Verificar si es un error de Prisma (ej: violacion de restriccion unica si se generaran tokens duplicados, aunque uuid lo hace poco probable)
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            console.error('Prisma error generating QR code:', error.message);
            // Puedes añadir manejo especifico por codigo de error de Prisma si es necesario
        }
        // Si es un error general de JS
         if (error instanceof Error) {
             console.error('General error generating QR code:', error.message);
         }
        throw new Error('Could not generate QR code data.'); // Lanza un error generico para el controlador
    }
};

/**
 * Validates a QR token and assigns points to a customer.
 * This function is typically called from the CUSTOMER_FINAL portal upon scanning a QR.
 * It performs multiple validations (token existence/status/expiration, user role/business)
 * and updates the QrCode status and the customer's points balance atomically.
 * @param qrToken - The token scanned from the QR code.
 * @param customerUserId - The ID of the customer user redeeming the QR (from authenticated user).
 * @returns A promise that resolves with the number of points awarded.
 * @throws Error if the QR is invalid, expired, already used, or user/business logic validation fails.
 */
export const validateQrCode = async (qrToken: string, customerUserId: string): Promise<number> => {
    const now = new Date(); // Momento actual de la redencion

    try {
        // 1. Buscar el QrCode por el token proporcionado. No validamos estado aqui para dar mensajes mas especificos despues.
        // Incluimos la relacion 'business' para obtener la tasa pointsPerEuro.
        const qrCode = await prisma.qrCode.findUnique({
            where: { token: qrToken }, // Busca solo por token primero
            include: { // Incluir la relacion con Business para obtener pointsPerEuro y el ID del negocio
                business: {
                    select: { pointsPerEuro: true, id: true } // Seleccionar solo los datos necesarios del negocio
                }
            }
        });

        // Si el QR no se encuentra con el token proporcionado
        if (!qrCode) {
            console.warn(`Attempted validation of non-existent QR token: ${qrToken}`);
            throw new Error('Invalid QR code.'); // Mensaje generico si el token no existe en absoluto
        }

        // Si el QR se encontro, verificar su estado (debe ser PENDING)
        if (qrCode.status !== QrCodeStatus.PENDING) {
             console.warn(`Attempted validation of non-pending QR token: ${qrToken} (Status: ${qrCode.status})`);
             // Dar un mensaje mas especifico basado en el estado
             if (qrCode.status === QrCodeStatus.COMPLETED) {
                 throw new Error('QR code has already been used.');
             }
             if (qrCode.status === QrCodeStatus.EXPIRED) {
                  // Si ya estaba EXPIRED en la BD (ej: por un trabajo de limpieza o validacion previa)
                  throw new Error('QR code has expired.');
             }
             // Para cualquier otro estado inesperado
             throw new Error('QR code is not available for redemption.');
        }


        // 2. Verificar si el QR ha expirado (comparando la fecha de expiracion con la hora actual)
        if (isAfter(now, qrCode.expiresAt)) {
             // Si ha expirado, intentar marcarlo como EXPIRED en la BD antes de lanzar el error
             try {
                 await prisma.qrCode.update({
                     where: { id: qrCode.id }, // Actualiza por el ID del QrCode encontrado
                     data: { status: QrCodeStatus.EXPIRED } // Cambia estado a EXPIRED
                 });
             } catch (updateError: unknown) { // Tipamos error de actualizacion interna
                 // Loggear el error de actualizacion de estado si falla (no bloquea la validacion principal)
                 console.error('Failed to update QR status to EXPIRED:', updateError instanceof Error ? updateError.message : updateError);
             }
            console.warn(`Attempted validation of expired QR token: ${qrToken}. Expiration: ${qrCode.expiresAt.toISOString()}, Now: ${now.toISOString()}`);
            throw new Error('QR code has expired.'); // Lanza error indicando expiracion para el cliente
        }

        // 3. Buscar al usuario que esta intentando redimir el QR y verificar que sea un cliente final
        // Seleccionamos solo los campos necesarios (ID, puntos actuales, businessId, rol)
        const customer = await prisma.user.findUnique({
            where: { id: customerUserId, role: UserRole.CUSTOMER_FINAL }, // Busca por ID Y asegura que el rol es CUSTOMER_FINAL
             select: { id: true, points: true, businessId: true, role: true } // Selecciona campos necesarios del usuario
        });

        // Si el usuario no se encuentra O su rol no es CUSTOMER_FINAL
        if (!customer || customer.role !== UserRole.CUSTOMER_FINAL) {
             console.warn(`Attempted QR redemption by non-customer user ID: ${customerUserId}. Role: ${customer?.role || 'not found'}`);
            throw new Error('Only customer accounts can redeem QR codes.'); // Lanza error indicando que solo clientes pueden redimir
        }

        // 4. Verificar que el cliente que redime pertenece al MISMO negocio que genero el QR
        if (customer.businessId !== qrCode.businessId) {
            console.warn(`Attempted QR redemption for business ${qrCode.businessId} by customer ${customerUserId} from different business ${customer.businessId}`);
            throw new Error('QR code is not valid for this customer\'s business.'); // Lanza error si el QR no es para este negocio/cliente
        }


        // 5. Calcular los puntos a asignar basados en el monto y la tasa pointsPerEuro del negocio
        const pointsPerEuro = qrCode.business.pointsPerEuro; // Obtiene la tasa del negocio que genero el QR
        const pointsEarned = Math.floor(qrCode.amount * pointsPerEuro); // Calcula puntos (redondeando hacia abajo)

        // Validacion extra: asegurar que los puntos ganados son al menos 1 (si no, no vale la pena redimir)
        // Depende de la regla de negocio si permitimos 0 puntos o no. Si no se ganan puntos, no actualizamos nada.
        if (pointsEarned <= 0) {
             console.log(`QR token ${qrToken} redeemed, but 0 points earned for amount ${qrCode.amount} with rate ${pointsPerEuro}. No points assigned to user ${customerUserId}.`);
             // Opcional: Marcar el QR como COMPLETED de todas formas si queremos que no se pueda volver a usar aunque no se ganen puntos
             // await prisma.qrCode.update({ where: { id: qrCode.id }, data: { status: QrCodeStatus.COMPLETED, completedAt: now } });
            throw new Error('No points earned for this transaction amount.'); // Lanza error si no se ganaron puntos (configurable)
        }


        // 6. Asignar los puntos al cliente Y marcar el QR como COMPLETED.
        // ES CRUCIAL usar una transaccion de base de datos ($transaction) para que AMBAS operaciones
        // (actualizar puntos del usuario Y marcar el QR como completado) se hagan juntas o ninguna.
        // Esto previene que se asignen puntos pero el QR no se marque como usado (permitiendo reuso).
        const [updatedUser, updatedQrCodeRecord] = await prisma.$transaction([
             // Operacion 1: Actualizar los puntos del usuario
             prisma.user.update({
                 where: { id: customer.id }, // Actualiza el usuario cliente encontrado
                 data: { points: customer.points + pointsEarned }, // Suma los puntos ganados a los puntos actuales
                 // No es necesario seleccionar campos aqui a menos que la respuesta final los necesite
                 select: { id: true, points: true } // Ejemplo: si quisieramos devolver los puntos totales actualizados
             }),
             // Operacion 2: Marcar el QrCode como COMPLETED
             prisma.qrCode.update({
                 where: { id: qrCode.id }, // Actualiza el QrCode encontrado
                 data: {
                     status: QrCodeStatus.COMPLETED, // Cambia el estado a COMPLETED
                     completedAt: now, // Registra el momento exacto de la redencion
                     // redeemedById: customer.id // Futuro: si añadimos la relacion redeemedBy en schema.prisma
                 },
                 // No es necesario seleccionar campos aqui a menos que la respuesta final los necesite
                 select: { id: true, status: true, completedAt: true } // Ejemplo: confirmacion de actualizacion del QR
             })
        ]);

        // Log en consola del servidor (para monitoreo)
        // Corregido: No acceder a customer.email ya que no esta en el select
        console.log(`QR token ${qrToken} validated successfully. Assigned ${pointsEarned} points to user ${customerUserId} for business ${qrCode.businessId}. User now has ${updatedUser.points} points.`);

        // Devuelve la cantidad de puntos que se ganaron en esta redencion.
        return pointsEarned;

    } catch (error: unknown) { // Tipamos error como unknown explicitamente
        // Manejo de errores. Captura los errores lanzados por nosotros (ej: 'Invalid QR code.', 'QR code has expired.')
        // y tambien errores inesperados de base de datos o servidor.
         if (error instanceof Error) {
              // Si es un error custom que lanzamos, loggea el mensaje del error custom y relanza
              console.error('QR validation failed (custom error):', error.message);
             throw error; // Relanzar el error con el mensaje amigable para el controlador
         }
         // Si es otro tipo de error (ej: Prisma error, error de red, etc.)
         // Usa type guard para acceder a message si existe, sino muestra el error completo
        console.error('Server error during QR validation (unexpected):', error instanceof Error ? error.message : error); // Loggea el error para depuracion interna
        throw new Error('An internal server error occurred during QR validation.'); // Lanza un error generico 500 para el controlador
    }
};


// Puedes añadir mas funciones de servicio de puntos aqui en el futuro
// Por ejemplo: getQrCodeDetails (para el panel admin despues de generarlo), getCustomerPointsHistory, etc.


// End of File: backend/src/points/points.service.ts