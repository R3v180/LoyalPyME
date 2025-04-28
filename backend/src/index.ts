// filename: backend/src/index.ts
// Version: 1.3.0 (Apply auth middleware individually, mount authRouter under /api)

import express, { Express, Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { UserRole } from '@prisma/client'; // Import UserRole

// Middleware
import { authenticateToken } from './middleware/auth.middleware';
import { checkRole } from './middleware/role.middleware'; // Import checkRole

// Routers
import authRouter from './routes/auth.routes';           // Contiene /login, /register, /forgot-password, etc.
import protectedRouter from './routes/protected.routes'; // Contiene /profile
import rewardsRouter from './routes/rewards.routes';     // Gestión Recompensas (Admin)
import pointsRouter from './routes/points.routes';       // Puntos y QR (Cliente/Admin)
import customerRouter from './routes/customer.routes';    // Acciones Cliente (ver recompensas, canjear regalo)
import tierRouter from './routes/tiers.routes';         // Gestión Niveles (Admin)
import adminRouter from './routes/admin.routes';        // Acciones Admin sobre clientes, stats
import businessRouter from './routes/businesses.routes'; // Contiene /public-list

// Cron Job Logic
import cron from 'node-cron';
import { processTierUpdatesAndDowngrades } from './tiers/tier-logic.service'; // Asegúrate que la ruta es correcta

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
// Rutas que NO requieren token JWT

// Montamos authRouter bajo /api/auth para que funcione con el proxy y axiosInstance del frontend
// Se monta ANTES de aplicar authenticateToken a otras rutas /api
app.use('/api/auth', authRouter); // Rutas como /api/auth/login, /api/auth/register ahora

// Montamos las rutas públicas de negocios
app.use('/public/businesses', businessRouter); // Ruta GET /public/businesses/public-list


// --- Rutas Protegidas ---
// Aplicar auth y roles a las rutas específicas bajo /api

// Aplicamos authenticateToken (y checkRole si aplica) INDIVIDUALMENTE a cada router protegido:
app.use('/api/profile', authenticateToken, protectedRouter); // Requiere token, cualquier rol logueado
app.use('/api/rewards', authenticateToken, checkRole([UserRole.BUSINESS_ADMIN]), rewardsRouter); // Requiere token + rol Admin
app.use('/api/points', authenticateToken, pointsRouter); // Requiere token. Roles se chequean dentro de las rutas si es necesario
app.use('/api/customer', authenticateToken, checkRole([UserRole.CUSTOMER_FINAL]), customerRouter); // Requiere token + rol Cliente
app.use('/api/tiers', authenticateToken, checkRole([UserRole.BUSINESS_ADMIN]), tierRouter); // Requiere token + rol Admin
app.use('/api/admin', authenticateToken, checkRole([UserRole.BUSINESS_ADMIN]), adminRouter); // Requiere token + rol Admin

// --- Fin Rutas Protegidas ---

// Ruta raíz básica
app.get('/', (req: Request, res: Response) => {
  res.send('Welcome to LoyalPyME API!');
});

// Manejador de errores global
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('[GLOBAL ERROR HANDLER]', err.stack); // Loguear el stack completo
  res.status(500).json({ message: 'Internal Server Error', error: err.message });
});

// Cron Job (Código Completo)
cron.schedule('0 3 * * *', () => { // Ejecutar todos los días a las 3:00 AM
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
    // timezone: "Europe/Madrid" // Descomentar si quieres especificar zona horaria
});
console.log('Scheduled Tier update/downgrade job registered to run daily at 3:00 AM.');


// Iniciar servidor
app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});

// End of file: backend/src/index.ts