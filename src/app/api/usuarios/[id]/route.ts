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
    const { categoria, rol } = body

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

    const updateData: any = {}

    // Si se envía categoría, actualizarla (solo para profesores)
    if (categoria !== undefined) {
      if (usuario.rol !== 'profesor' && usuario.rol !== 'representante-delegado') {
        return NextResponse.json(
          { error: 'Solo se puede asignar categoría a instructores (profesores o representantes-delegados)' },
          { status: 400 }
        )
      }
      updateData.categoria = categoria || null
    }

    // Si se envía rol, actualizarlo (solo para representantes -> representante-delegado)
    if (rol !== undefined) {
      // Validar que el rol es válido
      if (!['admin', 'profesor', 'representante', 'representante-delegado'].includes(rol)) {
        return NextResponse.json(
          { error: 'Rol no válido' },
          { status: 400 }
        )
      }

      // Solo permitir cambiar de representante a representante-delegado o viceversa
      if (usuario.rol === 'representante' && rol === 'representante-delegado') {
        updateData.rol = rol
      } else if (usuario.rol === 'representante-delegado' && rol === 'representante') {
        updateData.rol = rol
      } else if (usuario.rol !== 'representante' && usuario.rol !== 'representante-delegado') {
        return NextResponse.json(
          { error: 'Solo se puede cambiar el rol de representantes a representante-delegado y viceversa' },
          { status: 400 }
        )
      } else {
        updateData.rol = rol
      }
    }

    // Actualizar usuario
    const updatedUsuario = await prisma.usuario.update({
      where: { id: params.id },
      data: updateData
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

