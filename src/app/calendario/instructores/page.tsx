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
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Flex,
  IconButton,
  Stack
} from '@chakra-ui/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FiPlus, FiEdit, FiTrash2, FiUser } from 'react-icons/fi'

interface Instructor {
  id: string
  nombre: string
  cedula: string
  email: string
  telefono: string
  especialidad?: string
  activo: boolean
  _count?: {
    actividades: number
  }
}

export default function InstructoresPage() {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [editingInstructor, setEditingInstructor] = useState<Instructor | null>(null)
  const [formData, setFormData] = useState({
    nombre: '',
    cedula: '',
    email: '',
    telefono: '',
    especialidad: ''
  })
  const toast = useToast()
  const queryClient = useQueryClient()

  const { data: instructores } = useQuery<Instructor[]>({
    queryKey: ['instructores'],
    queryFn: async () => {
      const res = await fetch('/api/instructores')
      if (!res.ok) throw new Error('Error al cargar instructores')
      return res.json()
    }
  })

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/instructores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!res.ok) throw new Error('Error al guardar instructor')
      return res.json()
    },
    onSuccess: () => {
      toast({
        title: 'Instructor guardado',
        status: 'success',
        duration: 3000
      })
      queryClient.invalidateQueries({ queryKey: ['instructores'] })
      onClose()
      resetForm()
    }
  })

  const resetForm = () => {
    setFormData({
      nombre: '',
      cedula: '',
      email: '',
      telefono: '',
      especialidad: ''
    })
    setEditingInstructor(null)
  }

  const handleEdit = (instructor: Instructor) => {
    setEditingInstructor(instructor)
    setFormData({
      nombre: instructor.nombre,
      cedula: instructor.cedula,
      email: instructor.email,
      telefono: instructor.telefono,
      especialidad: instructor.especialidad || ''
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
          <Heading size="xl">👨‍🏫 Gestión de Instructores</Heading>
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
              Nuevo Instructor
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
                    <Th>Cédula</Th>
                    <Th>Email</Th>
                    <Th>Teléfono</Th>
                    <Th>Especialidad</Th>
                    <Th>Actividades</Th>
                    <Th>Acciones</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {instructores?.map((instructor) => (
                    <Tr key={instructor.id}>
                      <Td fontWeight="bold">{instructor.nombre}</Td>
                      <Td>{instructor.cedula}</Td>
                      <Td>{instructor.email}</Td>
                      <Td>{instructor.telefono}</Td>
                      <Td>{instructor.especialidad || '-'}</Td>
                      <Td>
                        <Badge colorScheme="blue">{instructor._count?.actividades || 0}</Badge>
                      </Td>
                      <Td>
                        <IconButton
                          aria-label="Editar"
                          icon={<FiEdit />}
                          size="sm"
                          variant="ghost"
                          colorScheme="blue"
                          onClick={() => handleEdit(instructor)}
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
              {editingInstructor ? 'Editar Instructor' : 'Nuevo Instructor'}
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Nombre</FormLabel>
                  <Input
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Cédula</FormLabel>
                  <Input
                    value={formData.cedula}
                    onChange={(e) => setFormData({ ...formData, cedula: e.target.value })}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Email</FormLabel>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Teléfono</FormLabel>
                  <Input
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Especialidad</FormLabel>
                  <Input
                    value={formData.especialidad}
                    onChange={(e) => setFormData({ ...formData, especialidad: e.target.value })}
                    placeholder="Ej: Entrenamiento Sub-10"
                  />
                </FormControl>

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
