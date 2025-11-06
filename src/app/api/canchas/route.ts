import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const canchas = await prisma.cancha.findMany({
      where: {
        activo: true
      },
      include: {
        _count: {
          select: {
            reservas: true,
            actividades: true
          }
        }
      },
      orderBy: {
        nombre: 'asc'
      }
    })

    return NextResponse.json(canchas)
  } catch (error) {
    console.error('Error al obtener canchas:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nombre, descripcion, capacidad, tipo } = body

    if (!nombre || !capacidad || !tipo) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos' },
        { status: 400 }
      )
    }

    const cancha = await prisma.cancha.create({
      data: {
        nombre,
        descripcion,
        capacidad: parseInt(capacidad),
        tipo,
        activo: true
      }
    })

    return NextResponse.json(cancha, { status: 201 })
  } catch (error) {
    console.error('Error al crear cancha:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
