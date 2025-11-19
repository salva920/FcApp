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
    const tipo = searchParams.get('tipo')
    const categoria = searchParams.get('categoria')
    const activo = searchParams.get('activo') !== 'false'

    const where: any = {
      activo
    }

    if (tipo) where.tipo = tipo
    if (categoria) {
      where.categoria = categoria
    } else if (usuario.categoria) {
      // Si el usuario tiene categoría, mostrar comunicados de su categoría o generales
      where.OR = [
        { categoria: usuario.categoria },
        { categoria: null },
        { tipo: 'General' }
      ]
    }

    const comunicados = await prisma.comunicado.findMany({
      where,
      include: {
        creador: {
          select: {
            id: true,
            nombre: true,
            email: true,
            rol: true
          }
        },
        lecturas: {
          where: {
            usuarioId: usuario.id
          },
          take: 1
        },
        _count: {
          select: {
            lecturas: {
              where: {
                leido: true
              }
            }
          }
        }
      },
      orderBy: [
        { prioridad: 'desc' },
        { createdAt: 'desc' }
      ]
    })

    return NextResponse.json(comunicados)
  } catch (error) {
    console.error('Error al obtener comunicados:', error)
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

    // Solo admin puede crear comunicados
    if (usuario.rol !== 'admin') {
      return NextResponse.json(
        { error: 'Solo administradores pueden crear comunicados' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { titulo, contenido, tipo, categoria, prioridad, archivoUrl, requiereConfirmacion, fechaVencimiento } = body

    if (!titulo || !contenido) {
      return NextResponse.json(
        { error: 'El título y contenido son requeridos' },
        { status: 400 }
      )
    }

    const comunicado = await prisma.comunicado.create({
      data: {
        titulo: titulo.trim(),
        contenido: contenido.trim(),
        tipo: tipo || 'General',
        categoria,
        prioridad: prioridad || 'normal',
        archivoUrl,
        requiereConfirmacion: requiereConfirmacion !== false,
        fechaVencimiento: fechaVencimiento ? new Date(fechaVencimiento) : null,
        creadorId: usuario.id
      }
    })

    return NextResponse.json(comunicado, { status: 201 })
  } catch (error) {
    console.error('Error al crear comunicado:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}


