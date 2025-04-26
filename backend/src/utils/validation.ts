// filename: backend/src/utils/validation.ts
// Contiene funciones de utilidad para validaciones comunes

/**
 * Valida si un string tiene formato de DNI espaÃ±ol vÃ¡lido.
 * @param dni - El string a validar.
 * @returns true si es vÃ¡lido, false en caso contrario.
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
 * Valida si un string tiene formato de NIE espaÃ±ol vÃ¡lido.
 * @param nie - El string a validar.
 * @returns true si es vÃ¡lido, false en caso contrario.
 */
export function isValidNie(nie: string): boolean {
    if (!/^[XYZ]\d{7}[A-Z]$/i.test(nie)) {
        return false;
    }
    let numeroStr = nie.substring(1, 8);
    const letraInicial = nie.substring(0, 1).toUpperCase();
    // Reemplazar letra inicial por su equivalente numÃ©rico para el cÃ¡lculo
    if (letraInicial === 'Y') numeroStr = '1' + numeroStr;
    if (letraInicial === 'Z') numeroStr = '2' + numeroStr;
    // Si es X, se trata como 0, lo cual ya estÃ¡ implÃ­cito al no aÃ±adir prefijo

    const numero = parseInt(numeroStr, 10);
    const letra = nie.substring(8, 9).toUpperCase();
    const letrasControl = "TRWAGMYFPDXBNJZSQVHLCKE";
    const letraCalculada = letrasControl.charAt(numero % 23);
    return letra === letraCalculada;
}

/**
 * Valida si un string tiene formato de nÃºmero de telÃ©fono internacional bÃ¡sico.
 * @param phone - El string a validar.
 * @returns true si es vÃ¡lido, false en caso contrario.
 */
export function isValidPhoneNumber(phone: string): boolean {
    // Regex simple: empieza con +, seguido de 9 a 15 dÃ­gitos.
    const phoneRegex = /^\+[0-9]{9,15}$/;
    return phoneRegex.test(phone);
}

// AquÃ­ podrÃ­an aÃ±adirse mÃ¡s funciones de validaciÃ³n comunes en el futuro

// End of File: backend/src/utils/validation.ts