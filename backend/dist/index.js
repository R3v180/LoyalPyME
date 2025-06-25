"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// backend/src/index.ts (CORREGIDO v1.8.1)
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
require("reflect-metadata");
const cors_1 = __importDefault(require("cors"));
const client_1 = require("@prisma/client");
const node_cron_1 = __importDefault(require("node-cron"));
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swagger_config_1 = require("./config/swagger.config");
const routes_1 = require("./routes");
// --- RUTA CORREGIDA ---
const tier_logic_service_1 = require("./modules/loyalpyme/tiers/tier-logic.service");
dotenv_1.default.config();
const prisma = new client_1.PrismaClient();
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use((req, res, next) => {
    if (process.env.NODE_ENV !== 'test' && !process.env.VITEST) {
        const method = req.method;
        const url = req.originalUrl;
        const ip = req.ip || req.connection.remoteAddress;
        const timestamp = new Date().toISOString();
        let bodyLog = '';
        if (req.body && Object.keys(req.body).length > 0 && !req.is('multipart/form-data')) {
            try {
                bodyLog = JSON.stringify(req.body);
                if (bodyLog.length > 500)
                    bodyLog = bodyLog.substring(0, 497) + '...';
            }
            catch {
                bodyLog = '[Unloggable Body]';
            }
        }
        console.log(`[REQ LOG - ${timestamp}] ${method} ${url} - From: ${ip} ${bodyLog ? '- Body: ' + bodyLog : ''}`);
    }
    next();
});
const swaggerSpec = (0, swagger_jsdoc_1.default)(swagger_config_1.swaggerOptions);
app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swaggerSpec));
app.use('/api', routes_1.apiRouter);
app.use('/public', routes_1.publicRouter);
app.get('/', (req, res) => { res.send('Welcome to LoyalPyME API! Docs available at /api-docs'); });
app.use((err, req, res, next) => {
    console.error('[GLOBAL ERROR HANDLER]', err.stack);
    if (err instanceof client_1.Prisma.PrismaClientKnownRequestError) {
        if (err.code === 'P2002') {
            return res.status(409).json({ message: 'Conflicto de unicidad.', error: `Ya existe un registro con uno de los valores únicos proporcionados. (${err.meta?.target?.join(', ')})`, code: err.code });
        }
        if (err.code === 'P2025') {
            return res.status(404).json({ message: 'Registro no encontrado.', error: err.meta?.cause || 'El registro necesario para la operación no existe.', code: err.code });
        }
        return res.status(400).json({ message: 'Error de base de datos.', error: err.message, code: err.code });
    }
    if (err instanceof client_1.Prisma.PrismaClientValidationError) {
        return res.status(400).json({ message: 'Error de validación de datos Prisma.', error: 'Los datos proporcionados no cumplen con el formato esperado por la base de datos.' });
    }
    const statusCode = err.status || 500;
    const errorMessage = statusCode === 500 && process.env.NODE_ENV === 'production' ? 'Ocurrió un error interno en el servidor.' : err.message || 'Error desconocido.';
    res.status(statusCode).json({ message: statusCode === 500 ? 'Error Interno del Servidor' : 'Error en la Petición', error: errorMessage });
});
if (process.env.NODE_ENV !== 'test' && !process.env.VITEST) {
    const cronSchedule = process.env.TIER_UPDATE_CRON_SCHEDULE || '0 3 * * *';
    console.log(`Scheduling Tier update/downgrade job with schedule: [${cronSchedule}]`);
    node_cron_1.default.schedule(cronSchedule, () => {
        const startTime = Date.now();
        console.log(`[CRON ${new Date().toISOString()}] Starting Tier update/downgrade job...`);
        (0, tier_logic_service_1.processTierUpdatesAndDowngrades)()
            .then(() => {
            const duration = (Date.now() - startTime) / 1000;
            console.log(`[CRON ${new Date().toISOString()}] Tier update/downgrade job finished successfully in ${duration.toFixed(2)}s.`);
        })
            // --- TIPO 'any' AÑADIDO ---
            .catch((cronErr) => console.error(`[CRON ${new Date().toISOString()}] Tier update/downgrade job failed:`, cronErr));
    });
    console.log(`✅ Tier update/downgrade job registered.`);
}
else {
    console.log("ℹ️ Cron job scheduling skipped in test/Vitest environment.");
}
if (!process.env.VITEST) {
    app.listen(port, () => {
        console.log(`\n🚀 [server]: Server is running at http://localhost:${port}`);
        console.log(`📚 [docs]: API Docs available at http://localhost:${port}/api-docs`);
    });
}
exports.default = app;
