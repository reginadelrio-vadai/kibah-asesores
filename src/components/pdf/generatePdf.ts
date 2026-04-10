import { jsPDF } from 'jspdf'
import type { Property } from '@/types'

// Colors
const NAVY = '#1B2A4A'
const ORANGE = '#E8872A'
const BODY = '#374151'
const LABEL = '#6B7280'
const LINE = '#E5E7EB'
const PLACEHOLDER_BG = '#F3F4F6'

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

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pw = 210
  const ph = 297
  const mx = 12
  const contentW = pw - mx * 2

  const perPage = 3
  const headerH = 15
  const footerH = 10
  const usableH = ph - headerH - footerH - 4
  const propH = usableH / perPage
  const totalPages = Math.ceil(prepared.length / perPage)

  for (let page = 0; page < totalPages; page++) {
    if (page > 0) doc.addPage()

    // ===== HEADER =====
    let hy = 8
    if (logoData) {
      try {
        // White rect behind logo to mask black background
        doc.setFillColor('#FFFFFF')
        doc.rect(mx, hy - 2, 36, 12, 'F')
        doc.addImage(logoData, 'PNG', mx, hy - 1, 35, 10)
      } catch { /* skip */ }
    }
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(LABEL)
    doc.text('kibah.com.mx', pw - mx, hy + 4, { align: 'right' })

    hy += 10
    doc.setDrawColor(ORANGE)
    doc.setLineWidth(0.5)
    doc.line(mx, hy, pw - mx, hy)

    // ===== PROPERTIES =====
    const startY = hy + 4

    for (let i = 0; i < perPage; i++) {
      const idx = page * perPage + i
      if (idx >= prepared.length) break

      const { property: p, imageData } = prepared[idx]
      const baseY = startY + i * propH

      // Separator between properties
      if (i > 0) {
        doc.setDrawColor(LINE)
        doc.setLineWidth(0.5)
        doc.line(mx, baseY - 2, pw - mx, baseY - 2)
      }

      let y = baseY

      // --- IMAGE + TEXT SIDE BY SIDE ---
      const imgW = 55
      const imgH = 40
      const textX = mx + imgW + 5
      const textW = contentW - imgW - 5

      if (imageData) {
        try {
          doc.addImage(imageData, 'JPEG', mx, y, imgW, imgH)
        } catch {
          doc.setFillColor(PLACEHOLDER_BG)
          doc.rect(mx, y, imgW, imgH, 'F')
        }
      } else {
        doc.setFillColor(PLACEHOLDER_BG)
        doc.rect(mx, y, imgW, imgH, 'F')
        doc.setFontSize(7)
        doc.setTextColor(LABEL)
        doc.text('Sin imagen', mx + imgW / 2, y + imgH / 2, { align: 'center' })
      }

      // Name
      const name = tc(p.nombre_kibah)
      if (name) {
        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(NAVY)
        const lines = doc.splitTextToSize(name, textW)
        doc.text(lines.slice(0, 2), textX, y + 5)
      }

      // Unit
      let ty = y + (name && name.length > 25 ? 13 : 10)
      if (p.unidad) {
        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(LABEL)
        doc.text(`Unidad: ${p.unidad}`, textX, ty)
        ty += 4
      }

      // Orange separator
      doc.setDrawColor(ORANGE)
      doc.setLineWidth(0.3)
      doc.line(textX, ty, textX + textW - 5, ty)
      ty += 4

      // Price
      const price = fmtPrice(p.precio_unidad)
      if (price) {
        doc.setFontSize(14)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(ORANGE)
        doc.text(price, textX, ty)
        ty += 5
      }

      // Location
      const loc = [tc(p.colonia), tc(p.alcaldia)].filter(Boolean).join(', ')
      if (loc) {
        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(BODY)
        doc.text(loc, textX, ty)
        ty += 4
      }

      // Address
      if (p.direccion) {
        doc.setFontSize(8)
        doc.setTextColor(LABEL)
        doc.text(tc(p.direccion), textX, ty)
      }

      // --- SPECS BELOW IMAGE (full width) ---
      y += imgH + 3

      doc.setFontSize(8)
      const specItems: string[] = []

      if (p.num_recamaras) specItems.push(`Rec: ${p.num_recamaras}`)
      if (p.num_banos) specItems.push(`Banos: ${p.num_banos}`)
      if (p.m2_totales) specItems.push(`M2 Total: ${p.m2_totales}`)

      const m2hab = p.m2_habitables ? parseFloat(String(p.m2_habitables)) : 0
      const m2tot = p.m2_totales ? parseFloat(String(p.m2_totales)) : 0
      if (m2hab > 0 && m2hab !== m2tot) specItems.push(`M2 Hab: ${p.m2_habitables}`)

      const m2ext = p.m2_exteriores ? parseFloat(String(p.m2_exteriores)) : 0
      if (m2ext > 0) specItems.push(`M2 Ext: ${p.m2_exteriores}`)

      const m2roof = p.m2_roof_garden ? parseFloat(String(p.m2_roof_garden)) : 0
      if (m2roof > 0) specItems.push(`M2 Roof: ${p.m2_roof_garden}`)

      const est = p.estacionamiento ? parseFloat(String(p.estacionamiento)) : 0
      if (est > 0) specItems.push(`Est: ${p.estacionamiento}`)

      if (p.bodega && p.bodega.trim()) specItems.push(`Bodega: ${p.bodega}`)

      if (specItems.length > 0) {
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(BODY)
        doc.text(specItems.join('    '), mx, y)
        y += 4
      }

      // Status line
      const statuses: string[] = []
      if (p.disponibilidad) statuses.push(tc(p.disponibilidad))
      if (p.tipo_preventa) statuses.push(tc(p.tipo_preventa))
      if (p.tipo_entrega) statuses.push(tc(p.tipo_entrega))
      if (p.fecha_entrega) statuses.push(`Entrega: ${p.fecha_entrega}`)

      if (statuses.length > 0) {
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(LABEL)
        doc.text(statuses.join('  •  '), mx, y)
      }
    }

    // ===== FOOTER =====
    doc.setDrawColor(LINE)
    doc.setLineWidth(0.2)
    doc.line(mx, ph - footerH, pw - mx, ph - footerH)

    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(LABEL)
    doc.text('kibah.com.mx', pw / 2, ph - 6, { align: 'center' })
    doc.text(`${page + 1} / ${totalPages}`, pw - mx, ph - 6, { align: 'right' })
  }

  return doc.output('blob')
}
