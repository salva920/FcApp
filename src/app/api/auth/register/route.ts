import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, nombre, rol, cedula, telefono, direccion, especialidad } = body

    // Validaciones básicas
    if (!email || !password || !nombre || !rol) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      )
    }

    // Validar rol
    if (!['admin', 'profesor', 'representante'].includes(rol)) {
      return NextResponse.json(
        { error: 'Rol no válido' },
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

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 10)

    // Crear el usuario
    const usuario = await prisma.usuario.create({
      data: {
        email,
        password: hashedPassword,
        nombre,
        rol,
        activo: true
      }
    })

    // Si es representante, crear o vincular el representante
    if (rol === 'representante' && cedula) {
      // Verificar si ya existe un representante con esta cédula
      const existingRepresentante = await prisma.representante.findUnique({
        where: { cedula }
      })

      if (existingRepresentante) {
        // Vincular al usuario existente
        await prisma.usuario.update({
          where: { id: usuario.id },
          data: { representanteId: existingRepresentante.id }
        })
      } else {
        // Crear nuevo representante
        const representante = await prisma.representante.create({
          data: {
            nombre,
            cedula,
            email,
            telefono,
            direccion
          }
        })
        
        await prisma.usuario.update({
          where: { id: usuario.id },
          data: { representanteId: representante.id }
        })
      }
    }

    // Si es profesor, crear o vincular el instructor
    if (rol === 'profesor' && cedula) {
      // Verificar si ya existe un instructor con esta cédula
      const existingInstructor = await prisma.instructor.findUnique({
        where: { cedula }
      })

      if (existingInstructor) {
        // Vincular al instructor existente
        await prisma.usuario.update({
          where: { id: usuario.id },
          data: { instructorId: existingInstructor.id }
        })
      } else {
        // Crear nuevo instructor
        const instructor = await prisma.instructor.create({
          data: {
            nombre,
            cedula,
            email,
            telefono,
            especialidad
          }
        })
        
        await prisma.usuario.update({
          where: { id: usuario.id },
          data: { instructorId: instructor.id }
        })
      }
    }

    return NextResponse.json(
      { message: 'Usuario registrado exitosamente', usuarioId: usuario.id },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error al registrar usuario:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

