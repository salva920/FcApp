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
  Divider,
  Flex,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  IconButton,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  SimpleGrid
} from '@chakra-ui/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FiBell, FiPlus, FiSend, FiCheck, FiX, FiUsers } from 'react-icons/fi'
import { useAuth } from '@/hooks/useAuth'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface NotificacionPush {
  id: string
  titulo: string
  mensaje: string
  segmentoRol?: string
  segmentoCategoria?: string
  segmentoGrupo?: string
  prioridad: string
  enviada: boolean
  fechaEnvio?: string
  createdAt: string
  representante?: {
    id: string
    nombre: string
    email: string
  }
}

export default function NotificacionesPushComponent() {
  const { usuario, isAdmin } = useAuth()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const toast = useToast()
  const queryClient = useQueryClient()
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const cardBg = useColorModeValue('white', 'gray.700')

  const [formData, setFormData] = useState({
    titulo: '',
    mensaje: '',
    segmentoRol: 'todos',
    segmentoCategoria: '',
    segmentoGrupo: '',
    prioridad: 'normal',
    enviarAhora: false
  })

  const { data: notificaciones, isLoading } = useQuery<NotificacionPush[]>({
    queryKey: ['notificaciones-push'],
    queryFn: async () => {
      const res = await fetch('/api/comunicacion/notificaciones-push')
      if (!res.ok) throw new Error('Error al cargar notificaciones')
      return res.json()
    }
  })

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/comunicacion/notificaciones-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Error al crear notificación')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificaciones-push'] })
      onClose()
      setFormData({
        titulo: '',
        mensaje: '',
        segmentoRol: 'todos',
        segmentoCategoria: '',
        segmentoGrupo: '',
        prioridad: 'normal',
        enviarAhora: false
      })
      toast({
        title: 'Notificación creada',
        status: 'success',
        duration: 3000
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 3000
      })
    }
  })

  const sendMutation = useMutation({
    mutationFn: async (notificacionId: string) => {
      const res = await fetch('/api/comunicacion/notificaciones-push', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificacionId })
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Error al enviar notificación')
      }
      return res.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['notificaciones-push'] })
      toast({
        title: 'Notificación enviada',
        description: `${data.exitosos} de ${data.total} notificaciones enviadas exitosamente`,
        status: 'success',
        duration: 5000
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 3000
      })
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate(formData)
  }

  const handleSend = (notificacionId: string) => {
    if (window.confirm('¿Estás seguro de enviar esta notificación ahora?')) {
      sendMutation.mutate(notificacionId)
    }
  }

  const getPrioridadColor = (prioridad: string) => {
    switch (prioridad) {
      case 'urgente': return 'red'
      case 'alta': return 'orange'
      default: return 'blue'
    }
  }

  const getSegmentoRolName = (rol?: string) => {
    switch (rol) {
      case 'admin': return 'Administradores'
      case 'profesor': return 'Profesores'
      case 'representante': return 'Representantes'
      case 'representante-delegado': return 'Representantes Delegados'
      case 'todos': return 'Todos los usuarios'
      default: return rol || 'Todos'
    }
  }

  const categorias = ['Sub-6', 'Sub-8', 'Sub-10', 'Sub-12', 'Sub-14', 'Sub-16', 'Sub-18']

  // Estadísticas
  const totalNotificaciones = notificaciones?.length || 0
  const enviadas = notificaciones?.filter(n => n.enviada).length || 0
  const pendientes = notificaciones?.filter(n => !n.enviada).length || 0

  if (!isAdmin) {
    return (
      <Box textAlign="center" py={8}>
        <Text color="gray.500">Solo administradores pueden acceder a este panel</Text>
      </Box>
    )
  }

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={6}>
        <Text fontSize="lg" fontWeight="bold">
          Panel de Notificaciones Push
        </Text>
        <Button leftIcon={<FiPlus />} colorScheme="blue" size="sm" onClick={onOpen}>
          Nueva Notificación
        </Button>
      </Flex>

      {/* Estadísticas */}
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={6}>
        <Stat bg={cardBg} p={4} borderRadius="md" borderWidth="1px" borderColor={borderColor}>
          <StatLabel>Total</StatLabel>
          <StatNumber>{totalNotificaciones}</StatNumber>
          <StatHelpText>Notificaciones creadas</StatHelpText>
        </Stat>
        <Stat bg={cardBg} p={4} borderRadius="md" borderWidth="1px" borderColor={borderColor}>
          <StatLabel>Enviadas</StatLabel>
          <StatNumber color="green.500">{enviadas}</StatNumber>
          <StatHelpText>Notificaciones enviadas</StatHelpText>
        </Stat>
        <Stat bg={cardBg} p={4} borderRadius="md" borderWidth="1px" borderColor={borderColor}>
          <StatLabel>Pendientes</StatLabel>
          <StatNumber color="orange.500">{pendientes}</StatNumber>
          <StatHelpText>Por enviar</StatHelpText>
        </Stat>
      </SimpleGrid>

      {/* Lista de notificaciones */}
      {isLoading ? (
        <Text color="gray.500">Cargando notificaciones...</Text>
      ) : notificaciones && notificaciones.length > 0 ? (
        <Box overflowX="auto">
          <Table variant="simple" size="md" minW="800px">
            <Thead>
              <Tr>
                <Th>Título</Th>
                <Th>Segmento</Th>
                <Th>Prioridad</Th>
                <Th>Estado</Th>
                <Th>Fecha</Th>
                <Th>Acciones</Th>
              </Tr>
            </Thead>
            <Tbody>
              {notificaciones.map((notif) => (
                <Tr key={notif.id}>
                  <Td>
                    <VStack align="start" spacing={1}>
                      <Text fontWeight="bold">{notif.titulo}</Text>
                      <Text fontSize="xs" color="gray.500" noOfLines={2}>
                        {notif.mensaje}
                      </Text>
                    </VStack>
                  </Td>
                  <Td>
                    <VStack align="start" spacing={1}>
                      <Badge colorScheme="purple">
                        {getSegmentoRolName(notif.segmentoRol)}
                      </Badge>
                      {notif.segmentoCategoria && (
                        <Badge colorScheme="blue" fontSize="xs">
                          {notif.segmentoCategoria}
                        </Badge>
                      )}
                    </VStack>
                  </Td>
                  <Td>
                    <Badge colorScheme={getPrioridadColor(notif.prioridad)}>
                      {notif.prioridad}
                    </Badge>
                  </Td>
                  <Td>
                    {notif.enviada ? (
                      <HStack>
                        <FiCheck color="green" />
                        <Text color="green.500" fontSize="sm">Enviada</Text>
                      </HStack>
                    ) : (
                      <HStack>
                        <FiX color="orange" />
                        <Text color="orange.500" fontSize="sm">Pendiente</Text>
                      </HStack>
                    )}
                  </Td>
                  <Td>
                    <Text fontSize="sm" color="gray.500">
                      {notif.fechaEnvio
                        ? format(new Date(notif.fechaEnvio), 'dd/MM/yyyy HH:mm', { locale: es })
                        : format(new Date(notif.createdAt), 'dd/MM/yyyy', { locale: es })}
                    </Text>
                  </Td>
                  <Td>
                    {!notif.enviada && (
                      <IconButton
                        aria-label="Enviar notificación"
                        icon={<FiSend />}
                        size="sm"
                        colorScheme="green"
                        onClick={() => handleSend(notif.id)}
                        isLoading={sendMutation.isPending}
                      />
                    )}
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      ) : (
        <Box textAlign="center" py={8}>
          <FiBell size={48} color="gray" style={{ margin: '0 auto 16px' }} />
          <Text color="gray.500">No hay notificaciones push creadas</Text>
        </Box>
      )}

      {/* Modal para crear notificación */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <form onSubmit={handleSubmit}>
            <ModalHeader>Nueva Notificación Push</ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Título</FormLabel>
                  <Input
                    value={formData.titulo}
                    onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                    placeholder="Título de la notificación"
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Mensaje</FormLabel>
                  <Textarea
                    value={formData.mensaje}
                    onChange={(e) => setFormData({ ...formData, mensaje: e.target.value })}
                    placeholder="Mensaje de la notificación"
                    rows={6}
                  />
                </FormControl>
                <HStack width="full" spacing={4}>
                  <FormControl>
                    <FormLabel>Segmento por Rol</FormLabel>
                    <Select
                      value={formData.segmentoRol}
                      onChange={(e) => setFormData({ ...formData, segmentoRol: e.target.value })}
                    >
                      <option value="todos">Todos los usuarios</option>
                      <option value="admin">Administradores</option>
                      <option value="profesor">Profesores</option>
                      <option value="representante">Representantes</option>
                      <option value="representante-delegado">Representantes Delegados</option>
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
                <FormControl>
                  <FormLabel>Categoría (opcional)</FormLabel>
                  <Select
                    value={formData.segmentoCategoria}
                    onChange={(e) => setFormData({ ...formData, segmentoCategoria: e.target.value })}
                    placeholder="Todas las categorías"
                  >
                    {categorias.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </Select>
                  <Text fontSize="xs" color="gray.500" mt={2}>
                    Si se selecciona, solo se enviará a usuarios de esta categoría
                  </Text>
                </FormControl>
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
                  <Button
                    type="button"
                    colorScheme="green"
                    flex={1}
                    onClick={() => {
                      setFormData({ ...formData, enviarAhora: true })
                      handleSubmit(new Event('submit') as any)
                    }}
                    isLoading={createMutation.isPending}
                  >
                    Crear y Enviar
                  </Button>
                </HStack>
              </VStack>
            </ModalBody>
          </form>
        </ModalContent>
      </Modal>
    </Box>
  )
}


