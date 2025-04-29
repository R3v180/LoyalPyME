// filename: backend/src/index.ts
// Version: 1.4.0 (Export app, conditionally listen)

import express, { Express, Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { UserRole } from '@prisma/client';

// Middleware
import { authenticateToken } from './middleware/auth.middleware';
import { checkRole } from './middleware/role.middleware';

// Routers
import authRouter from './routes/auth.routes';
import protectedRouter from './routes/protected.routes';
import rewardsRouter from './routes/rewards.routes';
import pointsRouter from './routes/points.routes';
import customerRouter from './routes/customer.routes';
import tierRouter from './routes/tiers.routes';
import adminRouter from './routes/admin.routes';
import businessRouter from './routes/businesses.routes';

// Cron Job Logic
import cron from 'node-cron';
// --- CAMBIO: Importar PrismaClient aquí para pasarlo a helpers ---
import { PrismaClient } from '@prisma/client';
import { processTierUpdatesAndDowngrades } from './tiers/tier-logic.service';
// --- FIN CAMBIO ---

dotenv.config();

// --- CAMBIO: Crear instancia de Prisma aquí ---
const prisma = new PrismaClient();
// --- FIN CAMBIO ---


const app: Express = express();
const port = process.env.PORT || 3000;

// Middlewares globales
app.use(cors());
app.use(express.json());

// Log middleware (opcional, puede quitarse para tests si genera mucho ruido)
app.use((req, res, next) => {
  // Solo loguear si no estamos en entorno de test
  if (process.env.NODE_ENV !== 'test' && !process.env.VITEST) {
      console.log(`[REQ LOG] Received: ${req.method} ${req.originalUrl}`);
  }
  next();
});


// --- Rutas Públicas ---
app.use('/api/auth', authRouter);
app.use('/public/businesses', businessRouter);

// --- Rutas Protegidas ---
app.use('/api/profile', authenticateToken, protectedRouter);
app.use('/api/rewards', authenticateToken, checkRole([UserRole.BUSINESS_ADMIN]), rewardsRouter);
app.use('/api/points', authenticateToken, pointsRouter); // Roles checkeados internamente
app.use('/api/customer', authenticateToken, checkRole([UserRole.CUSTOMER_FINAL]), customerRouter);
app.use('/api/tiers', authenticateToken, checkRole([UserRole.BUSINESS_ADMIN]), tierRouter);
app.use('/api/admin', authenticateToken, checkRole([UserRole.BUSINESS_ADMIN]), adminRouter);

// --- Fin Rutas ---

// Ruta raíz básica
app.get('/', (req: Request, res: Response) => {
  res.send('Welcome to LoyalPyME API!');
});

// Manejador de errores global
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('[GLOBAL ERROR HANDLER]', err.stack);
  // Evitar enviar detalles del error en producción
  const errorMessage = process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message;
  res.status(500).json({ message: 'Internal Server Error', error: errorMessage });
});

// Cron Job
// Asegurarse de que no intente correr durante los tests si no es necesario
if (process.env.NODE_ENV !== 'test' && !process.env.VITEST) {
    cron.schedule('0 3 * * *', () => {
        const jobStartTime = new Date();
        console.log(`[CRON ${jobStartTime.toISOString()}] Running scheduled tier update/downgrade job...`);
        // La función processTierUpdatesAndDowngrades ahora usa su propia instancia de prisma
        // o podríamos pasarle la instancia 'prisma' creada arriba si la refactorizamos.
        // Por ahora, asumimos que funciona como está definida en tier-logic.service v2.2.1
        processTierUpdatesAndDowngrades()
          .then(() => {
            console.log(`[CRON ${jobStartTime.toISOString()}] Scheduled tier job finished successfully.`);
          })
          .catch(err => {
            console.error(`[CRON ${jobStartTime.toISOString()}] Scheduled tier job failed:`, err);
          });
    }, {
        scheduled: true,
        // timezone: "Europe/Madrid" // Descomentar si es necesario
    });
    console.log('Scheduled Tier update/downgrade job registered to run daily at 3:00 AM.');
}


// --- CAMBIO: Iniciar servidor solo si no estamos en entorno de test ---
// Vitest define `process.env.VITEST` cuando corre tests
if (!process.env.VITEST) {
    app.listen(port, () => {
      console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
    });
}
// --- FIN CAMBIO ---


// --- CAMBIO: Exportar 'app' para que los tests la puedan importar ---
export default app;
// --- FIN CAMBIO ---


// End of file: backend/src/index.ts