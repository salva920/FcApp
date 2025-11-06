'use client'

import {
  Box,
  Container,
  Spinner,
  Text,
  VStack,
  useColorModeValue
} from '@chakra-ui/react'

export default function Loading() {
  const cardBg = useColorModeValue('white', 'gray.800')

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="center" justify="center" minH="50vh">
        <Spinner
          thickness="4px"
          speed="0.65s"
          emptyColor="gray.200"
          color="blue.500"
          size="xl"
        />
        <Text fontSize="lg" color="gray.600">
          Cargando...
        </Text>
      </VStack>
    </Container>
  )
}
