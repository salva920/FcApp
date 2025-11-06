import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendActividadCanceladaNotification, sendActividadCreadaNotification } from '@/lib/email'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const actividad = await prisma.actividad.findUnique({
      where: { id: params.id },
      include: {
        instructor: true,
        cancha: true,
        recordatorios: true
      }
    })

    if (!actividad) {
      return NextResponse.json(
        { error: 'Actividad no encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json(actividad)
  } catch (error) {
    console.error('Error al obtener actividad:', error)
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
    const body = await request.json()
    const { activo, motivoCancelacion, estado, aprobadoPor } = body

    // Actualizar la actividad
    const actividad = await prisma.actividad.update({
      where: { id: params.id },
      data: {
        activo: activo !== undefined ? activo : undefined,
        ...(motivoCancelacion && { descripcion: motivoCancelacion }),
        ...(estado && { estado }),
        ...(aprobadoPor && { aprobadoPor, aprobadoEn: new Date() })
      },
      include: {
        instructor: true,
        cancha: true
      }
    })
    // Si se aprobó la actividad y tiene categoría, notificar a representantes
    if (estado === 'Aprobada' && actividad.categoria && actividad.categoria !== '') {
      try {
        const representantes = await prisma.representante.findMany({
          where: {
            ninos: {
              some: { categoria: actividad.categoria, activo: true }
            }
          },
          select: { id: true, nombre: true, email: true }
        })

        await Promise.all(
          representantes.map(async (rep) => {
            try {
              await sendActividadCreadaNotification(
                { nombre: rep.nombre, email: rep.email },
                {
                  titulo: actividad.titulo,
                  tipo: actividad.tipo,
                  fechaInicio: actividad.fechaInicio,
                  fechaFin: actividad.fechaFin,
                  categoria: actividad.categoria || undefined,
                  instructor: actividad.instructor ? { nombre: actividad.instructor.nombre } : undefined,
                  cancha: actividad.cancha ? { nombre: actividad.cancha.nombre } : undefined,
                  descripcion: actividad.descripcion || undefined
                }
              )
              await new Promise(resolve => setTimeout(resolve, 2000))
            } catch (error) {
              console.error('Error notificando representante:', error)
            }
          })
        )
      } catch (error) {
        console.error('Error al notificar tras aprobación:', error)
      }
    }


    // Si se está cancelando y hay categoría, enviar notificaciones
    if (activo === false && actividad.categoria && actividad.categoria !== '') {
      try {
        // Obtener representantes con hijos en esa categoría
        const representantes = await prisma.representante.findMany({
          where: {
            ninos: {
              some: {
                categoria: actividad.categoria,
                activo: true
              }
            }
          },
          select: {
            id: true,
            nombre: true,
            email: true
          }
        })

        console.log(`📧 Enviando ${representantes.length} notificaciones de actividad cancelada a categoría ${actividad.categoria}`)

        // Enviar notificaciones de forma asíncrona
        Promise.all(
          representantes.map(async (rep) => {
            try {
              await sendActividadCanceladaNotification(
                { nombre: rep.nombre, email: rep.email },
                {
                  titulo: actividad.titulo,
                  tipo: actividad.tipo,
                  fechaInicio: actividad.fechaInicio,
                  categoria: actividad.categoria || undefined,
                  instructor: actividad.instructor ? { nombre: actividad.instructor.nombre } : undefined,
                  cancha: actividad.cancha ? { nombre: actividad.cancha.nombre } : undefined,
                  motivo: motivoCancelacion || undefined
                }
              )
              // Pequeño delay para evitar rate limiting de Gmail
              await new Promise(resolve => setTimeout(resolve, 2000))
            } catch (error) {
              console.error(`Error enviando notificación a ${rep.email}:`, error)
            }
          })
        ).catch(error => {
          console.error('Error en el envío masivo de notificaciones:', error)
        })

        // También crear registro en la tabla de notificaciones
        await Promise.all(
          representantes.map(async (rep) => {
            try {
              await prisma.notificacion.create({
                data: {
                  tipo: 'Comunicado',
                  titulo: `${actividad.tipo} Cancelada: ${actividad.titulo}`,
                  mensaje: `La actividad programada para el ${new Date(actividad.fechaInicio).toLocaleDateString('es-ES')} a las ${new Date(actividad.fechaInicio).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} ha sido cancelada.${motivoCancelacion ? ` Motivo: ${motivoCancelacion}` : ''}`,
                  metodoEnvio: 'Email',
                  representanteId: rep.id,
                  enviada: true,
                  fechaEnvio: new Date()
                }
              })
            } catch (error) {
              console.error(`Error creando registro de notificación para ${rep.id}:`, error)
            }
          })
        )
      } catch (error) {
        console.error('Error al enviar notificaciones de cancelación:', error)
        // No fallar la cancelación si fallan las notificaciones
      }
    }

    return NextResponse.json(actividad)
  } catch (error) {
    console.error('Error al actualizar actividad:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.actividad.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Actividad eliminada exitosamente' })
  } catch (error) {
    console.error('Error al eliminar actividad:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

