import { jsPDF } from 'jspdf'
import type { Property } from '@/types'

const NAVY = '#1B2A4A'
const ORANGE = '#E8872A'
const BODY = '#374151'
const LABEL_LIGHT = '#9CA3AF'
const LABEL = '#6B7280'
const LINE = '#E5E7EB'
const PLACEHOLDER = '#F9FAFB'
const WHITE = '#FFFFFF'

function tc(s: string | null | undefined): string {
  if (!s) return ''
  return s.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

function fmtPrice(v: string | number | null | undefined): string {
  if (!v) return ''
  const n = typeof v === 'string' ? parseFloat(v) : v
  if (isNaN(n) || n === 0) return ''
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n) + ' MXN'
}

function fullDate(): string {
  const m = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
  const d = new Date()
  return `${d.getDate()} de ${m[d.getMonth()]} de ${d.getFullYear()}`
}

export async function loadImageAsBase64(url: string): Promise<string | null> {
  try {
    const r = await fetch(url)
    const b = await r.blob()
    return new Promise(res => {
      const rd = new FileReader()
      rd.onloadend = () => res(rd.result as string)
      rd.onerror = () => res(null)
      rd.readAsDataURL(b)
    })
  } catch { return null }
}

function imgDims(b64: string): Promise<{ w: number; h: number }> {
  return new Promise(res => {
    const i = new Image()
    i.onload = () => res({ w: i.naturalWidth, h: i.naturalHeight })
    i.onerror = () => res({ w: 1, h: 1 })
    i.src = b64
  })
}

export async function generatePdf(
  properties: Property[],
  imageMap: Record<string, string>
): Promise<Blob> {
  const items = await Promise.all(
    properties.map(async (p) => {
      const url = imageMap[p.nombre_kibah ?? ''] ?? null
      const img = url ? await loadImageAsBase64(url) : null
      return { p, img }
    })
  )

  const logoB64 = await loadImageAsBase64('/images/kibah-logo-dark.png')
  let logoW = 40, logoH = 13
  if (logoB64) {
    const d = await imgDims(logoB64)
    logoH = logoW * (d.h / d.w)
  }

  const doc = new jsPDF('portrait', 'mm', 'a4')
  const pw = 210, ph = 297, mx = 18
  const cw = pw - mx * 2
  const totalPages = items.length

  for (let pg = 0; pg < totalPages; pg++) {
    if (pg > 0) doc.addPage()
    const { p, img } = items[pg]

    // === PAGE DECORATION ===
    doc.setFillColor(NAVY)
    doc.rect(0, 0, pw, 2, 'F')
    doc.setFillColor(ORANGE)
    doc.rect(0, 0, 3, ph, 'F')

    // === HEADER ===
    let hy = 7
    if (logoB64) {
      doc.setFillColor(WHITE)
      doc.rect(mx, hy - 1, logoW + 2, logoH + 2, 'F')
      try { doc.addImage(logoB64, 'PNG', mx + 1, hy, logoW, logoH) } catch {}
    }
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(LABEL_LIGHT)
    doc.text('kibah.com.mx', pw - mx, hy + 4, { align: 'right' })

    let lineY = hy + logoH + 4

    // Title on first page
    if (pg === 0) {
      const ty = lineY + 2
      doc.setFontSize(20)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(NAVY)
      doc.text('Propiedades de Inter\u00E9s', pw / 2, ty, { align: 'center' })
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(LABEL)
      doc.text(fullDate(), pw / 2, ty + 7, { align: 'center' })
      lineY = ty + 12
    }

    doc.setDrawColor(ORANGE)
    doc.setLineWidth(0.7)
    doc.line(mx, lineY, pw - mx, lineY)

    let y = lineY + 6

    // === IMAGE (full width) ===
    const imgH = 70
    if (img) {
      try {
        doc.addImage(img, 'JPEG', mx, y, cw, imgH)
      } catch {
        doc.setFillColor(PLACEHOLDER)
        doc.rect(mx, y, cw, imgH, 'F')
      }
    } else {
      doc.setFillColor(PLACEHOLDER)
      doc.rect(mx, y, cw, imgH, 'F')
      doc.setFontSize(9)
      doc.setTextColor(LABEL_LIGHT)
      doc.text('Sin imagen', mx + cw / 2, y + imgH / 2, { align: 'center' })
    }
    y += imgH + 8

    // === NAME ===
    const name = tc(p.nombre_kibah)
    if (name) {
      doc.setFontSize(18)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(NAVY)
      doc.text(name, mx, y)
      // Unit on same line right
      if (p.unidad) {
        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(LABEL)
        doc.text(`Unidad: ${p.unidad}`, pw - mx, y, { align: 'right' })
      }
      y += 6
    }

    // === PRICE ===
    const price = fmtPrice(p.precio_unidad)
    if (price) {
      y += 2
      doc.setFontSize(20)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(ORANGE)
      doc.text(price, mx, y)
      y += 6
    }

    // === LOCATION ===
    const loc = [tc(p.colonia), tc(p.alcaldia)].filter(Boolean).join(', ')
    if (loc) {
      y += 1
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(BODY)
      doc.text(loc, mx, y)
      y += 6
    }

    y += 4

    // === CHARACTERISTICS GRID ===
    interface Spec { label: string; value: string }
    const specs: Spec[] = []

    if (p.num_recamaras) specs.push({ label: 'Rec\u00E1maras', value: String(p.num_recamaras) })
    if (p.num_banos) specs.push({ label: 'Ba\u00F1os', value: String(p.num_banos) })
    if (p.m2_totales) specs.push({ label: 'M\u00B2 Totales', value: `${p.m2_totales} m\u00B2` })

    const hab = p.m2_habitables ? parseFloat(String(p.m2_habitables)) : 0
    const tot = p.m2_totales ? parseFloat(String(p.m2_totales)) : 0
    if (hab > 0 && hab !== tot) specs.push({ label: 'M\u00B2 Habitables', value: `${p.m2_habitables} m\u00B2` })

    const ext = p.m2_exteriores ? parseFloat(String(p.m2_exteriores)) : 0
    if (ext > 0) specs.push({ label: 'M\u00B2 Exteriores', value: `${p.m2_exteriores} m\u00B2` })

    const roof = p.m2_roof_garden ? parseFloat(String(p.m2_roof_garden)) : 0
    if (roof > 0) specs.push({ label: 'M\u00B2 Roof Garden', value: `${p.m2_roof_garden} m\u00B2` })

    const est = p.estacionamiento ? parseFloat(String(p.estacionamiento)) : 0
    if (est > 0) specs.push({ label: 'Estacionamiento', value: String(p.estacionamiento) })

    if (p.bodega && p.bodega.trim()) specs.push({ label: 'Bodega', value: tc(p.bodega) })

    if (specs.length > 0) {
      const colW = cw / 2
      const rowH = 12

      for (let si = 0; si < specs.length; si += 2) {
        // Left column
        doc.setFontSize(8)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(LABEL_LIGHT)
        doc.text(specs[si].label, mx, y)

        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(NAVY)
        doc.text(specs[si].value, mx, y + 5)

        // Right column
        if (si + 1 < specs.length) {
          doc.setFontSize(8)
          doc.setFont('helvetica', 'normal')
          doc.setTextColor(LABEL_LIGHT)
          doc.text(specs[si + 1].label, mx + colW, y)

          doc.setFontSize(12)
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(NAVY)
          doc.text(specs[si + 1].value, mx + colW, y + 5)
        }

        y += rowH
      }
    }

    // === SEPARATOR ===
    y += 4
    doc.setDrawColor(LINE)
    doc.setLineWidth(0.3)
    doc.line(mx, y, pw - mx, y)
    y += 6

    // === STATUS LINE ===
    const parts: string[] = []
    if (p.disponibilidad) parts.push(tc(p.disponibilidad))
    if (p.tipo_preventa) parts.push(tc(p.tipo_preventa))
    if (p.tipo_entrega) parts.push(tc(p.tipo_entrega))
    if (p.fecha_entrega) parts.push(`Entrega: ${p.fecha_entrega}`)

    if (parts.length > 0) {
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(BODY)
      doc.text(parts.join('  \u00B7  '), mx, y)
    }

    // === FOOTER ===
    const fy = ph - 15
    doc.setDrawColor(ORANGE)
    doc.setLineWidth(0.5)
    doc.line(mx, fy, pw - mx, fy)

    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(NAVY)
    doc.text('kibah.com.mx', pw / 2, fy + 5, { align: 'center' })

    doc.setTextColor(LABEL_LIGHT)
    doc.text(`P\u00E1gina ${pg + 1} de ${totalPages}`, pw - mx, fy + 5, { align: 'right' })
  }

  return doc.output('blob')
}
