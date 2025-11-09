'use client'

import React, { useState, useEffect } from 'react'
import {
  Box,
  Container,
  VStack,
  HStack,
  Heading,
  Text,
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  InputLeftElement,
  Button,
  useColorModeValue,
  Card,
  CardBody,
  Alert,
  AlertIcon,
  IconButton,
  InputRightElement,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Select,
  Textarea
} from '@chakra-ui/react'
import { FiMail, FiLock, FiEye, FiEyeOff, FiUser, FiPhone, FiBriefcase } from 'react-icons/fi'
import Link from 'next/link'

export default function LoginPage() {
  // Estados para Login
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [mounted, setMounted] = useState(false)

  // Estados para Registro
  const [registroData, setRegistroData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    nombre: '',
    rol: '',
    cedula: '',
    telefono: '',
    direccion: '',
    especialidad: ''
  })
  const [showRegistroPassword, setShowRegistroPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoadingRegistro, setIsLoadingRegistro] = useState(false)
  const [registroError, setRegistroError] = useState('')
  const [registroSuccess, setRegistroSuccess] = useState(false)

  const cardBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const gradientBg = useColorModeValue(
    'linear(to-br, blue.50, green.50, yellow.50)',
    'linear(to-br, gray.800, gray.700, gray.600)'
  )

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await res.json()

      if (res.ok) {
        localStorage.setItem('football_auth_token', data.token)
        localStorage.setItem('football_user', JSON.stringify(data.usuario))
        document.cookie = `football_auth_token=${data.token}; path=/; max-age=604800`
        window.location.href = '/'
      } else {
        setError(data.error || 'Credenciales incorrectas')
        setIsLoading(false)
      }
    } catch (error) {
      setError('Error al iniciar sesión. Intenta de nuevo.')
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleRegistroChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setRegistroData({
      ...registroData,
      [e.target.name]: e.target.value
    })
  }

  const handleRegistroSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoadingRegistro(true)
    setRegistroError('')
    setRegistroSuccess(false)

    if (registroData.password !== registroData.confirmPassword) {
      setRegistroError('Las contraseñas no coinciden')
      setIsLoadingRegistro(false)
      return
    }

    if (registroData.password.length < 6) {
      setRegistroError('La contraseña debe tener al menos 6 caracteres')
      setIsLoadingRegistro(false)
      return
    }

    if (!registroData.rol) {
      setRegistroError('Debes seleccionar un rol')
      setIsLoadingRegistro(false)
      return
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: registroData.email,
          password: registroData.password,
          nombre: registroData.nombre,
          rol: registroData.rol,
          cedula: registroData.cedula,
          telefono: registroData.telefono,
          direccion: registroData.direccion,
          especialidad: registroData.especialidad
        })
      })

      const data = await res.json()

      if (res.ok) {
        setRegistroSuccess(true)
        setRegistroError('')
        setRegistroData({
          email: '',
          password: '',
          confirmPassword: '',
          nombre: '',
          rol: '',
          cedula: '',
          telefono: '',
          direccion: '',
          especialidad: ''
        })
        setTimeout(() => {
          window.location.href = '/login'
        }, 2000)
      } else {
        setRegistroError(data.error || 'Error al registrar')
        setIsLoadingRegistro(false)
      }
    } catch (error) {
      setRegistroError('Error al registrar. Intenta de nuevo.')
      setIsLoadingRegistro(false)
    }
  }

  if (!mounted) {
    return (
      <Box minH="100vh" display="flex" alignItems="center" justifyContent="center">
        <Text>Cargando...</Text>
      </Box>
    )
  }

  return (
    <Box
      minH="100vh"
      bgGradient={gradientBg}
      position="relative"
      overflow="hidden"
    >
      {/* Elementos decorativos */}
      <Box position="absolute" top="10%" left="5%" opacity={0.1}>
        <Text fontSize="6xl" color="green.500" transform="rotate(-15deg)">⚽</Text>
      </Box>
      <Box position="absolute" top="20%" right="10%" opacity={0.1}>
        <Text fontSize="4xl" color="blue.500" transform="rotate(15deg)">🏆</Text>
      </Box>
      <Box position="absolute" bottom="15%" left="15%" opacity={0.1}>
        <Text fontSize="5xl" color="yellow.500" transform="rotate(-10deg)">⚽</Text>
      </Box>

      <Container maxW="md" py={12}>
        <VStack spacing={8}>
          <VStack spacing={4} textAlign="center">
            <Box position="relative">
              <Text fontSize="6xl" mb={2}>⚽</Text>
              <Box
                position="absolute"
                top="-2"
                right="-2"
                w="4"
                h="4"
                bg="green.400"
                borderRadius="full"
              />
            </Box>
            <Heading size="2xl" color="blue.600" fontWeight="bold">
              Gestión Football Pro
            </Heading>
            <Text fontSize="lg" color="gray.600" maxW="sm">
              Accede o regístrate para gestionar la escuela de fútbol
            </Text>
          </VStack>

          <Card w="full" bg={cardBg} borderColor={borderColor} borderWidth="1px" shadow="xl" borderRadius="xl">
            <CardBody p={0}>
              <Tabs defaultIndex={0} colorScheme="blue">
                <TabList>
                  <Tab flex={1} fontWeight="semibold">Iniciar Sesión</Tab>
                  <Tab flex={1} fontWeight="semibold">Registrarse</Tab>
                </TabList>

                <TabPanels>
                  {/* Pestaña Login */}
                  <TabPanel px={8} py={6}>
              <form onSubmit={handleSubmit}>
                <VStack spacing={6}>
                  {error && (
                          <Alert status="error" borderRadius="md" w="full">
                      <AlertIcon />
                      {error}
                    </Alert>
                  )}

                  <FormControl isRequired>
                          <FormLabel>Email</FormLabel>
                    <InputGroup>
                      <InputLeftElement>
                        <FiMail color="gray.400" />
                      </InputLeftElement>
                      <Input
                        type="email"
                        name="email"
                              placeholder="tu@email.com"
                        value={formData.email}
                        onChange={handleInputChange}
                        size="lg"
                      />
                    </InputGroup>
                  </FormControl>

                  <FormControl isRequired>
                          <FormLabel>Contraseña</FormLabel>
                    <InputGroup>
                      <InputLeftElement>
                        <FiLock color="gray.400" />
                      </InputLeftElement>
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={handleInputChange}
                        size="lg"
                      />
                      <InputRightElement>
                        <IconButton
                                aria-label="Mostrar contraseña"
                          icon={showPassword ? <FiEyeOff /> : <FiEye />}
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowPassword(!showPassword)}
                        />
                      </InputRightElement>
                    </InputGroup>
                  </FormControl>

                  <Button
                    type="submit"
                    colorScheme="blue"
                    size="lg"
                    width="full"
                    isLoading={isLoading}
                    loadingText="Iniciando sesión..."
                  >
                    Iniciar Sesión
                  </Button>
                      </VStack>
                    </form>
                  </TabPanel>

                  {/* Pestaña Registro */}
                  <TabPanel px={8} py={6}>
                    <form onSubmit={handleRegistroSubmit}>
                      <VStack spacing={4} align="stretch">
                        {registroError && (
                          <Alert status="error" borderRadius="md" w="full">
                            <AlertIcon />
                            {registroError}
                          </Alert>
                        )}

                        {registroSuccess && (
                          <Alert status="success" borderRadius="md" w="full">
                            <AlertIcon />
                            ¡Usuario registrado! Redirigiendo...
                          </Alert>
                        )}

                        <FormControl isRequired>
                          <FormLabel>Tipo de Usuario</FormLabel>
                          <Select
                            name="rol"
                            value={registroData.rol}
                            onChange={handleRegistroChange}
                            size="lg"
                            placeholder="Selecciona tu rol"
                          >
                            <option value="representante">Representante</option>
                            <option value="profesor">Profesor</option>
                          </Select>
                        </FormControl>

                        <FormControl isRequired>
                          <FormLabel>Nombre Completo</FormLabel>
                          <InputGroup>
                            <InputLeftElement>
                              <FiUser color="gray.400" />
                            </InputLeftElement>
                            <Input
                              type="text"
                              name="nombre"
                              placeholder="Juan Pérez"
                              value={registroData.nombre}
                              onChange={handleRegistroChange}
                              size="lg"
                            />
                          </InputGroup>
                        </FormControl>

                        <FormControl isRequired>
                          <FormLabel>Email</FormLabel>
                          <InputGroup>
                            <InputLeftElement>
                              <FiMail color="gray.400" />
                            </InputLeftElement>
                            <Input
                              type="email"
                              name="email"
                              placeholder="tu@email.com"
                              value={registroData.email}
                              onChange={handleRegistroChange}
                              size="lg"
                            />
                          </InputGroup>
                        </FormControl>

                        <HStack spacing={4}>
                          <FormControl isRequired>
                            <FormLabel>Cédula</FormLabel>
                            <Input
                              type="text"
                              name="cedula"
                              placeholder="12345678"
                              value={registroData.cedula}
                              onChange={handleRegistroChange}
                              size="lg"
                            />
                          </FormControl>

                          <FormControl isRequired>
                            <FormLabel>Teléfono</FormLabel>
                            <InputGroup>
                              <InputLeftElement>
                                <FiPhone color="gray.400" />
                              </InputLeftElement>
                              <Input
                                type="tel"
                                name="telefono"
                                placeholder="04121234567"
                                value={registroData.telefono}
                                onChange={handleRegistroChange}
                                size="lg"
                              />
                            </InputGroup>
                          </FormControl>
                    </HStack>

                        {registroData.rol === 'profesor' && (
                          <FormControl>
                            <FormLabel>Especialidad</FormLabel>
                            <Input
                              type="text"
                              name="especialidad"
                              placeholder="Portero, Defensa, etc."
                              value={registroData.especialidad}
                              onChange={handleRegistroChange}
                              size="lg"
                            />
                          </FormControl>
                        )}

                        {registroData.rol === 'representante' && (
                          <FormControl>
                            <FormLabel>Dirección</FormLabel>
                            <Textarea
                              name="direccion"
                              placeholder="Calle, Ciudad..."
                              value={registroData.direccion}
                              onChange={handleRegistroChange}
                              size="lg"
                              rows={2}
                            />
                          </FormControl>
                        )}

                        <FormControl isRequired>
                          <FormLabel>Contraseña</FormLabel>
                          <InputGroup>
                            <InputLeftElement>
                              <FiLock color="gray.400" />
                            </InputLeftElement>
                            <Input
                              type={showRegistroPassword ? 'text' : 'password'}
                              name="password"
                              placeholder="••••••••"
                              value={registroData.password}
                              onChange={handleRegistroChange}
                              size="lg"
                            />
                            <InputRightElement>
                              <IconButton
                                aria-label="Mostrar contraseña"
                                icon={showRegistroPassword ? <FiEyeOff /> : <FiEye />}
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowRegistroPassword(!showRegistroPassword)}
                              />
                            </InputRightElement>
                          </InputGroup>
                        </FormControl>

                        <FormControl isRequired>
                          <FormLabel>Confirmar Contraseña</FormLabel>
                          <InputGroup>
                            <InputLeftElement>
                              <FiLock color="gray.400" />
                            </InputLeftElement>
                            <Input
                              type={showConfirmPassword ? 'text' : 'password'}
                              name="confirmPassword"
                              placeholder="••••••••"
                              value={registroData.confirmPassword}
                              onChange={handleRegistroChange}
                              size="lg"
                            />
                            <InputRightElement>
                              <IconButton
                                aria-label="Mostrar contraseña"
                                icon={showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              />
                            </InputRightElement>
                          </InputGroup>
                        </FormControl>

                        <Button
                          type="submit"
                          colorScheme="green"
                          size="lg"
                          width="full"
                          isLoading={isLoadingRegistro}
                          loadingText="Registrando..."
                        >
                          Registrarse
                        </Button>
                </VStack>
              </form>
                  </TabPanel>
                </TabPanels>
              </Tabs>
            </CardBody>
          </Card>

          <VStack spacing={2} textAlign="center">
            <Text fontSize="sm" color="gray.500">
              © 2024 Gestión Football Pro
            </Text>
          </VStack>
        </VStack>
      </Container>
    </Box>
  )
}
