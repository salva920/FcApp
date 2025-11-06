'use client'

import React from 'react'
import {
  Box,
  Container,
  Heading,
  Grid,
  GridItem,
  Card,
  CardBody,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Text,
  VStack,
  HStack,
  Badge,
  useColorModeValue,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Progress,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Button,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select
} from '@chakra-ui/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FiUsers, FiDollarSign, FiAlertTriangle, FiTrendingUp, FiTrendingDown, FiBell, FiSend } from 'react-icons/fi'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts'
import { useRouter } from 'next/navigation'

interface Estadisticas {
  generales: {
    totalNinos: number
    totalRepresentantes: number
    totalPagos: number
    porcentajePagosAlDia: number
  }
  ninos: {
    porCategoria: Array<{
      categoria: string
      cantidad: number
    }>
  }
  pagos: {
    pagados: number
    pendientes: number
    vencidos: number
    ingresosTotales: number
    ingresosMesActual: number
  }
  deudores: {
    cantidad: number
    lista: Array<{
      id: string
      nombre: string
      cedula: string
      email: string
      pagosPendientes: number
    }>
  }
}

export default function DashboardPage() {
  const router = useRouter()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [notificacionData, setNotificacionData] = React.useState({
    tipo: 'Recordatorio',
    titulo: '',
    mensaje: '',
    metodoEnvio: 'Email'
  })
  const queryClient = useQueryClient()
  const cardBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')

  const { data: estadisticas, isLoading } = useQuery<Estadisticas>({
    queryKey: ['estadisticas'],
    queryFn: async () => {
      const res = await fetch('/api/estadisticas')
      if (!res.ok) throw new Error('Error al cargar estadísticas')
      return res.json()
    }
  })

  const notificacionMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/notificaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!res.ok) throw new Error('Error al enviar notificación')
      return res.json()
    },
    onSuccess: () => {
      onClose()
      setNotificacionData({
        tipo: 'Recordatorio',
        titulo: '',
        mensaje: '',
        metodoEnvio: 'Email'
      })
    }
  })

  const handleEnviarNotificacion = (e: React.FormEvent) => {
    e.preventDefault()
    notificacionMutation.mutate(notificacionData)
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

  const datosGraficoPagos = [
    { mes: 'Ene', pagados: estadisticas?.pagos.pagados || 0, pendientes: estadisticas?.pagos.pendientes || 0 },
    { mes: 'Feb', pagados: 12, pendientes: 3 },
    { mes: 'Mar', pagados: 15, pendientes: 2 },
    { mes: 'Abr', pagados: 18, pendientes: 1 },
    { mes: 'May', pagados: 20, pendientes: 0 },
    { mes: 'Jun', pagados: estadisticas?.pagos.pagados || 0, pendientes: estadisticas?.pagos.pendientes || 0 }
  ]

  const datosGraficoCategorias = estadisticas?.ninos.porCategoria.map(item => ({
    name: item.categoria,
    value: item.cantidad
  })) || []

  if (isLoading) {
    return (
      <Container maxW="container.xl" py={8}>
        <Text>Cargando dashboard...</Text>
      </Container>
    )
  }

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        {/* Header */}
        <Box>
          <Heading size="xl" mb={2}>Dashboard Administrativo</Heading>
          <Text color="gray.600">
            Vista general del sistema de gestión de fútbol
          </Text>
        </Box>

        {/* Métricas principales */}
        <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }} gap={6}>
          <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
            <CardBody>
              <Stat>
                <StatLabel>Total Niños</StatLabel>
                <StatNumber>{estadisticas?.generales.totalNinos || 0}</StatNumber>
                <StatHelpText>
                  <StatArrow type="increase" />
                  Registrados
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
            <CardBody>
              <Stat>
                <StatLabel>Representantes</StatLabel>
                <StatNumber>{estadisticas?.generales.totalRepresentantes || 0}</StatNumber>
                <StatHelpText>
                  <StatArrow type="increase" />
                  Activos
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
            <CardBody>
              <Stat>
                <StatLabel>Pagos al Día</StatLabel>
                <StatNumber color={estadisticas?.generales.porcentajePagosAlDia && estadisticas.generales.porcentajePagosAlDia > 80 ? 'green.500' : 'red.500'}>
                  {estadisticas?.generales.porcentajePagosAlDia || 0}%
                </StatNumber>
                <StatHelpText>
                  <StatArrow type={estadisticas?.generales.porcentajePagosAlDia && estadisticas.generales.porcentajePagosAlDia > 80 ? 'increase' : 'decrease'} />
                  {estadisticas?.generales.porcentajePagosAlDia && estadisticas.generales.porcentajePagosAlDia > 80 ? 'Excelente' : 'Necesita atención'}
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
            <CardBody>
              <Stat>
                <StatLabel>Ingresos del Mes</StatLabel>
                <StatNumber color="green.500">
                  ${estadisticas?.pagos.ingresosMesActual.toFixed(2) || '0.00'}
                </StatNumber>
                <StatHelpText>
                  <StatArrow type="increase" />
                  Total cobrado
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </Grid>

        {/* Alertas importantes */}
        {estadisticas?.deudores.cantidad && estadisticas.deudores.cantidad > 0 && (
          <Alert status="warning">
            <AlertIcon />
            <Box>
              <AlertTitle>¡Atención requerida!</AlertTitle>
              <AlertDescription>
                Tienes {estadisticas.deudores.cantidad} representantes con pagos pendientes. 
                <Button ml={4} size="sm" colorScheme="orange" onClick={onOpen}>
                  Enviar recordatorios
                </Button>
              </AlertDescription>
            </Box>
          </Alert>
        )}

        {/* Acceso rápido al módulo de notificaciones */}
        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
          <CardBody>
            <HStack justify="space-between">
              <VStack align="start" spacing={1}>
                <Heading size="md">Módulo de Notificaciones</Heading>
                <Text color="gray.600">
                  Gestiona comunicaciones masivas, recordatorios y notificaciones a representantes
                </Text>
              </VStack>
              <Button
                colorScheme="purple"
                leftIcon={<FiBell />}
                onClick={() => router.push('/notificaciones')}
                size="lg"
              >
                Ir a Notificaciones
              </Button>
            </HStack>
          </CardBody>
        </Card>

        {/* Gráficos */}
        <Grid templateColumns={{ base: '1fr', lg: 'repeat(2, 1fr)' }} gap={6}>
          {/* Gráfico de pagos por mes */}
          <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
            <CardBody>
              <Heading size="md" mb={4}>Pagos por Mes</Heading>
              <Box height="300px">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={datosGraficoPagos}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mes" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="pagados" fill="#00C49F" name="Pagados" />
                    <Bar dataKey="pendientes" fill="#FFBB28" name="Pendientes" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardBody>
          </Card>

          {/* Gráfico de niños por categoría */}
          <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
            <CardBody>
              <Heading size="md" mb={4}>Niños por Categoría</Heading>
              <Box height="300px">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={datosGraficoCategorias}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {datosGraficoCategorias.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardBody>
          </Card>
        </Grid>

        {/* Tabla de deudores */}
        {estadisticas?.deudores.lista && estadisticas.deudores.lista.length > 0 && (
          <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
            <CardBody>
              <Heading size="md" mb={4}>Representantes con Pagos Pendientes</Heading>
              <Table variant="simple" size="sm">
                <Thead>
                  <Tr>
                    <Th>Representante</Th>
                    <Th>Cédula</Th>
                    <Th>Email</Th>
                    <Th>Pagos Pendientes</Th>
                    <Th>Acciones</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {estadisticas.deudores.lista.map((deudor) => (
                    <Tr key={deudor.id}>
                      <Td fontWeight="bold">{deudor.nombre}</Td>
                      <Td>{deudor.cedula}</Td>
                      <Td>{deudor.email}</Td>
                      <Td>
                        <Badge colorScheme="red">{deudor.pagosPendientes}</Badge>
                      </Td>
                      <Td>
                        <Button size="sm" colorScheme="orange" leftIcon={<FiBell />}>
                          Recordar
                        </Button>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </CardBody>
          </Card>
        )}

        {/* Resumen de pagos */}
        <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={6}>
          <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
            <CardBody>
              <Stat>
                <StatLabel>Pagos Pagados</StatLabel>
                <StatNumber color="green.500">{estadisticas?.pagos.pagados || 0}</StatNumber>
                <Progress 
                  value={estadisticas?.generales.porcentajePagosAlDia || 0} 
                  colorScheme="green" 
                  size="sm" 
                  mt={2}
                />
              </Stat>
            </CardBody>
          </Card>

          <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
            <CardBody>
              <Stat>
                <StatLabel>Pagos Pendientes</StatLabel>
                <StatNumber color="yellow.500">{estadisticas?.pagos.pendientes || 0}</StatNumber>
                <Text fontSize="sm" color="gray.500" mt={2}>
                  Requieren seguimiento
                </Text>
              </Stat>
            </CardBody>
          </Card>

          <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
            <CardBody>
              <Stat>
                <StatLabel>Pagos Vencidos</StatLabel>
                <StatNumber color="red.500">{estadisticas?.pagos.vencidos || 0}</StatNumber>
                <Text fontSize="sm" color="gray.500" mt={2}>
                  Acción inmediata
                </Text>
              </Stat>
            </CardBody>
          </Card>
        </Grid>
      </VStack>

      {/* Modal de notificaciones */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Enviar Notificación</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <form onSubmit={handleEnviarNotificacion}>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Tipo de Notificación</FormLabel>
                  <Select
                    value={notificacionData.tipo}
                    onChange={(e) =>
                      setNotificacionData({ ...notificacionData, tipo: e.target.value })
                    }
                  >
                    <option value="Recordatorio">Recordatorio de Pago</option>
                    <option value="Comunicado">Comunicado General</option>
                    <option value="Evento">Evento/Torneo</option>
                  </Select>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Título</FormLabel>
                  <Input
                    value={notificacionData.titulo}
                    onChange={(e) =>
                      setNotificacionData({ ...notificacionData, titulo: e.target.value })
                    }
                    placeholder="Título de la notificación"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Mensaje</FormLabel>
                  <Textarea
                    value={notificacionData.mensaje}
                    onChange={(e) =>
                      setNotificacionData({ ...notificacionData, mensaje: e.target.value })
                    }
                    placeholder="Contenido del mensaje"
                    rows={4}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Método de Envío</FormLabel>
                  <Select
                    value={notificacionData.metodoEnvio}
                    onChange={(e) =>
                      setNotificacionData({ ...notificacionData, metodoEnvio: e.target.value })
                    }
                  >
                    <option value="Email">Email</option>
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Ambos">Email y WhatsApp</option>
                  </Select>
                </FormControl>

                <Button
                  type="submit"
                  colorScheme="blue"
                  width="full"
                  leftIcon={<FiSend />}
                  isLoading={notificacionMutation.isPending}
                >
                  Enviar Notificación
                </Button>
              </VStack>
            </form>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Container>
  )
}

