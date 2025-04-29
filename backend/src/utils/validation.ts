// filename: backend/src/utils/validation.ts
// Version: 1.0.1 (Fix character encoding)

// Contiene funciones de utilidad para validaciones comunes

/**
 * Valida si un string tiene formato de DNI español válido.
 * @param dni - El string a validar.
 * @returns true si es válido, false en caso contrario.
 */
export function isValidDni(dni: string): boolean {
    if (!/^\d{8}[A-Z]$/i.test(dni)) {
        return false;
    }
    const numero = parseInt(dni.substring(0, 8), 10);
    const letra = dni.substring(8, 9).toUpperCase();
    const letrasControl = "TRWAGMYFPDXBNJZSQVHLCKE";
    const letraCalculada = letrasControl.charAt(numero % 23);
    return letra === letraCalculada;
}

/**
 * Valida si un string tiene formato de NIE español válido.
 * @param nie - El string a validar.
 * @returns true si es válido, false en caso contrario.
 */
export function isValidNie(nie: string): boolean {
    if (!/^[XYZ]\d{7}[A-Z]$/i.test(nie)) {
        return false;
    }
    let numeroStr = nie.substring(1, 8);
    const letraInicial = nie.substring(0, 1).toUpperCase();
    // Reemplazar letra inicial por su equivalente numérico para el cálculo
    if (letraInicial === 'Y') numeroStr = '1' + numeroStr;
    if (letraInicial === 'Z') numeroStr = '2' + numeroStr;
    // Si es X, se trata como 0, lo cual ya está implícito al no añadir prefijo

    const numero = parseInt(numeroStr, 10);
    const letra = nie.substring(8, 9).toUpperCase();
    const letrasControl = "TRWAGMYFPDXBNJZSQVHLCKE";
    const letraCalculada = letrasControl.charAt(numero % 23);
    return letra === letraCalculada;
}

/**
 * Valida si un string tiene formato de número de teléfono internacional básico.
 * @param phone - El string a validar.
 * @returns true si es válido, false en caso contrario.
 */
export function isValidPhoneNumber(phone: string): boolean {
    // Regex simple: empieza con +, seguido de 9 a 15 dígitos.
    const phoneRegex = /^\+[0-9]{9,15}$/;
    return phoneRegex.test(phone);
}

// Aquí podrían añadirse más funciones de validación comunes en el futuro

// End of File: backend/src/utils/validation.ts