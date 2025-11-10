'use client'

import React, { useState, useEffect, useMemo } from 'react'
import NextImage from 'next/image'
import logoImg from '../../../public/photo_2025-11-09_17-03-16.jpg'
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
  useColorMode,
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
  Textarea,
  Image
} from '@chakra-ui/react'
import { FiMail, FiLock, FiEye, FiEyeOff, FiUser, FiPhone, FiSun, FiMoon } from 'react-icons/fi'
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

  const { colorMode, toggleColorMode } = useColorMode()
  const gradientBg = useColorModeValue(
    'linear(to-br, rgba(255,255,255,0.85), rgba(255,231,214,0.85))',
    'linear(to-br, rgba(5,5,5,0.85), rgba(26,0,0,0.85))'
  )
  const haloGradient = useColorModeValue(
    'radial(circle at top, rgba(255,99,71,0.25), rgba(0,0,0,0))',
    'radial(circle at top, rgba(255,79,90,0.45), rgba(0,0,0,0))'
  )
  const glassCardBg = useColorModeValue('rgba(255,255,255,0.85)', 'rgba(18,18,18,0.78)')
  const glassBorderColor = useColorModeValue('rgba(255,255,255,0.6)', 'rgba(255,255,255,0.12)')
  const decorativeColor = useColorModeValue('rgba(200,200,200,0.4)', 'rgba(255,255,255,0.08)')
  const bodyTextColor = useColorModeValue('gray.800', 'whiteAlpha.900')
  const subtitleGradient = useColorModeValue(
    'linear(to-r, red.500, orange.400)',
    'linear(to-r, red.400, orange.300)'
  )
  const isDark = colorMode === 'dark'

  const inputStyles = useMemo(() => {
    if (colorMode === 'light') {
      return {
        bg: 'white',
        borderColor: 'gray.200',
        color: 'gray.800',
        _placeholder: { color: 'gray.500' },
        _hover: { borderColor: 'red.300' },
        _focus: {
          borderColor: 'red.400',
          boxShadow: '0 0 0 1px rgba(244,71,71,0.4)'
        }
      }
    }
    return {
      bg: 'rgba(255,255,255,0.08)',
      borderColor: 'whiteAlpha.200',
      color: 'whiteAlpha.900',
      _placeholder: { color: 'whiteAlpha.600' },
      _hover: { borderColor: 'red.400' },
      _focus: {
        borderColor: 'red.500',
        boxShadow: '0 0 0 1px rgba(244,71,71,0.6)'
      }
    }
  }, [colorMode])

  const selectStyles = useMemo(() => {
    if (colorMode === 'light') {
      return {
        bg: 'white',
        borderColor: 'gray.200',
        color: 'gray.800',
        _placeholder: { color: 'gray.500' },
        _hover: { borderColor: 'red.300' },
        _focus: { borderColor: 'red.400', boxShadow: '0 0 0 1px rgba(244,71,71,0.4)' }
      }
    }
    return {
      bg: 'rgba(255,255,255,0.08)',
      borderColor: 'whiteAlpha.200',
      color: 'whiteAlpha.900',
      _hover: { borderColor: 'red.400' },
      _focus: { borderColor: 'red.500', boxShadow: '0 0 0 1px rgba(244,71,71,0.6)' }
    }
  }, [colorMode])

  const textAreaStyles = useMemo(() => {
    if (colorMode === 'light') {
      return {
        bg: 'white',
        borderColor: 'gray.200',
        color: 'gray.800',
        _placeholder: { color: 'gray.500' },
        _hover: { borderColor: 'red.300' },
        _focus: { borderColor: 'red.400', boxShadow: '0 0 0 1px rgba(244,71,71,0.4)' }
      }
    }
    return {
      bg: 'rgba(255,255,255,0.08)',
      borderColor: 'whiteAlpha.200',
      color: 'whiteAlpha.900',
      _placeholder: { color: 'whiteAlpha.600' },
      _hover: { borderColor: 'red.400' },
      _focus: { borderColor: 'red.500', boxShadow: '0 0 0 1px rgba(244,71,71,0.6)' }
    }
  }, [colorMode])

  const labelColor = useColorModeValue('gray.700', 'whiteAlpha.900')
  const iconColor = useColorModeValue('gray.400', 'whiteAlpha.600')
  const toggleColor = useColorModeValue('gray.600', 'yellow.200')
  const tabInactiveColor = useColorModeValue('gray.500', 'whiteAlpha.700')
  const tabSelectedColor = useColorModeValue('red.500', 'red.300')
  const tabBorderColor = useColorModeValue('gray.200', 'whiteAlpha.200')
  const footerColor = useColorModeValue('gray.500', 'whiteAlpha.600')
  const buttonGradient = useColorModeValue('linear(to-r, red.500, orange.400)', 'linear(to-r, red.600, orange.400)')
  const buttonHoverGradient = useColorModeValue('linear(to-r, red.600, orange.500)', 'linear(to-r, red.500, orange.500)')

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
      {/* Toggle modo */}
      <Box position="absolute" top={6} right={6}>
        <IconButton
          aria-label="Cambiar modo de color"
          icon={colorMode === 'light' ? <FiMoon /> : <FiSun />}
          variant="ghost"
          color={toggleColor}
          onClick={toggleColorMode}
          _hover={{ transform: 'scale(1.05)' }}
          transition="transform 0.2s ease"
        />
      </Box>

      {/* Elementos decorativos */}
      <Box position="absolute" top="10%" left="5%" opacity={1}>
        <Text fontSize="6xl" color={decorativeColor} transform="rotate(-15deg)">⚽</Text>
      </Box>
      <Box position="absolute" top="20%" right="10%" opacity={1}>
        <Text fontSize="4xl" color={decorativeColor} transform="rotate(15deg)">🏆</Text>
      </Box>
      <Box position="absolute" bottom="15%" left="15%" opacity={1}>
        <Text fontSize="5xl" color={decorativeColor} transform="rotate(-10deg)">⚽</Text>
      </Box>

      <Container maxW="md" py={12}>
        <VStack spacing={8}>
          <VStack spacing={5} textAlign="center" position="relative">
            <Box
              position="absolute"
              top={{ base: '40px', md: '20px' }}
              left="50%"
              transform="translateX(-50%)"
              width={{ base: '220px', md: '260px' }}
              height={{ base: '220px', md: '260px' }}
              bgGradient={haloGradient}
              filter="blur(40px)"
              zIndex={0}
            />
            <Box
              position="relative"
              width={{ base: '140px', md: '160px' }}
              height={{ base: '140px', md: '160px' }}
              borderRadius="full"
              bg="black"
              overflow="hidden"
              boxShadow="xl"
              mx="auto"
              zIndex={1}
            >
              <NextImage
                src={logoImg}
                alt="Escudo Tigres F.C. Anzoátegui"
                fill
                style={{ objectFit: 'contain' }}
                priority
                sizes="160px"
              />
            </Box>
            <Heading
              as="h1"
              size="lg"
              fontWeight="700"
              color={isDark ? 'white' : 'transparent'}
              bgGradient={!isDark ? subtitleGradient : undefined}
              bgClip={!isDark ? 'text' : undefined}
            >
              Bienvenido a Tigres F.C.
            </Heading>
            <Text
              fontSize={{ base: 'md', md: 'lg' }}
              color={isDark ? 'whiteAlpha.900' : 'transparent'}
              maxW="md"
              bgGradient={!isDark ? subtitleGradient : undefined}
              bgClip={!isDark ? 'text' : undefined}
              fontWeight="semibold"
            >
              Plataforma oficial para representantes, profesores y administradores del club Tigres F.C. Anzoátegui.
            </Text>
          </VStack>

          <Card
            w="full"
            bg={glassCardBg}
            borderColor={glassBorderColor}
            borderWidth="1px"
            shadow="2xl"
            borderRadius="2xl"
            backdropFilter="blur(14px)"
            transition="transform 0.3s ease, box-shadow 0.3s ease"
            color={bodyTextColor}
            _hover={{
              transform: 'translateY(-4px)',
              boxShadow: '3xl'
            }}
          >
            <CardBody p={0}>
              <Tabs defaultIndex={0} colorScheme="red">
                <TabList borderBottomColor={tabBorderColor}>
                  <Tab
                    flex={1}
                    fontWeight="semibold"
                    color={tabInactiveColor}
                    _selected={{
                      color: tabSelectedColor,
                      borderColor: 'red.400'
                    }}
                  >
                    Iniciar Sesión
                  </Tab>
                  <Tab
                    flex={1}
                    fontWeight="semibold"
                    color={tabInactiveColor}
                    _selected={{
                      color: tabSelectedColor,
                      borderColor: 'red.400'
                    }}
                  >
                    Registrarse
                  </Tab>
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
                          <FormLabel color={labelColor}>Email</FormLabel>
                    <InputGroup>
                      <InputLeftElement>
                        <FiMail color={iconColor} />
                      </InputLeftElement>
                      <Input
                        {...inputStyles}
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
                          <FormLabel color={labelColor}>Contraseña</FormLabel>
                    <InputGroup>
                      <InputLeftElement>
                        <FiLock color={iconColor} />
                      </InputLeftElement>
                      <Input
                        {...inputStyles}
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
                          color={tabInactiveColor}
                          onClick={() => setShowPassword(!showPassword)}
                        />
                      </InputRightElement>
                    </InputGroup>
                  </FormControl>

                  <Button
                    type="submit"
                    size="lg"
                    width="full"
                    isLoading={isLoading}
                    loadingText="Iniciando sesión..."
                    bgGradient={buttonGradient}
                    color="white"
                    _hover={{
                      bgGradient: buttonHoverGradient,
                      transform: 'translateY(-1px)',
                      boxShadow: 'lg'
                    }}
                    _active={{
                      transform: 'translateY(0)'
                    }}
                    transition="all 0.2s ease"
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
                          <FormLabel color={labelColor}>Tipo de Usuario</FormLabel>
                          <Select
                            {...selectStyles}
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
                          <FormLabel color={labelColor}>Nombre Completo</FormLabel>
                          <InputGroup>
                            <InputLeftElement>
                              <FiUser color={iconColor} />
                            </InputLeftElement>
                            <Input
                              {...inputStyles}
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
                          <FormLabel color={labelColor}>Email</FormLabel>
                          <InputGroup>
                            <InputLeftElement>
                              <FiMail color={iconColor} />
                            </InputLeftElement>
                            <Input
                              {...inputStyles}
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
                            <FormLabel color={labelColor}>Cédula</FormLabel>
                            <Input
                              {...inputStyles}
                              type="text"
                              name="cedula"
                              placeholder="12345678"
                              value={registroData.cedula}
                              onChange={handleRegistroChange}
                              size="lg"
                            />
                          </FormControl>

                          <FormControl isRequired>
                            <FormLabel color={labelColor}>Teléfono</FormLabel>
                            <InputGroup>
                              <InputLeftElement>
                                <FiPhone color={iconColor} />
                              </InputLeftElement>
                              <Input
                                {...inputStyles}
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
                            <FormLabel color={labelColor}>Especialidad</FormLabel>
                            <Input
                              {...inputStyles}
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
                            <FormLabel color={labelColor}>Dirección</FormLabel>
                            <Textarea
                              {...textAreaStyles}
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
                          <FormLabel color={labelColor}>Contraseña</FormLabel>
                          <InputGroup>
                            <InputLeftElement>
                              <FiLock color={iconColor} />
                            </InputLeftElement>
                            <Input
                              {...inputStyles}
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
                                color={tabInactiveColor}
                                onClick={() => setShowRegistroPassword(!showRegistroPassword)}
                              />
                            </InputRightElement>
                          </InputGroup>
                        </FormControl>

                        <FormControl isRequired>
                          <FormLabel color={labelColor}>Confirmar Contraseña</FormLabel>
                          <InputGroup>
                            <InputLeftElement>
                              <FiLock color={iconColor} />
                            </InputLeftElement>
                            <Input
                              {...inputStyles}
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
                                color={tabInactiveColor}
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              />
                            </InputRightElement>
                          </InputGroup>
                        </FormControl>

                        <Button
                          type="submit"
                          size="lg"
                          width="full"
                          isLoading={isLoadingRegistro}
                          loadingText="Registrando..."
                          bgGradient={buttonGradient}
                          color="white"
                          _hover={{
                            bgGradient: buttonHoverGradient,
                            transform: 'translateY(-1px)',
                            boxShadow: 'lg'
                          }}
                          _active={{
                            transform: 'translateY(0)'
                          }}
                          transition="all 0.2s ease"
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
            <Text fontSize="sm" color={footerColor}>
              © 2025 Gestión Football Pro
            </Text>
          </VStack>
        </VStack>
      </Container>
    </Box>
  )
}
