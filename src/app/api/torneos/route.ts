import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/torneos - lista torneos
export async function GET() {
  try {
    const torneos = await prisma.torneo.findMany({
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(torneos)
  } catch (error) {
    console.error('Error al listar torneos:', error)
    return NextResponse.json({ error: 'Error al listar torneos' }, { status: 500 })
  }
}

// POST /api/torneos - crear torneo
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    const torneo = await prisma.torneo.create({
      data: {
        nombre: data.nombre,
        descripcion: data.descripcion || null,
        tipo: data.tipo || 'Liga',
        ambito: data.ambito || 'Interno',
        categoria: data.categoria || null,
        formato: data.formato || 'round-robin',
        fechaInicio: data.fechaInicio ? new Date(data.fechaInicio) : new Date(),
        fechaFin: data.fechaFin ? new Date(data.fechaFin) : new Date(),
        activo: data.activo !== undefined ? !!data.activo : true
      }
    })

    return NextResponse.json(torneo, { status: 201 })
  } catch (error) {
    console.error('Error al crear torneo:', error)
    return NextResponse.json({ error: 'Error al crear torneo' }, { status: 500 })
  }
}


