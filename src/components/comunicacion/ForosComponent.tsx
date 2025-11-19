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
  IconButton,
  SimpleGrid
} from '@chakra-ui/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FiUsers, FiPlus, FiMessageSquare, FiLock } from 'react-icons/fi'
import { useAuth } from '@/hooks/useAuth'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import Link from 'next/link'

interface Foro {
  id: string
  nombre: string
  descripcion?: string
  categoria?: string
  icono?: string
  color?: string
  soloLectura: boolean
  _count: {
    temas: number
  }
}

interface Tema {
  id: string
  titulo: string
  contenido: string
  fijado: boolean
  cerrado: boolean
  visitas: number
  createdAt: string
  autor: {
    id: string
    nombre: string
    rol: string
  }
  _count: {
    comentarios: number
  }
}

export default function ForosComponent() {
  const { usuario, isAdmin } = useAuth()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { isOpen: isTemaOpen, onOpen: onTemaOpen, onClose: onTemaClose } = useDisclosure()
  const [selectedForo, setSelectedForo] = useState<string | null>(null)
  const toast = useToast()
  const queryClient = useQueryClient()
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const cardBg = useColorModeValue('white', 'gray.700')

  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    categoria: '',
    icono: '',
    color: 'blue',
    soloLectura: false
  })

  const [temaData, setTemaData] = useState({
    titulo: '',
    contenido: ''
  })

  const { data: foros, isLoading: forosLoading } = useQuery<Foro[]>({
    queryKey: ['foros'],
    queryFn: async () => {
      const res = await fetch('/api/comunicacion/foros')
      if (!res.ok) throw new Error('Error al cargar foros')
      return res.json()
    }
  })

  const { data: temas, isLoading: temasLoading } = useQuery<Tema[]>({
    queryKey: ['temas', selectedForo],
    queryFn: async () => {
      if (!selectedForo) return []
      const res = await fetch(`/api/comunicacion/foros/${selectedForo}/temas`)
      if (!res.ok) throw new Error('Error al cargar temas')
      return res.json()
    },
    enabled: !!selectedForo
  })

  const createForoMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/comunicacion/foros', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!res.ok) throw new Error('Error al crear foro')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['foros'] })
      onClose()
      setFormData({
        nombre: '',
        descripcion: '',
        categoria: '',
        icono: '',
        color: 'blue',
        soloLectura: false
      })
      toast({
        title: 'Foro creado',
        status: 'success',
        duration: 3000
      })
    }
  })

  const createTemaMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!selectedForo) throw new Error('No hay foro seleccionado')
      const res = await fetch(`/api/comunicacion/foros/${selectedForo}/temas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!res.ok) throw new Error('Error al crear tema')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['temas', selectedForo] })
      onTemaClose()
      setTemaData({ titulo: '', contenido: '' })
      toast({
        title: 'Tema creado',
        status: 'success',
        duration: 3000
      })
    }
  })

  const handleCreateForo = (e: React.FormEvent) => {
    e.preventDefault()
    createForoMutation.mutate(formData)
  }

  const handleCreateTema = (e: React.FormEvent) => {
    e.preventDefault()
    createTemaMutation.mutate(temaData)
  }

  const categorias = ['Sub-6', 'Sub-8', 'Sub-10', 'Sub-12', 'Sub-14', 'Sub-16', 'Sub-18']

  if (selectedForo && foros) {
    const foro = foros.find(f => f.id === selectedForo)
    return (
      <Box>
        <HStack mb={4} spacing={4}>
          <Button size="sm" onClick={() => setSelectedForo(null)}>
            ← Volver
          </Button>
          <Text fontSize="lg" fontWeight="bold">
            {foro?.nombre}
          </Text>
          {foro?.soloLectura && (
            <Badge colorScheme="orange">
              <FiLock size={12} style={{ display: 'inline', marginRight: '4px' }} />
              Solo lectura
            </Badge>
          )}
          {!foro?.soloLectura && (
            <Button leftIcon={<FiPlus />} size="sm" colorScheme="blue" onClick={onTemaOpen}>
              Nuevo Tema
            </Button>
          )}
        </HStack>

        {temasLoading ? (
          <Text color="gray.500">Cargando temas...</Text>
        ) : temas && temas.length > 0 ? (
          <VStack spacing={3} align="stretch">
            {temas.map((tema) => (
              <Card key={tema.id} bg={cardBg} borderWidth="1px" borderColor={borderColor}>
                <CardBody>
                  <VStack align="stretch" spacing={2}>
                    <HStack justify="space-between">
                      <HStack spacing={2}>
                        {tema.fijado && <Badge colorScheme="yellow">Fijado</Badge>}
                        {tema.cerrado && <Badge colorScheme="gray">Cerrado</Badge>}
                        <Text fontWeight="bold" fontSize="lg">
                          {tema.titulo}
                        </Text>
                      </HStack>
                    </HStack>
                    <Text color="gray.600" noOfLines={2}>
                      {tema.contenido}
                    </Text>
                    <Divider />
                    <HStack justify="space-between" fontSize="sm" color="gray.500">
                      <Text>
                        Por {tema.autor.nombre} • {format(new Date(tema.createdAt), 'dd/MM/yyyy', { locale: es })}
                      </Text>
                      <HStack spacing={4}>
                        <Text>{tema.visitas} vistas</Text>
                        <Text>{tema._count.comentarios} comentarios</Text>
                      </HStack>
                    </HStack>
                  </VStack>
                </CardBody>
              </Card>
            ))}
          </VStack>
        ) : (
          <Box textAlign="center" py={8}>
            <FiMessageSquare size={48} color="gray" style={{ margin: '0 auto 16px' }} />
            <Text color="gray.500">No hay temas en este foro</Text>
          </Box>
        )}

        {/* Modal para crear tema */}
        <Modal isOpen={isTemaOpen} onClose={onTemaClose} size="xl">
          <ModalOverlay />
          <ModalContent>
            <form onSubmit={handleCreateTema}>
              <ModalHeader>Nuevo Tema</ModalHeader>
              <ModalCloseButton />
              <ModalBody pb={6}>
                <VStack spacing={4}>
                  <FormControl isRequired>
                    <FormLabel>Título</FormLabel>
                    <Input
                      value={temaData.titulo}
                      onChange={(e) => setTemaData({ ...temaData, titulo: e.target.value })}
                      placeholder="Título del tema"
                    />
                  </FormControl>
                  <FormControl isRequired>
                    <FormLabel>Contenido</FormLabel>
                    <Textarea
                      value={temaData.contenido}
                      onChange={(e) => setTemaData({ ...temaData, contenido: e.target.value })}
                      placeholder="Contenido del tema"
                      rows={6}
                    />
                  </FormControl>
                  <HStack width="full" spacing={4}>
                    <Button onClick={onTemaClose} flex={1}>
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      colorScheme="blue"
                      flex={1}
                      isLoading={createTemaMutation.isPending}
                    >
                      Crear
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

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={4}>
        <Text fontSize="lg" fontWeight="bold">
          Foros por Categorías
        </Text>
        {isAdmin && (
          <Button leftIcon={<FiPlus />} colorScheme="blue" size="sm" onClick={onOpen}>
            Nuevo Foro
          </Button>
        )}
      </Flex>

      {forosLoading ? (
        <Text color="gray.500">Cargando foros...</Text>
      ) : foros && foros.length > 0 ? (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
          {foros.map((foro) => (
            <Card
              key={foro.id}
              bg={cardBg}
              borderWidth="1px"
              borderColor={borderColor}
              cursor="pointer"
              _hover={{ shadow: 'md' }}
              onClick={() => setSelectedForo(foro.id)}
            >
              <CardBody>
                <VStack align="stretch" spacing={3}>
                  <HStack justify="space-between">
                    <HStack>
                      {foro.icono ? (
                        <Text fontSize="2xl">{foro.icono}</Text>
                      ) : (
                        <FiUsers size={24} />
                      )}
                      <Text fontWeight="bold" fontSize="lg">
                        {foro.nombre}
                      </Text>
                    </HStack>
                    {foro.soloLectura && (
                      <Badge colorScheme="orange">
                        <FiLock size={12} />
                      </Badge>
                    )}
                  </HStack>
                  {foro.descripcion && (
                    <Text color="gray.600" fontSize="sm" noOfLines={2}>
                      {foro.descripcion}
                    </Text>
                  )}
                  <Divider />
                  <HStack justify="space-between" fontSize="sm" color="gray.500">
                    {foro.categoria && (
                      <Badge colorScheme="purple">{foro.categoria}</Badge>
                    )}
                    <Text>{foro._count.temas} temas</Text>
                  </HStack>
                </VStack>
              </CardBody>
            </Card>
          ))}
        </SimpleGrid>
      ) : (
        <Box textAlign="center" py={8}>
          <FiUsers size={48} color="gray" style={{ margin: '0 auto 16px' }} />
          <Text color="gray.500">No hay foros disponibles</Text>
        </Box>
      )}

      {/* Modal para crear foro */}
      {isAdmin && (
        <Modal isOpen={isOpen} onClose={onClose} size="xl">
          <ModalOverlay />
          <ModalContent>
            <form onSubmit={handleCreateForo}>
              <ModalHeader>Nuevo Foro</ModalHeader>
              <ModalCloseButton />
              <ModalBody pb={6}>
                <VStack spacing={4}>
                  <FormControl isRequired>
                    <FormLabel>Nombre</FormLabel>
                    <Input
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      placeholder="Nombre del foro"
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Descripción</FormLabel>
                    <Textarea
                      value={formData.descripcion}
                      onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                      placeholder="Descripción del foro"
                      rows={3}
                    />
                  </FormControl>
                  <HStack width="full" spacing={4}>
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
                    <FormControl>
                      <FormLabel>Color</FormLabel>
                      <Select
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      >
                        <option value="blue">Azul</option>
                        <option value="green">Verde</option>
                        <option value="purple">Morado</option>
                        <option value="orange">Naranja</option>
                        <option value="red">Rojo</option>
                      </Select>
                    </FormControl>
                  </HStack>
                  <HStack width="full" spacing={4}>
                    <Button onClick={onClose} flex={1}>
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      colorScheme="blue"
                      flex={1}
                      isLoading={createForoMutation.isPending}
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
