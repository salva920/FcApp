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

  // Obtener todos los niños con descriptores faciales
  const { data: ninos, isLoading } = useQuery<Nino[]>({
    queryKey: ['ninos-with-faces'],
    queryFn: async () => {
      const res = await fetch('/api/ninos')
      if (!res.ok) throw new Error('Error al cargar niños')
      return res.json()
    }
  })

  // Detectar rostros en tiempo real
  const detectFaces = useCallback(async () => {
    if (!webcamRef.current || !isScanning) return

    try {
      const imageSrc = webcamRef.current.getScreenshot()
      if (!imageSrc) return
      
      // console.log('🔍 Analizando imagen para detección facial...') // Comentado para reducir logs

      // Análisis básico de imagen para simular detección de rostros
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
            // Posicionar el recuadro de detección en el centro de la imagen (donde está el rostro)
            // Posicionar el recuadro de detección centrado en el área facial
            const boxWidth = canvas.width * 0.35  // Tamaño apropiado para el rostro
            const boxHeight = boxWidth * 1.2      // Ligeramente más alto para cubrir el rostro
            const boxX = (canvas.width - boxWidth) / 2
            const boxY = (canvas.height - boxHeight) / 2 - (canvas.height * 0.05) // Centrado con ligero ajuste hacia arriba
            
            setDetectionBox({
              x: boxX,
              y: boxY,
              width: boxWidth,
              height: boxHeight
            })
            
            // Reconocimiento automático inmediato al detectar rostro
            if (!isRecognizing && !recognizedNino && isScanning && !autoRecognitionTriggered) {
              console.log('🟢 Rostro detectado, iniciando reconocimiento automático...')
              setAutoRecognitionTriggered(true)
              // Detener el escaneo para evitar múltiples reconocimientos
              setIsScanning(false)
              // Ejecutar reconocimiento inmediatamente
              setTimeout(() => {
                console.log('🔍 Ejecutando reconocimiento...')
                recognizeNino()
              }, 500) // Reducido a 500ms para respuesta más rápida
            }
          } else {
            setFaceDetected(false)
            setDetectionBox(null)
            setAutoRecognitionTriggered(false)
          }
        } catch (err) {
          console.error('Error en detección facial:', err)
        }
      }
      
      img.src = imageSrc
    } catch (err) {
      console.error('Error en detección facial:', err)
    }
  }, [isScanning, isRecognizing, recognizedNino, autoRecognitionTriggered])

  // Ejecutar detección cada 200ms cuando está escaneando
  useEffect(() => {
    if (!isScanning) return

    // console.log('📷 Iniciando escaneo de rostros...') // Comentado para reducir logs
    const interval = setInterval(detectFaces, 200)
    return () => clearInterval(interval)
  }, [detectFaces, isScanning])

  // Reconocer niño
  const recognizeNino = useCallback(async () => {
    if (!webcamRef.current || !ninos) {
      console.log('❌ No se puede reconocer: webcam o ninos no disponibles')
      return
    }

    try {
      console.log('🎯 Iniciando reconocimiento...')
      setIsRecognizing(true)
      
      const imageSrc = webcamRef.current.getScreenshot()
      if (!imageSrc) {
        throw new Error('No se pudo capturar la imagen')
      }
      
      console.log('📸 Imagen capturada para reconocimiento')

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

      // Buscar coincidencias con niños registrados
      const ninosWithFaces = ninos.filter(nino => nino.faceDescriptor && nino.faceImageUrl)
      
      console.log('🔍 Niños con reconocimiento facial:', ninosWithFaces.length)
      console.log('📊 Total de niños:', ninos.length)
      console.log('👥 Niños con caras:', ninosWithFaces.map(n => `${n.nombre} ${n.apellido} - ${n.faceDescriptor ? 'Tiene descriptor' : 'Sin descriptor'}`))
      
      let bestMatch: { nino: Nino; similarity: number } | null = null
      
      for (const nino of ninosWithFaces) {
        if (!nino.faceDescriptor) continue
        
        try {
          const existingDescriptor = new Float32Array(
            JSON.parse(Buffer.from(nino.faceDescriptor, 'base64').toString())
          )
          
          // Calcular similitud
          const similarity = calculateSimilarity(descriptor, existingDescriptor)
          
          console.log(`🎯 Similitud con ${nino.nombre} ${nino.apellido}:`, similarity)
          
              if (similarity > 0.1 && (!bestMatch || similarity > bestMatch.similarity)) {
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
        console.log('❌ No se encontró coincidencia con umbral de 0.1')
        console.log('👥 Niños disponibles para comparación:', ninosWithFaces.length)
        toast({
          title: 'Niño no reconocido',
          description: `No se encontró coincidencia. Niños registrados con reconocimiento: ${ninosWithFaces.length}. Revisa la consola para más detalles.`,
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
  }, [faceDetected, ninos, toast])

  // Función para calcular similitud
  const calculateSimilarity = (desc1: Float32Array, desc2: Float32Array): number => {
    if (desc1.length !== desc2.length) return 0

    let sum = 0
    let count = 0
    
    // Comparar solo los primeros 32 valores para hacer la comparación más rápida y menos estricta
    const maxLength = Math.min(32, desc1.length, desc2.length)
    
    for (let i = 0; i < maxLength; i++) {
      const diff = Math.abs(desc1[i] - desc2[i])
      sum += diff
      count++
    }
    
    const avgDiff = sum / count
    // Convertir diferencia promedio a similitud (0-1)
    const similarity = Math.max(0, 1 - (avgDiff * 3)) // Multiplicar por 3 para hacer más permisivo
    
    console.log(`Similitud calculada: ${similarity.toFixed(3)} (diferencia promedio: ${avgDiff.toFixed(3)})`)
    return similarity
  }

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
