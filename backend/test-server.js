// File: backend/test-server.js
// Servidor Express mínimo para pruebas - Puerto 3001

const express = require('express');
const app = express();
const port = 3001; // <-- CAMBIADO A 3001

app.get('/', (req, res) => {
  res.send(`¡Servidor de prueba mínimo funcionando en puerto ${port}!`);
});

app.listen(port, () => {
  console.log(`Servidor de PRUEBA escuchando en http://localhost:${port}`); // Mensaje actualizado
  console.log('Este proceso DEBERÍA quedarse corriendo. Presiona Ctrl+C para salir.');
});

process.on('exit', (code) => {
  console.log(`[TEST SERVER ${port}] Proceso saliendo con código: ${code}`);
});
process.on('beforeExit', (code) => {
    console.log(`[TEST SERVER ${port}] Evento 'beforeExit' detectado con código: ${code}`);
});