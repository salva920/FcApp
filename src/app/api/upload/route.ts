import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData()
    const file: File | null = data.get('file') as unknown as File

    if (!file) {
      return NextResponse.json({ error: 'No se encontró archivo' }, { status: 400 })
    }

    // Validar tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `Tipo de archivo no permitido: ${file.type}. Solo se permiten JPG, PNG y PDF` },
        { status: 400 }
      )
    }

    // Validar tamaño (máximo 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'El archivo es demasiado grande. Máximo 5MB' },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // En Vercel/producción, el sistema de archivos es de solo lectura
    // Convertir a base64 y retornar como data URL
    const isProduction = process.env.VERCEL || process.env.NODE_ENV === 'production'
    
    if (isProduction) {
      // En producción, retornar como base64
      const base64 = buffer.toString('base64')
      const dataUrl = `data:${file.type};base64,${base64}`
      
      return NextResponse.json({ 
        success: true, 
        fileName: file.name,
        fileUrl: dataUrl,
        size: file.size,
        type: file.type,
        isBase64: true
      })
    }

    // En desarrollo, intentar guardar en el sistema de archivos
    try {
      // Crear directorio de uploads si no existe
      const uploadsDir = join(process.cwd(), 'public', 'uploads')
      if (!existsSync(uploadsDir)) {
        await mkdir(uploadsDir, { recursive: true })
      }

      // Generar nombre único para el archivo
      const timestamp = Date.now()
      const extension = file.name.split('.').pop() || 'jpg'
      const fileName = `${timestamp}-${Math.random().toString(36).substring(2)}.${extension}`
      const filePath = join(uploadsDir, fileName)

      // Guardar archivo
      await writeFile(filePath, buffer)

      // Retornar URL del archivo
      const fileUrl = `/uploads/${fileName}`

      return NextResponse.json({ 
        success: true, 
        fileName,
        fileUrl,
        size: file.size,
        type: file.type,
        isBase64: false
      })
    } catch (fsError: any) {
      // Si falla el sistema de archivos, usar base64 como fallback
      console.warn('Error al guardar en sistema de archivos, usando base64:', fsError.message)
      const base64 = buffer.toString('base64')
      const dataUrl = `data:${file.type};base64,${base64}`
      
      return NextResponse.json({ 
        success: true, 
        fileName: file.name,
        fileUrl: dataUrl,
        size: file.size,
        type: file.type,
        isBase64: true
      })
    }
  } catch (error: any) {
    console.error('Error al subir archivo:', error)
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error.message || 'Error desconocido'
      },
      { status: 500 }
    )
  }
}
