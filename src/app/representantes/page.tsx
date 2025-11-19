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
  Divider,
  Progress,
  IconButton,
  Stack,
  SimpleGrid,
  Select,
  useBreakpointValue
} from '@chakra-ui/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiUser, FiDollarSign, FiUsers, FiChevronLeft, FiChevronRight, FiShield } from 'react-icons/fi'
import { useAuth } from '@/hooks/useAuth'
import dynamic from 'next/dynamic'
import { Buffer } from 'buffer'
import { useRouter } from 'next/navigation'

// Lazy load de componentes pesados
const FacialRecognition = dynamic(() => import('@/components/FacialRecognition'), {
  ssr: false,
  loading: () => <Box p={4}>Cargando cámara...</Box>
})

const FaceComparison = dynamic(() => import('@/components/FaceComparison'), {
  ssr: false,
  loading: () => <Box p={4}>Cargando comparador...</Box>
})

const NinoForm = dynamic(() => import('@/components/ninos/NinoForm').then(mod => ({ default: mod.NinoForm })), {
  ssr: false
})

interface Representante {
  id: string
  nombre: string
  cedula: string
  email: string
  telefono: string
  direccion?: string
  createdAt: string
  usuarios?: Array<{
    id: string
    email: string
    nombre: string
    rol: string
    categoria?: string | null
    activo: boolean
  }>
  ninos: Array<{
    id: string
    nombre: string
    apellido: string
    categoria: string
    activo: boolean
  }>
  pagos: Array<{
    id: string
    monto: number
    estado: string
    fechaVencimiento: string
  }>
  _count: {
    ninos: number
    pagos: number
  }
}

export default function RepresentantesPage() {
  const { isAdmin } = useAuth()
  const router = useRouter()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { isOpen: isFacialOpen, onOpen: onFacialOpen, onClose: onFacialClose } = useDisclosure()
  const { isOpen: isComparisonOpen, onOpen: onComparisonOpen, onClose: onComparisonClose } = useDisclosure()
  const { isOpen: isRolOpen, onOpen: onRolOpen, onClose: onRolClose } = useDisclosure()
  const [selectedRepresentante, setSelectedRepresentante] = React.useState<Representante | null>(null)
  const [selectedUsuario, setSelectedUsuario] = React.useState<{ id: string; nombre: string; rol: string; categoria?: string | null } | null>(null)
  const [rolData, setRolData] = React.useState({ rol: '', categoria: '' })
  const [searchQuery, setSearchQuery] = React.useState('')
  
  const categorias = ['Sub-6', 'Sub-8', 'Sub-10', 'Sub-12', 'Sub-14', 'Sub-16', 'Sub-18']
  const [currentStep, setCurrentStep] = React.useState(1)
  const [showAddNino, setShowAddNino] = React.useState(false)
  const [newRepresentanteId, setNewRepresentanteId] = React.useState<string | null>(null)
  
  const [ninoFormData, setNinoFormData] = React.useState({
    nombre: '',
    apellido: '',
    fechaNacimiento: '',
    cedula: '',
    alergias: '',
    emergencia: '',
    categoria: '',
    nivel: 'Principiante',
    activo: true,
    representanteId: '',
    cedulaFile: '',
    partidaFile: '',
    fotoFile: '',
    faceDescriptor: '',
    faceImageUrl: ''
  })
  
  const [formData, setFormData] = React.useState({
    nombre: '',
    cedula: '',
    email: '',
    telefono: '',
    direccion: ''
  })
  
  const [capturedFaceData, setCapturedFaceData] = React.useState<{
    photoData: string
    faceDescriptor: Float32Array
  } | null>(null)
  const [existingFaces, setExistingFaces] = React.useState<any[]>([])
  
  const toast = useToast()
  const queryClient = useQueryClient()
  const cardBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')

  const { data: representantes, isLoading } = useQuery<Representante[]>({
    queryKey: ['representantes'],
    queryFn: async () => {
      const res = await fetch('/api/representantes')
      if (!res.ok) throw new Error('Error al cargar representantes')
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
  
  const [representantesList, setRepresentantesList] = React.useState<any[]>([])

  React.useEffect(() => {
    if (representantesData) {
      setRepresentantesList(representantesData)
    }
  }, [representantesData])

  const filteredRepresentantes = React.useMemo(() => {
    if (!representantes) return []
    if (!searchQuery) return representantes
    
    const query = searchQuery.toLowerCase()
    return representantes.filter(rep => 
      rep.nombre.toLowerCase().includes(query) || 
      rep.cedula.toLowerCase().includes(query) ||
      rep.email.toLowerCase().includes(query)
    )
  }, [representantes, searchQuery])

  const createMutation = useMutation({
    mutationFn: async (newRepresentante: Omit<Representante, 'id' | 'createdAt' | 'ninos' | 'pagos' | '_count'>) => {
      const res = await fetch('/api/representantes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRepresentante)
      })
      if (!res.ok) throw new Error('Error al crear representante')
      return res.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['representantes'] })
      toast({
        title: 'Representante creado',
        status: 'success',
        duration: 3000
      })
      // Avanzar al paso 2 para agregar niños
      setCurrentStep(2)
      setShowAddNino(true)
      return data
    }
  })

  const createNinoMutation = useMutation({
    mutationFn: async (ninoData: any) => {
      const res = await fetch('/api/ninos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ninoData)
      })
      if (!res.ok) throw new Error('Error al crear niño')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ninos'] })
      queryClient.invalidateQueries({ queryKey: ['representantes'] })
      // Resetear formulario de niño
      setNinoFormData({
        nombre: '',
        apellido: '',
        fechaNacimiento: '',
        cedula: '',
        alergias: '',
        emergencia: '',
        categoria: '',
        nivel: 'Principiante',
        activo: true,
        representanteId: '',
        cedulaFile: '',
        partidaFile: '',
        fotoFile: '',
        faceDescriptor: '',
        faceImageUrl: ''
      })
      toast({
        title: 'Niño agregado',
        status: 'success',
        duration: 3000
      })
    }
  })

  const rolMutation = useMutation({
    mutationFn: async ({ usuarioId, rol, categoria, rolActual }: { usuarioId: string; rol: string; categoria?: string; rolActual?: string }) => {
      const token = localStorage.getItem('football_auth_token')
      const body: any = {}
      
      // Si se cambia el rol, incluirlo en el body
      if (rol) {
        body.rol = rol
      }
      
      // Si se cambia a representante-delegado, siempre incluir la categoría
      if (rol === 'representante-delegado') {
        if (!categoria) {
          throw new Error('La categoría es requerida para el rol de Representante Delegado')
        }
        body.categoria = categoria
      } else if (rol === 'representante') {
        // Si se cambia de vuelta a representante, quitar la categoría
        body.categoria = null
      } else if (rolActual === 'representante-delegado' && categoria) {
        // Si ya es delegado y solo se actualiza la categoría (sin cambiar el rol)
        body.categoria = categoria
      }
      
      const res = await fetch(`/api/usuarios/${usuarioId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Error al actualizar rol')
      }
      return res.json()
    },
    onSuccess: () => {
      toast({
        title: 'Rol actualizado',
        description: 'El rol del usuario se ha actualizado exitosamente',
        status: 'success',
        duration: 3000
      })
      queryClient.invalidateQueries({ queryKey: ['representantes'] })
      queryClient.invalidateQueries({ queryKey: ['usuarios'] })
      onRolClose()
      setSelectedUsuario(null)
      setRolData({ rol: '', categoria: '' })
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Error al actualizar rol',
        status: 'error',
        duration: 3000
      })
    }
  })

  const handleSubmitRol = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUsuario) return
    
    // Si el rol actual o el nuevo es representante-delegado, validar categoría
    const esDelegado = rolData.rol === 'representante-delegado' || selectedUsuario.rol === 'representante-delegado'
    
    if (esDelegado && !rolData.categoria) {
      toast({
        title: 'Categoría requerida',
        description: 'Debes seleccionar una categoría para el rol de Representante Delegado',
        status: 'error',
        duration: 3000
      })
      return
    }
    
    rolMutation.mutate({
      usuarioId: selectedUsuario.id,
      rol: rolData.rol,
      categoria: rolData.categoria,
      rolActual: selectedUsuario.rol
    })
  }

  const handleGoToGestionNinos = () => {
    handleFinish()
    router.push('/ninos')
  }

  // Función para manejar foto capturada
  const handlePhotoCaptured = async (photoData: string, faceDescriptor?: Float32Array) => {
    if (!faceDescriptor) {
      toast({
        title: 'Error',
        description: 'No se pudo extraer el descriptor facial',
        status: 'error',
        duration: 3000
      })
      return
    }

    setCapturedFaceData({ photoData, faceDescriptor })
    
    await new Promise(resolve => setTimeout(resolve, 100))
    
    try {
      const response = await fetch('/api/facial-recognition')
      const faces = await response.json()
      setExistingFaces(faces)
      
      if (faces.length > 0) {
        onFacialClose()
        onComparisonOpen()
      } else {
        await handleNoFaceMatch({ photoData, faceDescriptor })
      }
    } catch (error) {
      console.error('Error obteniendo rostros existentes:', error)
      toast({
        title: 'Error',
        description: 'Error al verificar rostros existentes',
        status: 'error',
        duration: 3000
      })
    }
  }

  const handleNoFaceMatch = async (faceData?: { photoData: string; faceDescriptor: Float32Array }) => {
    const dataToUse = faceData || capturedFaceData
    
    if (dataToUse) {
      try {
        const response = await fetch(dataToUse.photoData)
        const blob = await response.blob()
        const file = new File([blob], 'facial-photo.jpg', { type: 'image/jpeg' })
        
        const formData = new FormData()
        formData.append('file', file)
        
        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        })
        
        if (uploadResponse.ok) {
          const uploadResult = await uploadResponse.json()
          
          // Actualizar el formulario con la URL del archivo subido y el descriptor facial
          // Convertir Float32Array a Base64 usando función helper del navegador
          const descriptorBase64 = btoa(unescape(encodeURIComponent(JSON.stringify(Array.from(dataToUse.faceDescriptor)))))
          
          setNinoFormData(prev => ({
            ...prev,
            fotoFile: uploadResult.fileUrl,
            faceImageUrl: uploadResult.fileUrl,
            faceDescriptor: descriptorBase64
          }))
          
          toast({
            title: 'Foto guardada',
            description: 'La foto facial se ha guardado correctamente',
            status: 'success',
            duration: 3000
          })
        } else {
          throw new Error('Error al subir la foto')
        }
      } catch (error) {
        console.error('Error guardando foto facial:', error)
        toast({
          title: 'Error',
          description: 'Error al guardar la foto facial',
          status: 'error',
          duration: 3000
        })
      }
    }
    
    onComparisonClose()
    setCapturedFaceData(null)
    setExistingFaces([])
  }

  const handleFacialRecognition = () => {
    onFacialOpen()
  }

  const updateMutation = useMutation({
    mutationFn: async (representante: Representante) => {
      const res = await fetch(`/api/representantes/${representante.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(representante)
      })
      if (!res.ok) throw new Error('Error al actualizar representante')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['representantes'] })
      onClose()
      toast({
        title: 'Representante actualizado',
        status: 'success',
        duration: 3000
      })
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/representantes/${id}`, {
        method: 'DELETE'
      })
      if (!res.ok) throw new Error('Error al eliminar representante')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['representantes'] })
      toast({
        title: 'Representante eliminado',
        status: 'success',
        duration: 3000
      })
    }
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedRepresentante) {
      // Modo edición
      updateMutation.mutate({ ...formData, id: selectedRepresentante.id, createdAt: selectedRepresentante.createdAt, ninos: selectedRepresentante.ninos, pagos: selectedRepresentante.pagos, _count: selectedRepresentante._count } as Representante)
      onClose()
    } else {
      // Modo creación - primer paso
      const res = await fetch('/api/representantes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (!res.ok) throw new Error('Error al crear representante')
      const newRep = await res.json()
      
      queryClient.invalidateQueries({ queryKey: ['representantes'] })
      toast({
        title: 'Representante creado',
        status: 'success',
        duration: 3000
      })
      
      // Guardar el ID del nuevo representante y avanzar al paso 2
      setNewRepresentanteId(newRep.id)
      setNinoFormData({
        ...ninoFormData,
        representanteId: newRep.id
      })
      setCurrentStep(2)
      setShowAddNino(true)
    }
  }

  const handleAddNino = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newRepresentanteId) return
    
    const ninoData = {
      ...ninoFormData,
      representanteId: newRepresentanteId
    }
    
    createNinoMutation.mutate(ninoData)
  }

  const handleFinish = () => {
    onClose()
    setCurrentStep(1)
    setShowAddNino(false)
    setNewRepresentanteId(null)
    setSelectedRepresentante(null)
    setFormData({
      nombre: '',
      cedula: '',
      email: '',
      telefono: '',
      direccion: ''
    })
  }

  const handleEdit = (representante: Representante) => {
    setSelectedRepresentante(representante)
    setFormData({
      nombre: representante.nombre,
      cedula: representante.cedula,
      email: representante.email,
      telefono: representante.telefono,
      direccion: representante.direccion || ''
    })
    onOpen()
  }

  const handleDelete = (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar este representante?')) {
      deleteMutation.mutate(id)
    }
  }

  const handleNew = () => {
    setSelectedRepresentante(null)
    setCurrentStep(1)
    setShowAddNino(false)
    setNewRepresentanteId(null)
    setFormData({
      nombre: '',
      cedula: '',
      email: '',
      telefono: '',
      direccion: ''
    })
    setNinoFormData({
      nombre: '',
      apellido: '',
      fechaNacimiento: '',
      cedula: '',
      alergias: '',
      emergencia: '',
      categoria: '',
      nivel: 'Principiante',
      activo: true,
      representanteId: '',
      cedulaFile: '',
      partidaFile: '',
      fotoFile: '',
      faceDescriptor: '',
      faceImageUrl: ''
    })
    onOpen()
  }

  const calculatePagosPendientes = (pagos: any[]) => {
    return pagos.filter(pago => pago.estado === 'Pendiente' || pago.estado === 'Vencido').length
  }

  const calculateMontoPendiente = (pagos: any[]) => {
    return pagos
      .filter(pago => pago.estado === 'Pendiente' || pago.estado === 'Vencido')
      .reduce((total, pago) => total + pago.monto, 0)
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
        <Heading size="lg">Gestión de Representantes</Heading>
        <Button
          leftIcon={<FiPlus />}
          colorScheme="blue"
          onClick={handleNew}
          width={{ base: '100%', md: 'auto' }}
          alignSelf={{ base: 'stretch', md: 'center' }}
        >
          Nuevo Representante
        </Button>
      </Stack>

      {/* Estadísticas rápidas */}
      <Box mb={6}>
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Total Representantes</StatLabel>
                <StatNumber>{representantes?.length || 0}</StatNumber>
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
                <StatLabel>Con Niños Activos</StatLabel>
                <StatNumber>
                  {representantes?.filter(rep => rep.ninos.some(nino => nino.activo)).length || 0}
                </StatNumber>
                <StatHelpText>
                  <StatArrow type="increase" />
                  Activos
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Con Pagos Pendientes</StatLabel>
                <StatNumber color="red.500">
                  {representantes?.filter(rep => calculatePagosPendientes(rep.pagos) > 0).length || 0}
                </StatNumber>
                <StatHelpText>
                  <StatArrow type="decrease" />
                  Deudores
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </SimpleGrid>
      </Box>

      {/* Búsqueda */}
      <Box mb={6} p={4} bg={cardBg} borderRadius="md" borderColor={borderColor} borderWidth="1px">
        <FormControl maxW={{ base: '100%', md: '400px' }} width="full">
          <InputGroup>
            <InputLeftElement>
              <FiSearch />
            </InputLeftElement>
            <Input
              placeholder="Buscar por nombre, cédula o email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </InputGroup>
        </FormControl>
      </Box>

      {(() => {
        const showTable = useBreakpointValue({ base: false, lg: true })

        // Vista de Cards para móvil
        if (!showTable) {
          return (
            <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4}>
              {filteredRepresentantes?.map((representante) => (
                <Card key={representante.id} size="sm">
                  <CardBody>
                    <VStack align="stretch" spacing={3}>
                      {/* Header con nombre y estado de pagos */}
                      <HStack justify="space-between" align="start">
                        <VStack align="start" spacing={1} flex={1}>
                          <Text fontWeight="bold" fontSize="lg">
                            {representante.nombre}
                          </Text>
                          <Text fontSize="xs" color="gray.500">
                            {representante.cedula}
                          </Text>
                          {representante.direccion && (
                            <Text fontSize="xs" color="gray.400">
                              {representante.direccion}
                            </Text>
                          )}
                        </VStack>
                        <Badge 
                          colorScheme={calculatePagosPendientes(representante.pagos) > 0 ? 'red' : 'green'}
                        >
                          {calculatePagosPendientes(representante.pagos) > 0 ? 'Deudor' : 'Al día'}
                        </Badge>
                      </HStack>

                      <Divider />

                      {/* Contacto */}
                      <Box>
                        <Text fontSize="sm" color="gray.600" mb={1}>Contacto:</Text>
                        <VStack align="start" spacing={0.5}>
                          <Text fontSize="sm">{representante.email}</Text>
                          <Text fontSize="sm">{representante.telefono}</Text>
                        </VStack>
                      </Box>

                      <Divider />

                      {/* Rol */}
                      <Box>
                        <Text fontSize="sm" color="gray.600" mb={1}>Rol:</Text>
                        {representante.usuarios && representante.usuarios.length > 0 ? (
                          <VStack align="start" spacing={1}>
                            {representante.usuarios.map((usuario) => (
                              <VStack key={usuario.id} align="start" spacing={1}>
                                <HStack spacing={2}>
                                  <Badge
                                    colorScheme={
                                      usuario.rol === 'representante-delegado' ? 'purple' :
                                      usuario.rol === 'representante' ? 'green' : 'gray'
                                    }
                                  >
                                    {usuario.rol === 'representante-delegado' ? 'Representante Delegado' :
                                     usuario.rol === 'representante' ? 'Representante' : usuario.rol}
                                  </Badge>
                                  {isAdmin && (
                                    <IconButton
                                      aria-label="Cambiar rol"
                                      icon={<FiShield />}
                                      size="xs"
                                      variant="ghost"
                                      colorScheme="blue"
                                      onClick={() => {
                                        setSelectedUsuario(usuario)
                                        setRolData({ rol: usuario.rol, categoria: usuario.categoria || '' })
                                        onRolOpen()
                                      }}
                                    />
                                  )}
                                </HStack>
                                {usuario.rol === 'representante-delegado' && usuario.categoria && (
                                  <Badge colorScheme="blue" fontSize="xs">
                                    Categoría: {usuario.categoria}
                                  </Badge>
                                )}
                              </VStack>
                            ))}
                          </VStack>
                        ) : (
                          <Badge colorScheme="gray">Sin usuario</Badge>
                        )}
                      </Box>

                      <Divider />

                      {/* Niños y Pagos */}
                      <SimpleGrid columns={2} spacing={3}>
                        <Box>
                          <Text fontSize="sm" color="gray.600" mb={1}>Niños:</Text>
                          <Text fontWeight="bold" fontSize="lg">
                            {representante._count.ninos}
                          </Text>
                          {representante.ninos.length > 0 && (
                            <VStack align="start" spacing={0.5} mt={1}>
                              {representante.ninos.slice(0, 2).map((nino, index) => (
                                <Text key={index} fontSize="xs" color="gray.500">
                                  {nino.nombre} {nino.apellido}
                                </Text>
                              ))}
                              {representante.ninos.length > 2 && (
                                <Text fontSize="xs" color="gray.400">
                                  +{representante.ninos.length - 2} más
                                </Text>
                              )}
                            </VStack>
                          )}
                        </Box>
                        <Box>
                          <Text fontSize="sm" color="gray.600" mb={1}>Monto Pendiente:</Text>
                          <Text 
                            fontWeight="bold" 
                            fontSize="lg"
                            color={calculateMontoPendiente(representante.pagos) > 0 ? 'red.500' : 'green.500'}
                          >
                            ${calculateMontoPendiente(representante.pagos).toFixed(2)}
                          </Text>
                          <Text fontSize="xs" color="gray.500" mt={1}>
                            {representante._count.pagos} pagos
                          </Text>
                        </Box>
                      </SimpleGrid>

                      <Divider />

                      {/* Acciones */}
                      <VStack spacing={2} align="stretch">
                        <Stack direction="row" spacing={2}>
                          <Button
                            size="sm"
                            leftIcon={<FiEdit2 />}
                            onClick={() => handleEdit(representante)}
                            flex={1}
                          >
                            Editar
                          </Button>
                          <Button
                            size="sm"
                            leftIcon={<FiTrash2 />}
                            colorScheme="red"
                            onClick={() => handleDelete(representante.id)}
                            isDisabled={representante._count.ninos > 0}
                            flex={1}
                          >
                            Eliminar
                          </Button>
                        </Stack>
                      </VStack>
                    </VStack>
                  </CardBody>
                </Card>
              ))}
            </SimpleGrid>
          )
        }

        // Vista de Tabla para desktop
        return (
          <Box overflowX="auto">
            <Table variant="simple" size="md" minW="1000px">
              <Thead>
                <Tr>
                  <Th>Representante</Th>
                  <Th>Contacto</Th>
                  <Th>Rol</Th>
                  <Th>Niños</Th>
                  <Th>Estado</Th>
                  <Th>Monto Pendiente</Th>
                  <Th>Acciones</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredRepresentantes?.map((representante) => (
                  <Tr key={representante.id}>
                    <Td>
                      <VStack align="start" spacing={0.5}>
                        <Text fontWeight="bold" fontSize="sm">{representante.nombre}</Text>
                        <Text fontSize="xs" color="gray.500">{representante.cedula}</Text>
                        {representante.direccion && (
                          <Text fontSize="xs" color="gray.400">{representante.direccion}</Text>
                        )}
                      </VStack>
                    </Td>
                    <Td>
                      <VStack align="start" spacing={0.5}>
                        <Text fontSize="xs">{representante.email}</Text>
                        <Text fontSize="xs" color="gray.500">{representante.telefono}</Text>
                      </VStack>
                    </Td>
                    <Td>
                      <VStack align="start" spacing={1}>
                        {representante.usuarios && representante.usuarios.length > 0 ? (
                          representante.usuarios.map((usuario) => (
                            <VStack key={usuario.id} align="start" spacing={0.5}>
                              <HStack spacing={1}>
                                <Badge
                                  colorScheme={
                                    usuario.rol === 'representante-delegado' ? 'purple' :
                                    usuario.rol === 'representante' ? 'green' : 'gray'
                                  }
                                  fontSize="xs"
                                >
                                  {usuario.rol === 'representante-delegado' ? 'Delegado' :
                                   usuario.rol === 'representante' ? 'Representante' : usuario.rol}
                                </Badge>
                                {isAdmin && (
                                  <IconButton
                                    aria-label="Cambiar rol"
                                    icon={<FiShield />}
                                    size="xs"
                                    variant="ghost"
                                    colorScheme="blue"
                                    onClick={() => {
                                      setSelectedUsuario(usuario)
                                      setRolData({ rol: usuario.rol, categoria: usuario.categoria || '' })
                                      onRolOpen()
                                    }}
                                  />
                                )}
                              </HStack>
                              {usuario.rol === 'representante-delegado' && usuario.categoria && (
                                <Badge colorScheme="blue" fontSize="xs">
                                  {usuario.categoria}
                                </Badge>
                              )}
                            </VStack>
                          ))
                        ) : (
                          <Badge colorScheme="gray" fontSize="xs">Sin usuario</Badge>
                        )}
                      </VStack>
                    </Td>
                    <Td>
                      <VStack align="start" spacing={0.5}>
                        <Text fontWeight="bold" fontSize="sm">{representante._count.ninos}</Text>
                        {representante.ninos.slice(0, 2).map((nino, index) => (
                          <Text key={index} fontSize="xs" color="gray.500">
                            {nino.nombre} {nino.apellido}
                          </Text>
                        ))}
                        {representante.ninos.length > 2 && (
                          <Text fontSize="xs" color="gray.400">
                            +{representante.ninos.length - 2} más
                          </Text>
                        )}
                      </VStack>
                    </Td>
                    <Td>
                      <VStack align="start" spacing={0.5}>
                        <Badge 
                          colorScheme={calculatePagosPendientes(representante.pagos) > 0 ? 'red' : 'green'}
                          fontSize="xs"
                        >
                          {calculatePagosPendientes(representante.pagos) > 0 ? 'Deudor' : 'Al día'}
                        </Badge>
                        <Text fontSize="xs" color="gray.500">
                          {representante._count.pagos} pagos
                        </Text>
                      </VStack>
                    </Td>
                    <Td>
                      <Text 
                        fontWeight="bold" 
                        fontSize="sm"
                        color={calculateMontoPendiente(representante.pagos) > 0 ? 'red.500' : 'green.500'}
                      >
                        ${calculateMontoPendiente(representante.pagos).toFixed(2)}
                      </Text>
                    </Td>
                    <Td>
                      <HStack spacing={1} flexWrap="wrap">
                        <Button
                          size="xs"
                          leftIcon={<FiEdit2 />}
                          onClick={() => handleEdit(representante)}
                        >
                          Editar
                        </Button>
                        <Button
                          size="xs"
                          leftIcon={<FiTrash2 />}
                          colorScheme="red"
                          onClick={() => handleDelete(representante.id)}
                          isDisabled={representante._count.ninos > 0}
                        >
                          Eliminar
                        </Button>
                      </HStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        )
      })()}

      <Modal isOpen={isOpen} onClose={selectedRepresentante ? onClose : handleFinish} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {selectedRepresentante ? 'Editar Representante' : 'Registrar Representante'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {!selectedRepresentante && (
              <Box mb={4}>
                <HStack spacing={2} mb={2}>
                  <Badge colorScheme={currentStep >= 1 ? 'blue' : 'gray'} px={3} py={1} borderRadius="full">
                    Paso 1: Datos del Representante
                  </Badge>
                  <Badge colorScheme={currentStep >= 2 ? 'green' : 'gray'} px={3} py={1} borderRadius="full">
                    Paso 2: Agregar Niños
                  </Badge>
                </HStack>
                <Progress value={currentStep === 1 ? 50 : 100} colorScheme="blue" size="sm" borderRadius="md" />
              </Box>
            )}

            {currentStep === 1 && (
              <form onSubmit={handleSubmit}>
                <VStack spacing={4}>
                  <FormControl isRequired>
                    <FormLabel>Nombre Completo</FormLabel>
                    <Input
                      value={formData.nombre}
                      onChange={(e) =>
                        setFormData({ ...formData, nombre: e.target.value })
                      }
                    />
                  </FormControl>
                  <FormControl isRequired>
                    <FormLabel>Cédula/RIF</FormLabel>
                    <Input
                      value={formData.cedula}
                      onChange={(e) =>
                        setFormData({ ...formData, cedula: e.target.value })
                      }
                      placeholder="V-12345678 o J-123456789"
                    />
                  </FormControl>
                  <FormControl isRequired>
                    <FormLabel>Email</FormLabel>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                    />
                  </FormControl>
                  <FormControl isRequired>
                    <FormLabel>Teléfono</FormLabel>
                    <Input
                      value={formData.telefono}
                      onChange={(e) =>
                        setFormData({ ...formData, telefono: e.target.value })
                      }
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Dirección</FormLabel>
                    <Input
                      value={formData.direccion}
                      onChange={(e) =>
                        setFormData({ ...formData, direccion: e.target.value })
                      }
                    />
                  </FormControl>
                  <HStack width="full" spacing={3}>
                    {!selectedRepresentante && (
                      <Button
                        variant="ghost"
                        onClick={handleFinish}
                        flex={1}
                      >
                        Cancelar
                      </Button>
                    )}
                    <Button
                      type="submit"
                      colorScheme="blue"
                      flex={1}
                      isLoading={createMutation.isPending || updateMutation.isPending}
                    >
                      {selectedRepresentante ? 'Actualizar' : 'Continuar'}
                    </Button>
                  </HStack>
                </VStack>
              </form>
            )}

            {currentStep === 2 && !selectedRepresentante && (
              <Box>
                <VStack spacing={4} align="stretch">
                  <Box p={3} bg="green.50" borderRadius="md" border="1px solid" borderColor="green.200">
                    <Text fontSize="sm" color="green.700" fontWeight="medium">
                      ✓ Representante creado exitosamente. Ahora puede agregar sus niños.
                    </Text>
                  </Box>

                  <Heading size="md">Agregar Niño</Heading>

                  <form onSubmit={handleAddNino}>
                    <NinoForm
                      formData={ninoFormData}
                      setFormData={setNinoFormData}
                      representantes={representantesList}
                      isEditing={false}
                      isLoading={createNinoMutation.isPending}
                      onFacialRecognition={handleFacialRecognition}
                      hideRepresentanteSelector={true}
                      hideSubmitButton={true}
                    />
                    
                    <VStack width="full" spacing={3} pt={4}>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleGoToGestionNinos}
                        width="full"
                        colorScheme="green"
                        leftIcon={<FiUsers />}
                        size="md"
                      >
                        Ir a Gestión de Niños
                      </Button>
                      <HStack width="full" spacing={3}>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={handleFinish}
                          flex={1}
                        >
                          Finalizar
                        </Button>
                        <Button
                          type="submit"
                          colorScheme="blue"
                          flex={2}
                          isLoading={createNinoMutation.isPending}
                        >
                          Agregar Niño
                        </Button>
                      </HStack>
                    </VStack>
                  </form>
                </VStack>
              </Box>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Modal de Reconocimiento Facial */}
      {isFacialOpen && (
        <FacialRecognition
          onPhotoCaptured={handlePhotoCaptured}
          onClose={onFacialClose}
          title="Reconocimiento Facial del Niño"
          description="Posicione al niño frente a la cámara para capturar su rostro y verificar que no esté duplicado en el sistema"
        />
      )}

      {/* Modal de Comparación Facial */}
      {isComparisonOpen && capturedFaceData && (
        <FaceComparison
          newDescriptor={capturedFaceData.faceDescriptor}
          newImageUrl={capturedFaceData.photoData}
          existingFaces={existingFaces}
          onMatchFound={(match) => {
            onComparisonClose()
            toast({
              title: 'Coincidencia encontrada',
              description: `Se encontró una coincidencia con ${match.name} (${match.cedula})`,
              status: 'warning',
              duration: 5000
            })
          }}
          onNoMatch={handleNoFaceMatch}
          onClose={onComparisonClose}
        />
      )}

      {/* Modal para cambiar rol */}
      <Modal isOpen={isRolOpen} onClose={onRolClose}>
        <ModalOverlay />
        <ModalContent>
          <form onSubmit={handleSubmitRol}>
            <ModalHeader>
              Cambiar Rol de {selectedUsuario?.nombre}
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
              <VStack spacing={4}>
                <FormControl>
                  <FormLabel>Rol</FormLabel>
                  <Select
                    value={rolData.rol}
                    onChange={(e) => setRolData({ ...rolData, rol: e.target.value })}
                  >
                    <option value="representante">Representante</option>
                    <option value="representante-delegado">Representante Delegado</option>
                  </Select>
                  <Text fontSize="xs" color="gray.500" mt={2}>
                    El rol "Representante Delegado" permite al representante acceder a funciones de instructor además de sus funciones como representante.
                  </Text>
                </FormControl>

                {(rolData.rol === 'representante-delegado' || selectedUsuario?.rol === 'representante-delegado') && (
                  <FormControl isRequired>
                    <FormLabel>Categoría</FormLabel>
                    <Select
                      value={rolData.categoria}
                      onChange={(e) => setRolData({ ...rolData, categoria: e.target.value })}
                      placeholder="Seleccionar categoría"
                    >
                      {categorias.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </Select>
                    <Text fontSize="xs" color="gray.500" mt={2}>
                      La categoría determina qué niños podrá ver y gestionar el representante delegado.
                    </Text>
                  </FormControl>
                )}

                <Stack direction={{ base: 'column', md: 'row' }} spacing={4} width="full">
                  <Button type="button" onClick={onRolClose} flex={1} width={{ base: '100%', md: 'auto' }}>
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    colorScheme="blue" 
                    flex={1} 
                    width={{ base: '100%', md: 'auto' }} 
                    isLoading={rolMutation.isPending}
                    isDisabled={
                      (rolData.rol === 'representante-delegado' || selectedUsuario?.rol === 'representante-delegado') && 
                      !rolData.categoria
                    }
                  >
                    Guardar
                  </Button>
                </Stack>
              </VStack>
            </ModalBody>
          </form>
        </ModalContent>
      </Modal>
    </Container>
  )
}
