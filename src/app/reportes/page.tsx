'use client'

import React from 'react'
import {
  Box,
  Container,
  Heading,
  VStack,
  HStack,
  Button,
  Card,
  CardBody,
  Text,
  useColorModeValue,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Select,
  FormControl,
  FormLabel,
  Grid,
  GridItem,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow
} from '@chakra-ui/react'
import { useQuery } from '@tanstack/react-query'
import { FiDownload, FiFileText, FiBarChart, FiUsers, FiDollarSign } from 'react-icons/fi'
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

export default function ReportesPage() {
  const cardBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')

  const { data: estadisticas, isLoading } = useQuery({
    queryKey: ['estadisticas'],
    queryFn: async () => {
      const res = await fetch('/api/estadisticas?includeDeportivos=true&includeProyecciones=true')
      if (!res.ok) throw new Error('Error al cargar estadísticas')
      return res.json()
    }
  })

  const { data: ninos } = useQuery({
    queryKey: ['ninos'],
    queryFn: async () => {
      const res = await fetch('/api/ninos')
      if (!res.ok) throw new Error('Error al cargar niños')
      return res.json()
    }
  })

  const { data: pagos } = useQuery({
    queryKey: ['pagos'],
    queryFn: async () => {
      const res = await fetch('/api/pagos')
      if (!res.ok) throw new Error('Error al cargar pagos')
      return res.json()
    }
  })

  const { data: representantes } = useQuery({
    queryKey: ['representantes'],
    queryFn: async () => {
      const res = await fetch('/api/representantes')
      if (!res.ok) throw new Error('Error al cargar representantes')
      return res.json()
    }
  })

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

  const datosGraficoCategorias = estadisticas?.ninos.porCategoria.map(item => ({
    name: item.categoria,
    value: item.cantidad
  })) || []

  const datosGraficoPagos = [
    { mes: 'Ene', pagados: 15, pendientes: 3, vencidos: 1 },
    { mes: 'Feb', pagados: 18, pendientes: 2, vencidos: 0 },
    { mes: 'Mar', pagados: 20, pendientes: 1, vencidos: 0 },
    { mes: 'Abr', pagados: 22, pendientes: 0, vencidos: 0 },
    { mes: 'May', pagados: 25, pendientes: 1, vencidos: 0 },
    { mes: 'Jun', pagados: estadisticas?.pagos.pagados || 0, pendientes: estadisticas?.pagos.pendientes || 0, vencidos: estadisticas?.pagos.vencidos || 0 }
  ]

  const handleExportarExcel = () => {
    import('@/lib/exportUtils').then(({ exportarExcel }) => {
      exportarExcel({
        estadisticas,
        ninos: ninos || [],
        pagos: pagos || [],
        representantes: representantes || []
      })
    })
  }

  const handleExportarPDF = () => {
    import('@/lib/exportUtils').then(({ exportarPDF }) => {
      exportarPDF({
        estadisticas,
        ninos: ninos || [],
        pagos: pagos || [],
        representantes: representantes || []
      })
    })
  }

  if (isLoading) {
    return (
      <Container maxW="container.xl" py={8}>
        <Text>Cargando reportes...</Text>
      </Container>
    )
  }

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        {/* Header */}
        <Box>
          <HStack justify="space-between" align="center">
            <Box>
              <Heading size="xl" mb={2}>Reportes y Estadísticas</Heading>
              <Text color="gray.600">
                Análisis detallado del sistema de gestión de fútbol
              </Text>
            </Box>
            <HStack spacing={4}>
              <Button leftIcon={<FiDownload />} colorScheme="green" onClick={handleExportarExcel}>
                Exportar Excel
              </Button>
              <Button leftIcon={<FiFileText />} colorScheme="red" onClick={handleExportarPDF}>
                Exportar PDF
              </Button>
            </HStack>
          </HStack>
        </Box>

        {/* Resumen ejecutivo */}
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
                <StatLabel>Ingresos Totales</StatLabel>
                <StatNumber color="green.500">
                  ${estadisticas?.pagos.ingresosTotales.toFixed(2) || '0.00'}
                </StatNumber>
                <StatHelpText>
                  <StatArrow type="increase" />
                  Histórico
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </Grid>

        {/* Gráficos principales */}
        <Grid templateColumns={{ base: '1fr', lg: 'repeat(2, 1fr)' }} gap={6}>
          {/* Gráfico de niños por categoría */}
          <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
            <CardBody>
              <Heading size="md" mb={4}>Distribución por Categorías</Heading>
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

          {/* Gráfico de pagos por mes */}
          <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
            <CardBody>
              <Heading size="md" mb={4}>Evolución de Pagos</Heading>
              <Box height="300px">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={datosGraficoPagos}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mes" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="pagados" stroke="#00C49F" strokeWidth={2} />
                    <Line type="monotone" dataKey="pendientes" stroke="#FFBB28" strokeWidth={2} />
                    <Line type="monotone" dataKey="vencidos" stroke="#FF8042" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardBody>
          </Card>
        </Grid>

        {/* Tabla de representantes con pagos pendientes */}
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
                    <Th>Teléfono</Th>
                    <Th>Pagos Pendientes</Th>
                    <Th>Estado</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {estadisticas.deudores.lista.map((deudor) => (
                    <Tr key={deudor.id}>
                      <Td fontWeight="bold">{deudor.nombre}</Td>
                      <Td>{deudor.cedula}</Td>
                      <Td>{deudor.email}</Td>
                      <Td>-</Td>
                      <Td>
                        <Badge colorScheme="red">{deudor.pagosPendientes}</Badge>
                      </Td>
                      <Td>
                        <Badge colorScheme="red">Deudor</Badge>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </CardBody>
          </Card>
        )}

        {/* Análisis de pagos */}
        <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={6}>
          <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
            <CardBody>
              <Heading size="md" mb={4}>Estado de Pagos</Heading>
              <Box height="250px">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { estado: 'Pagados', cantidad: estadisticas?.pagos.pagados || 0 },
                    { estado: 'Pendientes', cantidad: estadisticas?.pagos.pendientes || 0 },
                    { estado: 'Vencidos', cantidad: estadisticas?.pagos.vencidos || 0 }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="estado" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="cantidad" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardBody>
          </Card>

          <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
            <CardBody>
              <Heading size="md" mb={4}>Resumen Financiero</Heading>
              <VStack spacing={4} align="stretch">
                <HStack justify="space-between">
                  <Text>Ingresos Totales:</Text>
                  <Text fontWeight="bold" color="green.500">
                    ${estadisticas?.pagos.ingresosTotales.toFixed(2) || '0.00'}
                  </Text>
                </HStack>
                <HStack justify="space-between">
                  <Text>Ingresos del Mes:</Text>
                  <Text fontWeight="bold" color="blue.500">
                    ${estadisticas?.pagos.ingresosMesActual.toFixed(2) || '0.00'}
                  </Text>
                </HStack>
                <HStack justify="space-between">
                  <Text>Pagos Pendientes:</Text>
                  <Text fontWeight="bold" color="yellow.500">
                    {estadisticas?.pagos.pendientes || 0}
                  </Text>
                </HStack>
                <HStack justify="space-between">
                  <Text>Pagos Vencidos:</Text>
                  <Text fontWeight="bold" color="red.500">
                    {estadisticas?.pagos.vencidos || 0}
                  </Text>
                </HStack>
                <HStack justify="space-between">
                  <Text>Porcentaje al Día:</Text>
                  <Text fontWeight="bold" color={estadisticas?.generales.porcentajePagosAlDia && estadisticas.generales.porcentajePagosAlDia > 80 ? 'green.500' : 'red.500'}>
                    {estadisticas?.generales.porcentajePagosAlDia || 0}%
                  </Text>
                </HStack>
              </VStack>
            </CardBody>
          </Card>
        </Grid>

        {/* Análisis Deportivos */}
        {estadisticas?.deportivos && (
          <Grid templateColumns={{ base: '1fr', lg: 'repeat(2, 1fr)' }} gap={6}>
            <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
              <CardBody>
                <Heading size="md" mb={4}>Promedios por Competencia</Heading>
                <VStack spacing={4} align="stretch">
                  <HStack justify="space-between">
                    <Text>Técnico:</Text>
                    <Badge colorScheme="blue" fontSize="md" px={3} py={1}>
                      {estadisticas.deportivos.promedios.tecnico.toFixed(2)}/10
                    </Badge>
                  </HStack>
                  <HStack justify="space-between">
                    <Text>Táctico:</Text>
                    <Badge colorScheme="green" fontSize="md" px={3} py={1}>
                      {estadisticas.deportivos.promedios.tactico.toFixed(2)}/10
                    </Badge>
                  </HStack>
                  <HStack justify="space-between">
                    <Text>Físico:</Text>
                    <Badge colorScheme="orange" fontSize="md" px={3} py={1}>
                      {estadisticas.deportivos.promedios.fisico.toFixed(2)}/10
                    </Badge>
                  </HStack>
                  <HStack justify="space-between">
                    <Text>Psicológico:</Text>
                    <Badge colorScheme="purple" fontSize="md" px={3} py={1}>
                      {estadisticas.deportivos.promedios.psicologico.toFixed(2)}/10
                    </Badge>
                  </HStack>
                </VStack>
                <Text fontSize="sm" color="gray.500" mt={4}>
                  Total de evaluaciones: {estadisticas.deportivos.totalEvaluaciones}
                </Text>
              </CardBody>
            </Card>

            <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
              <CardBody>
                <Heading size="md" mb={4}>Top 5 Jugadores</Heading>
                {estadisticas.deportivos.topJugadores && estadisticas.deportivos.topJugadores.length > 0 ? (
                  <Table variant="simple" size="sm">
                    <Thead>
                      <Tr>
                        <Th>Jugador</Th>
                        <Th>Categoría</Th>
                        <Th isNumeric>Promedio</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {estadisticas.deportivos.topJugadores.map((jugador: any, index: number) => (
                        <Tr key={index}>
                          <Td fontWeight="bold">{jugador.nombre}</Td>
                          <Td>
                            <Badge colorScheme="blue">{jugador.categoria}</Badge>
                          </Td>
                          <Td isNumeric>
                            <Badge colorScheme="green">{jugador.promedio}</Badge>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                ) : (
                  <Text color="gray.500">No hay evaluaciones suficientes para mostrar ranking</Text>
                )}
              </CardBody>
            </Card>
          </Grid>
        )}

        {/* Proyecciones Financieras */}
        {estadisticas?.pagos?.ingresosUltimosMeses && estadisticas.pagos.ingresosUltimosMeses.length > 0 && (
          <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
            <CardBody>
              <Heading size="md" mb={4}>Proyecciones Financieras</Heading>
              <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={6}>
                <Box>
                  <Heading size="sm" mb={3}>Evolución de Ingresos (Últimos 6 Meses)</Heading>
                  <Box height="250px">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={estadisticas.pagos.ingresosUltimosMeses}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="mes" />
                        <YAxis />
                        <Tooltip formatter={(value: any) => `$${value.toFixed(2)}`} />
                        <Line type="monotone" dataKey="ingresos" stroke="#00C49F" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </Box>
                </Box>
                <VStack spacing={4} align="stretch" justify="center">
                  <Box>
                    <Text fontSize="sm" color="gray.600" mb={2}>Proyección del Próximo Mes</Text>
                    <Text fontSize="2xl" fontWeight="bold" color="green.500">
                      ${estadisticas.pagos.proyeccionIngresos?.toFixed(2) || '0.00'}
                    </Text>
                    <Text fontSize="xs" color="gray.500" mt={1}>
                      Basado en el promedio de los últimos 3 meses
                    </Text>
                  </Box>
                  <Box>
                    <Text fontSize="sm" color="gray.600" mb={2}>Ingresos del Mes Actual</Text>
                    <Text fontSize="xl" fontWeight="bold" color="blue.500">
                      ${estadisticas.pagos.ingresosMesActual.toFixed(2)}
                    </Text>
                  </Box>
                  <Box>
                    <Text fontSize="sm" color="gray.600" mb={2}>Ingresos Totales Históricos</Text>
                    <Text fontSize="xl" fontWeight="bold" color="purple.500">
                      ${estadisticas.pagos.ingresosTotales.toFixed(2)}
                    </Text>
                  </Box>
                </VStack>
              </Grid>
            </CardBody>
          </Card>
        )}

        {/* Estadísticas de Asistencias */}
        {estadisticas?.asistencias && (
          <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
            <CardBody>
              <Heading size="md" mb={4}>Estadísticas de Asistencias</Heading>
              <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={4}>
                <Stat>
                  <StatLabel>Total Asistencias</StatLabel>
                  <StatNumber>{estadisticas.asistencias.total}</StatNumber>
                </Stat>
                <Stat>
                  <StatLabel>Asistencias Puntuales</StatLabel>
                  <StatNumber color="green.500">{estadisticas.asistencias.puntuales}</StatNumber>
                </Stat>
                <Stat>
                  <StatLabel>Porcentaje de Puntualidad</StatLabel>
                  <StatNumber color={estadisticas.asistencias.porcentajePuntualidad >= 80 ? 'green.500' : 'orange.500'}>
                    {estadisticas.asistencias.porcentajePuntualidad}%
                  </StatNumber>
                </Stat>
              </Grid>
            </CardBody>
          </Card>
        )}

        {/* Recomendaciones */}
        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
          <CardBody>
            <Heading size="md" mb={4}>Recomendaciones</Heading>
            <VStack spacing={3} align="stretch">
              {estadisticas?.generales.porcentajePagosAlDia && estadisticas.generales.porcentajePagosAlDia < 80 && (
                <Text color="red.500" fontWeight="bold">
                  ⚠️ El porcentaje de pagos al día está por debajo del 80%. Se recomienda enviar recordatorios a los representantes con pagos pendientes.
                </Text>
              )}
              {estadisticas?.pagos.vencidos && estadisticas.pagos.vencidos > 0 && (
                <Text color="orange.500" fontWeight="bold">
                  🔔 Hay {estadisticas.pagos.vencidos} pagos vencidos que requieren seguimiento inmediato.
                </Text>
              )}
              {estadisticas?.asistencias && estadisticas.asistencias.porcentajePuntualidad < 80 && (
                <Text color="orange.500" fontWeight="bold">
                  ⏰ El porcentaje de puntualidad está por debajo del 80%. Se recomienda reforzar la importancia de la puntualidad.
                </Text>
              )}
              {estadisticas?.generales.porcentajePagosAlDia && estadisticas.generales.porcentajePagosAlDia >= 90 && (
                <Text color="green.500" fontWeight="bold">
                  ✅ Excelente gestión de pagos. El sistema está funcionando correctamente.
                </Text>
              )}
              {estadisticas?.deportivos && estadisticas.deportivos.totalEvaluaciones === 0 && (
                <Text color="blue.500" fontWeight="bold">
                  📊 No hay evaluaciones registradas. Se recomienda comenzar a evaluar a los jugadores para obtener análisis deportivos.
                </Text>
              )}
            </VStack>
          </CardBody>
        </Card>
      </VStack>
    </Container>
  )
}




