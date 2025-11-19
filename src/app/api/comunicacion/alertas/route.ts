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
    const activa = searchParams.get('activa') !== 'false'

    const where: any = {
      activa
    }

    // Filtrar por categoría si el usuario tiene una asignada
    if (usuario.categoria) {
      where.OR = [
        { categoria: usuario.categoria },
        { categoria: null } // Alertas generales
      ]
    }

    // Filtrar por fecha de vencimiento
    if (activa) {
      where.OR = [
        { fechaFin: null },
        { fechaFin: { gte: new Date() } }
      ]
    }

    const alertas = await prisma.alertaEmergencia.findMany({
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
        confirmaciones: {
          where: {
            usuarioId: usuario.id
          },
          take: 1
        },
        _count: {
          select: {
            confirmaciones: {
              where: {
                confirmado: true
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

    return NextResponse.json(alertas)
  } catch (error) {
    console.error('Error al obtener alertas:', error)
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

    // Solo admin puede crear alertas
    if (usuario.rol !== 'admin') {
      return NextResponse.json(
        { error: 'Solo administradores pueden crear alertas' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { titulo, mensaje, tipo, prioridad, categoria, grupo, fechaFin } = body

    if (!titulo || !mensaje) {
      return NextResponse.json(
        { error: 'El título y mensaje son requeridos' },
        { status: 400 }
      )
    }

    const alerta = await prisma.alertaEmergencia.create({
      data: {
        titulo: titulo.trim(),
        mensaje: mensaje.trim(),
        tipo: tipo || 'emergencia',
        prioridad: prioridad || 'maxima',
        categoria,
        grupo,
        fechaFin: fechaFin ? new Date(fechaFin) : null,
        creadorId: usuario.id
      }
    })

    return NextResponse.json(alerta, { status: 201 })
  } catch (error) {
    console.error('Error al crear alerta:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}


