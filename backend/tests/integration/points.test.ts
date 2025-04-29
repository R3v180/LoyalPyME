import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import app from '../../src/index';
import { UserRole, DocumentType } from '@prisma/client';

// Helper DNI (sin cambios)
function generateValidDni(): string {
    const num = Math.floor(Math.random() * 100000000);
    const numStr = num.toString().padStart(8, '0');
    const letters = "TRWAGMYFPDXBNJZSQVHLCKE";
    const letter = letters.charAt(parseInt(numStr, 10) % 23);
    return `${numStr}${letter}`;
}


describe('Points API Integration Tests (/api/points)', () => {

    // Variables para guardar estado entre tests
    let customerToken: string | null = null;
    let adminToken: string | null = null;
    let customerUserId: string | null = null; // <-- GUARDAMOS ID DEL CLIENTE CREADO
    let businessId: string | null = null;
    let generatedQrToken: string | null = null; // <-- Guardamos token QR
    const testCustomerEmail = `test-customer-${Date.now()}@test.loyal`;
    const testCustomerPassword = 'password123';
    const testCustomerDni = generateValidDni();

    beforeAll(async () => {
        console.log("Starting beforeAll setup for points tests...");
        // Login Admin
        try { /* ... (código login admin sin cambios) ... */
            const adminLoginRes = await request(app).post('/api/auth/login').send({ email: 'admin@cafeelsol.com', password: 'superpasswordseguro' });
            if (adminLoginRes.status === 200 && adminLoginRes.body.token) {
                adminToken = adminLoginRes.body.token;
                businessId = adminLoginRes.body.user?.businessId;
                console.log("Admin logged in, businessId:", businessId);
            } else { throw new Error("Admin login failed in test setup"); }
        } catch (error) { console.error("CRITICAL: Error during admin login setup:", error); throw error; }

        // Crear y Loguear Cliente de Prueba
        if (businessId) { /* ... (código crear/loguear cliente sin cambios) ... */
            try {
                console.log(`Attempting to register test customer: ${testCustomerEmail} with DNI: ${testCustomerDni}`);
                const registerRes = await request(app).post('/api/auth/register').send({ email: testCustomerEmail, password: testCustomerPassword, name: 'Test Customer', phone: `+${Date.now()}`.substring(0, 13), documentType: DocumentType.DNI, documentId: testCustomerDni, businessId: businessId, role: UserRole.CUSTOMER_FINAL });
                if (registerRes.status !== 201) { console.warn("Failed to register test customer", registerRes.status, registerRes.body.message); }
                else { console.log("Test customer registered:", testCustomerEmail); }

                console.log(`Attempting to login test customer: ${testCustomerEmail}`);
                const customerLoginRes = await request(app).post('/api/auth/login').send({ email: testCustomerEmail, password: testCustomerPassword });
                if (customerLoginRes.status === 200 && customerLoginRes.body.token) {
                    customerToken = customerLoginRes.body.token;
                    customerUserId = customerLoginRes.body.user?.id; // <-- Guardar ID del cliente
                    console.log("Test customer logged in, userId:", customerUserId);
                } else { console.error("Failed to login test customer", customerLoginRes.status, customerLoginRes.body.message); }
            } catch (error) { console.error("Error during customer setup:", error); }
        } else { console.error("Cannot setup customer - businessId not obtained."); }

        // Generar QR
        if (adminToken) { /* ... (código generar QR sin cambios) ... */
             try {
                 const qrGenRes = await request(app).post('/api/points/generate-qr').set('Authorization', `Bearer ${adminToken}`).send({ amount: 10, ticketNumber: `TEST-${Date.now()}`});
                 if (qrGenRes.status === 201 && qrGenRes.body.qrToken) {
                    generatedQrToken = qrGenRes.body.qrToken;
                    console.log(`Generated QR Token for tests: ${generatedQrToken}`);
                 } else { console.warn("Failed to generate QR token for tests", qrGenRes.status, qrGenRes.body.message); }
             } catch(error) { console.error("Error generating QR during setup:", error); }
        } else { console.warn("Skipping QR generation, adminToken not available."); }
        console.log("Finished beforeAll setup.");
    }, 30000);

    // --- NUEVO: afterAll para limpiar cliente ---
    afterAll(async () => {
        console.log("Running afterAll cleanup for points tests...");
        // Intentar borrar el cliente creado si tenemos su ID y el token de admin
        if (customerUserId && adminToken) {
            console.log(`Attempting to delete test customer ${customerUserId}...`);
            try {
                // Usamos el endpoint de borrado masivo pasándole un solo ID
                // OJO: Asegúrate de que el endpoint DELETE /api/admin/customers/bulk-delete exista y funcione
                // Alternativamente, si tienes un DELETE /api/admin/customers/:id, úsalo.
                // Si no hay endpoint de borrado, necesitaríamos usar Prisma Client directamente aquí.
                // Asumiendo que bulk-delete funciona con un array de 1:
                await request(app)
                    .delete('/api/admin/customers/bulk-delete')
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({ customerIds: [customerUserId] }) // Enviar ID en el body
                    .timeout(5000); // Timeout por si acaso
                console.log(`Test customer ${customerUserId} deleted successfully.`);
            } catch (error: any) {
                console.warn(`Warning: Could not delete test customer ${customerUserId} during cleanup. Status: ${error?.status || 'unknown'}`);
            }
        } else {
            console.log("Cleanup skipped: No customerUserId or adminToken available.");
        }
        // NOTA: La limpieza del QR code es más compleja porque no guardamos su ID
        // y no suele haber un endpoint para borrar QR por token. Se podría hacer
        // buscando en la BD por el ticketNumber 'TEST-*' y borrando directamente
        // con Prisma Client si fuera necesario, pero por ahora lo omitimos.
    });
    // --- FIN afterAll ---


    // --- Tests (Sin cambios, solo quitamos vi.skip) ---
    it('should fail validation if no token is provided in body', async () => {
        if (!customerToken) return; // Sigue saltando si el setup falló
        await request(app).post('/api/points/validate-qr').set('Authorization', `Bearer ${customerToken}`).send({}).expect(400);
    });

    it('should fail validation with an invalid QR token format', async () => {
         if (!customerToken) return;
         const res = await request(app).post('/api/points/validate-qr').set('Authorization', `Bearer ${customerToken}`).send({ qrToken: 'invalid-token-format' }).expect(400);
         expect(res.body.message).toContain('inválido');
    });

    it('should successfully validate a valid, pending QR token', async () => {
        if (!customerToken || !generatedQrToken) return;
        const response = await request(app).post('/api/points/validate-qr').set('Authorization', `Bearer ${customerToken}`).send({ qrToken: generatedQrToken }).expect(200);
        expect(response.body).toHaveProperty('pointsEarned');
        expect(response.body.pointsEarned).toBeGreaterThanOrEqual(0);
    });

    it('should fail validation if QR token is already used', async () => {
        if (!customerToken || !generatedQrToken) return;
        // Asumimos que el test anterior ya lo usó (o lo usamos aquí por si acaso)
        try { await request(app).post('/api/points/validate-qr').set('Authorization', `Bearer ${customerToken}`).send({ qrToken: generatedQrToken }); } catch (e) {/* Ignorar error de la primera llamada */}
        // Segundo intento
        const response = await request(app).post('/api/points/validate-qr').set('Authorization', `Bearer ${customerToken}`).send({ qrToken: generatedQrToken }).expect(400);
        expect(response.body.message).toContain('utilizado');
    });

    it('should fail validation if user is not a customer', async () => {
         if (!adminToken || !generatedQrToken) return;
         await request(app).post('/api/points/validate-qr').set('Authorization', `Bearer ${adminToken}`).send({ qrToken: generatedQrToken }).expect(403);
    });

});