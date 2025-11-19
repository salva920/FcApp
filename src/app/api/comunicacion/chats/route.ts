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

export async function GET(request: NextRequest) {
  try {
    const usuario = await getUserFromToken(request)
    if (!usuario) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const tipo = searchParams.get('tipo') // individual, grupo
    const categoria = searchParams.get('categoria')

    // Obtener chats donde el usuario es participante
    const chats = await prisma.chat.findMany({
      where: {
        activo: true,
        ...(tipo && { tipo }),
        ...(categoria && { categoria }),
        participantes: {
          some: {
            usuarioId: usuario.id
          }
        }
      },
      include: {
        participantes: {
          include: {
            usuario: {
              select: {
                id: true,
                nombre: true,
                email: true,
                rol: true
              }
            }
          }
        },
        mensajes: {
          take: 1,
          orderBy: {
            createdAt: 'desc'
          },
          include: {
            remitente: {
              select: {
                id: true,
                nombre: true
              }
            }
          }
        },
        _count: {
          select: {
            mensajes: {
              where: {
                leido: false,
                remitenteId: { not: usuario.id }
              }
            }
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    return NextResponse.json(chats)
  } catch (error) {
    console.error('Error al obtener chats:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const usuario = await getUserFromToken(request)
    if (!usuario) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { tipo, nombre, categoria, participantes } = body

    // Validar que tipo sea válido
    if (!['individual', 'grupo'].includes(tipo)) {
      return NextResponse.json(
        { error: 'Tipo de chat no válido' },
        { status: 400 }
      )
    }

    // Para chat individual, debe haber exactamente 2 participantes
    if (tipo === 'individual' && (!participantes || participantes.length !== 1)) {
      return NextResponse.json(
        { error: 'Un chat individual debe tener exactamente 2 participantes' },
        { status: 400 }
      )
    }

    // Verificar si ya existe un chat individual entre estos usuarios
    if (tipo === 'individual') {
      // Buscar chats individuales donde ambos usuarios sean participantes
      const chatsExistentes = await prisma.chat.findMany({
        where: {
          tipo: 'individual',
          participantes: {
            some: {
              usuarioId: usuario.id
            }
          }
        },
        include: {
          participantes: true
        }
      })

      // Verificar si hay un chat con exactamente estos dos participantes
      const chatExistente = chatsExistentes.find(chat => {
        const participantesIds = chat.participantes.map(p => p.usuarioId)
        return participantesIds.length === 2 &&
               participantesIds.includes(usuario.id) &&
               participantesIds.includes(participantes[0])
      })

      if (chatExistente) {
        // Retornar el chat con toda su información
        const chatCompleto = await prisma.chat.findUnique({
          where: { id: chatExistente.id },
          include: {
            participantes: {
              include: {
                usuario: {
                  select: {
                    id: true,
                    nombre: true,
                    email: true,
                    rol: true
                  }
                }
              }
            }
          }
        })
        return NextResponse.json(chatCompleto)
      }
    }

    // Crear el chat
    const chat = await prisma.chat.create({
      data: {
        tipo,
        nombre: tipo === 'grupo' ? nombre : null,
        categoria,
        participantes: {
          create: [
            { usuarioId: usuario.id },
            ...(participantes || []).map((id: string) => ({ usuarioId: id }))
          ]
        }
      },
      include: {
        participantes: {
          include: {
            usuario: {
              select: {
                id: true,
                nombre: true,
                email: true,
                rol: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json(chat, { status: 201 })
  } catch (error) {
    console.error('Error al crear chat:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

