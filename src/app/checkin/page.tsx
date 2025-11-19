'use client'

import React, { useRef, useState, useCallback, useEffect } from 'react'
import {
  Box,
  Button,
  Container,
  Heading,
  VStack,
  HStack,
  Text,
  useToast,
  Card,
  CardBody,
  Badge,
  Image,
  Flex,
  Spacer,
  useColorModeValue,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Divider,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow
} from '@chakra-ui/react'
import { FiCamera, FiUser, FiCheck, FiClock, FiCalendar, FiTag, FiUsers, FiEye } from 'react-icons/fi'
import Webcam from 'react-webcam'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useFaceRecognition } from '@/hooks/useFaceRecognition'
import { base64ToFloat32Array } from '@/lib/base64Utils'

interface Nino {
  id: string
  nombre: string
  apellido: string
  fechaNacimiento: string
  cedula: string
  alergias?: string
  emergencia?: string
  categoria: string
  nivel: string
  activo: boolean
  representante: {
    id: string
    nombre: string
    cedula: string
    email: string
    telefono: string
  }
  cedulaFile?: string
  partidaFile?: string
  fotoFile?: string
  faceDescriptor?: string
  faceImageUrl?: string
}

interface CheckInRecord {
  id: string
  ninoId: string
  fecha: string
  hora: string
  tipo: 'entrada' | 'salida'
  observaciones?: string
}

export default function CheckInPage() {
  const webcamRef = useRef<Webcam>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [isRecognizing, setIsRecognizing] = useState(false)
  const [recognizedNino, setRecognizedNino] = useState<Nino | null>(null)
  const [lastCheckIn, setLastCheckIn] = useState<CheckInRecord | null>(null)
  const [detectionBox, setDetectionBox] = useState<{x: number, y: number, width: number, height: number} | null>(null)
  const [faceDetected, setFaceDetected] = useState(false)
  const [autoRecognitionTriggered, setAutoRecognitionTriggered] = useState(false)
  const toast = useToast()
  const cardBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')

  // Hook de reconocimiento facial
  const { modelsLoaded, extractDescriptor, calculateSimilarity, detectFace } = useFaceRecognition()

  // Obtener todos los niños con descriptores faciales
  const { data: ninos, isLoading } = useQuery<Nino[]>({
    queryKey: ['ninos-with-faces'],
    queryFn: async () => {
      // Incluir descriptores faciales en la consulta
      const res = await fetch('/api/ninos?includeFaceDescriptor=true')
      if (!res.ok) throw new Error('Error al cargar niños')
      return res.json()
    }
  })

  // Reconocer niño usando reconocimiento facial real
  const recognizeNino = useCallback(async () => {
    if (!webcamRef.current || !ninos || !modelsLoaded) {
      console.log('❌ No se puede reconocer: webcam, ninos o modelos no disponibles')
      return
    }

    try {
      console.log('🎯 Iniciando reconocimiento facial real...')
      setIsRecognizing(true)
      
      const video = webcamRef.current.video
      if (!video || video.readyState !== video.HAVE_ENOUGH_DATA) {
        throw new Error('El video no está listo')
      }

      // Extraer descriptor facial real usando face-api.js
      const descriptor = await extractDescriptor(video)
      
      if (!descriptor) {
        throw new Error('No se pudo extraer el descriptor facial. Asegúrate de que el rostro esté bien visible y centrado.')
      }

      // Validar que el descriptor sea válido
      if (!(descriptor instanceof Float32Array) || descriptor.length === 0) {
        throw new Error('El descriptor facial extraído no es válido. Intenta nuevamente.')
      }
      
      console.log('📸 Descriptor facial extraído:', descriptor.length, 'dimensiones')

      // Buscar coincidencias con niños registrados
      const ninosWithFaces = ninos.filter(nino => nino.faceDescriptor && nino.faceImageUrl)
      
      console.log('🔍 Niños con reconocimiento facial:', ninosWithFaces.length)
      console.log('📊 Total de niños:', ninos.length)
      console.log('👥 Niños con caras:', ninosWithFaces.map(n => `${n.nombre} ${n.apellido} - ${n.faceDescriptor ? 'Tiene descriptor' : 'Sin descriptor'}`))
      
      let bestMatch: { nino: Nino; similarity: number } | null = null
      
      for (const nino of ninosWithFaces) {
        if (!nino.faceDescriptor) continue
        
        try {
          // Decodificar descriptor desde Base64 usando función helper del navegador
          const existingDescriptor = base64ToFloat32Array(nino.faceDescriptor)
          
          // Calcular similitud usando el método del hook
          const similarity = calculateSimilarity(descriptor, existingDescriptor)
          
          console.log(`🎯 Similitud con ${nino.nombre} ${nino.apellido}:`, similarity.toFixed(3))
          
          // Umbral ajustado: con la nueva función, 0.5 es el punto de corte
          // Aceptamos similitudes >= 0.4 para ser más permisivos con variaciones de iluminación/ángulo
          if (similarity >= 0.4 && (!bestMatch || similarity > bestMatch.similarity)) {
            bestMatch = { nino, similarity }
          }
        } catch (err) {
          console.error('Error procesando descriptor:', err)
        }
      }

      if (bestMatch) {
        console.log('✅ ¡COINCIDENCIA ENCONTRADA!', bestMatch.nino.nombre, bestMatch.nino.apellido, 'Similitud:', bestMatch.similarity)
        setRecognizedNino(bestMatch.nino)
        
        // Simular obtener último check-in
        const mockLastCheckIn: CheckInRecord = {
          id: '1',
          ninoId: bestMatch.nino.id,
          fecha: format(new Date(), 'yyyy-MM-dd'),
          hora: format(new Date(), 'HH:mm'),
          tipo: 'entrada'
        }
        setLastCheckIn(mockLastCheckIn)
        
        toast({
          title: '¡Niño reconocido!',
          description: `${bestMatch.nino.nombre} ${bestMatch.nino.apellido} identificado correctamente (${Math.round(bestMatch.similarity * 100)}% similitud)`,
          status: 'success',
          duration: 3000
        })
      } else {
        // Encontrar la mejor similitud para mostrar en el mensaje
        let maxSimilarity = 0
        let bestNinoName = ''
        for (const nino of ninosWithFaces) {
          if (!nino.faceDescriptor) continue
          try {
            const existingDesc = base64ToFloat32Array(nino.faceDescriptor)
            const sim = calculateSimilarity(descriptor, existingDesc)
            if (sim > maxSimilarity) {
              maxSimilarity = sim
              bestNinoName = `${nino.nombre} ${nino.apellido}`
            }
          } catch (err) {
            console.error('Error calculando similitud:', err)
          }
        }
        
        console.log('❌ No se encontró coincidencia con umbral de 0.4')
        console.log('👥 Niños disponibles para comparación:', ninosWithFaces.length)
        console.log(`📊 Mejor similitud encontrada: ${maxSimilarity.toFixed(3)} (${bestNinoName})`)
        
        toast({
          title: 'Niño no reconocido',
          description: `No se encontró coincidencia suficiente (umbral: 40%, mejor: ${Math.round(maxSimilarity * 100)}% - ${bestNinoName}). Niños registrados: ${ninosWithFaces.length}`,
          status: 'warning',
          duration: 5000
        })
        
        // Reiniciar el escaneo automáticamente después de 3 segundos
        setTimeout(() => {
          console.log('🔄 Reiniciando escaneo automáticamente...')
          setAutoRecognitionTriggered(false)
          setIsScanning(true)
        }, 3000)
      }

    } catch (err) {
      console.error('Error reconociendo niño:', err)
      toast({
        title: 'Error',
        description: 'Error al reconocer al niño',
        status: 'error',
        duration: 3000
      })
    } finally {
      setIsRecognizing(false)
    }
  }, [ninos, modelsLoaded, extractDescriptor, calculateSimilarity, toast])

  // Detectar rostros en tiempo real usando face-api.js
  const detectFaces = useCallback(async () => {
    if (!webcamRef.current || !isScanning || !modelsLoaded) return

    try {
      const video = webcamRef.current.video
      if (!video || video.readyState !== video.HAVE_ENOUGH_DATA) return

      // Validar dimensiones del video
      if (!video.videoWidth || !video.videoHeight) {
        return
      }

      // Detectar rostro completo (con caja de detección)
      const faceDetection = await detectFace(video)
      
      if (faceDetection && faceDetection.detection && faceDetection.detection.box) {
        const box = faceDetection.detection.box
        
        // Validar que la caja tenga valores válidos
        if (box.x !== null && box.x !== undefined &&
            box.y !== null && box.y !== undefined &&
            box.width !== null && box.width !== undefined &&
            box.height !== null && box.height !== undefined &&
            box.width > 0 && box.height > 0) {
          setFaceDetected(true)
          setDetectionBox({
            x: box.x,
            y: box.y,
            width: box.width,
            height: box.height
          })
          
          // Reconocimiento automático inmediato al detectar rostro
          if (!isRecognizing && !recognizedNino && isScanning && !autoRecognitionTriggered) {
            console.log('🟢 Rostro detectado, iniciando reconocimiento automático...')
            setAutoRecognitionTriggered(true)
            setIsScanning(false)
            setTimeout(() => {
              console.log('🔍 Ejecutando reconocimiento...')
              recognizeNino()
            }, 500)
          }
        } else {
          setFaceDetected(false)
          setDetectionBox(null)
          setAutoRecognitionTriggered(false)
        }
      } else {
        setFaceDetected(false)
        setDetectionBox(null)
        setAutoRecognitionTriggered(false)
      }
    } catch (err) {
      console.error('Error en detección facial:', err)
      setFaceDetected(false)
      setDetectionBox(null)
    }
  }, [isScanning, isRecognizing, recognizedNino, autoRecognitionTriggered, modelsLoaded, detectFace, recognizeNino])

  // Ejecutar detección cada 200ms cuando está escaneando
  useEffect(() => {
    if (!isScanning) return

    const interval = setInterval(detectFaces, 200)
    return () => clearInterval(interval)
  }, [detectFaces, isScanning])

  // Función para registrar check-in
  const registerCheckIn = async (tipo: 'entrada' | 'salida') => {
    if (!recognizedNino) return

    try {
      const response = await fetch('/api/asistencias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ninoId: recognizedNino.id,
          tipo,
          observaciones: `Registro automático mediante reconocimiento facial`
        })
      })

      if (!response.ok) {
        throw new Error('Error al guardar asistencia')
      }

      const asistenciaData = await response.json()
      
      const newCheckIn: CheckInRecord = {
        id: asistenciaData.id,
        ninoId: recognizedNino.id,
        fecha: format(new Date(asistenciaData.fecha), 'yyyy-MM-dd'),
        hora: format(new Date(asistenciaData.fecha), 'HH:mm'),
        tipo
      }
      
      setLastCheckIn(newCheckIn)
      
      toast({
        title: `${tipo === 'entrada' ? 'Entrada' : 'Salida'} registrada`,
        description: `${recognizedNino.nombre} ${recognizedNino.apellido} - ${format(new Date(), 'HH:mm')}`,
        status: 'success',
        duration: 3000
      })
      
      // Limpiar después de 5 segundos
      setTimeout(() => {
        setRecognizedNino(null)
        setLastCheckIn(null)
        setAutoRecognitionTriggered(false)
        setIsScanning(false)
      }, 5000)
      
    } catch (error) {
      console.error('Error registrando check-in:', error)
      toast({
        title: 'Error',
        description: 'Error al registrar el check-in',
        status: 'error',
        duration: 3000
      })
    }
  }

  // Función para reiniciar escaneo
  const resetScanning = () => {
    setRecognizedNino(null)
    setLastCheckIn(null)
    setFaceDetected(false)
    setDetectionBox(null)
    setAutoRecognitionTriggered(false)
  }


  const videoConstraints = {
    width: 640,
    height: 480,
    facingMode: "user"
  }

  const getCategoriaColor = (categoria: string) => {
    const colors: { [key: string]: string } = {
      'Sub-6': 'blue',
      'Sub-8': 'green',
      'Sub-10': 'yellow',
      'Sub-12': 'orange',
      'Sub-14': 'red',
      'Sub-16': 'purple',
      'Sub-18': 'pink'
    }
    return colors[categoria] || 'gray'
  }

  return (
    <Container maxW="container.xl" py={4}>
      <VStack spacing={8} align="stretch">
        {/* Header */}
        <Box textAlign="center">
          <Heading size="2xl" color="blue.500" mb={4}>
            📸 Check-in con Reconocimiento Facial
          </Heading>
          <Text fontSize="xl" color="gray.600">
            Sistema de identificación automática para control de asistencia
          </Text>
        </Box>

        {/* Estadísticas rápidas */}
        <HStack spacing={6} justify="center">
          <Stat textAlign="center">
            <StatLabel>Niños Registrados</StatLabel>
            <StatNumber color="blue.500">{ninos?.length || 0}</StatNumber>
            <StatHelpText>
              <StatArrow type="increase" />
              Con reconocimiento facial
            </StatHelpText>
          </Stat>
          <Stat textAlign="center">
            <StatLabel>Check-ins Hoy</StatLabel>
            <StatNumber color="green.500">0</StatNumber>
            <StatHelpText>
              <StatArrow type="increase" />
              Entradas registradas
            </StatHelpText>
          </Stat>
        </HStack>

        {/* Cámara y Reconocimiento */}
        <Card bg={cardBg} borderColor={borderColor}>
          <CardBody>
            <VStack spacing={6}>
              {/* Cámara */}
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
                    border="4px solid"
                    borderColor={faceDetected ? "green.500" : "red.500"}
                    borderRadius="xl"
                    pointerEvents="none"
                    boxShadow="0 0 20px rgba(34, 197, 94, 0.5)"
                  />
                )}
              </Box>

              {/* Controles */}
              <HStack spacing={4}>
                <Button
                  onClick={() => setIsScanning(!isScanning)}
                  colorScheme={isScanning ? "red" : "blue"}
                  leftIcon={<FiCamera />}
                  size="lg"
                  isDisabled={!modelsLoaded}
                >
                  {isScanning ? "Detener Escaneo" : "Iniciar Escaneo"}
                </Button>
                
                {isRecognizing && (
                  <Button
                    colorScheme="yellow"
                    leftIcon={<FiUser />}
                    isLoading={true}
                    loadingText="Reconociendo automáticamente..."
                    isDisabled
                  >
                    Reconociendo...
                  </Button>
                )}
                
                {recognizedNino && (
                  <Button
                    onClick={resetScanning}
                    colorScheme="gray"
                    variant="outline"
                  >
                    Reiniciar
                  </Button>
                )}
              </HStack>


              {/* Botón de verificación */}
              <Button
                colorScheme="green"
                onClick={() => {
                  console.log('=== DIAGNÓSTICO DE NIÑOS ===')
                  console.log('Total de niños cargados:', ninos.length)
                  const ninosConReconocimiento = ninos.filter(n => n.faceDescriptor && n.faceImageUrl)
                  console.log('Niños con reconocimiento facial:', ninosConReconocimiento.length)
                  
                  ninos.forEach((nino, index) => {
                    console.log(`Niño ${index + 1}:`, {
                      nombre: `${nino.nombre} ${nino.apellido}`,
                      cedula: nino.cedula,
                      tieneDescriptor: !!nino.faceDescriptor,
                      tieneImagen: !!nino.faceImageUrl,
                      descriptorLength: nino.faceDescriptor ? nino.faceDescriptor.length : 0
                    })
                  })
                  
                  if (ninosConReconocimiento.length === 0) {
                    console.log('⚠️ PROBLEMA: No hay niños con reconocimiento facial registrados')
                  } else {
                    console.log('✅ Niños listos para reconocimiento:', ninosConReconocimiento.map(n => `${n.nombre} ${n.apellido}`))
                  }
                }}
                variant="outline"
                size="sm"
                leftIcon={<FiEye />}
                mr={2}
              >
                Verificar Niños
              </Button>


              {/* Estados */}
              <HStack spacing={4} justify="center">
                {isScanning && (
                  <Badge colorScheme="blue" variant="solid">
                    <HStack spacing={1}>
                      <FiCamera />
                      <Text>Escaneando...</Text>
                    </HStack>
                  </Badge>
                )}
                
                {faceDetected && (
                  <Badge colorScheme="green" variant="solid">
                    <HStack spacing={1}>
                      <FiCheck />
                      <Text>Rostro detectado</Text>
                    </HStack>
                  </Badge>
                )}
                
                {isRecognizing && (
                  <Badge colorScheme="yellow" variant="solid">
                    <HStack spacing={1}>
                      <FiUser />
                      <Text>Reconociendo...</Text>
                    </HStack>
                  </Badge>
                )}
              </HStack>
            </VStack>
          </CardBody>
        </Card>

        {/* Información del Niño Reconocido */}
        {recognizedNino && (
          <Card bg={cardBg} borderColor={borderColor}>
            <CardBody>
              <VStack spacing={6}>
                <HStack spacing={4} align="start" w="full">
                  {/* Foto del niño */}
                  <Box>
                    <Image
                      src={recognizedNino.fotoFile || recognizedNino.faceImageUrl}
                      alt={`${recognizedNino.nombre} ${recognizedNino.apellido}`}
                      boxSize="150px"
                      objectFit="cover"
                      borderRadius="md"
                      fallbackSrc="https://via.placeholder.com/150"
                    />
                  </Box>

                  {/* Datos del niño */}
                  <VStack align="start" spacing={3} flex={1}>
                    <Box>
                      <Heading size="lg" color="blue.500">
                        {recognizedNino.nombre} {recognizedNino.apellido}
                      </Heading>
                      <Text color="gray.600">Cédula: {recognizedNino.cedula}</Text>
                    </Box>

                    <HStack spacing={4}>
                      <Badge colorScheme={getCategoriaColor(recognizedNino.categoria)} variant="solid">
                        {recognizedNino.categoria}
                      </Badge>
                      <Badge colorScheme="purple" variant="outline">
                        {recognizedNino.nivel}
                      </Badge>
                      <Badge colorScheme={recognizedNino.activo ? "green" : "red"} variant="solid">
                        {recognizedNino.activo ? "Activo" : "Inactivo"}
                      </Badge>
                    </HStack>

                    {/* Información adicional */}
                    <VStack align="start" spacing={2}>
                      <Text fontSize="sm" color="gray.600">
                        <strong>Fecha de Nacimiento:</strong> {format(new Date(recognizedNino.fechaNacimiento), 'dd/MM/yyyy', { locale: es })}
                      </Text>
                      <Text fontSize="sm" color="gray.600">
                        <strong>Representante:</strong> {recognizedNino.representante.nombre}
                      </Text>
                      <Text fontSize="sm" color="gray.600">
                        <strong>Teléfono:</strong> {recognizedNino.representante.telefono}
                      </Text>
                      {recognizedNino.alergias && (
                        <Alert status="warning" size="sm">
                          <AlertIcon />
                          <AlertTitle fontSize="sm">Alergias:</AlertTitle>
                          <AlertDescription fontSize="sm">{recognizedNino.alergias}</AlertDescription>
                        </Alert>
                      )}
                    </VStack>
                  </VStack>
                </HStack>

                <Divider />

                {/* Último check-in */}
                {lastCheckIn && (
                  <Box w="full" p={4} bg="blue.50" borderRadius="md">
                    <Text fontWeight="bold" mb={2}>Último Check-in:</Text>
                    <HStack spacing={4}>
                      <Text fontSize="sm">
                        <strong>Fecha:</strong> {format(new Date(lastCheckIn.fecha), 'dd/MM/yyyy', { locale: es })}
                      </Text>
                      <Text fontSize="sm">
                        <strong>Hora:</strong> {lastCheckIn.hora}
                      </Text>
                      <Badge colorScheme={lastCheckIn.tipo === 'entrada' ? 'green' : 'orange'}>
                        {lastCheckIn.tipo === 'entrada' ? 'Entrada' : 'Salida'}
                      </Badge>
                    </HStack>
                  </Box>
                )}

                {/* Botones de acción */}
                <HStack spacing={4} justify="center">
                  <Button
                    onClick={() => registerCheckIn('entrada')}
                    colorScheme="green"
                    leftIcon={<FiClock />}
                    size="lg"
                  >
                    Registrar Entrada
                  </Button>
                  <Button
                    onClick={() => registerCheckIn('salida')}
                    colorScheme="orange"
                    leftIcon={<FiClock />}
                    size="lg"
                  >
                    Registrar Salida
                  </Button>
                </HStack>
              </VStack>
            </CardBody>
          </Card>
        )}

        {/* Instrucciones */}
        <Card bg="gray.50" borderColor="gray.200">
          <CardBody>
            <VStack spacing={4}>
              <Heading size="md" color="gray.700">Instrucciones de Uso</Heading>
              <VStack align="start" spacing={2} fontSize="sm" color="gray.600">
                <Text>1. <strong>Iniciar Escaneo:</strong> Haz clic en "Iniciar Escaneo" para activar la cámara</Text>
                <Text>2. <strong>Posicionar al Niño:</strong> Coloca al niño frente a la cámara con buena iluminación</Text>
                <Text>3. <strong>Reconocimiento Automático:</strong> El sistema detectará y reconocerá al niño automáticamente</Text>
                <Text>4. <strong>Registrar:</strong> Una vez identificado, registra la entrada o salida</Text>
              </VStack>
            </VStack>
          </CardBody>
        </Card>
      </VStack>
    </Container>
  )
}
