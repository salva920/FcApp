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
  Tag,
  TagLabel,
  TagCloseButton,
  Divider,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  FormControl,
  FormLabel,
  Input,
  Select,
  FormHelperText,
  NumberInput,
  NumberInputField,
  Checkbox,
  Alert,
  AlertIcon,
  Flex
} from '@chakra-ui/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FiPlus, FiEdit, FiTrash2, FiPackage, FiAlertTriangle } from 'react-icons/fi'
import FileUpload from '@/components/FileUpload'

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

export default function ProductosPage() {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [editingProduct, setEditingProduct] = React.useState<Producto | null>(null)
  const [formData, setFormData] = React.useState({
    nombre: '',
    descripcion: '',
    categoria: 'Uniforme',
    precio: '',
    stock: '',
    stockMinimo: '',
    imagen: '',
    tallas: [] as string[],
    activo: true
  })
  const [nuevaTalla, setNuevaTalla] = React.useState('')
  const [tallaPersonalizada, setTallaPersonalizada] = React.useState('')
  const toast = useToast()
  const queryClient = useQueryClient()

  const { data: productos } = useQuery<Producto[]>({
    queryKey: ['productos'],
    queryFn: async () => {
      const res = await fetch('/api/productos')
      if (!res.ok) throw new Error('Error al cargar productos')
      return res.json()
    }
  })

  const { data: alertasStock } = useQuery<any>({
    queryKey: ['alertas-stock'],
    queryFn: async () => {
      const res = await fetch('/api/productos/alertas-stock')
      if (!res.ok) throw new Error('Error al cargar alertas')
      return res.json()
    }
  })

  const handleEdit = (producto: Producto) => {
    setEditingProduct(producto)
    setFormData({
      nombre: producto.nombre,
      descripcion: producto.descripcion || '',
      categoria: producto.categoria,
      precio: producto.precio.toString(),
      stock: producto.stock.toString(),
      stockMinimo: producto.stockMinimo.toString(),
      imagen: producto.imagen || '',
      tallas: producto.tallas,
      activo: producto.activo
    })
    onOpen()
  }

  const handleNew = () => {
    setEditingProduct(null)
    setFormData({
      nombre: '',
      descripcion: '',
      categoria: 'Uniforme',
      precio: '',
      stock: '',
      stockMinimo: '',
      imagen: '',
      tallas: [],
      activo: true
    })
    setNuevaTalla('')
    setTallaPersonalizada('')
    onOpen()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const url = editingProduct ? `/api/productos/${editingProduct.id}` : '/api/productos'
      const method = editingProduct ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          precio: parseFloat(formData.precio),
          stock: parseInt(formData.stock),
          stockMinimo: parseInt(formData.stockMinimo)
        })
      })

      if (!res.ok) throw new Error('Error al guardar producto')

      toast({
        title: 'Producto guardado',
        description: editingProduct ? 'Producto actualizado' : 'Producto creado',
        status: 'success',
        duration: 3000
      })

      queryClient.invalidateQueries({ queryKey: ['productos'] })
      queryClient.invalidateQueries({ queryKey: ['alertas-stock'] })
      onClose()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al guardar producto',
        status: 'error',
        duration: 3000
      })
    }
  }

  const getCategoriaColor = (categoria: string) => {
    const colors: { [key: string]: string } = {
      'Uniforme': 'blue',
      'Equipamiento': 'green',
      'Accesorio': 'purple'
    }
    return colors[categoria] || 'gray'
  }

  const getStockColor = (stock: number, stockMinimo: number) => {
    if (stock === 0) return 'red'
    if (stock <= stockMinimo) return 'orange'
    return 'green'
  }

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        {/* Header */}
        <Flex justify="space-between" align="center">
          <Heading size="xl" color="blue.600">Gestión de Productos</Heading>
          <Button leftIcon={<FiPlus />} colorScheme="blue" onClick={handleNew}>
            Nuevo Producto
          </Button>
        </Flex>

        {/* Alertas de Stock */}
        {alertasStock && alertasStock.estadisticas.productosBajoStock > 0 && (
          <Alert status="warning">
            <AlertIcon />
            <Box>
              <Text fontWeight="bold">
                {alertasStock.estadisticas.productosBajoStock} productos con stock bajo
              </Text>
              <Text fontSize="sm">
                {alertasStock.estadisticas.productosSinStock} sin stock • {alertasStock.estadisticas.productosCriticos} críticos
              </Text>
            </Box>
          </Alert>
        )}

        {/* Tabla de Productos */}
        <Card>
          <CardBody>
            <Box overflowX="auto">
              <Table variant="simple" size="sm">
                <Thead>
                  <Tr>
                    <Th>Nombre</Th>
                    <Th>Categoría</Th>
                    <Th>Precio</Th>
                    <Th>Stock</Th>
                    <Th>Estado</Th>
                    <Th>Acciones</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {productos?.map((producto) => (
                    <Tr key={producto.id}>
                      <Td fontWeight="bold">{producto.nombre}</Td>
                      <Td>
                        <Badge colorScheme={getCategoriaColor(producto.categoria)}>
                          {producto.categoria}
                        </Badge>
                      </Td>
                      <Td>${producto.precio.toFixed(2)}</Td>
                      <Td>
                        <Badge colorScheme={getStockColor(producto.stock, producto.stockMinimo)}>
                          {producto.stock}
                        </Badge>
                      </Td>
                      <Td>
                        <Badge colorScheme={producto.activo ? 'green' : 'red'}>
                          {producto.activo ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </Td>
                      <Td>
                        <HStack spacing={2}>
                          <Button
                            size="sm"
                            colorScheme="blue"
                            leftIcon={<FiEdit />}
                            onClick={() => handleEdit(producto)}
                          >
                            Editar
                          </Button>
                        </HStack>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          </CardBody>
        </Card>

        {/* Modal de Formulario */}
        <Modal isOpen={isOpen} onClose={onClose} size="lg">
          <ModalOverlay />
          <ModalContent>
            <form onSubmit={handleSubmit}>
              <ModalHeader>
                {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
              </ModalHeader>
              <ModalCloseButton />
              <ModalBody pb={6}>
                <VStack spacing={5} align="stretch">
                  {/* Información básica */}
                  <Text fontWeight="semibold" color="gray.600">Información básica</Text>
                  <FormControl isRequired>
                    <FormLabel>Nombre</FormLabel>
                    <Input
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Descripción</FormLabel>
                    <Input
                      value={formData.descripcion}
                      onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    />
                  </FormControl>

                  <HStack spacing={4} width="full">
                    <FormControl isRequired>
                      <FormLabel>Categoría</FormLabel>
                      <Select
                        value={formData.categoria}
                        onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                      >
                        <option value="Uniforme">Uniforme</option>
                        <option value="Equipamiento">Equipamiento</option>
                        <option value="Accesorio">Accesorio</option>
                      </Select>
                    </FormControl>

                    <FormControl isRequired>
                      <FormLabel>Precio</FormLabel>
                      <NumberInput step={0.5} min={0} value={parseFloat(formData.precio || '0')}
                        onChange={(_, val) => setFormData({ ...formData, precio: String(val) })}>
                        <NumberInputField />
                      </NumberInput>
                      <FormHelperText>En dólares o moneda configurada</FormHelperText>
                    </FormControl>
                  </HStack>

                  <HStack spacing={4} width="full">
                    <FormControl isRequired>
                      <FormLabel>Stock</FormLabel>
                      <NumberInput min={0} value={parseInt(formData.stock || '0')}
                        onChange={(_, val) => setFormData({ ...formData, stock: String(val) })}>
                        <NumberInputField />
                      </NumberInput>
                    </FormControl>

                    <FormControl isRequired>
                      <FormLabel>Stock Mínimo</FormLabel>
                      <NumberInput min={0} value={parseInt(formData.stockMinimo || '0')}
                        onChange={(_, val) => setFormData({ ...formData, stockMinimo: String(val) })}>
                        <NumberInputField />
                      </NumberInput>
                      <FormHelperText>Nivel para alertas de bajo stock</FormHelperText>
                    </FormControl>
                  </HStack>

                  <Divider />

                  {/* Imagen */}
                  <Text fontWeight="semibold" color="gray.600">Imagen</Text>
                  <FormControl>
                    <FormLabel>Imagen</FormLabel>
                    <FileUpload
                      onFileUploaded={(fileUrl) => setFormData({ ...formData, imagen: fileUrl })}
                      currentFile={formData.imagen}
                      accept="image/*"
                      label="Subir Imagen"
                    />
                  </FormControl>

                  {/* Tallas / Medidas */}
                  <Divider />
                  <Text fontWeight="semibold" color="gray.600">Tallas / Medidas</Text>
                  <FormControl>
                    <FormLabel>Tallas o Medidas disponibles</FormLabel>
                    <HStack spacing={3} align="start" width="full">
                      <Select
                        placeholder="Selecciona talla/medida"
                        value={nuevaTalla}
                        onChange={(e) => setNuevaTalla(e.target.value)}
                      >
                        {/* Ropa */}
                        <option value="XS">XS</option>
                        <option value="S">S</option>
                        <option value="M">M</option>
                        <option value="L">L</option>
                        <option value="XL">XL</option>
                        <option value="XXL">XXL</option>
                        {/* Calzado (ejemplos) */}
                        <option value="34">34</option>
                        <option value="35">35</option>
                        <option value="36">36</option>
                        <option value="37">37</option>
                        <option value="38">38</option>
                        <option value="39">39</option>
                        <option value="40">40</option>
                        <option value="41">41</option>
                        <option value="42">42</option>
                        <option value="43">43</option>
                        <option value="44">44</option>
                        <option value="45">45</option>
                        <option value="46">46</option>
                        {/* Accesorios comunes */}
                        <option value="Talla Única">Talla Única</option>
                      </Select>
                      <Button size="sm" colorScheme="blue"
                        onClick={() => {
                          if (!nuevaTalla) return
                          if (!formData.tallas.includes(nuevaTalla)) {
                            setFormData({ ...formData, tallas: [...formData.tallas, nuevaTalla] })
                          }
                          setNuevaTalla('')
                        }}
                      >
                        Agregar
                      </Button>
                    </HStack>

                    <HStack spacing={3} mt={3} align="start" width="full">
                      <Input
                        placeholder="Agregar talla/medida personalizada (ej: 41.5, Juvenil, #5)"
                        value={tallaPersonalizada}
                        onChange={(e) => setTallaPersonalizada(e.target.value)}
                      />
                      <Button size="sm" variant="outline" colorScheme="pink"
                        onClick={() => {
                          const val = tallaPersonalizada.trim()
                          if (!val) return
                          if (!formData.tallas.includes(val)) {
                            setFormData({ ...formData, tallas: [...formData.tallas, val] })
                          }
                          setTallaPersonalizada('')
                        }}
                      >
                        Agregar personalizada
                      </Button>
                    </HStack>

                    {!!formData.tallas.length && (
                      <HStack spacing={2} wrap="wrap" mt={3}>
                        {formData.tallas.map((t) => (
                          <Tag key={t} colorScheme="blue" size="sm" borderRadius="full">
                            <TagLabel>{t}</TagLabel>
                            <TagCloseButton
                              onClick={() =>
                                setFormData({
                                  ...formData,
                                  tallas: formData.tallas.filter((x) => x !== t)
                                })
                              }
                            />
                          </Tag>
                        ))}
                      </HStack>
                    )}
                  </FormControl>

                  <Divider />
                  <FormControl>
                    <Checkbox
                      isChecked={formData.activo}
                      onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                    >
                      Producto activo
                    </Checkbox>
                  </FormControl>

                  <Button type="submit" colorScheme="blue" width="full">
                    {editingProduct ? 'Actualizar' : 'Crear'} Producto
                  </Button>
                </VStack>
              </ModalBody>
            </form>
          </ModalContent>
        </Modal>
      </VStack>
    </Container>
  )
}
