'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
  Box,
  VStack,
  HStack,
  Input,
  Button,
  Text,
  Avatar,
  Badge,
  useColorModeValue,
  Flex,
  Divider,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Select,
  useToast
} from '@chakra-ui/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FiSend, FiPlus, FiMoreVertical, FiUsers } from 'react-icons/fi'
import { useAuth } from '@/hooks/useAuth'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface Chat {
  id: string
  tipo: string
  nombre?: string
  categoria?: string
  participantes: Array<{
    id: string
    usuario: {
      id: string
      nombre: string
      email: string
      rol: string
    }
  }>
  mensajes: Array<{
    id: string
    contenido: string
    tipo: string
    createdAt: string
    remitente: {
      id: string
      nombre: string
    }
  }>
  _count: {
    mensajes: number
  }
}

interface Mensaje {
  id: string
  contenido: string
  tipo: string
  createdAt: string
  remitente: {
    id: string
    nombre: string
    email: string
    rol: string
  }
}

export default function ChatComponent() {
  const { usuario } = useAuth()
  const [selectedChat, setSelectedChat] = useState<string | null>(null)
  const [mensaje, setMensaje] = useState('')
  const [nuevoChatTipo, setNuevoChatTipo] = useState('individual')
  const [nuevoChatParticipante, setNuevoChatParticipante] = useState('')
  const { isOpen, onOpen, onClose } = useDisclosure()
  const toast = useToast()
  const queryClient = useQueryClient()
  const mensajesEndRef = useRef<HTMLDivElement>(null)
  const bg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const chatBg = useColorModeValue('gray.50', 'gray.900')

  const { data: chats, isLoading: chatsLoading } = useQuery<Chat[]>({
    queryKey: ['chats'],
    queryFn: async () => {
      const res = await fetch('/api/comunicacion/chats')
      if (!res.ok) throw new Error('Error al cargar chats')
      return res.json()
    },
    refetchInterval: 5000 // Refrescar cada 5 segundos
  })

  const { data: mensajes, isLoading: mensajesLoading } = useQuery<Mensaje[]>({
    queryKey: ['mensajes', selectedChat],
    queryFn: async () => {
      if (!selectedChat) return []
      const res = await fetch(`/api/comunicacion/chats/${selectedChat}/mensajes`)
      if (!res.ok) throw new Error('Error al cargar mensajes')
      return res.json()
    },
    enabled: !!selectedChat,
    refetchInterval: 3000 // Refrescar cada 3 segundos
  })

  const { data: usuarios } = useQuery({
    queryKey: ['usuarios', 'chat'],
    queryFn: async () => {
      const res = await fetch('/api/usuarios?rol=')
      if (!res.ok) throw new Error('Error al cargar usuarios')
      return res.json()
    }
  })

  useEffect(() => {
    mensajesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensajes])

  const sendMutation = useMutation({
    mutationFn: async (contenido: string) => {
      if (!selectedChat) throw new Error('No hay chat seleccionado')
      const res = await fetch(`/api/comunicacion/chats/${selectedChat}/mensajes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contenido })
      })
      if (!res.ok) throw new Error('Error al enviar mensaje')
      return res.json()
    },
    onSuccess: () => {
      setMensaje('')
      queryClient.invalidateQueries({ queryKey: ['mensajes', selectedChat] })
      queryClient.invalidateQueries({ queryKey: ['chats'] })
    }
  })

  const createChatMutation = useMutation({
    mutationFn: async (data: { tipo: string; nombre?: string; participantes: string[] }) => {
      const res = await fetch('/api/comunicacion/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!res.ok) throw new Error('Error al crear chat')
      return res.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['chats'] })
      setSelectedChat(data.id)
      onClose()
      toast({
        title: 'Chat creado',
        status: 'success',
        duration: 3000
      })
    }
  })

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (mensaje.trim() && selectedChat) {
      sendMutation.mutate(mensaje.trim())
    }
  }

  const handleCreateChat = () => {
    if (nuevoChatTipo === 'individual' && !nuevoChatParticipante) {
      toast({
        title: 'Error',
        description: 'Selecciona un participante',
        status: 'error',
        duration: 3000
      })
      return
    }

    createChatMutation.mutate({
      tipo: nuevoChatTipo,
      nombre: nuevoChatTipo === 'grupo' ? 'Nuevo Grupo' : undefined,
      participantes: nuevoChatTipo === 'individual' ? [nuevoChatParticipante] : []
    })
  }

  const getChatName = (chat: Chat) => {
    if (chat.tipo === 'grupo' && chat.nombre) return chat.nombre
    if (chat.tipo === 'individual') {
      const otroParticipante = chat.participantes.find(p => p.usuario.id !== usuario?.id)
      return otroParticipante?.usuario.nombre || 'Chat'
    }
    return 'Chat'
  }

  const getChatAvatarName = (chat: Chat) => {
    if (chat.tipo === 'individual') {
      const otroParticipante = chat.participantes.find(p => p.usuario.id !== usuario?.id)
      return otroParticipante?.usuario.nombre.charAt(0).toUpperCase() || '?'
    }
    return 'G'
  }

  return (
    <Flex h="600px" gap={4}>
      {/* Lista de chats */}
      <Box
        w={{ base: '100%', md: '300px' }}
        bg={bg}
        borderRadius="md"
        borderWidth="1px"
        borderColor={borderColor}
        display="flex"
        flexDirection="column"
      >
        <HStack p={4} borderBottomWidth="1px" borderColor={borderColor} justify="space-between">
          <Text fontWeight="bold">Chats</Text>
          <IconButton
            aria-label="Nuevo chat"
            icon={<FiPlus />}
            size="sm"
            onClick={onOpen}
          />
        </HStack>
        <Box flex={1} overflowY="auto">
          {chatsLoading ? (
            <Text p={4} color="gray.500">Cargando...</Text>
          ) : chats && chats.length > 0 ? (
            <VStack spacing={0} align="stretch">
              {chats.map((chat) => (
                <Box
                  key={chat.id}
                  p={4}
                  cursor="pointer"
                  bg={selectedChat === chat.id ? chatBg : 'transparent'}
                  _hover={{ bg: chatBg }}
                  onClick={() => setSelectedChat(chat.id)}
                  borderBottomWidth="1px"
                  borderColor={borderColor}
                >
                  <HStack spacing={3}>
                    <Avatar size="sm" name={getChatName(chat)}>
                      {chat.tipo === 'grupo' ? <FiUsers /> : getChatAvatarName(chat)}
                    </Avatar>
                    <Box flex={1} minW={0}>
                      <Text fontWeight="semibold" noOfLines={1}>
                        {getChatName(chat)}
                      </Text>
                      {chat.mensajes[0] && (
                        <Text fontSize="xs" color="gray.500" noOfLines={1}>
                          {chat.mensajes[0].remitente.nombre}: {chat.mensajes[0].contenido}
                        </Text>
                      )}
                    </Box>
                    {chat._count.mensajes > 0 && (
                      <Badge colorScheme="blue">{chat._count.mensajes}</Badge>
                    )}
                  </HStack>
                </Box>
              ))}
            </VStack>
          ) : (
            <Text p={4} color="gray.500" textAlign="center">
              No hay chats. Crea uno nuevo.
            </Text>
          )}
        </Box>
      </Box>

      {/* Área de mensajes */}
      {selectedChat ? (
        <Box
          flex={1}
          bg={bg}
          borderRadius="md"
          borderWidth="1px"
          borderColor={borderColor}
          display="flex"
          flexDirection="column"
        >
          {chats && chats.find(c => c.id === selectedChat) && (
            <>
              <HStack p={4} borderBottomWidth="1px" borderColor={borderColor}>
                <Avatar size="sm" name={getChatName(chats.find(c => c.id === selectedChat)!)}>
                  {chats.find(c => c.id === selectedChat)?.tipo === 'grupo' 
                    ? <FiUsers /> 
                    : getChatAvatarName(chats.find(c => c.id === selectedChat)!)}
                </Avatar>
                <Box flex={1}>
                  <Text fontWeight="bold">{getChatName(chats.find(c => c.id === selectedChat)!)}</Text>
                </Box>
              </HStack>
              <Box flex={1} overflowY="auto" p={4} bg={chatBg}>
                {mensajesLoading ? (
                  <Text color="gray.500">Cargando mensajes...</Text>
                ) : mensajes && mensajes.length > 0 ? (
                  <VStack spacing={4} align="stretch">
                    {mensajes.map((msg) => {
                      const esMio = msg.remitente.id === usuario?.id
                      return (
                        <Box
                          key={msg.id}
                          alignSelf={esMio ? 'flex-end' : 'flex-start'}
                          maxW="70%"
                        >
                          <HStack spacing={2} align="flex-start" flexDirection={esMio ? 'row-reverse' : 'row'}>
                            <Avatar size="xs" name={msg.remitente.nombre} />
                            <Box
                              bg={esMio ? 'blue.500' : bg}
                              color={esMio ? 'white' : 'inherit'}
                              px={4}
                              py={2}
                              borderRadius="lg"
                              borderWidth="1px"
                              borderColor={borderColor}
                            >
                              <Text fontSize="sm" fontWeight="semibold" mb={1}>
                                {msg.remitente.nombre}
                              </Text>
                              <Text fontSize="sm">{msg.contenido}</Text>
                              <Text fontSize="xs" opacity={0.7} mt={1}>
                                {format(new Date(msg.createdAt), 'HH:mm', { locale: es })}
                              </Text>
                            </Box>
                          </HStack>
                        </Box>
                      )
                    })}
                    <div ref={mensajesEndRef} />
                  </VStack>
                ) : (
                  <Text color="gray.500" textAlign="center">
                    No hay mensajes. Envía el primero.
                  </Text>
                )}
              </Box>
              <Divider />
              <form onSubmit={handleSend}>
                <HStack p={4}>
                  <Input
                    value={mensaje}
                    onChange={(e) => setMensaje(e.target.value)}
                    placeholder="Escribe un mensaje..."
                    isDisabled={sendMutation.isPending}
                  />
                  <IconButton
                    aria-label="Enviar"
                    icon={<FiSend />}
                    type="submit"
                    colorScheme="blue"
                    isLoading={sendMutation.isPending}
                  />
                </HStack>
              </form>
            </>
          )}
        </Box>
      ) : (
        <Box
          flex={1}
          bg={bg}
          borderRadius="md"
          borderWidth="1px"
          borderColor={borderColor}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Text color="gray.500">Selecciona un chat o crea uno nuevo</Text>
        </Box>
      )}

      {/* Modal para crear chat */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Nuevo Chat</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>Tipo de Chat</FormLabel>
                <Select
                  value={nuevoChatTipo}
                  onChange={(e) => setNuevoChatTipo(e.target.value)}
                >
                  <option value="individual">Individual</option>
                  <option value="grupo">Grupo</option>
                </Select>
              </FormControl>
              {nuevoChatTipo === 'individual' && (
                <FormControl>
                  <FormLabel>Participante</FormLabel>
                  <Select
                    value={nuevoChatParticipante}
                    onChange={(e) => setNuevoChatParticipante(e.target.value)}
                    placeholder="Seleccionar usuario"
                  >
                    {usuarios?.filter((u: any) => u.id !== usuario?.id).map((u: any) => (
                      <option key={u.id} value={u.id}>
                        {u.nombre} ({u.rol})
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
                  onClick={handleCreateChat}
                  colorScheme="blue"
                  flex={1}
                  isLoading={createChatMutation.isPending}
                >
                  Crear
                </Button>
              </HStack>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Flex>
  )
}
