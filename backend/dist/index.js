"use strict";
// File: backend/src/index.ts
// Version: 1.1.0 (Mount Tier routes and schedule Tier update job)
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
// Middleware
const auth_middleware_1 = require("./middleware/auth.middleware"); // Middleware global de autenticación para /api
// Routers
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const protected_routes_1 = __importDefault(require("./routes/protected.routes"));
const rewards_routes_1 = __importDefault(require("./routes/rewards.routes")); // Asumo que existe
const points_routes_1 = __importDefault(require("./routes/points.routes")); // Asumo que existe
const customer_routes_1 = __importDefault(require("./routes/customer.routes")); // Asumo que existe
// NUEVO: Importar tierRouter
const tiers_routes_1 = __importDefault(require("./routes/tiers.routes"));
// NUEVO: Importar cron y función del job
const node_cron_1 = __importDefault(require("node-cron"));
const tier_logic_service_1 = require("./tiers/tier-logic.service"); // Asegúrate que la ruta sea correcta
dotenv_1.default.config(); // Cargar variables de entorno de .env
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
// Middlewares globales
app.use((0, cors_1.default)()); // Habilitar CORS para todas las rutas
app.use(express_1.default.json()); // Parsear bodies JSON
// Rutas Públicas (Autenticación)
app.use('/auth', auth_routes_1.default);
// --- Rutas Protegidas ---
// Aplicar middleware authenticateToken a todas las rutas bajo /api
app.use('/api', auth_middleware_1.authenticateToken);
// Montar los routers específicos bajo /api
app.use('/api/profile', protected_routes_1.default); // Ejemplo ruta protegida simple
app.use('/api/rewards', rewards_routes_1.default); // Rutas para gestión de recompensas (Admin)
app.use('/api/points', points_routes_1.default); // Rutas para puntos y QR (Admin/Customer)
app.use('/api/customer', customer_routes_1.default); // Rutas específicas del cliente
// NUEVO: Montar las rutas de Tiers bajo /api/tiers
// Las rutas definidas en tiers.routes.ts serán relativas a esto
// Ej: GET /api/tiers/config, POST /api/tiers/tiers, GET /api/tiers/customer/tiers
app.use('/api/tiers', tiers_routes_1.default);
// --- Fin Rutas Protegidas ---
// Ruta raíz de bienvenida (opcional)
app.get('/', (req, res) => {
    res.send('Welcome to LoyalPyME API!');
});
// Manejador de errores global simple (opcional, mejorar si es necesario)
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Internal Server Error', error: err.message });
});
// --- NUEVO: Programar Tarea de Actualización/Descenso de Tiers ---
// Se ejecuta todos los días a las 3:00 AM (zona horaria del servidor)
// Formato cron: minuto hora día-mes mes día-semana
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
    // timezone: "Europe/Madrid" // Descomentar y ajustar si tu servidor está en otra zona horaria
});
console.log('Scheduled Tier update/downgrade job registered to run daily at 3:00 AM.');
// --- FIN NUEVO ---
// Iniciar servidor
app.listen(port, () => {
    console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});
