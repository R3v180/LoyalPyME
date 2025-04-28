"use strict";
// filename: backend/src/index.ts
// Version: 1.2.0 (Add public business routes)
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
// Middleware
const auth_middleware_1 = require("./middleware/auth.middleware");
// Routers
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const protected_routes_1 = __importDefault(require("./routes/protected.routes"));
const rewards_routes_1 = __importDefault(require("./routes/rewards.routes"));
const points_routes_1 = __importDefault(require("./routes/points.routes"));
const customer_routes_1 = __importDefault(require("./routes/customer.routes"));
const tiers_routes_1 = __importDefault(require("./routes/tiers.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
const businesses_routes_1 = __importDefault(require("./routes/businesses.routes")); // <-- NUEVA IMPORTACIÓN
// Cron Job
const node_cron_1 = __importDefault(require("node-cron"));
const tier_logic_service_1 = require("./tiers/tier-logic.service");
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
// Middlewares globales
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use((req, res, next) => {
    console.log(`[REQ LOG] Received: ${req.method} ${req.originalUrl}`);
    next();
});
// --- Rutas Públicas ---
// Montamos las rutas de autenticación (existente)
app.use('/auth', auth_routes_1.default);
// --- NUEVO: Montamos las rutas públicas de negocios ---
// Lo montamos aquí ANTES de aplicar la autenticación global a /api
// La ruta final será GET /public/businesses/public-list
app.use('/public/businesses', businesses_routes_1.default);
// --- FIN NUEVO ---
// --- Rutas Protegidas ---
// Aplicar auth a TODO /api/* (se ejecutará DESPUÉS de los middlewares globales y rutas públicas)
app.use('/api', auth_middleware_1.authenticateToken);
// Montar los routers específicos PROTEGIDOS bajo /api
app.use('/api/profile', protected_routes_1.default); // Rutas de perfil de usuario
app.use('/api/rewards', rewards_routes_1.default); // Rutas para gestión de recompensas (Admin)
app.use('/api/points', points_routes_1.default); // Rutas para puntos y QR (Cliente y Admin)
app.use('/api/customer', customer_routes_1.default); // Rutas específicas del cliente (ver recompensas, canjear regalos)
app.use('/api/tiers', tiers_routes_1.default); // Rutas para gestión de niveles (Admin)
app.use('/api/admin', admin_routes_1.default); // Rutas para acciones de admin sobre clientes, etc.
// NOTA: Si en el futuro añadimos rutas de negocio que SÍ requieran autenticación
// (ej: /api/businesses/settings), se montarían aquí DENTRO del bloque /api.
// --- Fin Rutas Protegidas ---
app.get('/', (req, res) => {
    res.send('Welcome to LoyalPyME API!');
});
// Manejador de errores global (sin cambios)
app.use((err, req, res, next) => {
    console.error('[GLOBAL ERROR HANDLER]', err.stack);
    res.status(500).json({ message: 'Internal Server Error', error: err.message });
});
// Cron Job (sin cambios)
node_cron_1.default.schedule('0 3 * * *', () => {
    const jobStartTime = new Date();
    console.log(`[CRON ${jobStartTime.toISOString()}] Running scheduled tier update/downgrade job...`);
    (0, tier_logic_service_1.processTierUpdatesAndDowngrades)()
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
