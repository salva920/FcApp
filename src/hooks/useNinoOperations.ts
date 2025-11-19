import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@chakra-ui/react'

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
  // Medidas físicas iniciales (para evaluación inicial)
  estatura?: string
  peso?: string
  talla?: string
  tallaCalzado?: string
}

interface Nino {
  id: string
  nombre: string
  apellido: string
  fechaNacimiento: string
  cedula?: string
  alergias?: string
  emergencia?: string
  categoria: string
  nivel: string
  activo: boolean
  representante: {
    id: string
    nombre: string
    cedula: string
    email: string
    telefono: string
  }
  cedulaFile?: string
  partidaFile?: string
  fotoFile?: string
  faceDescriptor?: string
  faceImageUrl?: string
}

export const useNinoOperations = () => {
  const [formData, setFormData] = useState<NinoFormData>({
    nombre: '',
    apellido: '',
    fechaNacimiento: '',
    cedula: '',
    alergias: '',
    emergencia: '',
    categoria: '',
    nivel: '',
    activo: true,
    representanteId: '',
    cedulaFile: '',
    partidaFile: '',
    fotoFile: '',
    faceDescriptor: '',
    faceImageUrl: '',
    estatura: '',
    peso: '',
    talla: '',
    tallaCalzado: ''
  })

  const toast = useToast()
  const queryClient = useQueryClient()

  const createMutation = useMutation({
    // Permitimos payload con cédula opcional
    mutationFn: async (newNino: any) => {
      const res = await fetch('/api/ninos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newNino)
      })
      if (!res.ok) throw new Error('Error al crear niño')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ninos'] })
      toast({
        title: 'Niño registrado',
        status: 'success',
        duration: 3000
      })
    }
  })

  const updateMutation = useMutation({
    mutationFn: async (nino: any) => {
      const res = await fetch(`/api/ninos/${nino.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nino)
      })
      if (!res.ok) throw new Error('Error al actualizar niño')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ninos'] })
      toast({
        title: 'Niño actualizado',
        status: 'success',
        duration: 3000
      })
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/ninos/${id}`, {
        method: 'DELETE'
      })
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Error al eliminar niño')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ninos'] })
      toast({
        title: 'Niño eliminado',
        description: 'El niño ha sido eliminado correctamente',
        status: 'success',
        duration: 3000
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Error al eliminar',
        description: error.message || 'No se pudo eliminar el niño',
        status: 'error',
        duration: 5000,
        isClosable: true
      })
    }
  })

  const handleSubmit = async (e: React.FormEvent, selectedNino: Nino | null) => {
    e.preventDefault()
    
    const dataToSubmit = {
      ...formData,
      faceDescriptor: formData.faceDescriptor || '',
      faceImageUrl: formData.faceImageUrl || ''
    }
    
    if (selectedNino) {
      updateMutation.mutate({ ...dataToSubmit, id: selectedNino.id, representante: selectedNino.representante } as Nino)
    } else {
      try {
        const created: any = await (createMutation as any).mutateAsync(dataToSubmit as any)

        // Crear evaluación inicial si hay datos de medidas
        const hasMedidas = (formData.estatura && formData.estatura !== '') || (formData.peso && formData.peso !== '') || (formData.talla && formData.talla !== '')
        if (created?.id && hasMedidas) {
          try {
            await fetch('/api/evaluaciones', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                ninoId: created.id,
                estatura: formData.estatura ? parseFloat(formData.estatura) : undefined,
                peso: formData.peso ? parseFloat(formData.peso) : undefined,
                talla: formData.talla || undefined,
                tallaCalzado: formData.tallaCalzado || undefined
              })
            })
            toast({ title: 'Medidas iniciales guardadas', status: 'success', duration: 2500 })
          } catch (err) {
            console.error('Error creando evaluación inicial:', err)
            toast({ title: 'No se guardaron las medidas iniciales', status: 'warning', duration: 3000 })
          }
        }
      } catch (err) {
        // el propio createMutation ya muestra toast de error
      }
    }
  }

  const resetForm = () => {
    setFormData({
      nombre: '',
      apellido: '',
      fechaNacimiento: '',
      cedula: '',
      alergias: '',
      emergencia: '',
      categoria: '',
      nivel: '',
      activo: true,
      representanteId: '',
      cedulaFile: '',
      partidaFile: '',
      fotoFile: '',
      faceDescriptor: '',
      faceImageUrl: '',
      estatura: '',
      peso: '',
      talla: '',
      tallaCalzado: ''
    })
  }

  return {
    formData,
    setFormData,
    createMutation,
    updateMutation,
    deleteMutation,
    handleSubmit,
    resetForm
  }
}
