import { jsPDF } from 'jspdf'
import type { Property } from '@/types'

const NAVY = '#1B2A4A'
const ORANGE = '#E8872A'
const GRAY = '#6B7280'
const WHITE = '#FFFFFF'
const LIGHT_GRAY = '#F3F4F6'

interface PdfProperty {
  property: Property
  imageUrl: string | null
  imageData: string | null // base64
}

function formatPrice(value: string | number | null | undefined): string {
  if (!value) return 'Consultar precio'
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num) || num === 0) return 'Consultar precio'
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(num) + ' MXN'
}

function dv(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return '—'
  return String(value)
}

export async function loadImageAsBase64(url: string): Promise<string | null> {
  try {
    const res = await fetch(url)
    const blob = await res.blob()
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

export async function generatePdf(
  properties: Property[],
  imageMap: Record<string, string> // nombre_kibah -> url
): Promise<Blob> {
  // Pre-load images
  const pdfProperties: PdfProperty[] = await Promise.all(
    properties.map(async (property) => {
      const nombre = property.nombre_kibah ?? ''
      const imageUrl = imageMap[nombre] ?? null
      let imageData: string | null = null
      if (imageUrl) {
        imageData = await loadImageAsBase64(imageUrl)
      }
      return { property, imageUrl, imageData }
    })
  )

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageWidth = 210
  const pageHeight = 297
  const margin = 20

  // ===== COVER PAGE =====
  doc.setFillColor(NAVY)
  doc.rect(0, 0, pageWidth, pageHeight, 'F')

  // Logo text (K in orange circle)
  doc.setFillColor(ORANGE)
  doc.circle(pageWidth / 2, 100, 15, 'F')
  doc.setTextColor(WHITE)
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.text('K', pageWidth / 2, 106, { align: 'center' })

  // Title
  doc.setFontSize(28)
  doc.setTextColor(WHITE)
  doc.text('Kibah', pageWidth / 2, 135, { align: 'center' })

  doc.setFontSize(16)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(ORANGE)
  doc.text('Selección de Propiedades', pageWidth / 2, 148, { align: 'center' })

  doc.setFontSize(11)
  doc.setTextColor(WHITE)
  const dateStr = new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })
  doc.text(dateStr, pageWidth / 2, 162, { align: 'center' })

  doc.setFontSize(10)
  doc.setTextColor(GRAY)
  doc.text(`${properties.length} propiedad${properties.length !== 1 ? 'es' : ''}`, pageWidth / 2, 172, { align: 'center' })

  // ===== PROPERTY PAGES =====
  for (const { property, imageData } of pdfProperties) {
    doc.addPage()
    let y = margin

    // Image
    if (imageData) {
      try {
        const imgW = pageWidth - margin * 2
        const imgH = 70
        doc.addImage(imageData, 'JPEG', margin, y, imgW, imgH)
        y += imgH + 8
      } catch {
        y += 5
      }
    }

    // Name
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(NAVY)
    const name = property.nombre_kibah || property.nombre_desarrollador || '—'
    doc.text(name, margin, y)
    y += 7

    // Unit
    if (property.unidad) {
      doc.setFontSize(11)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(GRAY)
      doc.text(property.unidad, margin, y)
      y += 6
    }

    // Price
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(ORANGE)
    doc.text(formatPrice(property.precio_unidad), margin, y + 2)
    y += 12

    // Separator
    doc.setDrawColor(LIGHT_GRAY)
    doc.setLineWidth(0.5)
    doc.line(margin, y, pageWidth - margin, y)
    y += 8

    // Specs grid
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')

    const specs = [
      ['Colonia', dv(property.colonia)],
      ['Alcaldía', dv(property.alcaldia)],
      ['M² Totales', property.m2_totales ? `${property.m2_totales} m²` : '—'],
      ['M² Habitables', property.m2_habitables ? `${property.m2_habitables} m²` : '—'],
      ['Recámaras', dv(property.num_recamaras)],
      ['Baños', dv(property.num_banos)],
      ['Estacionamiento', dv(property.estacionamiento)],
      ['Disponibilidad', dv(property.disponibilidad)],
      ['Tipo Preventa', dv(property.tipo_preventa)],
      ['Tipo Entrega', dv(property.tipo_entrega)],
      ['Fecha Entrega', dv(property.fecha_entrega)],
    ]

    const colWidth = (pageWidth - margin * 2) / 2
    for (let i = 0; i < specs.length; i += 2) {
      // Left
      doc.setTextColor(GRAY)
      doc.setFont('helvetica', 'normal')
      doc.text(specs[i][0], margin, y)
      doc.setTextColor(NAVY)
      doc.setFont('helvetica', 'bold')
      doc.text(specs[i][1], margin, y + 5)

      // Right
      if (i + 1 < specs.length) {
        doc.setTextColor(GRAY)
        doc.setFont('helvetica', 'normal')
        doc.text(specs[i + 1][0], margin + colWidth, y)
        doc.setTextColor(NAVY)
        doc.setFont('helvetica', 'bold')
        doc.text(specs[i + 1][1], margin + colWidth, y + 5)
      }

      y += 14
    }

    // Footer
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(GRAY)
    doc.text('kibah.com.mx', pageWidth / 2, pageHeight - 10, { align: 'center' })
    doc.text(
      `${doc.getNumberOfPages() - 1}`,
      pageWidth - margin,
      pageHeight - 10,
      { align: 'right' }
    )
  }

  return doc.output('blob')
}
