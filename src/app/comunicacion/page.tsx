'use client'

import React from 'react'
import {
  Box,
  Container,
  Heading,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Badge,
  HStack,
  Text,
  useColorModeValue
} from '@chakra-ui/react'
import { FiMessageCircle, FiUsers, FiFileText, FiAlertTriangle, FiBell } from 'react-icons/fi'
import { useAuth } from '@/hooks/useAuth'
import dynamic from 'next/dynamic'

// Lazy load de componentes
const ChatComponent = dynamic(() => import('@/components/comunicacion/ChatComponent'), {
  ssr: false,
  loading: () => <Box p={4}>Cargando chat...</Box>
})

const ForosComponent = dynamic(() => import('@/components/comunicacion/ForosComponent'), {
  ssr: false,
  loading: () => <Box p={4}>Cargando foros...</Box>
})

const ComunicadosComponent = dynamic(() => import('@/components/comunicacion/ComunicadosComponent'), {
  ssr: false,
  loading: () => <Box p={4}>Cargando comunicados...</Box>
})

const AlertasComponent = dynamic(() => import('@/components/comunicacion/AlertasComponent'), {
  ssr: false,
  loading: () => <Box p={4}>Cargando alertas...</Box>
})

const NotificacionesPushComponent = dynamic(() => import('@/components/comunicacion/NotificacionesPushComponent'), {
  ssr: false,
  loading: () => <Box p={4}>Cargando panel...</Box>
})

export default function ComunicacionPage() {
  const { usuario, isAdmin, isProfesor, isRepresentante } = useAuth()
  const bg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')

  return (
    <Container maxW="container.xl" py={8}>
      <Box mb={6}>
        <HStack spacing={4} mb={2}>
          <Heading size="lg">Centro de Comunicación</Heading>
          <Badge colorScheme="blue" fontSize="md" px={3} py={1}>
            Beta
          </Badge>
        </HStack>
        <Text color="gray.600" fontSize="sm">
          Comunícate con entrenadores, padres y administradores. Participa en foros, lee comunicados oficiales y mantente informado.
        </Text>
      </Box>

      <Box bg={bg} borderRadius="lg" borderWidth="1px" borderColor={borderColor} p={4}>
        <Tabs colorScheme="blue" isLazy>
          <TabList
            overflowX="auto"
            overflowY="hidden"
            sx={{
              '&::-webkit-scrollbar': {
                height: '8px'
              },
              '&::-webkit-scrollbar-track': {
                background: 'transparent'
              },
              '&::-webkit-scrollbar-thumb': {
                background: 'gray.300',
                borderRadius: '4px'
              }
            }}
          >
            <Tab>
              <HStack spacing={2}>
                <FiMessageCircle />
                <Text display={{ base: 'none', md: 'block' }}>Chat</Text>
              </HStack>
            </Tab>
            <Tab>
              <HStack spacing={2}>
                <FiUsers />
                <Text display={{ base: 'none', md: 'block' }}>Foros</Text>
              </HStack>
            </Tab>
            <Tab>
              <HStack spacing={2}>
                <FiFileText />
                <Text display={{ base: 'none', md: 'block' }}>Comunicados</Text>
              </HStack>
            </Tab>
            <Tab>
              <HStack spacing={2}>
                <FiAlertTriangle />
                <Text display={{ base: 'none', md: 'block' }}>Alertas</Text>
              </HStack>
            </Tab>
            {(isAdmin || isProfesor) && (
              <Tab>
                <HStack spacing={2}>
                  <FiBell />
                  <Text display={{ base: 'none', md: 'block' }}>Notificaciones</Text>
                </HStack>
              </Tab>
            )}
          </TabList>

          <TabPanels>
            <TabPanel px={0} py={4}>
              <ChatComponent />
            </TabPanel>
            <TabPanel px={0} py={4}>
              <ForosComponent />
            </TabPanel>
            <TabPanel px={0} py={4}>
              <ComunicadosComponent />
            </TabPanel>
            <TabPanel px={0} py={4}>
              <AlertasComponent />
            </TabPanel>
            {(isAdmin || isProfesor) && (
              <TabPanel px={0} py={4}>
                <NotificacionesPushComponent />
              </TabPanel>
            )}
          </TabPanels>
        </Tabs>
      </Box>
    </Container>
  )
}

