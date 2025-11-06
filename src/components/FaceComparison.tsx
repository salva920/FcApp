'use client'

import React, { useState, useCallback } from 'react'
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
  Progress,
  Badge,
  Divider,
  Image,
  Grid,
  GridItem
} from '@chakra-ui/react'
import { FiSearch, FiUser, FiCheck, FiX, FiAlertTriangle } from 'react-icons/fi'

interface FaceDescriptor {
  id: string
  descriptor: Float32Array
  imageUrl: string
  name: string
  cedula: string
}

interface FaceComparisonProps {
  newDescriptor: Float32Array
  newImageUrl: string
  existingFaces: FaceDescriptor[]
  onMatchFound: (match: FaceDescriptor) => void
  onNoMatch: () => void
  onClose: () => void
  threshold?: number
}

export default function FaceComparison({
  newDescriptor,
  newImageUrl,
  existingFaces,
  onMatchFound,
  onNoMatch,
  onClose,
  threshold = 0.6
}: FaceComparisonProps) {
  const [isComparing, setIsComparing] = useState(false)
  const [comparisonResults, setComparisonResults] = useState<Array<{
    face: FaceDescriptor
    similarity: number
    isMatch: boolean
  }>>([])
  const [currentStep, setCurrentStep] = useState(0)
  const [totalSteps, setTotalSteps] = useState(0)
  const toast = useToast()

  const calculateSimilarity = useCallback((desc1: Float32Array, desc2: Float32Array): number => {
    // Calcular distancia euclidiana entre descriptores faciales
    let sum = 0
    for (let i = 0; i < desc1.length; i++) {
      const diff = desc1[i] - desc2[i]
      sum += diff * diff
    }
    const distance = Math.sqrt(sum)
    
    // Convertir distancia a similitud (0-1, donde 1 es idéntico)
    // Normalizar considerando que la distancia máxima típica es ~1.4
    const similarity = Math.max(0, 1 - (distance / 1.4))
    return similarity
  }, [])

  const compareFaces = useCallback(async () => {
    if (existingFaces.length === 0) {
      onNoMatch()
      return
    }

    setIsComparing(true)
    setTotalSteps(existingFaces.length)
    setCurrentStep(0)
    const results: Array<{ face: FaceDescriptor; similarity: number; isMatch: boolean }> = []

    try {
      for (let i = 0; i < existingFaces.length; i++) {
        const existingFace = existingFaces[i]
        
        // Simular tiempo de procesamiento
        await new Promise(resolve => setTimeout(resolve, 300))
        
        const similarity = calculateSimilarity(newDescriptor, existingFace.descriptor)
        const isMatch = similarity >= threshold
        
        results.push({
          face: existingFace,
          similarity,
          isMatch
        })
        
        setCurrentStep(i + 1)
        setComparisonResults([...results])
      }

      // Ordenar resultados por similitud descendente
      results.sort((a, b) => b.similarity - a.similarity)
      
      const bestMatch = results[0]
      
      if (bestMatch.isMatch) {
        toast({
          title: 'Rostro encontrado',
          description: `Se encontró una coincidencia con ${bestMatch.face.name}`,
          status: 'warning',
          duration: 5000
        })
        onMatchFound(bestMatch.face)
      } else {
        toast({
          title: 'No se encontraron coincidencias',
          description: 'Este rostro no coincide con ningún registro existente',
          status: 'success',
          duration: 3000
        })
        onNoMatch()
      }

    } catch (error) {
      console.error('Error en comparación facial:', error)
      toast({
        title: 'Error',
        description: 'Error al comparar rostros',
        status: 'error',
        duration: 3000
      })
    } finally {
      setIsComparing(false)
    }
  }, [newDescriptor, existingFaces, threshold, calculateSimilarity, onMatchFound, onNoMatch, toast])

  const handleSkip = () => {
    onNoMatch()
  }

  const handleContinue = () => {
    const bestMatch = comparisonResults[0]
    if (bestMatch && bestMatch.isMatch) {
      onMatchFound(bestMatch.face)
    } else {
      onNoMatch()
    }
  }

  return (
    <Modal isOpen onClose={onClose} size="xl" closeOnOverlayClick={false}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <HStack>
            <FiSearch />
            <Text>Comparación Facial</Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody pb={6}>
          <VStack spacing={6}>
            {/* Imagen nueva */}
            <Box>
              <Text fontWeight="bold" mb={2}>Nueva imagen capturada:</Text>
              <Image
                src={newImageUrl}
                alt="Nueva imagen"
                maxW="200px"
                maxH="150px"
                objectFit="cover"
                borderRadius="md"
              />
            </Box>

            <Divider />

            {/* Progreso de comparación */}
            {isComparing && (
              <VStack spacing={4} w="full">
                <Text fontWeight="bold">Comparando con registros existentes...</Text>
                <Progress 
                  value={(currentStep / totalSteps) * 100} 
                  colorScheme="blue" 
                  size="lg" 
                  w="full"
                />
                <Text fontSize="sm" color="gray.600">
                  {currentStep} de {totalSteps} comparaciones completadas
                </Text>
              </VStack>
            )}

            {/* Resultados de comparación */}
            {comparisonResults.length > 0 && !isComparing && (
              <VStack spacing={4} w="full">
                <Text fontWeight="bold">Resultados de la comparación:</Text>
                
                <Grid templateColumns="repeat(auto-fit, minmax(300px, 1fr))" gap={4} w="full">
                  {comparisonResults.slice(0, 5).map((result, index) => (
                    <GridItem key={result.face.id}>
                      <Box
                        p={4}
                        border="1px solid"
                        borderColor={result.isMatch ? "red.200" : "gray.200"}
                        borderRadius="md"
                        bg={result.isMatch ? "red.50" : "gray.50"}
                      >
                        <VStack spacing={3}>
                          <Image
                            src={result.face.imageUrl}
                            alt={result.face.name}
                            maxW="100px"
                            maxH="80px"
                            objectFit="cover"
                            borderRadius="md"
                          />
                          
                          <VStack spacing={1}>
                            <Text fontWeight="bold" fontSize="sm">
                              {result.face.name}
                            </Text>
                            <Text fontSize="xs" color="gray.600">
                              Cédula: {result.face.cedula}
                            </Text>
                          </VStack>

                          <Badge
                            colorScheme={result.isMatch ? "red" : "gray"}
                            variant="solid"
                            size="sm"
                          >
                            {result.isMatch ? "COINCIDENCIA" : "No coincide"}
                          </Badge>

                          <Text fontSize="sm" color="gray.600">
                            Similitud: {(result.similarity * 100).toFixed(1)}%
                          </Text>
                        </VStack>
                      </Box>
                    </GridItem>
                  ))}
                </Grid>

                {/* Alerta de coincidencia */}
                {comparisonResults[0]?.isMatch && (
                  <Alert status="warning">
                    <AlertIcon />
                    <Box>
                      <AlertTitle>¡Posible coincidencia encontrada!</AlertTitle>
                      <AlertDescription>
                        Se detectó una posible coincidencia con {comparisonResults[0].face.name} 
                        (Cédula: {comparisonResults[0].face.cedula}). 
                        ¿Desea continuar con el registro?
                      </AlertDescription>
                    </Box>
                  </Alert>
                )}
              </VStack>
            )}

            {/* Botones de acción */}
            <HStack spacing={4}>
              {!isComparing && comparisonResults.length === 0 && (
                <Button
                  onClick={compareFaces}
                  colorScheme="blue"
                  leftIcon={<FiSearch />}
                  isLoading={isComparing}
                >
                  Comparar Rostros
                </Button>
              )}

              {!isComparing && comparisonResults.length > 0 && (
                <>
                  {comparisonResults[0]?.isMatch ? (
                    <Button
                      onClick={handleContinue}
                      colorScheme="orange"
                      leftIcon={<FiAlertTriangle />}
                    >
                      Continuar de Todas Formas
                    </Button>
                  ) : (
                    <Button
                      onClick={handleContinue}
                      colorScheme="green"
                      leftIcon={<FiCheck />}
                    >
                      Continuar Registro
                    </Button>
                  )}
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

            {/* Información adicional */}
            <Box bg="blue.50" p={4} borderRadius="md" fontSize="sm">
              <Text fontWeight="bold" mb={2}>Información:</Text>
              <VStack align="start" spacing={1}>
                <Text>• El sistema compara el rostro con {existingFaces.length} registros existentes</Text>
                <Text>• Se considera coincidencia si la similitud es mayor al {(threshold * 100).toFixed(0)}%</Text>
                <Text>• Si encuentra una coincidencia, se le pedirá confirmación</Text>
              </VStack>
            </Box>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}
