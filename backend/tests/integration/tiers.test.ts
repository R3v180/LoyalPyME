import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../src/index';
import { Tier } from '@prisma/client';

describe('Tiers API Integration Tests (/api/tiers)', () => {

    let adminToken: string | null = null;
    // --- CAMBIO: Usar array para TODOS los IDs creados ---
    const createdTierIds: string[] = [];
    // --- FIN CAMBIO ---
    let initialTierData: Partial<Tier> = {}; // Para comparar después de actualizar


    // Setup (sin cambios)
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
                throw new Error("Admin login failed in tiers test setup");
            }
        } catch (error) {
            console.error("CRITICAL: Error during admin login setup for tiers:", error);
            throw error;
        }
        console.log("Finished beforeAll setup for tiers tests.");
    }, 20000);

    // --- CAMBIO: Limpieza afterAll mejorada ---
    afterAll(async () => {
        if (adminToken && createdTierIds.length > 0) {
             console.log(`Running afterAll cleanup: deleting ${createdTierIds.length} created tiers...`);
             // Borrar en orden inverso por si acaso
             for (let i = createdTierIds.length - 1; i >= 0; i--) {
                 const tierId = createdTierIds[i];
                 try {
                     // Usamos un try/catch individual para que un fallo no detenga la limpieza de otros
                     await request(app)
                         .delete(`/api/tiers/tiers/${tierId}`)
                         .set('Authorization', `Bearer ${adminToken}`)
                         .timeout(2000); // Timeout corto para cleanup
                     console.log(`Tier ${tierId} deleted during cleanup.`);
                 } catch (error: any) {
                     // Solo logueamos si falla, no detenemos
                     console.warn(`Warning during afterAll cleanup, could not delete tier ${tierId}: Status ${error?.status || 'unknown'}`);
                 }
             }
             createdTierIds.length = 0; // Vaciar array para futuras ejecuciones si el test runner reutiliza contexto
        } else {
            console.log("afterAll cleanup: No tiers to delete or no admin token.");
        }
    });
    // --- FIN CAMBIO ---


    // --- Tests POST (Modificado para añadir ID al array) ---
    it('POST /api/tiers/tiers - should fail to create tier without auth token', async () => { /* sin cambios */
        await request(app).post('/api/tiers/tiers').send({ name: 'Fail No Auth', level: 1, minValue: 100 }).expect(401);
    });
    it('POST /api/tiers/tiers - should fail to create tier with missing name', async () => { /* sin cambios */
        if (!adminToken) throw new Error("Admin token not available");
        await request(app).post('/api/tiers/tiers').set('Authorization', `Bearer ${adminToken}`).send({ level: 1, minValue: 100 }).expect(400);
    });
     it('POST /api/tiers/tiers - should fail to create tier with invalid level (negative)', async () => { /* sin cambios */
        if (!adminToken) throw new Error("Admin token not available");
        await request(app).post('/api/tiers/tiers').set('Authorization', `Bearer ${adminToken}`).send({ name: 'Fail Level', level: -1, minValue: 100 }).expect(400);
    });
     it('POST /api/tiers/tiers - should fail to create tier with invalid minValue (negative)', async () => { /* sin cambios */
        if (!adminToken) throw new Error("Admin token not available");
        await request(app).post('/api/tiers/tiers').set('Authorization', `Bearer ${adminToken}`).send({ name: 'Fail MinValue', level: 1, minValue: -100 }).expect(400);
    });
    it('POST /api/tiers/tiers - should create a new tier successfully', async () => { /* MODIFICADO */
        if (!adminToken) throw new Error("Admin token not available");
        const uniqueLevel = Math.floor(Date.now() / 1000);
        initialTierData = { name: `Test Tier ${uniqueLevel}`, level: uniqueLevel, minValue: uniqueLevel * 100, description: 'Tier for testing', isActive: true };
        const response = await request(app).post('/api/tiers/tiers').set('Authorization', `Bearer ${adminToken}`).send(initialTierData).expect(201);
        expect(response.body.id).toBeTypeOf('string');
        expect(response.body.name).toBe(initialTierData.name);
        expect(response.body.isActive).toBe(initialTierData.isActive);
        // --- CAMBIO: Añadir ID al array para limpieza ---
        createdTierIds.push(response.body.id);
        // --- FIN CAMBIO ---
    });
     it('POST /api/tiers/tiers - should fail to create tier with duplicate level', async () => { /* sin cambios */
        if (!adminToken || createdTierIds.length === 0) throw new Error("Prerequisites not met - need created tier");
         const getRes = await request(app).get(`/api/tiers/tiers/${createdTierIds[0]}`).set('Authorization', `Bearer ${adminToken}`);
         const levelToDuplicate = getRes.body.level;
        await request(app).post('/api/tiers/tiers').set('Authorization', `Bearer ${adminToken}`).send({ name: 'Duplicate Level Tier', level: levelToDuplicate, minValue: 50 }).expect(409);
    });

    // --- Tests GET (Sin cambios) ---
    it('GET /api/tiers - should retrieve a list of tiers', async () => { /* sin cambios */
         if (!adminToken) throw new Error("Admin token not available");
         const response = await request(app).get('/api/tiers').set('Authorization', `Bearer ${adminToken}`).expect(200);
         expect(Array.isArray(response.body)).toBe(true);
         if (createdTierIds.length > 0) { expect(response.body.some((t: Tier) => t.id === createdTierIds[0])).toBe(true); }
    });
    it('GET /api/tiers/tiers/:tierId - should retrieve a specific tier', async () => { /* sin cambios */
        if (!adminToken || createdTierIds.length === 0) throw new Error("Prerequisites not met");
        const tierIdToGet = createdTierIds[0];
        const response = await request(app).get(`/api/tiers/tiers/${tierIdToGet}`).set('Authorization', `Bearer ${adminToken}`).expect(200);
        expect(response.body.id).toBe(tierIdToGet);
        expect(response.body.name).toBe(initialTierData.name);
    });
     it('GET /api/tiers/tiers/:tierId - should return 404 for non-existent tier', async () => { /* sin cambios */
        if (!adminToken) throw new Error("Admin token not available");
        const nonExistentId = '00000000-0000-0000-0000-000000000000';
        await request(app).get(`/api/tiers/tiers/${nonExistentId}`).set('Authorization', `Bearer ${adminToken}`).expect(404);
    });

   // --- Tests PUT/PATCH (Sin cambios) ---
    it('PUT /api/tiers/tiers/:tierId - should update a tier completely', async () => { /* sin cambios */
       if (!adminToken || createdTierIds.length === 0) throw new Error("Prerequisites not met");
       const tierIdToUpdate = createdTierIds[0];
       const updateData = { name: `Updated Tier ${Date.now()}`, level: initialTierData.level! + 1, minValue: initialTierData.minValue! + 50, description: 'Updated', isActive: false };
       const response = await request(app).put(`/api/tiers/tiers/${tierIdToUpdate}`).set('Authorization', `Bearer ${adminToken}`).send(updateData).expect(200);
       expect(response.body.name).toBe(updateData.name);
       expect(response.body.isActive).toBe(updateData.isActive);
       initialTierData = response.body;
    });
    it('PATCH /api/tiers/tiers/:tierId - should partially update a tier (toggle isActive)', async () => { /* sin cambios */
       if (!adminToken || createdTierIds.length === 0) throw new Error("Prerequisites not met");
       const tierIdToPatch = createdTierIds[0];
       const currentIsActive = initialTierData.isActive;
       const patchData = { isActive: !currentIsActive };
       const response = await request(app).patch(`/api/tiers/tiers/${tierIdToPatch}`).set('Authorization', `Bearer ${adminToken}`).send(patchData).expect(200);
       expect(response.body.isActive).toBe(patchData.isActive);
       expect(response.body.name).toBe(initialTierData.name);
    });

    // --- Tests DELETE (Modificado para añadir ID al array) ---
    it('DELETE /api/tiers/tiers/:tierId - should delete a tier', async () => { /* MODIFICADO */
        if (!adminToken) throw new Error("Admin token not available");
         const uniqueLevel = Math.floor(Date.now() / 1000) + 2000;
         const tierData = { name: `To Delete ${uniqueLevel}`, level: uniqueLevel, minValue: 1 };
         const createRes = await request(app).post('/api/tiers/tiers').set('Authorization', `Bearer ${adminToken}`).send(tierData).expect(201);
         const idToDelete = createRes.body.id;
         // --- CAMBIO: Añadir ID temporal al array ---
         createdTierIds.push(idToDelete); // Lo añadimos para que afterAll lo limpie si algo falla
         // --- FIN CAMBIO ---
         expect(idToDelete).toBeTypeOf('string');

        await request(app).delete(`/api/tiers/tiers/${idToDelete}`).set('Authorization', `Bearer ${adminToken}`).expect(200);
        await request(app).get(`/api/tiers/tiers/${idToDelete}`).set('Authorization', `Bearer ${adminToken}`).expect(404);

         // Si llegamos aquí, el borrado tuvo éxito, podemos quitarlo del array para que afterAll no lo intente de nuevo (opcional)
         const indexToRemove = createdTierIds.indexOf(idToDelete);
         if (indexToRemove > -1) {
             createdTierIds.splice(indexToRemove, 1);
         }
    });
     it('DELETE /api/tiers/tiers/:tierId - should return 404 if tier to delete not found', async () => { /* sin cambios */
         if (!adminToken) throw new Error("Admin token not available");
         const nonExistentId = '00000000-0000-0000-0000-000000000000';
         await request(app).delete(`/api/tiers/tiers/${nonExistentId}`).set('Authorization', `Bearer ${adminToken}`).expect(404);
     });

});