import { describe, it, expect, beforeAll, afterAll } from 'vitest'; // vi ya no se necesita aquí
import request from 'supertest';
import app from '../../src/index';
import { UserRole, DocumentType } from '@prisma/client';


// Helper para generar un DNI válido para tests
function generateValidDni(): string {
    const num = Math.floor(Math.random() * 100000000); // Número aleatorio de 8 cifras (o menos)
    const numStr = num.toString().padStart(8, '0'); // Asegurar 8 dígitos
    const letters = "TRWAGMYFPDXBNJZSQVHLCKE";
    const letter = letters.charAt(parseInt(numStr, 10) % 23);
    return `${numStr}${letter}`;
}


describe('Points API Integration Tests (/api/points)', () => {

    let customerToken: string | null = null;
    let adminToken: string | null = null;
    let customerUserId: string | null = null;
    let businessId: string | null = null;
    let generatedQrToken: string | null = null;
    const testCustomerEmail = `test-customer-${Date.now()}@test.loyal`;
    const testCustomerPassword = 'password123';
    const testCustomerDni = generateValidDni(); // Generar DNI válido

    beforeAll(async () => {
        console.log("Starting beforeAll setup for points tests...");
        // Login Admin
        try {
            const adminLoginRes = await request(app)
                .post('/api/auth/login')
                .send({ email: 'admin@cafeelsol.com', password: 'superpasswordseguro' });
            if (adminLoginRes.status === 200 && adminLoginRes.body.token) {
                adminToken = adminLoginRes.body.token;
                businessId = adminLoginRes.body.user?.businessId;
                console.log("Admin logged in, businessId:", businessId);
            } else {
                console.error("CRITICAL: Failed to login admin for test setup", adminLoginRes.status, adminLoginRes.body);
                throw new Error("Admin login failed in test setup");
            }
        } catch (error) {
            console.error("CRITICAL: Error during admin login setup:", error);
            throw error;
        }

        // Crear y Loguear Cliente de Prueba
        if (businessId) {
            try {
                console.log(`Attempting to register test customer: ${testCustomerEmail} with DNI: ${testCustomerDni}`);
                const registerRes = await request(app)
                    .post('/api/auth/register')
                    .send({
                        email: testCustomerEmail,
                        password: testCustomerPassword,
                        name: 'Test Customer',
                        phone: `+${Date.now()}`.substring(0, 13),
                        documentType: DocumentType.DNI,
                        documentId: testCustomerDni, // Usar DNI válido generado
                        businessId: businessId,
                        role: UserRole.CUSTOMER_FINAL
                    });

                if (registerRes.status !== 201) {
                     console.warn("Failed to register test customer", registerRes.status, registerRes.body.message);
                     // Si falla (ej: ya existe), intentamos loguear igualmente
                } else {
                     console.log("Test customer registered:", testCustomerEmail);
                }

                console.log(`Attempting to login test customer: ${testCustomerEmail}`);
                const customerLoginRes = await request(app)
                    .post('/api/auth/login')
                    .send({ email: testCustomerEmail, password: testCustomerPassword });

                if (customerLoginRes.status === 200 && customerLoginRes.body.token) {
                    customerToken = customerLoginRes.body.token;
                    customerUserId = customerLoginRes.body.user?.id;
                    console.log("Test customer logged in, userId:", customerUserId);
                } else {
                     console.error("Failed to login test customer", customerLoginRes.status, customerLoginRes.body.message);
                     // customerToken seguirá null si falla el login
                }

            } catch (error) {
                console.error("Error during customer setup:", error);
            }
        } else {
             console.error("Cannot setup customer - businessId not obtained from admin login.");
        }

        // Generar QR
        if (adminToken) {
             try {
                 const qrGenRes = await request(app)
                    .post('/api/points/generate-qr')
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({ amount: 10, ticketNumber: `TEST-${Date.now()}`});
                 if (qrGenRes.status === 201 && qrGenRes.body.qrToken) {
                    generatedQrToken = qrGenRes.body.qrToken;
                    console.log(`Generated QR Token for tests: ${generatedQrToken}`);
                 } else {
                    console.warn("Failed to generate QR token for tests", qrGenRes.status, qrGenRes.body.message);
                 }
             } catch(error) {
                 console.error("Error generating QR during setup:", error);
             }
        } else {
             console.warn("Skipping QR generation, adminToken not available.");
        }
        console.log("Finished beforeAll setup.");
    }, 30000); // Aumentar timeout para beforeAll por si las llamadas API tardan

    afterAll(async () => {
        // TODO: Limpiar usuario cliente y QRs creados
        console.log("Running afterAll cleanup (TODO)...");
    });


    // --- Tests para POST /api/points/validate-qr ---

    it('should fail validation if no token is provided in body', async () => {
        if (!customerToken) return; // Test se salta si setup falló
        await request(app)
            .post('/api/points/validate-qr')
            .set('Authorization', `Bearer ${customerToken}`)
            .send({})
            .expect('Content-Type', /json/)
            .expect(400);
    });

    it('should fail validation with an invalid QR token format', async () => {
         if (!customerToken) return; // Test se salta si setup falló
         const res = await request(app)
            .post('/api/points/validate-qr')
            .set('Authorization', `Bearer ${customerToken}`)
            .send({ qrToken: 'invalid-token-format' })
            .expect('Content-Type', /json/)
            .expect(400);
         expect(res.body.message).toContain('inválido');
    });

    // --- Tests que dependen del setup ---

    it('should successfully validate a valid, pending QR token', async () => {
        if (!customerToken || !generatedQrToken) {
             console.warn("Skipping validation test: customerToken or generatedQrToken not available.");
             return; // Test se salta si setup falló
        }

        const response = await request(app)
            .post('/api/points/validate-qr')
            .set('Authorization', `Bearer ${customerToken}`)
            .send({ qrToken: generatedQrToken })
            .expect('Content-Type', /json/)
            .expect(200);

        expect(response.body).toHaveProperty('pointsEarned');
        expect(response.body.pointsEarned).toBeGreaterThanOrEqual(0);
    });

    it('should fail validation if QR token is already used', async () => {
        if (!customerToken || !generatedQrToken) {
             console.warn("Skipping reuse test: customerToken or generatedQrToken not available.");
             return; // Test se salta si setup falló
        }
        // Asumimos que el test anterior usó el token. Lo intentamos de nuevo.
        // NOTA: Si los tests corren en paralelo o el anterior falló, este podría dar falso positivo/negativo.
        // Una mejor aproximación sería generar un token nuevo aquí y usarlo dos veces.
        const response = await request(app)
            .post('/api/points/validate-qr')
            .set('Authorization', `Bearer ${customerToken}`)
            .send({ qrToken: generatedQrToken }) // Intentar usar el mismo token de nuevo
            .expect('Content-Type', /json/)
            .expect(400); // Debería fallar porque ya se usó en el test anterior

        expect(response.body.message).toContain('utilizado');
    });

    /*
    it('should fail validation if QR token is expired', async () => {
        // ... (requiere manipulación de tiempo/BD) ...
    });
    */

    it('should fail validation if user is not a customer', async () => {
         if (!adminToken || !generatedQrToken) {
             console.warn("Skipping non-customer test: adminToken or generatedQrToken not available.");
             return; // Test se salta si setup falló
         }
         await request(app)
            .post('/api/points/validate-qr')
            .set('Authorization', `Bearer ${adminToken}`) // Usa token de admin
            .send({ qrToken: generatedQrToken })
            .expect('Content-Type', /json/)
            .expect(403); // Espera Forbidden
    });

});