'use client'

import React, { useRef, useState, useCallback } from 'react'
import {
  Box,
  Button,
  VStack,
  HStack,
  Text,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Center,
  Image,
  Badge
} from '@chakra-ui/react'
import { FiCamera, FiCheck, FiX } from 'react-icons/fi'
import Webcam from 'react-webcam'

interface SimpleFacialRecognitionProps {
  onPhotoCaptured: (photoData: string) => void
  onClose: () => void
  title?: string
  description?: string
}

export default function SimpleFacialRecognition({
  onPhotoCaptured,
  onClose,
  title = "Captura de Foto",
  description = "Posicione su rostro frente a la cámara para capturar la foto"
}: SimpleFacialRecognitionProps) {
  const webcamRef = useRef<Webcam>(null)
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null)
  const toast = useToast()

  const capturePhoto = useCallback(() => {
    if (!webcamRef.current) return

    const imageSrc = webcamRef.current.getScreenshot()
    if (!imageSrc) {
      toast({
        title: 'Error',
        description: 'No se pudo capturar la imagen',
        status: 'error',
        duration: 3000
      })
      return
    }

    setCapturedPhoto(imageSrc)
    toast({
      title: 'Foto capturada',
      description: 'Imagen capturada exitosamente',
      status: 'success',
      duration: 2000
    })
  }, [toast])

  const confirmPhoto = () => {
    if (capturedPhoto) {
      onPhotoCaptured(capturedPhoto)
      onClose()
    }
  }

  const retakePhoto = () => {
    setCapturedPhoto(null)
  }

  const videoConstraints = {
    width: 640,
    height: 480,
    facingMode: "user"
  }

  return (
    <Modal isOpen onClose={onClose} size="lg" closeOnOverlayClick={false}>
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

            {!capturedPhoto && (
              <Box position="relative" borderRadius="lg" overflow="hidden">
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  screenshotFormat="image/jpeg"
                  width={640}
                  height={480}
                  videoConstraints={videoConstraints}
                />
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
                <Badge colorScheme="green" variant="solid">
                  <HStack spacing={1}>
                    <FiCheck />
                    <Text>Foto capturada</Text>
                  </HStack>
                </Badge>
              </VStack>
            )}

            <HStack spacing={4}>
              {!capturedPhoto && (
                <Button
                  onClick={capturePhoto}
                  colorScheme="blue"
                  leftIcon={<FiCamera />}
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

            <Box bg="gray.50" p={4} borderRadius="md" fontSize="sm" color="gray.600">
              <Text fontWeight="bold" mb={2}>Instrucciones:</Text>
              <VStack align="start" spacing={1}>
                <Text>• Asegúrese de tener buena iluminación</Text>
                <Text>• Mire directamente a la cámara</Text>
                <Text>• Mantenga una expresión neutra</Text>
                <Text>• Haga clic en "Capturar Foto" cuando esté listo</Text>
              </VStack>
            </Box>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}
