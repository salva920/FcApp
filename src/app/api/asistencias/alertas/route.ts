import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { format, startOfDay, endOfDay } from 'date-fns'

export async function GET(request: NextRequest) {
  try {
    const fecha = new Date()
    const fechaInicio = startOfDay(fecha)
    const fechaFin = endOfDay(fecha)

    // Obtener todos los niños activos
    const ninos = await prisma.nino.findMany({
      where: {
        activo: true
      },
      include: {
        representante: true
      }
    })

    // Obtener asistencias del día
    const asistenciasHoy = await prisma.asistencia.findMany({
      where: {
        fecha: {
          gte: fechaInicio,
          lte: fechaFin
        }
      },
      include: {
        nino: true
      }
    })

    // Crear un mapa de niños que asistieron
    const ninosConAsistencia = new Set(asistenciasHoy.map(a => a.ninoId))

    // Encontrar niños sin asistencia
    const ninosSinAsistencia = ninos.filter(nino => !ninosConAsistencia.has(nino.id))

    // Crear notificaciones para representantes de niños sin asistencia
    const notificaciones = ninosSinAsistencia.map(nino => ({
      ninoId: nino.id,
      ninoNombre: `${nino.nombre} ${nino.apellido}`,
      categoria: nino.categoria,
      representante: {
        id: nino.representante.id,
        nombre: nino.representante.nombre,
        email: nino.representante.email,
        telefono: nino.representante.telefono
      },
      fecha: format(fecha, 'yyyy-MM-dd')
    }))

    return NextResponse.json({
      fecha: format(fecha, 'yyyy-MM-dd'),
      totalNinos: ninos.length,
      ninosConAsistencia: asistenciasHoy.length,
      ninosSinAsistencia: ninosSinAsistencia.length,
      notificaciones
    })
  } catch (error) {
    console.error('Error al verificar inasistencias:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { fecha } = body

    const fechaInicio = startOfDay(new Date(fecha))
    const fechaFin = endOfDay(new Date(fecha))

    // Obtener todos los niños activos
    const ninos = await prisma.nino.findMany({
      where: {
        activo: true
      },
      include: {
        representante: true
      }
    })

    // Obtener asistencias del día
    const asistenciasHoy = await prisma.asistencia.findMany({
      where: {
        fecha: {
          gte: fechaInicio,
          lte: fechaFin
        }
      },
      include: {
        nino: true
      }
    })

    // Crear un mapa de niños que asistieron
    const ninosConAsistencia = new Set(asistenciasHoy.map(a => a.ninoId))

    // Encontrar niños sin asistencia
    const ninosSinAsistencia = ninos.filter(nino => !ninosConAsistencia.has(nino.id))

    // Crear registros de notificación para cada representante
    const notificacionesCreadas = []
    
    for (const nino of ninosSinAsistencia) {
      try {
        const notificacion = await prisma.notificacion.create({
          data: {
            tipo: 'Recordatorio',
            titulo: `Falta de Asistencia - ${format(new Date(fecha), 'dd/MM/yyyy')}`,
            mensaje: `Su hijo/a ${nino.nombre} ${nino.apellido} no registró asistencia el día ${format(new Date(fecha), 'dd/MM/yyyy')}. Por favor, confirme su ausencia o contacte con nosotros si hubo algún problema.`,
            enviada: false,
            metodoEnvio: 'Email',
            representanteId: nino.representanteId
          }
        })
        
        notificacionesCreadas.push({
          id: notificacion.id,
          nino: `${nino.nombre} ${nino.apellido}`,
          representante: nino.representante.nombre,
          email: nino.representante.email
        })
      } catch (error) {
        console.error('Error creando notificación:', error)
      }
    }

    return NextResponse.json({
      fecha: format(new Date(fecha), 'yyyy-MM-dd'),
      ninosSinAsistencia: ninosSinAsistencia.length,
      notificacionesCreadas: notificacionesCreadas.length,
      detalle: notificacionesCreadas
    })
  } catch (error) {
    console.error('Error al crear notificaciones de inasistencia:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
