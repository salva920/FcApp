import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendPagoVerificadoNotification } from '@/lib/email'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { estadoVerificacion, comentarioAdmin, verificadoPor } = body

    // Obtener el pago con la información del representante
    const pago = await prisma.pago.findUnique({
      where: { id: params.id },
      include: { representante: true }
    })

    if (!pago) {
      return NextResponse.json(
        { error: 'Pago no encontrado' },
        { status: 404 }
      )
    }

    // Actualizar el pago
    const pagoActualizado = await prisma.pago.update({
      where: { id: params.id },
      data: {
        estadoVerificacion,
        comentarioAdmin,
        fechaVerificacion: new Date(),
        verificadoPor,
        estado: estadoVerificacion === 'Aprobado' ? 'Pagado' : 'Pendiente'
      },
      include: {
        representante: true
      }
    })

    // Si el pago fue aprobado y es una mensualidad, crear la siguiente mensualidad automáticamente
    if (estadoVerificacion === 'Aprobado' && pagoActualizado.concepto === 'Mensualidad') {
      try {
        const fechaActual = new Date(pagoActualizado.fechaPago)
        const siguienteMes = new Date(fechaActual)
        siguienteMes.setMonth(siguienteMes.getMonth() + 1)
        
        // Crear la siguiente mensualidad
        const siguienteMensualidad = await prisma.pago.create({
          data: {
            representanteId: pagoActualizado.representanteId,
            concepto: 'Mensualidad',
            monto: pagoActualizado.monto,
            fechaVencimiento: siguienteMes,
            fechaPago: siguienteMes,
            estado: 'Pendiente',
            metodoPago: null,
            comprobante: null,
            observaciones: `Mensualidad generada automáticamente`,
            estadoVerificacion: 'Pendiente',
            comentarioAdmin: null,
            fechaVerificacion: null,
            verificadoPor: null
          }
        })
        
        console.log('✅ Siguiente mensualidad generada:', siguienteMensualidad.id)
      } catch (error) {
        console.error('Error al generar siguiente mensualidad:', error)
      }
    }

    // Enviar notificación por correo al representante
    try {
      const emailResult = await sendPagoVerificadoNotification(pagoActualizado)
      if (!emailResult.success) {
        console.warn('⚠️ No se pudo enviar el email:', emailResult.error)
      }
    } catch (emailError) {
      console.error('Error enviando notificación:', emailError)
    }

    return NextResponse.json(pagoActualizado)
  } catch (error) {
    console.error('Error al verificar pago:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
