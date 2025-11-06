import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const ninoId = searchParams.get('ninoId')
    const fecha = searchParams.get('fecha')

    let where: any = {}
    
    if (ninoId) {
      where.ninoId = ninoId
    }
    
    if (fecha) {
      const fechaInicio = new Date(fecha)
      const fechaFin = new Date(fecha)
      fechaFin.setDate(fechaFin.getDate() + 1)
      
      where.fecha = {
        gte: fechaInicio,
        lt: fechaFin
      }
    }

    const asistencias = await prisma.asistencia.findMany({
      where,
      include: {
        nino: {
          include: {
            representante: true
          }
        }
      },
      orderBy: {
        fecha: 'desc'
      }
    })

    return NextResponse.json(asistencias)
  } catch (error) {
    console.error('Error al obtener asistencias:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { ninoId, tipo, observaciones } = body

    if (!ninoId || !tipo) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos' },
        { status: 400 }
      )
    }

    // Verificar que el niño existe
    const nino = await prisma.nino.findUnique({
      where: { id: ninoId }
    })

    if (!nino) {
      return NextResponse.json(
        { error: 'Niño no encontrado' },
        { status: 404 }
      )
    }

    // Crear el registro de asistencia
    const asistencia = await prisma.asistencia.create({
      data: {
        ninoId,
        tipo, // entrada o salida
        puntual: true, // Se calculará si hay reglas configuradas
        observaciones,
        fecha: new Date()
      },
      include: {
        nino: {
          include: {
            representante: true
          }
        }
      }
    })

    return NextResponse.json(asistencia, { status: 201 })
  } catch (error) {
    console.error('Error al crear asistencia:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
