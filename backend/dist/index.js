"use strict";
// File: backend/src/index.ts
// Version: 1.0.0
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
// Cargar variables de entorno desde .env
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 3000; // Usar el puerto de las variables de entorno o 3000 por defecto
// Middleware para parsear JSON en el cuerpo de las peticiones
app.use(express_1.default.json());
// Ruta de prueba simple
app.get('/', (req, res) => {
    res.send('LoyalPyME Backend is running!');
});
// Iniciar el servidor
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
// End of File: backend/src/index.ts
