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
  Spinner,
  Center,
  Badge,
  Image
} from '@chakra-ui/react'
import { FiCamera, FiCheck, FiX, FiUser, FiAlertCircle } from 'react-icons/fi'
import Webcam from 'react-webcam'
import { useFaceRecognition } from '@/hooks/useFaceRecognition'

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
  const [faceDetected, setFaceDetected] = useState(false)
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null)
  const [faceDescriptor, setFaceDescriptor] = useState<Float32Array | null>(null)
  const [detectionBox, setDetectionBox] = useState<{x: number, y: number, width: number, height: number} | null>(null)
  const [isCapturing, setIsCapturing] = useState(false)
  const toast = useToast()

  // Usar hook de reconocimiento facial
  const { modelsLoaded, isLoading, error, detectFace, extractDescriptor } = useFaceRecognition()

  // Notificar cuando los modelos estén cargados o haya error
  useEffect(() => {
    if (modelsLoaded) {
      toast({
        title: 'Modelos cargados',
        description: 'El sistema de reconocimiento facial está listo',
        status: 'success',
        duration: 2000
      })
    }
  }, [modelsLoaded, toast])

  useEffect(() => {
    if (error) {
      toast({
        title: 'Error cargando modelos',
        description: error,
        status: 'error',
        duration: 5000,
        isClosable: true
      })
    }
  }, [error, toast])

  // Detectar rostros en tiempo real usando face-api.js
  const detectFaces = useCallback(async () => {
    if (!webcamRef.current || !modelsLoaded) return

    try {
      const video = webcamRef.current.video
      if (!video || video.readyState !== video.HAVE_ENOUGH_DATA) return

      // Validar dimensiones del video
      if (!video.videoWidth || !video.videoHeight) {
        return
      }

      const detection = await detectFace(video)
      
      if (detection && detection.detection && detection.detection.box) {
        const box = detection.detection.box
        
        // Validar que la caja tenga valores válidos
        if (box.x !== null && box.x !== undefined &&
            box.y !== null && box.y !== undefined &&
            box.width !== null && box.width !== undefined &&
            box.height !== null && box.height !== undefined &&
            box.width > 0 && box.height > 0) {
          setFaceDetected(true)
          
          // Ajustar coordenadas según el tamaño real del video renderizado
          const videoElement = video
          const videoWidth = videoElement.videoWidth
          const videoHeight = videoElement.videoHeight
          
          // Obtener el tamaño renderizado del video
          const containerWidth = videoElement.clientWidth || videoWidth
          const containerHeight = videoElement.clientHeight || videoHeight
          
          // Calcular escala solo si hay diferencia
          const scaleX = videoWidth > 0 ? containerWidth / videoWidth : 1
          const scaleY = videoHeight > 0 ? containerHeight / videoHeight : 1
          
          setDetectionBox({
            x: box.x * scaleX,
            y: box.y * scaleY,
            width: box.width * scaleX,
            height: box.height * scaleY
          })
        } else {
          setFaceDetected(false)
          setDetectionBox(null)
        }
      } else {
        setFaceDetected(false)
        setDetectionBox(null)
      }
    } catch (err) {
      console.error('Error en detección facial:', err)
      setFaceDetected(false)
      setDetectionBox(null)
    }
  }, [modelsLoaded, detectFace])

  // Ejecutar detección cada 200ms cuando los modelos estén cargados
  useEffect(() => {
    if (!modelsLoaded) return

    const interval = setInterval(detectFaces, 200)
    return () => clearInterval(interval)
  }, [detectFaces, modelsLoaded])

  const capturePhoto = useCallback(async () => {
    if (!webcamRef.current || !faceDetected || !modelsLoaded) {
      toast({
        title: 'Error',
        description: 'Asegúrate de que se detecte un rostro antes de capturar',
        status: 'warning',
        duration: 3000
      })
      return
    }

    // Validar que tengamos una detección válida antes de capturar
    if (!detectionBox || detectionBox.width <= 0 || detectionBox.height <= 0) {
      toast({
        title: 'Error',
        description: 'No se detectó un rostro válido. Por favor, posicione el rostro frente a la cámara.',
        status: 'warning',
        duration: 3000
      })
      return
    }

    try {
      setIsCapturing(true)
      
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

      // Validar dimensiones de la imagen
      if (!img.width || !img.height) {
        throw new Error('La imagen capturada no tiene dimensiones válidas')
      }

      // Usar extractDescriptor en lugar de detectFace para evitar problemas con extractFaces
      const descriptor = await extractDescriptor(img)
      
      if (!descriptor) {
        throw new Error('No se pudo extraer el descriptor facial. Asegúrate de que el rostro esté bien visible y centrado.')
      }

      // Validar que el descriptor sea válido
      if (!(descriptor instanceof Float32Array) || descriptor.length === 0) {
        throw new Error('El descriptor facial extraído no es válido. Intenta capturar nuevamente.')
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
      setIsCapturing(false)
    }
  }, [faceDetected, modelsLoaded, extractDescriptor, detectionBox, toast])

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

  // Detectar si es móvil para ajustar dimensiones
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
  
  const videoConstraints = {
    width: isMobile ? 320 : 640,
    height: isMobile ? 240 : 480,
    facingMode: "user"
  }

  return (
    <Modal 
      isOpen 
      onClose={onClose} 
      size={{ base: "full", md: "xl" }}
      closeOnOverlayClick={false}
      motionPreset="slideInBottom"
    >
      <ModalOverlay />
      <ModalContent mx={{ base: 0, md: "auto" }} maxH={{ base: "100vh", md: "90vh" }} overflowY="auto">
        <ModalHeader>
          <HStack>
            <FiCamera />
            <Text fontSize={{ base: "md", md: "lg" }}>{title}</Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody pb={6} px={{ base: 4, md: 6 }}>
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

            {isLoading && !modelsLoaded && (
              <Center py={8}>
                <VStack spacing={4}>
                  <Spinner size="lg" color="blue.500" />
                  <Text>Cargando modelos de reconocimiento facial...</Text>
                  {error && (
                    <Alert status="error" size="sm">
                      <AlertIcon />
                      <AlertDescription fontSize="xs">{error}</AlertDescription>
                    </Alert>
                  )}
                </VStack>
              </Center>
            )}

            {modelsLoaded && !capturedPhoto && (
              <Box 
                position="relative" 
                borderRadius="lg" 
                overflow="hidden"
                width="100%"
                maxW={{ base: "100%", md: "640px" }}
                mx="auto"
              >
                <Box
                  position="relative"
                  width="100%"
                  bg="black"
                  borderRadius="lg"
                >
                  <Webcam
                    ref={webcamRef}
                    audio={false}
                    screenshotFormat="image/jpeg"
                    videoConstraints={videoConstraints}
                    style={{
                      width: "100%",
                      height: "auto",
                      display: "block"
                    }}
                  />
                  
                  {/* Overlay de detección facial */}
                  {detectionBox && faceDetected && webcamRef.current?.video && (
                    <Box
                      position="absolute"
                      top={`${Math.max(0, detectionBox.y)}px`}
                      left={`${Math.max(0, detectionBox.x)}px`}
                      width={`${detectionBox.width}px`}
                      height={`${detectionBox.height}px`}
                      border="4px solid"
                      borderColor="green.500"
                      borderRadius="xl"
                      pointerEvents="none"
                      boxShadow="0 0 20px rgba(34, 197, 94, 0.5)"
                      transition="all 0.1s ease"
                      zIndex={10}
                    />
                  )}
                </Box>
              </Box>
            )}

            {capturedPhoto && (
              <VStack spacing={4} width="100%">
                <Box
                  width="100%"
                  maxW={{ base: "100%", md: "400px" }}
                  mx="auto"
                >
                  <Image
                    src={capturedPhoto}
                    alt="Foto capturada"
                    borderRadius="lg"
                    width="100%"
                    height="auto"
                    maxH="300px"
                    objectFit="cover"
                  />
                </Box>
                <HStack>
                  <Badge colorScheme="green" variant="solid" fontSize={{ base: "xs", md: "sm" }}>
                    <HStack spacing={1}>
                      <FiCheck />
                      <Text>Rostro detectado</Text>
                    </HStack>
                  </Badge>
                </HStack>
              </VStack>
            )}

            {/* Estados de la cámara */}
            <HStack spacing={2} justify="center" flexWrap="wrap">
              {modelsLoaded && (
                <Badge colorScheme="blue" variant="outline" fontSize={{ base: "xs", md: "sm" }}>
                  <HStack spacing={1}>
                    <FiCheck />
                    <Text>Modelos cargados</Text>
                  </HStack>
                </Badge>
              )}
              
              {faceDetected && !capturedPhoto && (
                <Badge colorScheme="green" variant="solid" fontSize={{ base: "xs", md: "sm" }}>
                  <HStack spacing={1}>
                    <FiUser />
                    <Text>Rostro detectado</Text>
                  </HStack>
                </Badge>
              )}
              
              {!faceDetected && modelsLoaded && !capturedPhoto && (
                <Badge colorScheme="orange" variant="solid" fontSize={{ base: "xs", md: "sm" }}>
                  <HStack spacing={1}>
                    <FiAlertCircle />
                    <Text>Posicione su rostro</Text>
                  </HStack>
                </Badge>
              )}
            </HStack>

            {/* Botones de acción */}
            <VStack spacing={3} width="100%">
              <HStack spacing={2} width="100%" flexWrap="wrap" justify="center">
                {!capturedPhoto && (
                  <Button
                    onClick={capturePhoto}
                    colorScheme="blue"
                    leftIcon={<FiCamera />}
                    isDisabled={!faceDetected || !modelsLoaded || isCapturing}
                    isLoading={isCapturing}
                    size={{ base: "md", md: "lg" }}
                    width={{ base: "100%", md: "auto" }}
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
                      size={{ base: "md", md: "lg" }}
                      flex={{ base: 1, md: "none" }}
                      minW={{ base: "calc(50% - 4px)", md: "auto" }}
                    >
                      Confirmar
                    </Button>
                    <Button
                      onClick={retakePhoto}
                      colorScheme="orange"
                      leftIcon={<FiX />}
                      variant="outline"
                      size={{ base: "md", md: "lg" }}
                      flex={{ base: 1, md: "none" }}
                      minW={{ base: "calc(50% - 4px)", md: "auto" }}
                    >
                      Repetir
                    </Button>
                  </>
                )}
              </HStack>
              
              <Button
                onClick={onClose}
                variant="ghost"
                leftIcon={<FiX />}
                size={{ base: "md", md: "lg" }}
                width={{ base: "100%", md: "auto" }}
              >
                Cancelar
              </Button>
            </VStack>

            {/* Instrucciones */}
            <Box 
              bg="gray.50" 
              p={{ base: 3, md: 4 }} 
              borderRadius="md" 
              fontSize={{ base: "xs", md: "sm" }} 
              color="gray.600"
              width="100%"
            >
              <Text fontWeight="bold" mb={2} fontSize={{ base: "sm", md: "md" }}>Instrucciones:</Text>
              <VStack align="start" spacing={1}>
                <Text>• Asegúrese de tener buena iluminación</Text>
                <Text>• Mire directamente a la cámara</Text>
                <Text>• Mantenga una expresión neutra</Text>
                <Text>• Espere a que se detecte su rostro antes de capturar</Text>
                {isMobile && (
                  <Text fontWeight="semibold" color="blue.600" mt={2}>
                    💡 En móvil: Mantenga el dispositivo estable y horizontal
                  </Text>
                )}
              </VStack>
            </Box>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}
