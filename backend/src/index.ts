// backend/src/index.ts (CORREGIDO v1.8.1)
import express, { Express, Request, Response, NextFunction, RequestHandler } from 'express';
import dotenv from 'dotenv';
import 'reflect-metadata';
import cors from 'cors';
import { Prisma, PrismaClient } from '@prisma/client';
import cron from 'node-cron';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

import { swaggerOptions } from './config/swagger.config';
import { apiRouter, publicRouter } from './routes';

// --- RUTA CORREGIDA ---
import { processTierUpdatesAndDowngrades } from './modules/loyalpyme/tiers/tier-logic.service';

dotenv.config();

const prisma = new PrismaClient();
const app: Express = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  if (process.env.NODE_ENV !== 'test' && !process.env.VITEST) {
      const method = req.method;
      const url = req.originalUrl;
      const ip = req.ip || req.connection.remoteAddress;
      const timestamp = new Date().toISOString();
      let bodyLog = '';
      if (req.body && Object.keys(req.body).length > 0 && !req.is('multipart/form-data')) {
         try { bodyLog = JSON.stringify(req.body); if (bodyLog.length > 500) bodyLog = bodyLog.substring(0, 497) + '...'; } catch { bodyLog = '[Unloggable Body]'; }
      }
      console.log(`[REQ LOG - ${timestamp}] ${method} ${url} - From: ${ip} ${bodyLog ? '- Body: '+bodyLog : ''}`);
  }
  next();
});

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec) as RequestHandler);

app.use('/api', apiRouter);
app.use('/public', publicRouter);

app.get('/', (req: Request, res: Response) => { res.send('Welcome to LoyalPyME API! Docs available at /api-docs'); });

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('[GLOBAL ERROR HANDLER]', err.stack);
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === 'P2002') { return res.status(409).json({ message: 'Conflicto de unicidad.', error: `Ya existe un registro con uno de los valores únicos proporcionados. (${(err.meta?.target as string[])?.join(', ')})`, code: err.code }); }
        if (err.code === 'P2025') { return res.status(404).json({ message: 'Registro no encontrado.', error: (err.meta?.cause as string) || 'El registro necesario para la operación no existe.', code: err.code });}
        return res.status(400).json({ message: 'Error de base de datos.', error: err.message, code: err.code });
    }
    if (err instanceof Prisma.PrismaClientValidationError) {
         return res.status(400).json({ message: 'Error de validación de datos Prisma.', error: 'Los datos proporcionados no cumplen con el formato esperado por la base de datos.'});
    }
    const statusCode = (err as any).status || 500;
    const errorMessage = statusCode === 500 && process.env.NODE_ENV === 'production' ? 'Ocurrió un error interno en el servidor.' : err.message || 'Error desconocido.';
    res.status(statusCode).json({ message: statusCode === 500 ? 'Error Interno del Servidor' : 'Error en la Petición', error: errorMessage });
});

if (process.env.NODE_ENV !== 'test' && !process.env.VITEST) {
    const cronSchedule = process.env.TIER_UPDATE_CRON_SCHEDULE || '0 3 * * *';
    console.log(`Scheduling Tier update/downgrade job with schedule: [${cronSchedule}]`);
    cron.schedule(cronSchedule, () => {
        const startTime = Date.now();
        console.log(`[CRON ${new Date().toISOString()}] Starting Tier update/downgrade job...`);
        processTierUpdatesAndDowngrades()
            .then(() => {
                 const duration = (Date.now() - startTime) / 1000;
                 console.log(`[CRON ${new Date().toISOString()}] Tier update/downgrade job finished successfully in ${duration.toFixed(2)}s.`);
            })
            // --- TIPO 'any' AÑADIDO ---
            .catch((cronErr: any) => console.error(`[CRON ${new Date().toISOString()}] Tier update/downgrade job failed:`, cronErr));
    });
    console.log(`✅ Tier update/downgrade job registered.`);
} else {
     console.log("ℹ️ Cron job scheduling skipped in test/Vitest environment.");
}

if (!process.env.VITEST) {
     app.listen(port, () => {
         console.log(`\n🚀 [server]: Server is running at http://localhost:${port}`);
         console.log(`📚 [docs]: API Docs available at http://localhost:${port}/api-docs`);
     });
}

export default app;