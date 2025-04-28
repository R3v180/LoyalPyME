// filename: backend/src/index.ts
// Version: 1.2.0 (Add public business routes)

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
import adminRouter from './routes/admin.routes';
import businessRouter from './routes/businesses.routes'; // <-- NUEVA IMPORTACIÓN

// Cron Job
import cron from 'node-cron';
import { processTierUpdatesAndDowngrades } from './tiers/tier-logic.service';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;

// Middlewares globales
app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  console.log(`[REQ LOG] Received: ${req.method} ${req.originalUrl}`);
  next();
});

// --- Rutas Públicas ---
// Montamos las rutas de autenticación (existente)
app.use('/auth', authRouter);

// --- NUEVO: Montamos las rutas públicas de negocios ---
// Lo montamos aquí ANTES de aplicar la autenticación global a /api
// La ruta final será GET /public/businesses/public-list
app.use('/public/businesses', businessRouter);
// --- FIN NUEVO ---


// --- Rutas Protegidas ---
// Aplicar auth a TODO /api/* (se ejecutará DESPUÉS de los middlewares globales y rutas públicas)
app.use('/api', authenticateToken);

// Montar los routers específicos PROTEGIDOS bajo /api
app.use('/api/profile', protectedRouter); // Rutas de perfil de usuario
app.use('/api/rewards', rewardsRouter); // Rutas para gestión de recompensas (Admin)
app.use('/api/points', pointsRouter);   // Rutas para puntos y QR (Cliente y Admin)
app.use('/api/customer', customerRouter); // Rutas específicas del cliente (ver recompensas, canjear regalos)
app.use('/api/tiers', tierRouter);     // Rutas para gestión de niveles (Admin)
app.use('/api/admin', adminRouter);     // Rutas para acciones de admin sobre clientes, etc.
// NOTA: Si en el futuro añadimos rutas de negocio que SÍ requieran autenticación
// (ej: /api/businesses/settings), se montarían aquí DENTRO del bloque /api.

// --- Fin Rutas Protegidas ---

app.get('/', (req: Request, res: Response) => {
  res.send('Welcome to LoyalPyME API!');
});

// Manejador de errores global (sin cambios)
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('[GLOBAL ERROR HANDLER]', err.stack);
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
    // timezone: "Europe/Madrid" // Considera añadir timezone
});
console.log('Scheduled Tier update/downgrade job registered to run daily at 3:00 AM.');


app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});

// End of file: backend/src/index.ts