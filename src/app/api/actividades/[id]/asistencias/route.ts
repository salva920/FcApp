import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET: Obtener asistencias de una actividad
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const asistencias = await prisma.asistencia.findMany({
      where: {
        actividadId: params.id
      },
      include: {
        nino: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            categoria: true,
            activo: true
          }
        }
      },
      orderBy: {
        fecha: 'desc'
      }
    })

    return NextResponse.json(asistencias)
  } catch (error) {
    console.error('Error al obtener asistencias de actividad:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST: Crear/actualizar asistencias para una actividad
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { asistencias } = body // Array de { ninoId, tipo, observaciones? }

    if (!Array.isArray(asistencias)) {
      return NextResponse.json(
        { error: 'Las asistencias deben ser un array' },
        { status: 400 }
      )
    }

    // Verificar que la actividad existe
    const actividad = await prisma.actividad.findUnique({
      where: { id: params.id }
    })

    if (!actividad) {
      return NextResponse.json(
        { error: 'Actividad no encontrada' },
        { status: 404 }
      )
    }

    // Primero, eliminar asistencias existentes de esta actividad para estos niños
    const ninoIds = asistencias.map(a => a.ninoId)
    await prisma.asistencia.deleteMany({
      where: {
        actividadId: params.id,
        ninoId: { in: ninoIds }
      }
    })

    // Crear las nuevas asistencias
    const asistenciasCreadas = await Promise.all(
      asistencias.map(async (asistencia) => {
        // Solo crear si el tipo es "presente" (no guardar ausentes por defecto)
        if (asistencia.tipo === 'presente') {
          return prisma.asistencia.create({
            data: {
              ninoId: asistencia.ninoId,
              actividadId: params.id,
              tipo: 'presente',
              fecha: actividad.fechaInicio,
              puntual: true,
              observaciones: asistencia.observaciones || null
            },
            include: {
              nino: {
                select: {
                  id: true,
                  nombre: true,
                  apellido: true,
                  categoria: true
                }
              }
            }
          })
        }
        return null
      })
    )

    const asistenciasValidas = asistenciasCreadas.filter(a => a !== null)

    return NextResponse.json({
      message: 'Asistencias guardadas correctamente',
      count: asistenciasValidas.length,
      asistencias: asistenciasValidas
    }, { status: 201 })
  } catch (error) {
    console.error('Error al guardar asistencias:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

