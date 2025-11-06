import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const categoria = searchParams.get('categoria')
    const activos = searchParams.get('activos')

    let where: any = {}
    
    if (categoria) {
      where.categoria = categoria
    }
    
    if (activos === 'true') {
      where.activo = true
    }

    const productos = await prisma.producto.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(productos)
  } catch (error) {
    console.error('Error al obtener productos:', error)
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
      nombre,
      descripcion,
      categoria,
      precio,
      stock,
      stockMinimo,
      imagen,
      tallas,
      activo
    } = body

    if (!nombre || !categoria || precio === undefined) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos' },
        { status: 400 }
      )
    }

    const producto = await prisma.producto.create({
      data: {
        nombre,
        descripcion,
        categoria,
        precio: parseFloat(precio),
        stock: stock || 0,
        stockMinimo: stockMinimo || 5,
        imagen,
        tallas: tallas || [],
        activo: activo !== undefined ? activo : true
      }
    })

    return NextResponse.json(producto, { status: 201 })
  } catch (error) {
    console.error('Error al crear producto:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
