'use client'

import React, { useState } from 'react'
import {
  Box,
  Container,
  Heading,
  Grid,
  GridItem,
  Card,
  CardBody,
  VStack,
  HStack,
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
  Text,
  useColorModeValue,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Divider,
  IconButton,
  Tooltip,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  useToast
} from '@chakra-ui/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  FiSend, 
  FiBell, 
  FiUsers, 
  FiMail, 
  FiPhone, 
  FiEye, 
  FiTrash2,
  FiRefreshCw,
  FiFilter,
  FiSearch
} from 'react-icons/fi'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface Representante {
  id: string
  nombre: string
  cedula: string
  email: string
  telefono: string
  ninos: Array<{
    id: string
    nombre: string
    apellido: string
    categoria: string
  }>
}

interface Notificacion {
  id: string
  tipo: string
  titulo: string
  mensaje: string
  enviada: boolean
  fechaEnvio: string | null
  metodoEnvio: string
  representante: {
    id: string
    nombre: string
    email: string
  } | null
  createdAt: string
}

export default function NotificacionesPage() {
  const [notificacionData, setNotificacionData] = useState({
    tipo: 'Recordatorio',
    titulo: '',
    mensaje: '',
    metodoEnvio: 'Email',
    representanteId: '',
    enviarMasivo: true,
    categoriaFiltro: 'Todas' // Nuevo: filtro por categoría
  })
  
  const [representantesSeleccionados, setRepresentantesSeleccionados] = useState<string[]>([])
  const [filtroTipo, setFiltroTipo] = useState('Todos')
  const [filtroEstado, setFiltroEstado] = useState('Todos')
  
  const { isOpen, onOpen, onClose } = useDisclosure()
  const queryClient = useQueryClient()
  const toast = useToast()
  const cardBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')

  // Queries
  const resetForm = React.useCallback(() => {
    setNotificacionData({
      tipo: 'Recordatorio',
      titulo: '',
      mensaje: '',
      metodoEnvio: 'Email',
      representanteId: '',
      enviarMasivo: true,
      categoriaFiltro: 'Todas'
    })
    setRepresentantesSeleccionados([])
  }, [])

  const { data: representantes, isLoading: loadingRepresentantes, error: errorRepresentantes } = useQuery<Representante[]>({
    queryKey: ['representantes'],
    queryFn: async () => {
      const res = await fetch('/api/representantes')
      if (!res.ok) throw new Error('Error al cargar representantes')
      const data = await res.json()
      return data || []
    },
    retry: 1
  })

  const { data: notificaciones, isLoading: loadingNotificaciones, error: errorNotificaciones } = useQuery<Notificacion[]>({
    queryKey: ['notificaciones'],
    queryFn: async () => {
      const res = await fetch('/api/notificaciones')
      if (!res.ok) throw new Error('Error al cargar notificaciones')
      const data = await res.json()
      return data || []
    },
    retry: 1
  })

  // Mutations
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
    onSuccess: (data) => {
      toast({
        title: 'Notificación enviada',
        description: data.message || 'Notificación enviada exitosamente',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
      queryClient.invalidateQueries({ queryKey: ['notificaciones'] })
      onClose()
      resetForm()
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Error al enviar la notificación',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  })

  const deleteNotificacionMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/notificaciones/${id}`, {
        method: 'DELETE'
      })
      if (!res.ok) throw new Error('Error al eliminar notificación')
      return res.json()
    },
    onSuccess: () => {
      toast({
        title: 'Notificación eliminada',
        status: 'success',
        duration: 2000,
        isClosable: true,
      })
      queryClient.invalidateQueries({ queryKey: ['notificaciones'] })
    }
  })

  const handleEnviarNotificacion = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (notificacionData.enviarMasivo) {
      // Envío masivo - si hay filtro de categoría, enviar a representantes filtrados
      if (notificacionData.categoriaFiltro !== 'Todas') {
        // Enviar individualmente a cada representante filtrado
        if (representantesFiltrados.length === 0) {
          toast({
            title: 'Error',
            description: 'No hay representantes en la categoría seleccionada',
            status: 'error',
            duration: 3000,
            isClosable: true,
          })
          return
        }
        
        Promise.all(
          representantesFiltrados.map(rep =>
            notificacionMutation.mutateAsync({
              ...notificacionData,
              representanteId: rep.id
            })
          )
        ).then(() => {
          toast({
            title: 'Notificaciones enviadas',
            description: `Se enviaron ${representantesFiltrados.length} notificaciones a la categoría ${notificacionData.categoriaFiltro}`,
            status: 'success',
            duration: 5000,
            isClosable: true,
          })
        })
      } else {
        // Envío masivo a todos
        notificacionMutation.mutate({
          ...notificacionData,
          representanteId: null
        })
      }
    } else if (representantesSeleccionados.length > 0) {
      // Envío a representantes seleccionados
      Promise.all(
        representantesSeleccionados.map(repId =>
          notificacionMutation.mutateAsync({
            ...notificacionData,
            representanteId: repId
          })
        )
      )
    } else {
      toast({
        title: 'Error',
        description: 'Selecciona al menos un representante',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }

  const handleSelectAll = () => {
    if (representantesSeleccionados.length === representantesFiltrados.length) {
      setRepresentantesSeleccionados([])
    } else {
      setRepresentantesSeleccionados(representantesFiltrados.map(r => r.id))
    }
  }

  const handleSelectRepresentante = (id: string) => {
    setRepresentantesSeleccionados(prev =>
      prev.includes(id)
        ? prev.filter(repId => repId !== id)
        : [...prev, id]
    )
  }

  // Filtrar representantes por categoría
  const representantesFiltrados = React.useMemo(() => {
    if (!representantes) return []
    
    if (notificacionData.categoriaFiltro === 'Todas') {
      return representantes
    }
    
    // Filtrar representantes que tengan al menos un hijo en la categoría seleccionada
    return representantes.filter(rep => 
      rep.ninos.some(nino => nino.categoria === notificacionData.categoriaFiltro)
    )
  }, [representantes, notificacionData.categoriaFiltro])

  // Obtener categorías únicas de todos los niños
  const categoriasDisponibles = React.useMemo(() => {
    if (!representantes) return []
    
    const categorias = new Set<string>()
    representantes.forEach(rep => {
      rep.ninos.forEach(nino => {
        categorias.add(nino.categoria)
      })
    })
    
    return Array.from(categorias).sort()
  }, [representantes])

  // Filtrar notificaciones
  const notificacionesFiltradas = notificaciones?.filter(notif => {
    const tipoMatch = filtroTipo === 'Todos' || notif.tipo === filtroTipo
    const estadoMatch = filtroEstado === 'Todos' || 
      (filtroEstado === 'Enviadas' && notif.enviada) ||
      (filtroEstado === 'Pendientes' && !notif.enviada)
    return tipoMatch && estadoMatch
  }) || []

  // Estadísticas rápidas
  const stats = {
    total: notificaciones?.length || 0,
    enviadas: notificaciones?.filter(n => n.enviada).length || 0,
    pendientes: notificaciones?.filter(n => !n.enviada).length || 0,
    representantes: representantes?.length || 0
  }

  if (loadingRepresentantes || loadingNotificaciones) {
    return (
      <Container maxW="container.xl" py={8}>
        <Text>Cargando módulo de notificaciones...</Text>
      </Container>
    )
  }

  if (errorRepresentantes || errorNotificaciones) {
    return (
      <Container maxW="container.xl" py={8}>
        <Alert status="error">
          <AlertIcon />
          <AlertTitle>Error al cargar datos</AlertTitle>
          <AlertDescription>
            {errorRepresentantes?.message || errorNotificaciones?.message || 'Error desconocido'}
          </AlertDescription>
        </Alert>
      </Container>
    )
  }

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        {/* Header */}
        <Box>
          <Heading size="xl" mb={2}>Módulo de Notificaciones</Heading>
          <Text color="gray.600">
            Gestiona comunicaciones con representantes y envía notificaciones masivas
          </Text>
        </Box>

        {/* Estadísticas rápidas */}
        <Grid templateColumns={{ base: '1fr', md: 'repeat(4, 1fr)' }} gap={6}>
          <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
            <CardBody>
              <VStack spacing={2}>
                <Text fontSize="2xl" fontWeight="bold" color="blue.500">
                  {stats.total}
                </Text>
                <Text fontSize="sm" color="gray.600">Total Notificaciones</Text>
              </VStack>
            </CardBody>
          </Card>

          <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
            <CardBody>
              <VStack spacing={2}>
                <Text fontSize="2xl" fontWeight="bold" color="green.500">
                  {stats.enviadas}
                </Text>
                <Text fontSize="sm" color="gray.600">Enviadas</Text>
              </VStack>
            </CardBody>
          </Card>

          <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
            <CardBody>
              <VStack spacing={2}>
                <Text fontSize="2xl" fontWeight="bold" color="orange.500">
                  {stats.pendientes}
                </Text>
                <Text fontSize="sm" color="gray.600">Pendientes</Text>
              </VStack>
            </CardBody>
          </Card>

          <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
            <CardBody>
              <VStack spacing={2}>
                <Text fontSize="2xl" fontWeight="bold" color="purple.500">
                  {stats.representantes}
                </Text>
                <Text fontSize="sm" color="gray.600">Representantes</Text>
              </VStack>
            </CardBody>
          </Card>
        </Grid>

        {/* Botón principal para enviar notificaciones */}
        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
          <CardBody>
            <HStack justify="space-between">
              <VStack align="start" spacing={1}>
                <Heading size="md">Enviar Notificación</Heading>
                <Text color="gray.600">
                  Envía comunicados, recordatorios o notificaciones a los representantes
                </Text>
              </VStack>
              <Button
                colorScheme="blue"
                leftIcon={<FiSend />}
                onClick={onOpen}
                size="lg"
              >
                Nueva Notificación
              </Button>
            </HStack>
          </CardBody>
        </Card>

        {/* Tabs para diferentes vistas */}
        <Tabs>
          <TabList>
            <Tab>Historial de Notificaciones</Tab>
            <Tab>Representantes</Tab>
            <Tab>Plantillas</Tab>
          </TabList>

          <TabPanels>
            {/* Tab 1: Historial de Notificaciones */}
            <TabPanel px={0}>
              <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
                <CardBody>
                  {/* Filtros */}
                  <HStack spacing={4} mb={6}>
                    <Select
                      value={filtroTipo}
                      onChange={(e) => setFiltroTipo(e.target.value)}
                      width="200px"
                    >
                      <option value="Todos">Todos los tipos</option>
                      <option value="Recordatorio">Recordatorio</option>
                      <option value="Comunicado">Comunicado</option>
                      <option value="Evento">Evento</option>
                    </Select>
                    
                    <Select
                      value={filtroEstado}
                      onChange={(e) => setFiltroEstado(e.target.value)}
                      width="200px"
                    >
                      <option value="Todos">Todos los estados</option>
                      <option value="Enviadas">Enviadas</option>
                      <option value="Pendientes">Pendientes</option>
                    </Select>

                    <Button
                      leftIcon={<FiRefreshCw />}
                      onClick={() => queryClient.invalidateQueries({ queryKey: ['notificaciones'] })}
                    >
                      Actualizar
                    </Button>
                  </HStack>

                  {/* Tabla de notificaciones */}
                  <Table variant="simple" size="sm">
                    <Thead>
                      <Tr>
                        <Th>Tipo</Th>
                        <Th>Título</Th>
                        <Th>Destinatario</Th>
                        <Th>Método</Th>
                        <Th>Estado</Th>
                        <Th>Fecha</Th>
                        <Th>Acciones</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {notificacionesFiltradas.map((notif) => (
                        <Tr key={notif.id}>
                          <Td>
                            <Badge colorScheme={
                              notif.tipo === 'Recordatorio' ? 'orange' :
                              notif.tipo === 'Comunicado' ? 'blue' : 'green'
                            }>
                              {notif.tipo}
                            </Badge>
                          </Td>
                          <Td fontWeight="bold">{notif.titulo}</Td>
                          <Td>
                            {notif.representante ? notif.representante.nombre : 'Masiva'}
                          </Td>
                          <Td>
                            <HStack spacing={1}>
                              {notif.metodoEnvio.includes('Email') && <FiMail />}
                              {notif.metodoEnvio.includes('WhatsApp') && <FiPhone />}
                              <Text fontSize="sm">{notif.metodoEnvio}</Text>
                            </HStack>
                          </Td>
                          <Td>
                            <Badge colorScheme={notif.enviada ? 'green' : 'yellow'}>
                              {notif.enviada ? 'Enviada' : 'Pendiente'}
                            </Badge>
                          </Td>
                          <Td>
                            <Text fontSize="sm">
                              {notif.fechaEnvio 
                                ? format(new Date(notif.fechaEnvio), 'dd/MM/yyyy HH:mm', { locale: es })
                                : format(new Date(notif.createdAt), 'dd/MM/yyyy HH:mm', { locale: es })
                              }
                            </Text>
                          </Td>
                          <Td>
                            <HStack spacing={2}>
                              <Tooltip label="Ver detalles">
                                <IconButton
                                  aria-label="Ver"
                                  icon={<FiEye />}
                                  size="sm"
                                  variant="ghost"
                                />
                              </Tooltip>
                              <Tooltip label="Eliminar">
                                <IconButton
                                  aria-label="Eliminar"
                                  icon={<FiTrash2 />}
                                  size="sm"
                                  variant="ghost"
                                  colorScheme="red"
                                  onClick={() => deleteNotificacionMutation.mutate(notif.id)}
                                />
                              </Tooltip>
                            </HStack>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>

                  {notificacionesFiltradas.length === 0 && (
                    <Box textAlign="center" py={8}>
                      <Text color="gray.500">No hay notificaciones que coincidan con los filtros</Text>
                    </Box>
                  )}
                </CardBody>
              </Card>
            </TabPanel>

            {/* Tab 2: Representantes */}
            <TabPanel px={0}>
              <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
                <CardBody>
                  <HStack justify="space-between" mb={4}>
                    <Heading size="md">Lista de Representantes</Heading>
                    <Button
                      leftIcon={<FiUsers />}
                      onClick={() => {
                        setNotificacionData(prev => ({ 
                          ...prev, 
                          enviarMasivo: false,
                          categoriaFiltro: 'Todas'
                        }))
                        onOpen()
                      }}
                    >
                      Seleccionar para Notificar
                    </Button>
                  </HStack>

                  <Table variant="simple" size="sm">
                    <Thead>
                      <Tr>
                        <Th>Nombre</Th>
                        <Th>Email</Th>
                        <Th>Teléfono</Th>
                        <Th>Niños</Th>
                        <Th>Acciones</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {representantes?.map((rep) => (
                        <Tr key={rep.id}>
                          <Td fontWeight="bold">{rep.nombre}</Td>
                          <Td>{rep.email}</Td>
                          <Td>{rep.telefono}</Td>
                          <Td>
                            <VStack align="start" spacing={1}>
                              {rep.ninos.map((nino) => (
                                <Text key={nino.id} fontSize="sm">
                                  {nino.nombre} {nino.apellido} ({nino.categoria})
                                </Text>
                              ))}
                            </VStack>
                          </Td>
                          <Td>
                            <Button
                              size="sm"
                              leftIcon={<FiBell />}
                              onClick={() => {
                                setNotificacionData(prev => ({ 
                                  ...prev, 
                                  enviarMasivo: false,
                                  representanteId: rep.id,
                                  categoriaFiltro: 'Todas'
                                }))
                                setRepresentantesSeleccionados([rep.id])
                                onOpen()
                              }}
                            >
                              Notificar
                            </Button>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </CardBody>
              </Card>
            </TabPanel>

            {/* Tab 3: Plantillas */}
            <TabPanel px={0}>
              <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
                <CardBody>
                  <Heading size="md" mb={4}>Plantillas de Notificación</Heading>
                  <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={6}>
                    <Card borderColor={borderColor} borderWidth="1px">
                      <CardBody>
                        <Heading size="sm" mb={2}>Recordatorio de Pago</Heading>
                        <Text fontSize="sm" color="gray.600" mb={4}>
                          Plantilla para recordar pagos pendientes
                        </Text>
                        <Button
                          size="sm"
                          colorScheme="orange"
                          onClick={() => {
                            setNotificacionData({
                              tipo: 'Recordatorio',
                              titulo: 'Recordatorio de Pago Pendiente',
                              mensaje: 'Estimado/a representante, le recordamos que tiene pagos pendientes por las mensualidades de su(s) hijo(s). Por favor, regularice su situación lo antes posible.',
                              metodoEnvio: 'Email',
                              representanteId: '',
                              enviarMasivo: true,
                              categoriaFiltro: 'Todas'
                            })
                            onOpen()
                          }}
                        >
                          Usar Plantilla
                        </Button>
                      </CardBody>
                    </Card>

                    <Card borderColor={borderColor} borderWidth="1px">
                      <CardBody>
                        <Heading size="sm" mb={2}>Comunicado General</Heading>
                        <Text fontSize="sm" color="gray.600" mb={4}>
                          Plantilla para comunicados generales
                        </Text>
                        <Button
                          size="sm"
                          colorScheme="blue"
                          onClick={() => {
                            setNotificacionData({
                              tipo: 'Comunicado',
                              titulo: 'Comunicado Importante',
                              mensaje: 'Estimados representantes, les informamos sobre importantes actualizaciones en nuestra escuela de fútbol. Por favor, revisen la información adjunta.',
                              metodoEnvio: 'Email',
                              representanteId: '',
                              enviarMasivo: true,
                              categoriaFiltro: 'Todas'
                            })
                            onOpen()
                          }}
                        >
                          Usar Plantilla
                        </Button>
                      </CardBody>
                    </Card>

                    <Card borderColor={borderColor} borderWidth="1px">
                      <CardBody>
                        <Heading size="sm" mb={2}>Evento/Torneo</Heading>
                        <Text fontSize="sm" color="gray.600" mb={4}>
                          Plantilla para anunciar eventos
                        </Text>
                        <Button
                          size="sm"
                          colorScheme="green"
                          onClick={() => {
                            setNotificacionData({
                              tipo: 'Evento',
                              titulo: 'Próximo Torneo',
                              mensaje: '¡Excelentes noticias! Tenemos un torneo próximo. Los detalles serán enviados próximamente. Manténganse atentos.',
                              metodoEnvio: 'Email',
                              representanteId: '',
                              enviarMasivo: true,
                              categoriaFiltro: 'Todas'
                            })
                            onOpen()
                          }}
                        >
                          Usar Plantilla
                        </Button>
                      </CardBody>
                    </Card>

                    <Card borderColor={borderColor} borderWidth="1px">
                      <CardBody>
                        <Heading size="sm" mb={2}>Entrenamiento Cancelado</Heading>
                        <Text fontSize="sm" color="gray.600" mb={4}>
                          Plantilla para cancelaciones
                        </Text>
                        <Button
                          size="sm"
                          colorScheme="red"
                          onClick={() => {
                            setNotificacionData({
                              tipo: 'Comunicado',
                              titulo: 'Entrenamiento Cancelado',
                              mensaje: 'Estimados representantes, les informamos que el entrenamiento de mañana ha sido cancelado debido a condiciones climáticas adversas. Les mantendremos informados sobre la reprogramación.',
                              metodoEnvio: 'Email',
                              representanteId: '',
                              enviarMasivo: true,
                              categoriaFiltro: 'Todas'
                            })
                            onOpen()
                          }}
                        >
                          Usar Plantilla
                        </Button>
                      </CardBody>
                    </Card>
                  </Grid>
                </CardBody>
              </Card>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>

      {/* Modal para enviar notificaciones */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Enviar Notificación</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <form onSubmit={handleEnviarNotificacion}>
              <VStack spacing={6}>
                {/* Tipo de envío */}
                <FormControl>
                  <FormLabel>Tipo de Envío</FormLabel>
                  <HStack spacing={4}>
                    <Checkbox
                      isChecked={notificacionData.enviarMasivo}
                      onChange={(e) => setNotificacionData(prev => ({ 
                        ...prev, 
                        enviarMasivo: e.target.checked,
                        representanteId: ''
                      }))}
                    >
                      Envío Masivo (Todos los representantes)
                    </Checkbox>
                    <Checkbox
                      isChecked={!notificacionData.enviarMasivo}
                      onChange={(e) => setNotificacionData(prev => ({ 
                        ...prev, 
                        enviarMasivo: !e.target.checked
                      }))}
                    >
                      Seleccionar Representantes
                    </Checkbox>
                  </HStack>
                </FormControl>

                {/* Filtro por categoría */}
                <FormControl>
                  <FormLabel>Filtrar por Categoría</FormLabel>
                  <Select
                    value={notificacionData.categoriaFiltro}
                    onChange={(e) => {
                      setNotificacionData(prev => ({ ...prev, categoriaFiltro: e.target.value }))
                      // Limpiar selección al cambiar categoría
                      setRepresentantesSeleccionados([])
                    }}
                  >
                    <option value="Todas">Todas las categorías ({representantes?.length || 0} representantes)</option>
                    {categoriasDisponibles.map(categoria => {
                      const count = representantes?.filter(rep => 
                        rep.ninos.some(nino => nino.categoria === categoria)
                      ).length || 0
                      return (
                        <option key={categoria} value={categoria}>
                          {categoria} ({count} representantes)
                        </option>
                      )
                    })}
                  </Select>
                  {notificacionData.categoriaFiltro !== 'Todas' && (
                    <Alert status="info" mt={2} borderRadius="md">
                      <AlertIcon />
                      <Text fontSize="sm">
                        Se enviarán notificaciones a {representantesFiltrados.length} representantes con hijos en la categoría {notificacionData.categoriaFiltro}
                      </Text>
                    </Alert>
                  )}
                </FormControl>

                {/* Selección de representantes */}
                {!notificacionData.enviarMasivo && (
                  <FormControl>
                    <FormLabel>Seleccionar Representantes</FormLabel>
                    <Box maxHeight="200px" overflowY="auto" border="1px" borderColor="gray.200" p={4} borderRadius="md">
                      <VStack align="start" spacing={2}>
                        <Checkbox
                          isChecked={representantesSeleccionados.length === representantesFiltrados.length && representantesFiltrados.length > 0}
                          isIndeterminate={representantesSeleccionados.length > 0 && representantesSeleccionados.length < representantesFiltrados.length}
                          onChange={handleSelectAll}
                        >
                          Seleccionar Todos ({representantesFiltrados.length})
                        </Checkbox>
                        <Divider />
                        <CheckboxGroup value={representantesSeleccionados}>
                          <Stack spacing={2}>
                            {representantesFiltrados.map((rep) => (
                              <Checkbox
                                key={rep.id}
                                value={rep.id}
                                onChange={() => handleSelectRepresentante(rep.id)}
                              >
                                <VStack align="start" spacing={0}>
                                  <Text fontWeight="bold">{rep.nombre}</Text>
                                  <Text fontSize="xs" color="gray.500">{rep.email}</Text>
                                  <HStack spacing={1} flexWrap="wrap">
                                    {rep.ninos.map(nino => (
                                      <Badge key={nino.id} size="sm" colorScheme="blue">
                                        {nino.categoria}
                                      </Badge>
                                    ))}
                                  </HStack>
                                </VStack>
                              </Checkbox>
                            ))}
                          </Stack>
                        </CheckboxGroup>
                      </VStack>
                    </Box>
                    <Text fontSize="sm" color="gray.500" mt={2}>
                      {representantesSeleccionados.length} de {representantesFiltrados.length} representante(s) seleccionado(s)
                    </Text>
                  </FormControl>
                )}

                {/* Tipo de notificación */}
                <FormControl isRequired>
                  <FormLabel>Tipo de Notificación</FormLabel>
                  <Select
                    value={notificacionData.tipo}
                    onChange={(e) => setNotificacionData(prev => ({ ...prev, tipo: e.target.value }))}
                  >
                    <option value="Recordatorio">Recordatorio de Pago</option>
                    <option value="Comunicado">Comunicado General</option>
                    <option value="Evento">Evento/Torneo</option>
                  </Select>
                </FormControl>

                {/* Título */}
                <FormControl isRequired>
                  <FormLabel>Título</FormLabel>
                  <Input
                    value={notificacionData.titulo}
                    onChange={(e) => setNotificacionData(prev => ({ ...prev, titulo: e.target.value }))}
                    placeholder="Título de la notificación"
                  />
                </FormControl>

                {/* Mensaje */}
                <FormControl isRequired>
                  <FormLabel>Mensaje</FormLabel>
                  <Textarea
                    value={notificacionData.mensaje}
                    onChange={(e) => setNotificacionData(prev => ({ ...prev, mensaje: e.target.value }))}
                    placeholder="Contenido del mensaje"
                    rows={6}
                  />
                </FormControl>

                {/* Método de envío */}
                <FormControl isRequired>
                  <FormLabel>Método de Envío</FormLabel>
                  <Select
                    value={notificacionData.metodoEnvio}
                    onChange={(e) => setNotificacionData(prev => ({ ...prev, metodoEnvio: e.target.value }))}
                  >
                    <option value="Email">Email</option>
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Ambos">Email y WhatsApp</option>
                  </Select>
                </FormControl>

                {/* Botones */}
                <HStack spacing={4} width="full">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    flex={1}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    colorScheme="blue"
                    leftIcon={<FiSend />}
                    isLoading={notificacionMutation.isPending}
                    flex={1}
                  >
                    Enviar Notificación
                  </Button>
                </HStack>
              </VStack>
            </form>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Container>
  )
}
