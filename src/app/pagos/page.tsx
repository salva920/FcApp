'use client'

import React from 'react'
import {
  Box,
  Button,
  Container,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
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
  VStack,
  useToast,
  Badge,
  Text,
  HStack,
  Select,
  InputGroup,
  InputLeftElement,
  Flex,
  Spacer,
  useColorModeValue,
  Card,
  CardBody,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Textarea,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Stack,
  SimpleGrid
} from '@chakra-ui/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiDollarSign, FiCalendar, FiUpload, FiEye, FiDownload } from 'react-icons/fi'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface Pago {
  id: string
  monto: number
  concepto: string
  fechaVencimiento: string
  fechaPago?: string
  estado: string
  metodoPago?: string
  comprobante?: string
  observaciones?: string
  estadoVerificacion?: string
  comentarioAdmin?: string
  fechaVerificacion?: string
  verificadoPor?: string
  representante: {
    id: string
    nombre: string
    cedula: string
    email: string
  }
  createdAt: string
}

export default function PagosPage() {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { isOpen: isViewOpen, onOpen: onViewOpen, onClose: onViewClose } = useDisclosure()
  const [selectedPago, setSelectedPago] = React.useState<Pago | null>(null)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [estadoFilter, setEstadoFilter] = React.useState('')
  const [formData, setFormData] = React.useState({
    monto: '',
    concepto: '',
    fechaVencimiento: '',
    fechaPago: '',
    estado: 'Pendiente',
    metodoPago: '',
    comprobante: '',
    observaciones: '',
    representanteId: ''
  })
  const [representantes, setRepresentantes] = React.useState<any[]>([])
  const [verificandoPago, setVerificandoPago] = React.useState<string | null>(null)
  const toast = useToast()
  const queryClient = useQueryClient()
  const cardBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')

  const { data: pagos, isLoading } = useQuery<Pago[]>({
    queryKey: ['pagos'],
    queryFn: async () => {
      const res = await fetch('/api/pagos')
      if (!res.ok) throw new Error('Error al cargar pagos')
      return res.json()
    }
  })

  const { data: representantesData } = useQuery({
    queryKey: ['representantes'],
    queryFn: async () => {
      const res = await fetch('/api/representantes')
      if (!res.ok) throw new Error('Error al cargar representantes')
      return res.json()
    }
  })

  React.useEffect(() => {
    if (representantesData) {
      setRepresentantes(representantesData)
    }
  }, [representantesData])

  const filteredPagos = React.useMemo(() => {
    if (!pagos) return []
    
    let filtered = pagos
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(pago => 
        pago.concepto.toLowerCase().includes(query) ||
        pago.representante.nombre.toLowerCase().includes(query) ||
        pago.representante.cedula.toLowerCase().includes(query)
      )
    }
    
    if (estadoFilter) {
      filtered = filtered.filter(pago => pago.estado === estadoFilter)
    }
    
    return filtered
  }, [pagos, searchQuery, estadoFilter])

  const createMutation = useMutation({
    mutationFn: async (newPago: Omit<Pago, 'id' | 'representante' | 'createdAt'>) => {
      const res = await fetch('/api/pagos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPago)
      })
      if (!res.ok) throw new Error('Error al crear pago')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pagos'] })
      onClose()
      toast({
        title: 'Pago registrado',
        status: 'success',
        duration: 3000
      })
    }
  })

  const updateMutation = useMutation({
    mutationFn: async (pago: Pago) => {
      const res = await fetch(`/api/pagos/${pago.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pago)
      })
      if (!res.ok) throw new Error('Error al actualizar pago')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pagos'] })
      onClose()
      toast({
        title: 'Pago actualizado',
        status: 'success',
        duration: 3000
      })
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/pagos/${id}`, {
        method: 'DELETE'
      })
      if (!res.ok) throw new Error('Error al eliminar pago')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pagos'] })
      toast({
        title: 'Pago eliminado',
        status: 'success',
        duration: 3000
      })
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedPago) {
      updateMutation.mutate({ 
        ...formData, 
        monto: parseFloat(formData.monto),
        id: selectedPago.id, 
        representante: selectedPago.representante, 
        createdAt: selectedPago.createdAt 
      } as Pago)
    } else {
      createMutation.mutate({ ...formData, monto: parseFloat(formData.monto) } as any)
    }
  }

  const handleEdit = (pago: Pago) => {
    setSelectedPago(pago)
    setFormData({
      monto: pago.monto.toString(),
      concepto: pago.concepto,
      fechaVencimiento: pago.fechaVencimiento.split('T')[0],
      fechaPago: pago.fechaPago ? pago.fechaPago.split('T')[0] : '',
      estado: pago.estado,
      metodoPago: pago.metodoPago || '',
      comprobante: pago.comprobante || '',
      observaciones: pago.observaciones || '',
      representanteId: pago.representante.id
    })
    onOpen()
  }

  const handleDelete = (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar este pago?')) {
      deleteMutation.mutate(id)
    }
  }

  const handleNew = () => {
    setSelectedPago(null)
    setFormData({
      monto: '',
      concepto: '',
      fechaVencimiento: '',
      fechaPago: '',
      estado: 'Pendiente',
      metodoPago: '',
      comprobante: '',
      observaciones: '',
      representanteId: ''
    })
    onOpen()
  }

  const handleView = (pago: Pago) => {
    setSelectedPago(pago)
    onViewOpen()
  }

  const handleVerificarPago = async (pagoId: string, estado: 'Aprobado' | 'Denegado', comentario?: string) => {
    setVerificandoPago(pagoId)
    try {
      const res = await fetch(`/api/pagos/${pagoId}/verificar`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          estadoVerificacion: estado,
          comentarioAdmin: comentario,
          verificadoPor: 'admin' // Aquí podrías usar el ID del usuario logueado
        })
      })

      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: ['pagos'] })
        toast({
          title: `Pago ${estado.toLowerCase()}`,
          description: `El pago ha sido ${estado.toLowerCase()} y se ha notificado al representante.`,
          status: 'success',
          duration: 3000
        })
      } else {
        throw new Error('Error al verificar pago')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Hubo un problema al verificar el pago.',
        status: 'error',
        duration: 3000
      })
    } finally {
      setVerificandoPago(null)
    }
  }

  const getEstadoColor = (estado: string) => {
    const colors: { [key: string]: string } = {
      'Pagado': 'green',
      'Pendiente': 'yellow',
      'Vencido': 'red'
    }
    return colors[estado] || 'gray'
  }

  const getMetodoPagoColor = (metodo: string) => {
    const colors: { [key: string]: string } = {
      'Efectivo': 'green',
      'Transferencia': 'blue',
      'Pago Móvil': 'purple'
    }
    return colors[metodo] || 'gray'
  }

  const getVerificacionColor = (estado: string) => {
    const colors: { [key: string]: string } = {
      'Aprobado': 'green',
      'Denegado': 'red',
      'Pendiente': 'yellow'
    }
    return colors[estado] || 'gray'
  }

  const estadisticas = React.useMemo(() => {
    if (!pagos) return { total: 0, pagados: 0, pendientes: 0, vencidos: 0, ingresos: 0, pendientesVerificacion: 0 }
    
    const total = pagos.length
    const pagados = pagos.filter(p => p.estado === 'Pagado').length
    const pendientes = pagos.filter(p => p.estado === 'Pendiente').length
    const vencidos = pagos.filter(p => p.estado === 'Vencido').length
    const pendientesVerificacion = pagos.filter(p => p.estadoVerificacion === 'Pendiente' || !p.estadoVerificacion).length
    const ingresos = pagos
      .filter(p => p.estado === 'Pagado')
      .reduce((sum, p) => sum + p.monto, 0)
    
    return { total, pagados, pendientes, vencidos, ingresos, pendientesVerificacion }
  }, [pagos])

  if (isLoading) {
    return (
      <Container maxW="container.xl" py={4}>
        <Stack
          mb={6}
          direction={{ base: 'column', md: 'row' }}
          spacing={4}
          justify="space-between"
          align={{ base: 'stretch', md: 'center' }}
        >
          <Heading size="lg">Gestión de Pagos</Heading>
          <Button
            leftIcon={<FiPlus />}
            colorScheme="blue"
            onClick={handleNew}
            isDisabled
            width={{ base: '100%', md: 'auto' }}
          >
            Registrar Pago
          </Button>
        </Stack>
        <Box textAlign="center" py={20}>
          <Text fontSize="lg" color="gray.600">Cargando pagos...</Text>
        </Box>
      </Container>
    )
  }

  return (
    <Container maxW="container.xl" py={4}>
      <Stack
        mb={6}
        direction={{ base: 'column', md: 'row' }}
        spacing={4}
        justify="space-between"
        align={{ base: 'stretch', md: 'center' }}
      >
        <Heading size="lg">Gestión de Pagos</Heading>
        <Button
          leftIcon={<FiPlus />}
          colorScheme="blue"
          onClick={handleNew}
          width={{ base: '100%', md: 'auto' }}
          alignSelf={{ base: 'stretch', md: 'center' }}
        >
          Registrar Pago
        </Button>
      </Stack>

      {/* Estadísticas */}
      <Box mb={6}>
        <SimpleGrid columns={{ base: 2, md: 2, lg: 3 }} spacing={4}>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Total Pagos</StatLabel>
                <StatNumber>{estadisticas.total}</StatNumber>
                <StatHelpText>
                  <StatArrow type="increase" />
                  Registrados
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Pagados</StatLabel>
                <StatNumber color="green.500">{estadisticas.pagados}</StatNumber>
                <StatHelpText>
                  <StatArrow type="increase" />
                  {estadisticas.total > 0 ? Math.round((estadisticas.pagados / estadisticas.total) * 100) : 0}%
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Pendientes</StatLabel>
                <StatNumber color="yellow.500">{estadisticas.pendientes}</StatNumber>
                <StatHelpText>
                  <StatArrow type="decrease" />
                  Por cobrar
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Vencidos</StatLabel>
                <StatNumber color="red.500">{estadisticas.vencidos}</StatNumber>
                <StatHelpText>
                  <StatArrow type="decrease" />
                  Urgente
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Pendientes Verificación</StatLabel>
                <StatNumber color="orange.500">{estadisticas.pendientesVerificacion}</StatNumber>
                <StatHelpText>
                  <StatArrow type="decrease" />
                  Por revisar
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Ingresos</StatLabel>
                <StatNumber color="green.500">${estadisticas.ingresos.toFixed(2)}</StatNumber>
                <StatHelpText>
                  <StatArrow type="increase" />
                  Total cobrado
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </SimpleGrid>
      </Box>

      {/* Filtros */}
      <Box mb={6} p={4} bg={cardBg} borderRadius="md" borderColor={borderColor} borderWidth="1px">
        <Stack
          spacing={4}
          direction={{ base: 'column', md: 'row' }}
          align={{ base: 'stretch', md: 'center' }}
        >
          <FormControl maxW={{ base: '100%', md: '300px' }}>
            <InputGroup>
              <InputLeftElement>
                <FiSearch />
              </InputLeftElement>
              <Input
                placeholder="Buscar por concepto o representante..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </InputGroup>
          </FormControl>
          <FormControl maxW={{ base: '100%', md: '200px' }}>
            <Select
              placeholder="Todos los estados"
              value={estadoFilter}
              onChange={(e) => setEstadoFilter(e.target.value)}
            >
              <option value="Pagado">Pagado</option>
              <option value="Pendiente">Pendiente</option>
              <option value="Vencido">Vencido</option>
            </Select>
          </FormControl>
        </Stack>
      </Box>

      <Box overflowX="auto">
        <Table variant="simple" size="md" minW="960px">
          <Thead>
            <Tr>
              <Th>Concepto</Th>
              <Th>Representante</Th>
              <Th>Monto</Th>
              <Th>Fecha Vencimiento</Th>
              <Th>Fecha Pago</Th>
              <Th>Estado</Th>
              <Th>Verificación</Th>
              <Th>Método</Th>
              <Th>Acciones</Th>
            </Tr>
          </Thead>
          <Tbody>
            {filteredPagos?.map((pago) => (
              <Tr key={pago.id}>
                <Td>
                  <VStack align="start" spacing={1}>
                    <Text fontWeight="bold">{pago.concepto}</Text>
                    {pago.observaciones && (
                      <Text fontSize="xs" color="gray.500">{pago.observaciones}</Text>
                    )}
                  </VStack>
                </Td>
                <Td>
                  <VStack align="start" spacing={1}>
                    <Text fontWeight="bold">{pago.representante.nombre}</Text>
                    <Text fontSize="xs" color="gray.500">{pago.representante.cedula}</Text>
                    <Text fontSize="xs" color="gray.500">{pago.representante.email}</Text>
                  </VStack>
                </Td>
                <Td>
                  <Text fontWeight="bold" fontSize="lg">
                    ${pago.monto.toFixed(2)}
                  </Text>
                </Td>
                <Td>
                  <Text fontSize="sm">
                    {format(new Date(pago.fechaVencimiento), 'dd/MM/yyyy', { locale: es })}
                  </Text>
                </Td>
                <Td>
                  {pago.fechaPago ? (
                    <Text fontSize="sm">
                      {format(new Date(pago.fechaPago), 'dd/MM/yyyy', { locale: es })}
                    </Text>
                  ) : (
                    <Text fontSize="sm" color="gray.400">-</Text>
                  )}
                </Td>
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
                  {pago.metodoPago ? (
                    <Badge colorScheme={getMetodoPagoColor(pago.metodoPago)}>
                      {pago.metodoPago}
                    </Badge>
                  ) : (
                    <Text fontSize="sm" color="gray.400">-</Text>
                  )}
                </Td>
                <Td>
                  <Stack
                    direction={{ base: 'column', md: 'row' }}
                    spacing={2}
                    align={{ base: 'stretch', md: 'center' }}
                  >
                    <Button
                      size="sm"
                      leftIcon={<FiEye />}
                      onClick={() => handleView(pago)}
                      width={{ base: '100%', md: 'auto' }}
                    >
                      Ver
                    </Button>
                    {(pago.estadoVerificacion === 'Pendiente' || !pago.estadoVerificacion) && (
                      <>
                        <Button
                          size="sm"
                          colorScheme="green"
                          isLoading={verificandoPago === pago.id}
                          onClick={() => handleVerificarPago(pago.id, 'Aprobado')}
                          width={{ base: '100%', md: 'auto' }}
                        >
                          Aprobar
                        </Button>
                        <Button
                          size="sm"
                          colorScheme="red"
                          isLoading={verificandoPago === pago.id}
                          onClick={() => handleVerificarPago(pago.id, 'Denegado')}
                          width={{ base: '100%', md: 'auto' }}
                        >
                          Denegar
                        </Button>
                      </>
                    )}
                    <Button
                      size="sm"
                      leftIcon={<FiEdit2 />}
                      onClick={() => handleEdit(pago)}
                      width={{ base: '100%', md: 'auto' }}
                    >
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      leftIcon={<FiTrash2 />}
                      colorScheme="red"
                      onClick={() => handleDelete(pago.id)}
                      width={{ base: '100%', md: 'auto' }}
                    >
                      Eliminar
                    </Button>
                  </Stack>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>

      {/* Modal de formulario */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {selectedPago ? 'Editar Pago' : 'Registrar Nuevo Pago'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <form onSubmit={handleSubmit}>
              <VStack spacing={4}>
                <Stack direction={{ base: 'column', md: 'row' }} spacing={4} width="full">
                  <FormControl isRequired>
                    <FormLabel>Concepto</FormLabel>
                    <Input
                      value={formData.concepto}
                      onChange={(e) =>
                        setFormData({ ...formData, concepto: e.target.value })
                      }
                      placeholder="Mensualidad, Inscripción, etc."
                    />
                  </FormControl>
                  <FormControl isRequired>
                    <FormLabel>Monto</FormLabel>
                    <NumberInput
                      value={formData.monto}
                      onChange={(value) =>
                        setFormData({ ...formData, monto: value })
                      }
                      min={0}
                      precision={2}
                    >
                      <NumberInputField />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                  </FormControl>
                </Stack>

                <Stack direction={{ base: 'column', md: 'row' }} spacing={4} width="full">
                  <FormControl isRequired>
                    <FormLabel>Fecha de Vencimiento</FormLabel>
                    <Input
                      type="date"
                      value={formData.fechaVencimiento}
                      onChange={(e) =>
                        setFormData({ ...formData, fechaVencimiento: e.target.value })
                      }
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Fecha de Pago</FormLabel>
                    <Input
                      type="date"
                      value={formData.fechaPago}
                      onChange={(e) =>
                        setFormData({ ...formData, fechaPago: e.target.value })
                      }
                    />
                  </FormControl>
                </Stack>

                <Stack direction={{ base: 'column', md: 'row' }} spacing={4} width="full">
                  <FormControl isRequired>
                    <FormLabel>Representante</FormLabel>
                    <Select
                      value={formData.representanteId}
                      onChange={(e) =>
                        setFormData({ ...formData, representanteId: e.target.value })
                      }
                    >
                      <option value="">Seleccionar representante</option>
                      {representantes.map((rep) => (
                        <option key={rep.id} value={rep.id}>
                          {rep.nombre} - {rep.cedula}
                        </option>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl isRequired>
                    <FormLabel>Estado</FormLabel>
                    <Select
                      value={formData.estado}
                      onChange={(e) =>
                        setFormData({ ...formData, estado: e.target.value })
                      }
                    >
                      <option value="Pendiente">Pendiente</option>
                      <option value="Pagado">Pagado</option>
                      <option value="Vencido">Vencido</option>
                    </Select>
                  </FormControl>
                </Stack>

                <Stack direction={{ base: 'column', md: 'row' }} spacing={4} width="full">
                  <FormControl>
                    <FormLabel>Método de Pago</FormLabel>
                    <Select
                      value={formData.metodoPago}
                      onChange={(e) =>
                        setFormData({ ...formData, metodoPago: e.target.value })
                      }
                    >
                      <option value="">Seleccionar método</option>
                      <option value="Efectivo">Efectivo</option>
                      <option value="Transferencia">Transferencia</option>
                      <option value="Pago Móvil">Pago Móvil</option>
                    </Select>
                  </FormControl>
                  <FormControl>
                    <FormLabel>Comprobante</FormLabel>
                    <Input
                      value={formData.comprobante}
                      onChange={(e) =>
                        setFormData({ ...formData, comprobante: e.target.value })
                      }
                      placeholder="URL o referencia del comprobante"
                    />
                  </FormControl>
                </Stack>

                <FormControl>
                  <FormLabel>Observaciones</FormLabel>
                  <Textarea
                    value={formData.observaciones}
                    onChange={(e) =>
                      setFormData({ ...formData, observaciones: e.target.value })
                    }
                    placeholder="Notas adicionales sobre el pago"
                  />
                </FormControl>

                <Button
                  type="submit"
                  colorScheme="blue"
                  width="full"
                  isLoading={createMutation.isPending || updateMutation.isPending}
                >
                  {selectedPago ? 'Actualizar' : 'Registrar'}
                </Button>
              </VStack>
            </form>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Modal de vista */}
      <Modal isOpen={isViewOpen} onClose={onViewClose} size="2xl">
        <ModalOverlay />
        <ModalContent maxH="90vh" overflowY="auto">
          <ModalHeader>Detalles del Pago</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {selectedPago && (
              <VStack spacing={4} align="stretch">
                <Box p={4} bg="gray.50" borderRadius="md">
                  <Text fontWeight="bold" fontSize="lg">{selectedPago.concepto}</Text>
                  <Text fontSize="2xl" fontWeight="bold" color="green.500">
                    ${selectedPago.monto.toFixed(2)}
                  </Text>
                </Box>
                
                <HStack justify="space-between">
                  <Text fontWeight="bold">Representante:</Text>
                  <Text>{selectedPago.representante.nombre}</Text>
                </HStack>
                
                <HStack justify="space-between">
                  <Text fontWeight="bold">Cédula:</Text>
                  <Text>{selectedPago.representante.cedula}</Text>
                </HStack>
                
                <HStack justify="space-between">
                  <Text fontWeight="bold">Email:</Text>
                  <Text>{selectedPago.representante.email}</Text>
                </HStack>
                
                <HStack justify="space-between">
                  <Text fontWeight="bold">Fecha Vencimiento:</Text>
                  <Text>{format(new Date(selectedPago.fechaVencimiento), 'dd/MM/yyyy', { locale: es })}</Text>
                </HStack>
                
                {selectedPago.fechaPago && (
                  <HStack justify="space-between">
                    <Text fontWeight="bold">Fecha Pago:</Text>
                    <Text>{format(new Date(selectedPago.fechaPago), 'dd/MM/yyyy', { locale: es })}</Text>
                  </HStack>
                )}
                
                <HStack justify="space-between">
                  <Text fontWeight="bold">Estado:</Text>
                  <Badge colorScheme={getEstadoColor(selectedPago.estado)}>
                    {selectedPago.estado}
                  </Badge>
                </HStack>
                
                {selectedPago.metodoPago && (
                  <HStack justify="space-between">
                    <Text fontWeight="bold">Método de Pago:</Text>
                    <Badge colorScheme={getMetodoPagoColor(selectedPago.metodoPago)}>
                      {selectedPago.metodoPago}
                    </Badge>
                  </HStack>
                )}
                
                {selectedPago.comprobante && (
                  <Box>
                    <Text fontWeight="bold" mb={2}>Comprobante:</Text>
                    {selectedPago.comprobante.startsWith('data:') ? (
                      <Box>
                        <img
                          src={selectedPago.comprobante}
                          alt="Comprobante de pago"
                          style={{
                            maxWidth: '100%',
                            maxHeight: '400px',
                            objectFit: 'contain',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px'
                          }}
                        />
                        <Button
                          mt={2}
                          size="sm"
                          onClick={() => {
                            const link = document.createElement('a')
                            link.href = selectedPago.comprobante!
                            link.download = `comprobante-${selectedPago.id}.jpg`
                            link.click()
                          }}
                          leftIcon={<FiDownload />}
                        >
                          Descargar Comprobante
                        </Button>
                      </Box>
                    ) : (
                      <Text color="blue.500" textDecoration="underline">
                        <a href={selectedPago.comprobante} target="_blank" rel="noopener noreferrer">
                          Ver comprobante
                        </a>
                      </Text>
                    )}
                  </Box>
                )}
                
                {selectedPago.observaciones && (
                  <Box>
                    <Text fontWeight="bold" mb={2}>Observaciones:</Text>
                    {selectedPago.concepto.toLowerCase().includes('compra tienda') || selectedPago.observaciones.includes(',') ? (
                      <VStack align="stretch" spacing={1} p={3} bg="gray.50" borderRadius="md">
                        {selectedPago.observaciones.split(',').map((line, idx) => (
                          <Text key={idx} fontSize="sm">• {line.trim()}</Text>
                        ))}
                      </VStack>
                    ) : (
                      <Text p={3} bg="gray.50" borderRadius="md">
                        {selectedPago.observaciones}
                      </Text>
                    )}
                  </Box>
                )}
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Container>
  )
}
