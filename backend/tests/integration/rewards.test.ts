import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../src/index';
import { Reward } from '@prisma/client';

describe('Rewards API Integration Tests (/api/rewards)', () => {

    let adminToken: string | null = null;
    let mainTestRewardId: string | null = null; // Reward creada en el test POST y usada en GET/PUT/PATCH
    let rewardToDeleteId: string | null = null; // Reward creada específicamente para el test DELETE

    beforeAll(async () => {
        console.log("Starting beforeAll setup for rewards tests...");
        try {
            const adminLoginRes = await request(app)
                .post('/api/auth/login')
                .send({ email: 'admin@cafeelsol.com', password: 'superpasswordseguro' });
            if (adminLoginRes.status === 200 && adminLoginRes.body.token) {
                adminToken = adminLoginRes.body.token;
                console.log("Admin logged in successfully for rewards tests.");
            } else {
                throw new Error("Admin login failed in rewards test setup");
            }
        } catch (error) {
            console.error("CRITICAL: Error during admin login setup for rewards:", error);
            throw error;
        }
        console.log("Finished beforeAll setup for rewards tests.");
    }, 20000);

    afterAll(async () => {
        // Limpiar la recompensa principal si se creó
        if (mainTestRewardId && adminToken) {
            console.log(`Running afterAll cleanup: deleting main reward ${mainTestRewardId}...`);
            try {
                await request(app).delete(`/api/rewards/${mainTestRewardId}`).set('Authorization', `Bearer ${adminToken}`);
                console.log(`Main reward ${mainTestRewardId} deleted successfully.`);
            } catch (error) {
                console.warn(`Warning during afterAll cleanup, could not delete main reward ${mainTestRewardId}:`, error);
            }
        }
        // Limpiar la recompensa del test DELETE si por alguna razón no se borró en su test
        if (rewardToDeleteId && adminToken) {
             console.log(`Running afterAll cleanup: attempting to delete leftover DELETE test reward ${rewardToDeleteId}...`);
             try {
                await request(app).delete(`/api/rewards/${rewardToDeleteId}`).set('Authorization', `Bearer ${adminToken}`);
                console.log(`DELETE test reward ${rewardToDeleteId} deleted successfully.`);
             } catch (error) {
                // Silenciar error aquí, es solo una limpieza extra
             }
        }
    });


    // --- Tests POST ---
    it('POST /api/rewards - should fail to create reward without auth token', async () => {
        await request(app).post('/api/rewards').send({ name: 'Fail No Auth', pointsCost: 10 }).expect(401);
    });
    it('POST /api/rewards - should fail to create reward with missing name', async () => {
        if (!adminToken) throw new Error("Admin token not available");
        await request(app).post('/api/rewards').set('Authorization', `Bearer ${adminToken}`).send({ pointsCost: 50 }).expect(400);
    });
     it('POST /api/rewards - should fail to create reward with invalid pointsCost', async () => {
        if (!adminToken) throw new Error("Admin token not available");
        await request(app).post('/api/rewards').set('Authorization', `Bearer ${adminToken}`).send({ name: 'Fail Points', pointsCost: -10 }).expect(400);
    });
    it('POST /api/rewards - should create a new reward successfully', async () => {
        if (!adminToken) throw new Error("Admin token not available");
        const rewardData = { name: `Test ${Date.now()}`, description: 'Desc', pointsCost: 150 };
        const response = await request(app).post('/api/rewards').set('Authorization', `Bearer ${adminToken}`).send(rewardData).expect(201);
        expect(response.body.id).toBeTypeOf('string');
        expect(response.body.name).toBe(rewardData.name);
        expect(response.body.isActive).toBe(true);
        mainTestRewardId = response.body.id; // Guardar ID para otros tests
    });

    // --- Tests GET ---
    it('GET /api/rewards - should retrieve a list of rewards', async () => {
         if (!adminToken) throw new Error("Admin token not available");
         const response = await request(app).get('/api/rewards').set('Authorization', `Bearer ${adminToken}`).expect(200);
         expect(Array.isArray(response.body)).toBe(true);
         if (mainTestRewardId) { // Verificar que la creada existe
             expect(response.body.some((r: Reward) => r.id === mainTestRewardId)).toBe(true);
         }
    });
     it('GET /api/rewards - should fail to get rewards without auth token', async () => {
        await request(app).get('/api/rewards').expect(401);
    });
    it('GET /api/rewards/:id - should retrieve a specific reward', async () => {
        if (!adminToken || !mainTestRewardId) throw new Error("Prerequisites not met");
        const response = await request(app).get(`/api/rewards/${mainTestRewardId}`).set('Authorization', `Bearer ${adminToken}`).expect(200);
        expect(response.body.id).toBe(mainTestRewardId);
    });
   it('GET /api/rewards/:id - should return 404 for non-existent reward', async () => {
       if (!adminToken) throw new Error("Admin token not available");
       const nonExistentId = '00000000-0000-0000-0000-000000000000';
       await request(app).get(`/api/rewards/${nonExistentId}`).set('Authorization', `Bearer ${adminToken}`).expect(404);
   });

   // --- Tests PUT/PATCH ---
    it('PUT /api/rewards/:id - should update a reward completely', async () => {
       if (!adminToken || !mainTestRewardId) throw new Error("Prerequisites not met");
       const updateData = { name: `Updated ${Date.now()}`, description: 'Upd Desc', pointsCost: 250, isActive: false };
       const response = await request(app).put(`/api/rewards/${mainTestRewardId}`).set('Authorization', `Bearer ${adminToken}`).send(updateData).expect(200);
       expect(response.body.name).toBe(updateData.name);
       expect(response.body.pointsCost).toBe(updateData.pointsCost);
       expect(response.body.isActive).toBe(updateData.isActive);
    });
    it('PATCH /api/rewards/:id - should partially update a reward (toggle isActive)', async () => {
       if (!adminToken || !mainTestRewardId) throw new Error("Prerequisites not met");
       const currentState = await request(app).get(`/api/rewards/${mainTestRewardId}`).set('Authorization', `Bearer ${adminToken}`);
       const currentIsActive = currentState.body.isActive;
       const response = await request(app).patch(`/api/rewards/${mainTestRewardId}`).set('Authorization', `Bearer ${adminToken}`).send({ isActive: !currentIsActive }).expect(200);
       expect(response.body.isActive).toBe(!currentIsActive);
    });

    // --- Tests DELETE ---
    it('DELETE /api/rewards/:id - should delete a reward', async () => {
        if (!adminToken) throw new Error("Admin token not available");
        // 1. Crear una recompensa específicamente para este test
        const rewardName = `To Delete ${Date.now()}`;
        const createRes = await request(app).post('/api/rewards').set('Authorization', `Bearer ${adminToken}`).send({ name: rewardName, pointsCost: 10 }).expect(201);
        rewardToDeleteId = createRes.body.id; // Guardar ID para posible limpieza en afterAll si falla
        expect(rewardToDeleteId).toBeTypeOf('string');

        // 2. Borrarla
        await request(app)
            .delete(`/api/rewards/${rewardToDeleteId}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .expect(200); // O 204 si no devuelve cuerpo

        // 3. Verificar que ya no existe (GET debe dar 404)
        await request(app)
            .get(`/api/rewards/${rewardToDeleteId}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .expect(404);

        rewardToDeleteId = null; // Indicar que se borró con éxito
    });

     it('DELETE /api/rewards/:id - should return 404 if reward to delete not found', async () => {
         if (!adminToken) throw new Error("Admin token not available");
         const nonExistentId = '00000000-0000-0000-0000-000000000000';
         await request(app)
             .delete(`/api/rewards/${nonExistentId}`)
             .set('Authorization', `Bearer ${adminToken}`)
             .expect('Content-Type', /json/) // El servicio devuelve JSON para 404
             .expect(404);
     });

    // Test 409 (conflicto) sigue pendiente de setup más complejo
    /*
     it('DELETE /api/rewards/:id - should return 409 if reward is in use', async () => { ... });
    */

});