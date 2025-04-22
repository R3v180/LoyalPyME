// File: frontend/src/components/AddRewardForm.tsx
// Version: 1.1.0 (Refactored with Mantine Components)

import { useState, FormEvent } from 'react'; // Quitamos React si no se usa
import axiosInstance from '../services/axiosInstance';

// --- Mantine Imports ---
import {
  TextInput,
  Textarea,    // Para la descripción
  NumberInput, // Para los puntos
  Button,
  Stack,       // Para organizar verticalmente
  Group,       // Para los botones
  Alert        // Para errores
} from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react'; // Para icono de error

// Props del componente (sin cambios)
interface AddRewardFormProps {
  onRewardAdded: () => void;
  onCancel: () => void;
}

const AddRewardForm: React.FC<AddRewardFormProps> = ({ onRewardAdded, onCancel }) => {
  // Estados (ajustamos pointsCost)
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [pointsCost, setPointsCost] = useState<number | ''>(''); // number | '' para NumberInput
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    // Validación (pointsCost ya es number o '')
    if (!name.trim()) {
      setError('El nombre de la recompensa es obligatorio.');
      return;
    }
    // Permitimos 0 puntos ahora con min={0} en NumberInput
    if (pointsCost === '' || pointsCost < 0) {
      setError('El coste en puntos debe ser un número igual o mayor que cero.');
      return;
    }

    setIsSubmitting(true);

    try {
      const rewardData = {
        name: name.trim(),
        description: description.trim() || null,
        pointsCost: pointsCost, // Ya es número
      };

      await axiosInstance.post('/rewards', rewardData);

      // Éxito
      setName('');
      setDescription('');
      setPointsCost('');
      onRewardAdded(); // Llama al padre

    } catch (err: any) {
      console.error('Error adding reward:', err);
      setError(`Error al añadir la recompensa: ${err.response?.data?.message || err.message || 'Error desconocido'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    // Usamos el <form> de HTML pero los componentes internos son de Mantine
    <form onSubmit={handleSubmit}>
      {/* Stack organiza los campos verticalmente */}
      <Stack gap="md">
        <TextInput
          label="Nombre de la Recompensa:"
          placeholder="Ej: Café Gratis"
          value={name}
          onChange={(e) => setName(e.currentTarget.value)}
          required
          disabled={isSubmitting}
          radius="lg" // Aplicar radio del tema
        />

        <Textarea
          label="Descripción (Opcional):"
          placeholder="Ej: Un café espresso o americano"
          value={description}
          onChange={(e) => setDescription(e.currentTarget.value)}
          rows={3}
          disabled={isSubmitting}
          radius="lg"
        />

        <NumberInput
          label="Coste en Puntos:"
          placeholder="Ej: 100"
          value={pointsCost}
          // Usamos el mismo handler que corregimos en GenerateQrCode
          onChange={(value) => setPointsCost(typeof value === 'number' ? value : '')}
          min={0}       // Permitir 0 puntos
          step={1}      // Incrementar de 1 en 1
          allowDecimal={false} // No permitir decimales
          required
          disabled={isSubmitting}
          radius="lg"
        />

        {/* Mostrar errores con Alert */}
        {error && (
          <Alert
             icon={<IconAlertCircle size={16} />}
             title="Error"
             color="red"
             radius="lg"
             withCloseButton={false} // Quitamos botón de cerrar para simplicidad
          >
            {error}
          </Alert>
        )}

        {/* Grupo para alinear los botones al final */}
        <Group justify="flex-end" mt="md">
          {/* Botón Cancelar (variante 'light' o 'outline' para diferenciarlo) */}
          <Button variant="light" onClick={onCancel} disabled={isSubmitting} radius="lg">
            Cancelar
          </Button>
          {/* Botón Añadir (principal) */}
          <Button type="submit" loading={isSubmitting} radius="lg">
            Añadir Recompensa
          </Button>
        </Group>
      </Stack>
    </form>
  );
};

export default AddRewardForm;

// End of File: frontend/src/components/AddRewardForm.tsx