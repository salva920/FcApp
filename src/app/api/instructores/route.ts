import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const instructores = await prisma.instructor.findMany({
      where: {
        activo: true
      },
      include: {
        _count: {
          select: {
            actividades: true
          }
        }
      },
      orderBy: {
        nombre: 'asc'
      }
    })

    return NextResponse.json(instructores)
  } catch (error) {
    console.error('Error al obtener instructores:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nombre, cedula, email, telefono, especialidad } = body

    if (!nombre || !cedula || !email || !telefono) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos' },
        { status: 400 }
      )
    }

    const instructor = await prisma.instructor.create({
      data: {
        nombre,
        cedula,
        email,
        telefono,
        especialidad,
        activo: true
      }
    })

    return NextResponse.json(instructor, { status: 201 })
  } catch (error) {
    console.error('Error al crear instructor:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
