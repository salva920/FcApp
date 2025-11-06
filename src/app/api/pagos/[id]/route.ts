import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const {
      monto,
      concepto,
      fechaVencimiento,
      fechaPago,
      estado,
      metodoPago,
      comprobante,
      observaciones
    } = body

    const pago = await prisma.pago.update({
      where: { id: params.id },
      data: {
        monto: parseFloat(monto),
        concepto,
        fechaVencimiento: new Date(fechaVencimiento),
        fechaPago: fechaPago ? new Date(fechaPago) : null,
        estado,
        metodoPago,
        comprobante,
        observaciones
      },
      include: {
        representante: true
      }
    })

    return NextResponse.json(pago)
  } catch (error) {
    console.error('Error al actualizar pago:', error)
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
    await prisma.pago.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Pago eliminado correctamente' })
  } catch (error) {
    console.error('Error al eliminar pago:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
