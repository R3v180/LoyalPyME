"use strict";
// File: backend/src/index.ts
// Version: 1.0.20 (Mount customer routes - Clean Code)
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importStar(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const client_1 = require("@prisma/client");
const cors_1 = __importDefault(require("cors"));
// Importa los routers
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const protected_routes_1 = __importDefault(require("./routes/protected.routes"));
const rewards_routes_1 = __importDefault(require("./routes/rewards.routes"));
const points_routes_1 = __importDefault(require("./routes/points.routes"));
const customer_routes_1 = __importDefault(require("./routes/customer.routes")); // <-- Importa el nuevo
// Importa el middleware de autenticacion
const auth_middleware_1 = require("./middleware/auth.middleware");
dotenv_1.default.config();
if (!process.env.JWT_SECRET) {
    console.error('FATAL ERROR: JWT_SECRET is not defined.');
    process.exit(1);
}
const app = (0, express_1.default)();
const port = process.env.PORT || 3000; // Puerto 3000
let prisma;
try {
    console.log('[INIT] Initializing PrismaClient...');
    prisma = new client_1.PrismaClient();
    console.log('[INIT] PrismaClient initialized.');
}
catch (error) {
    console.error('[FATAL INIT ERROR] Error initializing PrismaClient:', error);
    process.exit(1);
}
// Middlewares Globales
app.use(express_1.default.json());
app.use((0, cors_1.default)({ origin: 'http://localhost:5173', methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'], allowedHeaders: ['Content-Type', 'Authorization'] }));
// Rutas PUBLICAS
app.use('/auth', auth_routes_1.default);
app.get('/', (req, res) => { res.send(`LoyalPyME Backend is running on port ${port}!`); });
app.get('/businesses', async (req, res) => { try {
    if (!prisma)
        throw new Error("Prisma client not initialized");
    const businesses = await prisma.business.findMany();
    res.json(businesses);
}
catch (error) {
    console.error('Error fetching businesses:', error);
    res.status(500).json({ error: 'Server error' });
} });
// Rutas PROTEGIDAS (/api)
const apiRouter = (0, express_1.Router)();
apiRouter.use(auth_middleware_1.authenticateToken); // Auth global para /api
apiRouter.use('/profile', protected_routes_1.default);
apiRouter.use('/rewards', rewards_routes_1.default); // Solo Admin (protegido por role middleware dentro)
apiRouter.use('/points', points_routes_1.default); // Roles mixtos (protegido por role middleware dentro)
apiRouter.use('/customer', customer_routes_1.default); // <-- NUEVO: Montar customerRoutes en /api/customer
app.use('/api', apiRouter);
// Inicio del Servidor
app.listen(port, () => { console.log(`Server is running on http://localhost:${port}`); });
// Manejo de eventos del proceso
process.on('beforeExit', async () => { console.log('Shutting down server and disconnecting Prisma Client...'); if (prisma) {
    await prisma.$disconnect();
    console.log('Prisma Client disconnected.');
} });
process.on('unhandledRejection', (reason, promise) => { console.error('Unhandled Rejection at:', promise, 'reason:', reason); });
process.on('uncaughtException', (error) => { console.error('Uncaught Exception:', error); /* process.exit(1); */ });
// End of File: backend/src/index.ts
