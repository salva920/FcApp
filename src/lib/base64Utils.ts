/**
 * Utilidades para codificar/decodificar Base64 en el navegador
 * (sin usar Buffer que no está disponible en el cliente)
 */

/**
 * Convierte un array de números a Base64
 */
export function arrayToBase64(array: number[] | Float32Array): string {
  const jsonString = JSON.stringify(Array.from(array))
  // Usar btoa para codificar en Base64 en el navegador
  return btoa(unescape(encodeURIComponent(jsonString)))
}

/**
 * Convierte Base64 a un array de números
 */
export function base64ToArray(base64: string): number[] {
  try {
    // Usar atob para decodificar Base64 en el navegador
    const jsonString = decodeURIComponent(escape(atob(base64)))
    return JSON.parse(jsonString)
  } catch (error) {
    console.error('Error decodificando Base64:', error)
    throw new Error('Error al decodificar el descriptor facial')
  }
}

/**
 * Convierte Base64 a Float32Array
 */
export function base64ToFloat32Array(base64: string): Float32Array {
  const array = base64ToArray(base64)
  return new Float32Array(array)
}

