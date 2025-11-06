import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Obtener todos los descriptores faciales para comparación
export async function GET() {
  try {
    const ninos = await prisma.nino.findMany({
      where: {
        faceDescriptor: { not: null },
        faceImageUrl: { not: null }
      },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        cedula: true,
        faceDescriptor: true,
        faceImageUrl: true
      }
    })

    // Convertir descriptores de Base64 a Float32Array
    const facesWithDescriptors = ninos.map(nino => {
      try {
        return {
          id: nino.id,
          name: `${nino.nombre} ${nino.apellido}`,
          cedula: nino.cedula,
          descriptor: nino.faceDescriptor ? new Float32Array(
            JSON.parse(Buffer.from(nino.faceDescriptor, 'base64').toString())
          ) : null,
          imageUrl: nino.faceImageUrl
        }
      } catch (error) {
        console.error('Error procesando descriptor para niño:', nino.id, error)
        return null
      }
    }).filter(face => face !== null && face.descriptor !== null)

    return NextResponse.json(facesWithDescriptors)
  } catch (error) {
    console.error('Error al obtener descriptores faciales:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// Guardar descriptor facial para un niño
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { ninoId, faceDescriptor, faceImageUrl } = body

    if (!ninoId || !faceDescriptor || !faceImageUrl) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos' },
        { status: 400 }
      )
    }

    // Convertir Float32Array a Base64 para almacenamiento
    const descriptorBase64 = Buffer.from(JSON.stringify(Array.from(faceDescriptor))).toString('base64')

    const updatedNino = await prisma.nino.update({
      where: { id: ninoId },
      data: {
        faceDescriptor: descriptorBase64,
        faceImageUrl: faceImageUrl
      }
    })

    return NextResponse.json({
      success: true,
      nino: updatedNino
    })
  } catch (error) {
    console.error('Error al guardar descriptor facial:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// Comparar descriptor facial con registros existentes
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { faceDescriptor, threshold = 0.6 } = body

    if (!faceDescriptor) {
      return NextResponse.json(
        { error: 'Descriptor facial requerido' },
        { status: 400 }
      )
    }

    // Obtener todos los descriptores existentes
    const ninos = await prisma.nino.findMany({
      where: {
        faceDescriptor: { not: null }
      },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        cedula: true,
        faceDescriptor: true,
        faceImageUrl: true
      }
    })

    const results = []
    const newDescriptor = new Float32Array(faceDescriptor)

    for (const nino of ninos) {
      if (!nino.faceDescriptor) continue

      try {
        const existingDescriptor = new Float32Array(
          JSON.parse(Buffer.from(nino.faceDescriptor, 'base64').toString())
        )

        // Calcular similitud
        const similarity = calculateSimilarity(newDescriptor, existingDescriptor)
        
        results.push({
          ninoId: nino.id,
          name: `${nino.nombre} ${nino.apellido}`,
          cedula: nino.cedula,
          similarity,
          isMatch: similarity >= threshold,
          imageUrl: nino.faceImageUrl
        })
      } catch (err) {
        console.error('Error procesando descriptor:', err)
      }
    }

    // Ordenar por similitud descendente
    results.sort((a, b) => b.similarity - a.similarity)

    return NextResponse.json({
      results,
      bestMatch: results[0] || null,
      hasMatch: results.some(r => r.isMatch)
    })

  } catch (error) {
    console.error('Error en comparación facial:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// Función para calcular similitud entre descriptores
function calculateSimilarity(desc1: Float32Array, desc2: Float32Array): number {
  if (desc1.length !== desc2.length) return 0

  let sum = 0
  for (let i = 0; i < desc1.length; i++) {
    const diff = desc1[i] - desc2[i]
    sum += diff * diff
  }
  
  const distance = Math.sqrt(sum)
  // Convertir distancia a similitud (0-1, donde 1 es idéntico)
  const similarity = Math.max(0, 1 - (distance / 1.4))
  return similarity
}
