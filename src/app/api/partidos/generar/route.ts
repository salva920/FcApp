import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/partidos/generar
 * Body: { torneoId: string, formato?: 'round-robin' | 'ida-vuelta', grupo?: string }
 * Genera el fixture (round-robin por defecto) para los equipos del torneo.
 */
export async function POST(request: NextRequest) {
  try {
    const { torneoId, formato = 'round-robin' } = await request.json()
    if (!torneoId) {
      return NextResponse.json({ error: 'torneoId es requerido' }, { status: 400 })
    }

    const torneo = await prisma.torneo.findUnique({ where: { id: torneoId } })
    if (!torneo) {
      return NextResponse.json({ error: 'Torneo no encontrado' }, { status: 404 })
    }

    const equipos = await prisma.equipo.findMany({ where: { torneoId } })
    if (equipos.length < 2) {
      return NextResponse.json({ error: 'Se requieren al menos 2 equipos' }, { status: 400 })
    }

    // Algoritmo simple de round-robin (método del polígono)
    const teamIds = equipos.map(e => e.id)
    const isOdd = teamIds.length % 2 !== 0
    const teams = [...teamIds]
    if (isOdd) teams.push('BYE')

    const n = teams.length
    const rounds = n - 1
    const half = n / 2
    const pares: { local: string, visita: string, ronda: number }[] = []

    const arr = [...teams]
    for (let round = 0; round < rounds; round++) {
      for (let i = 0; i < half; i++) {
        const t1 = arr[i]
        const t2 = arr[n - 1 - i]
        if (t1 !== 'BYE' && t2 !== 'BYE') {
          // Alternar localía por ronda para más equidad
          if (round % 2 === 0) {
            pares.push({ local: String(t1), visita: String(t2), ronda: round + 1 })
          } else {
            pares.push({ local: String(t2), visita: String(t1), ronda: round + 1 })
          }
        }
      }
      // rotación
      const fixed = arr[0]
      const moved = arr.splice(1)
      moved.unshift(moved.pop() as string)
      arr.splice(1, 0, ...moved)
      arr[0] = fixed
    }

    // Si ida-vuelta, duplicar invirtiendo localía y sumando rondas
    if (formato === 'ida-vuelta') {
      const vuelta = pares.map(p => ({ local: p.visita, visita: p.local, ronda: p.ronda + rounds }))
      pares.push(...vuelta)
    }

    // Crear partidos espaciando fechas por rondas desde fechaInicio
    const baseDate = new Date(torneo.fechaInicio)
    const created = await prisma.$transaction(
      pares.map(p =>
        prisma.partido.create({
          data: {
            torneoId,
            equipoLocalId: p.local,
            equipoVisitaId: p.visita,
            fecha: new Date(baseDate.getTime() + (p.ronda - 1) * 24 * 60 * 60 * 1000),
            ronda: `Jornada ${p.ronda}`,
            estado: 'Programado'
          }
        })
      )
    )

    return NextResponse.json({ generados: created.length, partidos: created })
  } catch (error) {
    console.error('Error al generar fixture:', error)
    return NextResponse.json({ error: 'Error al generar fixture' }, { status: 500 })
  }
}


