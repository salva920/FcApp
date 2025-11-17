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

export async function GET(request: NextRequest) {
  try {
    // Verificar que el usuario es admin
    const currentUser = await getUserFromToken(request)
    if (!currentUser || currentUser.rol !== 'admin') {
      return NextResponse.json(
        { error: 'No autorizado. Solo administradores pueden ver usuarios.' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const rol = searchParams.get('rol') // Filtrar por rol si se especifica

    const where: any = {}
    if (rol) where.rol = rol

    const usuarios = await prisma.usuario.findMany({
      where,
      select: {
        id: true,
        email: true,
        nombre: true,
        rol: true,
        categoria: true,
        activo: true,
        createdAt: true,
        instructor: {
          select: {
            id: true,
            nombre: true,
            cedula: true,
            email: true,
            telefono: true
          }
        }
      },
      orderBy: {
        nombre: 'asc'
      }
    })

    return NextResponse.json(usuarios)
  } catch (error) {
    console.error('Error al obtener usuarios:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

