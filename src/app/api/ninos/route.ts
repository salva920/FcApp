import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const includeFaceDescriptor = searchParams.get('includeFaceDescriptor') === 'true'
    const representanteId = searchParams.get('representanteId')
    const categoria = searchParams.get('categoria')
    
    // Obtener usuario del token si existe
    let userCategoria: string | null = null
    let userRol: string | null = null
    try {
      const token = request.headers.get('authorization')?.replace('Bearer ', '') ||
                    request.cookies.get('football_auth_token')?.value
      if (token) {
        const jwt = require('jsonwebtoken')
        const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'
        const decoded = jwt.verify(token, JWT_SECRET) as any
        userRol = decoded.rol
        if ((decoded.rol === 'profesor' || decoded.rol === 'representante-delegado') && decoded.categoria) {
          userCategoria = decoded.categoria
        }
      }
    } catch {
      // Si no hay token o es inválido, continuar sin filtrar
    }
    
    const where: any = {}
    
    // Si es representante-delegado, NO filtrar por representanteId (ver todos los niños de su categoría)
    // Si es representante normal, sí filtrar por representanteId
    if (representanteId && userRol !== 'representante-delegado') {
      where.representanteId = representanteId
    }
    
    // Si es profesor o representante-delegado, filtrar por su categoría asignada
    if (userCategoria) {
      where.categoria = userCategoria
    } else if (categoria) {
      where.categoria = categoria
    }
    where.activo = true // Solo niños activos
    
    const ninos = await prisma.nino.findMany({
      where,
      select: {
        id: true,
        nombre: true,
        apellido: true,
        fechaNacimiento: true,
        cedula: true,
        alergias: true,
        emergencia: true,
        categoria: true,
        nivel: true,
        activo: true,
        createdAt: true,
        updatedAt: true,
        cedulaFile: true,
        partidaFile: true,
        fotoFile: true,
        faceImageUrl: true,
        faceDescriptor: includeFaceDescriptor, // Solo incluir si se solicita
        representante: {
          select: {
            id: true,
            nombre: true,
            cedula: true,
            email: true,
            telefono: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(ninos)
  } catch (error) {
    console.error('Error al obtener niños:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      nombre,
      apellido,
      fechaNacimiento,
      cedula,
      alergias,
      emergencia,
      categoria,
      nivel,
      representanteId,
      cedulaFile,
      partidaFile,
      fotoFile,
      faceDescriptor,
      faceImageUrl
    } = body

    // Verificar si ya existe un niño con esta cédula (solo si se envía)
    if (cedula && cedula.trim() !== '') {
      const existingNino = await prisma.nino.findFirst({
        where: { cedula: cedula.trim() }
      })
      if (existingNino) {
        return NextResponse.json(
          { error: 'Ya existe un niño con esta cédula' },
          { status: 400 }
        )
      }
    }

    // Si no se proporciona representanteId, crear uno automáticamente
    let representanteIdFinal = representanteId
    
    if (!representanteId) {
      // Crear representante automático
      const representanteAuto = await prisma.representante.create({
        data: {
          nombre: 'Representante Automático',
          cedula: `auto-${Date.now()}`,
          email: `auto-${Date.now()}@example.com`,
          telefono: '0000000000',
          direccion: 'Dirección automática'
        }
      })
      representanteIdFinal = representanteAuto.id
    } else {
      // Verificar que el representante existe
      const representante = await prisma.representante.findUnique({
        where: { id: representanteId }
      })

      if (!representante) {
        return NextResponse.json(
          { error: 'Representante no encontrado' },
          { status: 400 }
        )
      }
    }

    const nino = await prisma.nino.create({
      data: {
        nombre,
        apellido,
        fechaNacimiento: new Date(fechaNacimiento),
        cedula: cedula && cedula.trim() !== '' ? cedula.trim() : null,
        alergias,
        emergencia,
        categoria,
        nivel,
        representanteId: representanteIdFinal,
        cedulaFile,
        partidaFile,
        fotoFile,
        faceDescriptor,
        faceImageUrl
      },
      include: {
        representante: true
      }
    })

    return NextResponse.json(nino, { status: 201 })
  } catch (error) {
    console.error('Error al crear niño:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

