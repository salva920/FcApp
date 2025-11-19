import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendNotificacionEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { fecha, categoria } = body

    // Fecha del día (si no se proporciona, usar hoy)
    const fechaConsulta = fecha ? new Date(fecha) : new Date()
    fechaConsulta.setHours(0, 0, 0, 0)
    const fechaFinDia = new Date(fechaConsulta)
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

    // Obtener asistencias del día
    const asistenciasHoy = await prisma.asistencia.findMany({
      where: {
        fecha: {
          gte: fechaConsulta,
          lte: fechaFinDia
        },
        tipo: 'entrada'
      },
      select: {
        ninoId: true
      }
    })

    const ninosConAsistenciaHoy = new Set(asistenciasHoy.map(a => a.ninoId))
    const inasistencias = todosLosNinos.filter(nino => !ninosConAsistenciaHoy.has(nino.id))

    // Enviar notificaciones
    const notificacionesEnviadas = []
    const errores = []

    for (const nino of inasistencias) {
      if (!nino.representante.email) {
        errores.push({
          nino: `${nino.nombre} ${nino.apellido}`,
          motivo: 'Representante sin email'
        })
        continue
      }

      try {
        await sendNotificacionEmail(
          {
            nombre: nino.representante.nombre,
            email: nino.representante.email
          },
          {
            titulo: `Inasistencia de ${nino.nombre} ${nino.apellido}`,
            mensaje: `Le informamos que ${nino.nombre} ${nino.apellido} no registró asistencia el día ${fechaConsulta.toLocaleDateString('es-ES')}. Por favor, contacte con la administración si tiene alguna consulta.`,
            tipo: 'Recordatorio'
          }
        )

        // Guardar notificación en la base de datos
        await prisma.notificacion.create({
          data: {
            tipo: 'Recordatorio',
            titulo: `Inasistencia de ${nino.nombre} ${nino.apellido}`,
            mensaje: `No registró asistencia el día ${fechaConsulta.toLocaleDateString('es-ES')}`,
            enviada: true,
            fechaEnvio: new Date(),
            metodoEnvio: 'Email',
            representanteId: nino.representante.id
          }
        })

        notificacionesEnviadas.push({
          nino: `${nino.nombre} ${nino.apellido}`,
          representante: nino.representante.nombre,
          email: nino.representante.email
        })
      } catch (error) {
        console.error(`Error enviando notificación a ${nino.representante.email}:`, error)
        errores.push({
          nino: `${nino.nombre} ${nino.apellido}`,
          motivo: 'Error al enviar email'
        })
      }
    }

    return NextResponse.json({
      success: true,
      totalInasistencias: inasistencias.length,
      notificacionesEnviadas: notificacionesEnviadas.length,
      errores: errores.length,
      detalles: {
        enviadas: notificacionesEnviadas,
        errores
      }
    })
  } catch (error) {
    console.error('Error al notificar inasistencias:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

