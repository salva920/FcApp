import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/equipos - lista de equipos
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const torneoId = searchParams.get('torneoId') || undefined
    const equipos = await prisma.equipo.findMany({
      where: { torneoId: torneoId || undefined },
      include: {
        entrenador: { select: { id: true, nombre: true, email: true } },
        jugadores: {
          include: {
            nino: { select: { id: true, nombre: true, apellido: true, categoria: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(equipos)
  } catch (error) {
    console.error('Error al listar equipos:', error)
    return NextResponse.json({ error: 'Error al listar equipos' }, { status: 500 })
  }
}

// POST /api/equipos - crear equipo
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    if (!data.nombre) {
      return NextResponse.json({ error: 'El nombre del equipo es requerido' }, { status: 400 })
    }

    const equipo = await prisma.equipo.create({
      data: {
        nombre: data.nombre,
        categoria: data.categoria || null,
        descripcion: data.descripcion || null,
        torneoId: data.torneoId || null,
        entrenadorId: data.entrenadorId || null,
        activo: data.activo !== undefined ? !!data.activo : true
      }
    })

    return NextResponse.json(equipo, { status: 201 })
  } catch (error) {
    console.error('Error al crear equipo:', error)
    return NextResponse.json({ error: 'Error al crear equipo' }, { status: 500 })
  }
}


