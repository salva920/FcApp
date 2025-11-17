'use client'

import React from 'react'
import {
  Box,
  Button,
  Container,
  Heading,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  VStack,
  useToast,
  Text,
  Flex,
  Stack
} from '@chakra-ui/react'
import { useQuery } from '@tanstack/react-query'
import { FiPlus } from 'react-icons/fi'
import dynamic from 'next/dynamic'
import { NinoFilters } from '@/components/ninos/NinoFilters'
import { NinoTable } from '@/components/ninos/NinoTable'
import { NinoForm } from '@/components/ninos/NinoForm'
import { NinoViewModal } from '@/components/ninos/NinoViewModal'
import { DesarrolloAtletaModal } from '@/components/ninos/DesarrolloAtletaModal'
import { useNinoOperations } from '@/hooks/useNinoOperations'
import { useAgeCalculator } from '@/hooks/useAgeCalculator'
import { useAuth } from '@/hooks/useAuth'
import { Buffer } from 'buffer'

// Lazy load de componentes pesados
const FacialRecognition = dynamic(() => import('@/components/FacialRecognition'), {
  ssr: false,
  loading: () => <Box p={4}>Cargando cámara...</Box>
})

const FaceComparison = dynamic(() => import('@/components/FaceComparison'), {
  ssr: false,
  loading: () => <Box p={4}>Cargando comparador...</Box>
})

interface Nino {
  id: string
  nombre: string
  apellido: string
  fechaNacimiento: string
  cedula?: string
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

export default React.memo(function NinosPage() {
  const { usuario, isAdmin, isRepresentante, isProfesor } = useAuth()
  const categoriaAsignada = usuario?.categoria
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { isOpen: isViewOpen, onOpen: onViewOpen, onClose: onViewClose } = useDisclosure()
  const { isOpen: isFacialOpen, onOpen: onFacialOpen, onClose: onFacialClose } = useDisclosure()
  const { isOpen: isComparisonOpen, onOpen: onComparisonOpen, onClose: onComparisonClose } = useDisclosure()
  const { isOpen: isDesarrolloOpen, onOpen: onDesarrolloOpen, onClose: onDesarrolloClose } = useDisclosure()
  const [selectedNino, setSelectedNino] = React.useState<Nino | null>(null)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [categoriaFilter, setCategoriaFilter] = React.useState('')
  const [representantes, setRepresentantes] = React.useState<any[]>([])
  const toast = useToast()

  // Hooks personalizados
  const {
    formData,
    setFormData,
    createMutation,
    updateMutation,
    deleteMutation,
    handleSubmit,
    resetForm
  } = useNinoOperations()

  const { resetAgeCalculator } = useAgeCalculator()

  const { data: ninos, isLoading } = useQuery<Nino[]>({
    queryKey: ['ninos'],
    queryFn: async () => {
      const res = await fetch('/api/ninos')
      if (!res.ok) throw new Error('Error al cargar niños')
      return res.json()
    },
    staleTime: 1000 * 60 * 5 // Cache por 5 minutos
  })

  const { data: representantesData } = useQuery({
    queryKey: ['representantes'],
    queryFn: async () => {
      const res = await fetch('/api/representantes')
      if (!res.ok) throw new Error('Error al cargar representantes')
      return res.json()
    },
    staleTime: 1000 * 60 * 10 // Cache por 10 minutos
  })

  React.useEffect(() => {
    if (representantesData) {
      setRepresentantes(representantesData)
    }
  }, [representantesData])

  const filteredNinos = React.useMemo(() => {
    if (!ninos) return []
    
    let filtered = ninos
    
    // Si es representante normal (no delegado), filtrar solo sus niños
    // Si es representante-delegado, ver todos los niños de su categoría (ya filtrado por la API)
    if (isRepresentante && usuario?.representanteId && usuario?.rol !== 'representante-delegado') {
      filtered = filtered.filter(nino => nino.representante.id === usuario.representanteId)
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(nino => 
        nino.nombre.toLowerCase().includes(query) || 
        nino.apellido.toLowerCase().includes(query) ||
        (nino.cedula ? nino.cedula.toLowerCase().includes(query) : false) ||
        nino.representante.nombre.toLowerCase().includes(query)
      )
    }
    
    if (categoriaFilter) {
      filtered = filtered.filter(nino => nino.categoria === categoriaFilter)
    }
    
    return filtered
  }, [ninos, searchQuery, categoriaFilter, isRepresentante, usuario])

  // Funciones simplificadas usando hooks personalizados
  const handleFormSubmit = (e: React.FormEvent) => {
    handleSubmit(e, selectedNino)
      onClose()
  }

  const handleEdit = async (nino: Nino) => {
    setSelectedNino(nino)
    const fechaNacimiento = nino.fechaNacimiento.split('T')[0]
    setFormData({
      nombre: nino.nombre,
      apellido: nino.apellido,
      fechaNacimiento: fechaNacimiento,
      cedula: nino.cedula,
      alergias: nino.alergias || '',
      emergencia: nino.emergencia || '',
      categoria: nino.categoria,
      nivel: nino.nivel,
      activo: nino.activo,
      representanteId: nino.representante.id,
      cedulaFile: nino.cedulaFile || '',
      partidaFile: nino.partidaFile || '',
      fotoFile: nino.fotoFile || '',
      faceDescriptor: nino.faceDescriptor || '',
      faceImageUrl: nino.faceImageUrl || '',
      estatura: '',
      peso: '',
      talla: '',
      tallaCalzado: ''
    })

    // Cargar medidas desde la última evaluación (si existe)
    try {
      const res = await fetch(`/api/evaluaciones?ninoId=${nino.id}`)
      if (res.ok) {
        const evaluaciones = await res.json()
        if (Array.isArray(evaluaciones) && evaluaciones.length > 0) {
          const ultima = evaluaciones[0]
          setFormData(prev => ({
            ...prev,
            estatura: ultima?.estatura != null ? String(ultima.estatura) : prev.estatura,
            peso: ultima?.peso != null ? String(ultima.peso) : prev.peso,
            talla: ultima?.talla || prev.talla,
            tallaCalzado: ultima?.tallaCalzado || prev.tallaCalzado
          }))
        }
      }
    } catch (error) {
      console.error('No se pudieron cargar medidas de evaluación:', error)
    }
    onOpen()
  }

  const handleDelete = (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar este niño?')) {
      deleteMutation.mutate(id)
    }
  }

  const handleNew = () => {
    setSelectedNino(null)
    resetForm()
    resetAgeCalculator()
    
    // Si es representante, preseleccionar su ID
    if (isRepresentante && usuario?.representanteId) {
      setFormData(prev => ({
        ...prev,
        representanteId: usuario.representanteId || ''
      }))
    }
    
    onOpen()
  }

  const handleView = (nino: Nino) => {
    setSelectedNino(nino)
    onViewOpen()
  }

  const handleDesarrollo = (nino: Nino) => {
    setSelectedNino(nino)
    onDesarrolloOpen()
  }

  // Estados para reconocimiento facial
  const [capturedFaceData, setCapturedFaceData] = React.useState<{
    photoData: string
    faceDescriptor: Float32Array
  } | null>(null)
  const [existingFaces, setExistingFaces] = React.useState<any[]>([])

  // Función para abrir reconocimiento facial
  const handleFacialRecognition = () => {
    onFacialOpen()
  }

  // Función para manejar foto capturada
  const handlePhotoCaptured = async (photoData: string, faceDescriptor?: Float32Array) => {
    console.log('Foto capturada:', photoData ? 'Sí' : 'No')
    console.log('Descriptor facial:', faceDescriptor ? 'Sí' : 'No')
    
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
    console.log('Datos de cara capturados guardados')
    
    // Pequeño delay para asegurar que el estado se actualice
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // Obtener rostros existentes para comparación
    try {
      const response = await fetch('/api/facial-recognition')
      const faces = await response.json()
      setExistingFaces(faces)
      
      if (faces.length > 0) {
        onFacialClose()
        onComparisonOpen()
      } else {
        // No hay rostros para comparar, continuar con el registro
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

  // Función para manejar coincidencia encontrada
  const handleFaceMatch = async (match: any) => {
    onComparisonClose()
    toast({
      title: 'Coincidencia encontrada',
      description: `Se encontró una coincidencia con ${match.name} (${match.cedula})`,
      status: 'warning',
      duration: 5000
    })
    
    // Aquí podrías mostrar un modal de confirmación o tomar alguna acción
    // Por ahora, continuamos con el registro
    await handleNoFaceMatch()
  }

  // Función para manejar cuando no hay coincidencia
  const handleNoFaceMatch = async (faceData?: { photoData: string; faceDescriptor: Float32Array }) => {
    console.log('handleNoFaceMatch ejecutado')
    const dataToUse = faceData || capturedFaceData
    console.log('dataToUse:', dataToUse ? 'Sí' : 'No')
    
    if (dataToUse) {
      try {
        // Convertir la imagen capturada a un archivo y subirla
        const response = await fetch(dataToUse.photoData)
        const blob = await response.blob()
        const file = new File([blob], 'facial-photo.jpg', { type: 'image/jpeg' })
        
        // Crear FormData para subir el archivo
        const formData = new FormData()
        formData.append('file', file)
        
        // Subir archivo al servidor
        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        })
        
        if (uploadResponse.ok) {
          const uploadResult = await uploadResponse.json()
          
          // Actualizar el formulario con la URL del archivo subido y el descriptor facial
          const descriptorBase64 = Buffer.from(JSON.stringify(Array.from(dataToUse.faceDescriptor))).toString('base64')
          
          setFormData(prev => ({
            ...prev,
            fotoFile: uploadResult.fileUrl,
            faceImageUrl: uploadResult.fileUrl,
            faceDescriptor: descriptorBase64
          }))
          
          console.log('Formulario actualizado con datos faciales:')
          console.log('faceImageUrl:', uploadResult.fileUrl)
          console.log('faceDescriptor:', descriptorBase64 ? 'Guardado' : 'Vacío')
          
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
    
    toast({
      title: 'Reconocimiento completado',
      description: 'No se encontraron coincidencias. Puede continuar con el registro.',
      status: 'success',
      duration: 3000
    })
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

  const getNivelColor = (nivel: string) => {
    const colors: { [key: string]: string } = {
      'Principiante': 'green',
      'Intermedio': 'yellow',
      'Avanzado': 'red'
    }
    return colors[nivel] || 'gray'
  }

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
          <Heading size="lg">Gestión de Niños</Heading>
          <Button
            leftIcon={<FiPlus />}
            colorScheme="blue"
            onClick={handleNew}
            isDisabled
            width={{ base: '100%', md: 'auto' }}
          >
            Registrar Niño
          </Button>
        </Stack>
        <Box textAlign="center" py={20}>
          <Text fontSize="lg" color="gray.600">Cargando niños...</Text>
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
        <Box>
          <Heading size="lg">
            {usuario?.rol === 'representante-delegado' 
              ? 'Gestión de Niños' 
              : isRepresentante 
                ? 'Mis Niños' 
                : 'Gestión de Niños'}
          </Heading>
          {isRepresentante && usuario?.rol !== 'representante-delegado' && (
            <Text color="gray.600" fontSize="sm" mt={1}>
              Administra la información de tus niños registrados
            </Text>
          )}
          {usuario?.rol === 'representante-delegado' && (
            <Text color="gray.600" fontSize="sm" mt={1}>
              Gestiona todos los niños de tu categoría asignada
            </Text>
          )}
          {usuario?.rol === 'profesor' && categoriaAsignada && (
            <Text color="blue.600" fontSize="sm" mt={1} fontWeight="medium">
              📋 Mostrando solo niños de la categoría: <strong>{categoriaAsignada}</strong>
            </Text>
          )}
          {usuario?.rol === 'representante-delegado' && categoriaAsignada && (
            <Text color="purple.600" fontSize="sm" mt={1} fontWeight="medium">
              👥 Mostrando todos los niños de la categoría: <strong>{categoriaAsignada}</strong>
            </Text>
          )}
        </Box>
        <Button
          leftIcon={<FiPlus />}
          colorScheme="blue"
          onClick={handleNew}
          width={{ base: '100%', md: 'auto' }}
          alignSelf={{ base: 'stretch', md: 'center' }}
        >
          {isRepresentante ? 'Agregar Niño' : 'Registrar Niño'}
        </Button>
      </Stack>

      {/* Filtros */}
      <NinoFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        categoriaFilter={categoriaFilter}
        setCategoriaFilter={setCategoriaFilter}
      />

      {/* Tabla de niños */}
      <NinoTable
        ninos={filteredNinos}
        onEdit={handleEdit}
        onDelete={isAdmin ? handleDelete : undefined}
        onView={handleView}
        onDesarrollo={handleDesarrollo} // Ahora todos pueden ver el desarrollo
        getCategoriaColor={getCategoriaColor}
        getNivelColor={getNivelColor}
      />

      <Modal isOpen={isOpen} onClose={onClose} size="4xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {selectedNino ? 'Editar Niño' : 'Registrar Nuevo Niño'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <form onSubmit={handleFormSubmit}>
              <NinoForm
                formData={formData}
                setFormData={setFormData}
                representantes={representantes}
                isEditing={!!selectedNino}
                isLoading={createMutation.isPending || updateMutation.isPending}
                onFacialRecognition={handleFacialRecognition}
                hideRepresentanteSelector={isRepresentante}
              />
            </form>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Modal de vista de documentos */}
      <NinoViewModal
        isOpen={isViewOpen}
        onClose={onViewClose}
        selectedNino={selectedNino}
        getCategoriaColor={getCategoriaColor}
      />

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
          onMatchFound={handleFaceMatch}
          onNoMatch={handleNoFaceMatch}
          onClose={onComparisonClose}
        />
      )}

      {/* Modal de Desarrollo del Atleta */}
      {selectedNino && (
        <DesarrolloAtletaModal
          isOpen={isDesarrolloOpen}
          onClose={onDesarrolloClose}
          nino={{
            id: selectedNino.id,
            nombre: selectedNino.nombre,
            apellido: selectedNino.apellido,
            categoria: selectedNino.categoria,
            nivel: selectedNino.nivel
          }}
          readOnly={isRepresentante} // Representantes solo pueden ver (no editar)
        />
      )}
    </Container>
  )
})
