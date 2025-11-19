import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Forzar renderizado dinámico porque usamos request.url
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const includeDeportivos = searchParams.get('includeDeportivos') === 'true'
    const includeProyecciones = searchParams.get('includeProyecciones') === 'true'

    // Estadísticas generales
    const totalNinos = await prisma.nino.count({ where: { activo: true } })
    const totalRepresentantes = await prisma.representante.count()
    
    // Niños por categoría
    const ninosPorCategoria = await prisma.nino.groupBy({
      by: ['categoria'],
      where: { activo: true },
      _count: {
        categoria: true
      }
    })

    // Pagos
    const totalPagos = await prisma.pago.count()
    const pagosPagados = await prisma.pago.count({
      where: { estado: 'Pagado' }
    })
    const pagosPendientes = await prisma.pago.count({
      where: { estado: 'Pendiente' }
    })
    const pagosVencidos = await prisma.pago.count({
      where: { estado: 'Vencido' }
    })

    // Ingresos
    const ingresosTotales = await prisma.pago.aggregate({
      where: { estado: 'Pagado' },
      _sum: { monto: true }
    })

    const ingresosMesActual = await prisma.pago.aggregate({
      where: {
        estado: 'Pagado',
        fechaPago: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        }
      },
      _sum: { monto: true }
    })

    // Ingresos últimos 6 meses para proyecciones
    const ingresosUltimosMeses: any[] = []
    if (includeProyecciones) {
      for (let i = 5; i >= 0; i--) {
        const fechaInicio = new Date(new Date().getFullYear(), new Date().getMonth() - i, 1)
        const fechaFin = new Date(new Date().getFullYear(), new Date().getMonth() - i + 1, 0)
        
        const ingresos = await prisma.pago.aggregate({
          where: {
            estado: 'Pagado',
            fechaPago: {
              gte: fechaInicio,
              lte: fechaFin
            }
          },
          _sum: { monto: true }
        })
        
        ingresosUltimosMeses.push({
          mes: fechaInicio.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }),
          ingresos: ingresos._sum.monto || 0
        })
      }
    }

    // Proyección de ingresos (promedio de últimos 3 meses)
    let proyeccionIngresos = 0
    if (includeProyecciones && ingresosUltimosMeses.length >= 3) {
      const ultimos3Meses = ingresosUltimosMeses.slice(-3)
      const promedio = ultimos3Meses.reduce((sum, mes) => sum + mes.ingresos, 0) / 3
      proyeccionIngresos = promedio
    }

    // Representantes con pagos pendientes
    const representantesDeudores = await prisma.representante.findMany({
      where: {
        pagos: {
          some: {
            estado: {
              in: ['Pendiente', 'Vencido']
            }
          }
        }
      },
      include: {
        _count: {
          select: {
            pagos: {
              where: {
                estado: {
                  in: ['Pendiente', 'Vencido']
                }
              }
            }
          }
        }
      }
    })

    // Estadísticas deportivas
    let deportivos: any = null
    if (includeDeportivos) {
      // Obtener todas las evaluaciones
      const evaluaciones = await prisma.evaluacion.findMany({
        include: {
          nino: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
              categoria: true
            }
          }
        },
        orderBy: {
          fecha: 'desc'
        }
      })

      if (evaluaciones.length > 0) {
        // Calcular promedios por competencia
        const calcularPromedio = (valores: (number | null | undefined)[]) => {
          const validos = valores.filter(v => v !== null && v !== undefined) as number[]
          return validos.length > 0 ? validos.reduce((a, b) => a + b, 0) / validos.length : 0
        }

        const promedios = {
          tecnico: calcularPromedio([
            ...evaluaciones.map(e => e.tecControl),
            ...evaluaciones.map(e => e.tecPase),
            ...evaluaciones.map(e => e.tecTiro),
            ...evaluaciones.map(e => e.tecRegate),
            ...evaluaciones.map(e => e.tecCabeceo)
          ]),
          tactico: calcularPromedio([
            ...evaluaciones.map(e => e.tacPosicionamiento),
            ...evaluaciones.map(e => e.tacLectura),
            ...evaluaciones.map(e => e.tacMarcaje),
            ...evaluaciones.map(e => e.tacCobertura),
            ...evaluaciones.map(e => e.tacVision)
          ]),
          fisico: calcularPromedio([
            ...evaluaciones.map(e => e.fisVelocidad),
            ...evaluaciones.map(e => e.fisResistencia),
            ...evaluaciones.map(e => e.fisFuerza),
            ...evaluaciones.map(e => e.fisAgilidad),
            ...evaluaciones.map(e => e.fisFlexibilidad)
          ]),
          psicologico: calcularPromedio([
            ...evaluaciones.map(e => e.psiConcentracion),
            ...evaluaciones.map(e => e.psiLiderazgo),
            ...evaluaciones.map(e => e.psiDisciplina),
            ...evaluaciones.map(e => e.psiMotivacion),
            ...evaluaciones.map(e => e.psiTrabEquipo)
          ])
        }

        // Top 5 jugadores por promedio general
        const jugadoresConPromedio = evaluaciones.reduce((acc: any, eva) => {
          const ninoId = eva.ninoId
          if (!acc[ninoId]) {
            acc[ninoId] = {
              nino: eva.nino,
              evaluaciones: [],
              promedioGeneral: 0
            }
          }
          acc[ninoId].evaluaciones.push(eva)
          return acc
        }, {})

        const topJugadores = Object.values(jugadoresConPromedio)
          .map((jug: any) => {
            const todasLasCompetencias = [
              ...jug.evaluaciones.map((e: any) => e.tecControl),
              ...jug.evaluaciones.map((e: any) => e.tecPase),
              ...jug.evaluaciones.map((e: any) => e.tecTiro),
              ...jug.evaluaciones.map((e: any) => e.tecRegate),
              ...jug.evaluaciones.map((e: any) => e.tecCabeceo),
              ...jug.evaluaciones.map((e: any) => e.tacPosicionamiento),
              ...jug.evaluaciones.map((e: any) => e.tacLectura),
              ...jug.evaluaciones.map((e: any) => e.tacMarcaje),
              ...jug.evaluaciones.map((e: any) => e.tacCobertura),
              ...jug.evaluaciones.map((e: any) => e.tacVision),
              ...jug.evaluaciones.map((e: any) => e.fisVelocidad),
              ...jug.evaluaciones.map((e: any) => e.fisResistencia),
              ...jug.evaluaciones.map((e: any) => e.fisFuerza),
              ...jug.evaluaciones.map((e: any) => e.fisAgilidad),
              ...jug.evaluaciones.map((e: any) => e.fisFlexibilidad),
              ...jug.evaluaciones.map((e: any) => e.psiConcentracion),
              ...jug.evaluaciones.map((e: any) => e.psiLiderazgo),
              ...jug.evaluaciones.map((e: any) => e.psiDisciplina),
              ...jug.evaluaciones.map((e: any) => e.psiMotivacion),
              ...jug.evaluaciones.map((e: any) => e.psiTrabEquipo)
            ].filter(v => v !== null && v !== undefined) as number[]
            
            jug.promedioGeneral = todasLasCompetencias.length > 0
              ? todasLasCompetencias.reduce((a, b) => a + b, 0) / todasLasCompetencias.length
              : 0
            return jug
          })
          .sort((a: any, b: any) => b.promedioGeneral - a.promedioGeneral)
          .slice(0, 5)
          .map((jug: any) => ({
            nombre: `${jug.nino.nombre} ${jug.nino.apellido}`,
            categoria: jug.nino.categoria,
            promedio: jug.promedioGeneral.toFixed(2)
          }))

        deportivos = {
          totalEvaluaciones: evaluaciones.length,
          promedios,
          topJugadores
        }
      }
    }

    // Estadísticas de asistencias
    const totalAsistencias = await prisma.asistencia.count()
    const asistenciasPuntuales = await prisma.asistencia.count({
      where: { puntual: true }
    })
    const porcentajePuntualidad = totalAsistencias > 0
      ? Math.round((asistenciasPuntuales / totalAsistencias) * 100)
      : 0

    const estadisticas = {
      generales: {
        totalNinos,
        totalRepresentantes,
        totalPagos,
        porcentajePagosAlDia: totalPagos > 0 ? Math.round((pagosPagados / totalPagos) * 100) : 0,
        porcentajePuntualidad
      },
      ninos: {
        porCategoria: ninosPorCategoria.map(item => ({
          categoria: item.categoria,
          cantidad: item._count.categoria
        }))
      },
      pagos: {
        pagados: pagosPagados,
        pendientes: pagosPendientes,
        vencidos: pagosVencidos,
        ingresosTotales: ingresosTotales._sum.monto || 0,
        ingresosMesActual: ingresosMesActual._sum.monto || 0,
        ...(includeProyecciones && {
          ingresosUltimosMeses,
          proyeccionIngresos
        })
      },
      deudores: {
        cantidad: representantesDeudores.length,
        lista: representantesDeudores.map(rep => ({
          id: rep.id,
          nombre: rep.nombre,
          cedula: rep.cedula,
          email: rep.email,
          pagosPendientes: rep._count.pagos
        }))
      },
      ...(deportivos && { deportivos }),
      asistencias: {
        total: totalAsistencias,
        puntuales: asistenciasPuntuales,
        porcentajePuntualidad
      }
    }

    return NextResponse.json(estadisticas)
  } catch (error) {
    console.error('Error al obtener estadísticas:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
