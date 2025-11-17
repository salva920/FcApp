import { useState, useEffect } from 'react'

interface Usuario {
  id: string
  email: string
  nombre: string
  rol: string
  categoria?: string | null
  representanteId?: string
  instructorId?: string
}

export function useAuth() {
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Obtener usuario del localStorage
    const userData = localStorage.getItem('football_user')
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData)
        setUsuario(parsedUser)
      } catch (error) {
        console.error('Error parsing user data:', error)
        setUsuario(null)
      }
    }
    setLoading(false)
  }, [])

  const logout = () => {
    localStorage.removeItem('football_auth_token')
    localStorage.removeItem('football_user')
    document.cookie = 'football_auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    setUsuario(null)
    window.location.href = '/login'
  }

  return {
    usuario,
    loading,
    isAuthenticated: !!usuario,
    isAdmin: usuario?.rol === 'admin',
    isProfesor: usuario?.rol === 'profesor',
    isRepresentante: usuario?.rol === 'representante',
    logout
  }
}

