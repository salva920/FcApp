'use client'

import React from 'react'
import {
  Box, Container, Heading, VStack, HStack, Card, CardBody, Button,
  Select, SimpleGrid, Text, useToast, Table, Thead, Tbody, Tr, Th, Td
} from '@chakra-ui/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'

interface Torneo { id: string; nombre: string }
interface Partido {
  id: string; fecha: string; ronda?: string; estado: string;
  equipoLocal: { id: string; nombre: string }
  equipoVisita: { id: string; nombre: string }
}

export default function FixturePage() {
  const toast = useToast()
  const qc = useQueryClient()
  const { isAdmin } = useAuth()
  const [torneoSel, setTorneoSel] = React.useState('')
  const [formato, setFormato] = React.useState<'round-robin' | 'ida-vuelta'>('round-robin')

  const { data: torneos } = useQuery<Torneo[]>({
    queryKey: ['torneos'],
    queryFn: async () => {
      const r = await fetch('/api/torneos')
      if (!r.ok) throw new Error('Error torneos')
      return r.json()
    }
  })

  const { data: partidos } = useQuery<Partido[]>({
    queryKey: ['partidos', torneoSel],
    queryFn: async () => {
      if (!torneoSel) return []
      const r = await fetch(`/api/partidos?torneoId=${torneoSel}`)
      if (!r.ok) throw new Error('Error partidos')
      return r.json()
    },
    enabled: !!torneoSel
  })

  const genMutation = useMutation({
    mutationFn: async () => {
      const r = await fetch('/api/partidos/generar', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ torneoId: torneoSel, formato })
      })
      if (!r.ok) throw new Error('No se pudo generar')
      return r.json()
    },
    onSuccess: () => {
      toast({ title: 'Fixture generado', status: 'success' })
      qc.invalidateQueries({ queryKey: ['partidos'] })
    },
    onError: (e: any) => toast({ title: e?.message || 'Error al generar', status: 'error' })
  })

  const { data: tabla } = useQuery<any[]>({
    queryKey: ['tabla', torneoSel],
    queryFn: async () => {
      if (!torneoSel) return []
      const r = await fetch(`/api/torneos/${torneoSel}/tabla`)
      if (!r.ok) throw new Error('Error tabla')
      return r.json()
    },
    enabled: !!torneoSel
  })

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={6} align="stretch">
        <Heading size="lg">Fixture y Tabla</Heading>

        <Card>
          <CardBody>
            <HStack spacing={4}>
              <Select placeholder="Selecciona torneo" value={torneoSel} onChange={(e) => setTorneoSel(e.target.value)}>
                {torneos?.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
              </Select>
              <Select value={formato} onChange={(e) => setFormato(e.target.value as any)}>
                <option value="round-robin">Round Robin</option>
                <option value="ida-vuelta">Ida y Vuelta</option>
              </Select>
              {isAdmin && (
              <Button colorScheme="blue" onClick={() => genMutation.mutate()} isDisabled={!torneoSel}>
                Generar Fixture
              </Button>
              )}
            </HStack>
          </CardBody>
        </Card>

        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          <Card>
            <CardBody>
              <Heading size="md" mb={4}>Partidos</Heading>
              {!torneoSel ? (
                <Text color="gray.500">Selecciona un torneo</Text>
              ) : partidos?.length ? (
                <VStack align="stretch" spacing={3}>
                  {partidos!.map(p => (
                    <Box key={p.id} borderWidth="1px" borderRadius="md" p={3}>
                      <HStack justify="space-between">
                        <Text fontWeight="semibold">{p.ronda || 'Jornada'}</Text>
                        <Text color="gray.500">{new Date(p.fecha).toLocaleDateString()}</Text>
                      </HStack>
                      <Text mt={1}>{p.equipoLocal.nombre} vs {p.equipoVisita.nombre}</Text>
                      <Text fontSize="sm" color="gray.500">{p.estado}</Text>
                    </Box>
                  ))}
                </VStack>
              ) : (
                <Text color="gray.500">No hay partidos</Text>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <Heading size="md" mb={4}>Tabla de posiciones</Heading>
              {!torneoSel ? (
                <Text color="gray.500">Selecciona un torneo</Text>
              ) : tabla?.length ? (
                <Table size="sm">
                  <Thead>
                    <Tr>
                      <Th>Equipo</Th><Th isNumeric>J</Th><Th isNumeric>G</Th><Th isNumeric>E</Th><Th isNumeric>P</Th><Th isNumeric>GF</Th><Th isNumeric>GC</Th><Th isNumeric>DIF</Th><Th isNumeric>PTS</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {tabla!.map((r, idx) => (
                      <Tr key={r.equipoId}>
                        <Td>{idx + 1}. {r.nombre}</Td>
                        <Td isNumeric>{r.jugados}</Td>
                        <Td isNumeric>{r.ganados}</Td>
                        <Td isNumeric>{r.empatados}</Td>
                        <Td isNumeric>{r.perdidos}</Td>
                        <Td isNumeric>{r.gf}</Td>
                        <Td isNumeric>{r.gc}</Td>
                        <Td isNumeric>{r.dif}</Td>
                        <Td isNumeric><b>{r.puntos}</b></Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              ) : (
                <Text color="gray.500">No hay datos</Text>
              )}
            </CardBody>
          </Card>
        </SimpleGrid>
      </VStack>
    </Container>
  )
}


