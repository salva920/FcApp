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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const usuario = await getUserFromToken(request)
    if (!usuario) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar que el usuario es participante del chat
    const participante = await prisma.participanteChat.findFirst({
      where: {
        chatId: params.id,
        usuarioId: usuario.id
      }
    })

    if (!participante) {
      return NextResponse.json(
        { error: 'No tienes acceso a este chat' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const before = searchParams.get('before') // ID del mensaje para paginación

    const where: any = {
      chatId: params.id,
      eliminado: false
    }

    if (before) {
      where.id = { lt: before }
    }

    const mensajes = await prisma.mensaje.findMany({
      where,
      include: {
        remitente: {
          select: {
            id: true,
            nombre: true,
            email: true,
            rol: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    })

    // Marcar mensajes como leídos
    await prisma.participanteChat.update({
      where: { id: participante.id },
      data: {
        leido: true,
        ultimaLectura: new Date()
      }
    })

    await prisma.mensaje.updateMany({
      where: {
        chatId: params.id,
        remitenteId: { not: usuario.id },
        leido: false
      },
      data: {
        leido: true
      }
    })

    return NextResponse.json(mensajes.reverse()) // Invertir para mostrar del más antiguo al más reciente
  } catch (error) {
    console.error('Error al obtener mensajes:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
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

    // Verificar que el usuario es participante del chat
    const participante = await prisma.participanteChat.findFirst({
      where: {
        chatId: params.id,
        usuarioId: usuario.id
      }
    })

    if (!participante) {
      return NextResponse.json(
        { error: 'No tienes acceso a este chat' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { contenido, tipo = 'texto', archivoUrl } = body

    if (!contenido || contenido.trim() === '') {
      return NextResponse.json(
        { error: 'El mensaje no puede estar vacío' },
        { status: 400 }
      )
    }

    // Crear el mensaje
    const mensaje = await prisma.mensaje.create({
      data: {
        contenido: contenido.trim(),
        tipo,
        archivoUrl,
        chatId: params.id,
        remitenteId: usuario.id
      },
      include: {
        remitente: {
          select: {
            id: true,
            nombre: true,
            email: true,
            rol: true
          }
        }
      }
    })

    // Actualizar la fecha de actualización del chat
    await prisma.chat.update({
      where: { id: params.id },
      data: { updatedAt: new Date() }
    })

    // Marcar como no leído para otros participantes
    await prisma.participanteChat.updateMany({
      where: {
        chatId: params.id,
        usuarioId: { not: usuario.id }
      },
      data: {
        leido: false
      }
    })

    return NextResponse.json(mensaje, { status: 201 })
  } catch (error) {
    console.error('Error al crear mensaje:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

