'use client'

import { useState, useEffect, useCallback } from 'react'
import * as faceapi from 'face-api.js'

interface FaceDetection {
  detection: faceapi.FaceDetection
  descriptor?: Float32Array
}

interface UseFaceRecognitionReturn {
  modelsLoaded: boolean
  isLoading: boolean
  error: string | null
  detectFace: (image: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement) => Promise<FaceDetection | null>
  extractDescriptor: (image: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement) => Promise<Float32Array | null>
  calculateSimilarity: (desc1: Float32Array, desc2: Float32Array) => number
}

export function useFaceRecognition(): UseFaceRecognitionReturn {
  const [modelsLoaded, setModelsLoaded] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Cargar modelos de face-api.js
  useEffect(() => {
    const loadModels = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Los modelos deben estar en la carpeta public/models
        // En Next.js, los archivos en public/ se sirven desde la raíz
        const MODEL_URL = '/models'

        console.log('🔄 Cargando modelos de reconocimiento facial desde:', MODEL_URL)
        console.log('📍 Verificando que los modelos existan...')

        // Verificar que los modelos existan antes de cargarlos
        try {
          const response = await fetch(`${MODEL_URL}/tiny_face_detector_model-weights_manifest.json`)
          if (!response.ok) {
            throw new Error(`No se encontraron los modelos en ${MODEL_URL}. Ejecuta: npm run download-face-models`)
          }
          console.log('✅ Modelos encontrados en el servidor')
        } catch (fetchError) {
          console.error('❌ Error verificando modelos:', fetchError)
          throw new Error(`No se pueden acceder a los modelos desde ${MODEL_URL}. Asegúrate de que estén en public/models/`)
        }

        console.log('📦 Cargando modelos de TensorFlow.js...')
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL)
        ])

        console.log('✅ Todos los modelos cargados exitosamente')

        setModelsLoaded(true)
        console.log('✅ Modelos de reconocimiento facial cargados correctamente')
      } catch (err: any) {
        console.error('❌ Error cargando modelos de reconocimiento facial:', err)
        const errorMessage = err?.message || 'Error desconocido'
        console.error('Detalles del error:', errorMessage)
        
        // Mensaje de error más descriptivo
        let userMessage = 'Error al cargar los modelos de reconocimiento facial. '
        if (errorMessage.includes('404') || errorMessage.includes('Not Found')) {
          userMessage += 'Los modelos no se encontraron en /public/models. Ejecuta: npm run download-face-models'
        } else if (errorMessage.includes('CORS')) {
          userMessage += 'Error de CORS. Verifica que los modelos estén en public/models/'
        } else {
          userMessage += `Error: ${errorMessage}. Verifica que los modelos estén en /public/models`
        }
        
        setError(userMessage)
      } finally {
        setIsLoading(false)
      }
    }

    loadModels()
  }, [])

  // Detectar rostro en una imagen
  const detectFace = useCallback(async (
    image: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement
  ): Promise<FaceDetection | null> => {
    if (!modelsLoaded) {
      throw new Error('Los modelos no están cargados aún')
    }

    try {
      // Validar que la imagen tenga dimensiones válidas
      if (!image || (image instanceof HTMLImageElement && (!image.width || !image.height))) {
        return null
      }

      // Detectar rostro con el modelo tinyFaceDetector (más rápido)
      const detection = await faceapi
        .detectSingleFace(image, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor()

      if (!detection || !detection.detection || !detection.descriptor) {
        return null
      }

      // Validar que la caja de detección tenga valores válidos
      const box = detection.detection.box
      if (!box || 
          box.x === null || box.x === undefined || 
          box.y === null || box.y === undefined || 
          box.width === null || box.width === undefined || 
          box.height === null || box.height === undefined ||
          box.width <= 0 || box.height <= 0) {
        console.warn('⚠️ Detección con valores inválidos, ignorando...', box)
        return null
      }

      return {
        detection: detection.detection,
        descriptor: detection.descriptor as Float32Array
      }
    } catch (err) {
      console.error('Error detectando rostro:', err)
      return null
    }
  }, [modelsLoaded])

  // Extraer descriptor facial
  const extractDescriptor = useCallback(async (
    image: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement
  ): Promise<Float32Array | null> => {
    if (!modelsLoaded) {
      throw new Error('Los modelos no están cargados aún')
    }

    try {
      // Validar que la imagen tenga dimensiones válidas
      if (!image || (image instanceof HTMLImageElement && (!image.width || !image.height))) {
        return null
      }

      // Usar detectSingleFace con validación más estricta
      const detection = await faceapi
        .detectSingleFace(image, new faceapi.TinyFaceDetectorOptions({
          inputSize: 320, // Tamaño de entrada más grande para mejor precisión
          scoreThreshold: 0.5 // Umbral de confianza más alto
        }))
        .withFaceLandmarks()
        .withFaceDescriptor()

      if (!detection) {
        return null
      }

      // Validar que la detección tenga todos los componentes necesarios
      if (!detection.detection || !detection.descriptor) {
        return null
      }

      // Validar que la caja de detección tenga valores válidos ANTES de usarla
      const box = detection.detection.box
      if (!box || 
          typeof box.x !== 'number' || isNaN(box.x) ||
          typeof box.y !== 'number' || isNaN(box.y) ||
          typeof box.width !== 'number' || isNaN(box.width) ||
          typeof box.height !== 'number' || isNaN(box.height) ||
          box.width <= 0 || box.height <= 0 ||
          box.x < 0 || box.y < 0) {
        console.warn('⚠️ Detección con valores inválidos al extraer descriptor, ignorando...', {
          x: box?.x,
          y: box?.y,
          width: box?.width,
          height: box?.height
        })
        return null
      }

      // Validar que el descriptor sea válido
      if (!(detection.descriptor instanceof Float32Array) || detection.descriptor.length !== 128) {
        console.warn('⚠️ Descriptor inválido:', {
          type: detection.descriptor?.constructor?.name,
          length: detection.descriptor?.length
        })
        return null
      }

      return detection.descriptor as Float32Array
    } catch (err) {
      console.error('Error extrayendo descriptor:', err)
      return null
    }
  }, [modelsLoaded])

  // Calcular similitud entre dos descriptores (distancia euclidiana)
  const calculateSimilarity = useCallback((desc1: Float32Array, desc2: Float32Array): number => {
    if (desc1.length !== desc2.length) {
      return 0
    }

    // Calcular distancia euclidiana
    let sum = 0
    for (let i = 0; i < desc1.length; i++) {
      const diff = desc1[i] - desc2[i]
      sum += diff * diff
    }
    const distance = Math.sqrt(sum)

    // Convertir distancia a similitud (0-1, donde 1 es idéntico)
    // face-api.js: distancia < 0.6 = mismo rostro, distancia >= 0.6 = diferente rostro
    // Usamos una función que mapea:
    // - distance = 0 → similarity = 1.0 (idéntico)
    // - distance = 0.6 → similarity ≈ 0.5 (límite)
    // - distance > 0.6 → similarity < 0.5 (diferente)
    // Fórmula mejorada: usar una curva más suave
    const threshold = 0.6 // Umbral de face-api.js
    const maxDistance = 1.2 // Distancia máxima esperada
    
    // Normalización mejorada: distancia pequeña = alta similitud
    let similarity: number
    if (distance <= threshold) {
      // Para distancias pequeñas (mismo rostro), similitud alta
      similarity = 1 - (distance / threshold) * 0.5 // 0.6 → 0.5, 0 → 1.0
    } else {
      // Para distancias grandes (diferente rostro), similitud baja
      similarity = 0.5 * (1 - (distance - threshold) / (maxDistance - threshold))
      similarity = Math.max(0, similarity)
    }
    
    return similarity
  }, [])

  return {
    modelsLoaded,
    isLoading,
    error,
    detectFace,
    extractDescriptor,
    calculateSimilarity
  }
}

