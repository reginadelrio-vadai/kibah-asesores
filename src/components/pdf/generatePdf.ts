import { jsPDF } from 'jspdf'
import type { Property } from '@/types'

const NAVY = '#1B2A4A'
const ORANGE = '#E8872A'
const ORANGE_LIGHT = '#FFF7ED'
const BODY = '#374151'
const LABEL = '#6B7280'
const LINE = '#E5E7EB'
const PLACEHOLDER_BG = '#F3F4F6'
const WHITE = '#FFFFFF'

function tc(str: string | null | undefined): string {
  if (!str) return ''
  return str.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

function fmtPrice(value: string | number | null | undefined): string {
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

function getImageDimensions(base64: string): Promise<{ w: number; h: number }> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight })
    img.onerror = () => resolve({ w: 1, h: 1 })
    img.src = base64
  })
}

function getFullDate(): string {
  const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
  const now = new Date()
  return `${now.getDate()} de ${months[now.getMonth()]} de ${now.getFullYear()}`
}

interface PreparedProperty {
  property: Property
  imageData: string | null
}

export async function generatePdf(
  properties: Property[],
  imageMap: Record<string, string>
): Promise<Blob> {
  const prepared: PreparedProperty[] = await Promise.all(
    properties.map(async (property) => {
      const url = imageMap[property.nombre_kibah ?? ''] ?? null
      const imageData = url ? await loadImageAsBase64(url) : null
      return { property, imageData }
    })
  )

  const logoData = await loadImageAsBase64('/images/kibah-logo-dark.png')
  let logoW = 45
  let logoH = 15
  if (logoData) {
    const dims = await getImageDimensions(logoData)
    const ratio = dims.h / dims.w
    logoH = logoW * ratio
  }

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pw = 210
  const ph = 297
  const mx = 15
  const contentW = pw - mx * 2

  const perPage = 2
  const totalPages = Math.ceil(prepared.length / perPage)

  for (let page = 0; page < totalPages; page++) {
    if (page > 0) doc.addPage()

    // ===== PAGE DECORATIONS =====
    doc.setFillColor(NAVY)
    doc.rect(0, 0, pw, 2, 'F')

    doc.setFillColor(ORANGE)
    doc.rect(0, 0, 3, ph, 'F')

    // ===== HEADER =====
    const headerY = 6
    if (logoData) {
      doc.setFillColor(WHITE)
      doc.rect(mx, headerY - 1, logoW + 2, logoH + 2, 'F')
      try {
        doc.addImage(logoData, 'PNG', mx + 1, headerY, logoW, logoH)
      } catch { /* skip */ }
    }

    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(LABEL)
    doc.text('kibah.com.mx', pw - mx, headerY + 4, { align: 'right' })

    // Title + date inside header (first page only)
    let headerLineY: number
    if (page === 0) {
      const titleY = headerY + Math.max(logoH, 8) + 6
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(NAVY)
      doc.text('Propiedades de Inter\u00E9s', pw / 2, titleY, { align: 'center' })

      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(LABEL)
      doc.text(getFullDate(), pw / 2, titleY + 6, { align: 'center' })

      headerLineY = titleY + 10
    } else {
      headerLineY = headerY + Math.max(logoH, 8) + 3
    }

    doc.setDrawColor(ORANGE)
    doc.setLineWidth(0.5)
    doc.line(mx, headerLineY, pw - mx, headerLineY)

    // ===== PROPERTIES =====
    const startY = headerLineY + 5
    const footerY = ph - 14
    const usableH = footerY - startY
    const propH = usableH / perPage

    for (let i = 0; i < perPage; i++) {
      const idx = page * perPage + i
      if (idx >= prepared.length) break

      const { property: p, imageData } = prepared[idx]
      const baseY = startY + i * propH
      let y = baseY

      // --- IMAGE + TEXT SIDE BY SIDE ---
      const imgW = 65
      const imgH = 45
      const textX = mx + imgW + 6
      const textW = contentW - imgW - 6

      if (imageData) {
        try {
          doc.addImage(imageData, 'JPEG', mx, y, imgW, imgH)
        } catch {
          doc.setFillColor(PLACEHOLDER_BG)
          doc.setDrawColor(LINE)
          doc.setLineWidth(0.5)
          doc.rect(mx, y, imgW, imgH, 'FD')
        }
      } else {
        doc.setFillColor(PLACEHOLDER_BG)
        doc.setDrawColor(LINE)
        doc.setLineWidth(0.5)
        doc.rect(mx, y, imgW, imgH, 'FD')
        doc.setFontSize(8)
        doc.setTextColor(LABEL)
        doc.text('Sin imagen', mx + imgW / 2, y + imgH / 2, { align: 'center' })
      }

      // Name
      let ty = y + 6
      const name = tc(p.nombre_kibah)
      if (name) {
        doc.setFontSize(14)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(NAVY)
        const lines = doc.splitTextToSize(name, textW)
        doc.text(lines.slice(0, 2), textX, ty)
        ty += lines.length > 1 ? 11 : 7
      }

      // Orange line under name
      doc.setDrawColor(ORANGE)
      doc.setLineWidth(1)
      doc.line(textX, ty, textX + Math.min(textW, 60), ty)
      ty += 5

      // Unit
      if (p.unidad) {
        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(LABEL)
        doc.text(`Unidad: ${p.unidad}`, textX, ty)
        ty += 6
      }

      // Price
      const price = fmtPrice(p.precio_unidad)
      if (price) {
        doc.setFontSize(16)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(ORANGE)
        doc.text(price, textX, ty)
        ty += 7
      }

      // Location
      const loc = [tc(p.colonia), tc(p.alcaldia)].filter(Boolean).join(', ')
      if (loc) {
        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(BODY)
        doc.text(loc, textX, ty)
      }

      // --- SPEC CARDS (below image, full width) ---
      y += imgH + 5

      interface SpecCard { value: string; label: string }
      const cards: SpecCard[] = []

      if (p.num_recamaras) cards.push({ value: String(p.num_recamaras), label: 'Rec.' })
      if (p.num_banos) cards.push({ value: String(p.num_banos), label: 'Ba\u00F1os' })
      if (p.m2_totales) cards.push({ value: `${p.m2_totales} m\u00B2`, label: 'M\u00B2 Total' })

      const m2hab = p.m2_habitables ? parseFloat(String(p.m2_habitables)) : 0
      const m2tot = p.m2_totales ? parseFloat(String(p.m2_totales)) : 0
      if (m2hab > 0 && m2hab !== m2tot) cards.push({ value: `${p.m2_habitables} m\u00B2`, label: 'M\u00B2 Hab.' })

      const est = p.estacionamiento ? parseFloat(String(p.estacionamiento)) : 0
      if (est > 0) cards.push({ value: String(p.estacionamiento), label: 'Est.' })

      if (cards.length > 0) {
        const maxCards = Math.min(cards.length, 5)
        const gap = 2
        const cardW = (contentW - gap * (maxCards - 1)) / maxCards
        const cardH = 15

        for (let c = 0; c < maxCards; c++) {
          const cx = mx + c * (cardW + gap)

          // Card background
          doc.setFillColor(ORANGE_LIGHT)
          doc.rect(cx, y, cardW, cardH, 'F')

          // Orange bullet square (left of label at bottom)
          doc.setFillColor(232, 135, 42)
          doc.rect(cx + 3, y + 10.5, 1.5, 1.5, 'F')

          // Value
          doc.setFontSize(11)
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(NAVY)
          doc.text(cards[c].value, cx + cardW / 2, y + 7, { align: 'center' })

          // Label (after orange bullet)
          doc.setFontSize(7)
          doc.setFont('helvetica', 'normal')
          doc.setTextColor(LABEL)
          doc.text(cards[c].label, cx + 6, y + 12)
        }

        y += cardH + 4
      }

      // --- STATUS BAR ---
      const statuses: string[] = []
      if (p.disponibilidad) statuses.push(tc(p.disponibilidad))
      if (p.tipo_preventa) statuses.push(tc(p.tipo_preventa))
      if (p.tipo_entrega) statuses.push(tc(p.tipo_entrega))
      if (p.fecha_entrega) statuses.push(`Entrega: ${p.fecha_entrega}`)
      if (p.bodega && p.bodega.trim()) statuses.push(`Bodega: ${tc(p.bodega)}`)

      if (statuses.length > 0) {
        const barH = 8
        doc.setFillColor(NAVY)
        doc.rect(mx, y, contentW, barH, 'F')

        doc.setFontSize(8)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(WHITE)
        doc.text(statuses.join('   \u2022   '), mx + contentW / 2, y + 5.5, { align: 'center' })
      }
    }

    // ===== FOOTER =====
    doc.setDrawColor(ORANGE)
    doc.setLineWidth(0.5)
    doc.line(mx, footerY, pw - mx, footerY)

    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(NAVY)
    doc.text('kibah.com.mx', pw / 2, footerY + 5, { align: 'center' })

    doc.setTextColor(LABEL)
    doc.text(`Pagina ${page + 1} de ${totalPages}`, pw - mx, footerY + 5, { align: 'right' })
  }

  return doc.output('blob')
}
