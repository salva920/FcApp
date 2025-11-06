import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fechaInicio = searchParams.get('fechaInicio')
    const fechaFin = searchParams.get('fechaFin')
    const ninoId = searchParams.get('ninoId')

    let where: any = {}
    
    if (ninoId) {
      where.ninoId = ninoId
    }
    
    if (fechaInicio && fechaFin) {
      const inicio = new Date(fechaInicio)
      const fin = new Date(fechaFin)
      fin.setHours(23, 59, 59, 999)
      
      where.fecha = {
        gte: inicio,
        lte: fin
      }
    }

    // Obtener todas las asistencias
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

    // Calcular estadísticas
    const total = asistencias.length
    const puntuales = asistencias.filter(a => a.puntual).length
    const tardios = total - puntuales
    const porcentajePuntualidad = total > 0 ? (puntuales / total) * 100 : 0

    // Agrupar por niño
    const porNino = asistencias.reduce((acc, asistencia) => {
      const ninoId = asistencia.ninoId
      if (!acc[ninoId]) {
        acc[ninoId] = {
          nino: asistencia.nino,
          total: 0,
          puntuales: 0,
          tardios: 0,
          entradas: 0,
          salidas: 0
        }
      }
      
      acc[ninoId].total++
      if (asistencia.puntual) {
        acc[ninoId].puntuales++
      } else {
        acc[ninoId].tardios++
      }
      
      if (asistencia.tipo === 'entrada') {
        acc[ninoId].entradas++
      } else {
        acc[ninoId].salidas++
      }
      
      return acc
    }, {} as any)

    const reporte = {
      estadisticasGenerales: {
        total,
        puntuales,
        tardios,
        porcentajePuntualidad
      },
      porNino: Object.values(porNino),
      detalle: asistencias
    }

    return NextResponse.json(reporte)
  } catch (error) {
    console.error('Error al generar reporte:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
