import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const representantes = await prisma.representante.findMany({
      include: {
        ninos: true,
        pagos: true,
        usuarios: {
          select: {
            id: true,
            email: true,
            nombre: true,
            rol: true,
            categoria: true,
            activo: true
          }
        },
        _count: {
          select: {
            ninos: true,
            pagos: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(representantes)
  } catch (error) {
    console.error('Error al obtener representantes:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nombre, cedula, email, telefono, direccion } = body

    // Verificar si ya existe un representante con esta cédula
    const existingRepresentante = await prisma.representante.findUnique({
      where: { cedula }
    })

    if (existingRepresentante) {
      return NextResponse.json(
        { error: 'Ya existe un representante con esta cédula' },
        { status: 400 }
      )
    }

    const representante = await prisma.representante.create({
      data: {
        nombre,
        cedula,
        email,
        telefono,
        direccion
      }
    })

    return NextResponse.json(representante, { status: 201 })
  } catch (error) {
    console.error('Error al crear representante:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
