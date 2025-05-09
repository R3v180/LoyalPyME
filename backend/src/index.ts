// backend/src/index.ts
// Version: 1.6.1 (Mount uploads router - COMPLETE FILE)
// Modificado para incluir superAdminRouter

import superAdminRouter from './routes/superadmin.routes';import express, { Express, Request, Response, NextFunction, RequestHandler } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { UserRole, TierCalculationBasis, TierDowngradePolicy, BenefitType, Prisma } from '@prisma/client'; // Importar enums y Prisma
import { PrismaClient } from '@prisma/client';
import cron from 'node-cron';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

// Middleware
import { authenticateToken } from './middleware/auth.middleware';
import { checkRole } from './middleware/role.middleware';
// Middleware Multer (se aplica en la ruta específica, no aquí globalmente)

// Routers
import authRouter from './routes/auth.routes';
import protectedRouter from './routes/protected.routes';
import rewardsRouter from './routes/rewards.routes';
import pointsRouter from './routes/points.routes';
import customerRouter from './routes/customer.routes';
import tierRouter from './routes/tiers.routes';
import adminRouter from './routes/admin.routes';
import businessRouter from './routes/businesses.routes';
import activityRouter from './routes/activity.routes';
import uploadsRouter from './routes/uploads.routes';

// Cron Job Logic
import { processTierUpdatesAndDowngrades } from './tiers/tier-logic.service';


dotenv.config();

const prisma = new PrismaClient();
const app: Express = express();
const port = process.env.PORT || 3000;

// Middlewares globales
app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  // Evitar loggear durante tests
  if (process.env.NODE_ENV !== 'test' && !process.env.VITEST) {
      // Loggear detalles básicos de la petición
      const method = req.method;
      const url = req.originalUrl;
      const ip = req.ip || req.connection.remoteAddress;
      const timestamp = new Date().toISOString();
      // Evitar loggear el body si es muy grande o sensible (ej: file uploads)
      let bodyLog = '';
      if (req.body && Object.keys(req.body).length > 0 && !req.is('multipart/form-data')) {
         try { bodyLog = JSON.stringify(req.body); if (bodyLog.length > 500) bodyLog = bodyLog.substring(0, 497) + '...'; } catch { bodyLog = '[Unloggable Body]'; }
      }
      console.log(`[REQ LOG - ${timestamp}] ${method} ${url} - From: ${ip} ${bodyLog ? '- Body: '+bodyLog : ''}`);
  }
  next();
});


// --- Configuración de Swagger COMPLETA ---
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'LoyalPyME API',
      version: '1.7.0', // Versión actualizada para incluir SuperAdmin
      description: 'API REST para la plataforma de fidelización LoyalPyME. Permite gestionar clientes, puntos, niveles, recompensas, historial, subidas de archivos, autenticación y funcionalidades de Super Administrador.',
       contact: { name: 'Olivier Hottelet', email: 'olivierhottelet1980@gmail.com' },
       license: { name: 'AGPL-3.0', url: 'https://www.gnu.org/licenses/agpl-3.0.html' }
    },
    servers: [
        { url: `http://localhost:${port}/api`, description: 'Servidor de Desarrollo Local (API)', },
        { url: `http://localhost:${port}/public`, description: 'Servidor de Desarrollo Local (Público)', },
    ],
    components: { // Mantenemos los componentes de tu versión original
        securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', } },
        schemas: {
             ActivityLogItem: { type: 'object', properties: { id: { type: 'string', format: 'uuid', readOnly: true }, type: { type: 'string', enum: ['POINTS_EARNED_QR', 'POINTS_REDEEMED_REWARD', 'GIFT_REDEEMED', 'POINTS_ADJUSTED_ADMIN'], readOnly: true }, pointsChanged: { type: 'integer', nullable: true, readOnly: true, description: 'Cambio en puntos (+/-), null si no aplica.' }, description: { type: 'string', nullable: true, readOnly: true, description: 'Descripción del evento.' }, createdAt: { type: 'string', format: 'date-time', readOnly: true, description: 'Fecha y hora del evento.' } } },
             PaginatedActivityResponse: { type: 'object', properties: { logs: { type: 'array', items: { '$ref': '#/components/schemas/ActivityLogItem' } }, totalPages: { type: 'integer', example: 5 }, currentPage: { type: 'integer', example: 1 }, totalItems: { type: 'integer', example: 73 } } },
             LoginCredentials: { type: 'object', required: ['email', 'password'], properties: { email: { type: 'string', format: 'email'}, password: { type: 'string', format: 'password'} }, example: { email: 'user@example.com', password: 'password123' } },
             RegisterUserDto: { type: 'object', required: ['email', 'password', 'phone', 'documentId', 'documentType', 'businessId', 'role'], properties: { email: { type: 'string', format: 'email'}, password: { type: 'string', format: 'password', minLength: 6 }, name: { type: 'string', nullable: true }, phone: { type: 'string', example: '+34612345678' }, documentId: { type: 'string'}, documentType: { type: 'string', enum: ['DNI', 'NIE', 'PASSPORT', 'OTHER']}, businessId: { type: 'string', format: 'uuid'}, role: { type: 'string', enum: ['CUSTOMER_FINAL']} } },
             RegisterBusinessDto: { type: 'object', required: ['businessName', 'adminEmail', 'adminPassword'], properties: { businessName: { type: 'string', minLength: 2 }, adminEmail: { type: 'string', format: 'email'}, adminPassword: { type: 'string', format: 'password', minLength: 6 }, adminName: { type: 'string', nullable: true } } },
             ForgotPasswordDto: { type: 'object', required: ['email'], properties: { email: { type: 'string', format: 'email'} } },
             ResetPasswordDto: { type: 'object', required: ['password'], properties: { password: { type: 'string', format: 'password', minLength: 6 } } },
             UserResponse: { type: 'object', properties: { id: { type: 'string', format: 'uuid'}, email: { type: 'string', format: 'email'}, name: { type: 'string', nullable: true }, role: { type: 'string', enum: ['BUSINESS_ADMIN', 'CUSTOMER_FINAL', 'SUPER_ADMIN']}, businessId: { type: 'string', format: 'uuid', nullable: true}, points: { type: 'integer'}, createdAt: { type: 'string', format: 'date-time'}, isActive: { type: 'boolean'}, isFavorite: { type: 'boolean', nullable: true }, currentTierId: { type: 'string', format: 'uuid', nullable: true }, tierAchievedAt: { type: 'string', format: 'date-time', nullable: true } } },
             LoginResponse: { type: 'object', properties: { token: { type: 'string'}, user: { '$ref': '#/components/schemas/UserResponse' } } },
             SuccessMessage: { type: 'object', properties: { message: { type: 'string'} }, example: { message: 'Operación completada con éxito.'} },
             ErrorResponse: { type: 'object', properties: { message: { type: 'string'}, error: { type: 'string', nullable: true } }, example: { message: 'Error de validación.', error: 'El campo email es inválido.'} },
             RewardBase: { type: 'object', properties: { id: { type: 'string', format: 'uuid', readOnly: true }, name_es: { type: 'string', nullable: true}, name_en: { type: 'string', nullable: true}, description_es: { type: 'string', nullable: true }, description_en: { type: 'string', nullable: true }, pointsCost: { type: 'integer', format: 'int32', minimum: 0 }, isActive: { type: 'boolean'}, businessId: { type: 'string', format: 'uuid', readOnly: true }, createdAt: { type: 'string', format: 'date-time', readOnly: true }, updatedAt: { type: 'string', format: 'date-time', readOnly: true }, imageUrl: { type: 'string', format: 'url', nullable: true } } },
             CreateRewardDto: { type: 'object', required: ['name_es', 'name_en', 'pointsCost'], properties: { name_es: { type: 'string', example: 'Café Gratis' }, name_en: { type: 'string', example: 'Free Coffee' }, description_es: { type: 'string', nullable: true, example: 'Un café espresso o americano.' }, description_en: { type: 'string', nullable: true, example: 'One espresso or americano coffee.' }, pointsCost: { type: 'integer', format: 'int32', minimum: 0, example: 100 }, imageUrl: { type: 'string', format: 'url', nullable: true } } },
             UpdateRewardDto: { type: 'object', properties: { name_es: { type: 'string'}, name_en: { type: 'string'}, description_es: { type: 'string', nullable: true }, description_en: { type: 'string', nullable: true }, pointsCost: { type: 'integer', format: 'int32', minimum: 0 }, isActive: { type: 'boolean'}, imageUrl: { type: 'string', format: 'url', nullable: true } } },
             RewardListResponse: { type: 'array', items: { '$ref': '#/components/schemas/RewardBase' } },
             DeletedRewardResponse: { type: 'object', properties: { message: { type: 'string'}, deletedReward: { '$ref': '#/components/schemas/RewardBase' } } },
             GenerateQrDto: { type: 'object', required: ['amount', 'ticketNumber'], properties: { amount: { type: 'number', format: 'float', minimum: 0.01 }, ticketNumber: { type: 'string'} } },
             QrDataResponse: { type: 'object', properties: { qrToken: { type: 'string', format: 'uuid'}, amount: { type: 'number', format: 'float'} } },
             ValidateQrDto: { type: 'object', required: ['qrToken'], properties: { qrToken: { type: 'string', format: 'uuid'} } },
             PointsEarnedResponse: { type: 'object', properties: { message: { type: 'string'}, pointsEarned: { type: 'integer'}, user: { '$ref': '#/components/schemas/UserResponse' } }, example: { message: '...', pointsEarned: 7, user: { } } },
             RedeemRewardResult: { type: 'object', properties: { message: { type: 'string'}, newPointsBalance: { type: 'integer'} }, example: { message: '...', newPointsBalance: 930 } },
             RewardInfoForGift: { type: 'object', properties: { id: { type: 'string', format: 'uuid', readOnly: true }, name_es: { type: 'string', nullable: true, readOnly: true }, name_en: { type: 'string', nullable: true, readOnly: true }, description_es: { type: 'string', nullable: true, readOnly: true }, description_en: { type: 'string', nullable: true, readOnly: true }, imageUrl: { type: 'string', format: 'url', nullable: true, readOnly: true } } },
             AssignerInfo: { type: 'object', properties: { name: { type: 'string', nullable: true, readOnly: true }, email: { type: 'string', format: 'email', readOnly: true } } },
             BusinessInfoForGift: { type: 'object', properties: { name: { type: 'string', readOnly: true } } },
             GrantedReward: { type: 'object', properties: { id: { type: 'string', format: 'uuid', readOnly: true }, status: { type: 'string', enum: ['PENDING', 'REDEEMED', 'EXPIRED'], readOnly: true }, assignedAt: { type: 'string', format: 'date-time', readOnly: true }, redeemedAt: { type: 'string', format: 'date-time', nullable: true, readOnly: true }, reward: { '$ref': '#/components/schemas/RewardInfoForGift' }, assignedBy: { '$ref': '#/components/schemas/AssignerInfo', nullable: true }, business: { '$ref': '#/components/schemas/BusinessInfoForGift', nullable: true } } },
             GrantedRewardListResponse: { type: 'array', items: { '$ref': '#/components/schemas/GrantedReward' } },
             RedeemedGiftResponse: { type: 'object', properties: { message: { type: 'string'}, grantedRewardId: { type: 'string', format: 'uuid'}, rewardId: { type: 'string', format: 'uuid'}, redeemedAt: { type: 'string', format: 'date-time'} } },
             TierBenefitBase: { type: 'object', properties: { id: { type: 'string', format: 'uuid', readOnly: true }, type: { type: 'string', enum: Object.values(BenefitType) }, value: { type: 'string'}, description: { type: 'string', nullable: true }, isActive: { type: 'boolean'} } },
             TierWithBenefits: { type: 'object', properties: { id: { type: 'string', format: 'uuid', readOnly: true }, name: { type: 'string'}, level: { type: 'integer'}, minValue: { type: 'number'}, description: { type: 'string', nullable: true }, benefitsDescription: { type: 'string', nullable: true }, isActive: { type: 'boolean'}, benefits: { type: 'array', items: { '$ref': '#/components/schemas/TierBenefitBase' } } } },
             TierListResponse: { type: 'array', items: { '$ref': '#/components/schemas/TierWithBenefits' } },
             TierConfigResponse: { type: 'object', properties: { tierSystemEnabled: { type: 'boolean' }, tierCalculationBasis: { type: 'string', enum: Object.values(TierCalculationBasis), nullable: true }, tierCalculationPeriodMonths: { type: 'integer', nullable: true, minimum: 0 }, tierDowngradePolicy: { type: 'string', enum: Object.values(TierDowngradePolicy) }, inactivityPeriodMonths: { type: 'integer', nullable: true, minimum: 1 } } },
             TierConfigUpdateDto: { type: 'object', properties: { tierSystemEnabled: { type: 'boolean'}, tierCalculationBasis: { type: 'string', enum: Object.values(TierCalculationBasis), nullable: true }, tierCalculationPeriodMonths: { type: 'integer', nullable: true, minimum: 0 }, tierDowngradePolicy: { type: 'string', enum: Object.values(TierDowngradePolicy) }, inactivityPeriodMonths: { type: 'integer', nullable: true, minimum: 1 } } },
             TierBase: { type: 'object', properties: { id: { type: 'string', format: 'uuid', readOnly: true }, name: { type: 'string'}, level: { type: 'integer', minimum: 0 }, minValue: { type: 'number', minimum: 0 }, description: { type: 'string', nullable: true }, benefitsDescription: { type: 'string', nullable: true }, isActive: { type: 'boolean'}, businessId: { type: 'string', format: 'uuid', readOnly: true }, createdAt: { type: 'string', format: 'date-time', readOnly: true }, updatedAt: { type: 'string', format: 'date-time', readOnly: true } } },
             CreateTierDto: { type: 'object', required: ['name', 'level', 'minValue'], properties: { name: { type: 'string'}, level: { type: 'integer', minimum: 0 }, minValue: { type: 'number', minimum: 0 }, description: { type: 'string', nullable: true }, benefitsDescription: { type: 'string', nullable: true }, isActive: { type: 'boolean', default: true } } },
             UpdateTierDto: { type: 'object', properties: { name: { type: 'string'}, level: { type: 'integer', minimum: 0 }, minValue: { type: 'number', minimum: 0 }, description: { type: 'string', nullable: true }, benefitsDescription: { type: 'string', nullable: true }, isActive: { type: 'boolean'} } },
             AdminTierListResponse: { type: 'array', items: { '$ref': '#/components/schemas/TierWithBenefits' } },
             DeletedTierResponse: { type: 'object', properties: { message: { type: 'string'}, deletedTier: { '$ref': '#/components/schemas/TierBase' } } },
             TierBenefitListResponse: { type: 'array', items: { '$ref': '#/components/schemas/TierBenefitBase' } },
             CreateTierBenefitDto: { type: 'object', required: ['type', 'value'], properties: { type: { type: 'string', enum: Object.values(BenefitType) }, value: { type: 'string'}, description: { type: 'string', nullable: true }, isActive: { type: 'boolean', default: true } } },
             UpdateTierBenefitDto: { type: 'object', properties: { type: { type: 'string', enum: Object.values(BenefitType) }, value: { type: 'string'}, description: { type: 'string', nullable: true }, isActive: { type: 'boolean'} } },
             DeletedTierBenefitResponse: { type: 'object', properties: { message: { type: 'string'}, deletedBenefit: { '$ref': '#/components/schemas/TierBenefitBase' } } },
             AdminStatsOverviewResponse: { type: 'object', properties: { totalActiveCustomers: { type: 'integer'}, newCustomersLast7Days: { type: 'integer'}, newCustomersPrevious7Days: { type: 'integer'}, pointsIssuedLast7Days: { type: 'integer'}, pointsIssuedPrevious7Days: { type: 'integer'}, rewardsRedeemedLast7Days: { type: 'integer'}, rewardsRedeemedPrevious7Days: { type: 'integer'} } },
             CustomerListItem: { type: 'object', properties: { id: { type: 'string', format: 'uuid' }, name: { type: 'string', nullable: true }, email: { type: 'string', format: 'email' }, points: { type: 'integer' }, createdAt: { type: 'string', format: 'date-time' }, isActive: { type: 'boolean' }, isFavorite: { type: 'boolean', nullable: true }, currentTier: { type: 'object', nullable: true, properties: { id: { type: 'string', format: 'uuid' }, name: { type: 'string' }, level: { type: 'integer' } } } } },
             AdminCustomerListResponse: { type: 'object', properties: { items: { type: 'array', items: { '$ref': '#/components/schemas/CustomerListItem' } }, totalPages: { type: 'integer' }, currentPage: { type: 'integer' }, totalItems: { type: 'integer' } } },
             CustomerDetailsResponse: { allOf: [ { '$ref': '#/components/schemas/UserResponse' }, { type: 'object', properties: { adminNotes: { type: 'string', nullable: true } } } ] },
             UpdateCustomerNotesDto: { type: 'object', properties: { notes: { type: 'string', nullable: true } } },
             AdjustPointsDto: { type: 'object', required: ['amount'], properties: { amount: { type: 'number', not: { const: 0 } }, reason: { type: 'string', nullable: true } } },
             ChangeCustomerTierDto: { type: 'object', properties: { tierId: { type: 'string', format: 'uuid', nullable: true } } },
             AssignRewardDto: { type: 'object', required: ['rewardId'], properties: { rewardId: { type: 'string', format: 'uuid' } } },
             CustomerActionResponse: { type: 'object', properties: { message: { type: 'string' }, customer: { type: 'object', properties: { id: { type: 'string', format: 'uuid' }, points: { type: 'integer' }, currentTierId: { type: 'string', format: 'uuid', nullable: true }, tierAchievedAt: { type: 'string', format: 'date-time', nullable: true }, isFavorite: { type: 'boolean' }, isActive: { type: 'boolean' } }, additionalProperties: false } } },
             GrantedRewardIdResponse: { type: 'object', properties: { message: { type: 'string' }, grantedRewardId: { type: 'string', format: 'uuid' } } },
             BulkCustomerIdListDto: { type: 'object', required: ['customerIds'], properties: { customerIds: { type: 'array', items: { type: 'string', format: 'uuid' }, minItems: 1 } } },
             BulkStatusUpdateDto: { type: 'object', required: ['customerIds', 'isActive'], properties: { customerIds: { type: 'array', items: { type: 'string', format: 'uuid' }, minItems: 1 }, isActive: { type: 'boolean'} } },
             BulkPointsAdjustDto: { type: 'object', required: ['customerIds', 'amount'], properties: { customerIds: { type: 'array', items: { type: 'string', format: 'uuid' }, minItems: 1 }, amount: { type: 'number', not: { const: 0 } }, reason: { type: 'string', nullable: true } } },
             BulkOperationResponse: { type: 'object', properties: { message: { type: 'string' }, count: { type: 'integer'} } },
             ImageUploadResponse: { type: 'object', properties: { url: { type: 'string', format: 'url', description: 'URL de la imagen subida a Cloudinary.' } } }
         }
    },
    paths: { /* ... tu paths object ... */ }
  },
  apis: [],
};
const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec) as RequestHandler);

// --- Montaje de Rutas ---

// Rutas Públicas
app.use('/api/auth', authRouter);
app.use('/public/businesses', businessRouter);

// Línea AÑADIDA para Super Admin:
app.use('/api/superadmin', superAdminRouter);

// Rutas Protegidas (estas ya las tenías, asegúrate que siguen el mismo patrón de middlewares que usabas)
app.use('/api/profile', authenticateToken, protectedRouter);
app.use('/api/rewards', authenticateToken, checkRole([UserRole.BUSINESS_ADMIN]), rewardsRouter); // Ejemplo de cómo podrías tenerlo
app.use('/api/points', authenticateToken, pointsRouter);
app.use('/api/customer', authenticateToken, checkRole([UserRole.CUSTOMER_FINAL]), customerRouter);
app.use('/api/customer/activity', authenticateToken, checkRole([UserRole.CUSTOMER_FINAL]), activityRouter);
app.use('/api/tiers', authenticateToken, checkRole([UserRole.BUSINESS_ADMIN]), tierRouter);
app.use('/api/admin', authenticateToken, checkRole([UserRole.BUSINESS_ADMIN]), adminRouter);
app.use('/api/uploads', authenticateToken, checkRole([UserRole.BUSINESS_ADMIN]), uploadsRouter);

// --- Fin Montaje de Rutas ---

// Ruta raíz básica
app.get('/', (req: Request, res: Response) => {
  res.send('Welcome to LoyalPyME API! Docs available at /api-docs');
});

// Manejador de errores global
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('[GLOBAL ERROR HANDLER]', err.stack); // Usar err.stack para más detalle
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === 'P2002') { return res.status(409).json({ message: 'Conflicto de unicidad.', error: `Ya existe un registro con uno de los valores únicos proporcionados. (${(err.meta?.target as string[])?.join(', ')})`, code: err.code }); }
        if (err.code === 'P2025') { return res.status(404).json({ message: 'Registro no encontrado.', error: (err.meta?.cause as string) || 'El registro necesario para la operación no existe.', code: err.code });}
        return res.status(400).json({ message: 'Error de base de datos.', error: err.message, code: err.code });
    }
    if (err instanceof Prisma.PrismaClientValidationError) {
         return res.status(400).json({ message: 'Error de validación de datos Prisma.', error: 'Los datos proporcionados no cumplen con el formato esperado por la base de datos.'});
    }
    // @ts-ignore
    const statusCode = err.status || 500;
    const errorMessage = statusCode === 500 && process.env.NODE_ENV === 'production' ? 'Ocurrió un error interno en el servidor.' : err.message || 'Error desconocido.';
    res.status(statusCode).json({ message: statusCode === 500 ? 'Error Interno del Servidor' : 'Error en la Petición', error: errorMessage });
});

// Cron Job
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
            .catch(err => console.error(`[CRON ${new Date().toISOString()}] Tier update/downgrade job failed:`, err));
    });
    console.log(`✅ Tier update/downgrade job registered.`);
} else {
     console.log("ℹ️ Cron job scheduling skipped in test/Vitest environment.");
}

// Iniciar servidor
if (!process.env.VITEST) {
     app.listen(port, () => {
         console.log(`\n🚀 [server]: Server is running at http://localhost:${port}`);
         console.log(`📚 [docs]: API Docs available at http://localhost:${port}/api-docs`);
     });
}

export default app;