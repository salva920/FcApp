import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

/**
 * Endpoint temporal para crear el primer administrador
 * IMPORTANTE: Eliminar o deshabilitar este endpoint después de crear el admin
 * Solo funciona si NO existe ningún usuario admin en la base de datos
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar si ya existe algún admin
    const existingAdmin = await prisma.usuario.findFirst({
      where: { rol: 'admin' }
    })

    if (existingAdmin) {
      return NextResponse.json(
        { 
          error: 'Ya existe un administrador en el sistema. Este endpoint está deshabilitado por seguridad.' 
        },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { email, password, nombre } = body

    // Validaciones
    if (!email || !password || !nombre) {
      return NextResponse.json(
        { error: 'Email, contraseña y nombre son requeridos' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      )
    }

    // Verificar si el email ya existe
    const existingUser = await prisma.usuario.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Ya existe un usuario con este email' },
        { status: 400 }
      )
    }

    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(password, 10)

    // Crear usuario admin
    const admin = await prisma.usuario.create({
      data: {
        email,
        password: hashedPassword,
        nombre,
        rol: 'admin',
        activo: true
      }
    })

    console.log('✅ Usuario administrador creado:', email)

    return NextResponse.json({
      message: 'Usuario administrador creado exitosamente',
      usuario: {
        id: admin.id,
        email: admin.email,
        nombre: admin.nombre,
        rol: admin.rol
      },
      warning: 'IMPORTANTE: Elimina o protege este endpoint después de usar'
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error al crear administrador:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

