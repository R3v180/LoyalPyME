"use strict";
// filename: backend/src/index.ts
// Version: 1.4.0 (Export app, conditionally listen)
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const client_1 = require("@prisma/client");
// Middleware
const auth_middleware_1 = require("./middleware/auth.middleware");
const role_middleware_1 = require("./middleware/role.middleware");
// Routers
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const protected_routes_1 = __importDefault(require("./routes/protected.routes"));
const rewards_routes_1 = __importDefault(require("./routes/rewards.routes"));
const points_routes_1 = __importDefault(require("./routes/points.routes"));
const customer_routes_1 = __importDefault(require("./routes/customer.routes"));
const tiers_routes_1 = __importDefault(require("./routes/tiers.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
const businesses_routes_1 = __importDefault(require("./routes/businesses.routes"));
// Cron Job Logic
const node_cron_1 = __importDefault(require("node-cron"));
// --- CAMBIO: Importar PrismaClient aquí para pasarlo a helpers ---
const client_2 = require("@prisma/client");
const tier_logic_service_1 = require("./tiers/tier-logic.service");
// --- FIN CAMBIO ---
dotenv_1.default.config();
// --- CAMBIO: Crear instancia de Prisma aquí ---
const prisma = new client_2.PrismaClient();
// --- FIN CAMBIO ---
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
// Middlewares globales
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Log middleware (opcional, puede quitarse para tests si genera mucho ruido)
app.use((req, res, next) => {
    // Solo loguear si no estamos en entorno de test
    if (process.env.NODE_ENV !== 'test' && !process.env.VITEST) {
        console.log(`[REQ LOG] Received: ${req.method} ${req.originalUrl}`);
    }
    next();
});
// --- Rutas Públicas ---
app.use('/api/auth', auth_routes_1.default);
app.use('/public/businesses', businesses_routes_1.default);
// --- Rutas Protegidas ---
app.use('/api/profile', auth_middleware_1.authenticateToken, protected_routes_1.default);
app.use('/api/rewards', auth_middleware_1.authenticateToken, (0, role_middleware_1.checkRole)([client_1.UserRole.BUSINESS_ADMIN]), rewards_routes_1.default);
app.use('/api/points', auth_middleware_1.authenticateToken, points_routes_1.default); // Roles checkeados internamente
app.use('/api/customer', auth_middleware_1.authenticateToken, (0, role_middleware_1.checkRole)([client_1.UserRole.CUSTOMER_FINAL]), customer_routes_1.default);
app.use('/api/tiers', auth_middleware_1.authenticateToken, (0, role_middleware_1.checkRole)([client_1.UserRole.BUSINESS_ADMIN]), tiers_routes_1.default);
app.use('/api/admin', auth_middleware_1.authenticateToken, (0, role_middleware_1.checkRole)([client_1.UserRole.BUSINESS_ADMIN]), admin_routes_1.default);
// --- Fin Rutas ---
// Ruta raíz básica
app.get('/', (req, res) => {
    res.send('Welcome to LoyalPyME API!');
});
// Manejador de errores global
app.use((err, req, res, next) => {
    console.error('[GLOBAL ERROR HANDLER]', err.stack);
    // Evitar enviar detalles del error en producción
    const errorMessage = process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message;
    res.status(500).json({ message: 'Internal Server Error', error: errorMessage });
});
// Cron Job
// Asegurarse de que no intente correr durante los tests si no es necesario
if (process.env.NODE_ENV !== 'test' && !process.env.VITEST) {
    node_cron_1.default.schedule('0 3 * * *', () => {
        const jobStartTime = new Date();
        console.log(`[CRON ${jobStartTime.toISOString()}] Running scheduled tier update/downgrade job...`);
        // La función processTierUpdatesAndDowngrades ahora usa su propia instancia de prisma
        // o podríamos pasarle la instancia 'prisma' creada arriba si la refactorizamos.
        // Por ahora, asumimos que funciona como está definida en tier-logic.service v2.2.1
        (0, tier_logic_service_1.processTierUpdatesAndDowngrades)()
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
exports.default = app;
// --- FIN CAMBIO ---
// End of file: backend/src/index.ts
