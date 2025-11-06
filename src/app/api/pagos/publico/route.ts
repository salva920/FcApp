import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendPagoRecibidoNotification } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      monto,
      concepto,
      fechaVencimiento,
      fechaPago,
      metodoPago,
      comprobante,
      observaciones,
      representanteId
    } = body

    // Verificar que el representante existe
    const representante = await prisma.representante.findUnique({
      where: { id: representanteId }
    })

    if (!representante) {
      return NextResponse.json(
        { error: 'Representante no encontrado' },
        { status: 400 }
      )
    }

    // Crear el pago con estado de verificación pendiente
    const pago = await prisma.pago.create({
      data: {
        monto: parseFloat(monto),
        concepto,
        fechaVencimiento: new Date(fechaVencimiento),
        fechaPago: fechaPago ? new Date(fechaPago) : null,
        estado: 'Pendiente',
        metodoPago,
        comprobante,
        observaciones,
        estadoVerificacion: 'Pendiente',
        representanteId
      },
      include: {
        representante: true
      }
    })

    // Enviar notificación por correo al representante
    try {
      console.log('📧 Enviando notificación de pago recibido a:', representante.email)
      console.log('📧 Datos del pago:', {
        concepto: pago.concepto,
        monto: pago.monto,
        fechaPago: pago.fechaPago,
        metodoPago: pago.metodoPago
      })
      const emailResult = await sendPagoRecibidoNotification(representante, pago)
      console.log('📧 Resultado del envío:', emailResult)
      if (!emailResult.success) {
        console.warn('⚠️ No se pudo enviar el email:', emailResult.error)
      }
    } catch (emailError) {
      console.error('❌ Error enviando notificación:', emailError)
      // No fallar el proceso si el email falla
    }

    return NextResponse.json(pago, { status: 201 })
  } catch (error) {
    console.error('Error al crear pago público:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
