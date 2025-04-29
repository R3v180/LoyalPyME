// filename: frontend/src/hooks/useQrScanner.ts
// Version: 1.0.1 (Fix non-exported type imports from html5-qrcode)

import { useState, useEffect, useRef, useCallback } from 'react';
// --- FIX: Remove non-exported types ---
import { Html5Qrcode, Html5QrcodeResult /*, Html5QrcodeError, QrDimensions, QrDimensionFunction */ } from 'html5-qrcode';
// --- END FIX ---

// --- FIX: Define types for qrbox inline ---
type QrboxFunction = (viewfinderWidth: number, viewfinderHeight: number) => { width: number, height: number };
type QrboxConfig = { width: number, height: number } | QrboxFunction;
// --- END FIX ---

// Configuración por defecto para el escáner
const defaultQrScannerConfig = {
    fps: 10,
    qrbox: { width: 250, height: 250 } as QrboxConfig, // Use the inline type alias
};

// Opciones que acepta el hook
interface UseQrScannerOptions {
    qrcodeRegionId: string;
    config?: {
        fps?: number;
        qrbox?: QrboxConfig; // Use the inline type alias
        aspectRatio?: number;
        disableFlip?: boolean;
    };
    verbose?: boolean;
    enabled?: boolean;
    onScanSuccess: (decodedText: string, decodedResult: Html5QrcodeResult) => void;
    // --- FIX: Use 'any' or 'Error' for the error type ---
    onScanError?: (errorMessage: string, error: any) => void; // Use 'any' as specific type isn't exported
    // --- END FIX ---
}

// Valor de retorno del hook
interface UseQrScannerResult {
    scannerError: string | null;
    clearScannerError: () => void;
}

export const useQrScanner = ({
    qrcodeRegionId,
    config = {},
    verbose = false,
    enabled = false,
    onScanSuccess,
    onScanError,
}: UseQrScannerOptions): UseQrScannerResult => {

    const [scannerError, setScannerError] = useState<string | null>(null);
    const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
    const lastScanSuccessRef = useRef<string | null>(null);
    const optionsRef = useRef({ onScanSuccess, onScanError });

    useEffect(() => {
        optionsRef.current = { onScanSuccess, onScanError };
    }, [onScanSuccess, onScanError]);

    const clearScannerError = useCallback(() => setScannerError(null), []);

    useEffect(() => {
        if (!enabled) {
            return; // Early exit if not enabled
        }

        const element = document.getElementById(qrcodeRegionId);
        if (!element) {
            console.error(`[useQrScanner] Element with ID ${qrcodeRegionId} not found.`);
            setScannerError("Error: Contenedor del escáner no encontrado.");
            return;
        }

        if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
            console.log("[useQrScanner] Scanner already initialized and scanning.");
            return;
        }

        console.log("[useQrScanner] Initializing Html5Qrcode...");
        setScannerError(null);
        lastScanSuccessRef.current = null;

        const scannerInstance = new Html5Qrcode(qrcodeRegionId, { verbose: verbose });
        html5QrCodeRef.current = scannerInstance;

        const scannerConfig = { ...defaultQrScannerConfig, ...config };

        const successCallback = (decodedText: string, decodedResult: Html5QrcodeResult) => {
            if (decodedText !== lastScanSuccessRef.current) {
                lastScanSuccessRef.current = decodedText;
                console.log(`[useQrScanner] Code matched: ${decodedText}`);
                setScannerError(null);
                optionsRef.current.onScanSuccess(decodedText, decodedResult);
            }
        };

        // --- FIX: Use 'any' for the error parameter type ---
        const errorCallback = (errorMessage: string, error: any) => {
        // --- END FIX ---
            if (optionsRef.current.onScanError) {
                optionsRef.current.onScanError(errorMessage, error);
            }
        };

        scannerInstance.start(
            { facingMode: "environment" },
            scannerConfig,
            successCallback,
            errorCallback
        ).then(() => {
            console.log("[useQrScanner] Scanner started successfully.");
        }).catch((err) => {
            console.error("[useQrScanner] Unable to start scanning.", err);
            setScannerError(`No se pudo iniciar la cámara: ${err?.message || err}`);
            if (html5QrCodeRef.current) {
                try { html5QrCodeRef.current.clear(); } catch(e){ console.warn("Error clearing scanner after start failure", e); }
                html5QrCodeRef.current = null;
            }
        });

        // Función de limpieza
        return () => {
            console.log("[useQrScanner] Cleanup: Attempting to stop scanner...");
            lastScanSuccessRef.current = null;
            const scanner = html5QrCodeRef.current;
            if (scanner) {
                html5QrCodeRef.current = null;
                scanner.stop()
                    .then(() => {
                        console.log("[useQrScanner] Scanner stopped successfully.");
                        return scanner.clear(); // Return promise for chaining
                    })
                    .then(() => {
                        console.log("[useQrScanner] Scanner cleared successfully.");
                    })
                    .catch((err) => {
                        console.warn("[useQrScanner] Error stopping/clearing scanner during cleanup:", err);
                        // Attempt to clear even if stop failed
                        try { scanner.clear(); } catch (e) { /* ignore */ }
                    });
            } else {
                 console.log("[useQrScanner] Cleanup: No active scanner instance found.");
            }
        };
    }, [enabled, qrcodeRegionId, config, verbose]); // Keep dependencies

    return { scannerError, clearScannerError };
};

// End of File: frontend/src/hooks/useQrScanner.ts