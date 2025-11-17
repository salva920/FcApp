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
  Stack,
  Select,
  Divider
} from '@chakra-ui/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FiPlus, FiEdit, FiTrash2, FiUser } from 'react-icons/fi'
import { useAuth } from '@/hooks/useAuth'

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

interface UsuarioProfesor {
  id: string
  nombre: string
  email: string
  rol: string
  categoria: string | null
}

export default function InstructoresPage() {
  const { isAdmin } = useAuth()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { isOpen: isCategoriaOpen, onOpen: onCategoriaOpen, onClose: onCategoriaClose } = useDisclosure()
  const [editingInstructor, setEditingInstructor] = useState<Instructor | null>(null)
  const [editingUsuario, setEditingUsuario] = useState<UsuarioProfesor | null>(null)
  const [formData, setFormData] = useState({
    nombre: '',
    cedula: '',
    email: '',
    telefono: '',
    especialidad: ''
  })
  const [categoriaData, setCategoriaData] = useState({
    categoria: ''
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

  const { data: usuariosProfesores } = useQuery<UsuarioProfesor[]>({
    queryKey: ['usuarios', 'profesor'],
    queryFn: async () => {
      // Obtener tanto profesores como representantes-delegados
      const [profesoresRes, delegadosRes] = await Promise.all([
        fetch('/api/usuarios?rol=profesor'),
        fetch('/api/usuarios?rol=representante-delegado')
      ])
      if (!profesoresRes.ok || !delegadosRes.ok) throw new Error('Error al cargar profesores')
      const profesores = await profesoresRes.json()
      const delegados = await delegadosRes.json()
      return [...profesores, ...delegados]
    },
    enabled: isAdmin
  })

  const categoriaMutation = useMutation({
    mutationFn: async ({ usuarioId, categoria }: { usuarioId: string; categoria: string }) => {
      const token = localStorage.getItem('football_auth_token')
      const res = await fetch(`/api/usuarios/${usuarioId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ categoria: categoria || null })
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Error al actualizar categoría')
      }
      return res.json()
    },
    onSuccess: () => {
      toast({
        title: 'Categoría actualizada',
        description: 'La categoría del instructor se ha actualizado exitosamente',
        status: 'success',
        duration: 3000
      })
      queryClient.invalidateQueries({ queryKey: ['usuarios'] })
      onCategoriaClose()
      setEditingUsuario(null)
      setCategoriaData({ categoria: '' })
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Error al actualizar categoría',
        status: 'error',
        duration: 3000
      })
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

  const handleEditCategoria = (usuario: UsuarioProfesor) => {
    setEditingUsuario(usuario)
    setCategoriaData({ categoria: usuario.categoria || '' })
    onCategoriaOpen()
  }

  const handleSubmitCategoria = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUsuario) return
    categoriaMutation.mutate({
      usuarioId: editingUsuario.id,
      categoria: categoriaData.categoria
    })
  }

  const categorias = ['Sub-6', 'Sub-8', 'Sub-10', 'Sub-12', 'Sub-14', 'Sub-16', 'Sub-18']

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

        {/* Sección de Usuarios Profesores - Solo para Admin */}
        {isAdmin && (
          <>
            <Divider />
            <Heading size="lg">👨‍🏫 Asignación de Categorías a Instructores</Heading>
            <Text color="gray.600" fontSize="sm">
              Asigna una categoría a cada instructor para que solo vea los niños de su categoría asignada.
            </Text>
            <Card>
              <CardBody>
                <Box overflowX="auto">
                  <Table variant="simple" size="sm" minW="760px">
                    <Thead>
                      <Tr>
                        <Th>Nombre</Th>
                        <Th>Email</Th>
                        <Th>Rol</Th>
                        <Th>Categoría Asignada</Th>
                        <Th>Acciones</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {usuariosProfesores?.map((usuario) => (
                        <Tr key={usuario.id}>
                          <Td fontWeight="bold">{usuario.nombre}</Td>
                          <Td>{usuario.email}</Td>
                          <Td>
                            <Badge
                              colorScheme={
                                usuario.rol === 'representante-delegado' ? 'purple' :
                                usuario.rol === 'profesor' ? 'blue' : 'gray'
                              }
                            >
                              {usuario.rol === 'representante-delegado' ? 'Representante Delegado' :
                               usuario.rol === 'profesor' ? 'Profesor' : usuario.rol}
                            </Badge>
                          </Td>
                          <Td>
                            {usuario.categoria ? (
                              <Badge colorScheme="green">{usuario.categoria}</Badge>
                            ) : (
                              <Badge colorScheme="gray">Sin asignar</Badge>
                            )}
                          </Td>
                          <Td>
                            <IconButton
                              aria-label="Asignar categoría"
                              icon={<FiEdit />}
                              size="sm"
                              variant="ghost"
                              colorScheme="blue"
                              onClick={() => handleEditCategoria(usuario)}
                            />
                          </Td>
                        </Tr>
                      ))}
                      {usuariosProfesores?.length === 0 && (
                        <Tr>
                          <Td colSpan={5} textAlign="center" color="gray.500">
                            No hay usuarios profesores registrados
                          </Td>
                        </Tr>
                      )}
                    </Tbody>
                  </Table>
                </Box>
              </CardBody>
            </Card>
          </>
        )}
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

      {/* Modal para asignar categoría */}
      <Modal isOpen={isCategoriaOpen} onClose={onCategoriaClose}>
        <ModalOverlay />
        <ModalContent>
          <form onSubmit={handleSubmitCategoria}>
            <ModalHeader>
              Asignar Categoría a {editingUsuario?.nombre}
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
              <VStack spacing={4}>
                <FormControl>
                  <FormLabel>Categoría</FormLabel>
                  <Select
                    value={categoriaData.categoria}
                    onChange={(e) => setCategoriaData({ categoria: e.target.value })}
                    placeholder="Seleccionar categoría"
                  >
                    {categorias.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </Select>
                  <Text fontSize="xs" color="gray.500" mt={2}>
                    Deja vacío para quitar la asignación
                  </Text>
                </FormControl>

                <Stack direction={{ base: 'column', md: 'row' }} spacing={4} width="full">
                  <Button type="button" onClick={onCategoriaClose} flex={1} width={{ base: '100%', md: 'auto' }}>
                    Cancelar
                  </Button>
                  <Button type="submit" colorScheme="blue" flex={1} width={{ base: '100%', md: 'auto' }} isLoading={categoriaMutation.isPending}>
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
