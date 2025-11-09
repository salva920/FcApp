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
  Stack
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
  return (
    <Box overflowX="auto">
      <Table variant="simple" size="md" minW="900px">
        <Thead>
          <Tr>
            <Th>Nombre Completo</Th>
            <Th>Cédula</Th>
            <Th>Fecha Nacimiento</Th>
            <Th>Categoría</Th>
            <Th>Nivel</Th>
            <Th>Representante</Th>
            <Th>Estado</Th>
            <Th>Ver Documentos</Th>
            {onDesarrollo && <Th>Desarrollo</Th>}
            <Th>Acciones</Th>
          </Tr>
        </Thead>
        <Tbody>
          {ninos?.map((nino) => (
            <Tr key={nino.id}>
              <Td>
                <VStack align="start" spacing={1}>
                  <Text fontWeight="bold">{nino.nombre} {nino.apellido}</Text>
                  {nino.alergias && (
                    <Text fontSize="sm" color="red.500">
                      ⚠️ {nino.alergias}
                    </Text>
                  )}
                </VStack>
              </Td>
              <Td>{nino.cedula || '-'}</Td>
              <Td>{format(new Date(nino.fechaNacimiento), 'dd/MM/yyyy', { locale: es })}</Td>
              <Td>
                <Badge colorScheme={getCategoriaColor(nino.categoria)}>
                  {nino.categoria}
                </Badge>
              </Td>
              <Td>
                <Badge colorScheme={getNivelColor(nino.nivel)}>
                  {nino.nivel}
                </Badge>
              </Td>
              <Td>
                <VStack align="start" spacing={1}>
                  <Text fontSize="sm" fontWeight="bold">{nino.representante.nombre}</Text>
                  <Text fontSize="xs" color="gray.500">{nino.representante.cedula}</Text>
                  <Text fontSize="xs" color="gray.500">{nino.representante.telefono}</Text>
                </VStack>
              </Td>
              <Td>
                <Badge colorScheme={nino.activo ? 'green' : 'red'}>
                  {nino.activo ? 'Activo' : 'Inactivo'}
                </Badge>
              </Td>
              <Td>
                <Button
                  size="sm"
                  leftIcon={<FiEye />}
                  colorScheme="blue"
                  onClick={() => onView(nino)}
                >
                  Ver Documentos
                </Button>
              </Td>
              {onDesarrollo && (
                <Td>
                  <Button
                    size="sm"
                    leftIcon={<FiTrendingUp />}
                    colorScheme="purple"
                    onClick={() => onDesarrollo(nino)}
                  >
                    Desarrollo
                  </Button>
                </Td>
              )}
              <Td>
                <Stack
                  direction={{ base: 'column', sm: 'row' }}
                  spacing={2}
                  align={{ base: 'stretch', sm: 'center' }}
                >
                  <Button
                    size="sm"
                    leftIcon={<FiEdit2 />}
                    onClick={() => onEdit(nino)}
                    width={{ base: '100%', sm: 'auto' }}
                  >
                    Editar
                  </Button>
                  {onDelete && (
                    <Button
                      size="sm"
                      leftIcon={<FiTrash2 />}
                      colorScheme="red"
                      onClick={() => onDelete(nino.id)}
                      width={{ base: '100%', sm: 'auto' }}
                    >
                      Eliminar
                    </Button>
                  )}
                </Stack>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  )
}
