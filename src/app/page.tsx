'use client'

import React, { useEffect } from 'react'
import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  Card,
  CardBody,
  Grid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  useColorModeValue,
  Badge,
  Alert,
  AlertIcon,
  Spinner,
  Stack
} from '@chakra-ui/react'
import { FiUsers, FiDollarSign, FiBell, FiBarChart, FiCamera, FiAlertCircle } from 'react-icons/fi'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { useQuery } from '@tanstack/react-query'

export default function HomePage() {
  const { usuario, isAdmin, isProfesor, isRepresentante, loading: authLoading } = useAuth()
  const cardBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')

  // Query para obtener información del representante
  const { data: deudaInfo } = useQuery({
    queryKey: ['deuda-representante', usuario?.representanteId],
    queryFn: async () => {
      if (!usuario?.representanteId) return null
      const res = await fetch(`/api/representantes/${usuario.representanteId}`)
      if (!res.ok) throw new Error('Error al cargar información')
      return res.json()
    },
    enabled: !!usuario?.representanteId
  })

  const { data: pagosInfo } = useQuery({
    queryKey: ['pagos-representante', usuario?.representanteId],
    queryFn: async () => {
      if (!usuario?.representanteId) return null
      const representante = await fetch(`/api/representantes/${usuario.representanteId}`).then(r => r.json())
      const res = await fetch(`/api/pagos/consultar?query=${encodeURIComponent(representante.cedula)}`)
      if (!res.ok) return { totalPendiente: 0, pagosPendientes: [] }
      return res.json()
    },
    enabled: !!usuario?.representanteId
  })

  // Si es admin, redirigir al dashboard
  useEffect(() => {
    if (isAdmin) {
      window.location.href = '/dashboard'
    }
  }, [isAdmin])

  if (authLoading) {
    return (
      <Container maxW="container.xl" py={20}>
        <Box textAlign="center">
          <Spinner size="xl" thickness="4px" speed="0.65s" emptyColor="gray.200" color="blue.500" />
          <Text mt={4}>Cargando...</Text>
        </Box>
      </Container>
    )
  }

  if (isAdmin) {
    return null
  }

  // Dashboard para Representante
  if (isRepresentante) {
    const pagosPendientes = pagosInfo?.pagosPendientes || []
    const totalPendiente = pagosInfo?.totalPendiente || 0
    const cantidadNinos = deudaInfo?.ninos?.length || 0
    
    return (
      <Container maxW="container.xl" py={8}>
        <VStack spacing={8} align="stretch">
          <Box>
            <Heading size="xl" mb={2}>
              Bienvenido, {usuario?.nombre}
            </Heading>
            <Text color="gray.600">
              Este es tu panel de control
            </Text>
          </Box>

          {/* Resumen Financiero */}
          <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={6}>
            <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" w="100%">
              <CardBody>
                <Stat>
                  <StatLabel>Niños Registrados</StatLabel>
                  <StatNumber>{cantidadNinos}</StatNumber>
                  <StatHelpText>
                    <FiUsers />
                    Activos
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>

            <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" w="100%">
              <CardBody>
                <Stat>
                  <StatLabel>Deuda Pendiente</StatLabel>
                  <StatNumber color={totalPendiente > 0 ? 'red.500' : 'green.500'}>
                    ${totalPendiente.toFixed(2)}
                  </StatNumber>
                  <StatHelpText>
                    {totalPendiente > 0 ? (
                      <>
                        <FiAlertCircle /> Requiere pago
                      </>
                    ) : (
                      <>
                        <StatArrow type="increase" /> Al día
                      </>
                    )}
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>

            <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" w="100%">
              <CardBody>
                <Stat>
                  <StatLabel>Pagos Pendientes</StatLabel>
                  <StatNumber color="yellow.500">
                    {pagosPendientes.length}
                  </StatNumber>
                  <StatHelpText>
                    Por verificar
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </Grid>

          {/* Alerta de Deuda */}
          {totalPendiente > 0 && (
            <Alert status="warning" borderRadius="md" alignItems="flex-start" flexWrap="wrap">
              <AlertIcon />
              <Box flex="1">
                <Heading size="sm">Tienes deuda pendiente</Heading>
                <Text fontSize="sm">
                  Total pendiente: <strong>${totalPendiente.toFixed(2)}</strong>
                </Text>
                <Button mt={3} size="sm" colorScheme="green" as={Link} href="/pago-publico" width={{ base: '100%', sm: 'auto' }}>
                  Pagar Ahora
                </Button>
              </Box>
            </Alert>
          )}

          {/* Acciones Rápidas */}
          <Box>
            <Heading size="md" mb={4}>Acciones Rápidas</Heading>
            <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }} gap={4}>
              <Card
                as={Link}
                href="/pago-publico"
                _hover={{ shadow: 'md', transform: 'translateY(-2px)' }}
                transition="all 0.2s"
                w="100%"
              >
                <CardBody>
                  <VStack spacing={3}>
                    <FiDollarSign size={32} color="#38a169" />
                    <Heading size="sm">Realizar Pago</Heading>
                    <Text fontSize="sm" color="gray.600" textAlign="center">
                      Sube tu comprobante de pago
                    </Text>
                  </VStack>
                </CardBody>
              </Card>

              <Card
                as={Link}
                href="/consultar-deuda"
                _hover={{ shadow: 'md', transform: 'translateY(-2px)' }}
                transition="all 0.2s"
                w="100%"
              >
                <CardBody>
                  <VStack spacing={3}>
                    <FiBarChart size={32} color="#e53e3e" />
                    <Heading size="sm">Ver Mis Deudas</Heading>
                    <Text fontSize="sm" color="gray.600" textAlign="center">
                      Consulta el detalle de tus pagos
                    </Text>
                  </VStack>
                </CardBody>
              </Card>

              <Card
                as={Link}
                href="/calendario"
                _hover={{ shadow: 'md', transform: 'translateY(-2px)' }}
                transition="all 0.2s"
                w="100%"
              >
                <CardBody>
                  <VStack spacing={3}>
                    <FiBell size={32} color="#3182ce" />
                    <Heading size="sm">Calendario</Heading>
                    <Text fontSize="sm" color="gray.600" textAlign="center">
                      Próximos eventos y actividades
                    </Text>
                  </VStack>
                </CardBody>
              </Card>
            </Grid>
          </Box>

          {/* Próximos Pagos */}
          {pagosPendientes.length > 0 && (
            <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
              <CardBody>
                <Heading size="md" mb={4}>Próximos Pagos</Heading>
                <VStack spacing={3} align="stretch">
                  {pagosPendientes.slice(0, 3).map((pago: any) => (
                    <Box key={pago.id} p={3} bg="gray.50" borderRadius="md">
                      <Stack
                        direction={{ base: 'column', sm: 'row' }}
                        justify="space-between"
                        align={{ base: 'flex-start', sm: 'center' }}
                        spacing={{ base: 2, sm: 4 }}
                      >
                        <Box>
                          <Text fontWeight="bold" fontSize={{ base: 'md', sm: 'lg' }}>{pago.concepto}</Text>
                          <Text fontSize="sm" color="gray.600">
                            Vence: {new Date(pago.fechaVencimiento).toLocaleDateString('es-ES')}
                          </Text>
                        </Box>
                        <Text fontSize={{ base: 'md', sm: 'lg' }} fontWeight="bold" color="red.500">
                          ${pago.monto.toFixed(2)}
                        </Text>
                      </Stack>
                    </Box>
                  ))}
                </VStack>
              </CardBody>
            </Card>
          )}
        </VStack>
      </Container>
    )
  }

  // Dashboard para Profesor
  if (isProfesor) {
    return (
      <Container maxW="container.xl" py={8}>
        <VStack spacing={8} align="stretch">
          <Box>
            <Heading size="xl" mb={2}>
              Bienvenido, {usuario?.nombre}
            </Heading>
            <Text color="gray.600">
              Panel de Control - Profesor
            </Text>
          </Box>

          <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }} gap={4}>
            <Card as={Link} href="/checkin" _hover={{ shadow: 'md', transform: 'translateY(-2px)' }} transition="all 0.2s">
              <CardBody>
                <VStack spacing={3}>
                  <FiCamera size={32} color="#9f7aea" />
                  <Heading size="sm">Check-in Facial</Heading>
                  <Text fontSize="sm" color="gray.600" textAlign="center">
                    Control de asistencia por reconocimiento facial
                  </Text>
                </VStack>
              </CardBody>
            </Card>

            <Card as={Link} href="/asistencias" _hover={{ shadow: 'md', transform: 'translateY(-2px)' }} transition="all 0.2s">
              <CardBody>
                <VStack spacing={3}>
                  <FiBarChart size={32} color="#38b2ac" />
                  <Heading size="sm">Ver Asistencias</Heading>
                  <Text fontSize="sm" color="gray.600" textAlign="center">
                    Consulta el registro de asistencias
                  </Text>
                </VStack>
              </CardBody>
            </Card>

            <Card as={Link} href="/calendario" _hover={{ shadow: 'md', transform: 'translateY(-2px)' }} transition="all 0.2s">
              <CardBody>
                <VStack spacing={3}>
                  <FiBell size={32} color="#ed8936" />
                  <Heading size="sm">Calendario</Heading>
                  <Text fontSize="sm" color="gray.600" textAlign="center">
                    Próximos eventos y actividades
                  </Text>
                </VStack>
              </CardBody>
            </Card>
          </Grid>
        </VStack>
      </Container>
    )
  }

  // Por defecto (no debería llegar aquí si hay autenticación)
  return (
    <Container maxW="container.xl" py={20}>
      <Box textAlign="center">
        <Heading mb={4}>Acceso Restringido</Heading>
        <Text color="gray.600">No tienes permisos para acceder a esta sección.</Text>
        <Button mt={4} as={Link} href="/login">
          Ir al Login
        </Button>
      </Box>
    </Container>
  )
}
