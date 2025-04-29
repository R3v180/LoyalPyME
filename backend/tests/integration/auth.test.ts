import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/index';

describe('Auth API Integration Tests', () => {

  it('POST /api/auth/login - should login successfully with valid credentials', async () => {
    const credentials = {
      email: 'admin@cafeelsol.com', // Mantenemos este email, corrígelo si es otro
      password: 'superpasswordseguro', // <-- CONTRASEÑA ACTUALIZADA
    };

    const response = await request(app)
      .post('/api/auth/login')
      .send(credentials)
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body).toBeTypeOf('object');
    expect(response.body).toHaveProperty('token');
    expect(response.body).toHaveProperty('user');
    expect(response.body.user).toBeTypeOf('object');
    expect(response.body.user.email).toBe(credentials.email);
    expect(response.body.user).not.toHaveProperty('password');
    expect(response.body.user.role).toBe('BUSINESS_ADMIN');
  });

  it('POST /api/auth/login - should fail with incorrect password', async () => {
    const credentials = {
      email: 'admin@cafeelsol.com', // Usa el email correcto aquí también
      password: 'password123',     // Una contraseña incorrecta diferente a la buena
    };
    const response = await request(app)
      .post('/api/auth/login')
      .send(credentials)
      .expect('Content-Type', /json/)
      .expect(401);
    expect(response.body.message).toContain('inválidas');
  });

   it('POST /api/auth/login - should fail with non-existent user', async () => {
    const credentials = {
      email: `no-existe-${Date.now()}@example.com`,
      password: 'somepassword',
    };
    const response = await request(app)
      .post('/api/auth/login')
      .send(credentials)
      .expect('Content-Type', /json/)
      .expect(401);
    expect(response.body.message).toContain('inválidas');
  });

   it('POST /api/auth/login - should fail if email or password is missing', async () => {
     await request(app)
      .post('/api/auth/login')
      .send({ password: 'superpasswordseguro' }) // Contraseña correcta pero sin email
      .expect('Content-Type', /json/)
      .expect(400);

     await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@cafeelsol.com' }) // Email correcto pero sin contraseña
      .expect('Content-Type', /json/)
      .expect(400);
   });

});