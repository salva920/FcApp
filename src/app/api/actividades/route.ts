import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendActividadCreadaNotification } from '@/lib/email'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fechaInicio = searchParams.get('fechaInicio')
    const fechaFin = searchParams.get('fechaFin')
    const tipo = searchParams.get('tipo')

    let where: any = {}
    
    if (fechaInicio && fechaFin) {
      where.fechaInicio = {
        gte: new Date(fechaInicio)
      }
      where.fechaFin = {
        lte: new Date(fechaFin)
      }
    }
    
    if (tipo) {
      where.tipo = tipo
    }

    const actividades = await prisma.actividad.findMany({
      where,
      include: {
        instructor: true,
        cancha: true,
        recordatorios: true
      },
      orderBy: {
        fechaInicio: 'asc'
      }
    })

    return NextResponse.json(actividades)
  } catch (error) {
    console.error('Error al obtener actividades:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      titulo,
      descripcion,
      tipo,
      fechaInicio,
      fechaFin,
      color,
      categoria,
      instructorId,
      canchaId,
      recordatorios
    } = body

    if (!titulo || !tipo || !fechaInicio || !fechaFin) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos' },
        { status: 400 }
      )
    }

    // Crear la actividad (si la crea un profesor marcar Pendiente)
    const estadoInicial = body.creadoPorRol === 'profesor' ? 'Pendiente' : 'Aprobada'
    const actividad = await prisma.actividad.create({
      data: {
        titulo,
        descripcion,
        tipo,
        fechaInicio: new Date(fechaInicio),
        fechaFin: new Date(fechaFin),
        color: color || 'blue',
        categoria,
        instructorId,
        canchaId,
        activo: true,
        estado: estadoInicial,
        creadoPorRol: body.creadoPorRol || undefined
      },
      include: {
        instructor: true,
        cancha: true
      }
    })

    // Si se proporcionan recordatorios, crearlos
    if (recordatorios && Array.isArray(recordatorios)) {
      await Promise.all(
        recordatorios.map((recordatorio: any) =>
          prisma.recordatorio.create({
            data: {
              titulo: recordatorio.titulo || `Recordatorio: ${titulo}`,
              mensaje: recordatorio.mensaje || `Recuerda que tienes ${titulo} el ${new Date(fechaInicio).toLocaleDateString('es-ES')}`,
              fechaEnvio: new Date(recordatorio.fechaEnvio),
              tipoEnvio: recordatorio.tipoEnvio || 'Email',
              actividadId: actividad.id,
              activo: true
            }
          })
        )
      )
    }

    // Si hay categoría seleccionada y la actividad está aprobada, notificar a representantes
    if (actividad.estado === 'Aprobada' && categoria && categoria !== '') {
      try {
        // Obtener representantes con hijos en esa categoría
        const representantes = await prisma.representante.findMany({
          where: {
            ninos: {
              some: {
                categoria: categoria,
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

        console.log(`📧 Enviando ${representantes.length} notificaciones de actividad creada a categoría ${categoria}`)

        // Enviar notificaciones de forma asíncrona (no bloquear la respuesta)
        Promise.all(
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
                  tipo: 'Evento',
                  titulo: `Nueva ${actividad.tipo}: ${actividad.titulo}`,
                  mensaje: `Se ha programado una nueva actividad el ${new Date(fechaInicio).toLocaleDateString('es-ES')} a las ${new Date(fechaInicio).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}. ${actividad.categoria ? `Categoría: ${actividad.categoria}` : ''}`,
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
        console.error('Error al enviar notificaciones de actividad:', error)
        // No fallar la creación de la actividad si fallan las notificaciones
      }
    }

    // Notificar a admin si quedó Pendiente
    if (actividad.estado === 'Pendiente') {
      try {
        const adminEmail = process.env.ADMIN_EMAIL
        if (adminEmail) {
          // Reutilizamos plantilla de notificación genérica
          await sendActividadCreadaNotification(
            { nombre: 'Administrador', email: adminEmail },
            {
              titulo: `Aprobación requerida: ${actividad.titulo}`,
              tipo: actividad.tipo,
              fechaInicio: actividad.fechaInicio,
              fechaFin: actividad.fechaFin,
              categoria: actividad.categoria || undefined,
              instructor: actividad.instructor ? { nombre: actividad.instructor.nombre } : undefined,
              cancha: actividad.cancha ? { nombre: actividad.cancha.nombre } : undefined,
              descripcion: actividad.descripcion ? `${actividad.descripcion} (Pendiente de aprobación)` : 'Pendiente de aprobación'
            }
          )
        }
      } catch (e) {
        console.error('Error notificando al admin sobre actividad pendiente:', e)
      }
    }

    return NextResponse.json(actividad, { status: 201 })
  } catch (error) {
    console.error('Error al crear actividad:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
