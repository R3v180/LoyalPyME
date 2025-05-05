// filename: frontend/src/hooks/useQrScanner.ts
// Version: 1.2.1 (Fix type errors and unused warnings)

import { useState, useEffect, useRef, useCallback } from 'react';
// --- MODIFICADO: Eliminar Html5QrcodeError y Html5QrcodeResult ---
import {
    Html5Qrcode,
    // Html5QrcodeError, // <-- Eliminado
    // Html5QrcodeResult, // <-- Eliminado
    QrcodeSuccessCallback,
    QrcodeErrorCallback
} from 'html5-qrcode';
import type { Html5QrcodeScannerConfig } from 'html5-qrcode/html5-qrcode-scanner';

// Props del Hook (sin cambios)
interface UseQrScannerProps {
    qrcodeRegionId: string;
    enabled: boolean;
    onScanSuccess: QrcodeSuccessCallback;
    onScanError?: QrcodeErrorCallback;
    config?: Omit<Html5QrcodeScannerConfig, 'fps' | 'qrbox'> & { fps?: number; qrbox?: { width: number; height: number; } | number };
    verbose?: boolean;
}

// Tipo de Retorno del Hook (sin cambios)
export interface UseQrScannerReturn {
    scannerError: string | null;
    clearScannerError: () => void;
    isScanning: boolean;
}

export const useQrScanner = ({
    qrcodeRegionId,
    enabled,
    onScanSuccess,
    // --- MODIFICADO: Prefijar errorMessage no usado ---
    onScanError = (_errorMessage) => { /* No hacer nada por defecto */ },
    // --- FIN MODIFICADO ---
    config = {},
    verbose = false,
}: UseQrScannerProps): UseQrScannerReturn => {
    const [scannerError, setScannerError] = useState<string | null>(null);
    const [isScanning, setIsScanning] = useState<boolean>(false);
    const scannerInstanceRef = useRef<Html5Qrcode | null>(null);
    // --- MODIFICADO: Cambiar tipo de Timeout a number ---
    const initTimeoutRef = useRef<number | null>(null); // <- Tipo number
    // --- FIN MODIFICADO ---
    // --- ELIMINADO: initialMount ref ---
    // const initialMount = useRef(true);
    // --- FIN ELIMINADO ---


    const log = useCallback((message: string, ...optionalParams: any[]) => {
        if (verbose) { console.log(`[useQrScanner] ${message}`, ...optionalParams); }
    }, [verbose]);

    const clearScannerError = useCallback(() => { setScannerError(null); }, []);

    const startScanner = useCallback(async () => {
        // ... (lógica interna de startScanner sin cambios funcionales, solo usa tipos correctos) ...
        if (!scannerInstanceRef.current) { log("Scanner instance not ready in startScanner."); setScannerError("El escáner no está listo."); return; }
        if (isScanning) { log("Scanner already scanning in startScanner."); return; }
        log("Attempting to start scanner..."); clearScannerError();
        try {
            await scannerInstanceRef.current.start(
                { facingMode: "environment" },
                { fps: 10, qrbox: { width: 250, height: 250 }, ...config },
                (decodedText, result) => { // QrcodeSuccessCallback - result es de tipo Html5QrcodeResult implícitamente
                     log(`Scan successful: ${decodedText}`, result);
                     if (!isScanning) return;
                     setIsScanning(false);
                     onScanSuccess(decodedText, result);
                 },
                (errorMessage, error) => { // QrcodeErrorCallback - error es de tipo Html5QrcodeError implícitamente
                     const commonIgnoredErrors = ['QR code parse error', 'NotFoundException'];
                     if (!commonIgnoredErrors.some(e => errorMessage.includes(e))) {
                         console.warn(`[useQrScanner] Scan Error: ${errorMessage}`, error);
                         if (onScanError) { onScanError(errorMessage, error); }
                     }
                 }
            );
            log("Scanner started successfully."); setIsScanning(true);
        } catch (err: any) {
             console.error("[useQrScanner] Error starting scanner:", err);
             let friendlyError = 'Error desconocido al iniciar escáner.';
             if (err.name === 'NotFoundError' || err.message?.includes('device not found')) { friendlyError = 'No se encontró una cámara compatible.'; }
             else if (err.name === 'NotAllowedError' || err.message?.includes('Permission denied')) { friendlyError = 'Permiso para acceder a la cámara denegado.'; }
             else if (err.message) { friendlyError = `Error al iniciar cámara: ${err.message}`; }
             setScannerError(friendlyError); setIsScanning(false);
        }
    }, [config, log, onScanError, onScanSuccess, isScanning, clearScannerError]);


    // Efecto para inicializar y limpiar
    useEffect(() => {
        if (enabled) {
            log("Hook enabled. Setting up initialization timeout...");
            // --- MODIFICADO: Usar window.setTimeout y window.clearTimeout ---
            initTimeoutRef.current = window.setTimeout(() => { // Usar window.setTimeout
                log("Initializing Html5Qrcode (after delay)...");
                try {
                    // Añadir try/catch aquí por si el constructor falla
                    const scanner = new Html5Qrcode(qrcodeRegionId, verbose);
                    scannerInstanceRef.current = scanner;
                    startScanner();
                } catch (initError: any) {
                    console.error("[useQrScanner] Error initializing Html5Qrcode object:", initError);
                    setScannerError(`Error al inicializar lector QR: ${initError.message || 'Error desconocido'}`);
                }
            }, 500);
            // --- FIN MODIFICADO ---
        } else {
            // Limpieza cuando enabled pasa a false (sin cambios funcionales)
            if (initTimeoutRef.current) { log("Cleanup: Cleared pending initialization timeout."); window.clearTimeout(initTimeoutRef.current); initTimeoutRef.current = null; } // Usar window.clearTimeout
            if (scannerInstanceRef.current && isScanning) { log("Cleanup: Attempting to stop scanner..."); scannerInstanceRef.current.stop().then(() => { log("Cleanup: Scanner stopped successfully."); setIsScanning(false); }).catch((err) => { if (err.message?.includes('not running')) { log("Cleanup Warning: Attempted to stop scanner that wasn't running."); } else { console.error("[useQrScanner] Cleanup: Error stopping scanner:", err); } setIsScanning(false); }).finally(() => { log("Cleanup: Setting scanner instance ref to null."); scannerInstanceRef.current = null; });
            } else { log("Cleanup: No active scanner instance found to stop or hook disabled."); if (scannerInstanceRef.current) { scannerInstanceRef.current = null; } setIsScanning(false); }
        }

        // Función de limpieza al desmontar (sin cambios funcionales)
        return () => {
            log("Component unmounting or 'enabled' changed. Running cleanup...");
            if (initTimeoutRef.current) { log("Cleanup: Cleared pending initialization timeout on unmount."); window.clearTimeout(initTimeoutRef.current); } // Usar window.clearTimeout
             if (scannerInstanceRef.current && isScanning) {
                 log("Cleanup: Attempting to stop scanner on unmount...");
                 try { scannerInstanceRef.current.stop().then(() => log("Cleanup: Scanner stopped successfully on unmount.")).catch((err) => { if (err.message?.includes('not running')) { log("Cleanup Warning: Attempted to stop scanner (unmount) that wasn't running."); } else { console.error("[useQrScanner] Cleanup: Error stopping scanner on unmount:", err); } }).finally(() => { scannerInstanceRef.current = null; log("Cleanup: Scanner instance ref set to null on unmount."); }); } catch (stopError) { console.error("[useQrScanner] Cleanup: Immediate error calling stop() on unmount:", stopError); scannerInstanceRef.current = null; }
             } else if (scannerInstanceRef.current) { log("Cleanup: Scanner instance exists but wasn't scanning on unmount. Setting ref to null."); scannerInstanceRef.current = null; }
            setIsScanning(false);
        };
    }, [qrcodeRegionId, enabled, verbose, log, startScanner, isScanning]);

    return { scannerError, clearScannerError, isScanning };
};

// End of File: frontend/src/hooks/useQrScanner.ts