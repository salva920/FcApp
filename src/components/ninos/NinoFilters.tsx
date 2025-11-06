import React from 'react'
import {
  Box,
  FormControl,
  InputGroup,
  InputLeftElement,
  Input,
  Select,
  HStack
} from '@chakra-ui/react'
import { FiSearch } from 'react-icons/fi'
import { useColorModeValue } from '@chakra-ui/react'

interface NinoFiltersProps {
  searchQuery: string
  setSearchQuery: (query: string) => void
  categoriaFilter: string
  setCategoriaFilter: (categoria: string) => void
}

export const NinoFilters: React.FC<NinoFiltersProps> = ({
  searchQuery,
  setSearchQuery,
  categoriaFilter,
  setCategoriaFilter
}) => {
  const cardBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')

  return (
    <Box mb={6} p={4} bg={cardBg} borderRadius="md" borderColor={borderColor} borderWidth="1px">
      <HStack spacing={4}>
        <FormControl maxW="300px">
          <InputGroup>
            <InputLeftElement>
              <FiSearch />
            </InputLeftElement>
            <Input
              placeholder="Buscar por nombre, cédula o representante..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </InputGroup>
        </FormControl>
        <FormControl maxW="200px">
          <Select
            placeholder="Todas las categorías"
            value={categoriaFilter}
            onChange={(e) => setCategoriaFilter(e.target.value)}
          >
            <option value="Sub-6">Sub-6</option>
            <option value="Sub-8">Sub-8</option>
            <option value="Sub-10">Sub-10</option>
            <option value="Sub-12">Sub-12</option>
            <option value="Sub-14">Sub-14</option>
            <option value="Sub-16">Sub-16</option>
            <option value="Sub-18">Sub-18</option>
          </Select>
        </FormControl>
      </HStack>
    </Box>
  )
}
