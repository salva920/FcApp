import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const representante = await prisma.representante.findUnique({
      where: { id: params.id },
      include: {
        ninos: true,
        pagos: {
          orderBy: {
            createdAt: 'desc'
          }
        },
        _count: {
          select: {
            ninos: true,
            pagos: true
          }
        }
      }
    })

    if (!representante) {
      return NextResponse.json(
        { error: 'Representante no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(representante)
  } catch (error) {
    console.error('Error al obtener representante:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { nombre, cedula, email, telefono, direccion } = body

    // Verificar si la cédula ya existe en otro representante
    const existingRepresentante = await prisma.representante.findFirst({
      where: {
        cedula,
        NOT: { id: params.id }
      }
    })

    if (existingRepresentante) {
      return NextResponse.json(
        { error: 'Ya existe otro representante con esta cédula' },
        { status: 400 }
      )
    }

    const representante = await prisma.representante.update({
      where: { id: params.id },
      data: {
        nombre,
        cedula,
        email,
        telefono,
        direccion
      }
    })

    return NextResponse.json(representante)
  } catch (error) {
    console.error('Error al actualizar representante:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar si el representante tiene niños asociados
    const representante = await prisma.representante.findUnique({
      where: { id: params.id },
      include: {
        ninos: true
      }
    })

    if (!representante) {
      return NextResponse.json(
        { error: 'Representante no encontrado' },
        { status: 404 }
      )
    }

    if (representante.ninos.length > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar un representante que tiene niños asociados' },
        { status: 400 }
      )
    }

    await prisma.representante.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Representante eliminado correctamente' })
  } catch (error) {
    console.error('Error al eliminar representante:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
