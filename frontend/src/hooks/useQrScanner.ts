// filename: frontend/src/hooks/useQrScanner.ts
// Version: 1.0.5 (Fix Timeout type for browser environment)

import { useState, useEffect, useRef, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeResult } from 'html5-qrcode';

// Tipos para qrbox (definidos localmente)
type QrboxFunction = (viewfinderWidth: number, viewfinderHeight: number) => { width: number, height: number };
type QrboxConfig = { width: number, height: number } | QrboxFunction;

// Configuración por defecto para el escáner
const defaultQrScannerConfig = {
    fps: 10,
    qrbox: { width: 250, height: 250 } as QrboxConfig, // Ajusta tamaño si es necesario
};

// Opciones que acepta el hook
interface UseQrScannerOptions {
    qrcodeRegionId: string; // ID del elemento HTML donde renderizar el scanner
    config?: { // Opciones de configuración para html5-qrcode
        fps?: number;
        qrbox?: QrboxConfig;
        aspectRatio?: number;
        disableFlip?: boolean;
        // ... otras opciones de Html5QrcodeScannerConfig si se necesitan
    };
    verbose?: boolean; // Para logs internos de la librería
    enabled?: boolean; // Para activar/desactivar el scanner externamente
    onScanSuccess: (decodedText: string, decodedResult: Html5QrcodeResult) => void; // Callback éxito
    onScanError?: (errorMessage: string, error: any) => void; // Callback error opcional
}

// Valor de retorno del hook
interface UseQrScannerResult {
    scannerError: string | null; // Estado de error para mostrar en la UI
    clearScannerError: () => void; // Función para limpiar el error
}

export const useQrScanner = ({
    qrcodeRegionId,
    config = {},
    verbose = false,
    enabled = false, // Controla si el scanner debe estar activo
    onScanSuccess,
    onScanError,
}: UseQrScannerOptions): UseQrScannerResult => {

    const [scannerError, setScannerError] = useState<string | null>(null);
    // Ref para mantener la instancia de Html5Qrcode entre renders
    const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
    // Ref para evitar múltiples llamadas a onScanSuccess por el mismo QR
    const lastScanSuccessRef = useRef<string | null>(null);
    // Ref para mantener las últimas versiones de los callbacks sin causar re-ejecución del effect
    const optionsRef = useRef({ onScanSuccess, onScanError });
    // Ref para el ID del timeout
    const timeoutRef = useRef<number | null>(null); // <--- TIPO CORREGIDO A number

    // Actualizar los callbacks en la ref si cambian
    useEffect(() => {
        optionsRef.current = { onScanSuccess, onScanError };
    }, [onScanSuccess, onScanError]);

    // Función para limpiar el error externamente
    const clearScannerError = useCallback(() => setScannerError(null), []);

    // Effect principal para manejar el ciclo de vida del escáner
    useEffect(() => {
        // Limpiar timeout pendiente si las dependencias cambian antes de que se ejecute
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }

        // Si el hook no está habilitado, nos aseguramos de que el scanner esté detenido
        if (!enabled) {
            if (html5QrCodeRef.current) {
                console.log("[useQrScanner] Disabled: Attempting to stop/clear scanner from previous state.");
                const scanner = html5QrCodeRef.current;
                html5QrCodeRef.current = null; // Quitamos la referencia
                // Intentar detener y limpiar, ignorando errores
                scanner.stop()
                   .then(() => scanner.clear())
                   .catch(err => console.warn("[useQrScanner] Error stopping/clearing on disable:", err));
            }
            return; // Salir del efecto
        }

        // Si está habilitado, intentamos iniciarlo después de un pequeño retraso

        // Esperar 100ms para dar tiempo a que el DOM del Modal se renderice
        timeoutRef.current = setTimeout(() => {
            timeoutRef.current = null; // Ya se ejecutó el timeout

            // Verificar si el elemento contenedor existe en el DOM
            const element = document.getElementById(qrcodeRegionId);
            if (!element) {
                console.error(`[useQrScanner] Element with ID ${qrcodeRegionId} not found (after delay).`);
                setScannerError("Error: Contenedor del escáner no encontrado.");
                return; // No continuar si no hay contenedor
            }

            // Evitar reinicializar si ya existe y está escaneando
            if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
                console.log("[useQrScanner] Scanner already initialized and scanning (after delay check).");
                return;
            }

            console.log("[useQrScanner] Initializing Html5Qrcode (after delay)...");
            setScannerError(null); // Limpiar errores previos
            lastScanSuccessRef.current = null; // Resetear último escaneo

            // Crear nueva instancia de Html5Qrcode
            const scannerInstance = new Html5Qrcode(qrcodeRegionId, { verbose: verbose });
            html5QrCodeRef.current = scannerInstance; // Guardar referencia

            // Combinar configuración por defecto y la proporcionada
            const scannerConfig = { ...defaultQrScannerConfig, ...config };

            // Definir callbacks internos que usan las refs actualizadas
            const successCallback = (decodedText: string, decodedResult: Html5QrcodeResult) => {
                // Evitar múltiples llamadas para el mismo código
                if (decodedText !== lastScanSuccessRef.current) {
                    lastScanSuccessRef.current = decodedText; // Guardar este código
                    console.log(`[useQrScanner] Code matched: ${decodedText}`);
                    setScannerError(null); // Limpiar cualquier error previo
                    // Llamar al callback del componente padre
                    optionsRef.current.onScanSuccess(decodedText, decodedResult);
                }
            };

            const errorCallback = (errorMessage: string, error: any) => {
                // Llamar al callback de error del padre si existe
                if (optionsRef.current.onScanError) {
                    optionsRef.current.onScanError(errorMessage, error);
                }
                // Podríamos querer poner el error en el estado aquí también,
                // pero puede ser muy ruidoso si la cámara no enfoca bien.
                // setScannerError(`Error de escaneo: ${errorMessage}`);
            };

            // Intentar iniciar el escáner
            scannerInstance.start(
                { facingMode: "environment" }, // Pedir cámara trasera
                scannerConfig,
                successCallback,
                errorCallback // Este callback maneja errores durante el escaneo
            )
                .then(() => {
                    console.log("[useQrScanner] Scanner started successfully (after delay).");
                })
                .catch((err) => {
                    // Este catch maneja errores AL INICIAR el scanner (permisos, cámara no encontrada)
                    console.error("[useQrScanner] Unable to start scanning (after delay).", err);
                    setScannerError(`No se pudo iniciar la cámara: ${err?.message || err}`);
                    // Intentar limpiar si la instancia se creó pero falló al iniciar
                    if (html5QrCodeRef.current) {
                        try { html5QrCodeRef.current.clear(); } catch(e){ /* ignorar */ }
                        html5QrCodeRef.current = null;
                    }
                });

        }, 100); // Retraso de 100ms

        // Función de limpieza del useEffect
        return () => {
            // Limpiar el timeout si el efecto se limpia antes de que se ejecute
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
                console.log("[useQrScanner] Cleanup: Cleared pending initialization timeout.");
            }

            console.log("[useQrScanner] Cleanup: Attempting to stop scanner...");
            lastScanSuccessRef.current = null; // Resetear último escaneo
            const scanner = html5QrCodeRef.current; // Usar la ref actual
            if (scanner) {
                html5QrCodeRef.current = null; // Limpiar la ref
                // Intentar detener y limpiar la instancia
                scanner.stop()
                    .then(() => {
                        console.log("[useQrScanner] Scanner stopped successfully.");
                        return scanner.clear(); // Limpiar recursos de la librería
                    })
                    .then(() => {
                        console.log("[useQrScanner] Scanner cleared successfully.");
                    })
                    .catch((err) => {
                        // Puede dar error si ya estaba parado, usualmente se puede ignorar
                        console.warn("[useQrScanner] Error stopping/clearing scanner during cleanup:", err);
                        // Intentar limpiar de nuevo por si acaso
                        try { scanner.clear(); } catch (e) { /* ignorar */ }
                    });
            } else {
                 console.log("[useQrScanner] Cleanup: No active scanner instance found to stop.");
            }
        };
    // Las dependencias principales son 'enabled' y 'qrcodeRegionId'
    // 'config' y 'verbose' podrían causar reinicios si sus referencias cambian,
    // pero usualmente son estáticas. Los callbacks se manejan vía ref.
    }, [enabled, qrcodeRegionId, config, verbose]);

    // Retornar el estado de error y la función para limpiarlo
    return { scannerError, clearScannerError };
};

// End of File: frontend/src/hooks/useQrScanner.ts