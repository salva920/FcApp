import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/torneos/:id/tabla - tabla de posiciones
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const torneoId = params.id
    const equipos = await prisma.equipo.findMany({ where: { torneoId } })
    const partidos = await prisma.partido.findMany({ where: { torneoId } })

    const tabla = new Map<string, any>()
    for (const e of equipos) {
      tabla.set(e.id, {
        equipoId: e.id,
        nombre: e.nombre,
        jugados: 0, ganados: 0, empatados: 0, perdidos: 0,
        gf: 0, gc: 0, dif: 0, puntos: 0
      })
    }

    for (const p of partidos) {
      if (p.estado !== 'Finalizado') continue
      if (p.marcadorLocal == null || p.marcadorVisita == null) continue
      const local = tabla.get(p.equipoLocalId)
      const visita = tabla.get(p.equipoVisitaId)
      if (!local || !visita) continue

      local.jugados += 1
      visita.jugados += 1
      local.gf += p.marcadorLocal
      local.gc += p.marcadorVisita
      visita.gf += p.marcadorVisita
      visita.gc += p.marcadorLocal

      if (p.marcadorLocal > p.marcadorVisita) {
        local.ganados += 1; local.puntos += 3
        visita.perdidos += 1
      } else if (p.marcadorLocal < p.marcadorVisita) {
        visita.ganados += 1; visita.puntos += 3
        local.perdidos += 1
      } else {
        local.empatados += 1; visita.empatados += 1
        local.puntos += 1; visita.puntos += 1
      }
    }

    const rows = Array.from(tabla.values()).map(r => ({ ...r, dif: r.gf - r.gc }))
    rows.sort((a, b) => b.puntos - a.puntos || b.dif - a.dif || b.gf - a.gf)

    return NextResponse.json(rows)
  } catch (error) {
    console.error('Error al calcular tabla:', error)
    return NextResponse.json({ error: 'Error al calcular tabla' }, { status: 500 })
  }
}


