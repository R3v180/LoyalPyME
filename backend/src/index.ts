// File: backend/src/index.ts
// Version: 1.0.8

import express, { Router } from 'express'; // Importa 'express' como default y 'Router'
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client'; // Importa PrismaClient
import cors from 'cors'; // NUEVO: Importa el middleware cors

// Importa los routers de rutas
import authRoutes from './routes/auth.routes';         // Rutas de autenticacion (publicas)
import protectedRoutes from './routes/protected.routes'; // Router para rutas protegidas generales (ej: /profile)
import rewardsRoutes from './routes/rewards.routes';     // Router para la gestion de recompensas
import pointsRoutes from './routes/points.routes';       // Router para la gestion de puntos/QR


// Importa el middleware de autenticacion para aplicarlo a grupos de rutas
import { authenticateToken } from './middleware/auth.middleware';


// Cargar variables de entorno desde .env en process.env
dotenv.config();

// Validar que JWT_SECRET esta definido al iniciar la aplicacion
if (!process.env.JWT_SECRET) {
    console.error('FATAL ERROR: JWT_SECRET is not defined. Application cannot run without a secret key.');
    // En un entorno real, aqui saldrias del proceso para evitar que la app se inicie en un estado inseguro.
    // process.exit(1); // Comentado para permitir que nodemon intente reiniciar en desarrollo.
}


const app = express();
// Usar el puerto de las variables de entorno (si existe) o 3000 por defecto
const port = process.env.PORT || 3000;

// Crea una nueva instancia de PrismaClient para interactuar con la base de datos
const prisma = new PrismaClient();


// --- Middlewares Globales ---
// Middleware para parsear el cuerpo de las peticiones entrantes con formato JSON
app.use(express.json());

// NUEVO: Configurar y usar el middleware CORS
// Esto permitira que el frontend en http://localhost:5173 haga peticiones al backend
app.use(cors({
  origin: 'http://localhost:5173', // Permite peticiones solo desde este origen
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], // Métodos HTTP permitidos
   allowedHeaders: ['Content-Type', 'Authorization'] // Cabeceras permitidas (necesario para el token JWT)
}));


// --- Rutas PUBLICAS (no requieren autenticacion) ---
// Montar las rutas de autenticación bajo el prefijo '/auth'
// Las rutas dentro de authRoutes (como /register, /login) NO estan protegidas por authenticateToken
app.use('/auth', authRoutes);

// Ruta de prueba simple para verificar que el backend esta corriendo
app.get('/', (req, res) => {
  res.send('LoyalPyME Backend is running!');
});

// Ruta de prueba para obtener todos los negocios (no protegida por ahora)
// Podria ser publica (ej: mostrar lista de negocios en un directorio) o protegida
// Por ahora, la dejamos publica
app.get('/businesses', async (req, res) => {
  try {
    // Consulta todos los negocios en la BD usando Prisma Client
    const businesses = await prisma.business.findMany();
    // Envia el resultado como JSON
    res.json(businesses);
  } catch (error) {
    // Manejo de errores de la consulta a BD
    console.error('Error fetching businesses:', error);
    res.status(500).json({ error: 'An error occurred while fetching businesses.' });
  }
});


// --- Rutas PROTEGIDAS (requieren autenticacion via JWT) ---
// Creamos un router especifico para agrupar todas las rutas que requieren autenticacion.
// Esto permite aplicar middlewares a todo el grupo de rutas de forma eficiente.
const apiRouter = Router();

// Aplicamos el middleware de autenticacion a TODAS las rutas que seran montadas en apiRouter.
// TODAS las rutas que se definan en los routers montados AQUI abajo requeriran un JWT valido.
apiRouter.use(authenticateToken);

// Montar los routers de rutas protegidas DENTRO del apiRouter.
// Las rutas de protectedRoutes estaran bajo /api/profile/*
// Las rutas de rewardsRoutes estaran bajo /api/rewards/*
// Las rutas de pointsRoutes estaran bajo /api/points/*
apiRouter.use('/profile', protectedRoutes); // Ejemplo: GET /api/profile
apiRouter.use('/rewards', rewardsRoutes);   // Ejemplo: POST /api/rewards, GET /api/rewards, etc.
apiRouter.use('/points', pointsRoutes);     // Ejemplo: POST /api/points/generate-qr, POST /api/points/validate-qr


// Montar el apiRouter principal (que contiene todas las rutas protegidas) bajo el prefijo '/api'
app.use('/api', apiRouter);


// --- Inicio del Servidor ---
// Iniciar el servidor Express en el puerto especificado
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

// --- Manejo de eventos del proceso ---
// Cierre elegante de la conexión de Prisma Client cuando la aplicación Node.js se detiene
process.on('beforeExit', async () => {
  console.log('Shutting down server and disconnecting Prisma Client...');
  await prisma.$disconnect();
  console.log('Prisma Client disconnected.');
});

// Manejo de errores no capturados (buena practica para produccion)
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Aplicacion debe reiniciarse o manejar esto adecuadamente
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Aplicacion debe reiniciarse
  // process.exit(1); // Salir del proceso en produccion
});


// End of File: backend/src/index.ts