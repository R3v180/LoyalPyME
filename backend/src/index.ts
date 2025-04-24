// File: backend/src/index.ts
// Version: 1.1.2 (Add Global Request Logger Middleware)

import express, { Express, Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';

// Middleware
import { authenticateToken } from './middleware/auth.middleware';

// Routers
import authRouter from './routes/auth.routes';
import protectedRouter from './routes/protected.routes';
import rewardsRouter from './routes/rewards.routes';
import pointsRouter from './routes/points.routes';
import customerRouter from './routes/customer.routes';
import tierRouter from './routes/tiers.routes';
import adminRouter from './routes/admin.routes'; // Importar adminRouter

// Cron Job
import cron from 'node-cron';
import { processTierUpdatesAndDowngrades } from './tiers/tier-logic.service';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;

// Middlewares globales
app.use(cors());
app.use(express.json());

// --- NUEVO: Logger Global de Peticiones ---
// Registrar CADA petición que llega al servidor ANTES de que llegue a las rutas
app.use((req, res, next) => {
  // Mostramos método y URL original
  console.log(`[REQ LOG] Received: ${req.method} ${req.originalUrl}`);
  // Pasamos al siguiente middleware/ruta
  next();
});
// --- FIN Logger Global ---


// Rutas Públicas
app.use('/auth', authRouter);

// --- Rutas Protegidas ---
// Aplicar auth a TODO /api/* (se ejecutará DESPUÉS del logger global)
app.use('/api', authenticateToken);

// Montar los routers específicos bajo /api
app.use('/api/profile', protectedRouter);
app.use('/api/rewards', rewardsRouter);
app.use('/api/points', pointsRouter);
app.use('/api/customer', customerRouter);
app.use('/api/tiers', tierRouter);
app.use('/api/admin', adminRouter); // Montar adminRouter en /api/admin

// --- Fin Rutas Protegidas ---

app.get('/', (req: Request, res: Response) => {
  res.send('Welcome to LoyalPyME API!');
});

// Manejador de errores global
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('[GLOBAL ERROR HANDLER]', err.stack); // Loguear el stack completo
  res.status(500).json({ message: 'Internal Server Error', error: err.message });
});

// Cron Job (sin cambios)
cron.schedule('0 3 * * *', () => {
    const jobStartTime = new Date();
    console.log(`[CRON ${jobStartTime.toISOString()}] Running scheduled tier update/downgrade job...`);
    processTierUpdatesAndDowngrades()
      .then(() => {
        console.log(`[CRON ${jobStartTime.toISOString()}] Scheduled tier job finished successfully.`);
      })
      .catch(err => {
        console.error(`[CRON ${jobStartTime.toISOString()}] Scheduled tier job failed:`, err);
      });
}, {
    scheduled: true,
    // timezone: "Europe/Madrid"
});
console.log('Scheduled Tier update/downgrade job registered to run daily at 3:00 AM.');


app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});

// End of file