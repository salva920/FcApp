'use client'

import React, { useCallback } from 'react'
import {
  Box,
  Button,
  Container,
  Heading,
  FormControl,
  FormLabel,
  Input,
  VStack,
  HStack,
  useToast,
  Text,
  Select,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Textarea,
  Card,
  CardBody,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Spinner,
  Checkbox,
  CheckboxGroup,
  Divider
} from '@chakra-ui/react'
import { FiUpload, FiDollarSign, FiCalendar, FiUser, FiCheckCircle, FiSearch, FiAlertTriangle } from 'react-icons/fi'
import { useAuth } from '@/hooks/useAuth'

interface PagoFormData {
  monto: string
  concepto: string
  fechaVencimiento: string
  fechaPago: string
  metodoPago: string
  comprobante: string
  observaciones: string
  representanteId: string
}

// Precio de mensualidad por niño (configurable)
const MENSUALIDAD_POR_NINO = 50

export default function PagoPublicoPage() {
  const { usuario, isRepresentante, loading: authLoading } = useAuth()
  const [formData, setFormData] = React.useState<PagoFormData>({
    monto: '',
    concepto: '',
    fechaVencimiento: '',
    fechaPago: '',
    metodoPago: '',
    comprobante: '',
    observaciones: '',
    representanteId: ''
  })
  const [representantes, setRepresentantes] = React.useState<any[]>([])
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isSubmitted, setIsSubmitted] = React.useState(false)
  const [deudaInfo, setDeudaInfo] = React.useState<any>(null)
  const [consultandoDeuda, setConsultandoDeuda] = React.useState(false)
  const [cantidadNinos, setCantidadNinos] = React.useState(0)
  const [pendientes, setPendientes] = React.useState<Array<{ id: string; concepto: string; monto: number }>>([])
  const [seleccionados, setSeleccionados] = React.useState<Record<string, boolean>>({})
  const toast = useToast()

  // Cargar representantes
  React.useEffect(() => {
    const fetchRepresentantes = async () => {
      try {
        const res = await fetch('/api/representantes')
        if (res.ok) {
          const data = await res.json()
          setRepresentantes(data)
        }
      } catch (error) {
        console.error('Error al cargar representantes:', error)
      }
    }
    fetchRepresentantes()
  }, [])

  // Consultar deuda cuando se selecciona un representante
  const handleRepresentanteChange = useCallback(async (representanteId: string) => {
    setFormData(prev => ({ ...prev, representanteId }))
    
    if (representanteId) {
      const representante = representantes.find(r => r.id === representanteId)
      if (representante) {
        setConsultandoDeuda(true)
        try {
          // Obtener cantidad de niños del representante
          let cantidadActiva = 0
          const ninosRes = await fetch(`/api/ninos?representanteId=${representanteId}`)
          if (ninosRes.ok) {
            const ninos = await ninosRes.json()
            cantidadActiva = ninos.filter((nino: any) => nino.activo).length
            setCantidadNinos(cantidadActiva)
          }

          // Consultar deuda del representante
          const res = await fetch(`/api/pagos/consultar?query=${encodeURIComponent(representante.cedula)}`)
          if (res.ok) {
            const data = await res.json()
            setDeudaInfo(data)
            // Cargar conceptos pendientes para selección
            const conceptosPend = (data.pagos || []).filter((p: any) => p.estado === 'Pendiente').map((p: any) => ({ id: p.id, concepto: p.concepto, monto: p.monto }))
            setPendientes(conceptosPend)
            setSeleccionados({})
            // Monto sugerido inicial: solo mensualidad del mes (sin sumar todas las deudas)
            const sugerido = (cantidadActiva * MENSUALIDAD_POR_NINO)
            setFormData(prev => ({ ...prev, monto: sugerido.toFixed(2) }))
          }
        } catch (error) {
          console.error('Error al consultar deuda:', error)
        } finally {
          setConsultandoDeuda(false)
        }
      }
    } else {
      setDeudaInfo(null)
      setCantidadNinos(0)
    }
  }, [representantes])

  // Auto-seleccionar representante si el usuario es representante
  React.useEffect(() => {
    if (isRepresentante && usuario?.representanteId && representantes.length > 0) {
      const miRepresentante = representantes.find(r => r.id === usuario.representanteId)
      if (miRepresentante) {
        handleRepresentanteChange(miRepresentante.id)
      }
    }
  }, [isRepresentante, usuario, representantes, handleRepresentanteChange])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const idsSel = Object.keys(seleccionados).filter(k => seleccionados[k])
      if (idsSel.length > 0) {
        // Enviar un pago por cada concepto seleccionado
        for (const id of idsSel) {
          const item = pendientes.find(p => p.id === id)
          if (!item) continue
          const res = await fetch('/api/pagos/publico', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              representanteId: formData.representanteId,
              concepto: item.concepto,
              monto: item.monto,
              fechaVencimiento: formData.fechaVencimiento || new Date().toISOString().slice(0,10),
              fechaPago: formData.fechaPago || new Date().toISOString().slice(0,10),
              metodoPago: formData.metodoPago,
              comprobante: formData.comprobante,
              observaciones: formData.observaciones
            })
          })
          if (!res.ok) throw new Error('Error al registrar pago por concepto')
        }
        setIsSubmitted(true)
        toast({ title: 'Pagos enviados', description: 'Se registraron los conceptos seleccionados.', status: 'success', duration: 5000 })
      } else {
        // Envío único normal
        const res = await fetch('/api/pagos/publico', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            monto: parseFloat(formData.monto),
            estado: 'Pendiente',
            estadoVerificacion: 'Pendiente'
          })
        })
        if (!res.ok) throw new Error('Error al registrar el pago')
        setIsSubmitted(true)
        toast({
          title: 'Pago registrado exitosamente',
          description: 'Tu comprobante ha sido enviado para verificación. Te notificaremos por correo cuando sea revisado.',
          status: 'success',
          duration: 5000
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Hubo un problema al registrar tu pago. Por favor, inténtalo de nuevo.',
        status: 'error',
        duration: 3000
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Loading mientras se autentica
  if (authLoading) {
    return (
      <Container maxW="container.md" py={20}>
        <Box textAlign="center">
          <Spinner size="xl" color="blue.500" />
          <Text mt={4} color="gray.600">Cargando información...</Text>
        </Box>
      </Container>
    )
  }

  if (isSubmitted) {
    return (
      <Container maxW="container.md" py={8}>
        <Card>
          <CardBody textAlign="center" py={12}>
            <FiCheckCircle size={64} color="#48BB78" style={{ margin: '0 auto 24px' }} />
            <Heading size="lg" mb={4} color="green.600">
              ¡Pago Registrado Exitosamente!
            </Heading>
            <Text fontSize="lg" color="gray.600" mb={6}>
              Tu comprobante de pago ha sido enviado para verificación. 
              Recibirás una notificación por correo electrónico una vez que sea revisado por nuestro equipo.
            </Text>
            <Button 
              colorScheme="blue" 
              onClick={() => {
                setIsSubmitted(false)
                setFormData({
                  monto: '',
                  concepto: '',
                  fechaVencimiento: '',
                  fechaPago: '',
                  metodoPago: '',
                  comprobante: '',
                  observaciones: '',
                  representanteId: ''
                })
              }}
            >
              Registrar Otro Pago
            </Button>
          </CardBody>
        </Card>
      </Container>
    )
  }

  return (
    <Container maxW="container.md" py={8}>
      <Box mb={8} textAlign="center">
        <Heading size="lg" mb={4}>
          Sistema de Pagos
        </Heading>
        <Text color="gray.600" mb={4}>
          Sube tu comprobante de pago para su verificación
        </Text>
        <Button
          leftIcon={<FiSearch />}
          colorScheme="orange"
          variant="outline"
          size="sm"
          onClick={() => window.location.href = '/consultar-deuda'}
        >
          Consultar Mis Pagos
        </Button>
      </Box>

      <Alert status="info" mb={6}>
        <AlertIcon />
        <Box>
          <AlertTitle>Instrucciones:</AlertTitle>
          <AlertDescription>
            Completa todos los campos y sube tu comprobante de pago. 
            Nuestro equipo lo revisará y te notificará el resultado por correo electrónico.
          </AlertDescription>
        </Box>
      </Alert>

      <Card>
        <CardBody>
          <form onSubmit={handleSubmit}>
            <VStack spacing={6}>
              {/* Información del Representante */}
              <FormControl isRequired>
                <FormLabel>
                  <FiUser className="inline mr-2" />
                  Representante
                </FormLabel>
                <Select
                  value={formData.representanteId}
                  onChange={(e) => handleRepresentanteChange(e.target.value)}
                  placeholder="Selecciona tu nombre"
                  isDisabled={isRepresentante && !!usuario?.representanteId}
                >
                  {representantes.map((rep) => (
                    <option key={rep.id} value={rep.id}>
                      {rep.nombre} - {rep.cedula}
                    </option>
                  ))}
                </Select>
                {isRepresentante && usuario?.representanteId && (
                  <Text fontSize="sm" color="blue.600" mt={2}>
                    ✓ Representante seleccionado automáticamente
                  </Text>
                )}
              </FormControl>

              {/* Información de Deuda */}
              {consultandoDeuda && (
                <Alert status="info">
                  <AlertIcon />
                  <Text>Consultando deuda...</Text>
                </Alert>
              )}

              {/* Información Consolidada del Representante */}
              {formData.representanteId && (
                <Card shadow="lg" borderWidth="1px" borderColor="gray.200">
                  <CardBody>
                    <VStack spacing={4} align="stretch">
                      {/* Total a Pagar Destacado */}
                      <Box 
                        p={6} 
                        bgGradient="linear(to-r, blue.600, blue.700)" 
                        borderRadius="lg" 
                        boxShadow="md"
                      >
                        <VStack spacing={3} align="stretch">
                          <Text fontSize="sm" color="white" opacity={0.95} fontWeight="medium" letterSpacing="0.5px">
                            TOTAL A PAGAR
                          </Text>
                          <Text fontSize="5xl" fontWeight="bold" color="white" fontFamily="mono">
                            ${(() => {
                              const totalSel = Object.keys(seleccionados).filter(k => seleccionados[k]).reduce((sum, id) => {
                                const it = pendientes.find(p => p.id === id)
                                return sum + (it ? it.monto : 0)
                              }, 0)
                              const sugerido = (cantidadNinos * MENSUALIDAD_POR_NINO)
                              return (totalSel > 0 ? totalSel : sugerido).toFixed(2)
                            })()}
                          </Text>
                          <Box pt={2} borderTop="1px solid" borderColor="whiteAlpha.300">
                            <Text fontSize="xs" color="white" opacity={0.8}>
                              {cantidadNinos} niño{cantidadNinos !== 1 ? 's' : ''} × ${MENSUALIDAD_POR_NINO.toFixed(2)}
                            </Text>
                          </Box>
                        </VStack>
                      </Box>

                      {pendientes.length > 0 && (
                        <Box>
                          <Text fontWeight="semibold">Selecciona conceptos pendientes</Text>
                          <CheckboxGroup>
                            <VStack align="stretch" spacing={2} mt={2}>
                              {pendientes.map(p => (
                                <Checkbox
                                  key={p.id}
                                  isChecked={!!seleccionados[p.id]}
                                  onChange={(e) => {
                                    const next = { ...seleccionados, [p.id]: e.target.checked }
                                    setSeleccionados(next)
                                    const total = Object.keys(next).filter(k => next[k]).reduce((sum, id) => {
                                      const it = pendientes.find(pp => pp.id === id)
                                      return sum + (it ? it.monto : 0)
                                    }, 0)
                                    setFormData(prev => ({ ...prev, monto: total > 0 ? total.toFixed(2) : prev.monto, concepto: total > 0 ? 'Varios' : prev.concepto }))
                                  }}
                                >
                                  {p.concepto} — ${p.monto.toFixed(2)}
                                </Checkbox>
                              ))}
                            </VStack>
                          </CheckboxGroup>
                          <Divider my={3} />
                          <HStack justify="space-between">
                            <Text>Total seleccionado</Text>
                            <Text fontWeight="bold">
                              ${Object.keys(seleccionados).filter(k => seleccionados[k]).reduce((sum, id) => {
                                const it = pendientes.find(pp => pp.id === id)
                                return sum + (it ? it.monto : 0)
                              }, 0).toFixed(2)}
                            </Text>
                          </HStack>
                        </Box>
                      )}

                      {/* Botón para consultar detalles */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.location.href = '/consultar-deuda'}
                      >
                        <FiSearch style={{ marginRight: '8px' }} />
                        Ver Detalle Completo de Pagos
                      </Button>
                    </VStack>
                  </CardBody>
                </Card>
              )}


              {/* Concepto y Monto */}
              <HStack spacing={4} width="full">
                <FormControl isRequired>
                  <FormLabel>Concepto del Pago</FormLabel>
                  <Select
                    value={formData.concepto}
                    onChange={(e) => setFormData({ ...formData, concepto: e.target.value })}
                    placeholder="Seleccionar concepto"
                  >
                    <option value="Mensualidad">Mensualidad</option>
                    <option value="Inscripción">Inscripción</option>
                    <option value="Uniforme">Uniforme</option>
                    <option value="Material Deportivo">Material Deportivo</option>
                    <option value="Otro">Otro</option>
                  </Select>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>
                    <FiDollarSign className="inline mr-2" />
                    Monto
                  </FormLabel>
                  <NumberInput
                    value={formData.monto}
                    onChange={(value) => setFormData({ ...formData, monto: value })}
                    min={0}
                    precision={2}
                  >
                    <NumberInputField placeholder="0.00" />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>
              </HStack>

              {/* Fechas */}
              <HStack spacing={4} width="full">
                <FormControl isRequired>
                  <FormLabel>
                    <FiCalendar className="inline mr-2" />
                    Fecha de Vencimiento
                  </FormLabel>
                  <Input
                    type="date"
                    value={formData.fechaVencimiento}
                    onChange={(e) => setFormData({ ...formData, fechaVencimiento: e.target.value })}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Fecha de Pago</FormLabel>
                  <Input
                    type="date"
                    value={formData.fechaPago}
                    onChange={(e) => setFormData({ ...formData, fechaPago: e.target.value })}
                  />
                </FormControl>
              </HStack>

              {/* Método de Pago */}
              <FormControl isRequired>
                <FormLabel>Método de Pago</FormLabel>
                <Select
                  value={formData.metodoPago}
                  onChange={(e) => setFormData({ ...formData, metodoPago: e.target.value })}
                  placeholder="Seleccionar método de pago"
                >
                  <option value="Transferencia">Transferencia Bancaria</option>
                  <option value="Pago Móvil">Pago Móvil</option>
                  <option value="Efectivo">Efectivo</option>
                  <option value="Zelle">Zelle</option>
                  <option value="PayPal">PayPal</option>
                </Select>
              </FormControl>

              {/* Comprobante */}
              <FormControl isRequired>
                <FormLabel>
                  <FiUpload className="inline mr-2" />
                  Comprobante de Pago
                </FormLabel>
                <Input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      const reader = new FileReader()
                      reader.onloadend = () => {
                        const base64String = reader.result as string
                        setFormData({ ...formData, comprobante: base64String })
                      }
                      reader.readAsDataURL(file)
                    }
                  }}
                />
                {formData.comprobante && (
                  <Box mt={2} p={2} bg="green.50" borderRadius="md">
                    <Text fontSize="sm" color="green.700">
                      ✓ Comprobante cargado
                    </Text>
                  </Box>
                )}
                <Text fontSize="sm" color="gray.500" mt={2}>
                  Formatos aceptados: JPG, PNG, PDF
                </Text>
              </FormControl>

              {/* Observaciones */}
              <FormControl>
                <FormLabel>Observaciones (Opcional)</FormLabel>
                <Textarea
                  value={formData.observaciones}
                  onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                  placeholder="Cualquier información adicional sobre el pago..."
                  rows={3}
                />
              </FormControl>

              {/* Botón de Envío */}
              <Button
                type="submit"
                colorScheme="blue"
                size="lg"
                width="full"
                isLoading={isSubmitting}
                loadingText="Enviando comprobante..."
              >
                Enviar Comprobante para Verificación
              </Button>
            </VStack>
          </form>
        </CardBody>
      </Card>
    </Container>
  )
}
