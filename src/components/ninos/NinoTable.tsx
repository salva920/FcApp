import React from 'react'
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Text,
  VStack,
  Badge,
  Button,
  HStack,
  Stack,
  SimpleGrid,
  Card,
  CardBody,
  Divider,
  useBreakpointValue
} from '@chakra-ui/react'
import { FiEdit2, FiTrash2, FiEye, FiTrendingUp } from 'react-icons/fi'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface Nino {
  id: string
  nombre: string
  apellido: string
  fechaNacimiento: string
  cedula?: string
  alergias?: string
  emergencia?: string
  categoria: string
  nivel: string
  activo: boolean
  representante: {
    id: string
    nombre: string
    cedula: string
    email: string
    telefono: string
  }
  cedulaFile?: string
  partidaFile?: string
  fotoFile?: string
  faceDescriptor?: string
  faceImageUrl?: string
}

interface NinoTableProps {
  ninos: Nino[]
  onEdit: (nino: Nino) => void
  onDelete?: (id: string) => void
  onView: (nino: Nino) => void
  onDesarrollo?: (nino: Nino) => void
  getCategoriaColor: (categoria: string) => string
  getNivelColor: (nivel: string) => string
}

export const NinoTable: React.FC<NinoTableProps> = ({
  ninos,
  onEdit,
  onDelete,
  onView,
  onDesarrollo,
  getCategoriaColor,
  getNivelColor
}) => {
  const showTable = useBreakpointValue({ base: false, lg: true })

  // Vista de Cards para móvil
  if (!showTable) {
    return (
      <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4}>
        {ninos?.map((nino) => (
          <Card key={nino.id} size="sm">
            <CardBody>
              <VStack align="stretch" spacing={3}>
                {/* Header con nombre y estado */}
                <HStack justify="space-between" align="start">
                  <VStack align="start" spacing={1} flex={1}>
                    <Text fontWeight="bold" fontSize="lg">
                      {nino.nombre} {nino.apellido}
                    </Text>
                    {nino.alergias && (
                      <Text fontSize="xs" color="red.500">
                        ⚠️ {nino.alergias}
                      </Text>
                    )}
                  </VStack>
                  <Badge colorScheme={nino.activo ? 'green' : 'red'}>
                    {nino.activo ? 'Activo' : 'Inactivo'}
                  </Badge>
                </HStack>

                <Divider />

                {/* Información básica */}
                <VStack align="stretch" spacing={2}>
                  <HStack justify="space-between">
                    <Text fontSize="sm" color="gray.600">Cédula:</Text>
                    <Text fontSize="sm" fontWeight="medium">{nino.cedula || '-'}</Text>
                  </HStack>
                  <HStack justify="space-between">
                    <Text fontSize="sm" color="gray.600">Fecha Nacimiento:</Text>
                    <Text fontSize="sm" fontWeight="medium">
                      {format(new Date(nino.fechaNacimiento), 'dd/MM/yyyy', { locale: es })}
                    </Text>
                  </HStack>
                  <HStack justify="space-between">
                    <Text fontSize="sm" color="gray.600">Categoría:</Text>
                    <Badge colorScheme={getCategoriaColor(nino.categoria)}>
                      {nino.categoria}
                    </Badge>
                  </HStack>
                  <HStack justify="space-between">
                    <Text fontSize="sm" color="gray.600">Nivel:</Text>
                    <Badge colorScheme={getNivelColor(nino.nivel)}>
                      {nino.nivel}
                    </Badge>
                  </HStack>
                </VStack>

                <Divider />

                {/* Representante */}
                <Box>
                  <Text fontSize="sm" color="gray.600" mb={1}>Representante:</Text>
                  <VStack align="start" spacing={0.5}>
                    <Text fontSize="sm" fontWeight="bold">{nino.representante.nombre}</Text>
                    <Text fontSize="xs" color="gray.500">{nino.representante.cedula}</Text>
                    <Text fontSize="xs" color="gray.500">{nino.representante.telefono}</Text>
                  </VStack>
                </Box>

                <Divider />

                {/* Acciones */}
                <VStack spacing={2} align="stretch">
                  <Button
                    size="sm"
                    leftIcon={<FiEye />}
                    colorScheme="blue"
                    onClick={() => onView(nino)}
                    width="100%"
                  >
                    Ver Documentos
                  </Button>
                  {onDesarrollo && (
                    <Button
                      size="sm"
                      leftIcon={<FiTrendingUp />}
                      colorScheme="purple"
                      onClick={() => onDesarrollo(nino)}
                      width="100%"
                    >
                      Desarrollo
                    </Button>
                  )}
                  <Stack direction="row" spacing={2}>
                    <Button
                      size="sm"
                      leftIcon={<FiEdit2 />}
                      onClick={() => onEdit(nino)}
                      flex={1}
                    >
                      Editar
                    </Button>
                    {onDelete && (
                      <Button
                        size="sm"
                        leftIcon={<FiTrash2 />}
                        colorScheme="red"
                        onClick={() => onDelete(nino.id)}
                        flex={1}
                      >
                        Eliminar
                      </Button>
                    )}
                  </Stack>
                </VStack>
              </VStack>
            </CardBody>
          </Card>
        ))}
      </SimpleGrid>
    )
  }

  // Vista de Tabla para desktop
  return (
    <Box overflowX="auto">
      <Table variant="simple" size="md" minW="1000px">
        <Thead>
          <Tr>
            <Th>Nombre</Th>
            <Th>Cédula</Th>
            <Th>Nacimiento</Th>
            <Th>Categoría</Th>
            <Th>Nivel</Th>
            <Th>Representante</Th>
            <Th>Estado</Th>
            <Th>Acciones</Th>
          </Tr>
        </Thead>
        <Tbody>
          {ninos?.map((nino) => (
            <Tr key={nino.id}>
              <Td>
                <VStack align="start" spacing={1}>
                  <Text fontWeight="bold" fontSize="sm">
                    {nino.nombre} {nino.apellido}
                  </Text>
                  {nino.alergias && (
                    <Text fontSize="xs" color="red.500">
                      ⚠️ {nino.alergias}
                    </Text>
                  )}
                </VStack>
              </Td>
              <Td fontSize="sm">{nino.cedula || '-'}</Td>
              <Td fontSize="sm">
                {format(new Date(nino.fechaNacimiento), 'dd/MM/yyyy', { locale: es })}
              </Td>
              <Td>
                <Badge colorScheme={getCategoriaColor(nino.categoria)} fontSize="xs">
                  {nino.categoria}
                </Badge>
              </Td>
              <Td>
                <Badge colorScheme={getNivelColor(nino.nivel)} fontSize="xs">
                  {nino.nivel}
                </Badge>
              </Td>
              <Td>
                <VStack align="start" spacing={0.5}>
                  <Text fontSize="xs" fontWeight="bold">{nino.representante.nombre}</Text>
                  <Text fontSize="xs" color="gray.500">{nino.representante.cedula}</Text>
                </VStack>
              </Td>
              <Td>
                <Badge colorScheme={nino.activo ? 'green' : 'red'} fontSize="xs">
                  {nino.activo ? 'Activo' : 'Inactivo'}
                </Badge>
              </Td>
              <Td>
                <HStack spacing={1} flexWrap="wrap">
                  <Button
                    size="xs"
                    leftIcon={<FiEye />}
                    colorScheme="blue"
                    onClick={() => onView(nino)}
                  >
                    Ver
                  </Button>
                  {onDesarrollo && (
                    <Button
                      size="xs"
                      leftIcon={<FiTrendingUp />}
                      colorScheme="purple"
                      onClick={() => onDesarrollo(nino)}
                    >
                      Desarrollo
                    </Button>
                  )}
                  <Button
                    size="xs"
                    leftIcon={<FiEdit2 />}
                    onClick={() => onEdit(nino)}
                  >
                    Editar
                  </Button>
                  {onDelete && (
                    <Button
                      size="xs"
                      leftIcon={<FiTrash2 />}
                      colorScheme="red"
                      onClick={() => onDelete(nino.id)}
                    >
                      Eliminar
                    </Button>
                  )}
                </HStack>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  )
}
