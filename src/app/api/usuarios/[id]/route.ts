import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// Función helper para obtener usuario del token
async function getUserFromToken(request: NextRequest) {
  try {
    const token = request.cookies.get('football_auth_token')?.value ||
                  request.headers.get('authorization')?.replace('Bearer ', '')

    if (!token) return null

    const decoded = jwt.verify(token, JWT_SECRET) as any
    const usuario = await prisma.usuario.findUnique({
      where: { id: decoded.userId }
    })
    return usuario
  } catch {
    return null
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar que el usuario es admin
    const currentUser = await getUserFromToken(request)
    if (!currentUser || currentUser.rol !== 'admin') {
      return NextResponse.json(
        { error: 'No autorizado. Solo administradores pueden actualizar usuarios.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { categoria } = body

    // Validar que el usuario existe
    const usuario = await prisma.usuario.findUnique({
      where: { id: params.id }
    })

    if (!usuario) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // Solo permitir actualizar categoría si el usuario es profesor
    if (usuario.rol !== 'profesor') {
      return NextResponse.json(
        { error: 'Solo se puede asignar categoría a instructores (profesores)' },
        { status: 400 }
      )
    }

    // Actualizar categoría
    const updatedUsuario = await prisma.usuario.update({
      where: { id: params.id },
      data: {
        categoria: categoria || null
      }
    })

    return NextResponse.json(updatedUsuario)
  } catch (error) {
    console.error('Error al actualizar usuario:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

