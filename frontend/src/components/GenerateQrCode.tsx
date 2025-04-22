// File: frontend/src/components/GenerateQrCode.tsx
// Version: 1.0.0

import React, { useState } from 'react';
import axiosInstance from '../services/axiosInstance'; // Para llamar a la API

// Interfaz para la respuesta esperada de la API /generate-qr
interface QrCodeData {
  qrToken: string;
  amount: number;
}

const GenerateQrCode: React.FC = () => {
  // Estados para los campos del formulario
  const [amount, setAmount] = useState<string>(''); // Usamos string para el input de número
  const [ticketNumber, setTicketNumber] = useState<string>('');

  // Estados para el manejo del envío y resultado
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedData, setGeneratedData] = useState<QrCodeData | null>(null); // Para guardar el resultado

  // Manejador del click en el botón "Generar"
  const handleGenerateClick = async () => {
    setError(null); // Limpiar errores previos
    setGeneratedData(null); // Limpiar datos previos

    // Validación simple del importe
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setError('El importe debe ser un número positivo.');
      return;
    }

    setIsLoading(true); // Indicar que estamos generando

    try {
      const requestData = {
        amount: numericAmount,
        // Incluir ticketNumber solo si no está vacío
        ...(ticketNumber.trim() && { ticketNumber: ticketNumber.trim() })
      };

      // Llamar al endpoint POST /points/generate-qr
      const response = await axiosInstance.post<QrCodeData>('/points/generate-qr', requestData);

      // ¡Éxito! Guardar los datos recibidos
      setGeneratedData(response.data);
      // console.log('QR Data generated:', response.data); // Descomentar para depurar
      setAmount(''); // Limpiar formulario tras éxito
      setTicketNumber('');

    } catch (err: any) {
      console.error('Error generating QR code data:', err);
      // Mostrar mensaje de error al usuario
      setError(`Error al generar QR: ${err.response?.data?.message || err.message || 'Error desconocido'}`);
    } finally {
      setIsLoading(false); // Habilitar el botón de nuevo
    }
  };

  return (
    <div> {/* Envolvemos en un div */}
      {/* Campo Importe */}
      <div style={{ marginBottom: '10px' }}>
        <label htmlFor="qrAmount" style={{ display: 'block', marginBottom: '3px' }}>Importe de la Venta (€):</label>
        <input
          type="number"
          id="qrAmount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Ej: 15.50"
          step="0.01" // Permitir decimales para euros
          min="0.01" // Mínimo importe
          required
          style={{ width: '95%', padding: '8px' }}
          disabled={isLoading}
        />
      </div>

      {/* Campo Número de Ticket (Opcional) */}
      <div style={{ marginBottom: '15px' }}>
        <label htmlFor="qrTicketNumber" style={{ display: 'block', marginBottom: '3px' }}>Número de Ticket (Opcional):</label>
        <input
          type="text"
          id="qrTicketNumber"
          value={ticketNumber}
          onChange={(e) => setTicketNumber(e.target.value)}
          placeholder="Ej: T-12345"
          style={{ width: '95%', padding: '8px' }}
          disabled={isLoading}
        />
      </div>

      {/* Botón de Generar */}
      <button onClick={handleGenerateClick} disabled={isLoading}>
        {isLoading ? 'Generando...' : 'Generar Datos QR'}
      </button>

      {/* Área de Resultados / Errores */}
      <div style={{ marginTop: '20px', padding: '10px', border: '1px solid #eee', minHeight: '50px' }}>
        {isLoading && <p>Procesando...</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {generatedData && (
          <div>
            <h4>¡Datos QR Generados!</h4>
            <p>Utiliza el siguiente token para generar la imagen del código QR:</p>
            <p><strong>Token:</strong> <code style={{ background: '#eee', padding: '2px 4px' }}>{generatedData.qrToken}</code></p>
            <p><strong>Importe asociado:</strong> {generatedData.amount.toFixed(2)} €</p>
            <small>(En un futuro, aquí se mostraría la imagen QR directamente)</small>
          </div>
        )}
         {!isLoading && !error && !generatedData && <p>Introduce un importe para generar los datos del QR.</p>}
      </div>
    </div>
  );
};

export default GenerateQrCode;

// End of File: frontend/src/components/GenerateQrCode.tsx