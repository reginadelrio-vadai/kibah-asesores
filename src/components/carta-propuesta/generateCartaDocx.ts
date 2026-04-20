import {
  Document, Packer, Paragraph, TextRun, AlignmentType,
  ImageRun, BorderStyle, TabStopType, TabStopPosition,
} from 'docx'
import type { CartaPropuestaData } from './generateCartaPdf'

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

async function fetchImageBuffer(url: string): Promise<Uint8Array | null> {
  try {
    const r = await fetch(url)
    const buf = await r.arrayBuffer()
    return new Uint8Array(buf)
  } catch {
    return null
  }
}

export async function generateCartaDocx(data: CartaPropuestaData): Promise<Blob> {
  const logoBuffer = await fetchImageBuffer('/images/kibah-logo-dark.png')

  const valorStr = fmtMoney(data.valor_departamento)
  const apartadoStr = fmtMoney(data.cantidad_apartado)
  const engancheStr = fmtMoney(data.enganche)
  const mensualidadStr = fmtMoney(data.monto_mensualidades)
  const escrituraStr = fmtMoney(data.pago_escritura)

  const headerChildren: Paragraph[] = []

  // Logo + date row
  if (logoBuffer) {
    headerChildren.push(
      new Paragraph({
        children: [
          new ImageRun({ data: logoBuffer, transformation: { width: 150, height: 50 }, type: 'png' }),
        ],
      })
    )
  }
  headerChildren.push(
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: { after: 200 },
      children: [new TextRun({ text: `Ciudad de México, ${fullDate()}`, size: 20 })],
    })
  )

  // Title
  headerChildren.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 300 },
      children: [new TextRun({ text: 'PROPUESTA DE COMPRA', bold: true, size: 32, color: '1B2A4A' })],
    })
  )

  const bodyParagraphs: Paragraph[] = [
    new Paragraph({ children: [new TextRun({ text: 'PRESENTE', size: 22 })], spacing: { after: 200 } }),

    new Paragraph({
      spacing: { after: 100 },
      children: [
        new TextRun({ text: 'Asesor Comercial: ', bold: true, size: 22 }),
        new TextRun({ text: data.nombre_asesor, size: 22 }),
      ],
    }),

    new Paragraph({
      spacing: { after: 200 },
      children: [
        new TextRun({ text: 'Director de ventas: ', bold: true, size: 22 }),
        new TextRun({ text: data.director_ventas, size: 22 }),
      ],
    }),

    new Paragraph({
      spacing: { after: 100 },
      children: [
        new TextRun({
          text: `Por su conducto como mediador en la operación de la propiedad ubicada en la calle: ${data.direccion}, colonia ${data.colonia}. Hacemos de su conocimiento nuestro interés en la compraventa del departamento ${data.unidad}.`,
          size: 22,
        }),
      ],
    }),

    new Paragraph({
      spacing: { after: 200 },
      children: [new TextRun({ text: 'Los compradores ofrecen a su legítimo Propietario:', size: 22 })],
    }),

    new Paragraph({
      spacing: { after: 200 },
      children: [new TextRun({ text: `Valor del departamento ${valorStr} MXN`, bold: true, size: 22, color: '1B2A4A' })],
    }),

    // Bullets
    ...([
      `La cantidad total de ${valorStr} MXN totales, de los cuales:`,
      `Se compromete a dar un apartado por la cantidad de ${apartadoStr} MXN como garantía de concretar la operación cuanto antes.`,
      `Se dará un enganche a la firma de contrato compraventa por la cantidad de ${engancheStr} MXN (${data.pct_enganche}%) con recursos propios, tomando en cuenta el apartado.`,
      `Se dividirá el pago del ${data.pct_pago}% en ${data.mensualidades} mensualidades de ${mensualidadStr} MXN y ${escrituraStr} MXN a la firma de escrituras.`,
    ].map((text) =>
      new Paragraph({
        bullet: { level: 0 },
        spacing: { after: 80 },
        children: [new TextRun({ text, size: 22 })],
      })
    )),

    // Documentos section
    new Paragraph({
      spacing: { before: 300, after: 100 },
      children: [new TextRun({ text: 'Documentos', bold: true, size: 24, color: '1B2A4A' })],
    }),

    new Paragraph({
      spacing: { after: 100 },
      children: [
        new TextRun({ text: 'Esta oferta de compra está sujeta a reserva de la revisión de los documentos correspondientes. En caso de no existir impedimento legal alguno, se realizará la celebración de un contrato privado de compraventa el cual describirá los términos y condiciones de la operación para posterior protocolización en escritura pública ante notario público. El departamento apartado será respetado por un periodo de ', size: 20 }),
        new TextRun({ text: '7 días hábiles', bold: true, size: 20 }),
        new TextRun({ text: ' a partir de la fecha de este recibo, con el fin de llevar a cabo la firma del contrato correspondiente. En caso de que no se realice dicha firma dentro del plazo establecido, el monto entregado será ', size: 20 }),
        new TextRun({ text: 'devuelto al cliente dentro de los siguientes 15 días hábiles', bold: true, size: 20 }),
        new TextRun({ text: ', contados a partir del vencimiento del periodo de apartado.', size: 20 }),
      ],
    }),

    // Signature section
    new Paragraph({ spacing: { before: 600 } }),

    // Signature lines using tab stops
    new Paragraph({
      spacing: { after: 0 },
      tabStops: [
        { type: TabStopType.CENTER, position: TabStopPosition.MAX / 4 },
        { type: TabStopType.CENTER, position: (TabStopPosition.MAX * 3) / 4 },
      ],
      children: [
        new TextRun({ text: '\t___________________________\t___________________________', size: 20 }),
      ],
    }),

    new Paragraph({
      spacing: { after: 80 },
      tabStops: [
        { type: TabStopType.CENTER, position: TabStopPosition.MAX / 4 },
        { type: TabStopType.CENTER, position: (TabStopPosition.MAX * 3) / 4 },
      ],
      children: [
        new TextRun({ text: '\tNombre y firma del comprador\tNombre y firma del desarrollador', size: 18 }),
      ],
    }),

    new Paragraph({
      tabStops: [
        { type: TabStopType.CENTER, position: TabStopPosition.MAX / 4 },
        { type: TabStopType.CENTER, position: (TabStopPosition.MAX * 3) / 4 },
      ],
      children: [
        new TextRun({ text: `\t${data.nombre_cliente}\t${data.nombre_desarrollador}`, bold: true, size: 20, color: '1B2A4A' }),
      ],
    }),
  ]

  const doc = new Document({
    sections: [{
      properties: {
        page: { margin: { top: 720, bottom: 720, left: 900, right: 900 } },
      },
      children: [...headerChildren, ...bodyParagraphs],
    }],
  })

  return Packer.toBlob(doc)
}
