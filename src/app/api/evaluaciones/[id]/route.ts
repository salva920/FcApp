import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const evaluacion = await prisma.evaluacion.findUnique({
      where: { id: params.id },
      include: {
        nino: {
          select: {
            nombre: true,
            apellido: true,
            cedula: true,
            categoria: true,
            nivel: true
          }
        }
      }
    })

    if (!evaluacion) {
      return NextResponse.json(
        { error: 'Evaluación no encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json(evaluacion)
  } catch (error) {
    console.error('Error al obtener evaluación:', error)
    return NextResponse.json(
      { error: 'Error al obtener evaluación' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json()
    const { ninoId, ...rest } = data // ninoId no debe ser actualizable directamente

    const evaluacion = await prisma.evaluacion.update({
      where: { id: params.id },
      data: {
        ...rest,
        fecha: data.fecha ? new Date(data.fecha) : undefined,
        estatura: data.estatura !== undefined && data.estatura !== '' ? parseFloat(data.estatura) : null,
        peso: data.peso !== undefined && data.peso !== '' ? parseFloat(data.peso) : null,
        talla: data.talla || null,
        tallaCalzado: data.tallaCalzado || null,
        posicionesSecundarias: data.posicionesSecundarias || [],
        tecControl: data.tecControl ? parseInt(data.tecControl) : undefined,
        tecPase: data.tecPase ? parseInt(data.tecPase) : undefined,
        tecTiro: data.tecTiro ? parseInt(data.tecTiro) : undefined,
        tecRegate: data.tecRegate ? parseInt(data.tecRegate) : undefined,
        tecCabeceo: data.tecCabeceo ? parseInt(data.tecCabeceo) : undefined,
        tacPosicionamiento: data.tacPosicionamiento ? parseInt(data.tacPosicionamiento) : undefined,
        tacLectura: data.tacLectura ? parseInt(data.tacLectura) : undefined,
        tacMarcaje: data.tacMarcaje ? parseInt(data.tacMarcaje) : undefined,
        tacCobertura: data.tacCobertura ? parseInt(data.tacCobertura) : undefined,
        tacVision: data.tacVision ? parseInt(data.tacVision) : undefined,
        fisVelocidad: data.fisVelocidad ? parseInt(data.fisVelocidad) : undefined,
        fisResistencia: data.fisResistencia ? parseInt(data.fisResistencia) : undefined,
        fisFuerza: data.fisFuerza ? parseInt(data.fisFuerza) : undefined,
        fisAgilidad: data.fisAgilidad ? parseInt(data.fisAgilidad) : undefined,
        fisFlexibilidad: data.fisFlexibilidad ? parseInt(data.fisFlexibilidad) : undefined,
        psiConcentracion: data.psiConcentracion ? parseInt(data.psiConcentracion) : undefined,
        psiLiderazgo: data.psiLiderazgo ? parseInt(data.psiLiderazgo) : undefined,
        psiDisciplina: data.psiDisciplina ? parseInt(data.psiDisciplina) : undefined,
        psiMotivacion: data.psiMotivacion ? parseInt(data.psiMotivacion) : undefined,
        psiTrabEquipo: data.psiTrabEquipo ? parseInt(data.psiTrabEquipo) : undefined,
      }
    })

    return NextResponse.json(evaluacion)
  } catch (error) {
    console.error('Error al actualizar evaluación:', error)
    return NextResponse.json(
      { error: 'Error al actualizar evaluación' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.evaluacion.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Evaluación eliminada' })
  } catch (error) {
    console.error('Error al eliminar evaluación:', error)
    return NextResponse.json(
      { error: 'Error al eliminar evaluación' },
      { status: 500 }
    )
  }
}

