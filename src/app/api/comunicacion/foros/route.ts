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
    const usuario = await getUserFromToken(request)
    if (!usuario) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const categoria = searchParams.get('categoria')

    const where: any = {
      activo: true
    }

    // Si el usuario tiene categoría asignada, filtrar por categoría o foros generales
    if (usuario.categoria && categoria !== 'todas') {
      where.OR = [
        { categoria: usuario.categoria },
        { categoria: null } // Foros generales
      ]
    } else if (categoria && categoria !== 'todas') {
      where.categoria = categoria
    }

    const foros = await prisma.foro.findMany({
      where,
      include: {
        _count: {
          select: {
            temas: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(foros)
  } catch (error) {
    console.error('Error al obtener foros:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const usuario = await getUserFromToken(request)
    if (!usuario) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Solo admin puede crear foros
    if (usuario.rol !== 'admin') {
      return NextResponse.json(
        { error: 'Solo administradores pueden crear foros' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { nombre, descripcion, categoria, icono, color, soloLectura } = body

    if (!nombre || nombre.trim() === '') {
      return NextResponse.json(
        { error: 'El nombre del foro es requerido' },
        { status: 400 }
      )
    }

    const foro = await prisma.foro.create({
      data: {
        nombre: nombre.trim(),
        descripcion,
        categoria,
        icono,
        color,
        soloLectura: soloLectura || false
      }
    })

    return NextResponse.json(foro, { status: 201 })
  } catch (error) {
    console.error('Error al crear foro:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

