import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const nino = await prisma.nino.findUnique({
      where: { id: params.id },
      include: {
        representante: true
      }
    })

    if (!nino) {
      return NextResponse.json(
        { error: 'Niño no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(nino)
  } catch (error) {
    console.error('Error al obtener niño:', error)
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
    const {
      nombre,
      apellido,
      fechaNacimiento,
      cedula,
      alergias,
      emergencia,
      categoria,
      nivel,
      activo,
      cedulaFile,
      partidaFile,
      fotoFile
    } = body

    // Verificar si la cédula ya existe en otro niño (solo si se envía)
    if (cedula && cedula.trim() !== '') {
      const existingNino = await prisma.nino.findFirst({
        where: {
          cedula: cedula.trim(),
          NOT: { id: params.id }
        }
      })

      if (existingNino) {
        return NextResponse.json(
          { error: 'Ya existe otro niño con esta cédula' },
          { status: 400 }
        )
      }
    }

    const nino = await prisma.nino.update({
      where: { id: params.id },
      data: {
        nombre,
        apellido,
        fechaNacimiento: new Date(fechaNacimiento),
        cedula: cedula && cedula.trim() !== '' ? cedula.trim() : null,
        alergias,
        emergencia,
        categoria,
        nivel,
        activo,
        cedulaFile,
        partidaFile,
        fotoFile
      },
      include: {
        representante: true
      }
    })

    return NextResponse.json(nino)
  } catch (error) {
    console.error('Error al actualizar niño:', error)
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
    await prisma.nino.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Niño eliminado correctamente' })
  } catch (error) {
    console.error('Error al eliminar niño:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
