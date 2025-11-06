'use client'

import React from 'react'
import {
  Box,
  Button,
  Container,
  Heading,
  VStack,
  HStack,
  Text,
  useToast,
  Card,
  CardBody,
  Badge,
  Grid,
  GridItem,
  Image,
  Input,
  Select,
  Flex,
  Stat,
  StatLabel,
  StatNumber,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  FormControl,
  FormLabel,
  InputGroup,
  InputLeftElement
} from '@chakra-ui/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FiShoppingCart, FiShoppingBag, FiSearch, FiStar, FiPackage, FiAlertCircle, FiShoppingCart as FiCart, FiPlus } from 'react-icons/fi'
import { useAuth } from '@/hooks/useAuth'

interface Producto {
  id: string
  nombre: string
  descripcion?: string
  categoria: string
  precio: number
  stock: number
  stockMinimo: number
  imagen?: string
  tallas: string[]
  activo: boolean
}

export default function TiendaPage() {
  const { isAdmin, usuario } = useAuth()
  const [categoriaFilter, setCategoriaFilter] = React.useState('')
  const [searchQuery, setSearchQuery] = React.useState('')
  const { isOpen: isCartOpen, onOpen: onCartOpen, onClose: onCartClose } = useDisclosure()
  const [selectedProduct, setSelectedProduct] = React.useState<Producto | null>(null)
  const [selectedTalla, setSelectedTalla] = React.useState('')
  const [cantidad, setCantidad] = React.useState(1)
  const [carrito, setCarrito] = React.useState<any | null>(null)
  const [loadingCarrito, setLoadingCarrito] = React.useState(false)
  const toast = useToast()
  const queryClient = useQueryClient()

  const { data: productos, isLoading } = useQuery<Producto[]>({
    queryKey: ['productos'],
    queryFn: async () => {
      const res = await fetch('/api/productos?activos=true')
      if (!res.ok) throw new Error('Error al cargar productos')
      return res.json()
    }
  })

  const filteredProductos = React.useMemo(() => {
    if (!productos) return []
    
    let filtered = productos
    
    if (categoriaFilter) {
      filtered = filtered.filter(p => p.categoria === categoriaFilter)
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(p => 
        p.nombre.toLowerCase().includes(query) || 
        p.descripcion?.toLowerCase().includes(query)
      )
    }
    
    return filtered
  }, [productos, categoriaFilter, searchQuery])

  const getCategoriaColor = (categoria: string) => {
    const colors: { [key: string]: string } = {
      'Uniforme': 'blue',
      'Equipamiento': 'green',
      'Accesorio': 'purple'
    }
    return colors[categoria] || 'gray'
  }

  const handleAddToCart = (producto: Producto) => {
    setSelectedProduct(producto)
    setSelectedTalla('')
    setCantidad(1)
    onCartOpen()
  }

  const handleConfirmAddToCart = async () => {
    if (!selectedProduct || !selectedTalla) {
      toast({
        title: 'Error',
        description: 'Por favor selecciona una talla',
        status: 'error',
        duration: 3000
      })
      return
    }

    // Agregar al carrito real
    if (!usuario?.representanteId) {
      toast({ title: 'Inicia sesión', description: 'Debes iniciar sesión como representante para usar el carrito', status: 'warning', duration: 3000 })
      return
    }
    try {
      const res = await fetch('/api/carrito', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          representanteId: usuario.representanteId,
          productoId: selectedProduct.id,
          cantidad,
          talla: selectedTalla
        })
      })
      if (!res.ok) throw new Error('Error al agregar al carrito')
      toast({
        title: 'Producto agregado',
        description: `${selectedProduct.nombre} agregado al carrito`,
        status: 'success',
        duration: 2000
      })
      // Mostrar el carrito
      setSelectedProduct(null)
      setSelectedTalla('')
      setCantidad(1)
      await fetchCarrito()
    } catch (e) {
      toast({ title: 'Error', description: 'No se pudo agregar al carrito', status: 'error', duration: 3000 })
    }
  }

  const fetchCarrito = async () => {
    if (!usuario?.representanteId) return
    try {
      setLoadingCarrito(true)
      const res = await fetch(`/api/carrito?representanteId=${usuario.representanteId}`)
      if (!res.ok) throw new Error('Error al cargar carrito')
      const data = await res.json()
      setCarrito(data)
    } catch (e) {
      console.error(e)
      setCarrito(null)
    } finally {
      setLoadingCarrito(false)
    }
  }

  React.useEffect(() => {
    if (isCartOpen && !selectedProduct) {
      fetchCarrito()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCartOpen, selectedProduct, usuario?.representanteId])

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        {/* Header */}
        <Flex justify="space-between" align="center">
          <Box>
            <Heading size="xl" color="blue.600" mb={2}>
              🛍️ Tienda del Club
            </Heading>
            <Text color="gray.600">
              Uniformes, equipamiento y accesorios
            </Text>
          </Box>
          <HStack spacing={4}>
            {isAdmin && (
              <Button
                leftIcon={<FiPlus />}
                colorScheme="green"
                variant="outline"
                size="lg"
                onClick={() => window.location.href = '/tienda/productos'}
              >
                Gestionar Productos
              </Button>
            )}
            <Button
              leftIcon={<FiShoppingCart />}
              colorScheme="blue"
              size="lg"
              onClick={onCartOpen}
            >
              Ver Carrito
            </Button>
          </HStack>
        </Flex>

        {/* Filtros */}
        <Card>
          <CardBody>
            <Grid templateColumns="repeat(auto-fit, minmax(300px, 1fr))" gap={4}>
              <FormControl>
                <FormLabel>Buscar producto</FormLabel>
                <InputGroup>
                  <InputLeftElement pointerEvents="none">
                    <FiSearch color="gray.300" />
                  </InputLeftElement>
                  <Input
                    placeholder="Buscar por nombre..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </InputGroup>
              </FormControl>
              <FormControl>
                <FormLabel>Categoría</FormLabel>
                <Select
                  value={categoriaFilter}
                  onChange={(e) => setCategoriaFilter(e.target.value)}
                  placeholder="Todas las categorías"
                >
                  <option value="Uniforme">Uniforme</option>
                  <option value="Equipamiento">Equipamiento</option>
                  <option value="Accesorio">Accesorio</option>
                </Select>
              </FormControl>
            </Grid>
          </CardBody>
        </Card>

        {/* Estadísticas */}
        <HStack spacing={6}>
          <Stat>
            <StatLabel>Total Productos</StatLabel>
            <StatNumber color="blue.500">{productos?.length || 0}</StatNumber>
            <StatLabel fontSize="sm">Disponibles</StatLabel>
          </Stat>
          <Stat>
            <StatLabel>Stock Bajo</StatLabel>
            <StatNumber color="orange.500">
              {productos?.filter(p => p.stock <= p.stockMinimo).length || 0}
            </StatNumber>
            <StatLabel fontSize="sm">Requieren atención</StatLabel>
          </Stat>
        </HStack>

        {/* Catálogo de productos */}
        {isLoading ? (
          <Text>Cargando productos...</Text>
        ) : filteredProductos.length > 0 ? (
          <Grid templateColumns="repeat(auto-fill, minmax(280px, 1fr))" gap={6}>
            {filteredProductos.map((producto) => (
              <GridItem key={producto.id}>
                <Card
                  maxW="sm"
                  cursor="pointer"
                  _hover={{ transform: 'translateY(-4px)', shadow: 'lg' }}
                  transition="all 0.2s"
                >
                  <CardBody>
                    <VStack spacing={4} align="stretch">
                      {/* Imagen del producto */}
                      <Box position="relative" borderRadius="md" overflow="hidden" h="200px" bg="gray.100">
                        {producto.imagen ? (
                          <Image
                            src={producto.imagen}
                            alt={producto.nombre}
                            objectFit="cover"
                            h="100%"
                            w="100%"
                          />
                        ) : (
                          <Flex align="center" justify="center" h="100%">
                            <FiPackage size={64} color="gray" />
                          </Flex>
                        )}
                        <Badge
                          position="absolute"
                          top={2}
                          left={2}
                          colorScheme={getCategoriaColor(producto.categoria)}
                        >
                          {producto.categoria}
                        </Badge>
                      </Box>

                      {/* Información del producto */}
                      <VStack align="start" spacing={2}>
                        <Heading size="md">{producto.nombre}</Heading>
                        {producto.descripcion && (
                          <Text fontSize="sm" color="gray.600" noOfLines={2}>
                            {producto.descripcion}
                          </Text>
                        )}
                        <HStack justify="space-between" width="full">
                          <Text fontSize="xl" fontWeight="bold" color="blue.600">
                            ${producto.precio.toFixed(2)}
                          </Text>
                          <Badge
                            colorScheme={producto.stock > 0 ? 'green' : 'red'}
                          >
                            {producto.stock > 0 ? `Stock: ${producto.stock}` : 'Sin stock'}
                          </Badge>
                        </HStack>
                      </VStack>

                      {/* Botón de agregar */}
                      <Button
                        colorScheme="blue"
                        width="full"
                        leftIcon={<FiShoppingBag />}
                        isDisabled={producto.stock === 0}
                        onClick={() => handleAddToCart(producto)}
                      >
                        {producto.stock > 0 ? 'Agregar al Carrito' : 'Sin Stock'}
                      </Button>
                    </VStack>
                  </CardBody>
                </Card>
              </GridItem>
            ))}
          </Grid>
        ) : (
          <Card>
            <CardBody textAlign="center" py={12}>
              <FiPackage size={64} color="gray" style={{ margin: '0 auto 16px' }} />
              <Text fontSize="lg" color="gray.500">
                No se encontraron productos
              </Text>
            </CardBody>
          </Card>
        )}

        {/* Modal para agregar al carrito */}
        <Modal isOpen={isCartOpen} onClose={onCartClose}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>{selectedProduct ? 'Agregar al Carrito' : 'Mi Carrito'}</ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
              {selectedProduct ? (
                <VStack spacing={4} align="stretch">
                  <Text fontWeight="bold">{selectedProduct.nombre}</Text>
                  <Text fontSize="2xl" color="blue.600">
                    ${selectedProduct.precio.toFixed(2)}
                  </Text>

                <FormControl isRequired>
                    <FormLabel>Talla</FormLabel>
                  {(() => {
                    const defaultsUniforme = ['6','8','10','12','14','16','XS','S','M','L','XL','XXL']
                    const defaultsCalzado = ['33','34','35','36','37','38','39','40','41','42','43','44']
                    const defaultsAccesorio = ['Talla Única']
                    const categoria = selectedProduct.categoria?.toLowerCase() || ''
                    const fallback = categoria.includes('calzado')
                      ? defaultsCalzado
                      : categoria.includes('uniforme') || categoria.includes('ropa')
                        ? defaultsUniforme
                        : defaultsAccesorio
                    const tallasDisponibles = (selectedProduct.tallas && selectedProduct.tallas.length > 0)
                      ? selectedProduct.tallas
                      : fallback
                    return (
                      <Select
                        value={selectedTalla}
                        onChange={(e) => setSelectedTalla(e.target.value)}
                        placeholder="Seleccionar talla"
                      >
                        {tallasDisponibles.map((talla) => (
                          <option key={talla} value={talla}>
                            {talla}
                          </option>
                        ))}
                      </Select>
                    )
                  })()}
                  </FormControl>

                  <FormControl>
                    <FormLabel>Cantidad</FormLabel>
                    <NumberInput
                      value={cantidad}
                      onChange={(_, value) => setCantidad(value)}
                      min={1}
                      max={selectedProduct.stock}
                    >
                      <NumberInputField />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                  </FormControl>

                  <Button
                    colorScheme="blue"
                    width="full"
                    onClick={handleConfirmAddToCart}
                  >
                    Agregar al Carrito
                  </Button>
                </VStack>
              ) : (
                <VStack spacing={4} align="stretch">
                  {!usuario?.representanteId ? (
                    <Text>Debes iniciar sesión como representante para ver tu carrito.</Text>
                  ) : loadingCarrito ? (
                    <Text>Cargando carrito...</Text>
                  ) : !carrito || carrito.items?.length === 0 ? (
                    <Text>Tu carrito está vacío.</Text>
                  ) : (
                    <>
                      {carrito.items.map((it: any) => (
                        <Card key={it.id}>
                          <CardBody>
                            <HStack justify="space-between" align="start">
                              <VStack align="start" spacing={0}>
                                <Text fontWeight="bold">{it.producto.nombre}</Text>
                                <Text fontSize="sm" color="gray.600">Talla: {it.talla || 'N/A'}</Text>
                              </VStack>
                              <VStack align="end" spacing={1}>
                                <Text color="blue.600" fontWeight="bold">${it.producto.precio.toFixed(2)}</Text>
                                <HStack>
                                  <Button size="sm" onClick={async () => {
                                    const nueva = Math.max(1, it.cantidad - 1)
                                    await fetch('/api/carrito', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ itemId: it.id, cantidad: nueva }) })
                                    fetchCarrito()
                                  }}>-</Button>
                                  <Text>{it.cantidad}</Text>
                                  <Button size="sm" onClick={async () => {
                                    const nueva = it.cantidad + 1
                                    await fetch('/api/carrito', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ itemId: it.id, cantidad: nueva }) })
                                    fetchCarrito()
                                  }}>+</Button>
                                  <Button size="sm" colorScheme="red" variant="outline" onClick={async () => {
                                    await fetch(`/api/carrito?itemId=${it.id}`, { method: 'DELETE' })
                                    fetchCarrito()
                                  }}>Quitar</Button>
                                </HStack>
                              </VStack>
                            </HStack>
                          </CardBody>
                        </Card>
                      ))}
                      <HStack justify="space-between">
                        <Text fontWeight="bold">Total</Text>
                        <Text fontWeight="bold" color="blue.600">
                          ${carrito.items.reduce((s: number, it: any) => s + it.producto.precio * it.cantidad, 0).toFixed(2)}
                        </Text>
                      </HStack>
                      <Button colorScheme="blue" onClick={async () => {
                        try {
                          const res = await fetch('/api/carrito/checkout', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ representanteId: usuario!.representanteId })
                          })
                          if (!res.ok) throw new Error('No se pudo generar el pago')
                          const data = await res.json()
                          toast({ title: 'Pago generado', description: 'Se creó una deuda en Pagos. Puedes completar el pago ahora.', status: 'success', duration: 3000 })
                          onCartClose()
                          window.location.href = '/pago-publico'
                        } catch (e) {
                          toast({ title: 'Error', description: 'No se pudo generar el pago', status: 'error', duration: 3000 })
                        }
                      }}>
                        Pagar / Generar Pago
                      </Button>
                    </>
                  )}
                </VStack>
              )}
            </ModalBody>
          </ModalContent>
        </Modal>
      </VStack>
    </Container>
  )
}
