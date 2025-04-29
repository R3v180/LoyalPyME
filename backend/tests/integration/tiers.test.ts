import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../src/index';
import { Reward, Tier } from '@prisma/client'; // Añadido Tier aquí

describe('Tiers API Integration Tests (/api/tiers)', () => {

    let adminToken: string | null = null;
    let createdTierId: string | null = null; // Para guardar el ID y borrarlo después
    let initialTierData: Partial<Tier> = {}; // Para comparar después de actualizar


    // Setup: Obtener token de admin
    beforeAll(async () => {
        console.log("Starting beforeAll setup for tiers tests...");
        try {
            const adminLoginRes = await request(app)
                .post('/api/auth/login')
                .send({ email: 'admin@cafeelsol.com', password: 'superpasswordseguro' });

            if (adminLoginRes.status === 200 && adminLoginRes.body.token) {
                adminToken = adminLoginRes.body.token;
                console.log("Admin logged in successfully for tiers tests.");
            } else {
                console.error("CRITICAL: Failed to login admin for tiers test setup", adminLoginRes.status, adminLoginRes.body);
                throw new Error("Admin login failed in tiers test setup");
            }
        } catch (error) {
            console.error("CRITICAL: Error during admin login setup for tiers:", error);
            throw error;
        }
        console.log("Finished beforeAll setup for tiers tests.");
    }, 20000);

    // Limpieza: Borrar recompensa creada (si existe)
    afterAll(async () => {
        if (createdTierId && adminToken) {
            console.log(`Running afterAll cleanup: deleting tier ${createdTierId}...`);
            try {
                await request(app)
                    .delete(`/api/tiers/tiers/${createdTierId}`) // Corregida ruta para tiers
                    .set('Authorization', `Bearer ${adminToken}`);
                console.log(`Tier ${createdTierId} deleted successfully.`);
            } catch (error) {
                console.warn(`Warning during afterAll cleanup, could not delete tier ${createdTierId}:`, error);
            }
        } else {
            console.log("afterAll cleanup: No tier ID or admin token to delete.");
        }
    });


    // --- Tests ---

    it('POST /api/tiers/tiers - should fail to create tier without auth token', async () => {
        await request(app)
            .post('/api/tiers/tiers') // Ruta correcta
            .send({ name: 'Fail Tier No Auth', level: 1, minValue: 100 })
            .expect(401);
    });

    it('POST /api/tiers/tiers - should fail to create tier with missing name', async () => {
        if (!adminToken) throw new Error("Admin token not available");
        await request(app)
            .post('/api/tiers/tiers') // Ruta correcta
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ level: 1, minValue: 100 })
            .expect('Content-Type', /json/)
            .expect(400);
    });

     it('POST /api/tiers/tiers - should fail to create tier with invalid level (negative)', async () => {
        if (!adminToken) throw new Error("Admin token not available");
        await request(app)
            .post('/api/tiers/tiers') // Ruta correcta
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ name: 'Fail Level', level: -1, minValue: 100 })
            .expect('Content-Type', /json/)
            .expect(400); // Esperamos 400 por validación del controller
    });

     it('POST /api/tiers/tiers - should fail to create tier with invalid minValue (negative)', async () => {
        if (!adminToken) throw new Error("Admin token not available");
        await request(app)
            .post('/api/tiers/tiers') // Ruta correcta
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ name: 'Fail MinValue', level: 1, minValue: -100 })
            .expect('Content-Type', /json/)
            .expect(400); // Esperamos 400 por validación del controller
    });

    it('POST /api/tiers/tiers - should create a new tier successfully', async () => {
        if (!adminToken) throw new Error("Admin token not available");
        const uniqueLevel = Math.floor(Date.now() / 1000);
        initialTierData = { // Guardar datos iniciales
            name: `Test Tier ${uniqueLevel}`,
            level: uniqueLevel,
            minValue: uniqueLevel * 100,
            description: 'Tier for testing',
            isActive: true
        };
        const response = await request(app)
            .post('/api/tiers/tiers') // Ruta correcta
            .set('Authorization', `Bearer ${adminToken}`)
            .send(initialTierData)
            .expect('Content-Type', /json/)
            .expect(201);

        expect(response.body.id).toBeTypeOf('string');
        expect(response.body.name).toBe(initialTierData.name);
        expect(response.body.level).toBe(initialTierData.level);
        expect(response.body.minValue).toBe(initialTierData.minValue);
        expect(response.body.isActive).toBe(initialTierData.isActive);
        createdTierId = response.body.id; // Guardar ID
    });

     it('POST /api/tiers/tiers - should fail to create tier with duplicate level', async () => {
        if (!adminToken || !createdTierId) throw new Error("Prerequisites not met - need created tier");
        // Obtener nivel del tier recién creado para intentar duplicarlo
         const getRes = await request(app).get(`/api/tiers/tiers/${createdTierId}`).set('Authorization', `Bearer ${adminToken}`);
         const levelToDuplicate = getRes.body.level;

        await request(app)
            .post('/api/tiers/tiers') // Ruta correcta
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ name: 'Duplicate Level Tier', level: levelToDuplicate, minValue: 50 })
            .expect('Content-Type', /json/)
            .expect(409); // Espera Conflicto por validación en controller/servicio
    });

    it('GET /api/tiers - should retrieve a list of tiers', async () => {
        if (!adminToken) throw new Error("Admin token not available");
        const response = await request(app)
            .get('/api/tiers') // Ruta correcta
            .set('Authorization', `Bearer ${adminToken}`)
            .expect('Content-Type', /json/)
            .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
        // Verificar que contiene al menos un elemento si acabamos de crear uno
        if (createdTierId) {
             expect(response.body.length).toBeGreaterThan(0);
             const created = response.body.find((t: Tier) => t.id === createdTierId);
             expect(created).toBeDefined();
         }
    });

    it('GET /api/tiers/tiers/:tierId - should retrieve a specific tier', async () => {
        if (!adminToken || !createdTierId) throw new Error("Prerequisites not met");
        const response = await request(app)
            .get(`/api/tiers/tiers/${createdTierId}`) // Ruta correcta
            .set('Authorization', `Bearer ${adminToken}`)
            .expect('Content-Type', /json/)
            .expect(200);
        expect(response.body.id).toBe(createdTierId);
        expect(response.body.name).toBe(initialTierData.name); // Compara con datos guardados
    });

     it('GET /api/tiers/tiers/:tierId - should return 404 for non-existent tier', async () => {
        if (!adminToken) throw new Error("Admin token not available");
        const nonExistentId = '00000000-0000-0000-0000-000000000000';
        await request(app)
            .get(`/api/tiers/tiers/${nonExistentId}`) // Ruta correcta
            .set('Authorization', `Bearer ${adminToken}`)
            .expect('Content-Type', /json/)
            .expect(404);
    });

     it('PUT /api/tiers/tiers/:tierId - should update a tier completely', async () => {
       if (!adminToken || !createdTierId) throw new Error("Prerequisites not met");
       const updateData = { name: `Updated Tier ${Date.now()}`, level: initialTierData.level! + 1, minValue: initialTierData.minValue! + 50, description: 'Updated', isActive: false };
       const response = await request(app)
          .put(`/api/tiers/tiers/${createdTierId}`) // Ruta correcta
          .set('Authorization', `Bearer ${adminToken}`)
          .send(updateData)
          .expect('Content-Type', /json/)
          .expect(200);
       expect(response.body.name).toBe(updateData.name);
       expect(response.body.level).toBe(updateData.level);
       expect(response.body.minValue).toBe(updateData.minValue);
       expect(response.body.isActive).toBe(updateData.isActive);
       initialTierData = response.body; // Actualizar para el siguiente test
    });

    it('PATCH /api/tiers/tiers/:tierId - should partially update a tier (toggle isActive)', async () => {
       if (!adminToken || !createdTierId) throw new Error("Prerequisites not met");
       const currentIsActive = initialTierData.isActive;
       const patchData = { isActive: !currentIsActive };
       const response = await request(app)
          .patch(`/api/tiers/tiers/${createdTierId}`) // Ruta correcta
          .set('Authorization', `Bearer ${adminToken}`)
          .send(patchData)
          .expect('Content-Type', /json/)
          .expect(200);
       expect(response.body.isActive).toBe(patchData.isActive);
       expect(response.body.name).toBe(initialTierData.name); // No debe cambiar
    });

    // Test DELETE básico (opcional ya que afterAll limpia)
    it('DELETE /api/tiers/tiers/:tierId - should delete a tier', async () => {
        if (!adminToken) throw new Error("Admin token not available");
        // Crear un tier solo para este test
         const uniqueLevel = Math.floor(Date.now() / 1000) + 2000;
         const tierData = { name: `To Delete ${uniqueLevel}`, level: uniqueLevel, minValue: 1 };
         const createRes = await request(app).post('/api/tiers/tiers').set('Authorization', `Bearer ${adminToken}`).send(tierData).expect(201);
         const idToDelete = createRes.body.id;

        // Borrarlo
        await request(app)
            .delete(`/api/tiers/tiers/${idToDelete}`) // Ruta correcta
            .set('Authorization', `Bearer ${adminToken}`)
            .expect(200); // O 204

        // Verificar que ya no existe
         await request(app)
            .get(`/api/tiers/tiers/${idToDelete}`) // Ruta correcta
            .set('Authorization', `Bearer ${adminToken}`)
            .expect(404);
    });


    it('DELETE /api/tiers/tiers/:tierId - should return 404 if tier to delete not found', async () => {
         if (!adminToken) throw new Error("Admin token not available");
         const nonExistentId = '00000000-0000-0000-0000-000000000000';
         await request(app)
             .delete(`/api/tiers/tiers/${nonExistentId}`) // Ruta correcta
             .set('Authorization', `Bearer ${adminToken}`)
             .expect('Content-Type', /json/)
             .expect(404);
     });

});