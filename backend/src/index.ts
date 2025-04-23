// File: backend/src/index.ts
// Version: 1.1.0 (Mount Tier routes and schedule Tier update job)

import express, { Express, Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';

// Middleware
import { authenticateToken } from './middleware/auth.middleware'; // Middleware global de autenticación para /api

// Routers
import authRouter from './routes/auth.routes';
import protectedRouter from './routes/protected.routes';
import rewardsRouter from './routes/rewards.routes'; // Asumo que existe
import pointsRouter from './routes/points.routes';   // Asumo que existe
import customerRouter from './routes/customer.routes'; // Asumo que existe
// NUEVO: Importar tierRouter
import tierRouter from './routes/tiers.routes';

// NUEVO: Importar cron y función del job
import cron from 'node-cron';
import { processTierUpdatesAndDowngrades } from './tiers/tier-logic.service'; // Asegúrate que la ruta sea correcta

dotenv.config(); // Cargar variables de entorno de .env

const app: Express = express();
const port = process.env.PORT || 3000;

// Middlewares globales
app.use(cors()); // Habilitar CORS para todas las rutas
app.use(express.json()); // Parsear bodies JSON

// Rutas Públicas (Autenticación)
app.use('/auth', authRouter);

// --- Rutas Protegidas ---
// Aplicar middleware authenticateToken a todas las rutas bajo /api
app.use('/api', authenticateToken);

// Montar los routers específicos bajo /api
app.use('/api/profile', protectedRouter); // Ejemplo ruta protegida simple
app.use('/api/rewards', rewardsRouter);   // Rutas para gestión de recompensas (Admin)
app.use('/api/points', pointsRouter);     // Rutas para puntos y QR (Admin/Customer)
app.use('/api/customer', customerRouter); // Rutas específicas del cliente

// NUEVO: Montar las rutas de Tiers bajo /api/tiers
// Las rutas definidas en tiers.routes.ts serán relativas a esto
// Ej: GET /api/tiers/config, POST /api/tiers/tiers, GET /api/tiers/customer/tiers
app.use('/api/tiers', tierRouter);

// --- Fin Rutas Protegidas ---

// Ruta raíz de bienvenida (opcional)
app.get('/', (req: Request, res: Response) => {
  res.send('Welcome to LoyalPyME API!');
});

// Manejador de errores global simple (opcional, mejorar si es necesario)
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal Server Error', error: err.message });
});

// --- NUEVO: Programar Tarea de Actualización/Descenso de Tiers ---
// Se ejecuta todos los días a las 3:00 AM (zona horaria del servidor)
// Formato cron: minuto hora día-mes mes día-semana
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
    // timezone: "Europe/Madrid" // Descomentar y ajustar si tu servidor está en otra zona horaria
});
console.log('Scheduled Tier update/downgrade job registered to run daily at 3:00 AM.');
// --- FIN NUEVO ---


// Iniciar servidor
app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});