'use client'

import React, { useState } from 'react'
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
  useToast,
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
  Select,
  Checkbox,
  CheckboxGroup,
  Stack,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Flex,
  Grid,
  GridItem,
  Alert,
  AlertIcon
} from '@chakra-ui/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FiPlus, FiCalendar, FiUsers, FiTarget, FiMapPin, FiClock, FiCheck, FiX, FiAlertCircle, FiUserCheck, FiUserX } from 'react-icons/fi'
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, addWeeks, subWeeks } from 'date-fns'
import { es } from 'date-fns/locale'
import { useAuth } from '@/hooks/useAuth'

interface Actividad {
  id: string
  titulo: string
  descripcion?: string
  tipo: string
  fechaInicio: string
  fechaFin: string
  color: string
  categoria?: string
  activo?: boolean
  estado?: string
  instructor?: {
    id: string
    nombre: string
  }
  cancha?: {
    id: string
    nombre: string
  }
}

export default function CalendarioPage() {
  const { isAdmin, isRepresentante, isProfesor } = useAuth()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { isOpen: isCancelOpen, onOpen: onCancelOpen, onClose: onCancelClose } = useDisclosure()
  const { isOpen: isAsistenciaOpen, onOpen: onAsistenciaOpen, onClose: onAsistenciaClose } = useDisclosure()
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedActividad, setSelectedActividad] = useState<Actividad | null>(null)
  const [motivoCancelacion, setMotivoCancelacion] = useState('')
  const [ninosAsistencia, setNinosAsistencia] = useState<Array<{ id: string; presente: boolean }>>([])
  const toast = useToast()
  const queryClient = useQueryClient()

  const startDate = startOfWeek(currentWeek, { locale: es, weekStartsOn: 1 })
  const endDate = endOfWeek(currentWeek, { locale: es, weekStartsOn: 1 })
  const weekDays = eachDayOfInterval({ start: startDate, end: endDate })

  const { data: actividades, isLoading } = useQuery<Actividad[]>({
    queryKey: ['actividades'],
    queryFn: async () => {
      const res = await fetch(`/api/actividades?fechaInicio=${startDate.toISOString()}&fechaFin=${endDate.toISOString()}`)
      if (!res.ok) throw new Error('Error al cargar actividades')
      return res.json()
    }
  })

  const { data: instructores } = useQuery({
    queryKey: ['instructores'],
    queryFn: async () => {
      const res = await fetch('/api/instructores')
      if (!res.ok) throw new Error('Error al cargar instructores')
      return res.json()
    }
  })

  const { data: canchas } = useQuery({
    queryKey: ['canchas'],
    queryFn: async () => {
      const res = await fetch('/api/canchas')
      if (!res.ok) throw new Error('Error al cargar canchas')
      return res.json()
    }
  })

  // Query para obtener niños de una categoría específica
  const { data: ninosPorCategoria } = useQuery({
    queryKey: ['ninos', selectedActividad?.categoria],
    queryFn: async () => {
      if (!selectedActividad?.categoria) return []
      const res = await fetch(`/api/ninos?categoria=${selectedActividad.categoria}`)
      if (!res.ok) throw new Error('Error al cargar niños')
      return res.json()
    },
    enabled: !!selectedActividad?.categoria
  })

  // Query para obtener asistencias existentes de la actividad
  const { data: asistenciasExistentes } = useQuery({
    queryKey: ['asistencias', selectedActividad?.id],
    queryFn: async () => {
      if (!selectedActividad?.id) return []
      const res = await fetch(`/api/actividades/${selectedActividad.id}/asistencias`)
      if (!res.ok) throw new Error('Error al cargar asistencias')
      return res.json()
    },
    enabled: !!selectedActividad?.id && isAsistenciaOpen
  })

  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    tipo: 'Entrenamiento',
    fechaInicio: '',
    fechaFin: '',
    color: 'blue',
    categoria: '',
    instructorId: '',
    canchaId: ''
  })

  const actividadesMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/actividades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, creadoPorRol: isProfesor && !isAdmin ? 'profesor' : 'admin' })
      })
      if (!res.ok) throw new Error('Error al crear actividad')
      return res.json()
    },
    onSuccess: () => {
      toast({
        title: 'Actividad creada',
        description: 'La actividad se ha creado exitosamente y las notificaciones se están enviando',
        status: 'success',
        duration: 5000
      })
      queryClient.invalidateQueries({ queryKey: ['actividades'] })
      onClose()
      resetForm()
    }
  })

  const cancelarActividadMutation = useMutation({
    mutationFn: async ({ id, motivo }: { id: string; motivo?: string }) => {
      const res = await fetch(`/api/actividades/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          activo: false,
          motivoCancelacion: motivo || undefined
        })
      })
      if (!res.ok) throw new Error('Error al cancelar actividad')
      return res.json()
    },
    onSuccess: () => {
      toast({
        title: 'Actividad cancelada',
        description: 'La actividad ha sido cancelada y las notificaciones se están enviando',
        status: 'warning',
        duration: 5000
      })
      queryClient.invalidateQueries({ queryKey: ['actividades'] })
      onCancelClose()
      setMotivoCancelacion('')
      setSelectedActividad(null)
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Error al cancelar la actividad',
        status: 'error',
        duration: 3000
      })
    }
  })

  const handleCancelar = (actividad: Actividad) => {
    setSelectedActividad(actividad)
    onCancelOpen()
  }

  // Mutation para guardar asistencias
  const guardarAsistenciasMutation = useMutation({
    mutationFn: async (asistencias: Array<{ ninoId: string; tipo: string }>) => {
      if (!selectedActividad?.id) throw new Error('No hay actividad seleccionada')
      const res = await fetch(`/api/actividades/${selectedActividad.id}/asistencias`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ asistencias })
      })
      if (!res.ok) throw new Error('Error al guardar asistencias')
      return res.json()
    },
    onSuccess: (data) => {
      toast({
        title: 'Asistencias guardadas',
        description: `Se registraron ${data.count} asistencias correctamente`,
        status: 'success',
        duration: 3000
      })
      queryClient.invalidateQueries({ queryKey: ['asistencias', selectedActividad?.id] })
      onAsistenciaClose()
      setNinosAsistencia([])
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Error al guardar las asistencias',
        status: 'error',
        duration: 3000
      })
    }
  })

  const handleGestionarAsistencia = (actividad: Actividad) => {
    setSelectedActividad(actividad)
    onAsistenciaOpen()
  }

  // Inicializar asistencias cuando se abre el modal
  React.useEffect(() => {
    if (isAsistenciaOpen && ninosPorCategoria && asistenciasExistentes) {
      const iniciales = ninosPorCategoria.map((nino: any) => {
        const asistencia = asistenciasExistentes.find((a: any) => a.nino.id === nino.id)
        return {
          id: nino.id,
          presente: asistencia ? asistencia.tipo === 'presente' : false
        }
      })
      setNinosAsistencia(iniciales)
    }
  }, [isAsistenciaOpen, ninosPorCategoria, asistenciasExistentes])

  const toggleAsistencia = (ninoId: string) => {
    setNinosAsistencia(prev =>
      prev.map(n =>
        n.id === ninoId ? { ...n, presente: !n.presente } : n
      )
    )
  }

  const handleGuardarAsistencias = () => {
    const asistencias = ninosAsistencia.map(n => ({
      ninoId: n.id,
      tipo: n.presente ? 'presente' : 'ausente'
    }))
    guardarAsistenciasMutation.mutate(asistencias)
  }

  const resetForm = () => {
    setFormData({
      titulo: '',
      descripcion: '',
      tipo: 'Entrenamiento',
      fechaInicio: '',
      fechaFin: '',
      color: 'blue',
      categoria: '',
      instructorId: '',
      canchaId: ''
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    actividadesMutation.mutate(formData)
  }

  const getActividadesForDay = (date: Date) => {
    if (!actividades) return []
    return actividades.filter(act => {
      const fechaActividad = new Date(act.fechaInicio)
      return isSameDay(fechaActividad, date) && act.activo !== false
    })
  }

  const getTipoColor = (tipo: string) => {
    const colors: { [key: string]: string } = {
      'Entrenamiento': 'blue',
      'Partido': 'green',
      'Evento': 'purple',
      'Torneo': 'orange'
    }
    return colors[tipo] || 'gray'
  }

  if (isLoading) {
    return (
      <Container maxW="container.xl" py={8}>
        <Text>Cargando calendario...</Text>
      </Container>
    )
  }

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        {/* Header */}
        <Flex justify="space-between" align="center">
          <Box>
            <Heading size="xl" mb={2}>📅 Calendario de Actividades</Heading>
            <Text color="gray.600">
              Vista unificada de entrenamientos, partidos y eventos
            </Text>
          </Box>
          <HStack spacing={4}>
            {isAdmin && (
              <>
                <Button
                  leftIcon={<FiUsers />}
                  colorScheme="green"
                  variant="outline"
                  onClick={() => window.location.href = '/calendario/instructores'}
                >
                  Instructores
                </Button>
                <Button
                  leftIcon={<FiMapPin />}
                  colorScheme="purple"
                  variant="outline"
                  onClick={() => window.location.href = '/calendario/canchas'}
                >
                  Canchas
                </Button>
              </>
            )}
            {(isAdmin || !isRepresentante) && (
              <Button
                leftIcon={<FiPlus />}
                colorScheme="blue"
                onClick={() => {
                  resetForm()
                  onOpen()
                }}
              >
                Nueva Actividad
              </Button>
            )}
          </HStack>
        </Flex>

        {/* Navegación de semana */}
        <Card>
          <CardBody>
            <HStack justify="space-between">
              <Button onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}>
                Semana Anterior
              </Button>
              <Text fontWeight="bold" fontSize="lg">
                {format(startDate, "d 'de' MMMM", { locale: es })} - {format(endDate, "d 'de' MMMM yyyy", { locale: es })}
              </Text>
              <Button onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}>
                Semana Siguiente
              </Button>
            </HStack>
          </CardBody>
        </Card>

        {/* Calendario Semanal */}
        <Grid templateColumns={{ base: '1fr', lg: 'repeat(7, 1fr)' }} gap={2}>
          {weekDays.map((day, index) => (
            <GridItem key={index}>
              <Card>
                <CardBody>
                  <VStack spacing={2} align="stretch">
                    <Text fontWeight="bold" fontSize="sm" color={isSameDay(day, new Date()) ? 'blue.500' : 'gray.700'}>
                      {format(day, 'EEE', { locale: es })}
                    </Text>
                    <Text fontSize="2xl" fontWeight="bold">
                      {format(day, 'd')}
                    </Text>
                    
                    <VStack spacing={1} align="stretch" mt={2}>
                      {getActividadesForDay(day).map((actividad) => (
                        <Box
                          key={actividad.id}
                          p={2}
                          bg={`${getTipoColor(actividad.tipo)}.100`}
                          borderRadius="md"
                          borderLeft="4px"
                          borderColor={`${getTipoColor(actividad.tipo)}.500`}
                        >
                          <Text fontSize="xs" fontWeight="bold" noOfLines={1}>
                            {actividad.titulo}
                          </Text>
                          <Text fontSize="xs" color="gray.600" noOfLines={1}>
                            {format(new Date(actividad.fechaInicio), 'HH:mm', { locale: es })}
                          </Text>
                        </Box>
                      ))}
                    </VStack>
                  </VStack>
                </CardBody>
              </Card>
            </GridItem>
          ))}
        </Grid>

        {/* Lista de actividades de la semana */}
        <Card>
          <CardBody>
            <Heading size="md" mb={4}>Actividades de la Semana</Heading>
            <Table variant="simple" size="sm">
              <Thead>
                <Tr>
                  <Th>Fecha/Hora</Th>
                  <Th>Actividad</Th>
                  <Th>Tipo</Th>
                  <Th>Instructor</Th>
                  <Th>Cancha</Th>
                  {(isAdmin || isProfesor) && <Th>Acciones</Th>}
                </Tr>
              </Thead>
              <Tbody>
                {actividades?.filter(act => act.activo !== false).map((actividad) => (
                  <Tr key={actividad.id}>
                    <Td>
                      <VStack align="start" spacing={0}>
                        <Text fontSize="sm" fontWeight="bold">
                          {format(new Date(actividad.fechaInicio), 'dd/MM', { locale: es })}
                        </Text>
                        <Text fontSize="xs" color="gray.600">
                          {format(new Date(actividad.fechaInicio), 'HH:mm', { locale: es })}
                        </Text>
                      </VStack>
                    </Td>
                    <Td fontWeight="bold">{actividad.titulo}</Td>
                    <Td>
                      <Badge colorScheme={getTipoColor(actividad.tipo)}>
                        {actividad.tipo}
                      </Badge>
                    </Td>
                    <Td>
                      <VStack align="start" spacing={0}>
                        <Text>{actividad.instructor?.nombre || '-'}</Text>
                        {actividad.estado && (
                          <Badge colorScheme={actividad.estado === 'Aprobada' ? 'green' : actividad.estado === 'Rechazada' ? 'red' : 'yellow'}>
                            {actividad.estado}
                          </Badge>
                        )}
                      </VStack>
                    </Td>
                    <Td>{actividad.cancha?.nombre || '-'}</Td>
                    {(isAdmin || isProfesor) && (
                      <Td>
                        <HStack spacing={2}>
                          {actividad.categoria && actividad.estado === 'Aprobada' && (
                            <Button
                              size="sm"
                              colorScheme="green"
                              variant="outline"
                              leftIcon={<FiUserCheck />}
                              onClick={() => handleGestionarAsistencia(actividad)}
                            >
                              Asistencia
                            </Button>
                          )}
                          {isAdmin && actividad.estado !== 'Aprobada' && (
                            <>
                              <Button
                                size="sm"
                                colorScheme="green"
                                variant="solid"
                                leftIcon={<FiCheck />}
                                onClick={async () => {
                                  await fetch(`/api/actividades/${actividad.id}`, {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ estado: 'Aprobada', aprobadoPor: 'admin' })
                                  })
                                  queryClient.invalidateQueries({ queryKey: ['actividades'] })
                                }}
                              >
                                Aprobar
                              </Button>
                              <Button
                                size="sm"
                                colorScheme="yellow"
                                variant="outline"
                                leftIcon={<FiX />}
                                onClick={async () => {
                                  await fetch(`/api/actividades/${actividad.id}`, {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ estado: 'Rechazada', aprobadoPor: 'admin' })
                                  })
                                  queryClient.invalidateQueries({ queryKey: ['actividades'] })
                                }}
                              >
                                Rechazar
                              </Button>
                            </>
                          )}
                          <Button
                            size="sm"
                            colorScheme="red"
                            variant="outline"
                            leftIcon={<FiX />}
                            onClick={() => handleCancelar(actividad)}
                          >
                            Cancelar
                          </Button>
                        </HStack>
                      </Td>
                    )}
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </CardBody>
        </Card>
      </VStack>

      {/* Modal para crear actividad */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <form onSubmit={handleSubmit}>
            <ModalHeader>Nueva Actividad</ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Título</FormLabel>
                  <Input
                    value={formData.titulo}
                    onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                    placeholder="Ej: Entrenamiento Sub-10"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Descripción</FormLabel>
                  <Textarea
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    rows={3}
                  />
                </FormControl>

                <HStack spacing={4} width="full">
                  <FormControl isRequired>
                    <FormLabel>Tipo</FormLabel>
                    <Select
                      value={formData.tipo}
                      onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                    >
                      <option value="Entrenamiento">Entrenamiento</option>
                      <option value="Partido">Partido</option>
                      <option value="Evento">Evento</option>
                      <option value="Torneo">Torneo</option>
                    </Select>
                  </FormControl>

                  <FormControl>
                    <FormLabel>Categoría</FormLabel>
                    <Select
                      value={formData.categoria}
                      onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                    >
                      <option value="">Todas</option>
                      <option value="Sub-6">Sub-6</option>
                      <option value="Sub-8">Sub-8</option>
                      <option value="Sub-10">Sub-10</option>
                      <option value="Sub-12">Sub-12</option>
                      <option value="Sub-14">Sub-14</option>
                      <option value="Sub-16">Sub-16</option>
                      <option value="Sub-18">Sub-18</option>
                    </Select>
                  </FormControl>
                </HStack>

                <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={4} width="full" minW={0}>
                  <FormControl isRequired minW={0}>
                    <FormLabel>Fecha Inicio</FormLabel>
                    <Input
                      type="datetime-local"
                      value={formData.fechaInicio}
                      onChange={(e) => setFormData({ ...formData, fechaInicio: e.target.value })}
                      width="100%"
                      minW={0}
                    />
                  </FormControl>

                  <FormControl isRequired minW={0}>
                    <FormLabel>Fecha Fin</FormLabel>
                    <Input
                      type="datetime-local"
                      value={formData.fechaFin}
                      onChange={(e) => setFormData({ ...formData, fechaFin: e.target.value })}
                      width="100%"
                      minW={0}
                    />
                  </FormControl>
                </Grid>

                <HStack spacing={4} width="full">
                  <FormControl>
                    <FormLabel>Instructor</FormLabel>
                    <Select
                      value={formData.instructorId}
                      onChange={(e) => setFormData({ ...formData, instructorId: e.target.value })}
                    >
                      <option value="">Seleccionar instructor</option>
                      {instructores?.map((inst: any) => (
                        <option key={inst.id} value={inst.id}>
                          {inst.nombre}
                        </option>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl>
                    <FormLabel>Cancha</FormLabel>
                    <Select
                      value={formData.canchaId}
                      onChange={(e) => setFormData({ ...formData, canchaId: e.target.value })}
                    >
                      <option value="">Seleccionar cancha</option>
                      {canchas?.map((cancha: any) => (
                        <option key={cancha.id} value={cancha.id}>
                          {cancha.nombre}
                        </option>
                      ))}
                    </Select>
                  </FormControl>
                </HStack>

                <HStack spacing={4} width="full">
                  <Button type="button" onClick={onClose} flex={1}>
                    Cancelar
                  </Button>
                  <Button type="submit" colorScheme="blue" flex={1}>
                    Crear Actividad
                  </Button>
                </HStack>
              </VStack>
            </ModalBody>
          </form>
        </ModalContent>
      </Modal>

      {/* Modal para cancelar actividad */}
      <Modal isOpen={isCancelOpen} onClose={onCancelClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <HStack>
              <FiAlertCircle color="red" />
              <Text>Cancelar Actividad</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {selectedActividad && (
              <VStack spacing={4} align="stretch">
                <Alert status="warning">
                  <AlertIcon />
                  <Box>
                    <Text fontWeight="bold">¿Estás seguro de cancelar esta actividad?</Text>
                    <Text fontSize="sm">
                      Se enviarán notificaciones a todos los representantes de la categoría {selectedActividad.categoria || 'todas las categorías'}.
                    </Text>
                  </Box>
                </Alert>

                <Box>
                  <Text fontWeight="bold" mb={2}>Detalles de la Actividad:</Text>
                  <Card>
                    <CardBody>
                      <VStack align="start" spacing={2}>
                        <Text><strong>Título:</strong> {selectedActividad.titulo}</Text>
                        <Text><strong>Tipo:</strong> {selectedActividad.tipo}</Text>
                        <Text>
                          <strong>Fecha:</strong> {format(new Date(selectedActividad.fechaInicio), 'dd/MM/yyyy HH:mm', { locale: es })}
                        </Text>
                        {selectedActividad.categoria && (
                          <Text><strong>Categoría:</strong> {selectedActividad.categoria}</Text>
                        )}
                        {selectedActividad.instructor && (
                          <Text><strong>Instructor:</strong> {selectedActividad.instructor.nombre}</Text>
                        )}
                        {selectedActividad.cancha && (
                          <Text><strong>Cancha:</strong> {selectedActividad.cancha.nombre}</Text>
                        )}
                      </VStack>
                    </CardBody>
                  </Card>
                </Box>

                <FormControl>
                  <FormLabel>Motivo de Cancelación (Opcional)</FormLabel>
                  <Textarea
                    value={motivoCancelacion}
                    onChange={(e) => setMotivoCancelacion(e.target.value)}
                    placeholder="Ej: Condiciones climáticas adversas, emergencia, etc."
                    rows={3}
                  />
                </FormControl>

                <HStack spacing={4} width="full">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onCancelClose}
                    flex={1}
                  >
                    Volver
                  </Button>
                  <Button
                    type="button"
                    colorScheme="red"
                    leftIcon={<FiX />}
                    onClick={() => {
                      if (selectedActividad) {
                        cancelarActividadMutation.mutate({
                          id: selectedActividad.id,
                          motivo: motivoCancelacion || undefined
                        })
                      }
                    }}
                    isLoading={cancelarActividadMutation.isPending}
                    flex={1}
                  >
                    Confirmar Cancelación
                  </Button>
                </HStack>
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Modal para gestionar asistencia */}
      <Modal isOpen={isAsistenciaOpen} onClose={onAsistenciaClose} size="xl">
        <ModalOverlay />
        <ModalContent maxH="90vh" overflowY="auto">
          <ModalHeader>
            <HStack>
              <FiUserCheck />
              <Text>Gestionar Asistencia</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {selectedActividad && (
              <VStack spacing={4} align="stretch">
                {/* Detalles de la actividad */}
                <Card>
                  <CardBody>
                    <VStack align="start" spacing={2}>
                      <Text fontWeight="bold" fontSize="lg">{selectedActividad.titulo}</Text>
                      <Text><strong>Tipo:</strong> {selectedActividad.tipo}</Text>
                      <Text>
                        <strong>Fecha:</strong> {format(new Date(selectedActividad.fechaInicio), 'dd/MM/yyyy HH:mm', { locale: es })}
                      </Text>
                      {selectedActividad.categoria && (
                        <Text><strong>Categoría:</strong> {selectedActividad.categoria}</Text>
                      )}
                      {selectedActividad.instructor && (
                        <Text><strong>Instructor:</strong> {selectedActividad.instructor.nombre}</Text>
                      )}
                    </VStack>
                  </CardBody>
                </Card>

                {/* Lista de niños */}
                {ninosPorCategoria && ninosPorCategoria.length > 0 ? (
                  <>
                    {/* Estadísticas */}
                    <HStack spacing={4}>
                      <Card bg="green.50" borderWidth="2px" borderColor="green.300" flex={1}>
                        <CardBody>
                          <VStack spacing={1}>
                            <Text fontSize="2xl" fontWeight="bold" color="green.600">
                              {ninosAsistencia.filter(a => a.presente).length}
                            </Text>
                            <Text fontSize="sm" color="green.700" fontWeight="semibold">
                              Presentes
                            </Text>
                          </VStack>
                        </CardBody>
                      </Card>
                      <Card bg="red.50" borderWidth="2px" borderColor="red.300" flex={1}>
                        <CardBody>
                          <VStack spacing={1}>
                            <Text fontSize="2xl" fontWeight="bold" color="red.600">
                              {ninosAsistencia.filter(a => !a.presente).length}
                            </Text>
                            <Text fontSize="sm" color="red.700" fontWeight="semibold">
                              Ausentes
                            </Text>
                          </VStack>
                        </CardBody>
                      </Card>
                      <Card bg="blue.50" borderWidth="2px" borderColor="blue.300" flex={1}>
                        <CardBody>
                          <VStack spacing={1}>
                            <Text fontSize="2xl" fontWeight="bold" color="blue.600">
                              {ninosAsistencia.length}
                            </Text>
                            <Text fontSize="sm" color="blue.700" fontWeight="semibold">
                              Total
                            </Text>
                          </VStack>
                        </CardBody>
                      </Card>
                    </HStack>

                    {/* Alerta de ausentes */}
                    {ninosAsistencia.filter(a => !a.presente).length > 0 && (
                      <Alert status="warning" borderRadius="md">
                        <AlertIcon />
                        <Box flex={1}>
                          <Text fontWeight="bold">
                            Alumnos Ausentes: {ninosAsistencia.filter(a => !a.presente).length}
                          </Text>
                          <Text fontSize="sm" mt={1}>
                            Los siguientes alumnos no asistieron a esta actividad
                          </Text>
                        </Box>
                      </Alert>
                    )}

                    {/* Lista de Ausentes (destacada) */}
                    {ninosAsistencia.filter(a => !a.presente).length > 0 && (
                      <>
                        <Heading size="sm" color="red.600">
                          <HStack>
                            <FiUserX />
                            <Text>Alumnos Ausentes ({ninosAsistencia.filter(a => !a.presente).length})</Text>
                          </HStack>
                        </Heading>
                        <Box border="2px" borderColor="red.200" borderRadius="md" bg="red.50" p={4}>
                          <VStack spacing={2} align="stretch">
                            {ninosPorCategoria
                              .filter((nino: any) => {
                                const asistencia = ninosAsistencia.find(a => a.id === nino.id)
                                return !asistencia?.presente
                              })
                              .map((nino: any) => {
                                const asistencia = ninosAsistencia.find(a => a.id === nino.id)
                                const presente = asistencia?.presente || false
                                return (
                                  <Card key={nino.id} bg="white" borderWidth="2px" borderColor="red.300">
                                    <CardBody>
                                      <HStack justify="space-between">
                                        <VStack align="start" spacing={1}>
                                          <Text fontWeight="bold" color="red.700">
                                            {nino.nombre} {nino.apellido}
                                          </Text>
                                          <Text fontSize="sm" color="gray.600">
                                            {nino.categoria}
                                          </Text>
                                        </VStack>
                                        <Checkbox
                                          isChecked={presente}
                                          onChange={() => toggleAsistencia(nino.id)}
                                          colorScheme="green"
                                          size="lg"
                                        >
                                          <Text fontWeight="bold" color={presente ? 'green.600' : 'red.600'}>
                                            {presente ? 'Presente' : 'Ausente'}
                                          </Text>
                                        </Checkbox>
                                      </HStack>
                                    </CardBody>
                                  </Card>
                                )
                              })}
                          </VStack>
                        </Box>
                      </>
                    )}

                    {/* Lista de Presentes */}
                    <Heading size="sm" color="green.600">
                      <HStack>
                        <FiUserCheck />
                        <Text>Alumnos Presentes ({ninosAsistencia.filter(a => a.presente).length})</Text>
                      </HStack>
                    </Heading>
                    <Box maxH="300px" overflowY="auto" border="1px" borderColor="gray.200" borderRadius="md" p={4}>
                      <VStack spacing={3} align="stretch">
                        {ninosPorCategoria
                          .filter((nino: any) => {
                            const asistencia = ninosAsistencia.find(a => a.id === nino.id)
                            return asistencia?.presente
                          })
                          .map((nino: any) => {
                            const asistencia = ninosAsistencia.find(a => a.id === nino.id)
                            const presente = asistencia?.presente || false
                            return (
                              <Card key={nino.id} borderWidth="1px" borderColor="green.300" bg="green.50">
                                <CardBody>
                                  <HStack justify="space-between">
                                    <VStack align="start" spacing={1}>
                                      <Text fontWeight="bold" color="green.700">
                                        {nino.nombre} {nino.apellido}
                                      </Text>
                                      <Text fontSize="sm" color="gray.600">
                                        {nino.categoria}
                                      </Text>
                                    </VStack>
                                    <Checkbox
                                      isChecked={presente}
                                      onChange={() => toggleAsistencia(nino.id)}
                                      colorScheme="green"
                                      size="lg"
                                    >
                                      <Text fontWeight="bold" color="green.600">
                                        Presente
                                      </Text>
                                    </Checkbox>
                                  </HStack>
                                </CardBody>
                              </Card>
                            )
                          })}
                        {ninosAsistencia.filter(a => a.presente).length === 0 && (
                          <Text color="gray.500" textAlign="center" py={4}>
                            No hay alumnos presentes
                          </Text>
                        )}
                      </VStack>
                    </Box>

                    <HStack spacing={4} width="full">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={onAsistenciaClose}
                        flex={1}
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="button"
                        colorScheme="green"
                        leftIcon={<FiUserCheck />}
                        onClick={handleGuardarAsistencias}
                        isLoading={guardarAsistenciasMutation.isPending}
                        flex={1}
                      >
                        Guardar Asistencias
                      </Button>
                    </HStack>
                  </>
                ) : (
                  <Alert status="info">
                    <AlertIcon />
                    <Box>
                      <Text fontWeight="bold">No hay niños en esta categoría</Text>
                      <Text fontSize="sm">
                        {selectedActividad.categoria
                          ? `No se encontraron niños activos en la categoría ${selectedActividad.categoria}`
                          : 'Esta actividad no tiene categoría asignada'}
                      </Text>
                    </Box>
                  </Alert>
                )}
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Container>
  )
}
