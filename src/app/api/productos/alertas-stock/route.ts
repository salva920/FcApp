import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Obtener todos los productos activos
    const todosLosProductos = await prisma.producto.findMany({
      where: {
        activo: true
      }
    })

    // Filtrar productos con stock bajo
    const productosBajoStock = todosLosProductos.filter(p => p.stock <= p.stockMinimo)

    // Calcular estadísticas
    const estadisticas = {
      totalProductos: todosLosProductos.length,
      productosBajoStock: productosBajoStock.length,
      productosSinStock: productosBajoStock.filter(p => p.stock === 0).length,
      productosCriticos: productosBajoStock.filter(p => p.stock > 0 && p.stock <= 3).length
    }

    return NextResponse.json({
      estadisticas,
      productos: productosBajoStock
    })
  } catch (error) {
    console.error('Error al obtener alertas de stock:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
