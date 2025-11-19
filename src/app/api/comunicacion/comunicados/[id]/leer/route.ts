import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// Función helper para obtener usuario del token
async function getUserFromToken(request: NextRequest) {
  try {
    const token = request.cookies.get('football_auth_token')?.value ||
                  request.headers.get('authorization')?.replace('Bearer ', '')

    if (!token) return null

    const decoded = jwt.verify(token, JWT_SECRET) as any
    const usuario = await prisma.usuario.findUnique({
      where: { id: decoded.userId }
    })
    return usuario
  } catch {
    return null
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const usuario = await getUserFromToken(request)
    if (!usuario) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar que el comunicado existe
    const comunicado = await prisma.comunicado.findUnique({
      where: { id: params.id }
    })

    if (!comunicado) {
      return NextResponse.json(
        { error: 'Comunicado no encontrado' },
        { status: 404 }
      )
    }

    // Crear o actualizar la lectura
    const lectura = await prisma.lecturaComunicado.upsert({
      where: {
        comunicadoId_usuarioId: {
          comunicadoId: params.id,
          usuarioId: usuario.id
        }
      },
      update: {
        leido: true,
        fechaLectura: new Date()
      },
      create: {
        comunicadoId: params.id,
        usuarioId: usuario.id,
        leido: true,
        fechaLectura: new Date()
      }
    })

    return NextResponse.json(lectura)
  } catch (error) {
    console.error('Error al marcar comunicado como leído:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

