import React from 'react'
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  VStack,
  HStack,
  Text,
  Badge,
  Box,
  Button,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription
} from '@chakra-ui/react'
import { FiFile, FiImage } from 'react-icons/fi'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useColorModeValue } from '@chakra-ui/react'

interface Nino {
  id: string
  nombre: string
  apellido: string
  fechaNacimiento: string
  cedula: string
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

interface NinoViewModalProps {
  isOpen: boolean
  onClose: () => void
  selectedNino: Nino | null
  getCategoriaColor: (categoria: string) => string
}

export const NinoViewModal: React.FC<NinoViewModalProps> = ({
  isOpen,
  onClose,
  selectedNino,
  getCategoriaColor
}) => {
  const borderColor = useColorModeValue('gray.200', 'gray.600')

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Documentos de {selectedNino?.nombre} {selectedNino?.apellido}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {selectedNino && (
            <VStack spacing={6} align="stretch">
              {/* Información básica */}
              <Box p={4} bg="gray.50" borderRadius="md">
                <Text fontWeight="bold" fontSize="lg" mb={2}>Información del Niño</Text>
                <HStack justify="space-between">
                  <Text fontWeight="bold">Nombre:</Text>
                  <Text>{selectedNino.nombre} {selectedNino.apellido}</Text>
                </HStack>
                <HStack justify="space-between">
                  <Text fontWeight="bold">Cédula:</Text>
                  <Text>{selectedNino.cedula}</Text>
                </HStack>
                <HStack justify="space-between">
                  <Text fontWeight="bold">Categoría:</Text>
                  <Badge colorScheme={getCategoriaColor(selectedNino.categoria)}>
                    {selectedNino.categoria}
                  </Badge>
                </HStack>
              </Box>

              {/* Documentos */}
              <VStack spacing={4} align="stretch">
                <Text fontWeight="bold" fontSize="lg">Documentos Subidos</Text>
                
                {/* Cédula */}
                <Box p={4} borderWidth="1px" borderRadius="md" borderColor={borderColor}>
                  <HStack justify="space-between" mb={2}>
                    <Text fontWeight="bold" color="blue.500">
                      <FiFile style={{ display: 'inline', marginRight: '8px' }} />
                      Cédula del Niño
                    </Text>
                    {selectedNino.cedulaFile ? (
                      <Button
                        size="sm"
                        colorScheme="blue"
                        onClick={() => window.open(selectedNino.cedulaFile, '_blank')}
                      >
                        Ver Documento
                      </Button>
                    ) : (
                      <Text fontSize="sm" color="gray.500">No subido</Text>
                    )}
                  </HStack>
                  {selectedNino.cedulaFile && (
                    <Text fontSize="sm" color="gray.600">
                      Archivo: {selectedNino.cedulaFile.split('/').pop()}
                    </Text>
                  )}
                </Box>

                {/* Partida de Nacimiento */}
                <Box p={4} borderWidth="1px" borderRadius="md" borderColor={borderColor}>
                  <HStack justify="space-between" mb={2}>
                    <Text fontWeight="bold" color="green.500">
                      <FiFile style={{ display: 'inline', marginRight: '8px' }} />
                      Partida de Nacimiento
                    </Text>
                    {selectedNino.partidaFile ? (
                      <Button
                        size="sm"
                        colorScheme="green"
                        onClick={() => window.open(selectedNino.partidaFile, '_blank')}
                      >
                        Ver Documento
                      </Button>
                    ) : (
                      <Text fontSize="sm" color="gray.500">No subido</Text>
                    )}
                  </HStack>
                  {selectedNino.partidaFile && (
                    <Text fontSize="sm" color="gray.600">
                      Archivo: {selectedNino.partidaFile.split('/').pop()}
                    </Text>
                  )}
                </Box>

                {/* Foto */}
                <Box p={4} borderWidth="1px" borderRadius="md" borderColor={borderColor}>
                  <HStack justify="space-between" mb={2}>
                    <Text fontWeight="bold" color="purple.500">
                      <FiImage style={{ display: 'inline', marginRight: '8px' }} />
                      Foto del Niño
                    </Text>
                    {selectedNino.fotoFile ? (
                      <Button
                        size="sm"
                        colorScheme="purple"
                        onClick={() => window.open(selectedNino.fotoFile, '_blank')}
                      >
                        Ver Foto
                      </Button>
                    ) : (
                      <Text fontSize="sm" color="gray.500">No subido</Text>
                    )}
                  </HStack>
                  {selectedNino.fotoFile && (
                    <Box mt={2}>
                      <Text fontSize="sm" color="gray.600" mb={2}>
                        Archivo: {selectedNino.fotoFile.split('/').pop()}
                      </Text>
                      <Box maxW="200px" maxH="200px" overflow="hidden" borderRadius="md">
                        <img 
                          src={selectedNino.fotoFile} 
                          alt={`Foto de ${selectedNino.nombre}`}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </Box>
                    </Box>
                  )}
                </Box>
              </VStack>

              {/* Información adicional */}
              {(selectedNino.alergias || selectedNino.emergencia) && (
                <Box p={4} bg="yellow.50" borderRadius="md">
                  <Text fontWeight="bold" fontSize="lg" mb={2}>Información Adicional</Text>
                  {selectedNino.alergias && (
                    <Box mb={2}>
                      <Text fontWeight="bold" color="red.500">Alergias:</Text>
                      <Text>{selectedNino.alergias}</Text>
                    </Box>
                  )}
                  {selectedNino.emergencia && (
                    <Box>
                      <Text fontWeight="bold" color="orange.500">Contacto de Emergencia:</Text>
                      <Text>{selectedNino.emergencia}</Text>
                    </Box>
                  )}
                </Box>
              )}
            </VStack>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}


