import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const representanteId = searchParams.get('representanteId')

    if (!representanteId) {
      return NextResponse.json(
        { error: 'representanteId es requerido' },
        { status: 400 }
      )
    }

    // Buscar o crear carrito activo
    let carrito = await prisma.carrito.findFirst({
      where: {
        representanteId,
        activo: true
      },
      include: {
        items: {
          include: {
            producto: true
          }
        }
      }
    })

    if (!carrito) {
      carrito = await prisma.carrito.create({
        data: {
          representanteId,
          activo: true
        },
        include: {
          items: {
            include: {
              producto: true
            }
          }
        }
      })
    }

    return NextResponse.json(carrito)
  } catch (error) {
    console.error('Error al obtener carrito:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { representanteId, productoId, cantidad, talla } = body

    if (!representanteId || !productoId || !cantidad) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos' },
        { status: 400 }
      )
    }

    // Verificar que el producto existe y tiene stock
    const producto = await prisma.producto.findUnique({
      where: { id: productoId }
    })

    if (!producto) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      )
    }

    if (producto.stock < cantidad) {
      return NextResponse.json(
        { error: 'Stock insuficiente' },
        { status: 400 }
      )
    }

    // Buscar o crear carrito activo
    let carrito = await prisma.carrito.findFirst({
      where: {
        representanteId,
        activo: true
      }
    })

    if (!carrito) {
      carrito = await prisma.carrito.create({
        data: {
          representanteId,
          activo: true
        }
      })
    }

    // Verificar si el producto ya está en el carrito
    const itemExistente = await prisma.carritoItem.findFirst({
      where: {
        carritoId: carrito.id,
        productoId,
        talla: talla || null
      }
    })

    if (itemExistente) {
      // Verificar stock adicional necesario
      const adicional = cantidad
      if (producto.stock < adicional) {
        return NextResponse.json(
          { error: 'Stock insuficiente para aumentar cantidad' },
          { status: 400 }
        )
      }
      // Descontar stock y actualizar cantidad
      await prisma.producto.update({
        where: { id: productoId },
        data: { stock: producto.stock - adicional }
      })
      const item = await prisma.carritoItem.update({
        where: { id: itemExistente.id },
        data: {
          cantidad: itemExistente.cantidad + cantidad
        },
        include: {
          producto: true
        }
      })

      return NextResponse.json(item)
    } else {
      // Descontar stock y crear item
      await prisma.producto.update({
        where: { id: productoId },
        data: { stock: producto.stock - cantidad }
      })
      const item = await prisma.carritoItem.create({
        data: {
          carritoId: carrito.id,
          productoId,
          cantidad,
          talla: talla || null
        },
        include: {
          producto: true
        }
      })

      return NextResponse.json(item, { status: 201 })
    }
  } catch (error) {
    console.error('Error al agregar al carrito:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { itemId, cantidad } = body

    if (!itemId || cantidad === undefined) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos' },
        { status: 400 }
      )
    }

    // Obtener item actual para ajustar stock
    const current = await prisma.carritoItem.findUnique({ where: { id: itemId }, include: { producto: true } })
    if (!current) {
      return NextResponse.json({ error: 'Item no encontrado' }, { status: 404 })
    }
    const delta = cantidad - current.cantidad
    if (delta > 0) {
      // Aumentar cantidad: verificar stock disponible
      const prod = await prisma.producto.findUnique({ where: { id: current.productoId } })
      if (!prod || prod.stock < delta) {
        return NextResponse.json({ error: 'Stock insuficiente' }, { status: 400 })
      }
      await prisma.producto.update({ where: { id: current.productoId }, data: { stock: prod.stock - delta } })
    } else if (delta < 0) {
      // Disminuir cantidad: devolver stock
      const prod = await prisma.producto.findUnique({ where: { id: current.productoId } })
      if (prod) {
        await prisma.producto.update({ where: { id: current.productoId }, data: { stock: prod.stock + (-delta) } })
      }
    }

    const item = await prisma.carritoItem.update({
      where: { id: itemId },
      data: { cantidad },
      include: {
        producto: true
      }
    })

    return NextResponse.json(item)
  } catch (error) {
    console.error('Error al actualizar carrito:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const itemId = searchParams.get('itemId')

    if (!itemId) {
      return NextResponse.json(
        { error: 'itemId es requerido' },
        { status: 400 }
      )
    }

    const item = await prisma.carritoItem.findUnique({ where: { id: itemId } })
    if (item) {
      // Devolver stock al eliminar
      const prod = await prisma.producto.findUnique({ where: { id: item.productoId } })
      if (prod) {
        await prisma.producto.update({ where: { id: item.productoId }, data: { stock: prod.stock + item.cantidad } })
      }
      await prisma.carritoItem.delete({ where: { id: itemId } })
    }

    return NextResponse.json({ message: 'Item eliminado del carrito' })
  } catch (error) {
    console.error('Error al eliminar del carrito:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
