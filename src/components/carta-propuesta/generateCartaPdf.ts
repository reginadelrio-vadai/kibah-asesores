import { jsPDF } from 'jspdf'

export interface CartaPropuestaData {
  nombre_asesor: string
  director_ventas: string
  nombre_cliente: string
  nombre_desarrollador: string
  direccion: string
  colonia: string
  unidad: string
  valor_departamento: number
  cantidad_apartado: number
  enganche: number
  pct_enganche: number
  pct_pago: number
  mensualidades: number
  monto_mensualidades: number
  pago_escritura: number
}

const NAVY = '#1B2A4A'
const BODY = '#374151'

function fmtMoney(n: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  }).format(n)
}

function fullDate(): string {
  const m = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
  const d = new Date()
  return `${d.getDate()} de ${m[d.getMonth()]} de ${d.getFullYear()}`
}

async function loadImageAsBase64(url: string): Promise<string | null> {
  try {
    const r = await fetch(url)
    const b = await r.blob()
    return new Promise((res) => {
      const rd = new FileReader()
      rd.onloadend = () => res(rd.result as string)
      rd.onerror = () => res(null)
      rd.readAsDataURL(b)
    })
  } catch {
    return null
  }
}

function imgDims(b64: string): Promise<{ w: number; h: number }> {
  return new Promise((res) => {
    const i = new Image()
    i.onload = () => res({ w: i.naturalWidth, h: i.naturalHeight })
    i.onerror = () => res({ w: 1, h: 1 })
    i.src = b64
  })
}

/**
 * Generate the Carta Propuesta PDF.
 * Returns a Blob suitable for download or preview.
 */
export async function generateCartaPdf(data: CartaPropuestaData): Promise<Blob> {
  const doc = new jsPDF('portrait', 'mm', 'letter')
  const pw = doc.internal.pageSize.getWidth()
  const margin = 18
  const contentW = pw - margin * 2

  // ---------- Header: logo + date ----------
  const logoB64 = await loadImageAsBase64('/images/kibah-logo-dark.png')
  let y = margin
  if (logoB64) {
    const { w, h } = await imgDims(logoB64)
    const logoH = 14
    const logoW = (w / h) * logoH
    doc.addImage(logoB64, 'PNG', margin, y, logoW, logoH)
  }

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(BODY)
  doc.text(`Ciudad de México, ${fullDate()}`, pw - margin, y + 9, { align: 'right' })

  y += 22

  // ---------- Title ----------
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(NAVY)
  doc.text('PROPUESTA DE COMPRA', pw / 2, y, { align: 'center' })

  y += 10

  // ---------- Body ----------
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.setTextColor(BODY)

  const writeJustified = (text: string, yStart: number, lineHeight = 5.2): number => {
    const lines = doc.splitTextToSize(text, contentW) as string[]
    let cy = yStart
    for (const line of lines) {
      doc.text(line, margin, cy)
      cy += lineHeight
    }
    return cy
  }

  doc.text('PRESENTE', margin, y)
  y += 7

  doc.setFont('helvetica', 'bold')
  const asesorLabel = 'Asesor Comercial: '
  doc.text(asesorLabel, margin, y)
  doc.setFont('helvetica', 'normal')
  doc.text(data.nombre_asesor, margin + doc.getTextWidth(asesorLabel), y)
  y += 6

  doc.setFont('helvetica', 'bold')
  const directorLabel = 'Director de ventas: '
  doc.text(directorLabel, margin, y)
  doc.setFont('helvetica', 'normal')
  doc.text(data.director_ventas, margin + doc.getTextWidth(directorLabel), y)
  y += 8

  const valorStr = fmtMoney(data.valor_departamento)
  const apartadoStr = fmtMoney(data.cantidad_apartado)
  const engancheStr = fmtMoney(data.enganche)
  const mensualidadStr = fmtMoney(data.monto_mensualidades)
  const escrituraStr = fmtMoney(data.pago_escritura)

  // Intro paragraph
  const intro =
    `Por su conducto como mediador en la operación de la propiedad ubicada en la calle: ${data.direccion}, ` +
    `colonia ${data.colonia}. Hacemos de su conocimiento nuestro interés en la compraventa del departamento ${data.unidad}.`
  y = writeJustified(intro, y)
  y += 3

  doc.text('Los compradores ofrecen a su legítimo Propietario:', margin, y)
  y += 8

  // Highlighted value (bold)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(NAVY)
  doc.text(`Valor del departamento ${valorStr} MXN`, margin, y)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(BODY)
  y += 8

  // Bullets
  const bullets: string[] = [
    `La cantidad total de ${valorStr} MXN totales, de los cuales:`,
    `Se compromete a dar un apartado por la cantidad de ${apartadoStr} MXN como garantía de concretar la operación cuanto antes.`,
    `Se dará un enganche a la firma de contrato compraventa por la cantidad de ${engancheStr} MXN (${data.pct_enganche}%) con recursos propios, tomando en cuenta el apartado.`,
    `Se dividirá el pago del ${data.pct_pago}% en ${data.mensualidades} mensualidades de ${mensualidadStr} MXN y ${escrituraStr} MXN a la firma de escrituras.`,
  ]

  for (const b of bullets) {
    const bulletIndent = 5
    const textIndent = margin + bulletIndent
    const textWidth = contentW - bulletIndent
    doc.text('•', margin, y)
    const lines = doc.splitTextToSize(b, textWidth) as string[]
    for (let i = 0; i < lines.length; i++) {
      doc.text(lines[i], textIndent, y + i * 5.2)
    }
    y += lines.length * 5.2 + 2.5
  }

  y += 3

  // ---------- Documentos section ----------
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(NAVY)
  doc.text('Documentos', margin, y)
  y += 6

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(BODY)

  // Build the paragraph manually so "7 días hábiles" and "15 días hábiles" can be bold.
  // Strategy: split the paragraph into segments and render word-wrap manually.
  type Seg = { text: string; bold: boolean }
  const segments: Seg[] = [
    { text: 'Esta oferta de compra está sujeta a reserva de la revisión de los documentos correspondientes. En caso de no existir impedimento legal alguno, se realizará la celebración de un contrato privado de compraventa el cual describirá los términos y condiciones de la operación para posterior protocolización en escritura pública ante notario público. El departamento apartado será respetado por un periodo de ', bold: false },
    { text: '7 días hábiles', bold: true },
    { text: ' a partir de la fecha de este recibo, con el fin de llevar a cabo la firma del contrato correspondiente. En caso de que no se realice dicha firma dentro del plazo establecido, el monto entregado será ', bold: false },
    { text: 'devuelto al cliente dentro de los siguientes 15 días hábiles', bold: true },
    { text: ', contados a partir del vencimiento del periodo de apartado.', bold: false },
  ]

  // Tokenize into words with bold flag, then word-wrap.
  type Tok = { text: string; bold: boolean }
  const tokens: Tok[] = []
  for (const s of segments) {
    const words = s.text.split(/(\s+)/).filter((w) => w.length > 0)
    for (const w of words) tokens.push({ text: w, bold: s.bold })
  }

  const lineHeight = 4.8
  let lineTokens: Tok[] = []
  const flushLine = () => {
    let cx = margin
    for (const tok of lineTokens) {
      doc.setFont('helvetica', tok.bold ? 'bold' : 'normal')
      doc.text(tok.text, cx, y)
      cx += doc.getTextWidth(tok.text)
    }
    y += lineHeight
    lineTokens = []
  }

  const widthOfLine = (toks: Tok[]): number => {
    let w = 0
    for (const tok of toks) {
      doc.setFont('helvetica', tok.bold ? 'bold' : 'normal')
      w += doc.getTextWidth(tok.text)
    }
    return w
  }

  for (const tok of tokens) {
    const trial = [...lineTokens, tok]
    if (widthOfLine(trial) > contentW && lineTokens.length > 0) {
      // Remove trailing whitespace tokens from the flushed line
      while (lineTokens.length && /^\s+$/.test(lineTokens[lineTokens.length - 1].text)) {
        lineTokens.pop()
      }
      flushLine()
      // Skip leading whitespace on new line
      if (!/^\s+$/.test(tok.text)) {
        lineTokens.push(tok)
      }
    } else {
      lineTokens.push(tok)
    }
  }
  if (lineTokens.length > 0) flushLine()

  doc.setFont('helvetica', 'normal')

  // ---------- Signatures ----------
  y += 12
  const lineLen = 70
  const leftX = margin + 5
  const rightX = pw - margin - 5 - lineLen

  // Names above signature lines (bold)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(NAVY)
  doc.text(data.nombre_cliente, leftX + lineLen / 2, y, { align: 'center' })
  doc.text(data.nombre_desarrollador, rightX + lineLen / 2, y, { align: 'center' })

  y += 8

  doc.setDrawColor(BODY)
  doc.line(leftX, y, leftX + lineLen, y)
  doc.line(rightX, y, rightX + lineLen, y)
  y += 5

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(BODY)
  doc.text('Nombre y firma del comprador', leftX + lineLen / 2, y, { align: 'center' })
  doc.text('Nombre y firma del vendedor', rightX + lineLen / 2, y, { align: 'center' })

  return doc.output('blob')
}
