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
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Flex
} from '@chakra-ui/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FiAlertTriangle, FiCheck, FiPlus } from 'react-icons/fi'
import { useAuth } from '@/hooks/useAuth'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface Alerta {
  id: string
  titulo: string
  mensaje: string
  tipo: string
  prioridad: string
  categoria?: string
  grupo?: string
  activa: boolean
  fechaInicio: string
  fechaFin?: string
  createdAt: string
  creador: {
    id: string
    nombre: string
    rol: string
  }
  confirmaciones: Array<{
    confirmado: boolean
    fechaConfirmacion?: string
  }>
  _count: {
    confirmaciones: number
  }
}

export default function AlertasComponent() {
  const { usuario, isAdmin } = useAuth()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const toast = useToast()
  const queryClient = useQueryClient()
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const cardBg = useColorModeValue('white', 'gray.700')

  const [formData, setFormData] = useState({
    titulo: '',
    mensaje: '',
    tipo: 'emergencia',
    prioridad: 'maxima',
    categoria: '',
    grupo: '',
    fechaFin: ''
  })

  const { data: alertas, isLoading } = useQuery<Alerta[]>({
    queryKey: ['alertas'],
    queryFn: async () => {
      const res = await fetch('/api/comunicacion/alertas?activa=true')
      if (!res.ok) throw new Error('Error al cargar alertas')
      return res.json()
    },
    refetchInterval: 5000
  })

  const confirmarMutation = useMutation({
    mutationFn: async (alertaId: string) => {
      const res = await fetch(`/api/comunicacion/alertas/${alertaId}/confirmar`, {
        method: 'POST'
      })
      if (!res.ok) throw new Error('Error al confirmar alerta')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alertas'] })
      toast({
        title: 'Alerta confirmada',
        status: 'success',
        duration: 3000
      })
    }
  })

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/comunicacion/alertas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!res.ok) throw new Error('Error al crear alerta')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alertas'] })
      onClose()
      setFormData({
        titulo: '',
        mensaje: '',
        tipo: 'emergencia',
        prioridad: 'maxima',
        categoria: '',
        grupo: '',
        fechaFin: ''
      })
      toast({
        title: 'Alerta creada',
        status: 'success',
        duration: 3000
      })
    }
  })

  const handleConfirmar = (alertaId: string) => {
    confirmarMutation.mutate(alertaId)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate(formData)
  }

  const getPrioridadColor = (prioridad: string) => {
    switch (prioridad) {
      case 'maxima': return 'red'
      case 'alta': return 'orange'
      default: return 'yellow'
    }
  }

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'emergencia': return 'red'
      case 'seguridad': return 'orange'
      case 'clima': return 'blue'
      default: return 'gray'
    }
  }

  const categorias = ['Sub-6', 'Sub-8', 'Sub-10', 'Sub-12', 'Sub-14', 'Sub-16', 'Sub-18']

  // Filtrar alertas activas y no vencidas
  const alertasActivas = alertas?.filter(alerta => {
    if (!alerta.activa) return false
    if (alerta.fechaFin) {
      return new Date(alerta.fechaFin) >= new Date()
    }
    return true
  }) || []

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={4}>
        <Text fontSize="lg" fontWeight="bold">
          Alertas de Emergencia
        </Text>
        {isAdmin && (
          <Button leftIcon={<FiPlus />} colorScheme="red" size="sm" onClick={onOpen}>
            Nueva Alerta
          </Button>
        )}
      </Flex>

      {isLoading ? (
        <Text color="gray.500">Cargando alertas...</Text>
      ) : alertasActivas.length > 0 ? (
        <VStack spacing={4} align="stretch">
          {alertasActivas.map((alerta) => {
            const confirmada = alerta.confirmaciones[0]?.confirmado || false
            return (
              <Alert
                key={alerta.id}
                status={alerta.prioridad === 'maxima' ? 'error' : 'warning'}
                borderRadius="md"
                flexDirection="column"
                alignItems="stretch"
              >
                <HStack justify="space-between" mb={2}>
                  <HStack>
                    <AlertIcon />
                    <AlertTitle fontSize="lg">{alerta.titulo}</AlertTitle>
                  </HStack>
                  <HStack spacing={2}>
                    <Badge colorScheme={getPrioridadColor(alerta.prioridad)}>
                      {alerta.prioridad}
                    </Badge>
                    <Badge colorScheme={getTipoColor(alerta.tipo)}>
                      {alerta.tipo}
                    </Badge>
                    {alerta.categoria && (
                      <Badge colorScheme="purple">{alerta.categoria}</Badge>
                    )}
                  </HStack>
                </HStack>
                <AlertDescription>
                  <Text mb={3} whiteSpace="pre-wrap">
                    {alerta.mensaje}
                  </Text>
                  <HStack justify="space-between" fontSize="sm" color="gray.600">
                    <Text>
                      Por {alerta.creador.nombre} • {format(new Date(alerta.createdAt), 'dd/MM/yyyy HH:mm', { locale: es })}
                    </Text>
                    {!confirmada && (
                      <Button
                        leftIcon={<FiCheck />}
                        size="sm"
                        colorScheme="green"
                        onClick={() => handleConfirmar(alerta.id)}
                        isLoading={confirmarMutation.isPending}
                      >
                        Confirmar recepción
                      </Button>
                    )}
                    {confirmada && (
                      <HStack>
                        <FiCheck color="green" />
                        <Text color="green.500">Confirmada</Text>
                      </HStack>
                    )}
                  </HStack>
                </AlertDescription>
              </Alert>
            )
          })}
        </VStack>
      ) : (
        <Box textAlign="center" py={8}>
          <FiAlertTriangle size={48} color="gray" style={{ margin: '0 auto 16px' }} />
          <Text color="gray.500">No hay alertas activas</Text>
        </Box>
      )}

      {/* Modal para crear alerta */}
      {isAdmin && (
        <Modal isOpen={isOpen} onClose={onClose} size="xl">
          <ModalOverlay />
          <ModalContent>
            <form onSubmit={handleSubmit}>
              <ModalHeader>Nueva Alerta de Emergencia</ModalHeader>
              <ModalCloseButton />
              <ModalBody pb={6}>
                <VStack spacing={4}>
                  <FormControl isRequired>
                    <FormLabel>Título</FormLabel>
                    <Input
                      value={formData.titulo}
                      onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                      placeholder="Título de la alerta"
                    />
                  </FormControl>
                  <FormControl isRequired>
                    <FormLabel>Mensaje</FormLabel>
                    <Textarea
                      value={formData.mensaje}
                      onChange={(e) => setFormData({ ...formData, mensaje: e.target.value })}
                      placeholder="Mensaje de la alerta"
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
                        <option value="emergencia">Emergencia</option>
                        <option value="seguridad">Seguridad</option>
                        <option value="clima">Clima</option>
                        <option value="otro">Otro</option>
                      </Select>
                    </FormControl>
                    <FormControl>
                      <FormLabel>Prioridad</FormLabel>
                      <Select
                        value={formData.prioridad}
                        onChange={(e) => setFormData({ ...formData, prioridad: e.target.value })}
                      >
                        <option value="maxima">Máxima</option>
                        <option value="alta">Alta</option>
                        <option value="media">Media</option>
                      </Select>
                    </FormControl>
                  </HStack>
                  <FormControl>
                    <FormLabel>Categoría (opcional)</FormLabel>
                    <Select
                      value={formData.categoria}
                      onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                      placeholder="Todas las categorías"
                    >
                      {categorias.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </Select>
                  </FormControl>
                  <HStack width="full" spacing={4}>
                    <Button onClick={onClose} flex={1}>
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      colorScheme="red"
                      flex={1}
                      isLoading={createMutation.isPending}
                    >
                      Crear Alerta
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
