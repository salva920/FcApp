'use client'

import React, { useState, useMemo } from 'react'
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  VStack,
  HStack,
  Stack,
  Box,
  Text,
  Button,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  FormControl,
  FormLabel,
  Input,
  Select,
  Textarea,
  Grid,
  GridItem,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Badge,
  Card,
  CardBody,
  Divider,
  Heading,
  useToast,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Progress,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Checkbox,
  CheckboxGroup,
  Alert,
  AlertIcon,
  useColorModeValue
} from '@chakra-ui/react'
import { FiSave, FiTrendingUp, FiTarget, FiActivity, FiAward, FiDownload, FiBarChart2, FiRefreshCw } from 'react-icons/fi'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  RadialLinearScale,
  ArcElement,
  Filler
} from 'chart.js'
import { Line, Radar } from 'react-chartjs-2'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  RadialLinearScale,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

interface DesarrolloAtletaModalProps {
  isOpen: boolean
  onClose: () => void
  nino: {
    id: string
    nombre: string
    apellido: string
    categoria: string
    nivel: string
  }
  readOnly?: boolean // Para representantes (solo lectura)
}

interface EvaluacionData {
  // Perfil
  posicionPrincipal: string
  posicionesSecundarias: string[]
  pieDominante: string
  
  // Medidas físicas
  estatura: number | string
  peso: number | string
  talla: string
  tallaCalzado?: string
  
  // Técnicas
  tecControl: number
  tecPase: number
  tecTiro: number
  tecRegate: number
  tecCabeceo: number
  
  // Tácticas
  tacPosicionamiento: number
  tacLectura: number
  tacMarcaje: number
  tacCobertura: number
  tacVision: number
  
  // Físicas
  fisVelocidad: number
  fisResistencia: number
  fisFuerza: number
  fisAgilidad: number
  fisFlexibilidad: number
  
  // Psicológicas
  psiConcentracion: number
  psiLiderazgo: number
  psiDisciplina: number
  psiMotivacion: number
  psiTrabEquipo: number
  
  // Observaciones
  observaciones: string
  fortalezas: string
  areasMejora: string
  
  // Plan
  objetivos: string
  ejerciciosRecomendados: string
  frecuenciaEntrenamiento: string
  
  // Metas
  metasCortoPlazo: string
  metasMedianoPlazo: string
  metasLargoPlazo: string
}

const initialFormData: EvaluacionData = {
  posicionPrincipal: '',
  posicionesSecundarias: [],
  pieDominante: '',
  estatura: '',
  peso: '',
  talla: '',
  tallaCalzado: '',
  tecControl: 5,
  tecPase: 5,
  tecTiro: 5,
  tecRegate: 5,
  tecCabeceo: 5,
  tacPosicionamiento: 5,
  tacLectura: 5,
  tacMarcaje: 5,
  tacCobertura: 5,
  tacVision: 5,
  fisVelocidad: 5,
  fisResistencia: 5,
  fisFuerza: 5,
  fisAgilidad: 5,
  fisFlexibilidad: 5,
  psiConcentracion: 5,
  psiLiderazgo: 5,
  psiDisciplina: 5,
  psiMotivacion: 5,
  psiTrabEquipo: 5,
  observaciones: '',
  fortalezas: '',
  areasMejora: '',
  objetivos: '',
  ejerciciosRecomendados: '',
  frecuenciaEntrenamiento: '',
  metasCortoPlazo: '',
  metasMedianoPlazo: '',
  metasLargoPlazo: ''
}

export function DesarrolloAtletaModal({ isOpen, onClose, nino, readOnly = false }: DesarrolloAtletaModalProps) {
  const [formData, setFormData] = useState<EvaluacionData>(initialFormData)
  const [compareEva1, setCompareEva1] = useState('')
  const [compareEva2, setCompareEva2] = useState('')
  const toast = useToast()
  const queryClient = useQueryClient()

  // Obtener evaluaciones del niño
  const { data: evaluaciones } = useQuery({
    queryKey: ['evaluaciones', nino.id],
    queryFn: async () => {
      const res = await fetch(`/api/evaluaciones?ninoId=${nino.id}`)
      if (!res.ok) throw new Error('Error al cargar evaluaciones')
      return res.json()
    },
    enabled: isOpen
  })

  // Mutación para crear evaluación
  const createMutation = useMutation({
    mutationFn: async (data: EvaluacionData) => {
      const res = await fetch('/api/evaluaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          ninoId: nino.id,
          evaluadoPor: 'Instructor' // TODO: obtener del usuario logueado
        })
      })
      if (!res.ok) throw new Error('Error al guardar evaluación')
      return res.json()
    },
    onSuccess: () => {
      toast({
        title: 'Evaluación guardada',
        description: 'La evaluación se ha guardado exitosamente',
        status: 'success',
        duration: 3000
      })
      queryClient.invalidateQueries({ queryKey: ['evaluaciones', nino.id] })
      setFormData(initialFormData)
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Error al guardar la evaluación',
        status: 'error',
        duration: 3000
      })
    }
  })

  const handleSubmit = () => {
    createMutation.mutate(formData)
  }

  const getColorByValue = (value: number) => {
    if (value >= 8) return 'green'
    if (value >= 6) return 'yellow'
    if (value >= 4) return 'orange'
    return 'red'
  }

  const calcularPromedio = (valores: number[]) => {
    const sum = valores.reduce((a, b) => a + b, 0)
    return (sum / valores.length).toFixed(1)
  }

  // Datos para gráficos
  const chartData = useMemo(() => {
    if (!evaluaciones || evaluaciones.length === 0) return null

    const sortedEvaluaciones = [...evaluaciones].sort((a, b) => 
      new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
    )

    const labels = sortedEvaluaciones.map(eva => 
      format(new Date(eva.fecha), 'dd/MM/yy', { locale: es })
    )

    const promediosTecnicos = sortedEvaluaciones.map(eva => 
      parseFloat(calcularPromedio([eva.tecControl, eva.tecPase, eva.tecTiro, eva.tecRegate, eva.tecCabeceo].filter(Boolean)))
    )

    const promediosTacticos = sortedEvaluaciones.map(eva => 
      parseFloat(calcularPromedio([eva.tacPosicionamiento, eva.tacLectura, eva.tacMarcaje, eva.tacCobertura, eva.tacVision].filter(Boolean)))
    )

    const promediosFisicos = sortedEvaluaciones.map(eva => 
      parseFloat(calcularPromedio([eva.fisVelocidad, eva.fisResistencia, eva.fisFuerza, eva.fisAgilidad, eva.fisFlexibilidad].filter(Boolean)))
    )

    const promediosPsicologicos = sortedEvaluaciones.map(eva => 
      parseFloat(calcularPromedio([eva.psiConcentracion, eva.psiLiderazgo, eva.psiDisciplina, eva.psiMotivacion, eva.psiTrabEquipo].filter(Boolean)))
    )

    return {
      labels,
      datasets: [
        {
          label: 'Técnico',
          data: promediosTecnicos,
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4
        },
        {
          label: 'Táctico',
          data: promediosTacticos,
          borderColor: 'rgb(168, 85, 247)',
          backgroundColor: 'rgba(168, 85, 247, 0.1)',
          tension: 0.4
        },
        {
          label: 'Físico',
          data: promediosFisicos,
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          tension: 0.4
        },
        {
          label: 'Psicológico',
          data: promediosPsicologicos,
          borderColor: 'rgb(251, 146, 60)',
          backgroundColor: 'rgba(251, 146, 60, 0.1)',
          tension: 0.4
        }
      ]
    }
  }, [evaluaciones])

  // Datos para gráfico de radar
  const radarData = useMemo(() => {
    if (!evaluaciones || evaluaciones.length === 0) return null

    const ultimaEva = evaluaciones[0]

    return {
      labels: ['Técnico', 'Táctico', 'Físico', 'Psicológico'],
      datasets: [
        {
          label: 'Última Evaluación',
          data: [
            parseFloat(calcularPromedio([ultimaEva.tecControl, ultimaEva.tecPase, ultimaEva.tecTiro, ultimaEva.tecRegate, ultimaEva.tecCabeceo].filter(Boolean))),
            parseFloat(calcularPromedio([ultimaEva.tacPosicionamiento, ultimaEva.tacLectura, ultimaEva.tacMarcaje, ultimaEva.tacCobertura, ultimaEva.tacVision].filter(Boolean))),
            parseFloat(calcularPromedio([ultimaEva.fisVelocidad, ultimaEva.fisResistencia, ultimaEva.fisFuerza, ultimaEva.fisAgilidad, ultimaEva.fisFlexibilidad].filter(Boolean))),
            parseFloat(calcularPromedio([ultimaEva.psiConcentracion, ultimaEva.psiLiderazgo, ultimaEva.psiDisciplina, ultimaEva.psiMotivacion, ultimaEva.psiTrabEquipo].filter(Boolean)))
          ],
          backgroundColor: 'rgba(59, 130, 246, 0.3)',
          borderColor: 'rgb(37, 99, 235)',
          borderWidth: 3,
          pointBackgroundColor: 'rgb(37, 99, 235)',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: 'rgb(37, 99, 235)',
          pointRadius: 6,
          pointHoverRadius: 8
        }
      ]
    }
  }, [evaluaciones])

  // Datos para comparación
  const compareData = useMemo(() => {
    if (!compareEva1 || !compareEva2 || !evaluaciones) return null

    const eva1 = evaluaciones.find((e: any) => e.id === compareEva1)
    const eva2 = evaluaciones.find((e: any) => e.id === compareEva2)

    if (!eva1 || !eva2) return null

    return {
      labels: ['Técnico', 'Táctico', 'Físico', 'Psicológico'],
      datasets: [
        {
          label: format(new Date(eva1.fecha), 'dd/MM/yy', { locale: es }),
          data: [
            parseFloat(calcularPromedio([eva1.tecControl, eva1.tecPase, eva1.tecTiro, eva1.tecRegate, eva1.tecCabeceo].filter(Boolean))),
            parseFloat(calcularPromedio([eva1.tacPosicionamiento, eva1.tacLectura, eva1.tacMarcaje, eva1.tacCobertura, eva1.tacVision].filter(Boolean))),
            parseFloat(calcularPromedio([eva1.fisVelocidad, eva1.fisResistencia, eva1.fisFuerza, eva1.fisAgilidad, eva1.fisFlexibilidad].filter(Boolean))),
            parseFloat(calcularPromedio([eva1.psiConcentracion, eva1.psiLiderazgo, eva1.psiDisciplina, eva1.psiMotivacion, eva1.psiTrabEquipo].filter(Boolean)))
          ],
          backgroundColor: 'rgba(59, 130, 246, 0.25)',
          borderColor: 'rgb(37, 99, 235)',
          borderWidth: 3,
          pointBackgroundColor: 'rgb(37, 99, 235)',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: 'rgb(37, 99, 235)',
          pointRadius: 6,
          pointHoverRadius: 8
        },
        {
          label: format(new Date(eva2.fecha), 'dd/MM/yy', { locale: es }),
          data: [
            parseFloat(calcularPromedio([eva2.tecControl, eva2.tecPase, eva2.tecTiro, eva2.tecRegate, eva2.tecCabeceo].filter(Boolean))),
            parseFloat(calcularPromedio([eva2.tacPosicionamiento, eva2.tacLectura, eva2.tacMarcaje, eva2.tacCobertura, eva2.tacVision].filter(Boolean))),
            parseFloat(calcularPromedio([eva2.fisVelocidad, eva2.fisResistencia, eva2.fisFuerza, eva2.fisAgilidad, eva2.fisFlexibilidad].filter(Boolean))),
            parseFloat(calcularPromedio([eva2.psiConcentracion, eva2.psiLiderazgo, eva2.psiDisciplina, eva2.psiMotivacion, eva2.psiTrabEquipo].filter(Boolean)))
          ],
          backgroundColor: 'rgba(251, 146, 60, 0.25)',
          borderColor: 'rgb(234, 88, 12)',
          borderWidth: 3,
          pointBackgroundColor: 'rgb(234, 88, 12)',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: 'rgb(234, 88, 12)',
          pointRadius: 6,
          pointHoverRadius: 8
        }
      ]
    }
  }, [compareEva1, compareEva2, evaluaciones])

  // Exportar a PDF
  const exportToPDF = () => {
    if (!evaluaciones || evaluaciones.length === 0) {
      toast({
        title: 'No hay datos',
        description: 'No hay evaluaciones para exportar',
        status: 'warning',
        duration: 3000
      })
      return
    }

    const doc = new jsPDF()
    
    // Título
    doc.setFontSize(20)
    doc.text(`Desarrollo del Atleta`, 14, 20)
    
    doc.setFontSize(16)
    doc.text(`${nino.nombre} ${nino.apellido}`, 14, 30)
    
    doc.setFontSize(12)
    doc.text(`Categoría: ${nino.categoria} | Nivel: ${nino.nivel}`, 14, 38)
    doc.text(`Fecha de generación: ${format(new Date(), "dd 'de' MMMM, yyyy", { locale: es })}`, 14, 45)
    
    // Última evaluación
    const ultimaEva = evaluaciones[0]
    
    doc.setFontSize(14)
    doc.text('Última Evaluación', 14, 58)
    
    doc.setFontSize(11)
    doc.text(`Fecha: ${format(new Date(ultimaEva.fecha), "dd 'de' MMMM, yyyy", { locale: es })}`, 14, 66)
    doc.text(`Evaluado por: ${ultimaEva.evaluadoPor || 'N/A'}`, 14, 72)
    
    // Tabla de promedios
    const promedios = [
      ['Técnico', calcularPromedio([ultimaEva.tecControl, ultimaEva.tecPase, ultimaEva.tecTiro, ultimaEva.tecRegate, ultimaEva.tecCabeceo].filter(Boolean))],
      ['Táctico', calcularPromedio([ultimaEva.tacPosicionamiento, ultimaEva.tacLectura, ultimaEva.tacMarcaje, ultimaEva.tacCobertura, ultimaEva.tacVision].filter(Boolean))],
      ['Físico', calcularPromedio([ultimaEva.fisVelocidad, ultimaEva.fisResistencia, ultimaEva.fisFuerza, ultimaEva.fisAgilidad, ultimaEva.fisFlexibilidad].filter(Boolean))],
      ['Psicológico', calcularPromedio([ultimaEva.psiConcentracion, ultimaEva.psiLiderazgo, ultimaEva.psiDisciplina, ultimaEva.psiMotivacion, ultimaEva.psiTrabEquipo].filter(Boolean))]
    ]
    
    autoTable(doc, {
      head: [['Competencia', 'Promedio']],
      body: promedios,
      startY: 80,
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] }
    })
    
    let yPos = (doc as any).lastAutoTable.finalY + 10
    
    // Evaluaciones Técnicas
    doc.setFontSize(12)
    doc.text('Evaluaciones Técnicas', 14, yPos)
    yPos += 8
    
    const tecnicas = [
      ['Control del Balón', ultimaEva.tecControl || 'N/A'],
      ['Precisión de Pase', ultimaEva.tecPase || 'N/A'],
      ['Potencia y Precisión de Tiro', ultimaEva.tecTiro || 'N/A'],
      ['Habilidad de Regate', ultimaEva.tecRegate || 'N/A'],
      ['Juego Aéreo', ultimaEva.tecCabeceo || 'N/A']
    ]
    
    autoTable(doc, {
      body: tecnicas,
      startY: yPos,
      theme: 'grid',
      columnStyles: { 1: { halign: 'center' } }
    })
    
    yPos = (doc as any).lastAutoTable.finalY + 10
    
    // Fortalezas y Áreas de Mejora
    if (ultimaEva.fortalezas) {
      doc.setFontSize(12)
      doc.text('Fortalezas:', 14, yPos)
      yPos += 6
      doc.setFontSize(10)
      const splitFortalezas = doc.splitTextToSize(ultimaEva.fortalezas, 180)
      doc.text(splitFortalezas, 14, yPos)
      yPos += (splitFortalezas.length * 5) + 8
    }
    
    if (ultimaEva.areasMejora) {
      doc.setFontSize(12)
      doc.text('Áreas de Mejora:', 14, yPos)
      yPos += 6
      doc.setFontSize(10)
      const splitAreas = doc.splitTextToSize(ultimaEva.areasMejora, 180)
      doc.text(splitAreas, 14, yPos)
    }
    
    // Nueva página para historial si hay espacio
    if (evaluaciones.length > 1) {
      doc.addPage()
      doc.setFontSize(14)
      doc.text('Historial de Evaluaciones', 14, 20)
      
      const historialData = evaluaciones.map((eva: any) => [
        format(new Date(eva.fecha), 'dd/MM/yyyy', { locale: es }),
        calcularPromedio([eva.tecControl, eva.tecPase, eva.tecTiro, eva.tecRegate, eva.tecCabeceo].filter(Boolean)),
        calcularPromedio([eva.tacPosicionamiento, eva.tacLectura, eva.tacMarcaje, eva.tacCobertura, eva.tacVision].filter(Boolean)),
        calcularPromedio([eva.fisVelocidad, eva.fisResistencia, eva.fisFuerza, eva.fisAgilidad, eva.fisFlexibilidad].filter(Boolean)),
        calcularPromedio([eva.psiConcentracion, eva.psiLiderazgo, eva.psiDisciplina, eva.psiMotivacion, eva.psiTrabEquipo].filter(Boolean))
      ])
      
      autoTable(doc, {
        head: [['Fecha', 'Técnico', 'Táctico', 'Físico', 'Psicológico']],
        body: historialData,
        startY: 28,
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] }
      })
    }
    
    // Guardar PDF
    doc.save(`${nino.nombre}_${nino.apellido}_Desarrollo_Atleta.pdf`)
    
    toast({
      title: 'PDF generado',
      description: 'El reporte se ha descargado exitosamente',
      status: 'success',
      duration: 3000
    })
  }

  const promedioTecnico = evaluaciones?.[0] ? calcularPromedio([
    evaluaciones[0].tecControl,
    evaluaciones[0].tecPase,
    evaluaciones[0].tecTiro,
    evaluaciones[0].tecRegate,
    evaluaciones[0].tecCabeceo
  ].filter(Boolean)) : '0.0'

  const promedioTactico = evaluaciones?.[0] ? calcularPromedio([
    evaluaciones[0].tacPosicionamiento,
    evaluaciones[0].tacLectura,
    evaluaciones[0].tacMarcaje,
    evaluaciones[0].tacCobertura,
    evaluaciones[0].tacVision
  ].filter(Boolean)) : '0.0'

  const promedioFisico = evaluaciones?.[0] ? calcularPromedio([
    evaluaciones[0].fisVelocidad,
    evaluaciones[0].fisResistencia,
    evaluaciones[0].fisFuerza,
    evaluaciones[0].fisAgilidad,
    evaluaciones[0].fisFlexibilidad
  ].filter(Boolean)) : '0.0'

  const promedioPsicologico = evaluaciones?.[0] ? calcularPromedio([
    evaluaciones[0].psiConcentracion,
    evaluaciones[0].psiLiderazgo,
    evaluaciones[0].psiDisciplina,
    evaluaciones[0].psiMotivacion,
    evaluaciones[0].psiTrabEquipo
  ].filter(Boolean)) : '0.0'

  const legendColor = useColorModeValue('#2D3748', '#E2E8F0')
  const secondaryTextColor = useColorModeValue('#4A5568', '#A0AEC0')
  const axisGridColor = useColorModeValue('rgba(45, 55, 72, 0.2)', 'rgba(226, 232, 240, 0.2)')
  const pointLabelColor = useColorModeValue('#1A202C', '#F7FAFC')
  const tooltipBg = useColorModeValue('rgba(0, 0, 0, 0.8)', 'rgba(255, 255, 255, 0.92)')
  const tooltipTitleColor = useColorModeValue('#FFFFFF', '#1A202C')
  const tooltipBodyColor = useColorModeValue('#FFFFFF', '#1A202C')

  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: legendColor,
          font: {
            size: 14,
            weight: 'bold' as const
          },
          padding: 16,
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      title: {
        display: false,
        color: legendColor
      },
      tooltip: {
        enabled: true,
        backgroundColor: tooltipBg,
        titleColor: tooltipTitleColor,
        bodyColor: tooltipBodyColor,
        titleFont: {
          size: 14,
          weight: 'bold' as const
        },
        bodyFont: {
          size: 13
        },
        padding: 12,
        cornerRadius: 8,
        displayColors: true
      }
    },
    scales: {
      x: {
        ticks: {
          color: secondaryTextColor
        },
        grid: {
          color: axisGridColor
        }
      },
      y: {
        min: 0,
        max: 10,
        ticks: {
          stepSize: 1,
          color: secondaryTextColor
        },
        grid: {
          color: axisGridColor
        }
      }
    }
  }), [legendColor, secondaryTextColor, axisGridColor, tooltipBg, tooltipTitleColor, tooltipBodyColor])

  const radarOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        min: 0,
        max: 10,
        beginAtZero: true,
        ticks: {
          stepSize: 2,
          backdropColor: 'transparent',
          color: secondaryTextColor,
          font: {
            size: 14,
            weight: 'bold' as const
          }
        },
        grid: {
          color: axisGridColor,
          lineWidth: 2
        },
        angleLines: {
          color: axisGridColor,
          lineWidth: 2
        },
        pointLabels: {
          color: pointLabelColor,
          font: {
            size: 16,
            weight: 'bold' as const,
            family: 'system-ui, -apple-system, sans-serif'
          },
          padding: 15
        }
      }
    },
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          color: legendColor,
          font: {
            size: 14,
            weight: 'bold' as const
          },
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      tooltip: {
        enabled: true,
        backgroundColor: tooltipBg,
        titleColor: tooltipTitleColor,
        bodyColor: tooltipBodyColor,
        titleFont: {
          size: 14,
          weight: 'bold' as const
        },
        bodyFont: {
          size: 13
        },
        padding: 12,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function(context: any) {
            return `${context.dataset.label}: ${context.parsed.r.toFixed(1)}/10`
          }
        }
      }
    },
    elements: {
      line: {
        borderWidth: 3,
        tension: 0.1
      },
      point: {
        radius: 6,
        hoverRadius: 8,
        borderWidth: 3,
        hoverBorderWidth: 4
      }
    }
  }), [legendColor, secondaryTextColor, axisGridColor, pointLabelColor, tooltipBg, tooltipTitleColor, tooltipBodyColor])

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="6xl">
      <ModalOverlay />
      <ModalContent maxH="90vh" overflowY="auto">
        <ModalHeader>
          <VStack align="start" spacing={1}>
            <Stack
              direction={{ base: 'column', md: 'row' }}
              spacing={{ base: 3, md: 4 }}
              width="full"
              align={{ base: 'flex-start', md: 'center' }}
              justify="space-between"
            >
              <HStack spacing={2}>
                <FiActivity size={24} />
                <Text>{readOnly ? 'Progreso del Atleta' : 'Desarrollo del Atleta'}</Text>
              </HStack>
              <Button
                leftIcon={<FiDownload />}
                colorScheme="green"
                size="sm"
                onClick={exportToPDF}
                isDisabled={!evaluaciones || evaluaciones.length === 0}
                alignSelf={{ base: 'stretch', md: 'auto' }}
              >
                Exportar PDF
              </Button>
            </Stack>
            <Text fontSize="lg" fontWeight="bold" color="blue.600">
              {nino.nombre} {nino.apellido}
            </Text>
            <HStack spacing={2}>
              <Badge colorScheme="blue">{nino.categoria}</Badge>
              <Badge colorScheme="green">{nino.nivel}</Badge>
              {readOnly && <Badge colorScheme="purple">Solo Lectura</Badge>}
            </HStack>
          </VStack>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <Tabs colorScheme="blue">
            <TabList
              overflowX="auto"
              overflowY="hidden"
              flexWrap={{ base: 'wrap', md: 'nowrap' }}
              gap={{ base: 2, md: 0 }}
            >
              <Tab><FiAward /> Resumen</Tab>
              <Tab><FiBarChart2 /> Gráficos</Tab>
              <Tab><FiRefreshCw /> Comparar</Tab>
              {!readOnly && <Tab><FiTrendingUp /> Nueva Evaluación</Tab>}
              {!readOnly && <Tab><FiTarget /> Metas y Plan</Tab>}
              <Tab>Historial</Tab>
            </TabList>

            <TabPanels>
              {/* Tab 1: Resumen */}
              <TabPanel>
                <VStack spacing={6} align="stretch">
                  <Heading size="md">Resumen de Desempeño</Heading>
                  
                  {evaluaciones && evaluaciones.length > 0 ? (
                    <>
                      <Grid
                        templateColumns={{
                          base: 'repeat(1, 1fr)',
                          md: 'repeat(2, 1fr)',
                          xl: 'repeat(4, 1fr)'
                        }}
                        gap={4}
                      >
                        <Stat>
                          <StatLabel>Técnico</StatLabel>
                          <StatNumber color="blue.500">{promedioTecnico}</StatNumber>
                          <StatHelpText>
                            <Progress 
                              value={parseFloat(promedioTecnico) * 10} 
                              colorScheme={getColorByValue(parseFloat(promedioTecnico))}
                              size="sm"
                            />
                          </StatHelpText>
                        </Stat>
                        
                        <Stat>
                          <StatLabel>Táctico</StatLabel>
                          <StatNumber color="purple.500">{promedioTactico}</StatNumber>
                          <StatHelpText>
                            <Progress 
                              value={parseFloat(promedioTactico) * 10} 
                              colorScheme={getColorByValue(parseFloat(promedioTactico))}
                              size="sm"
                            />
                          </StatHelpText>
                        </Stat>
                        
                        <Stat>
                          <StatLabel>Físico</StatLabel>
                          <StatNumber color="green.500">{promedioFisico}</StatNumber>
                          <StatHelpText>
                            <Progress 
                              value={parseFloat(promedioFisico) * 10} 
                              colorScheme={getColorByValue(parseFloat(promedioFisico))}
                              size="sm"
                            />
                          </StatHelpText>
                        </Stat>
                        
                        <Stat>
                          <StatLabel>Psicológico</StatLabel>
                          <StatNumber color="orange.500">{promedioPsicologico}</StatNumber>
                          <StatHelpText>
                            <Progress 
                              value={parseFloat(promedioPsicologico) * 10} 
                              colorScheme={getColorByValue(parseFloat(promedioPsicologico))}
                              size="sm"
                            />
                          </StatHelpText>
                        </Stat>
                      </Grid>

                      <Divider />

                      <Box>
                        <Heading size="sm" mb={2}>Perfil del Jugador</Heading>
                        <Grid
                          templateColumns={{
                            base: 'repeat(1, 1fr)',
                            md: 'repeat(2, 1fr)',
                            xl: 'repeat(3, 1fr)'
                          }}
                          gap={4}
                          mb={4}
                        >
                          <Box>
                            <Text fontSize="sm" color="gray.600">Posición Principal</Text>
                            <Text fontWeight="bold">{evaluaciones[0].posicionPrincipal || '-'}</Text>
                          </Box>
                          <Box>
                            <Text fontSize="sm" color="gray.600">Pie Dominante</Text>
                            <Text fontWeight="bold">{evaluaciones[0].pieDominante || '-'}</Text>
                          </Box>
                          <Box>
                            <Text fontSize="sm" color="gray.600">Última Evaluación</Text>
                            <Text fontWeight="bold">
                              {format(new Date(evaluaciones[0].fecha), "dd 'de' MMMM, yyyy", { locale: es })}
                            </Text>
                          </Box>
                        </Grid>
                        
                        {/* Medidas Físicas */}
                        {(evaluaciones[0].estatura || evaluaciones[0].peso || evaluaciones[0].talla || evaluaciones[0].tallaCalzado) && (
                          <>
                            <Heading size="sm" mb={2}>Medidas Físicas</Heading>
                            <Grid
                              templateColumns={{
                                base: 'repeat(1, 1fr)',
                                md: 'repeat(2, 1fr)',
                                xl: 'repeat(4, 1fr)'
                              }}
                              gap={4}
                            >
                              {evaluaciones[0].estatura && (
                                <Box>
                                  <Text fontSize="sm" color="gray.600">Estatura</Text>
                                  <Text fontWeight="bold">{evaluaciones[0].estatura} cm</Text>
                                </Box>
                              )}
                              {evaluaciones[0].peso && (
                                <Box>
                                  <Text fontSize="sm" color="gray.600">Peso</Text>
                                  <Text fontWeight="bold">{evaluaciones[0].peso} kg</Text>
                                </Box>
                              )}
                              {evaluaciones[0].talla && (
                                <Box>
                                  <Text fontSize="sm" color="gray.600">Talla</Text>
                                  <Text fontWeight="bold">{evaluaciones[0].talla}</Text>
                                </Box>
                              )}
                              {evaluaciones[0].tallaCalzado && (
                                <Box>
                                  <Text fontSize="sm" color="gray.600">Talla de Calzado</Text>
                                  <Text fontWeight="bold">{evaluaciones[0].tallaCalzado}</Text>
                                </Box>
                              )}
                            </Grid>
                          </>
                        )}
                      </Box>

                      {evaluaciones[0].fortalezas && (
                        <Box>
                          <Heading size="sm" mb={2}>Fortalezas</Heading>
                          <Card bg="green.50">
                            <CardBody>
                              <Text>{evaluaciones[0].fortalezas}</Text>
                            </CardBody>
                          </Card>
                        </Box>
                      )}

                      {evaluaciones[0].areasMejora && (
                        <Box>
                          <Heading size="sm" mb={2}>Áreas de Mejora</Heading>
                          <Card bg="orange.50">
                            <CardBody>
                              <Text>{evaluaciones[0].areasMejora}</Text>
                            </CardBody>
                          </Card>
                        </Box>
                      )}
                      
                      {radarData && (
                        <Box>
                          <Heading size="sm" mb={4}>Radar de Competencias</Heading>
                          <Card shadow="lg" borderWidth="1px">
                            <CardBody>
                              <Box
                                height={{ base: '260px', md: '380px', xl: '450px' }}
                                p={{ base: 2, md: 4 }}
                              >
                                <Radar data={radarData} options={radarOptions} />
                              </Box>
                            </CardBody>
                          </Card>
                        </Box>
                      )}
                    </>
                  ) : (
                    <Card>
                      <CardBody textAlign="center" py={12}>
                        <Text color="gray.500">
                          {readOnly 
                            ? 'No hay evaluaciones registradas todavía. Los instructores crearán evaluaciones periódicas que podrás consultar aquí.'
                            : 'No hay evaluaciones registradas. Crea la primera evaluación en la pestaña "Nueva Evaluación".'}
                        </Text>
                      </CardBody>
                    </Card>
                  )}
                </VStack>
              </TabPanel>

              {/* Tab 2: Gráficos de Evolución */}
              <TabPanel>
                <VStack spacing={6} align="stretch">
                  <Heading size="md">Evolución del Desempeño</Heading>
                  
                  {chartData ? (
                    <>
                      <Box>
                        <Heading size="sm" mb={4}>Evolución Temporal de Competencias</Heading>
                        <Box height={{ base: '260px', md: '380px', xl: '420px' }}>
                          <Line data={chartData} options={chartOptions} />
                        </Box>
                      </Box>

                      <Divider />

                      <Box>
                        <Heading size="sm" mb={4}>Análisis de Progreso</Heading>
                        <Grid
                          templateColumns={{
                            base: 'repeat(1, 1fr)',
                            lg: 'repeat(2, 1fr)'
                          }}
                          gap={4}
                        >
                          {evaluaciones && evaluaciones.length >= 2 && (
                            <>
                              {(() => {
                                const primera = evaluaciones[evaluaciones.length - 1]
                                const ultima = evaluaciones[0]
                                
                                const mejoraTec = parseFloat(calcularPromedio([ultima.tecControl, ultima.tecPase, ultima.tecTiro, ultima.tecRegate, ultima.tecCabeceo].filter(Boolean))) - 
                                                 parseFloat(calcularPromedio([primera.tecControl, primera.tecPase, primera.tecTiro, primera.tecRegate, primera.tecCabeceo].filter(Boolean)))
                                
                                const mejoraTac = parseFloat(calcularPromedio([ultima.tacPosicionamiento, ultima.tacLectura, ultima.tacMarcaje, ultima.tacCobertura, ultima.tacVision].filter(Boolean))) - 
                                                 parseFloat(calcularPromedio([primera.tacPosicionamiento, primera.tacLectura, primera.tacMarcaje, primera.tacCobertura, primera.tacVision].filter(Boolean)))
                                
                                const mejoraFis = parseFloat(calcularPromedio([ultima.fisVelocidad, ultima.fisResistencia, ultima.fisFuerza, ultima.fisAgilidad, ultima.fisFlexibilidad].filter(Boolean))) - 
                                                 parseFloat(calcularPromedio([primera.fisVelocidad, primera.fisResistencia, primera.fisFuerza, primera.fisAgilidad, primera.fisFlexibilidad].filter(Boolean)))
                                
                                const mejoraPsi = parseFloat(calcularPromedio([ultima.psiConcentracion, ultima.psiLiderazgo, ultima.psiDisciplina, ultima.psiMotivacion, ultima.psiTrabEquipo].filter(Boolean))) - 
                                                 parseFloat(calcularPromedio([primera.psiConcentracion, primera.psiLiderazgo, primera.psiDisciplina, primera.psiMotivacion, primera.psiTrabEquipo].filter(Boolean)))
                                
                                return (
                                  <>
                                  <Card>
                                      <CardBody>
                                        <Stat>
                                          <StatLabel>Progreso Técnico</StatLabel>
                                          <StatNumber color={mejoraTec >= 0 ? 'green.500' : 'red.500'}>
                                            {mejoraTec >= 0 ? '+' : ''}{mejoraTec.toFixed(1)}
                                          </StatNumber>
                                          <StatHelpText>Desde primera evaluación</StatHelpText>
                                        </Stat>
                                      </CardBody>
                                    </Card>
                                    
                                    <Card>
                                      <CardBody>
                                        <Stat>
                                          <StatLabel>Progreso Táctico</StatLabel>
                                          <StatNumber color={mejoraTac >= 0 ? 'green.500' : 'red.500'}>
                                            {mejoraTac >= 0 ? '+' : ''}{mejoraTac.toFixed(1)}
                                          </StatNumber>
                                          <StatHelpText>Desde primera evaluación</StatHelpText>
                                        </Stat>
                                      </CardBody>
                                    </Card>
                                    
                                    <Card>
                                      <CardBody>
                                        <Stat>
                                          <StatLabel>Progreso Físico</StatLabel>
                                          <StatNumber color={mejoraFis >= 0 ? 'green.500' : 'red.500'}>
                                            {mejoraFis >= 0 ? '+' : ''}{mejoraFis.toFixed(1)}
                                          </StatNumber>
                                          <StatHelpText>Desde primera evaluación</StatHelpText>
                                        </Stat>
                                      </CardBody>
                                    </Card>
                                    
                                    <Card>
                                      <CardBody>
                                        <Stat>
                                          <StatLabel>Progreso Psicológico</StatLabel>
                                          <StatNumber color={mejoraPsi >= 0 ? 'green.500' : 'red.500'}>
                                            {mejoraPsi >= 0 ? '+' : ''}{mejoraPsi.toFixed(1)}
                                          </StatNumber>
                                          <StatHelpText>Desde primera evaluación</StatHelpText>
                                        </Stat>
                                      </CardBody>
                                    </Card>
                                  </>
                                )
                              })()}
                            </>
                          )}
                        </Grid>
                      </Box>
                    </>
                  ) : (
                    <Alert status="info">
                      <AlertIcon />
                      <Box>
                        <Text fontWeight="bold">Necesitas al menos 2 evaluaciones</Text>
                        <Text fontSize="sm">Crea más evaluaciones para ver los gráficos de evolución</Text>
                      </Box>
                    </Alert>
                  )}
                </VStack>
              </TabPanel>

              {/* Tab 3: Comparar Evaluaciones */}
              <TabPanel>
                <VStack spacing={6} align="stretch">
                  <Heading size="md">Comparar Evaluaciones</Heading>
                  
                  {evaluaciones && evaluaciones.length >= 2 ? (
                    <>
                      <Grid
                        templateColumns={{
                          base: 'repeat(1, 1fr)',
                          md: 'repeat(2, 1fr)'
                        }}
                        gap={4}
                      >
                        <FormControl>
                          <FormLabel>Primera Evaluación</FormLabel>
                          <Select
                            value={compareEva1}
                            onChange={(e) => setCompareEva1(e.target.value)}
                            placeholder="Seleccionar evaluación"
                          >
                            {evaluaciones.map((eva: any) => (
                              <option key={eva.id} value={eva.id}>
                                {format(new Date(eva.fecha), "dd 'de' MMMM, yyyy", { locale: es })}
                              </option>
                            ))}
                          </Select>
                        </FormControl>

                        <FormControl>
                          <FormLabel>Segunda Evaluación</FormLabel>
                          <Select
                            value={compareEva2}
                            onChange={(e) => setCompareEva2(e.target.value)}
                            placeholder="Seleccionar evaluación"
                          >
                            {evaluaciones.map((eva: any) => (
                              <option key={eva.id} value={eva.id}>
                                {format(new Date(eva.fecha), "dd 'de' MMMM, yyyy", { locale: es })}
                              </option>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>

                      {compareData ? (
                        <>
                          <Box>
                            <Heading size="sm" mb={4}>Comparación Visual</Heading>
                            <Card shadow="lg" borderWidth="1px">
                              <CardBody>
                                <Box
                                  height={{ base: '280px', md: '420px', xl: '500px' }}
                                  p={{ base: 2, md: 4 }}
                                >
                                  <Radar data={compareData} options={radarOptions} />
                                </Box>
                              </CardBody>
                            </Card>
                          </Box>

                          <Divider />

                          <Box>
                            <Heading size="sm" mb={4}>Diferencias Detalladas</Heading>
                            {(() => {
                              const eva1 = evaluaciones.find((e: any) => e.id === compareEva1)
                              const eva2 = evaluaciones.find((e: any) => e.id === compareEva2)
                              
                              if (!eva1 || !eva2) return null

                              const difTec = parseFloat(calcularPromedio([eva2.tecControl, eva2.tecPase, eva2.tecTiro, eva2.tecRegate, eva2.tecCabeceo].filter(Boolean))) - 
                                            parseFloat(calcularPromedio([eva1.tecControl, eva1.tecPase, eva1.tecTiro, eva1.tecRegate, eva1.tecCabeceo].filter(Boolean)))
                              
                              const difTac = parseFloat(calcularPromedio([eva2.tacPosicionamiento, eva2.tacLectura, eva2.tacMarcaje, eva2.tacCobertura, eva2.tacVision].filter(Boolean))) - 
                                            parseFloat(calcularPromedio([eva1.tacPosicionamiento, eva1.tacLectura, eva1.tacMarcaje, eva1.tacCobertura, eva1.tacVision].filter(Boolean)))
                              
                              const difFis = parseFloat(calcularPromedio([eva2.fisVelocidad, eva2.fisResistencia, eva2.fisFuerza, eva2.fisAgilidad, eva2.fisFlexibilidad].filter(Boolean))) - 
                                            parseFloat(calcularPromedio([eva1.fisVelocidad, eva1.fisResistencia, eva1.fisFuerza, eva1.fisAgilidad, eva1.fisFlexibilidad].filter(Boolean)))
                              
                              const difPsi = parseFloat(calcularPromedio([eva2.psiConcentracion, eva2.psiLiderazgo, eva2.psiDisciplina, eva2.psiMotivacion, eva2.psiTrabEquipo].filter(Boolean))) - 
                                            parseFloat(calcularPromedio([eva1.psiConcentracion, eva1.psiLiderazgo, eva1.psiDisciplina, eva1.psiMotivacion, eva1.psiTrabEquipo].filter(Boolean)))
                              
                              return (
                                <Box overflowX="auto">
                                  <Table variant="simple">
                                    <Thead>
                                      <Tr>
                                        <Th>Competencia</Th>
                                        <Th>Evaluación 1</Th>
                                        <Th>Evaluación 2</Th>
                                        <Th>Diferencia</Th>
                                      </Tr>
                                    </Thead>
                                    <Tbody>
                                      <Tr>
                                        <Td fontWeight="bold">Técnico</Td>
                                        <Td>{calcularPromedio([eva1.tecControl, eva1.tecPase, eva1.tecTiro, eva1.tecRegate, eva1.tecCabeceo].filter(Boolean))}</Td>
                                        <Td>{calcularPromedio([eva2.tecControl, eva2.tecPase, eva2.tecTiro, eva2.tecRegate, eva2.tecCabeceo].filter(Boolean))}</Td>
                                        <Td>
                                          <Badge colorScheme={difTec >= 0 ? 'green' : 'red'}>
                                            {difTec >= 0 ? '+' : ''}{difTec.toFixed(1)}
                                          </Badge>
                                        </Td>
                                      </Tr>
                                      <Tr>
                                        <Td fontWeight="bold">Táctico</Td>
                                        <Td>{calcularPromedio([eva1.tacPosicionamiento, eva1.tacLectura, eva1.tacMarcaje, eva1.tacCobertura, eva1.tacVision].filter(Boolean))}</Td>
                                        <Td>{calcularPromedio([eva2.tacPosicionamiento, eva2.tacLectura, eva2.tacMarcaje, eva2.tacCobertura, eva2.tacVision].filter(Boolean))}</Td>
                                        <Td>
                                          <Badge colorScheme={difTac >= 0 ? 'green' : 'red'}>
                                            {difTac >= 0 ? '+' : ''}{difTac.toFixed(1)}
                                          </Badge>
                                        </Td>
                                      </Tr>
                                      <Tr>
                                        <Td fontWeight="bold">Físico</Td>
                                        <Td>{calcularPromedio([eva1.fisVelocidad, eva1.fisResistencia, eva1.fisFuerza, eva1.fisAgilidad, eva1.fisFlexibilidad].filter(Boolean))}</Td>
                                        <Td>{calcularPromedio([eva2.fisVelocidad, eva2.fisResistencia, eva2.fisFuerza, eva2.fisAgilidad, eva2.fisFlexibilidad].filter(Boolean))}</Td>
                                        <Td>
                                          <Badge colorScheme={difFis >= 0 ? 'green' : 'red'}>
                                            {difFis >= 0 ? '+' : ''}{difFis.toFixed(1)}
                                          </Badge>
                                        </Td>
                                      </Tr>
                                      <Tr>
                                        <Td fontWeight="bold">Psicológico</Td>
                                        <Td>{calcularPromedio([eva1.psiConcentracion, eva1.psiLiderazgo, eva1.psiDisciplina, eva1.psiMotivacion, eva1.psiTrabEquipo].filter(Boolean))}</Td>
                                        <Td>{calcularPromedio([eva2.psiConcentracion, eva2.psiLiderazgo, eva2.psiDisciplina, eva2.psiMotivacion, eva2.psiTrabEquipo].filter(Boolean))}</Td>
                                        <Td>
                                          <Badge colorScheme={difPsi >= 0 ? 'green' : 'red'}>
                                            {difPsi >= 0 ? '+' : ''}{difPsi.toFixed(1)}
                                          </Badge>
                                        </Td>
                                      </Tr>
                                    </Tbody>
                                  </Table>
                                </Box>
                              )
                            })()}
                          </Box>
                        </>
                      ) : (
                        <Alert status="info">
                          <AlertIcon />
                          <Text>Selecciona dos evaluaciones para comparar</Text>
                        </Alert>
                      )}
                    </>
                  ) : (
                    <Alert status="info">
                      <AlertIcon />
                      <Box>
                        <Text fontWeight="bold">Necesitas al menos 2 evaluaciones</Text>
                        <Text fontSize="sm">Crea más evaluaciones para poder compararlas</Text>
                      </Box>
                    </Alert>
                  )}
                </VStack>
              </TabPanel>

              {/* Tab 4: Nueva Evaluación - Solo para profesores/admin */}
              {!readOnly && <TabPanel>
                <VStack spacing={6} align="stretch">
                  {/* Perfil del Jugador */}
                  <Box>
                    <Heading size="md" mb={4}>Perfil del Jugador</Heading>
                    <Grid
                      templateColumns={{
                        base: 'repeat(1, 1fr)',
                        md: 'repeat(2, 1fr)'
                      }}
                      gap={4}
                    >
                      <FormControl>
                        <FormLabel>Posición Principal</FormLabel>
                        <Select
                          value={formData.posicionPrincipal}
                          onChange={(e) => setFormData({ ...formData, posicionPrincipal: e.target.value })}
                        >
                          <option value="">Seleccionar</option>
                          <option value="Portero">Portero</option>
                          <option value="Defensa Central">Defensa Central</option>
                          <option value="Lateral Derecho">Lateral Derecho</option>
                          <option value="Lateral Izquierdo">Lateral Izquierdo</option>
                          <option value="Mediocampista Defensivo">Mediocampista Defensivo</option>
                          <option value="Mediocampista Central">Mediocampista Central</option>
                          <option value="Mediocampista Ofensivo">Mediocampista Ofensivo</option>
                          <option value="Extremo Derecho">Extremo Derecho</option>
                          <option value="Extremo Izquierdo">Extremo Izquierdo</option>
                          <option value="Delantero Centro">Delantero Centro</option>
                        </Select>
                      </FormControl>

                      <FormControl>
                        <FormLabel>Pie Dominante</FormLabel>
                        <Select
                          value={formData.pieDominante}
                          onChange={(e) => setFormData({ ...formData, pieDominante: e.target.value })}
                        >
                          <option value="">Seleccionar</option>
                          <option value="Derecho">Derecho</option>
                          <option value="Izquierdo">Izquierdo</option>
                          <option value="Ambos">Ambos</option>
                        </Select>
                      </FormControl>
                    </Grid>
                    
                    {/* Medidas Físicas */}
                    <Divider />
                    <Heading size="sm" mb={4}>Medidas Físicas</Heading>
                    <Grid
                      templateColumns={{
                        base: 'repeat(1, 1fr)',
                        md: 'repeat(2, 1fr)',
                        xl: 'repeat(4, 1fr)'
                      }}
                      gap={4}
                    >
                      <FormControl>
                        <FormLabel>Estatura (cm)</FormLabel>
                        <Input
                          type="number"
                          value={formData.estatura}
                          onChange={(e) => setFormData({ ...formData, estatura: e.target.value ? parseFloat(e.target.value) : '' })}
                          placeholder="Ej: 150"
                          step="0.1"
                        />
                      </FormControl>
                      
                      <FormControl>
                        <FormLabel>Peso (kg)</FormLabel>
                        <Input
                          type="number"
                          value={formData.peso}
                          onChange={(e) => setFormData({ ...formData, peso: e.target.value ? parseFloat(e.target.value) : '' })}
                          placeholder="Ej: 45.5"
                          step="0.1"
                        />
                      </FormControl>
                      
                      <FormControl>
                        <FormLabel>Talla</FormLabel>
                        <Select
                          value={formData.talla}
                          onChange={(e) => setFormData({ ...formData, talla: e.target.value })}
                        >
                          <option value="">Seleccionar</option>
                          <option value="6">6</option>
                          <option value="8">8</option>
                          <option value="10">10</option>
                          <option value="12">12</option>
                          <option value="14">14</option>
                          <option value="16">16</option>
                          <option value="S">S</option>
                          <option value="M">M</option>
                          <option value="L">L</option>
                        </Select>
                      </FormControl>
                      <FormControl>
                        <FormLabel>Talla de Calzado</FormLabel>
                        <Select
                          value={formData.tallaCalzado}
                          onChange={(e) => setFormData({ ...formData, tallaCalzado: e.target.value })}
                        >
                          <option value="">Seleccionar</option>
                          <option value="33">33</option>
                          <option value="34">34</option>
                          <option value="35">35</option>
                          <option value="36">36</option>
                          <option value="37">37</option>
                          <option value="38">38</option>
                          <option value="39">39</option>
                          <option value="40">40</option>
                          <option value="41">41</option>
                          <option value="42">42</option>
                          <option value="43">43</option>
                        </Select>
                      </FormControl>
                    </Grid>
                  </Box>

                  <Divider />

                  {/* Evaluación Técnica */}
                  <Box>
                    <Heading size="md" mb={4} color="blue.600">Evaluación Técnica</Heading>
                    <VStack spacing={4} align="stretch">
                      {[
                        { label: 'Control del Balón', key: 'tecControl' as keyof EvaluacionData },
                        { label: 'Precisión de Pase', key: 'tecPase' as keyof EvaluacionData },
                        { label: 'Potencia y Precisión de Tiro', key: 'tecTiro' as keyof EvaluacionData },
                        { label: 'Habilidad de Regate', key: 'tecRegate' as keyof EvaluacionData },
                        { label: 'Juego Aéreo (Cabeceo)', key: 'tecCabeceo' as keyof EvaluacionData }
                      ].map((item) => (
                        <FormControl key={item.key}>
                          <FormLabel>{item.label}</FormLabel>
                          <Stack
                            direction={{ base: 'column', sm: 'row' }}
                            spacing={4}
                            align={{ base: 'stretch', sm: 'center' }}
                          >
                            <Slider
                              value={formData[item.key] as number}
                              onChange={(val) => setFormData({ ...formData, [item.key]: val })}
                              min={1}
                              max={10}
                              step={1}
                            >
                              <SliderTrack>
                                <SliderFilledTrack bg={`${getColorByValue(formData[item.key] as number)}.500`} />
                              </SliderTrack>
                              <SliderThumb boxSize={6}>
                                <Box color={`${getColorByValue(formData[item.key] as number)}.500`}>
                                  {formData[item.key]}
                                </Box>
                              </SliderThumb>
                            </Slider>
                            <Badge 
                              colorScheme={getColorByValue(formData[item.key] as number)} 
                              fontSize="md" 
                              px={3} 
                              py={1}
                            >
                              {formData[item.key]}/10
                            </Badge>
                          </Stack>
                        </FormControl>
                      ))}
                    </VStack>
                  </Box>

                  <Divider />

                  {/* Evaluación Táctica */}
                  <Box>
                    <Heading size="md" mb={4} color="purple.600">Evaluación Táctica</Heading>
                    <VStack spacing={4} align="stretch">
                      {[
                        { label: 'Posicionamiento en el Campo', key: 'tacPosicionamiento' as keyof EvaluacionData },
                        { label: 'Lectura del Juego', key: 'tacLectura' as keyof EvaluacionData },
                        { label: 'Capacidad de Marcaje', key: 'tacMarcaje' as keyof EvaluacionData },
                        { label: 'Cobertura Defensiva', key: 'tacCobertura' as keyof EvaluacionData },
                        { label: 'Visión de Juego', key: 'tacVision' as keyof EvaluacionData }
                      ].map((item) => (
                        <FormControl key={item.key}>
                          <FormLabel>{item.label}</FormLabel>
                          <Stack
                            direction={{ base: 'column', sm: 'row' }}
                            spacing={4}
                            align={{ base: 'stretch', sm: 'center' }}
                          >
                            <Slider
                              value={formData[item.key] as number}
                              onChange={(val) => setFormData({ ...formData, [item.key]: val })}
                              min={1}
                              max={10}
                              step={1}
                            >
                              <SliderTrack>
                                <SliderFilledTrack bg={`${getColorByValue(formData[item.key] as number)}.500`} />
                              </SliderTrack>
                              <SliderThumb boxSize={6}>
                                <Box color={`${getColorByValue(formData[item.key] as number)}.500`}>
                                  {formData[item.key]}
                                </Box>
                              </SliderThumb>
                            </Slider>
                            <Badge 
                              colorScheme={getColorByValue(formData[item.key] as number)} 
                              fontSize="md" 
                              px={3} 
                              py={1}
                            >
                              {formData[item.key]}/10
                            </Badge>
                          </Stack>
                        </FormControl>
                      ))}
                    </VStack>
                  </Box>

                  <Divider />

                  {/* Evaluación Física */}
                  <Box>
                    <Heading size="md" mb={4} color="green.600">Evaluación Física</Heading>
                    <VStack spacing={4} align="stretch">
                      {[
                        { label: 'Velocidad', key: 'fisVelocidad' as keyof EvaluacionData },
                        { label: 'Resistencia', key: 'fisResistencia' as keyof EvaluacionData },
                        { label: 'Fuerza Física', key: 'fisFuerza' as keyof EvaluacionData },
                        { label: 'Agilidad', key: 'fisAgilidad' as keyof EvaluacionData },
                        { label: 'Flexibilidad', key: 'fisFlexibilidad' as keyof EvaluacionData }
                      ].map((item) => (
                        <FormControl key={item.key}>
                          <FormLabel>{item.label}</FormLabel>
                          <Stack
                            direction={{ base: 'column', sm: 'row' }}
                            spacing={4}
                            align={{ base: 'stretch', sm: 'center' }}
                          >
                            <Slider
                              value={formData[item.key] as number}
                              onChange={(val) => setFormData({ ...formData, [item.key]: val })}
                              min={1}
                              max={10}
                              step={1}
                            >
                              <SliderTrack>
                                <SliderFilledTrack bg={`${getColorByValue(formData[item.key] as number)}.500`} />
                              </SliderTrack>
                              <SliderThumb boxSize={6}>
                                <Box color={`${getColorByValue(formData[item.key] as number)}.500`}>
                                  {formData[item.key]}
                                </Box>
                              </SliderThumb>
                            </Slider>
                            <Badge 
                              colorScheme={getColorByValue(formData[item.key] as number)} 
                              fontSize="md" 
                              px={3} 
                              py={1}
                            >
                              {formData[item.key]}/10
                            </Badge>
                          </Stack>
                        </FormControl>
                      ))}
                    </VStack>
                  </Box>

                  <Divider />

                  {/* Evaluación Psicológica */}
                  <Box>
                    <Heading size="md" mb={4} color="orange.600">Evaluación Psicológica</Heading>
                    <VStack spacing={4} align="stretch">
                      {[
                        { label: 'Concentración', key: 'psiConcentracion' as keyof EvaluacionData },
                        { label: 'Liderazgo', key: 'psiLiderazgo' as keyof EvaluacionData },
                        { label: 'Disciplina', key: 'psiDisciplina' as keyof EvaluacionData },
                        { label: 'Motivación', key: 'psiMotivacion' as keyof EvaluacionData },
                        { label: 'Trabajo en Equipo', key: 'psiTrabEquipo' as keyof EvaluacionData }
                      ].map((item) => (
                        <FormControl key={item.key}>
                          <FormLabel>{item.label}</FormLabel>
                          <Stack
                            direction={{ base: 'column', sm: 'row' }}
                            spacing={4}
                            align={{ base: 'stretch', sm: 'center' }}
                          >
                            <Slider
                              value={formData[item.key] as number}
                              onChange={(val) => setFormData({ ...formData, [item.key]: val })}
                              min={1}
                              max={10}
                              step={1}
                            >
                              <SliderTrack>
                                <SliderFilledTrack bg={`${getColorByValue(formData[item.key] as number)}.500`} />
                              </SliderTrack>
                              <SliderThumb boxSize={6}>
                                <Box color={`${getColorByValue(formData[item.key] as number)}.500`}>
                                  {formData[item.key]}
                                </Box>
                              </SliderThumb>
                            </Slider>
                            <Badge 
                              colorScheme={getColorByValue(formData[item.key] as number)} 
                              fontSize="md" 
                              px={3} 
                              py={1}
                            >
                              {formData[item.key]}/10
                            </Badge>
                          </Stack>
                        </FormControl>
                      ))}
                    </VStack>
                  </Box>

                  <Divider />

                  {/* Observaciones */}
                  <Box>
                    <Heading size="md" mb={4}>Observaciones y Análisis</Heading>
                    <VStack spacing={4}>
                      <FormControl>
                        <FormLabel>Fortalezas Identificadas</FormLabel>
                        <Textarea
                          value={formData.fortalezas}
                          onChange={(e) => setFormData({ ...formData, fortalezas: e.target.value })}
                          placeholder="Describe las principales fortalezas del atleta..."
                          rows={3}
                        />
                      </FormControl>

                      <FormControl>
                        <FormLabel>Áreas que Necesitan Mejora</FormLabel>
                        <Textarea
                          value={formData.areasMejora}
                          onChange={(e) => setFormData({ ...formData, areasMejora: e.target.value })}
                          placeholder="Identifica las áreas que requieren trabajo adicional..."
                          rows={3}
                        />
                      </FormControl>

                      <FormControl>
                        <FormLabel>Observaciones Generales</FormLabel>
                        <Textarea
                          value={formData.observaciones}
                          onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                          placeholder="Observaciones adicionales sobre el desempeño del atleta..."
                          rows={3}
                        />
                      </FormControl>
                    </VStack>
                  </Box>

                  <Button
                    leftIcon={<FiSave />}
                    colorScheme="blue"
                    size="lg"
                    onClick={handleSubmit}
                    isLoading={createMutation.isPending}
                  >
                    Guardar Evaluación
                  </Button>
                </VStack>
              </TabPanel>}

              {/* Tab 5: Metas y Plan - Solo para profesores/admin */}
              {!readOnly && <TabPanel>
                <VStack spacing={6} align="stretch">
                  <Heading size="md">Plan de Entrenamiento</Heading>
                  
                  <FormControl>
                    <FormLabel>Objetivos Personalizados</FormLabel>
                    <Textarea
                      value={formData.objetivos}
                      onChange={(e) => setFormData({ ...formData, objetivos: e.target.value })}
                      placeholder="Define los objetivos específicos para este atleta..."
                      rows={4}
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Ejercicios Recomendados</FormLabel>
                    <Textarea
                      value={formData.ejerciciosRecomendados}
                      onChange={(e) => setFormData({ ...formData, ejerciciosRecomendados: e.target.value })}
                      placeholder="Lista de ejercicios específicos recomendados..."
                      rows={4}
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Frecuencia de Entrenamiento</FormLabel>
                    <Select
                      value={formData.frecuenciaEntrenamiento}
                      onChange={(e) => setFormData({ ...formData, frecuenciaEntrenamiento: e.target.value })}
                    >
                      <option value="">Seleccionar</option>
                      <option value="2-3 veces/semana">2-3 veces por semana</option>
                      <option value="4-5 veces/semana">4-5 veces por semana</option>
                      <option value="Diario">Diario</option>
                      <option value="Personalizado">Personalizado</option>
                    </Select>
                  </FormControl>

                  <Divider />

                  <Heading size="md">Metas de Desarrollo</Heading>

                  <FormControl>
                    <FormLabel>Metas a Corto Plazo (1-3 meses)</FormLabel>
                    <Textarea
                      value={formData.metasCortoPlazo}
                      onChange={(e) => setFormData({ ...formData, metasCortoPlazo: e.target.value })}
                      placeholder="Metas alcanzables en el corto plazo..."
                      rows={3}
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Metas a Mediano Plazo (6 meses)</FormLabel>
                    <Textarea
                      value={formData.metasMedianoPlazo}
                      onChange={(e) => setFormData({ ...formData, metasMedianoPlazo: e.target.value })}
                      placeholder="Objetivos para el mediano plazo..."
                      rows={3}
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Metas a Largo Plazo (1 año+)</FormLabel>
                    <Textarea
                      value={formData.metasLargoPlazo}
                      onChange={(e) => setFormData({ ...formData, metasLargoPlazo: e.target.value })}
                      placeholder="Visión a largo plazo del desarrollo del atleta..."
                      rows={3}
                    />
                  </FormControl>

                  <Button
                    leftIcon={<FiSave />}
                    colorScheme="blue"
                    size="lg"
                    onClick={handleSubmit}
                    isLoading={createMutation.isPending}
                  >
                    Guardar Plan y Metas
                  </Button>
                </VStack>
              </TabPanel>}

              {/* Tab 6: Historial */}
              <TabPanel>
                <VStack spacing={4} align="stretch">
                  <Heading size="md">Historial de Evaluaciones</Heading>
                  
                  {evaluaciones && evaluaciones.length > 0 ? (
                    <Box overflowX="auto">
                      <Table variant="simple" size="sm">
                        <Thead>
                          <Tr>
                            <Th>Fecha</Th>
                            <Th>Técnico</Th>
                            <Th>Táctico</Th>
                            <Th>Físico</Th>
                            <Th>Psicológico</Th>
                            <Th>Evaluador</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {evaluaciones.map((eva: any) => {
                            const promTec = calcularPromedio([eva.tecControl, eva.tecPase, eva.tecTiro, eva.tecRegate, eva.tecCabeceo].filter(Boolean))
                            const promTac = calcularPromedio([eva.tacPosicionamiento, eva.tacLectura, eva.tacMarcaje, eva.tacCobertura, eva.tacVision].filter(Boolean))
                            const promFis = calcularPromedio([eva.fisVelocidad, eva.fisResistencia, eva.fisFuerza, eva.fisAgilidad, eva.fisFlexibilidad].filter(Boolean))
                            const promPsi = calcularPromedio([eva.psiConcentracion, eva.psiLiderazgo, eva.psiDisciplina, eva.psiMotivacion, eva.psiTrabEquipo].filter(Boolean))
                            
                            return (
                              <Tr key={eva.id}>
                                <Td>{format(new Date(eva.fecha), 'dd/MM/yyyy', { locale: es })}</Td>
                                <Td>
                                  <Badge colorScheme={getColorByValue(parseFloat(promTec))}>{promTec}</Badge>
                                </Td>
                                <Td>
                                  <Badge colorScheme={getColorByValue(parseFloat(promTac))}>{promTac}</Badge>
                                </Td>
                                <Td>
                                  <Badge colorScheme={getColorByValue(parseFloat(promFis))}>{promFis}</Badge>
                                </Td>
                                <Td>
                                  <Badge colorScheme={getColorByValue(parseFloat(promPsi))}>{promPsi}</Badge>
                                </Td>
                                <Td>{eva.evaluadoPor || '-'}</Td>
                              </Tr>
                            )
                          })}
                        </Tbody>
                      </Table>
                    </Box>
                  ) : (
                    <Card>
                      <CardBody textAlign="center" py={8}>
                        <Text color="gray.500">No hay evaluaciones registradas todavía.</Text>
                      </CardBody>
                    </Card>
                  )}
                </VStack>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}
