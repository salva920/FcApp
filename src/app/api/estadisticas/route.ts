import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Estadísticas generales
    const totalNinos = await prisma.nino.count()
    const totalRepresentantes = await prisma.representante.count()
    
    // Niños por categoría
    const ninosPorCategoria = await prisma.nino.groupBy({
      by: ['categoria'],
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

    const estadisticas = {
      generales: {
        totalNinos,
        totalRepresentantes,
        totalPagos,
        porcentajePagosAlDia: totalPagos > 0 ? Math.round((pagosPagados / totalPagos) * 100) : 0
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
        ingresosMesActual: ingresosMesActual._sum.monto || 0
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
