import { useState, useCallback } from 'react'
import { useToast } from '@chakra-ui/react'

export const useAgeCalculator = () => {
  const [edadCalculada, setEdadCalculada] = useState<number | null>(null)
  const [categoriasDisponibles, setCategoriasDisponibles] = useState<string[]>([])
  const toast = useToast()

  // Función para calcular la edad
  const calcularEdad = useCallback((fechaNacimiento: string): number => {
    if (!fechaNacimiento) return 0
    const hoy = new Date()
    const nacimiento = new Date(fechaNacimiento)
    let edad = hoy.getFullYear() - nacimiento.getFullYear()
    const mes = hoy.getMonth() - nacimiento.getMonth()
    
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--
    }
    
    return edad
  }, [])

  // Función para determinar categorías disponibles basadas en la edad
  const determinarCategoriasDisponibles = useCallback((edad: number): string[] => {
    const categorias = []
    
    if (edad >= 4 && edad <= 5) {
      categorias.push('Sub-6')
    }
    if (edad >= 6 && edad <= 7) {
      categorias.push('Sub-8')
    }
    if (edad >= 8 && edad <= 9) {
      categorias.push('Sub-10')
    }
    if (edad >= 10 && edad <= 11) {
      categorias.push('Sub-12')
    }
    if (edad >= 12 && edad <= 13) {
      categorias.push('Sub-14')
    }
    if (edad >= 14 && edad <= 15) {
      categorias.push('Sub-16')
    }
    if (edad >= 16 && edad <= 17) {
      categorias.push('Sub-18')
    }
    
    return categorias
  }, [])

  // Función para manejar cambios en la fecha de nacimiento
  const handleFechaNacimientoChange = useCallback((fecha: string, setFormData: any) => {
    // Primero actualizar la fecha en el formData
    setFormData((prev: any) => ({ ...prev, fechaNacimiento: fecha }))
    
    if (fecha) {
      const edad = calcularEdad(fecha)
      setEdadCalculada(edad)
      
      const categorias = determinarCategoriasDisponibles(edad)
      setCategoriasDisponibles(categorias)
      
      // Auto-seleccionar categoría si solo hay una disponible
      if (categorias.length === 1) {
        setFormData((prev: any) => ({ ...prev, categoria: categorias[0] }))
      }
      
      // Mostrar toast con la edad calculada
      if (edad > 0 && edad <= 18) {
        toast({
          title: `Edad calculada: ${edad} años`,
          description: `Categorías disponibles: ${categorias.join(', ')}`,
          status: 'info',
          duration: 3000
        })
      } else if (edad > 18) {
        toast({
          title: 'Edad fuera del rango',
          description: 'La edad debe estar entre 4 y 18 años',
          status: 'warning',
          duration: 3000
        })
      }
    } else {
      setEdadCalculada(null)
      setCategoriasDisponibles([])
    }
  }, [calcularEdad, determinarCategoriasDisponibles, toast])

  const resetAgeCalculator = useCallback(() => {
    setEdadCalculada(null)
    setCategoriasDisponibles([])
  }, [])

  return {
    edadCalculada,
    categoriasDisponibles,
    handleFechaNacimientoChange,
    resetAgeCalculator,
    calcularEdad,
    determinarCategoriasDisponibles
  }
}
