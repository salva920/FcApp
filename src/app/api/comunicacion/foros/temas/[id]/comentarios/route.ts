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

    const comentarios = await prisma.comentarioForo.findMany({
      where: {
        temaId: params.id,
        eliminado: false
      },
      include: {
        autor: {
          select: {
            id: true,
            nombre: true,
            email: true,
            rol: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    return NextResponse.json(comentarios)
  } catch (error) {
    console.error('Error al obtener comentarios:', error)
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

    // Verificar que el tema existe y no está cerrado
    const tema = await prisma.temaForo.findUnique({
      where: { id: params.id },
      include: {
        foro: true
      }
    })

    if (!tema) {
      return NextResponse.json(
        { error: 'Tema no encontrado' },
        { status: 404 }
      )
    }

    if (tema.cerrado && usuario.rol !== 'admin') {
      return NextResponse.json(
        { error: 'Este tema está cerrado' },
        { status: 403 }
      )
    }

    if (tema.foro.soloLectura && usuario.rol !== 'admin') {
      return NextResponse.json(
        { error: 'Este foro es de solo lectura' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { contenido } = body

    if (!contenido || contenido.trim() === '') {
      return NextResponse.json(
        { error: 'El comentario no puede estar vacío' },
        { status: 400 }
      )
    }

    const comentario = await prisma.comentarioForo.create({
      data: {
        contenido: contenido.trim(),
        temaId: params.id,
        autorId: usuario.id
      },
      include: {
        autor: {
          select: {
            id: true,
            nombre: true,
            email: true,
            rol: true
          }
        }
      }
    })

    // Incrementar visitas del tema
    await prisma.temaForo.update({
      where: { id: params.id },
      data: {
        visitas: { increment: 1 }
      }
    })

    return NextResponse.json(comentario, { status: 201 })
  } catch (error) {
    console.error('Error al crear comentario:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}


