import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Verificar que la notificación existe
    const notificacion = await prisma.notificacion.findUnique({
      where: { id }
    })

    if (!notificacion) {
      return NextResponse.json(
        { error: 'Notificación no encontrada' },
        { status: 404 }
      )
    }

    // Eliminar la notificación
    await prisma.notificacion.delete({
      where: { id }
    })

    return NextResponse.json(
      { message: 'Notificación eliminada exitosamente' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error al eliminar notificación:', error)
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
    const { id } = params
    const body = await request.json()
    const { tipo, titulo, mensaje, metodoEnvio } = body

    // Verificar que la notificación existe
    const notificacionExistente = await prisma.notificacion.findUnique({
      where: { id }
    })

    if (!notificacionExistente) {
      return NextResponse.json(
        { error: 'Notificación no encontrada' },
        { status: 404 }
      )
    }

    // Actualizar la notificación
    const notificacion = await prisma.notificacion.update({
      where: { id },
      data: {
        tipo,
        titulo,
        mensaje,
        metodoEnvio
      },
      include: {
        representante: true
      }
    })

    return NextResponse.json(notificacion)
  } catch (error) {
    console.error('Error al actualizar notificación:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const notificacion = await prisma.notificacion.findUnique({
      where: { id },
      include: {
        representante: true
      }
    })

    if (!notificacion) {
      return NextResponse.json(
        { error: 'Notificación no encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json(notificacion)
  } catch (error) {
    console.error('Error al obtener notificación:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}


