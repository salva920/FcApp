'use client'

import { Box, Spinner, Text, VStack, Center } from '@chakra-ui/react'

interface LoadingSpinnerProps {
  message?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export default function LoadingSpinner({ 
  message = 'Cargando...', 
  size = 'lg' 
}: LoadingSpinnerProps) {
  return (
    <Center py={20}>
      <VStack spacing={4}>
        <Spinner
          thickness="4px"
          speed="0.65s"
          emptyColor="gray.200"
          color="blue.500"
          size={size}
        />
        <Text color="gray.600" fontSize="lg">
          {message}
        </Text>
      </VStack>
    </Center>
  )
}
