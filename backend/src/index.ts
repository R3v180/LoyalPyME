// File: backend/src/index.ts
// Version: 1.0.20 (Mount customer routes - Clean Code)

import express, { Router, Request, Response } from 'express';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import cors from 'cors';

// Importa los routers
import authRoutes from './routes/auth.routes';
import protectedRoutes from './routes/protected.routes';
import rewardsRoutes from './routes/rewards.routes';
import pointsRoutes from './routes/points.routes';
import customerRoutes from './routes/customer.routes'; // <-- Importa el nuevo

// Importa el middleware de autenticacion
import { authenticateToken } from './middleware/auth.middleware';

dotenv.config();

if (!process.env.JWT_SECRET) { console.error('FATAL ERROR: JWT_SECRET is not defined.'); process.exit(1); }

const app = express();
const port = process.env.PORT || 3000; // Puerto 3000

let prisma: PrismaClient;
try {
    console.log('[INIT] Initializing PrismaClient...');
    prisma = new PrismaClient();
    console.log('[INIT] PrismaClient initialized.');
} catch (error) { console.error('[FATAL INIT ERROR] Error initializing PrismaClient:', error); process.exit(1); }

// Middlewares Globales
app.use(express.json());
app.use( cors({ origin: 'http://localhost:5173', methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'], allowedHeaders: ['Content-Type', 'Authorization'] }) );

// Rutas PUBLICAS
app.use('/auth', authRoutes);
app.get('/', (req, res) => { res.send(`LoyalPyME Backend is running on port ${port}!`); });
app.get('/businesses', async (req, res) => { try { if (!prisma) throw new Error("Prisma client not initialized"); const businesses = await prisma.business.findMany(); res.json(businesses); } catch (error) { console.error('Error fetching businesses:', error); res.status(500).json({ error: 'Server error' }); } });

// Rutas PROTEGIDAS (/api)
const apiRouter = Router();
apiRouter.use(authenticateToken); // Auth global para /api
apiRouter.use('/profile', protectedRoutes);
apiRouter.use('/rewards', rewardsRoutes); // Solo Admin (protegido por role middleware dentro)
apiRouter.use('/points', pointsRoutes); // Roles mixtos (protegido por role middleware dentro)
apiRouter.use('/customer', customerRoutes); // <-- NUEVO: Montar customerRoutes en /api/customer
app.use('/api', apiRouter);

// Inicio del Servidor
app.listen(port, () => { console.log(`Server is running on http://localhost:${port}`); });

// Manejo de eventos del proceso
process.on('beforeExit', async () => { console.log('Shutting down server and disconnecting Prisma Client...'); if (prisma) { await prisma.$disconnect(); console.log('Prisma Client disconnected.'); } });
process.on('unhandledRejection', (reason, promise) => { console.error('Unhandled Rejection at:', promise, 'reason:', reason); });
process.on('uncaughtException', (error) => { console.error('Uncaught Exception:', error); /* process.exit(1); */ });

// End of File: backend/src/index.ts