import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/equipos/:id/jugadores
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const jugadores = await prisma.equipoJugador.findMany({
      where: { equipoId: params.id },
      include: {
        nino: { select: { id: true, nombre: true, apellido: true, categoria: true } }
      },
      orderBy: { createdAt: 'asc' }
    })
    return NextResponse.json(jugadores)
  } catch (error) {
    console.error('Error al listar jugadores del equipo:', error)
    return NextResponse.json({ error: 'Error al listar jugadores' }, { status: 500 })
  }
}

// POST /api/equipos/:id/jugadores - agregar jugador
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json()
    const { ninoId, dorsal, posicion } = data

    if (!ninoId) {
      return NextResponse.json({ error: 'ninoId es requerido' }, { status: 400 })
    }

    const jugador = await prisma.equipoJugador.create({
      data: {
        equipoId: params.id,
        ninoId,
        dorsal: dorsal || null,
        posicion: posicion || null
      }
    })

    return NextResponse.json(jugador, { status: 201 })
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'El jugador ya está inscrito en este equipo' }, { status: 400 })
    }
    console.error('Error al agregar jugador:', error)
    return NextResponse.json({ error: 'Error al agregar jugador' }, { status: 500 })
  }
}

// DELETE /api/equipos/:id/jugadores - quitar jugador (por ninoId)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const ninoId = searchParams.get('ninoId')
    if (!ninoId) {
      return NextResponse.json({ error: 'ninoId es requerido' }, { status: 400 })
    }

    await prisma.equipoJugador.deleteMany({
      where: { equipoId: params.id, ninoId }
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error al quitar jugador:', error)
    return NextResponse.json({ error: 'Error al quitar jugador' }, { status: 500 })
  }
}


