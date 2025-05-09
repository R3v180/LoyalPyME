// backend/src/routes/protected.routes.ts
import { Router, Request, Response } from 'express';

const router = Router();

// El middleware authenticateToken ya se aplica ANTES de que se llegue a este handler
// cuando se monta el router en index.ts con app.use('/api/profile', authenticateToken, protectedRouter);

router.get('/', (req: Request, res: Response) => {
  // --- AÑADIR LOG AQUÍ ---
  console.log('[PROTECTED ROUTE /api/profile DEBUG] req.user object before sending response:', JSON.stringify(req.user, null, 2));
  // --- FIN LOG ---

  if (!req.user) {
    console.error("[PROTECTED ROUTE /api/profile DEBUG] Error: req.user is missing in /api/profile route handler!");
    return res.status(401).json({ message: 'Authentication failed. User data not available.' });
  }
  res.json(req.user); // Esto es lo que recibe el frontend
});

export default router;