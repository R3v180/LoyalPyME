// File: frontend/src/components/AddRewardForm.tsx
// Version: 1.0.0

import React, { useState } from 'react';
import axiosInstance from '../services/axiosInstance'; // Para llamar a la API

// Definimos las props que este componente espera recibir
interface AddRewardFormProps {
  onRewardAdded: () => void; // Función a llamar cuando se añade una recompensa
  onCancel: () => void;      // Función a llamar para cancelar/cerrar el formulario
}

const AddRewardForm: React.FC<AddRewardFormProps> = ({ onRewardAdded, onCancel }) => {
  // Estados para los campos del formulario
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [pointsCost, setPointsCost] = useState<string>(''); // Usamos string para el input, luego convertimos

  // Estados para el manejo del envío
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false); // Para deshabilitar el botón mientras se envía
  const [error, setError] = useState<string | null>(null); // Para mostrar errores al usuario

  // Manejador del envío del formulario
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); // Prevenir recarga de la página
    setError(null); // Limpiar errores previos

    // Validación simple
    const cost = parseInt(pointsCost, 10);
    if (!name.trim()) {
      setError('El nombre de la recompensa es obligatorio.');
      return;
    }
    if (isNaN(cost) || cost < 0) {
      setError('El coste en puntos debe ser un número igual o mayor que cero.');
      return;
    }

    setIsSubmitting(true); // Indicar que estamos enviando

    try {
      // Crear el objeto de datos para enviar a la API
      const rewardData = {
        name: name.trim(),
        description: description.trim() || null, // Enviar null si está vacío
        pointsCost: cost,
      };

      // Llamar al endpoint POST /rewards usando nuestra instancia de Axios
      // El token se añade automáticamente
      await axiosInstance.post('/rewards', rewardData);

      // ¡Éxito!
      // console.log('Reward added successfully'); // Descomentar para depurar
      setName(''); // Limpiar formulario
      setDescription('');
      setPointsCost('');
      onRewardAdded(); // Llamar a la función del padre para que refresque la lista y cierre el form

    } catch (err: any) {
      console.error('Error adding reward:', err);
      // Mostrar mensaje de error al usuario
      setError(`Error al añadir la recompensa: ${err.response?.data?.message || err.message || 'Error desconocido'}`);
    } finally {
      setIsSubmitting(false); // Habilitar el botón de nuevo
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Campo Nombre */}
      <div style={{ marginBottom: '10px' }}>
        <label htmlFor="rewardName" style={{ display: 'block', marginBottom: '3px' }}>Nombre:</label>
        <input
          type="text"
          id="rewardName"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          style={{ width: '95%', padding: '8px' }} // Ajustado ancho
          disabled={isSubmitting}
        />
      </div>

      {/* Campo Descripción */}
      <div style={{ marginBottom: '10px' }}>
        <label htmlFor="rewardDescription" style={{ display: 'block', marginBottom: '3px' }}>Descripción (Opcional):</label>
        <textarea
          id="rewardDescription"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          style={{ width: '95%', padding: '8px' }} // Ajustado ancho
          disabled={isSubmitting}
        />
      </div>

      {/* Campo Coste en Puntos */}
      <div style={{ marginBottom: '15px' }}>
        <label htmlFor="rewardPointsCost" style={{ display: 'block', marginBottom: '3px' }}>Coste en Puntos:</label>
        <input
          type="number"
          id="rewardPointsCost"
          value={pointsCost}
          onChange={(e) => setPointsCost(e.target.value)}
          required
          min="0" // No permitir puntos negativos
          style={{ width: '95%', padding: '8px' }} // Ajustado ancho
          disabled={isSubmitting}
        />
      </div>

      {/* Mostrar errores si existen */}
      {error && <p style={{ color: 'red', marginBottom: '10px' }}>{error}</p>}

      {/* Botones */}
      <div>
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Añadiendo...' : 'Añadir Recompensa'}
        </button>
        {/* Botón Cancelar llama a la prop onCancel */}
        <button type="button" onClick={onCancel} disabled={isSubmitting} style={{ marginLeft: '10px' }}>
          Cancelar
        </button>
      </div>
    </form>
  );
};

export default AddRewardForm;

// End of File: frontend/src/components/AddRewardForm.tsx