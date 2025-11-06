import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendNotificacionEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { representanteId } = body

    if (!representanteId) {
      return NextResponse.json({ error: 'representanteId es requerido' }, { status: 400 })
    }

    const carrito = await prisma.carrito.findFirst({
      where: { representanteId, activo: true },
      include: {
        items: { include: { producto: true } },
        representante: { select: { id: true, nombre: true, email: true, cedula: true } }
      }
    })

    if (!carrito || carrito.items.length === 0) {
      return NextResponse.json({ error: 'El carrito está vacío' }, { status: 400 })
    }

    const total = carrito.items.reduce((sum, it) => sum + (it.producto?.precio || 0) * it.cantidad, 0)

    const descripcion = carrito.items
      .map((it) => `${it.producto?.nombre || 'Producto'} x${it.cantidad}${it.talla ? ` (Talla ${it.talla})` : ''}`)
      .join(', ')

    // Crear Pago pendiente en el sistema de pagos
    const pago = await prisma.pago.create({
      data: {
        representanteId,
        concepto: 'Compra Tienda',
        monto: total,
        estado: 'Pendiente',
        estadoVerificacion: 'Pendiente',
        metodoPago: 'Tienda',
        observaciones: descripcion,
        fechaVencimiento: new Date()
      }
    })

    // Cerrar carrito actual
    await prisma.carrito.update({ where: { id: carrito.id }, data: { activo: false } })

    // Notificar al admin por email si está configurado
    try {
      const adminEmail = process.env.ADMIN_EMAIL
      if (adminEmail) {
        await sendNotificacionEmail(
          { nombre: 'Administrador', email: adminEmail },
          {
            tipo: 'Comunicado',
            titulo: `Nueva compra en Tienda por ${carrito.representante?.nombre || ''}`,
            mensaje: `Se registró una compra por $${total.toFixed(2)}. Detalle: ${descripcion}.`
          }
        )
      }
    } catch (e) {
      console.error('No se pudo notificar al admin:', e)
    }

    return NextResponse.json({ pagoId: pago.id, total, descripcion })
  } catch (error) {
    console.error('Error en checkout:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}


