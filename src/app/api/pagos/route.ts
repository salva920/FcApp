import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const representanteId = searchParams.get('representanteId')
    const estado = searchParams.get('estado')

    const where: any = {}
    if (representanteId) where.representanteId = representanteId
    if (estado) where.estado = estado

    const pagos = await prisma.pago.findMany({
      where,
      include: {
        representante: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(pagos)
  } catch (error) {
    console.error('Error al obtener pagos:', error)
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
      monto,
      concepto,
      fechaVencimiento,
      fechaPago,
      estado,
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

    const pago = await prisma.pago.create({
      data: {
        monto: parseFloat(monto),
        concepto,
        fechaVencimiento: new Date(fechaVencimiento),
        fechaPago: fechaPago ? new Date(fechaPago) : null,
        estado,
        metodoPago,
        comprobante,
        observaciones,
        representanteId
      },
      include: {
        representante: true
      }
    })

    return NextResponse.json(pago, { status: 201 })
  } catch (error) {
    console.error('Error al crear pago:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

