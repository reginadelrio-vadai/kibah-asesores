import { jsPDF } from 'jspdf'
import type { Property } from '@/types'

const NAVY = '#1B2A4A'
const ORANGE = '#E8872A'
const GRAY = '#64748B'
const LINE_GRAY = '#E2E8F0'

function toTitleCase(str: string | null | undefined): string {
  if (!str) return ''
  return str.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

function formatPrice(value: string | number | null | undefined): string {
  if (!value) return ''
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num) || num === 0) return ''
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(num) + ' MXN'
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

interface PreparedProperty {
  property: Property
  imageData: string | null
}

export async function generatePdf(
  properties: Property[],
  imageMap: Record<string, string>
): Promise<Blob> {
  // Pre-load all images
  const prepared: PreparedProperty[] = await Promise.all(
    properties.map(async (property) => {
      const url = imageMap[property.nombre_kibah ?? ''] ?? null
      const imageData = url ? await loadImageAsBase64(url) : null
      return { property, imageData }
    })
  )

  // Load logo
  const logoData = await loadImageAsBase64('/images/kibah-logo.png')

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pw = 210
  const ph = 297
  const mx = 15
  const contentW = pw - mx * 2

  const propertiesPerPage = 2
  const totalPages = Math.ceil(prepared.length / propertiesPerPage)

  for (let page = 0; page < totalPages; page++) {
    if (page > 0) doc.addPage()

    // ===== HEADER =====
    let headerY = 12
    if (logoData) {
      try {
        doc.addImage(logoData, 'PNG', mx, headerY - 4, 30, 10)
      } catch { /* skip logo */ }
    }
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(GRAY)
    doc.text('kibah.com.mx', pw - mx, headerY + 2, { align: 'right' })

    // Orange header line
    headerY += 10
    doc.setDrawColor(ORANGE)
    doc.setLineWidth(0.5)
    doc.line(mx, headerY, pw - mx, headerY)

    // ===== PROPERTIES =====
    const startY = headerY + 6
    const propHeight = (ph - startY - 15) / 2 // half page minus footer

    for (let i = 0; i < propertiesPerPage; i++) {
      const idx = page * propertiesPerPage + i
      if (idx >= prepared.length) break

      const { property, imageData } = prepared[idx]
      const baseY = startY + i * propHeight

      // Separator between properties
      if (i > 0) {
        doc.setDrawColor(LINE_GRAY)
        doc.setLineWidth(0.3)
        doc.line(mx, baseY - 3, pw - mx, baseY - 3)
      }

      let y = baseY

      // Image + Info side by side
      const imgW = 48
      const imgH = 32
      const textX = mx + imgW + 6

      if (imageData) {
        try {
          doc.addImage(imageData, 'JPEG', mx, y, imgW, imgH)
        } catch { /* skip */ }
      } else {
        doc.setFillColor('#F3F4F6')
        doc.rect(mx, y, imgW, imgH, 'F')
      }

      // Name
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(NAVY)
      const name = toTitleCase(property.nombre_kibah || property.nombre_desarrollador)
      if (name) {
        const lines = doc.splitTextToSize(name, contentW - imgW - 6)
        doc.text(lines.slice(0, 2), textX, y + 5)
      }

      // Unit
      if (property.unidad) {
        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(GRAY)
        doc.text(`Unidad: ${property.unidad}`, textX, y + 13)
      }

      // Price
      const price = formatPrice(property.precio_unidad)
      if (price) {
        doc.setFontSize(13)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(ORANGE)
        doc.text(price, textX, y + 21)
      }

      // Location
      const location = [toTitleCase(property.colonia), toTitleCase(property.alcaldia)].filter(Boolean).join(', ')
      if (location) {
        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(GRAY)
        doc.text(location, textX, y + 27)
      }

      // Specs line below image
      y += imgH + 5

      doc.setDrawColor(LINE_GRAY)
      doc.setLineWidth(0.2)
      doc.line(mx, y - 1, pw - mx, y - 1)

      y += 3
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(NAVY)

      const specs: string[] = []
      if (property.num_recamaras) specs.push(`Rec: ${property.num_recamaras}`)
      if (property.num_banos) specs.push(`Banos: ${property.num_banos}`)
      if (property.m2_totales) specs.push(`M2: ${property.m2_totales}`)
      if (property.estacionamiento) specs.push(`Est: ${property.estacionamiento}`)

      if (specs.length > 0) {
        doc.text(specs.join('   |   '), mx, y)
        y += 5
      }

      // Status line
      const statuses: string[] = []
      if (property.disponibilidad) statuses.push(toTitleCase(property.disponibilidad))
      if (property.tipo_preventa) statuses.push(toTitleCase(property.tipo_preventa))
      if (property.tipo_entrega) statuses.push(toTitleCase(property.tipo_entrega))
      if (property.fecha_entrega) statuses.push(`Entrega: ${property.fecha_entrega}`)

      if (statuses.length > 0) {
        doc.setFontSize(8)
        doc.setTextColor(GRAY)
        doc.text(statuses.join('  •  '), mx, y)
      }
    }

    // ===== FOOTER =====
    doc.setDrawColor(LINE_GRAY)
    doc.setLineWidth(0.2)
    doc.line(mx, ph - 12, pw - mx, ph - 12)

    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(GRAY)
    doc.text('kibah.com.mx', pw / 2, ph - 8, { align: 'center' })
    doc.text(`${page + 1} / ${totalPages}`, pw - mx, ph - 8, { align: 'right' })
  }

  return doc.output('blob')
}
