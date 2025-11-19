import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'
import { sendEmail } from '@/lib/email'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// Función helper para obtener usuario del token
async function getUserFromToken(request: NextRequest) {
  try {
    const token = request.cookies.get('football_auth_token')?.value ||
                  request.headers.get('authorization')?.replace('Bearer ', '')

    if (!token) return null

    const decoded = jwt.verify(token, JWT_SECRET) as any
    const usuario = await prisma.usuario.findUnique({
      where: { id: decoded.userId }
    })
    return usuario
  } catch {
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    const usuario = await getUserFromToken(request)
    if (!usuario) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Solo admin puede ver todas las notificaciones push
    if (usuario.rol !== 'admin') {
      return NextResponse.json(
        { error: 'Solo administradores pueden ver notificaciones push' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const enviada = searchParams.get('enviada')

    const where: any = {
      tipo: 'Push'
    }

    if (enviada !== null) {
      where.enviada = enviada === 'true'
    }

    const notificaciones = await prisma.notificacion.findMany({
      where,
      include: {
        representante: {
          select: {
            id: true,
            nombre: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(notificaciones)
  } catch (error) {
    console.error('Error al obtener notificaciones push:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const usuario = await getUserFromToken(request)
    if (!usuario) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Solo admin puede crear notificaciones push
    if (usuario.rol !== 'admin') {
      return NextResponse.json(
        { error: 'Solo administradores pueden crear notificaciones push' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { titulo, mensaje, segmentoRol, segmentoCategoria, segmentoGrupo, prioridad, enviarAhora } = body

    if (!titulo || !mensaje) {
      return NextResponse.json(
        { error: 'El título y mensaje son requeridos' },
        { status: 400 }
      )
    }

    // Crear la notificación
    const notificacion = await prisma.notificacion.create({
      data: {
        tipo: 'Push',
        titulo: titulo.trim(),
        mensaje: mensaje.trim(),
        metodoEnvio: 'Push',
        segmentoRol: segmentoRol || 'todos',
        segmentoCategoria: segmentoCategoria || null,
        segmentoGrupo: segmentoGrupo || null,
        prioridad: prioridad || 'normal',
        enviada: false
      }
    })

    // Si se solicita enviar ahora, procesar el envío
    if (enviarAhora) {
      await enviarNotificacionPush(notificacion.id)
    }

    return NextResponse.json(notificacion, { status: 201 })
  } catch (error) {
    console.error('Error al crear notificación push:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// Función para enviar notificación push a los usuarios segmentados
async function enviarNotificacionPush(notificacionId: string) {
  try {
    const notificacion = await prisma.notificacion.findUnique({
      where: { id: notificacionId }
    })

    if (!notificacion) {
      throw new Error('Notificación no encontrada')
    }

    // Construir filtro de usuarios según segmentación
    const whereUsuario: any = {
      activo: true
    }

    if (notificacion.segmentoRol && notificacion.segmentoRol !== 'todos') {
      whereUsuario.rol = notificacion.segmentoRol
    }

    // Obtener usuarios según segmentación
    const usuarios = await prisma.usuario.findMany({
      where: whereUsuario,
      include: {
        representante: {
          select: {
            email: true,
            nombre: true
          }
        }
      }
    })

    // Filtrar por categoría si aplica
    let usuariosFiltrados = usuarios
    if (notificacion.segmentoCategoria) {
      usuariosFiltrados = usuarios.filter(u => u.categoria === notificacion.segmentoCategoria)
    }

    // Enviar notificaciones por email
    const resultados: Array<{ email: string; success: boolean; error?: string }> = []
    
    for (const usuario of usuariosFiltrados) {
      const email = usuario.representante?.email || usuario.email
      const nombre = usuario.representante?.nombre || usuario.nombre

      try {
        const resultado = await sendEmail({
          to: email,
          subject: `🔔 ${notificacion.titulo}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #2D3748;">🔔 ${notificacion.titulo}</h2>
              
              <p>Estimado/a ${nombre},</p>
              
              <div style="background-color: #F7FAFC; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4299E1;">
                <p style="color: #2D3748; line-height: 1.6; white-space: pre-line;">${notificacion.mensaje}</p>
              </div>
              
              <p style="color: #718096; font-size: 14px; margin-top: 30px;">
                Este es un mensaje automático del sistema de notificaciones.
              </p>
              
              <p style="color: #2D3748; font-weight: bold;">
                Club de Fútbol - Sistema de Notificaciones
              </p>
            </div>
          `
        })

        resultados.push({
          email,
          success: resultado.success,
          error: resultado.error
        })
      } catch (error: any) {
        resultados.push({
          email,
          success: false,
          error: error.message
        })
      }
    }

    // Actualizar notificación como enviada
    await prisma.notificacion.update({
      where: { id: notificacionId },
      data: {
        enviada: true,
        fechaEnvio: new Date()
      }
    })

    return {
      total: usuariosFiltrados.length,
      exitosos: resultados.filter(r => r.success).length,
      fallidos: resultados.filter(r => !r.success).length,
      resultados
    }
  } catch (error) {
    console.error('Error al enviar notificación push:', error)
    throw error
  }
}

export async function PUT(request: NextRequest) {
  try {
    const usuario = await getUserFromToken(request)
    if (!usuario || usuario.rol !== 'admin') {
      return NextResponse.json(
        { error: 'Solo administradores pueden enviar notificaciones' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { notificacionId } = body

    if (!notificacionId) {
      return NextResponse.json(
        { error: 'ID de notificación requerido' },
        { status: 400 }
      )
    }

    const resultado = await enviarNotificacionPush(notificacionId)

    return NextResponse.json(resultado)
  } catch (error: any) {
    console.error('Error al enviar notificación push:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    )
  }
}


