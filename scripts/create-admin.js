require('dotenv').config({ path: '.env.local' })
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function createAdmin() {
  try {
    console.log('🔐 Creando usuario administrador...\n')

    // Datos del administrador - CAMBIAR ESTOS VALORES ANTES DE EJECUTAR
    const adminData = {
      email: process.argv[2] || 'admin@footballpro.com',
      password: process.argv[3] || 'admin123',
      nombre: process.argv[4] || 'Administrador',
      rol: 'admin'
    }

    console.log('📝 Datos a crear:')
    console.log('   Email:', adminData.email)
    console.log('   Nombre:', adminData.nombre)
    console.log('   Rol:', adminData.rol, '\n')

    // Verificar si ya existe
    const existing = await prisma.usuario.findUnique({
      where: { email: adminData.email }
    })

    if (existing) {
      console.log('⚠️  Ya existe un usuario con este email:', adminData.email)
      console.log('   Si deseas cambiarlo, elimínalo primero desde MongoDB\n')
      process.exit(1)
    }

    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(adminData.password, 10)

    // Crear usuario admin
    const admin = await prisma.usuario.create({
      data: {
        email: adminData.email,
        password: hashedPassword,
        nombre: adminData.nombre,
        rol: adminData.rol,
        activo: true
      }
    })

    console.log('✅ Usuario administrador creado exitosamente!\n')
    console.log('📋 Credenciales de acceso:')
    console.log('   ✉️  Email:', adminData.email)
    console.log('   🔑 Contraseña:', adminData.password)
    console.log('   🆔 ID:', admin.id)
    console.log('\n⚠️  IMPORTANTE: Cambia la contraseña después del primer acceso')
    console.log('   O elimina este script después de usar por seguridad\n')
  } catch (error) {
    console.error('❌ Error al crear administrador:', error.message)
    if (error.code === 'P2002') {
      console.error('   El email ya está en uso')
    }
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

createAdmin()

