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
  Select,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Flex,
  IconButton,
  NumberInput,
  NumberInputField,
  Stack
} from '@chakra-ui/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FiPlus, FiEdit, FiTrash2, FiMapPin } from 'react-icons/fi'

interface Cancha {
  id: string
  nombre: string
  descripcion?: string
  capacidad: number
  tipo: string
  activo: boolean
  _count?: {
    reservas: number
    actividades: number
  }
}

export default function CanchasPage() {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [editingCancha, setEditingCancha] = useState<Cancha | null>(null)
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    capacidad: 0,
    tipo: 'Césped'
  })
  const toast = useToast()
  const queryClient = useQueryClient()

  const { data: canchas } = useQuery<Cancha[]>({
    queryKey: ['canchas'],
    queryFn: async () => {
      const res = await fetch('/api/canchas')
      if (!res.ok) throw new Error('Error al cargar canchas')
      return res.json()
    }
  })

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/canchas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!res.ok) throw new Error('Error al guardar cancha')
      return res.json()
    },
    onSuccess: () => {
      toast({
        title: 'Cancha guardada',
        status: 'success',
        duration: 3000
      })
      queryClient.invalidateQueries({ queryKey: ['canchas'] })
      onClose()
      resetForm()
    }
  })

  const resetForm = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      capacidad: 0,
      tipo: 'Césped'
    })
    setEditingCancha(null)
  }

  const handleEdit = (cancha: Cancha) => {
    setEditingCancha(cancha)
    setFormData({
      nombre: cancha.nombre,
      descripcion: cancha.descripcion || '',
      capacidad: cancha.capacidad,
      tipo: cancha.tipo
    })
    onOpen()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutation.mutate(formData)
  }

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Stack
          direction={{ base: 'column', md: 'row' }}
          spacing={4}
          justify="space-between"
          align={{ base: 'stretch', md: 'center' }}
        >
          <Heading size="xl">🏟️ Gestión de Canchas</Heading>
          <Stack
            direction={{ base: 'column', sm: 'row' }}
            spacing={3}
            justify="flex-end"
            width={{ base: '100%', md: 'auto' }}
          >
            <Button
              variant="outline"
              onClick={() => window.location.href = '/calendario'}
              width={{ base: '100%', sm: 'auto' }}
            >
              ← Volver al Calendario
            </Button>
            <Button
              leftIcon={<FiPlus />}
              colorScheme="blue"
              onClick={() => {
                resetForm()
                onOpen()
              }}
              width={{ base: '100%', sm: 'auto' }}
            >
              Nueva Cancha
            </Button>
          </Stack>
        </Stack>

        <Card>
          <CardBody>
            <Box overflowX="auto">
              <Table variant="simple" size="sm" minW="760px">
                <Thead>
                  <Tr>
                    <Th>Nombre</Th>
                    <Th>Descripción</Th>
                    <Th>Capacidad</Th>
                    <Th>Tipo</Th>
                    <Th>Actividades</Th>
                    <Th>Reservas</Th>
                    <Th>Acciones</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {canchas?.map((cancha) => (
                    <Tr key={cancha.id}>
                      <Td fontWeight="bold">{cancha.nombre}</Td>
                      <Td>{cancha.descripcion || '-'}</Td>
                      <Td>{cancha.capacidad}</Td>
                      <Td>
                        <Badge colorScheme="green">{cancha.tipo}</Badge>
                      </Td>
                      <Td>
                        <Badge colorScheme="blue">{cancha._count?.actividades || 0}</Badge>
                      </Td>
                      <Td>
                        <Badge colorScheme="purple">{cancha._count?.reservas || 0}</Badge>
                      </Td>
                      <Td>
                        <IconButton
                          aria-label="Editar"
                          icon={<FiEdit />}
                          size="sm"
                          variant="ghost"
                          colorScheme="blue"
                          onClick={() => handleEdit(cancha)}
                        />
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          </CardBody>
        </Card>
      </VStack>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <form onSubmit={handleSubmit}>
            <ModalHeader>
              {editingCancha ? 'Editar Cancha' : 'Nueva Cancha'}
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Nombre</FormLabel>
                  <Input
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    placeholder="Ej: Cancha Principal"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Descripción</FormLabel>
                  <Input
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    placeholder="Descripción de la cancha"
                  />
                </FormControl>

                <Stack direction={{ base: 'column', md: 'row' }} spacing={4} width="full">
                  <FormControl isRequired>
                    <FormLabel>Capacidad</FormLabel>
                    <NumberInput
                      value={formData.capacidad}
                      onChange={(_, value) => setFormData({ ...formData, capacidad: value })}
                      min={1}
                    >
                      <NumberInputField />
                    </NumberInput>
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Tipo</FormLabel>
                    <Select
                      value={formData.tipo}
                      onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                    >
                      <option value="Césped">Césped</option>
                      <option value="Césped Sintético">Césped Sintético</option>
                      <option value="Aluminio">Aluminio</option>
                    </Select>
                  </FormControl>
                </Stack>

                <Stack direction={{ base: 'column', md: 'row' }} spacing={4} width="full">
                  <Button type="button" onClick={onClose} flex={1} width={{ base: '100%', md: 'auto' }}>
                    Cancelar
                  </Button>
                  <Button type="submit" colorScheme="blue" flex={1} width={{ base: '100%', md: 'auto' }}>
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
