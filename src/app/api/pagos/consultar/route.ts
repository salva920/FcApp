import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('query')

    if (!query) {
      return NextResponse.json(
        { error: 'Debe proporcionar la cédula o el nombre' },
        { status: 400 }
      )
    }

    console.log('🔍 Consultando pagos con query:', query)

    // Primero intentar búsqueda exacta por cédula
    let representante = await prisma.representante.findFirst({
      where: {
        cedula: query
      }
    })

    if (representante) {
      console.log('✅ Encontrado por cédula exacta:', representante.nombre, representante.cedula)
    }

    // Si no se encuentra, buscar por nombre o cédula parcial
    if (!representante) {
      console.log('⚠️ No se encontró por cédula exacta, buscando por nombre o cédula parcial...')
      representante = await prisma.representante.findFirst({
        where: {
          OR: [
            {
              cedula: {
                contains: query,
                mode: 'insensitive'
              }
            },
            {
              nombre: {
                contains: query,
                mode: 'insensitive'
              }
            }
          ]
        }
      })
      
      if (representante) {
        console.log('✅ Encontrado por búsqueda parcial:', representante.nombre, representante.cedula)
      }
    }

    if (!representante) {
      return NextResponse.json(
        { error: 'No se encontró un representante con los datos proporcionados' },
        { status: 404 }
      )
    }

    // Obtener todos los pagos del representante
    const pagos = await prisma.pago.findMany({
      where: {
        representanteId: representante.id
      },
      orderBy: {
        fechaPago: 'desc'
      }
    })

    // Calcular totales
    const totalPendiente = pagos
      .filter(p => p.estado === 'Pendiente')
      .reduce((sum, p) => sum + p.monto, 0)

    const totalPagado = pagos
      .filter(p => p.estado === 'Pagado')
      .reduce((sum, p) => sum + p.monto, 0)

    const totalVencido = pagos
      .filter(p => p.estado === 'Vencido')
      .reduce((sum, p) => sum + p.monto, 0)

    const resultado = {
      representante: {
        id: representante.id,
        nombre: representante.nombre,
        cedula: representante.cedula,
        email: representante.email,
        telefono: representante.telefono
      },
      pagos: pagos.map(pago => ({
        id: pago.id,
        concepto: pago.concepto,
        monto: pago.monto,
        fechaPago: pago.fechaPago,
        estado: pago.estado,
        estadoVerificacion: pago.estadoVerificacion,
        comentarioAdmin: pago.comentarioAdmin,
        fechaVerificacion: pago.fechaVerificacion,
        verificadoPor: pago.verificadoPor,
        comprobante: pago.comprobante
      })),
      totalPendiente,
      totalPagado,
      totalVencido
    }

    return NextResponse.json(resultado)
  } catch (error) {
    console.error('Error al consultar deudas:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}