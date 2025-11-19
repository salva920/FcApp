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

    // Verificar que la alerta existe
    const alerta = await prisma.alertaEmergencia.findUnique({
      where: { id: params.id }
    })

    if (!alerta) {
      return NextResponse.json(
        { error: 'Alerta no encontrada' },
        { status: 404 }
      )
    }

    // Crear o actualizar la confirmación
    const confirmacion = await prisma.confirmacionAlerta.upsert({
      where: {
        alertaId_usuarioId: {
          alertaId: params.id,
          usuarioId: usuario.id
        }
      },
      update: {
        confirmado: true,
        fechaConfirmacion: new Date()
      },
      create: {
        alertaId: params.id,
        usuarioId: usuario.id,
        confirmado: true,
        fechaConfirmacion: new Date()
      }
    })

    return NextResponse.json(confirmacion)
  } catch (error) {
    console.error('Error al confirmar alerta:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}


