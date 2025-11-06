import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendNotificacionEmail } from '@/lib/email'

export async function GET() {
  try {
    const notificaciones = await prisma.notificacion.findMany({
      include: {
        representante: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(notificaciones)
  } catch (error) {
    console.error('Error al obtener notificaciones:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tipo, titulo, mensaje, metodoEnvio, representanteId } = body

    // Si no se especifica representante, es una notificación masiva
    if (representanteId) {
      // Notificación individual
      const notificacion = await prisma.notificacion.create({
        data: {
          tipo,
          titulo,
          mensaje,
          metodoEnvio,
          representanteId
        },
        include: {
          representante: true
        }
      })

      // Enviar email si el método incluye email
      if (metodoEnvio && (metodoEnvio.includes('Email') || metodoEnvio.includes('Ambos'))) {
        try {
          const emailResult = await sendNotificacionEmail(
            notificacion.representante!,
            { titulo, mensaje, tipo }
          )
          if (!emailResult.success) {
            console.warn('⚠️ No se pudo enviar el email:', emailResult.error)
          }
        } catch (emailError) {
          console.error('❌ Error enviando email:', emailError)
        }
      }

      // Marcar como enviada
      await prisma.notificacion.update({
        where: { id: notificacion.id },
        data: {
          enviada: true,
          fechaEnvio: new Date()
        }
      })

      return NextResponse.json(notificacion, { status: 201 })
    } else {
      // Notificación masiva - obtener todos los representantes
      const representantes = await prisma.representante.findMany()
      
      const notificaciones = await Promise.all(
        representantes.map(rep =>
          prisma.notificacion.create({
            data: {
              tipo,
              titulo,
              mensaje,
              metodoEnvio,
              representanteId: rep.id
            }
          })
        )
      )

      // Enviar emails si el método incluye email
      if (metodoEnvio && (metodoEnvio.includes('Email') || metodoEnvio.includes('Ambos'))) {
        let enviados = 0
        let fallidos = 0
        
        for (let i = 0; i < representantes.length; i++) {
          try {
            const emailResult = await sendNotificacionEmail(
              representantes[i],
              { titulo, mensaje, tipo }
            )
            if (emailResult.success) {
              enviados++
            } else {
              fallidos++
              console.warn(`⚠️ No se pudo enviar email a ${representantes[i].email}:`, emailResult.error)
            }
          } catch (emailError) {
            fallidos++
            console.error(`❌ Error enviando email a ${representantes[i].email}:`, emailError)
          }
        }
        
        console.log(`✅ Emails enviados: ${enviados}, fallidos: ${fallidos}`)
      }

      // Marcar todas como enviadas
      await prisma.notificacion.updateMany({
        where: {
          id: {
            in: notificaciones.map(n => n.id)
          }
        },
        data: {
          enviada: true,
          fechaEnvio: new Date()
        }
      })

      return NextResponse.json({ 
        message: `Notificación enviada a ${representantes.length} representantes`,
        count: representantes.length
      }, { status: 201 })
    }
  } catch (error) {
    console.error('Error al crear notificación:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

