'use client'

import React from 'react'
import {
  Box,
  Container,
  Heading,
  VStack,
  HStack,
  Card,
  CardBody,
  Button,
  Input,
  Select,
  SimpleGrid,
  Text,
  useToast,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel
} from '@chakra-ui/react'
import Link from 'next/link'
import EquiposPage from './equipos/page'
import FixturePage from './fixture/page'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'

interface Torneo {
  id: string
  nombre: string
  descripcion?: string
  tipo: string
  ambito: string
  categoria?: string
  formato: string
  fechaInicio: string
  fechaFin: string
  activo: boolean
}

export default function TorneosPage() {
  const toast = useToast()
  const qc = useQueryClient()
  const { isAdmin } = useAuth()
  const [form, setForm] = React.useState({
    nombre: '',
    tipo: 'Liga',
    ambito: 'Interno',
    categoria: '',
    formato: 'round-robin',
    fechaInicio: new Date().toISOString().slice(0, 10),
    fechaFin: new Date().toISOString().slice(0, 10)
  })

  const { data: torneos, isLoading } = useQuery<Torneo[]>({
    queryKey: ['torneos'],
    queryFn: async () => {
      const res = await fetch('/api/torneos')
      if (!res.ok) throw new Error('Error al cargar torneos')
      return res.json()
    }
  })

  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch('/api/torneos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!res.ok) throw new Error('Error al crear torneo')
      return res.json()
    },
    onSuccess: () => {
      toast({ title: 'Torneo creado', status: 'success' })
      qc.invalidateQueries({ queryKey: ['torneos'] })
      setForm({
        nombre: '',
        tipo: 'Liga',
        ambito: 'Interno',
        categoria: '',
        formato: 'round-robin',
        fechaInicio: new Date().toISOString().slice(0, 10),
        fechaFin: new Date().toISOString().slice(0, 10)
      })
    },
    onError: () => {
      toast({ title: 'No se pudo crear el torneo', status: 'error' })
    }
  })

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={6} align="stretch">
        <Heading size="lg">Gestión de Torneos</Heading>

        <Tabs colorScheme="pink">
          <TabList>
            <Tab>General</Tab>
            <Tab>Equipos</Tab>
            <Tab>Fixture</Tab>
          </TabList>
          <TabPanels>
            <TabPanel px={0}>
              {isAdmin && (
                <Card>
                  <CardBody>
                    <VStack spacing={4} align="stretch">
                      <HStack>
                        <Input
                          placeholder="Nombre del torneo"
                          value={form.nombre}
                          onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                        />
                        <Select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
                          <option value="Liga">Liga</option>
                          <option value="Eliminatoria">Eliminatoria</option>
                          <option value="Grupos">Grupos</option>
                        </Select>
                        <Select value={form.formato} onChange={(e) => setForm({ ...form, formato: e.target.value })}>
                          <option value="round-robin">Round Robin</option>
                          <option value="ida-vuelta">Ida y Vuelta</option>
                          <option value="playoff">Playoff</option>
                        </Select>
                        <Select value={form.ambito} onChange={(e) => setForm({ ...form, ambito: e.target.value })}>
                          <option value="Interno">Interno</option>
                          <option value="Externo">Externo</option>
                        </Select>
                      </HStack>

                      <HStack>
                        <Input
                          type="date"
                          value={form.fechaInicio}
                          onChange={(e) => setForm({ ...form, fechaInicio: e.target.value })}
                        />
                        <Input
                          type="date"
                          value={form.fechaFin}
                          onChange={(e) => setForm({ ...form, fechaFin: e.target.value })}
                        />
                        <Input
                          placeholder="Categoría (opcional)"
                          value={form.categoria}
                          onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                        />
                        <Button
                          colorScheme="blue"
                          onClick={() => createMutation.mutate(form)}
                          isLoading={createMutation.isPending}
                        >
                          Crear Torneo
                        </Button>
                      </HStack>
                    </VStack>
                  </CardBody>
                </Card>
              )}

              <Card mt={6}>
                <CardBody>
                  <Heading size="md" mb={4}>Torneos</Heading>
                  {isLoading ? (
                    <Text>Cargando...</Text>
                  ) : (
                    <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                      {torneos?.map((t) => (
                        <Card key={t.id} borderWidth="1px">
                          <CardBody>
                            <VStack align="start" spacing={1}>
                              <Heading size="sm">{t.nombre}</Heading>
                              <Text color="gray.600">{t.tipo} • {t.formato}</Text>
                              <Text color="gray.500" fontSize="sm">{t.ambito}{t.categoria ? ` • ${t.categoria}` : ''}</Text>
                              <Text color="gray.500" fontSize="sm">
                                {new Date(t.fechaInicio).toLocaleDateString()} - {new Date(t.fechaFin).toLocaleDateString()}
                              </Text>
                            </VStack>
                          </CardBody>
                        </Card>
                      ))}
                    </SimpleGrid>
                  )}
                </CardBody>
              </Card>
            </TabPanel>

            <TabPanel px={0}>
              <EquiposPage />
            </TabPanel>

            <TabPanel px={0}>
              <FixturePage />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>
    </Container>
  )
}


