'use client'

import React from 'react'
import {
  Box,
  Container,
  Heading,
  VStack,
  HStack,
  Stack,
  Card,
  CardBody,
  Badge,
  Text,
  Input,
  Select,
  InputGroup,
  InputLeftElement,
  SimpleGrid
} from '@chakra-ui/react'
import { useQuery } from '@tanstack/react-query'
import { FiClock, FiCheckCircle, FiAlertCircle, FiUser, FiSearch, FiCalendar } from 'react-icons/fi'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface Asistencia {
  id: string
  fecha: string
  tipo: string
  puntual: boolean
  observaciones?: string
  nino: {
    id: string
    nombre: string
    apellido: string
    categoria: string
    representante: {
      nombre: string
      email: string
      telefono: string
    }
  }
}

export default function AsistenciasPage() {
  const [fechaFilter, setFechaFilter] = React.useState(format(new Date(), 'yyyy-MM-dd'))
  const [categoriaFilter, setCategoriaFilter] = React.useState('')
  const [searchFilter, setSearchFilter] = React.useState('')

  const { data: asistencias, isLoading } = useQuery<Asistencia[]>({
    queryKey: ['asistencias', fechaFilter],
    queryFn: async () => {
      const res = await fetch(`/api/asistencias?fecha=${fechaFilter}`)
      if (!res.ok) throw new Error('Error al cargar asistencias')
      return res.json()
    }
  })

  const filteredAsistencias = React.useMemo(() => {
    if (!asistencias) return []
    
    let filtered = asistencias
    
    // Filtro por categoría
    if (categoriaFilter) {
      filtered = filtered.filter(a => a.nino.categoria === categoriaFilter)
    }
    
    // Filtro por búsqueda (niño o representante)
    if (searchFilter) {
      const searchLower = searchFilter.toLowerCase().trim()
      filtered = filtered.filter(a => {
        const nombreNino = `${a.nino.nombre} ${a.nino.apellido}`.toLowerCase()
        const nombreRepresentante = a.nino.representante.nombre.toLowerCase()
        return nombreNino.includes(searchLower) || nombreRepresentante.includes(searchLower)
      })
    }
    
    return filtered
  }, [asistencias, categoriaFilter, searchFilter])

  const estadisticas = React.useMemo(() => {
    if (!asistencias) return { total: 0, puntuales: 0, tardios: 0, porcentajePuntualidad: 0 }
    
    const total = asistencias.length
    const puntuales = asistencias.filter(a => a.puntual).length
    const tardios = total - puntuales
    const porcentajePuntualidad = total > 0 ? (puntuales / total) * 100 : 0
    
    return { total, puntuales, tardios, porcentajePuntualidad }
  }, [asistencias])

  const getTipoColor = (tipo: string) => {
    return tipo === 'entrada' ? 'green' : 'orange'
  }

  return (
    <Container maxW="container.xl" py={6}>
      <VStack spacing={6} align="stretch">
        {/* Header simplificado */}
        <Box>
          <Heading size="lg" mb={1}>Asistencias</Heading>
          <Text color="gray.500" fontSize="sm">
            {format(new Date(fechaFilter), 'EEEE, d \'de\' MMMM yyyy', { locale: es })}
          </Text>
        </Box>

        {/* Filtros compactos en una sola línea */}
        <Card shadow="sm" borderWidth="1px" borderColor="gray.100">
          <CardBody p={{ base: 3, md: 4 }}>
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={{ base: 3, md: 4 }}>
              <InputGroup size="sm">
                <InputLeftElement pointerEvents="none" color="gray.400">
                  <FiCalendar />
                </InputLeftElement>
                <Input
                  type="date"
                  value={fechaFilter}
                  onChange={(e) => setFechaFilter(e.target.value)}
                  fontSize="sm"
                />
              </InputGroup>

              <Select
                size="sm"
                value={categoriaFilter}
                onChange={(e) => setCategoriaFilter(e.target.value)}
                placeholder="Todas las categorías"
                fontSize="sm"
              >
                <option value="">Todas las categorías</option>
                <option value="Sub-6">Sub-6</option>
                <option value="Sub-8">Sub-8</option>
                <option value="Sub-10">Sub-10</option>
                <option value="Sub-12">Sub-12</option>
                <option value="Sub-14">Sub-14</option>
                <option value="Sub-16">Sub-16</option>
                <option value="Sub-18">Sub-18</option>
              </Select>

              <InputGroup size="sm">
                <InputLeftElement pointerEvents="none" color="gray.400">
                  <FiSearch />
                </InputLeftElement>
                <Input
                  placeholder="Buscar niño o representante..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  fontSize="sm"
                />
              </InputGroup>
            </SimpleGrid>
          </CardBody>
        </Card>

        {/* Estadísticas modernas */}
        <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={{ base: 3, md: 4 }}>
          <Card bg="blue.50" borderWidth="1px" borderColor="blue.200">
            <CardBody>
              <HStack justify="space-between">
                <Box flex={1}>
                  <Text fontSize="xs" color="blue.600" fontWeight="medium" mb={1}>
                    Total
                  </Text>
                  <Text fontSize="2xl" fontWeight="bold" color="blue.700">
                    {estadisticas.total}
                  </Text>
                </Box>
                <Box p={3} bg="blue.100" borderRadius="lg">
                  <FiUser size={20} color="var(--chakra-colors-blue-600)" />
                </Box>
              </HStack>
            </CardBody>
          </Card>

          <Card bg="green.50" borderWidth="1px" borderColor="green.200">
            <CardBody>
              <HStack justify="space-between" align="flex-start">
                <Box flex={1}>
                  <Text fontSize="xs" color="green.600" fontWeight="medium" mb={1}>
                    Puntuales
                  </Text>
                  <Text fontSize="2xl" fontWeight="bold" color="green.700">
                    {estadisticas.puntuales}
                  </Text>
                  <Text fontSize="xs" color="green.600">
                    {estadisticas.porcentajePuntualidad.toFixed(0)}%
                  </Text>
                </Box>
                <Box p={3} bg="green.100" borderRadius="lg">
                  <FiCheckCircle size={20} color="var(--chakra-colors-green-600)" />
                </Box>
              </HStack>
            </CardBody>
          </Card>

          <Card bg="orange.50" borderWidth="1px" borderColor="orange.200">
            <CardBody>
              <HStack justify="space-between" align="flex-start">
                <Box flex={1}>
                  <Text fontSize="xs" color="orange.600" fontWeight="medium" mb={1}>
                    Tardíos
                  </Text>
                  <Text fontSize="2xl" fontWeight="bold" color="orange.700">
                    {estadisticas.tardios}
                  </Text>
                </Box>
                <Box p={3} bg="orange.100" borderRadius="lg">
                  <FiAlertCircle size={20} color="var(--chakra-colors-orange-600)" />
                </Box>
              </HStack>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Lista de Asistencias */}
        {isLoading ? (
          <Card>
            <CardBody>
              <Text color="gray.500" textAlign="center" py={8}>
                Cargando asistencias...
              </Text>
            </CardBody>
          </Card>
        ) : filteredAsistencias.length > 0 ? (
          <VStack spacing={{ base: 3, md: 4 }} align="stretch">
            {filteredAsistencias.map((asistencia) => (
              <Card
                key={asistencia.id}
                shadow="sm"
                borderWidth="1px"
                borderColor="gray.200"
                _hover={{ shadow: 'md', borderColor: 'blue.300' }}
                transition="all 0.2s"
              >
                <CardBody p={{ base: 3, md: 4 }}>
                  <Stack direction={{ base: 'column', lg: 'row' }} spacing={{ base: 3, md: 4 }} align="stretch">
                    <Stack
                      direction={{ base: 'column', sm: 'row' }}
                      spacing={{ base: 3, md: 4 }}
                      flex={1}
                      align={{ base: 'flex-start', sm: 'center' }}
                    >
                      <HStack spacing={2} minW="80px" align="center">
                        <FiClock color="var(--chakra-colors-gray-500)" />
                        <Text fontSize="sm" fontWeight="medium" color="gray.700">
                          {format(new Date(asistencia.fecha), 'HH:mm', { locale: es })}
                        </Text>
                      </HStack>
                      
                      <Box flex={1} minW={0}>
                        <Text fontWeight="semibold" mb={1} noOfLines={1}>
                          {asistencia.nino.nombre} {asistencia.nino.apellido}
                        </Text>
                        <Text fontSize="xs" color="gray.500">
                          {asistencia.nino.representante.nombre}
                        </Text>
                      </Box>

                      <Stack
                        direction="row"
                        spacing={2}
                        flexWrap="wrap"
                        align="center"
                      >
                        <Badge colorScheme="blue" variant="subtle">
                          {asistencia.nino.categoria}
                        </Badge>

                        <Badge colorScheme={getTipoColor(asistencia.tipo)} variant="subtle">
                          {asistencia.tipo === 'entrada' ? 'Entrada' : 'Salida'}
                        </Badge>

                        {asistencia.puntual ? (
                          <HStack spacing={1}>
                            <FiCheckCircle size={14} />
                            <Badge colorScheme="green" variant="subtle">
                              Puntual
                            </Badge>
                          </HStack>
                        ) : (
                          <HStack spacing={1}>
                            <FiAlertCircle size={14} />
                            <Badge colorScheme="orange" variant="subtle">
                              Tardío
                            </Badge>
                          </HStack>
                        )}
                      </Stack>
                    </Stack>
                  </Stack>
                  {asistencia.observaciones && (
                    <Box mt={3} pt={3} borderTopWidth="1px" borderColor="gray.100">
                      <Text fontSize="xs" color="gray.600" fontStyle="italic">
                        {asistencia.observaciones}
                      </Text>
                    </Box>
                  )}
                </CardBody>
              </Card>
            ))}
          </VStack>
        ) : (
          <Card>
            <CardBody>
              <Text color="gray.500" textAlign="center" py={8}>
                {searchFilter || categoriaFilter
                  ? 'No se encontraron asistencias con los filtros seleccionados'
                  : 'No hay asistencias registradas para esta fecha'}
              </Text>
            </CardBody>
          </Card>
        )}
      </VStack>
    </Container>
  )
}
