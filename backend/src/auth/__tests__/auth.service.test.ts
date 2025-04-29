import { describe, it, expect } from 'vitest';
import { hashPassword, comparePassword } from '../auth.service'; // Ajusta ruta si auth.service no está en el nivel superior

describe('Auth Service Helpers', () => {
  it('should hash a password correctly', async () => {
    const plainPassword = 'password123';
    const hashedPassword = await hashPassword(plainPassword);

    expect(hashedPassword).toBeTypeOf('string');
    expect(hashedPassword).not.toBe(plainPassword);
    expect(hashedPassword.length).toBeGreaterThan(50);
  });

  it('should compare a correct password successfully', async () => {
    const plainPassword = 'password123';
    const hashedPassword = await hashPassword(plainPassword);
    const isMatch = await comparePassword(plainPassword, hashedPassword);

    expect(isMatch).toBe(true);
  });

  it('should fail comparing an incorrect password', async () => {
    const plainPassword = 'password123';
    const wrongPassword = 'password456';
    const hashedPassword = await hashPassword(plainPassword);
    const isMatch = await comparePassword(wrongPassword, hashedPassword);

    expect(isMatch).toBe(false);
  });
});