'use client'

import React, { useState } from 'react'
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Button,
  Card,
  CardBody,
  useColorModeValue,
  IconButton,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Textarea,
  Input,
  Select,
  useToast,
  Divider,
  Flex
} from '@chakra-ui/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FiFileText, FiCheck, FiAlertCircle, FiPlus } from 'react-icons/fi'
import { useAuth } from '@/hooks/useAuth'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface Comunicado {
  id: string
  titulo: string
  contenido: string
  tipo: string
  categoria?: string
  prioridad: string
  archivoUrl?: string
  requiereConfirmacion: boolean
  fechaVencimiento?: string
  createdAt: string
  creador: {
    id: string
    nombre: string
    rol: string
  }
  lecturas: Array<{
    leido: boolean
    fechaLectura?: string
  }>
  _count: {
    lecturas: number
  }
}

export default function ComunicadosComponent() {
  const { usuario, isAdmin } = useAuth()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const toast = useToast()
  const queryClient = useQueryClient()
  const bg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const cardBg = useColorModeValue('white', 'gray.700')

  const [formData, setFormData] = useState({
    titulo: '',
    contenido: '',
    tipo: 'General',
    categoria: '',
    prioridad: 'normal',
    archivoUrl: '',
    requiereConfirmacion: true,
    fechaVencimiento: ''
  })

  const { data: comunicados, isLoading } = useQuery<Comunicado[]>({
    queryKey: ['comunicados'],
    queryFn: async () => {
      const res = await fetch('/api/comunicacion/comunicados?activo=true')
      if (!res.ok) throw new Error('Error al cargar comunicados')
      return res.json()
    },
    refetchInterval: 10000
  })

  const leerMutation = useMutation({
    mutationFn: async (comunicadoId: string) => {
      const res = await fetch(`/api/comunicacion/comunicados/${comunicadoId}/leer`, {
        method: 'POST'
      })
      if (!res.ok) throw new Error('Error al marcar como leído')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comunicados'] })
      toast({
        title: 'Comunicado marcado como leído',
        status: 'success',
        duration: 3000
      })
    }
  })

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/comunicacion/comunicados', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!res.ok) throw new Error('Error al crear comunicado')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comunicados'] })
      onClose()
      setFormData({
        titulo: '',
        contenido: '',
        tipo: 'General',
        categoria: '',
        prioridad: 'normal',
        archivoUrl: '',
        requiereConfirmacion: true,
        fechaVencimiento: ''
      })
      toast({
        title: 'Comunicado creado',
        status: 'success',
        duration: 3000
      })
    }
  })

  const handleLeer = (comunicadoId: string) => {
    leerMutation.mutate(comunicadoId)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate(formData)
  }

  const getPrioridadColor = (prioridad: string) => {
    switch (prioridad) {
      case 'urgente': return 'red'
      case 'alta': return 'orange'
      default: return 'blue'
    }
  }

  const categorias = ['Sub-6', 'Sub-8', 'Sub-10', 'Sub-12', 'Sub-14', 'Sub-16', 'Sub-18']

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={4}>
        <Text fontSize="lg" fontWeight="bold">
          Comunicados Oficiales
        </Text>
        {isAdmin && (
          <Button leftIcon={<FiPlus />} colorScheme="blue" size="sm" onClick={onOpen}>
            Nuevo Comunicado
          </Button>
        )}
      </Flex>

      {isLoading ? (
        <Text color="gray.500">Cargando comunicados...</Text>
      ) : comunicados && comunicados.length > 0 ? (
        <VStack spacing={4} align="stretch">
          {comunicados.map((comunicado) => {
            const leido = comunicado.lecturas[0]?.leido || false
            return (
              <Card key={comunicado.id} bg={cardBg} borderWidth="1px" borderColor={borderColor}>
                <CardBody>
                  <VStack align="stretch" spacing={3}>
                    <HStack justify="space-between">
                      <HStack spacing={2}>
                        <Badge colorScheme={getPrioridadColor(comunicado.prioridad)}>
                          {comunicado.prioridad}
                        </Badge>
                        {comunicado.categoria && (
                          <Badge colorScheme="purple">{comunicado.categoria}</Badge>
                        )}
                        <Badge>{comunicado.tipo}</Badge>
                      </HStack>
                      {!leido && (
                        <Badge colorScheme="red">No leído</Badge>
                      )}
                    </HStack>
                    <Text fontWeight="bold" fontSize="lg">
                      {comunicado.titulo}
                    </Text>
                    <Text color="gray.600" whiteSpace="pre-wrap">
                      {comunicado.contenido}
                    </Text>
                    <Divider />
                    <HStack justify="space-between" fontSize="sm" color="gray.500">
                      <Text>
                        Por {comunicado.creador.nombre} • {format(new Date(comunicado.createdAt), 'dd/MM/yyyy HH:mm', { locale: es })}
                      </Text>
                      {comunicado.requiereConfirmacion && !leido && (
                        <Button
                          leftIcon={<FiCheck />}
                          size="sm"
                          colorScheme="green"
                          onClick={() => handleLeer(comunicado.id)}
                          isLoading={leerMutation.isPending}
                        >
                          Marcar como leído
                        </Button>
                      )}
                      {leido && (
                        <HStack>
                          <FiCheck color="green" />
                          <Text color="green.500">Leído</Text>
                        </HStack>
                      )}
                    </HStack>
                  </VStack>
                </CardBody>
              </Card>
            )
          })}
        </VStack>
      ) : (
        <Box textAlign="center" py={8}>
          <FiFileText size={48} color="gray" style={{ margin: '0 auto 16px' }} />
          <Text color="gray.500">No hay comunicados disponibles</Text>
        </Box>
      )}

      {/* Modal para crear comunicado */}
      {isAdmin && (
        <Modal isOpen={isOpen} onClose={onClose} size="xl">
          <ModalOverlay />
          <ModalContent>
            <form onSubmit={handleSubmit}>
              <ModalHeader>Nuevo Comunicado</ModalHeader>
              <ModalCloseButton />
              <ModalBody pb={6}>
                <VStack spacing={4}>
                  <FormControl isRequired>
                    <FormLabel>Título</FormLabel>
                    <Input
                      value={formData.titulo}
                      onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                      placeholder="Título del comunicado"
                    />
                  </FormControl>
                  <FormControl isRequired>
                    <FormLabel>Contenido</FormLabel>
                    <Textarea
                      value={formData.contenido}
                      onChange={(e) => setFormData({ ...formData, contenido: e.target.value })}
                      placeholder="Contenido del comunicado"
                      rows={6}
                    />
                  </FormControl>
                  <HStack width="full" spacing={4}>
                    <FormControl>
                      <FormLabel>Tipo</FormLabel>
                      <Select
                        value={formData.tipo}
                        onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                      >
                        <option value="General">General</option>
                        <option value="Categoría">Categoría</option>
                        <option value="Grupo">Grupo</option>
                      </Select>
                    </FormControl>
                    <FormControl>
                      <FormLabel>Prioridad</FormLabel>
                      <Select
                        value={formData.prioridad}
                        onChange={(e) => setFormData({ ...formData, prioridad: e.target.value })}
                      >
                        <option value="normal">Normal</option>
                        <option value="alta">Alta</option>
                        <option value="urgente">Urgente</option>
                      </Select>
                    </FormControl>
                  </HStack>
                  {formData.tipo === 'Categoría' && (
                    <FormControl>
                      <FormLabel>Categoría</FormLabel>
                      <Select
                        value={formData.categoria}
                        onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                        placeholder="Seleccionar categoría"
                      >
                        {categorias.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                  <HStack width="full" spacing={4}>
                    <Button onClick={onClose} flex={1}>
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      colorScheme="blue"
                      flex={1}
                      isLoading={createMutation.isPending}
                    >
                      Crear
                    </Button>
                  </HStack>
                </VStack>
              </ModalBody>
            </form>
          </ModalContent>
        </Modal>
      )}
    </Box>
  )
}
