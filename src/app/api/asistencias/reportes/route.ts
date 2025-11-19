import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fechaInicio = searchParams.get('fechaInicio')
    const fechaFin = searchParams.get('fechaFin')
    const ninoId = searchParams.get('ninoId')
    const categoria = searchParams.get('categoria')

    // Construir filtros
    const where: any = {}
    
    if (fechaInicio || fechaFin) {
      where.fecha = {}
      if (fechaInicio) {
        where.fecha.gte = new Date(fechaInicio)
      }
      if (fechaFin) {
        const fechaFinDate = new Date(fechaFin)
        fechaFinDate.setHours(23, 59, 59, 999)
        where.fecha.lte = fechaFinDate
      }
    }

    if (ninoId) {
      where.ninoId = ninoId
    }

    if (categoria) {
      where.nino = {
        categoria: categoria
      }
    }

    // Obtener asistencias
    const asistencias = await prisma.asistencia.findMany({
      where,
      include: {
        nino: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            categoria: true,
            representante: {
              select: {
                id: true,
                nombre: true,
                email: true,
                telefono: true
              }
            }
          }
        }
      },
      orderBy: {
        fecha: 'desc'
      }
    })

    // Calcular estadísticas
    const totalAsistencias = asistencias.length
    const entradas = asistencias.filter(a => a.tipo === 'entrada').length
    const salidas = asistencias.filter(a => a.tipo === 'salida').length
    const puntuales = asistencias.filter(a => a.puntual).length
    const porcentajePuntualidad = totalAsistencias > 0 
      ? Math.round((puntuales / totalAsistencias) * 100) 
      : 0

    // Agrupar por niño
    const porNino = asistencias.reduce((acc: any, asistencia) => {
      const ninoId = asistencia.ninoId
      if (!acc[ninoId]) {
        acc[ninoId] = {
          nino: asistencia.nino,
          total: 0,
          entradas: 0,
          salidas: 0,
          puntuales: 0,
          inasistencias: 0
        }
      }
      acc[ninoId].total++
      if (asistencia.tipo === 'entrada') acc[ninoId].entradas++
      if (asistencia.tipo === 'salida') acc[ninoId].salidas++
      if (asistencia.puntual) acc[ninoId].puntuales++
      return acc
    }, {})

    // Calcular inasistencias (niños que no tienen entrada en el día)
    const fechaActual = new Date()
    fechaActual.setHours(0, 0, 0, 0)
    const fechaFinDia = new Date(fechaActual)
    fechaFinDia.setHours(23, 59, 59, 999)

    // Obtener todos los niños activos
    const todosLosNinos = await prisma.nino.findMany({
      where: {
        activo: true,
        ...(categoria ? { categoria } : {})
      },
      include: {
        representante: {
          select: {
            id: true,
            nombre: true,
            email: true,
            telefono: true
          }
        }
      }
    })

    // Identificar inasistencias del día
    const asistenciasHoy = await prisma.asistencia.findMany({
      where: {
        fecha: {
          gte: fechaActual,
          lte: fechaFinDia
        },
        tipo: 'entrada'
      },
      select: {
        ninoId: true
      }
    })

    const ninosConAsistenciaHoy = new Set(asistenciasHoy.map(a => a.ninoId))
    const inasistencias = todosLosNinos
      .filter(nino => !ninosConAsistenciaHoy.has(nino.id))
      .map(nino => ({
        nino: {
          id: nino.id,
          nombre: nino.nombre,
          apellido: nino.apellido,
          categoria: nino.categoria
        },
        representante: nino.representante
      }))

    return NextResponse.json({
      estadisticas: {
        totalAsistencias,
        entradas,
        salidas,
        puntuales,
        porcentajePuntualidad
      },
      porNino: Object.values(porNino),
      inasistencias,
      asistencias: asistencias.slice(0, 100) // Limitar a las últimas 100
    })
  } catch (error) {
    console.error('Error al generar reporte de asistencias:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
