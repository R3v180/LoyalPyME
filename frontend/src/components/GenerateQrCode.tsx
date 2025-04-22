// File: frontend/src/components/GenerateQrCode.tsx
// Version: 1.0.1 (Make ticketNumber mandatory - Full Code)

import React, { useState } from 'react';
import axiosInstance from '../services/axiosInstance'; // Para llamar a la API

// Interfaz para la respuesta esperada de la API /generate-qr
interface QrCodeData {
  qrToken: string;
  amount: number;
}

const GenerateQrCode: React.FC = () => {
  // Estados para los campos del formulario
  const [amount, setAmount] = useState<string>('');
  const [ticketNumber, setTicketNumber] = useState<string>('');

  // Estados para el manejo del envío y resultado
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedData, setGeneratedData] = useState<QrCodeData | null>(null); // Para guardar el resultado

  // Manejador del click en el botón "Generar"
  const handleGenerateClick = async () => {
    setError(null);
    setGeneratedData(null);

    // Validación actualizada (incluye ticketNumber)
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setError('El importe debe ser un número positivo.');
      return;
    }
    if (!ticketNumber || ticketNumber.trim() === '') {
        setError('El número de ticket es obligatorio.');
        return;
    }

    setIsLoading(true);

    try {
      // ticketNumber siempre se envía ahora
      const requestData = {
        amount: numericAmount,
        ticketNumber: ticketNumber.trim()
      };

      const response = await axiosInstance.post<QrCodeData>('/points/generate-qr', requestData);

      setGeneratedData(response.data);
      setAmount(''); // Limpiar formulario tras éxito
      setTicketNumber('');

    } catch (err: any) {
      console.error('Error generating QR code data:', err);
      setError(`Error al generar QR: ${err.response?.data?.message || err.message || 'Error desconocido'}`);
    } finally {
      setIsLoading(false);
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
          step="0.01"
          min="0.01"
          required
          style={{ width: '95%', padding: '8px' }}
          disabled={isLoading}
        />
      </div>

      {/* Campo Número de Ticket (Ahora obligatorio) */}
      <div style={{ marginBottom: '15px' }}>
        <label htmlFor="qrTicketNumber" style={{ display: 'block', marginBottom: '3px' }}>Número de Ticket:</label>
        <input
          type="text"
          id="qrTicketNumber"
          value={ticketNumber}
          onChange={(e) => setTicketNumber(e.target.value)}
          placeholder="Ej: T-12345"
          required // Hecho obligatorio
          style={{ width: '95%', padding: '8px' }}
          disabled={isLoading}
        />
      </div>

      {/* Botón de Generar */}
      <button onClick={handleGenerateClick} disabled={isLoading}>
        {isLoading ? 'Generando...' : 'Generar Datos QR'}
      </button>

      {/* --- Área de Resultados / Errores (COMPLETA) --- */}
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
         {/* Mensaje inicial o si no hay datos/error/carga */}
         {!isLoading && !error && !generatedData && (
             <p>Introduce importe y número de ticket para generar los datos del QR.</p>
         )}
      </div>
      {/* --- FIN Área de Resultados --- */}
    </div>
  );
};

export default GenerateQrCode;

// End of File: frontend/src/components/GenerateQrCode.tsx