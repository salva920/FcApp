import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const ninoId = searchParams.get('ninoId')

    if (ninoId) {
      // Obtener evaluaciones de un niño específico
      const evaluaciones = await prisma.evaluacion.findMany({
        where: { ninoId },
        orderBy: { fecha: 'desc' }
      })
      return NextResponse.json(evaluaciones)
    }

    // Obtener todas las evaluaciones
    const evaluaciones = await prisma.evaluacion.findMany({
      include: {
        nino: {
          select: {
            nombre: true,
            apellido: true,
            cedula: true,
            categoria: true
          }
        }
      },
      orderBy: { fecha: 'desc' }
    })

    return NextResponse.json(evaluaciones)
  } catch (error) {
    console.error('Error al obtener evaluaciones:', error)
    return NextResponse.json(
      { error: 'Error al obtener evaluaciones' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    const evaluacion = await prisma.evaluacion.create({
      data: {
        ...data,
        fecha: data.fecha ? new Date(data.fecha) : new Date(),
        estatura: data.estatura ? parseFloat(data.estatura) : null,
        peso: data.peso ? parseFloat(data.peso) : null,
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

    return NextResponse.json(evaluacion, { status: 201 })
  } catch (error) {
    console.error('Error al crear evaluación:', error)
    return NextResponse.json(
      { error: 'Error al crear evaluación' },
      { status: 500 }
    )
  }
}

