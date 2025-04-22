// File: frontend/src/pages/CustomerDashboardPage.tsx
// Version: 1.0.5 (Add Logout Logs - REALLY Full Code)

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../services/axiosInstance';

// Interfaz para los datos del usuario (completa)
interface UserData {
  id: string;
  email: string;
  name?: string | null; // Nombre puede ser opcional/nulo
  phone?: string | null; // Teléfono puede ser opcional/nulo
  role: 'CUSTOMER_FINAL'; // Sabemos que es cliente
  isActive: boolean;
  businessId: string; // ID del negocio al que pertenece
  points: number; // Los puntos del cliente
  marketingOptIn: boolean;
  createdAt: string; // Prisma devuelve fechas como strings ISO
  updatedAt: string;
}

// Interfaz para las Recompensas (completa)
interface Reward {
    id: string;
    businessId: string; // Coincidirá con el del UserData
    name: string;
    description?: string | null; // Puede ser null
    pointsCost: number;
    isActive: boolean; // La filtramos en el frontend si es necesario
    createdAt: string;
    updatedAt: string;
}

const CustomerDashboardPage: React.FC = () => {
    const navigate = useNavigate();
    // Estado: Inicializar TODO a null o vacío. Se llenará desde la API.
    const [userData, setUserData] = useState<UserData | null>(null);
    const [rewards, setRewards] = useState<Reward[]>([]);
    const [qrTokenInput, setQrTokenInput] = useState<string>('');
    const [validationResult, setValidationResult] = useState<string | null>(null);
    const [validationResultType, setValidationResultType] = useState<'success' | 'error' | null>(null);
    const [isLoadingData, setIsLoadingData] = useState<boolean>(true);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [isSubmittingQr, setIsSubmittingQr] = useState<boolean>(false);

    // fetchInitialData estable (sin cambios)
     const stableFetchInitialData = useCallback(async () => {
         setIsLoadingData(true);
         setFetchError(null);
         try {
             console.log('FETCHING (stable): /api/profile and /api/rewards');
             const [profileResponse, rewardsResponse] = await Promise.all([
                 axiosInstance.get<UserData>('/profile'),
                 axiosInstance.get<Reward[]>('/rewards')
             ]);
             console.log('FETCH OK (stable): Profile:', profileResponse.data);
             console.log('FETCH OK (stable): Rewards:', rewardsResponse.data);
             setUserData(profileResponse.data);
             setRewards(rewardsResponse.data.filter(reward => reward.isActive));
         } catch (err: any) {
             console.error('FETCH ERROR (stable):', err);
             let errorMessage = 'Error al cargar los datos.';
             if (err.response) { errorMessage = `Error ${err.response.status}: ${err.response.data?.message || err.message || 'No se pudo obtener datos.'}`; }
             else if (err.request) { errorMessage = 'No se pudo conectar con el servidor.'; }
             else { errorMessage = `Error en la petición: ${err.message}`; }
             setFetchError(errorMessage);
             // Ya no usamos fallback a localStorage aquí
         } finally {
             setIsLoadingData(false);
         }
     }, []); // <-- Array vacío es la clave

    useEffect(() => {
        stableFetchInitialData();
    }, [stableFetchInitialData]);

    // handleQrValidationSubmit (sin cambios)
    const handleQrValidationSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
         event.preventDefault();
         setValidationResult(null); setValidationResultType(null);
         if (!qrTokenInput.trim()) { setValidationResult('Por favor, introduce un código QR.'); setValidationResultType('error'); return; }
         setIsSubmittingQr(true);
         try {
             const response = await axiosInstance.post<{ message: string; pointsEarned: number }>('/points/validate-qr', { qrToken: qrTokenInput.trim() });
             setValidationResult(`${response.data.message} (${response.data.pointsEarned} puntos)`);
             setValidationResultType('success');
             setQrTokenInput('');
             await stableFetchInitialData(); // Refrescar
         } catch (err: any) {
             console.error('Error validating QR code:', err);
             setValidationResult(`Error al validar: ${err.response?.data?.message || err.message || 'Error desconocido'}`);
             setValidationResultType('error');
         } finally {
             setIsSubmittingQr(false);
         }
     };

    // handleLogout con logs (sin cambios)
    const handleLogout = () => {
        console.log("Botón Cerrar Sesión CLICADO."); // <-- LOG 1
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        console.log("localStorage limpiado, NAVEGANDO a /login..."); // <-- LOG 2
        navigate('/login'); // Intenta navegar
    };

    // --- Renderizado COMPLETO ---
    return (
        <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
            {/* Header */}
             <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                 <h1>Bienvenido, {userData?.name || userData?.email || JSON.parse(localStorage.getItem('user') || '{}')?.email || 'Cliente'}!</h1>
                <button onClick={handleLogout}>Cerrar Sesión</button>
            </header>

            {/* Mensaje de Error General */}
            {fetchError && ( <p style={{ color: 'red', border: '1px solid red', padding: '10px', marginBottom: '15px' }}> Error al cargar datos: {fetchError} </p> )}

            {/* Contenido Principal */}
            <main>
                 {/* Sección de Puntos */}
                 <section style={{ marginBottom: '30px', padding: '20px', border: '1px solid #ccc', borderRadius: '8px', background: '#eef' }}>
                     <h2>Tus Puntos</h2>
                     <p style={{ fontSize: '1.5em', fontWeight: 'bold' }}> {isLoadingData && !userData ? 'Cargando...' : (userData?.points ?? 'No disponible')} Puntos </p>
                 </section>

                 {/* Sección Validar QR */}
                 <section style={{ marginBottom: '30px', padding: '20px', border: '1px solid #ccc', borderRadius: '8px', background: '#f9f9f9' }}>
                      <h2>Validar Código QR</h2>
                      {/* Formulario QR completo */}
                      <form onSubmit={handleQrValidationSubmit}>
                           <label htmlFor="qrToken" style={{ marginRight: '10px' }}>Introduce el código:</label>
                           <input
                               type="text"
                               id="qrToken"
                               value={qrTokenInput}
                               onChange={(e) => setQrTokenInput(e.target.value)}
                               placeholder="Pega el código aquí"
                               required
                               disabled={isSubmittingQr}
                               style={{ padding: '8px', marginRight: '10px', minWidth: '250px' }}
                            />
                           <button type="submit" disabled={isSubmittingQr}>
                               {isSubmittingQr ? 'Validando...' : 'Validar Puntos'}
                           </button>
                      </form>
                      {/* Resultado validación */}
                      {validationResult && <p style={{ marginTop: '10px', color: validationResultType === 'error' ? 'red' : 'green' }}>{validationResult}</p>}
                  </section>

                 {/* Sección Recompensas Disponibles */}
                 <section style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px', background: '#f9f9f9' }}>
                      <h2>Recompensas Disponibles</h2>
                      {isLoadingData && rewards.length === 0 && <p>Cargando recompensas...</p>}
                      {!isLoadingData && rewards.length === 0 && !fetchError && <p>No hay recompensas activas disponibles.</p>}
                      {rewards.length > 0 && (
                         <ul style={{ listStyleType: 'disc', paddingLeft: '20px' }}>
                             {/* Mapeo y renderizado de cada recompensa */}
                             {rewards.map((reward) => (
                                 <li key={reward.id} style={{ marginBottom: '5px', opacity: userData && userData.points >= reward.pointsCost ? 1 : 0.5 }}>
                                     <strong>{reward.name}</strong> - {reward.pointsCost} puntos
                                     {reward.description && ` (${reward.description})`}
                                     {/* Botón Canjear (placeholder) */}
                                      {userData && userData.points >= reward.pointsCost && (
                                          <button style={{ marginLeft: '10px', fontSize: '0.8em', padding: '2px 5px' }} disabled>Canjear (Próx.)</button>
                                      )}
                                 </li>
                             ))}
                         </ul>
                      )}
                  </section>
             </main>

            {/* Footer */}
            <footer style={{ marginTop: '50px', textAlign: 'center', color: '#888' }}>LoyalPyME v1.0 MVP</footer>
        </div>
    );
};

export default CustomerDashboardPage;

// End of File: frontend/src/pages/CustomerDashboardPage.tsx