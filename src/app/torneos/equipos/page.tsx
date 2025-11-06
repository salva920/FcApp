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
  Tag,
  TagLabel,
  TagCloseButton,
  useToast
} from '@chakra-ui/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'

interface Torneo { id: string; nombre: string; categoria?: string }
interface Nino { id: string; nombre: string; apellido: string; categoria: string }
interface EquipoJugador { id: string; dorsal?: number; posicion?: string; nino: Nino }
interface Equipo {
  id: string
  nombre: string
  categoria?: string
  descripcion?: string
  torneoId?: string
  jugadores: EquipoJugador[]
}

export default function EquiposPage() {
  const toast = useToast()
  const qc = useQueryClient()
  const { isAdmin } = useAuth()
  const [torneoSel, setTorneoSel] = React.useState('')
  const [nuevoEquipo, setNuevoEquipo] = React.useState({ nombre: '', categoria: '' })
  const [busquedaJugador, setBusquedaJugador] = React.useState('')
  const [equipoSeleccionado, setEquipoSeleccionado] = React.useState<string | null>(null)
  const [ninoSeleccionado, setNinoSeleccionado] = React.useState('')

  const { data: torneos } = useQuery<Torneo[]>({
    queryKey: ['torneos'],
    queryFn: async () => {
      const r = await fetch('/api/torneos')
      if (!r.ok) throw new Error('Error torneos')
      return r.json()
    }
  })

  const { data: equipos } = useQuery<Equipo[]>({
    queryKey: ['equipos', torneoSel],
    queryFn: async () => {
      const url = torneoSel ? `/api/equipos?torneoId=${torneoSel}` : '/api/equipos'
      const r = await fetch(url)
      if (!r.ok) throw new Error('Error equipos')
      return r.json()
    },
    enabled: true
  })

  const { data: ninos } = useQuery<Nino[]>({
    queryKey: ['ninos'],
    queryFn: async () => {
      const r = await fetch('/api/ninos')
      if (!r.ok) throw new Error('Error niños')
      return r.json()
    }
  })

  const createEquipo = useMutation({
    mutationFn: async () => {
      const payload = {
        nombre: nuevoEquipo.nombre,
        categoria: nuevoEquipo.categoria || undefined,
        torneoId: torneoSel || undefined
      }
      const r = await fetch('/api/equipos', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      })
      if (!r.ok) throw new Error('No se pudo crear')
      return r.json()
    },
    onSuccess: () => {
      toast({ title: 'Equipo creado', status: 'success' })
      setNuevoEquipo({ nombre: '', categoria: '' })
      qc.invalidateQueries({ queryKey: ['equipos'] })
    },
    onError: () => toast({ title: 'Error al crear equipo', status: 'error' })
  })

  const addJugador = useMutation({
    mutationFn: async (vars: { equipoId: string; ninoId: string }) => {
      const r = await fetch(`/api/equipos/${vars.equipoId}/jugadores`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ninoId: vars.ninoId })
      })
      if (!r.ok) throw new Error('No se pudo agregar')
      return r.json()
    },
    onSuccess: () => {
      toast({ title: 'Jugador agregado', status: 'success' })
      setBusquedaJugador('')
      setNinoSeleccionado('')
      qc.invalidateQueries({ queryKey: ['equipos'] })
    },
    onError: (e: any) => toast({ title: e?.message || 'Error al agregar jugador', status: 'error' })
  })

  const removeJugador = useMutation({
    mutationFn: async (vars: { equipoId: string; ninoId: string }) => {
      const r = await fetch(`/api/equipos/${vars.equipoId}/jugadores?ninoId=${vars.ninoId}`, { method: 'DELETE' })
      if (!r.ok) throw new Error('No se pudo quitar')
      return r.json()
    },
    onSuccess: () => {
      toast({ title: 'Jugador quitado', status: 'info' })
      qc.invalidateQueries({ queryKey: ['equipos'] })
    },
    onError: () => toast({ title: 'Error al quitar jugador', status: 'error' })
  })

  const ninosFiltrados = React.useMemo(() => {
    if (!ninos) return []
    const busq = busquedaJugador.toLowerCase().trim()
    return ninos
      .filter(n => (busq ? (`${n.nombre} ${n.apellido}`).toLowerCase().includes(busq) : true))
      .sort((a, b) => a.nombre.localeCompare(b.nombre))
  }, [ninos, busquedaJugador])

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={6} align="stretch">
        <Heading size="lg">Equipos y Jugadores</Heading>

        {isAdmin && (
        <Card>
          <CardBody>
            <HStack spacing={4} align="center">
              <Select placeholder="Selecciona torneo" value={torneoSel} onChange={(e) => setTorneoSel(e.target.value)}>
                {torneos?.map(t => (
                  <option key={t.id} value={t.id}>{t.nombre}</option>
                ))}
              </Select>
              <Input placeholder="Nombre del equipo" value={nuevoEquipo.nombre} onChange={(e) => setNuevoEquipo(v => ({ ...v, nombre: e.target.value }))} />
              <Input placeholder="Categoría (opcional)" value={nuevoEquipo.categoria} onChange={(e) => setNuevoEquipo(v => ({ ...v, categoria: e.target.value }))} />
              <Button colorScheme="blue" onClick={() => createEquipo.mutate()} isDisabled={!nuevoEquipo.nombre}>Crear Equipo</Button>
            </HStack>
          </CardBody>
        </Card>
        )}

        <Card>
          <CardBody>
            <Heading size="md" mb={4}>Equipos</Heading>
            {equipos?.length ? (
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                {equipos.map(eq => (
                  <Card key={eq.id} borderWidth="1px">
                    <CardBody>
                      <VStack align="stretch" spacing={3}>
                        <HStack justify="space-between">
                          <Heading size="sm">{eq.nombre}</Heading>
                          {eq.categoria && <Tag colorScheme="blue"><TagLabel>{eq.categoria}</TagLabel></Tag>}
                        </HStack>

                        <Box>
                          <Text fontWeight="semibold" mb={2}>Jugadores</Text>
                          <HStack spacing={2} wrap="wrap">
                            {eq.jugadores?.map(j => (
                              <Tag key={j.id} colorScheme="green" size="md">
                                <TagLabel>{j.nino.nombre} {j.nino.apellido}</TagLabel>
                                {isAdmin && (
                                  <TagCloseButton onClick={() => removeJugador.mutate({ equipoId: eq.id, ninoId: j.nino.id })} />
                                )}
                              </Tag>
                            ))}
                          </HStack>
                        </Box>

                        <VStack align="stretch" spacing={2}>
                          {isAdmin && (
                          <HStack>
                            <Input placeholder="Buscar niño..." value={equipoSeleccionado === eq.id ? busquedaJugador : ''} onChange={(e) => { setEquipoSeleccionado(eq.id); setBusquedaJugador(e.target.value) }} />
                            <Select placeholder="Selecciona niño" value={equipoSeleccionado === eq.id ? ninoSeleccionado : ''} onChange={(e) => { setEquipoSeleccionado(eq.id); setNinoSeleccionado(e.target.value) }}>
                              {ninosFiltrados.map(n => (
                                <option key={n.id} value={n.id}>{n.nombre} {n.apellido} • {n.categoria}</option>
                              ))}
                            </Select>
                            <Button colorScheme="teal" onClick={() => ninoSeleccionado && addJugador.mutate({ equipoId: eq.id, ninoId: ninoSeleccionado })} isDisabled={!ninoSeleccionado}>
                              Agregar
                            </Button>
                          </HStack>
                          )}
                        </VStack>
                      </VStack>
                    </CardBody>
                  </Card>
                ))}
              </SimpleGrid>
            ) : (
              <Text color="gray.500">No hay equipos registrados.</Text>
            )}
          </CardBody>
        </Card>
      </VStack>
    </Container>
  )
}


