import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/partidos
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const torneoId = searchParams.get('torneoId') || undefined
    const partidos = await prisma.partido.findMany({
      where: { torneoId: torneoId || undefined },
      include: {
        equipoLocal: { select: { id: true, nombre: true } },
        equipoVisita: { select: { id: true, nombre: true } },
        cancha: { select: { id: true, nombre: true } },
        torneo: { select: { id: true, nombre: true } }
      },
      orderBy: { fecha: 'asc' }
    })
    return NextResponse.json(partidos)
  } catch (error) {
    console.error('Error al listar partidos:', error)
    return NextResponse.json({ error: 'Error al listar partidos' }, { status: 500 })
  }
}

// POST /api/partidos
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const required = ['torneoId', 'equipoLocalId', 'equipoVisitaId', 'fecha']
    for (const k of required) {
      if (!data[k]) {
        return NextResponse.json({ error: `Campo requerido: ${k}` }, { status: 400 })
      }
    }

    const partido = await prisma.partido.create({
      data: {
        torneoId: data.torneoId,
        equipoLocalId: data.equipoLocalId,
        equipoVisitaId: data.equipoVisitaId,
        fecha: new Date(data.fecha),
        ronda: data.ronda || null,
        grupo: data.grupo || null,
        estado: data.estado || 'Programado',
        canchaId: data.canchaId || null
      }
    })
    return NextResponse.json(partido, { status: 201 })
  } catch (error) {
    console.error('Error al crear partido:', error)
    return NextResponse.json({ error: 'Error al crear partido' }, { status: 500 })
  }
}


