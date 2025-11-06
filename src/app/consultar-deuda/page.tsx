'use client'

import React, { useState, useEffect } from 'react'
import {
  Box,
  Container,
  Heading,
  VStack,
  HStack,
  Input,
  Button,
  useToast,
  Card,
  CardBody,
  Text,
  Badge,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Alert,
  AlertIcon,
  Spinner,
  Divider,
  FormControl,
  FormLabel
} from '@chakra-ui/react'
import { FiSearch, FiUser, FiCreditCard } from 'react-icons/fi'
import { useAuth } from '@/hooks/useAuth'
import { useQuery } from '@tanstack/react-query'

interface Representante {
  id: string
  nombre: string
  cedula: string
  email: string
  telefono: string
}

interface Pago {
  id: string
  concepto: string
  monto: number
  fechaPago: string
  estado: string
  estadoVerificacion: string
  comentarioAdmin?: string
  fechaVerificacion?: string
  verificadoPor?: string
  comprobante?: string
}

interface DeudaConsulta {
  representante: Representante
  pagos: Pago[]
  totalPendiente: number
  totalPagado: number
  totalVencido: number
}

export default function ConsultarDeudaPage() {
  const { usuario, isRepresentante, isAdmin, loading: authLoading } = useAuth()
  const [busqueda, setBusqueda] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [resultado, setResultado] = useState<DeudaConsulta | null>(null)
  const [error, setError] = useState('')
  const [representantes, setRepresentantes] = useState<any[]>([])
  const toast = useToast()

  // Log del usuario al cargar el componente
  useEffect(() => {
    if (usuario) {
      console.log('Usuario logueado:', {
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
        representanteId: usuario.representanteId
      })
    }
  }, [usuario])

  // Cargar lista de representantes
  useEffect(() => {
    const fetchRepresentantes = async () => {
      try {
        const res = await fetch('/api/representantes')
        if (res.ok) {
          const data = await res.json()
          console.log('Total representantes cargados:', data.length)
          setRepresentantes(data)
        }
      } catch (error) {
        console.error('Error al cargar representantes:', error)
      }
    }
    fetchRepresentantes()
  }, [])

  // Query para auto-cargar deuda si es representante
  const { data: deudaAuto, isLoading: loadingDeuda } = useQuery({
    queryKey: ['deuda-auto', usuario?.representanteId, representantes.length],
    queryFn: async () => {
      if (!usuario?.representanteId || representantes.length === 0) return null
      
      // Buscar el representante en la lista cargada
      const representante = representantes.find(r => r.id === usuario.representanteId)
      
      if (!representante) {
        console.error('❌ No se encontró el representante con ID:', usuario.representanteId)
        console.error('IDs disponibles:', representantes.map(r => ({ id: r.id, nombre: r.nombre })))
        return null
      }

      console.log('✅ Representante encontrado en lista:', {
        id: representante.id,
        nombre: representante.nombre,
        cedula: representante.cedula
      })
      console.log('🔍 Consultando pagos para representante:', representante.nombre, 'Cédula:', representante.cedula)
      
      const res = await fetch(`/api/pagos/consultar?query=${encodeURIComponent(representante.cedula)}`)
      if (!res.ok) {
        console.error('Error al consultar pagos:', res.status)
        return null
      }
      
      const data = await res.json()
      console.log('Datos de pagos recibidos:', data)
      return data
    },
    enabled: isRepresentante && !!usuario?.representanteId && representantes.length > 0
  })

  // Actualizar resultado cuando se carga la deuda automáticamente
  useEffect(() => {
    if (deudaAuto && isRepresentante) {
      console.log('Actualizando resultado con deudaAuto:', deudaAuto.representante?.nombre)
      setResultado(deudaAuto)
    }
  }, [deudaAuto, isRepresentante])

  const handleConsultar = async () => {
    if (!busqueda.trim()) {
      toast({
        title: 'Error',
        description: 'Debe ingresar la cédula o el nombre',
        status: 'error',
        duration: 3000
      })
      return
    }

    setIsLoading(true)
    setError('')
    setResultado(null)

    try {
      const params = new URLSearchParams()
      params.append('query', busqueda.trim())

      const response = await fetch(`/api/pagos/consultar?${params}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al consultar deudas')
      }

      setResultado(data)
      toast({
        title: 'Consulta exitosa',
        description: 'Deudas encontradas',
        status: 'success',
        duration: 3000
      })
    } catch (error: any) {
      setError(error.message)
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 5000
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getEstadoColor = (estado: string) => {
    const colors: { [key: string]: string } = {
      'Pendiente': 'yellow',
      'Pagado': 'green',
      'Vencido': 'red'
    }
    return colors[estado] || 'gray'
  }

  const getVerificacionColor = (verificacion: string) => {
    const colors: { [key: string]: string } = {
      'Pendiente': 'yellow',
      'Aprobado': 'green',
      'Denegado': 'red'
    }
    return colors[verificacion] || 'gray'
  }

  const limpiarConsulta = () => {
    setBusqueda('')
    setResultado(null)
    setError('')
  }

  if (authLoading || (isRepresentante && loadingDeuda)) {
    return (
      <Container maxW="container.xl" py={20}>
        <Box textAlign="center">
          <Spinner size="xl" color="blue.500" />
          <Text mt={4} color="gray.600">Cargando información...</Text>
        </Box>
      </Container>
    )
  }

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        {/* Header */}
        <Box textAlign="center">
          <Heading size="xl" color="blue.600" mb={2}>
            <FiCreditCard style={{ display: 'inline', marginRight: '10px' }} />
            {isRepresentante ? 'Mis Pagos' : 'Consultar Deudas'}
          </Heading>
          <Text color="gray.600" fontSize="lg">
            {isRepresentante 
              ? 'Consulta el detalle de tus pagos realizados y pendientes'
              : 'Ingrese la cédula o nombre del representante para consultar sus deudas'}
          </Text>
        </Box>

        {/* Formulario de consulta - Solo para admin */}
        {isAdmin && (
          <Card>
          <CardBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel fontWeight="semibold">
                  <FiUser style={{ display: 'inline', marginRight: '5px' }} />
                  Buscar por Cédula o Nombre
                </FormLabel>
                <Input
                  placeholder="Ej: 12345678 o Juan Pérez"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  size="lg"
                  onKeyPress={(e) => e.key === 'Enter' && handleConsultar()}
                />
                <Text fontSize="sm" color="gray.500" mt={2}>
                  Ingresa la cédula o el nombre del representante
                </Text>
              </FormControl>

              <Button
                leftIcon={<FiSearch />}
                colorScheme="blue"
                size="lg"
                onClick={handleConsultar}
                isLoading={isLoading}
                loadingText="Consultando..."
                width="full"
              >
                Consultar Deudas
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={limpiarConsulta}
                isDisabled={isLoading}
              >
                Limpiar búsqueda
              </Button>
            </VStack>
          </CardBody>
        </Card>
        )}

        {/* Loading para búsqueda manual */}
        {isLoading && (
          <Box textAlign="center" py={8}>
            <Spinner size="xl" color="blue.500" />
            <Text mt={4} color="gray.600">Consultando deudas...</Text>
          </Box>
        )}

        {/* Error */}
        {error && (
          <Alert status="error">
            <AlertIcon />
            {error}
          </Alert>
        )}

        {/* Resultado */}
        {resultado && (
          <VStack spacing={6} align="stretch">
            {/* Información del Representante */}
            <Card>
              <CardBody>
                <Heading size="md" mb={4} color="blue.600">
                  <FiUser style={{ display: 'inline', marginRight: '10px' }} />
                  Información del Representante
                </Heading>
                <VStack spacing={2} align="stretch">
                  <HStack justify="space-between">
                    <Text fontWeight="semibold">Nombre:</Text>
                    <Text>{resultado.representante.nombre}</Text>
                  </HStack>
                  <HStack justify="space-between">
                    <Text fontWeight="semibold">Cédula:</Text>
                    <Text>{resultado.representante.cedula}</Text>
                  </HStack>
                  <HStack justify="space-between">
                    <Text fontWeight="semibold">Email:</Text>
                    <Text>{resultado.representante.email}</Text>
                  </HStack>
                  <HStack justify="space-between">
                    <Text fontWeight="semibold">Teléfono:</Text>
                    <Text>{resultado.representante.telefono}</Text>
                  </HStack>
                </VStack>
              </CardBody>
            </Card>

            {/* Resumen de Deudas */}
            <Card>
              <CardBody>
                <Heading size="md" mb={4} color="blue.600">
                  <FiCreditCard style={{ display: 'inline', marginRight: '10px' }} />
                  Resumen de Deudas
                </Heading>
                <HStack spacing={6} justify="space-around">
                  <VStack>
                    <Text fontSize="2xl" fontWeight="bold" color="yellow.500">
                      ${resultado.totalPendiente.toFixed(2)}
                    </Text>
                    <Badge colorScheme="yellow" fontSize="sm">Pendiente</Badge>
                  </VStack>
                  <VStack>
                    <Text fontSize="2xl" fontWeight="bold" color="green.500">
                      ${resultado.totalPagado.toFixed(2)}
                    </Text>
                    <Badge colorScheme="green" fontSize="sm">Pagado</Badge>
                  </VStack>
                  <VStack>
                    <Text fontSize="2xl" fontWeight="bold" color="red.500">
                      ${resultado.totalVencido.toFixed(2)}
                    </Text>
                    <Badge colorScheme="red" fontSize="sm">Vencido</Badge>
                  </VStack>
                </HStack>
              </CardBody>
            </Card>

            {/* Tabla de Pagos */}
            <Card>
              <CardBody>
                <Heading size="md" mb={4} color="blue.600">
                  Detalle de Pagos
                </Heading>
                {resultado.pagos.length > 0 ? (
                  <Box overflowX="auto">
                    <Table variant="simple" size="sm">
                      <Thead>
                        <Tr>
                          <Th>Concepto</Th>
                          <Th>Monto</Th>
                          <Th>Fecha Pago</Th>
                          <Th>Estado</Th>
                          <Th>Verificación</Th>
                          <Th>Comentarios</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {resultado.pagos.map((pago) => (
                          <Tr key={pago.id}>
                            <Td fontWeight="semibold">{pago.concepto}</Td>
                            <Td>${pago.monto.toFixed(2)}</Td>
                            <Td>{new Date(pago.fechaPago).toLocaleDateString('es-ES')}</Td>
                            <Td>
                              <Badge colorScheme={getEstadoColor(pago.estado)}>
                                {pago.estado}
                              </Badge>
                            </Td>
                            <Td>
                              <Badge colorScheme={getVerificacionColor(pago.estadoVerificacion || 'Pendiente')}>
                                {pago.estadoVerificacion || 'Pendiente'}
                              </Badge>
                            </Td>
                            <Td>
                              {pago.comentarioAdmin ? (
                                <Text fontSize="sm" color="gray.600">
                                  {pago.comentarioAdmin}
                                </Text>
                              ) : (
                                <Text fontSize="sm" color="gray.400">-</Text>
                              )}
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </Box>
                ) : (
                  <Text color="gray.500" textAlign="center" py={4}>
                    No se encontraron pagos registrados
                  </Text>
                )}
              </CardBody>
            </Card>

            {/* Información adicional */}
            <Alert status="info">
              <AlertIcon />
              <Box>
                <Text fontWeight="semibold">Información importante:</Text>
                <Text fontSize="sm">
                  • Los pagos marcados como "Pendiente" requieren verificación del administrador
                  • Los pagos "Denegados" necesitan ser corregidos y reenviados
                  • Para realizar un nuevo pago, use el formulario de registro de pagos
                </Text>
              </Box>
            </Alert>
          </VStack>
        )}
      </VStack>
    </Container>
  )
}