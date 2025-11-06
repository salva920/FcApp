'use client'

import React, { useState } from 'react'
import {
  Box,
  Button,
  Input,
  Text,
  VStack,
  HStack,
  useToast,
  Progress,
  Image,
  Badge,
  useColorModeValue
} from '@chakra-ui/react'
import { FiUpload, FiFile, FiImage, FiX } from 'react-icons/fi'

interface FileUploadProps {
  onFileUploaded: (fileUrl: string, fileName: string) => void
  accept?: string
  maxSize?: number
  label?: string
  placeholder?: string
  currentFile?: string
  onRemove?: () => void
}

export default function FileUpload({
  onFileUploaded,
  accept = 'image/*,application/pdf',
  maxSize = 5 * 1024 * 1024, // 5MB
  label = 'Subir archivo',
  placeholder = 'Seleccionar archivo...',
  currentFile,
  onRemove
}: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [dragActive, setDragActive] = useState(false)
  const toast = useToast()
  const cardBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')

  const handleFileSelect = async (file: File) => {
    // Validar tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Error',
        description: 'Tipo de archivo no permitido. Solo se permiten JPG, PNG y PDF',
        status: 'error',
        duration: 3000
      })
      return
    }

    // Validar tamaño
    if (file.size > maxSize) {
      toast({
        title: 'Error',
        description: `El archivo es demasiado grande. Máximo ${Math.round(maxSize / (1024 * 1024))}MB`,
        status: 'error',
        duration: 3000
      })
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append('file', file)

      // Simular progreso de carga
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + 10
        })
      }, 100)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al subir archivo')
      }

      const result = await response.json()
      
      toast({
        title: 'Archivo subido',
        description: 'El archivo se ha subido correctamente',
        status: 'success',
        duration: 3000
      })

      onFileUploaded(result.fileUrl, result.fileName)
    } catch (error) {
      console.error('Error al subir archivo:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al subir archivo',
        status: 'error',
        duration: 3000
      })
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0])
    }
  }

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase()
    if (['jpg', 'jpeg', 'png', 'gif'].includes(extension || '')) {
      return FiImage
    }
    return FiFile
  }

  const getFileTypeColor = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase()
    if (['jpg', 'jpeg', 'png', 'gif'].includes(extension || '')) {
      return 'green'
    }
    if (extension === 'pdf') {
      return 'red'
    }
    return 'gray'
  }

  return (
    <VStack spacing={4} align="stretch">
      {currentFile ? (
        <Box p={4} bg={cardBg} borderRadius="md" borderColor={borderColor} borderWidth="1px">
          <HStack justify="space-between">
            <HStack spacing={3}>
              {React.createElement(getFileIcon(currentFile), { size: 24 })}
              <VStack align="start" spacing={1}>
                <Text fontWeight="bold" fontSize="sm">
                  {currentFile.split('/').pop()}
                </Text>
                <Badge colorScheme={getFileTypeColor(currentFile)} size="sm">
                  {currentFile.split('.').pop()?.toUpperCase()}
                </Badge>
              </VStack>
            </HStack>
            {onRemove && (
              <Button
                size="sm"
                leftIcon={<FiX />}
                colorScheme="red"
                variant="ghost"
                onClick={onRemove}
              >
                Eliminar
              </Button>
            )}
          </HStack>
        </Box>
      ) : (
        <Box
          p={8}
          border="2px dashed"
          borderColor={dragActive ? 'blue.400' : borderColor}
          borderRadius="md"
          bg={dragActive ? 'blue.50' : cardBg}
          textAlign="center"
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          cursor="pointer"
          _hover={{ borderColor: 'blue.400' }}
        >
          <VStack spacing={4}>
            <FiUpload size={48} color="gray" />
            <VStack spacing={2}>
              <Text fontWeight="bold">{label}</Text>
              <Text fontSize="sm" color="gray.500">
                {placeholder}
              </Text>
              <Text fontSize="xs" color="gray.400">
                Máximo {Math.round(maxSize / (1024 * 1024))}MB
              </Text>
            </VStack>
            
            {isUploading ? (
              <VStack spacing={2} width="full">
                <Text fontSize="sm">Subiendo archivo...</Text>
                <Progress value={uploadProgress} width="full" colorScheme="blue" />
              </VStack>
            ) : (
              <Button
                as="label"
                htmlFor="file-upload"
                leftIcon={<FiUpload />}
                colorScheme="blue"
                variant="outline"
                cursor="pointer"
              >
                Seleccionar archivo
              </Button>
            )}
            
            <Input
              id="file-upload"
              type="file"
              accept={accept}
              onChange={handleFileInput}
              display="none"
            />
          </VStack>
        </Box>
      )}
    </VStack>
  )
}
