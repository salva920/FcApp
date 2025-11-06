'use client'

import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  VStack,
  useColorModeValue
} from '@chakra-ui/react'
import { FiHome, FiArrowLeft } from 'react-icons/fi'

export default function NotFound() {
  const cardBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')

  return (
    <Container maxW="container.md" py={16}>
      <VStack spacing={8} align="center">
        <Box textAlign="center">
          <Heading size="4xl" color="red.500" mb={4}>
            404
          </Heading>
          <Heading size="lg" mb={4}>
            Página no encontrada
          </Heading>
          <Text fontSize="lg" color="gray.600" mb={8}>
            La página que buscas no existe o ha sido movida.
          </Text>
        </Box>

        <VStack spacing={4}>
          <Button
            leftIcon={<FiHome />}
            colorScheme="blue"
            size="lg"
            onClick={() => window.location.href = '/'}
          >
            Ir al Inicio
          </Button>
          <Button
            leftIcon={<FiArrowLeft />}
            variant="outline"
            size="lg"
            onClick={() => window.history.back()}
          >
            Volver Atrás
          </Button>
        </VStack>
      </VStack>
    </Container>
  )
}
