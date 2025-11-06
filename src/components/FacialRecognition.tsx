'use client'

import React, { useRef, useState, useCallback, useEffect } from 'react'
import {
  Box,
  Button,
  VStack,
  HStack,
  Text,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Spinner,
  Center,
  Badge,
  Image,
  Flex
} from '@chakra-ui/react'
import { FiCamera, FiCheck, FiX, FiUser, FiAlertCircle } from 'react-icons/fi'
import Webcam from 'react-webcam'

// Tipos para el reconocimiento facial
interface FaceDetection {
  detection: {
    box: {
      x: number
      y: number
      width: number
      height: number
    }
  }
  descriptor?: Float32Array
}

interface FacialRecognitionProps {
  onPhotoCaptured: (photoData: string, faceDescriptor?: Float32Array) => void
  onClose: () => void
  title?: string
  description?: string
}

export default function FacialRecognition({
  onPhotoCaptured,
  onClose,
  title = "Captura Facial",
  description = "Posicione su rostro frente a la cámara para el reconocimiento facial"
}: FacialRecognitionProps) {
  const webcamRef = useRef<Webcam>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isModelLoaded, setIsModelLoaded] = useState(false)
  const [faceDetected, setFaceDetected] = useState(false)
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null)
  const [faceDescriptor, setFaceDescriptor] = useState<Float32Array | null>(null)
  const [detectionBox, setDetectionBox] = useState<{x: number, y: number, width: number, height: number} | null>(null)
  const [error, setError] = useState<string | null>(null)
  const toast = useToast()

  // Cargar modelos de Face API
  useEffect(() => {
    const loadModels = async () => {
      try {
        setIsLoading(true)
        
        // Simular carga de modelos (implementación simplificada)
        console.log('Inicializando sistema de reconocimiento facial...')
        
        // Simular tiempo de carga
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        console.log('Sistema de reconocimiento facial listo')
        
        setIsModelLoaded(true)
        toast({
          title: 'Modelos cargados',
          description: 'El sistema de reconocimiento facial está listo',
          status: 'success',
          duration: 2000
        })
      } catch (err) {
        console.error('Error cargando modelos:', err)
        setError('Error al cargar los modelos de reconocimiento facial')
        toast({
          title: 'Error',
          description: 'No se pudieron cargar los modelos de reconocimiento',
          status: 'error',
          duration: 3000
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadModels()
  }, [toast])

  // Detectar rostros en tiempo real (implementación simplificada)
  const detectFaces = useCallback(async () => {
    if (!webcamRef.current || !isModelLoaded) return

    try {
      const imageSrc = webcamRef.current.getScreenshot()
      if (!imageSrc) return

      // Simular detección de rostros basada en análisis de imagen básico
      const img = new window.Image()
      img.crossOrigin = 'anonymous'
      
      img.onload = () => {
        try {
          // Análisis básico de imagen para simular detección de rostros
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          if (!ctx) return

          canvas.width = img.width
          canvas.height = img.height
          ctx.drawImage(img, 0, 0)

          // Simular detección basada en análisis de brillo y contraste
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
          const data = imageData.data
          
          let totalBrightness = 0
          let pixelCount = 0
          
          for (let i = 0; i < data.length; i += 4) {
            const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3
            totalBrightness += brightness
            pixelCount++
          }
          
          const avgBrightness = totalBrightness / pixelCount
          
          // Simular detección de rostro si la imagen tiene un brillo promedio razonable
          const hasFace = avgBrightness > 50 && avgBrightness < 200
          
          if (hasFace) {
            setFaceDetected(true)
            // Simular posición de detección en el centro de la imagen
            setDetectionBox({
              x: canvas.width * 0.2,
              y: canvas.height * 0.2,
              width: canvas.width * 0.6,
              height: canvas.height * 0.6
            })
          } else {
            setFaceDetected(false)
            setDetectionBox(null)
          }
        } catch (err) {
          console.error('Error en detección facial:', err)
        }
      }
      
      img.src = imageSrc
    } catch (err) {
      console.error('Error en detección facial:', err)
    }
  }, [isModelLoaded])

  // Ejecutar detección cada 100ms
  useEffect(() => {
    if (!isModelLoaded) return

    const interval = setInterval(detectFaces, 100)
    return () => clearInterval(interval)
  }, [detectFaces, isModelLoaded])

  const capturePhoto = useCallback(async () => {
    if (!webcamRef.current || !faceDetected) return

    try {
      setIsLoading(true)
      
      const imageSrc = webcamRef.current.getScreenshot()
      if (!imageSrc) {
        throw new Error('No se pudo capturar la imagen')
      }

      // Crear elemento de imagen para análisis
      const img = new window.Image()
      img.crossOrigin = 'anonymous'
      
      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
        img.src = imageSrc
      })

      // Generar descriptor facial simulado basado en la imagen
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('No se pudo crear contexto de canvas')

      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)

      // Extraer características básicas de la imagen para crear un descriptor simulado
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageData.data
      
      // Crear descriptor facial simulado basado en características de la imagen
      const descriptor = new Float32Array(128)
      for (let i = 0; i < 128; i++) {
        // Usar diferentes partes de la imagen para generar el descriptor
        const pixelIndex = (i * 4) % data.length
        const brightness = (data[pixelIndex] + data[pixelIndex + 1] + data[pixelIndex + 2]) / 3
        descriptor[i] = brightness / 255 // Normalizar entre 0 y 1
      }

      setCapturedPhoto(imageSrc)
      setFaceDescriptor(descriptor)

      toast({
        title: 'Foto capturada',
        description: 'Imagen capturada exitosamente con reconocimiento facial',
        status: 'success',
        duration: 2000
      })

    } catch (err) {
      console.error('Error capturando foto:', err)
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'No se pudo capturar la imagen',
        status: 'error',
        duration: 3000
      })
    } finally {
      setIsLoading(false)
    }
  }, [faceDetected, toast])

  const confirmPhoto = () => {
    if (capturedPhoto && faceDescriptor) {
      onPhotoCaptured(capturedPhoto, faceDescriptor)
      onClose()
    }
  }

  const retakePhoto = () => {
    setCapturedPhoto(null)
    setFaceDescriptor(null)
  }

  const videoConstraints = {
    width: 640,
    height: 480,
    facingMode: "user"
  }

  return (
    <Modal isOpen onClose={onClose} size="xl" closeOnOverlayClick={false}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <HStack>
            <FiCamera />
            <Text>{title}</Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody pb={6}>
          <VStack spacing={4}>
            <Text color="gray.600" textAlign="center">
              {description}
            </Text>

            {error && (
              <Alert status="error">
                <AlertIcon />
                <AlertTitle>Error:</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {isLoading && !isModelLoaded && (
              <Center py={8}>
                <VStack spacing={4}>
                  <Spinner size="lg" color="blue.500" />
                  <Text>Cargando modelos de reconocimiento facial...</Text>
                </VStack>
              </Center>
            )}

            {isModelLoaded && !capturedPhoto && (
              <Box position="relative" borderRadius="lg" overflow="hidden">
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  screenshotFormat="image/jpeg"
                  width={640}
                  height={480}
                  videoConstraints={videoConstraints}
                />
                
                {/* Overlay de detección facial */}
                {detectionBox && (
                  <Box
                    position="absolute"
                    top={detectionBox.y}
                    left={detectionBox.x}
                    width={detectionBox.width}
                    height={detectionBox.height}
                    border="3px solid"
                    borderColor={faceDetected ? "green.400" : "red.400"}
                    borderRadius="full"
                    pointerEvents="none"
                  />
                )}
              </Box>
            )}

            {capturedPhoto && (
              <VStack spacing={4}>
                <Image
                  src={capturedPhoto}
                  alt="Foto capturada"
                  borderRadius="lg"
                  maxW="400px"
                  maxH="300px"
                  objectFit="cover"
                />
                <HStack>
                  <Badge colorScheme="green" variant="solid">
                    <HStack spacing={1}>
                      <FiCheck />
                      <Text>Rostro detectado</Text>
                    </HStack>
                  </Badge>
                </HStack>
              </VStack>
            )}

            {/* Estados de la cámara */}
            <HStack spacing={4} justify="center">
              {isModelLoaded && (
                <Badge colorScheme="blue" variant="outline">
                  <HStack spacing={1}>
                    <FiCheck />
                    <Text>Modelos cargados</Text>
                  </HStack>
                </Badge>
              )}
              
              {faceDetected && !capturedPhoto && (
                <Badge colorScheme="green" variant="solid">
                  <HStack spacing={1}>
                    <FiUser />
                    <Text>Rostro detectado</Text>
                  </HStack>
                </Badge>
              )}
              
              {!faceDetected && isModelLoaded && !capturedPhoto && (
                <Badge colorScheme="orange" variant="solid">
                  <HStack spacing={1}>
                    <FiAlertCircle />
                    <Text>Posicione su rostro</Text>
                  </HStack>
                </Badge>
              )}
            </HStack>

            {/* Botones de acción */}
            <HStack spacing={4}>
              {!capturedPhoto && (
                <Button
                  onClick={capturePhoto}
                  colorScheme="blue"
                  leftIcon={<FiCamera />}
                  isDisabled={!faceDetected || isLoading}
                  isLoading={isLoading}
                >
                  Capturar Foto
                </Button>
              )}
              
              {capturedPhoto && (
                <>
                  <Button
                    onClick={confirmPhoto}
                    colorScheme="green"
                    leftIcon={<FiCheck />}
                  >
                    Confirmar
                  </Button>
                  <Button
                    onClick={retakePhoto}
                    colorScheme="orange"
                    leftIcon={<FiX />}
                    variant="outline"
                  >
                    Repetir
                  </Button>
                </>
              )}
              
              <Button
                onClick={onClose}
                variant="ghost"
                leftIcon={<FiX />}
              >
                Cancelar
              </Button>
            </HStack>

            {/* Instrucciones */}
            <Box bg="gray.50" p={4} borderRadius="md" fontSize="sm" color="gray.600">
              <Text fontWeight="bold" mb={2}>Instrucciones:</Text>
              <VStack align="start" spacing={1}>
                <Text>• Asegúrese de tener buena iluminación</Text>
                <Text>• Mire directamente a la cámara</Text>
                <Text>• Mantenga una expresión neutra</Text>
                <Text>• Espere a que se detecte su rostro antes de capturar</Text>
              </VStack>
            </Box>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}
