import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface ReporteData {
  estadisticas?: any
  ninos?: any[]
  pagos?: any[]
  representantes?: any[]
  evaluaciones?: any[]
  asistencias?: any[]
}

export function exportarPDF(data: ReporteData) {
  const doc = new jsPDF()
  let yPos = 20

  // Título
  doc.setFontSize(20)
  doc.text('Reporte de Gestión de Fútbol', 14, yPos)
  yPos += 10

  doc.setFontSize(12)
  doc.text(`Fecha de generación: ${format(new Date(), "dd 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}`, 14, yPos)
  yPos += 15

  // Resumen Ejecutivo
  if (data.estadisticas) {
    doc.setFontSize(16)
    doc.text('Resumen Ejecutivo', 14, yPos)
    yPos += 10

    doc.setFontSize(11)
    const resumen = [
      ['Total Niños', data.estadisticas.generales?.totalNinos || 0],
      ['Total Representantes', data.estadisticas.generales?.totalRepresentantes || 0],
      ['Pagos al Día', `${data.estadisticas.generales?.porcentajePagosAlDia || 0}%`],
      ['Ingresos Totales', `$${data.estadisticas.pagos?.ingresosTotales?.toFixed(2) || '0.00'}`],
      ['Ingresos del Mes', `$${data.estadisticas.pagos?.ingresosMesActual?.toFixed(2) || '0.00'}`],
      ['Pagos Pagados', data.estadisticas.pagos?.pagados || 0],
      ['Pagos Pendientes', data.estadisticas.pagos?.pendientes || 0],
      ['Pagos Vencidos', data.estadisticas.pagos?.vencidos || 0]
    ]

    autoTable(doc, {
      startY: yPos,
      head: [['Métrica', 'Valor']],
      body: resumen,
      theme: 'striped',
      headStyles: { fillColor: [66, 153, 225] }
    })
    yPos = (doc as any).lastAutoTable.finalY + 15
  }

  // Distribución por Categorías
  if (data.estadisticas?.ninos?.porCategoria) {
    doc.addPage()
    yPos = 20
    doc.setFontSize(16)
    doc.text('Distribución por Categorías', 14, yPos)
    yPos += 10

    const categorias = data.estadisticas.ninos.porCategoria.map((cat: any) => [
      cat.categoria || 'Sin categoría',
      cat.cantidad.toString()
    ])

    autoTable(doc, {
      startY: yPos,
      head: [['Categoría', 'Cantidad']],
      body: categorias,
      theme: 'striped',
      headStyles: { fillColor: [66, 153, 225] }
    })
    yPos = (doc as any).lastAutoTable.finalY + 15
  }

  // Representantes con Pagos Pendientes
  if (data.estadisticas?.deudores?.lista && data.estadisticas.deudores.lista.length > 0) {
    doc.addPage()
    yPos = 20
    doc.setFontSize(16)
    doc.text('Representantes con Pagos Pendientes', 14, yPos)
    yPos += 10

    const deudores = data.estadisticas.deudores.lista.map((deudor: any) => [
      deudor.nombre,
      deudor.cedula,
      deudor.email,
      deudor.pagosPendientes.toString()
    ])

    autoTable(doc, {
      startY: yPos,
      head: [['Representante', 'Cédula', 'Email', 'Pagos Pendientes']],
      body: deudores,
      theme: 'striped',
      headStyles: { fillColor: [220, 53, 69] }
    })
  }

  // Guardar PDF
  doc.save(`reporte-${format(new Date(), 'yyyy-MM-dd-HHmm')}.pdf`)
}

export function exportarExcel(data: ReporteData) {
  const workbook = XLSX.utils.book_new()

  // Hoja 1: Resumen Ejecutivo
  if (data.estadisticas) {
    const resumenData = [
      ['Métrica', 'Valor'],
      ['Total Niños', data.estadisticas.generales?.totalNinos || 0],
      ['Total Representantes', data.estadisticas.generales?.totalRepresentantes || 0],
      ['Pagos al Día (%)', data.estadisticas.generales?.porcentajePagosAlDia || 0],
      ['Ingresos Totales', data.estadisticas.pagos?.ingresosTotales || 0],
      ['Ingresos del Mes', data.estadisticas.pagos?.ingresosMesActual || 0],
      ['Pagos Pagados', data.estadisticas.pagos?.pagados || 0],
      ['Pagos Pendientes', data.estadisticas.pagos?.pendientes || 0],
      ['Pagos Vencidos', data.estadisticas.pagos?.vencidos || 0]
    ]
    const resumenSheet = XLSX.utils.aoa_to_sheet(resumenData)
    XLSX.utils.book_append_sheet(workbook, resumenSheet, 'Resumen')
  }

  // Hoja 2: Distribución por Categorías
  if (data.estadisticas?.ninos?.porCategoria) {
    const categoriasData = [
      ['Categoría', 'Cantidad']
    ]
    data.estadisticas.ninos.porCategoria.forEach((cat: any) => {
      categoriasData.push([cat.categoria || 'Sin categoría', cat.cantidad])
    })
    const categoriasSheet = XLSX.utils.aoa_to_sheet(categoriasData)
    XLSX.utils.book_append_sheet(workbook, categoriasSheet, 'Categorías')
  }

  // Hoja 3: Deudores
  if (data.estadisticas?.deudores?.lista && data.estadisticas.deudores.lista.length > 0) {
    const deudoresData = [
      ['Representante', 'Cédula', 'Email', 'Pagos Pendientes']
    ]
    data.estadisticas.deudores.lista.forEach((deudor: any) => {
      deudoresData.push([
        deudor.nombre,
        deudor.cedula,
        deudor.email,
        deudor.pagosPendientes
      ])
    })
    const deudoresSheet = XLSX.utils.aoa_to_sheet(deudoresData)
    XLSX.utils.book_append_sheet(workbook, deudoresSheet, 'Deudores')
  }

  // Hoja 4: Niños (si está disponible)
  if (data.ninos && data.ninos.length > 0) {
    const ninosData = [
      ['Nombre', 'Apellido', 'Categoría', 'Nivel', 'Representante', 'Email Representante']
    ]
    data.ninos.forEach((nino: any) => {
      ninosData.push([
        nino.nombre,
        nino.apellido,
        nino.categoria || 'Sin categoría',
        nino.nivel || 'Sin nivel',
        nino.representante?.nombre || 'N/A',
        nino.representante?.email || 'N/A'
      ])
    })
    const ninosSheet = XLSX.utils.aoa_to_sheet(ninosData)
    XLSX.utils.book_append_sheet(workbook, ninosSheet, 'Niños')
  }

  // Hoja 5: Pagos (si está disponible)
  if (data.pagos && data.pagos.length > 0) {
    const pagosData = [
      ['Concepto', 'Monto', 'Estado', 'Fecha Vencimiento', 'Fecha Pago', 'Representante']
    ]
    data.pagos.forEach((pago: any) => {
      pagosData.push([
        pago.concepto,
        pago.monto,
        pago.estado,
        pago.fechaVencimiento ? format(new Date(pago.fechaVencimiento), 'dd/MM/yyyy', { locale: es }) : 'N/A',
        pago.fechaPago ? format(new Date(pago.fechaPago), 'dd/MM/yyyy', { locale: es }) : 'N/A',
        pago.representante?.nombre || 'N/A'
      ])
    })
    const pagosSheet = XLSX.utils.aoa_to_sheet(pagosData)
    XLSX.utils.book_append_sheet(workbook, pagosSheet, 'Pagos')
  }

  // Guardar Excel
  XLSX.writeFile(workbook, `reporte-${format(new Date(), 'yyyy-MM-dd-HHmm')}.xlsx`)
}


