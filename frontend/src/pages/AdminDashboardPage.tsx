// File: frontend/src/pages/AdminDashboardPage.tsx
// Version: 1.0.4

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../services/axiosInstance';

import AddRewardForm from '../components/AddRewardForm';
import GenerateQrCode from '../components/GenerateQrCode'; // Importamos el nuevo componente

// Interfaz Reward (sin cambios)
interface Reward {
    id: string;
    name: string;
    description?: string | null;
    pointsCost: number;
    isActive: boolean;
    businessId: string;
    createdAt: string;
    updatedAt: string;
}


const AdminDashboardPage: React.FC = () => {
    const navigate = useNavigate();
    const [userName, setUserName] = useState<string | null>(null);
    const [rewards, setRewards] = useState<Reward[]>([]);
    const [loading, setLoading] = useState<boolean>(true); // Loading inicial para recompensas
    const [error, setError] = useState<string | null>(null);
    const [showAddForm, setShowAddForm] = useState<boolean>(false);

    // Función para obtener las recompensas (sin cambios)
    const fetchRewards = useCallback(async () => {
        // Solo ponemos loading a true si no hay recompensas cargadas aun
        if (rewards.length === 0) setLoading(true);
        setError(null);
        try {
            const response = await axiosInstance.get<Reward[]>('/rewards');
            setRewards(response.data);
        } catch (err: any) {
            console.error('Error fetching rewards:', err);
            setError(`Error al cargar las recompensas: ${err.response?.data?.message || err.message || 'Error desconocido'}`);
        } finally {
           if (loading) setLoading(false); // Quitar loading solo si estaba activo
        }
    }, [rewards.length, loading]); // Depende de si hay recompensas para decidir si activar loading

    useEffect(() => {
        // Obtener nombre de usuario (sin cambios)
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);
                setUserName(parsedUser.name || parsedUser.email || 'Admin');
            } catch (e) { console.error("Error parsing user data", e); setUserName('Admin'); }
        } else { setUserName('Admin'); }

        fetchRewards();

    }, [fetchRewards]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    // Función que se llama cuando una recompensa se añade (sin cambios)
    const handleRewardAdded = () => {
        setShowAddForm(false);
        fetchRewards();
    };

    // Renderizado de la lista (sin cambios)
    const renderRewardsSection = () => {
       if (loading && rewards.length === 0) {
             return <p>Cargando recompensas...</p>;
        }
        if (error && rewards.length === 0) {
            return <p style={{ color: 'red' }}>{error}</p>;
        }
         if (error && rewards.length > 0) {
             console.warn("Error refreshing rewards:", error);
         }

        return (
            <>
                {rewards.length === 0 && !loading && <p>Aún no has creado ninguna recompensa.</p>}
                {rewards.length > 0 && (
                     // Podríamos usar una tabla para mejor formato en el futuro
                    <ul style={{ listStyleType: 'disc', paddingLeft: '20px' }}>
                        {rewards.map((reward) => (
                            <li key={reward.id} style={{ marginBottom: '5px' }}>
                                <strong>{reward.name}</strong> - {reward.pointsCost} puntos
                                {reward.description && ` (${reward.description})`}
                                <em style={{ marginLeft: '10px', color: reward.isActive ? 'green' : 'grey' }}>
                                    ({reward.isActive ? 'Activa' : 'Inactiva'})
                                </em>
                                {/* TODO: Botones Editar/Activar/Desactivar */}
                            </li>
                        ))}
                    </ul>
                )}
            </>
        );
    };

    return (
        <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
            {/* Header (sin cambios) */}
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h1>Panel de Administración</h1>
                <div>
                    <span>Bienvenido, {userName || 'Administrador'}!</span>
                    <button onClick={handleLogout} style={{ marginLeft: '15px' }}>
                        Cerrar Sesión
                    </button>
                </div>
            </header>

            <main>
                <p>Este es el panel principal para gestionar tu negocio en LoyalPyME.</p>

                {/* Sección de Gestión de Recompensas (sin cambios funcionales) */}
                <section style={{ marginBottom: '30px', padding: '20px', border: '1px solid #ccc', borderRadius: '8px', background: '#f9f9f9' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                        <h2>Gestión de Recompensas</h2>
                        <button onClick={() => setShowAddForm(!showAddForm)} disabled={loading && rewards.length === 0}>
                            {showAddForm ? 'Cancelar Añadir' : 'Añadir Recompensa'}
                        </button>
                    </div>
                    {renderRewardsSection()}
                     {showAddForm && (
                         <div style={{ marginTop: '20px', padding: '20px', borderTop: '1px solid #eee', background: 'white' }}>
                             <AddRewardForm
                                 onRewardAdded={handleRewardAdded}
                                 onCancel={() => setShowAddForm(false)}
                             />
                         </div>
                     )}
                </section>

                {/* Sección de Generación de QR (AHORA CON EL COMPONENTE) */}
                <section style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px', background: '#f9f9f9' }}>
                    <h2>Generar QR de Puntos</h2>
                    {/* Reemplazamos el contenido anterior con el componente GenerateQrCode */}
                    <GenerateQrCode />
                </section>

            </main>

             {/* Footer (sin cambios) */}
            <footer style={{ marginTop: '50px', textAlign: 'center', color: '#888' }}>
                LoyalPyME v1.0 MVP
            </footer>
        </div>
    );
};

export default AdminDashboardPage;

// End of File: frontend/src/pages/AdminDashboardPage.tsx