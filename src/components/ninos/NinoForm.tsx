import React from 'react'
import {
  FormControl,
  FormLabel,
  Input,
  Select,
  VStack,
  HStack,
  Text,
  Button,
  Switch,
  Box
} from '@chakra-ui/react'
import { FiCamera } from 'react-icons/fi'
import FileUpload from '@/components/FileUpload'
import { useAgeCalculator } from '@/hooks/useAgeCalculator'

interface NinoFormData {
  nombre: string
  apellido: string
  fechaNacimiento: string
  cedula?: string
  alergias: string
  emergencia: string
  categoria: string
  nivel: string
  activo: boolean
  representanteId: string
  cedulaFile: string
  partidaFile: string
  fotoFile: string
  faceDescriptor: string
  faceImageUrl: string
  // Medidas físicas iniciales para evaluación
  estatura?: string
  peso?: string
  talla?: string
  tallaCalzado?: string
}

interface NinoFormProps {
  formData: NinoFormData
  setFormData: React.Dispatch<React.SetStateAction<NinoFormData>>
  representantes: any[]
  isEditing: boolean
  isLoading: boolean
  onFacialRecognition: () => void
  hideRepresentanteSelector?: boolean
  hideSubmitButton?: boolean
}

export const NinoForm: React.FC<NinoFormProps> = ({
  formData,
  setFormData,
  representantes,
  isEditing,
  isLoading,
  onFacialRecognition,
  hideRepresentanteSelector = false,
  hideSubmitButton = false
}) => {
  const { edadCalculada, categoriasDisponibles, handleFechaNacimientoChange } = useAgeCalculator()

  const handleFechaChange = (fecha: string) => {
    handleFechaNacimientoChange(fecha, setFormData)
  }

  return (
    <VStack spacing={6} p={8} bg="gray.50" borderRadius="xl" border="1px solid" borderColor="gray.200" overflow="hidden" maxW="100%">
      <HStack spacing={6} width="full">
        <FormControl isRequired>
          <FormLabel fontSize="sm" fontWeight="semibold" color="gray.700">👤 Nombre</FormLabel>
          <Input
            value={formData.nombre}
            onChange={(e) =>
              setFormData({ ...formData, nombre: e.target.value })
            }
            bg="white"
            borderColor="gray.300"
            _focus={{ borderColor: "blue.400", boxShadow: "0 0 0 1px #3182ce" }}
          />
        </FormControl>
        <FormControl isRequired>
          <FormLabel fontSize="sm" fontWeight="semibold" color="gray.700">👤 Apellido</FormLabel>
          <Input
            value={formData.apellido}
            onChange={(e) =>
              setFormData({ ...formData, apellido: e.target.value })
            }
            bg="white"
            borderColor="gray.300"
            _focus={{ borderColor: "blue.400", boxShadow: "0 0 0 1px #3182ce" }}
          />
        </FormControl>
      </HStack>

      <HStack spacing={6} width="full">
        <FormControl isRequired>
          <FormLabel fontSize="sm" fontWeight="semibold" color="gray.700">📅 Fecha de Nacimiento</FormLabel>
          <Input
            type="date"
            value={formData.fechaNacimiento}
            onChange={(e) => handleFechaChange(e.target.value)}
            bg="white"
            borderColor="gray.300"
            _focus={{ borderColor: "blue.400", boxShadow: "0 0 0 1px #3182ce" }}
          />
          {edadCalculada !== null && (
            <Text fontSize="sm" color="blue.600" mt={1} fontWeight="medium">
              📅 Edad calculada: <strong>{edadCalculada} años</strong>
            </Text>
          )}
        </FormControl>
        <FormControl>
          <FormLabel fontSize="sm" fontWeight="semibold" color="gray.700">🆔 Cédula</FormLabel>
          <Input
            value={formData.cedula}
            onChange={(e) =>
              setFormData({ ...formData, cedula: e.target.value })
            }
            placeholder="V-12345678"
            bg="white"
            borderColor="gray.300"
            _focus={{ borderColor: "blue.400", boxShadow: "0 0 0 1px #3182ce" }}
          />
        </FormControl>
      </HStack>

      <HStack spacing={6} width="full">
        <FormControl isRequired>
          <FormLabel fontSize="sm" fontWeight="semibold" color="gray.700">🏆 Categoría</FormLabel>
          <Select
            value={formData.categoria}
            onChange={(e) =>
              setFormData({ ...formData, categoria: e.target.value })
            }
            isDisabled={categoriasDisponibles.length === 0 && formData.fechaNacimiento === ''}
            bg="white"
            borderColor="gray.300"
            _focus={{ borderColor: "blue.400", boxShadow: "0 0 0 1px #3182ce" }}
          >
            <option value="">
              {categoriasDisponibles.length === 0 
                ? "Seleccione fecha de nacimiento primero" 
                : "Seleccionar categoría"}
            </option>
            {categoriasDisponibles.length > 0 ? (
              categoriasDisponibles.map(categoria => (
                <option key={categoria} value={categoria}>
                  {categoria}
                </option>
              ))
            ) : (
              <>
                <option value="Sub-6">Sub-6</option>
                <option value="Sub-8">Sub-8</option>
                <option value="Sub-10">Sub-10</option>
                <option value="Sub-12">Sub-12</option>
                <option value="Sub-14">Sub-14</option>
                <option value="Sub-16">Sub-16</option>
                <option value="Sub-18">Sub-18</option>
              </>
            )}
          </Select>
          {categoriasDisponibles.length > 0 && (
            <Text fontSize="sm" color="green.600" mt={1} fontWeight="medium">
              ✅ Categorías válidas para {edadCalculada} años: {categoriasDisponibles.join(', ')}
            </Text>
          )}
        </FormControl>
        <FormControl isRequired>
          <FormLabel fontSize="sm" fontWeight="semibold" color="gray.700">⭐ Nivel</FormLabel>
          <Select
            value={formData.nivel}
            onChange={(e) =>
              setFormData({ ...formData, nivel: e.target.value })
            }
            bg="white"
            borderColor="gray.300"
            _focus={{ borderColor: "blue.400", boxShadow: "0 0 0 1px #3182ce" }}
          >
            <option value="">Seleccionar nivel</option>
            <option value="Principiante">Principiante</option>
            <option value="Intermedio">Intermedio</option>
            <option value="Avanzado">Avanzado</option>
          </Select>
        </FormControl>
      </HStack>

      {!hideRepresentanteSelector && (
        <FormControl isRequired>
          <FormLabel fontSize="sm" fontWeight="semibold" color="gray.700">👨‍👩‍👧‍👦 Representante</FormLabel>
          <Select
            value={formData.representanteId}
            onChange={(e) =>
              setFormData({ ...formData, representanteId: e.target.value })
            }
            bg="white"
            borderColor="gray.300"
            _focus={{ borderColor: "blue.400", boxShadow: "0 0 0 1px #3182ce" }}
          >
            <option value="">Seleccionar representante</option>
            {representantes.map((rep) => (
              <option key={rep.id} value={rep.id}>
                {rep.nombre} - {rep.cedula}
              </option>
            ))}
          </Select>
        </FormControl>
      )}

      {/* Medidas físicas iniciales */}
      <VStack spacing={3} width="full" align="stretch">
        <Text fontWeight="bold" fontSize="lg" color="gray.700">📏 Medidas iniciales (opcional)</Text>
        <HStack spacing={4}>
          <FormControl>
            <FormLabel fontSize="sm" fontWeight="semibold" color="gray.700">Estatura (cm)</FormLabel>
            <Input
              type="number"
              step="0.1"
              placeholder="Ej: 150"
              value={formData.estatura || ''}
              onChange={(e) => setFormData({ ...formData, estatura: e.target.value })}
              bg="white"
              borderColor="gray.300"
            />
          </FormControl>
          <FormControl>
            <FormLabel fontSize="sm" fontWeight="semibold" color="gray.700">Peso (kg)</FormLabel>
            <Input
              type="number"
              step="0.1"
              placeholder="Ej: 45.5"
              value={formData.peso || ''}
              onChange={(e) => setFormData({ ...formData, peso: e.target.value })}
              bg="white"
              borderColor="gray.300"
            />
          </FormControl>
          <FormControl>
            <FormLabel fontSize="sm" fontWeight="semibold" color="gray.700">Talla</FormLabel>
            <Select
              placeholder="Seleccionar"
              value={formData.talla || ''}
              onChange={(e) => setFormData({ ...formData, talla: e.target.value })}
              bg="white"
              borderColor="gray.300"
            >
              {/* Tallas infantiles numéricas */}
              <option value="6">6</option>
              <option value="8">8</option>
              <option value="10">10</option>
              <option value="12">12</option>
              <option value="14">14</option>
              <option value="16">16</option>
              {/* Tallas estándar pequeñas */}
              <option value="S">S</option>
              <option value="M">M</option>
              <option value="L">L</option>
            </Select>
          </FormControl>
          <FormControl>
            <FormLabel fontSize="sm" fontWeight="semibold" color="gray.700">Talla de Calzado</FormLabel>
            <Select
              placeholder="Seleccionar"
              value={formData.tallaCalzado || ''}
              onChange={(e) => setFormData({ ...formData, tallaCalzado: e.target.value })}
              bg="white"
              borderColor="gray.300"
            >
              <option value="33">33</option>
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
            </Select>
          </FormControl>
        </HStack>
      </VStack>

      {/* Reconocimiento Facial */}
      <FormControl>
        <FormLabel fontSize="sm" fontWeight="semibold" color="gray.700">📸 Reconocimiento Facial (Opcional)</FormLabel>
        <VStack spacing={3} align="stretch">
          <Button
            onClick={onFacialRecognition}
            colorScheme="purple"
            variant="outline"
            leftIcon={<FiCamera />}
            size="md"
            bg="white"
            borderColor="purple.300"
            _hover={{ bg: "purple.50", borderColor: "purple.400" }}
          >
            Capturar con Reconocimiento Facial
          </Button>
          {formData.faceImageUrl && (
            <Box p={3} bg="green.50" borderRadius="md" border="1px solid" borderColor="green.200">
              <Text fontSize="sm" color="green.700" mb={2} fontWeight="medium">
                ✅ Foto facial capturada y verificada
              </Text>
              <img
                src={formData.faceImageUrl}
                alt="Foto facial"
                style={{ maxWidth: '150px', maxHeight: '100px', objectFit: 'cover', borderRadius: '8px' }}
              />
            </Box>
          )}
        </VStack>
      </FormControl>

      <HStack spacing={6} width="full">
        <FormControl>
          <FormLabel fontSize="sm" fontWeight="semibold" color="gray.700">⚠️ Alergias</FormLabel>
          <Input
            value={formData.alergias}
            onChange={(e) =>
              setFormData({ ...formData, alergias: e.target.value })
            }
            placeholder="Especificar alergias si las tiene"
            bg="white"
            borderColor="gray.300"
            _focus={{ borderColor: "blue.400", boxShadow: "0 0 0 1px #3182ce" }}
          />
        </FormControl>
        <FormControl>
          <FormLabel fontSize="sm" fontWeight="semibold" color="gray.700">🚨 Contacto de Emergencia</FormLabel>
          <Input
            value={formData.emergencia}
            onChange={(e) =>
              setFormData({ ...formData, emergencia: e.target.value })
            }
            placeholder="Teléfono de emergencia"
            bg="white"
            borderColor="gray.300"
            _focus={{ borderColor: "blue.400", boxShadow: "0 0 0 1px #3182ce" }}
          />
        </FormControl>
      </HStack>

      {/* Carga de archivos - Compacta */}
      <VStack spacing={3} width="full">
        <Text fontWeight="bold" fontSize="lg" color="gray.700">📄 Documentos</Text>
        
        {/* Grid para los dos primeros documentos */}
        <Box 
          display="grid" 
          gridTemplateColumns="1fr 1fr" 
          gap={4} 
          width="full"
          maxW="100%"
        >
          <FormControl>
            <FormLabel fontSize="sm" color="gray.600">Cédula del Niño</FormLabel>
            <FileUpload
              onFileUploaded={(fileUrl, fileName) =>
                setFormData({ ...formData, cedulaFile: fileUrl })
              }
              currentFile={formData.cedulaFile}
              onRemove={() => setFormData({ ...formData, cedulaFile: '' })}
              label="Subir Cédula"
              placeholder="Seleccionar archivo..."
            />
          </FormControl>
          <FormControl>
            <FormLabel fontSize="sm" color="gray.600">Partida de Nacimiento</FormLabel>
            <FileUpload
              onFileUploaded={(fileUrl, fileName) =>
                setFormData({ ...formData, partidaFile: fileUrl })
              }
              currentFile={formData.partidaFile}
              onRemove={() => setFormData({ ...formData, partidaFile: '' })}
              label="Subir Partida"
              placeholder="Seleccionar archivo..."
            />
          </FormControl>
        </Box>

        <FormControl>
          <FormLabel fontSize="sm" color="gray.600">Foto del Niño</FormLabel>
          <FileUpload
            onFileUploaded={(fileUrl, fileName) =>
              setFormData({ ...formData, fotoFile: fileUrl })
            }
            currentFile={formData.fotoFile}
            onRemove={() => setFormData({ ...formData, fotoFile: '' })}
            label="Subir Foto"
            placeholder="Seleccionar foto del niño..."
            accept="image/*"
          />
        </FormControl>
      </VStack>

      <FormControl display="flex" alignItems="center" bg="white" p={4} borderRadius="md" border="1px solid" borderColor="gray.200">
        <FormLabel mb="0" fontSize="sm" fontWeight="semibold" color="gray.700">✅ Activo</FormLabel>
        <Switch
          isChecked={formData.activo}
          onChange={(e) =>
            setFormData({ ...formData, activo: e.target.checked })
          }
          colorScheme="green"
        />
      </FormControl>

      {!hideSubmitButton && (
        <Button
          type="submit"
          colorScheme="blue"
          width="full"
          isLoading={isLoading}
          size="lg"
          fontWeight="semibold"
          bg="blue.500"
          _hover={{ bg: "blue.600" }}
          _active={{ bg: "blue.700" }}
        >
          {isEditing ? '🔄 Actualizar Niño' : '✨ Registrar Nuevo Niño'}
        </Button>
      )}
    </VStack>
  )
}
