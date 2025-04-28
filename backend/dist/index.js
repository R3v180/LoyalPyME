"use strict";
// filename: backend/src/index.ts
// Version: 1.3.0 (Apply auth middleware individually, mount authRouter under /api)
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const client_1 = require("@prisma/client"); // Import UserRole
// Middleware
const auth_middleware_1 = require("./middleware/auth.middleware");
const role_middleware_1 = require("./middleware/role.middleware"); // Import checkRole
// Routers
const auth_routes_1 = __importDefault(require("./routes/auth.routes")); // Contiene /login, /register, /forgot-password, etc.
const protected_routes_1 = __importDefault(require("./routes/protected.routes")); // Contiene /profile
const rewards_routes_1 = __importDefault(require("./routes/rewards.routes")); // Gestión Recompensas (Admin)
const points_routes_1 = __importDefault(require("./routes/points.routes")); // Puntos y QR (Cliente/Admin)
const customer_routes_1 = __importDefault(require("./routes/customer.routes")); // Acciones Cliente (ver recompensas, canjear regalo)
const tiers_routes_1 = __importDefault(require("./routes/tiers.routes")); // Gestión Niveles (Admin)
const admin_routes_1 = __importDefault(require("./routes/admin.routes")); // Acciones Admin sobre clientes, stats
const businesses_routes_1 = __importDefault(require("./routes/businesses.routes")); // Contiene /public-list
// Cron Job Logic
const node_cron_1 = __importDefault(require("node-cron"));
const tier_logic_service_1 = require("./tiers/tier-logic.service"); // Asegúrate que la ruta es correcta
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
// Rutas que NO requieren token JWT
// Montamos authRouter bajo /api/auth para que funcione con el proxy y axiosInstance del frontend
// Se monta ANTES de aplicar authenticateToken a otras rutas /api
app.use('/api/auth', auth_routes_1.default); // Rutas como /api/auth/login, /api/auth/register ahora
// Montamos las rutas públicas de negocios
app.use('/public/businesses', businesses_routes_1.default); // Ruta GET /public/businesses/public-list
// --- Rutas Protegidas ---
// Aplicar auth y roles a las rutas específicas bajo /api
// Aplicamos authenticateToken (y checkRole si aplica) INDIVIDUALMENTE a cada router protegido:
app.use('/api/profile', auth_middleware_1.authenticateToken, protected_routes_1.default); // Requiere token, cualquier rol logueado
app.use('/api/rewards', auth_middleware_1.authenticateToken, (0, role_middleware_1.checkRole)([client_1.UserRole.BUSINESS_ADMIN]), rewards_routes_1.default); // Requiere token + rol Admin
app.use('/api/points', auth_middleware_1.authenticateToken, points_routes_1.default); // Requiere token. Roles se chequean dentro de las rutas si es necesario
app.use('/api/customer', auth_middleware_1.authenticateToken, (0, role_middleware_1.checkRole)([client_1.UserRole.CUSTOMER_FINAL]), customer_routes_1.default); // Requiere token + rol Cliente
app.use('/api/tiers', auth_middleware_1.authenticateToken, (0, role_middleware_1.checkRole)([client_1.UserRole.BUSINESS_ADMIN]), tiers_routes_1.default); // Requiere token + rol Admin
app.use('/api/admin', auth_middleware_1.authenticateToken, (0, role_middleware_1.checkRole)([client_1.UserRole.BUSINESS_ADMIN]), admin_routes_1.default); // Requiere token + rol Admin
// --- Fin Rutas Protegidas ---
// Ruta raíz básica
app.get('/', (req, res) => {
    res.send('Welcome to LoyalPyME API!');
});
// Manejador de errores global
app.use((err, req, res, next) => {
    console.error('[GLOBAL ERROR HANDLER]', err.stack); // Loguear el stack completo
    res.status(500).json({ message: 'Internal Server Error', error: err.message });
});
// Cron Job (Código Completo)
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
    // timezone: "Europe/Madrid" // Descomentar si quieres especificar zona horaria
});
console.log('Scheduled Tier update/downgrade job registered to run daily at 3:00 AM.');
// Iniciar servidor
app.listen(port, () => {
    console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});
// End of file: backend/src/index.ts
