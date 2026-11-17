import Anthropic from '@anthropic-ai/sdk'
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod'
import { lecturaPdfSchema } from '@/lib/validations/unidades-pdf'
import { UNIDADES_PDF_MODEL } from '@/lib/utils/constants'
import type { LecturaPdf } from '@/types/unidades-pdf'

/** Error con mensaje apto para mostrarse al usuario. */
export class LecturaPdfError extends Error {
  constructor(message: string, public status: number = 500) {
    super(message)
  }
}

const SYSTEM_PROMPT = `Lees listas de precios de desarrollos inmobiliarios en México y transcribes su tabla de unidades a JSON.

El PDF suele tener el nombre del desarrollo o torre arriba (ej. "SEVILLA 1") y una tabla con una fila por unidad. Columnas habituales (los nombres pueden variar un poco):
- Departamento / Depto / Unidad → unidad (texto tal cual: "101", "PH-2", "A-302")
- Nivel / Piso → nivel (texto)
- Orient / Orientación → orientacion (texto tal cual: "Norte", "NE", "Interior"...)
- Rec / Recámaras → recamaras
- Baños → banos (2.5 = dos baños y medio)
- Int m2 / Interior → m2_interior
- Balcón m2 → m2_balcon
- Patio m2 / Jardín → m2_patio
- Total m2 → m2_total
- Bodega → bodega: copia EXACTAMENTE el texto de la celda de esa fila en la columna Bodega ("Sí", "No", "1", "0", "B-12", "3.5", "✓", "-"). No lo interpretes ni lo conviertas, y no tomes el valor de otra columna. Si la celda está vacía, null.
- bodega_m2: el tamaño de la bodega en m² de esa fila, si el PDF lo trae (en la celda de Bodega o en una columna "Bodega m2"). Número sin unidades; si no hay tamaño, null.
- Precio de lista / Precio / Precio total / Lista → precios["lista"]. Si la tabla tiene una sola columna de precio (sin esquemas de enganche), va aquí.
- Eng 10% / Eng 25% / Eng 50% / Eng 75% (o "Enganche 10%", "10% eng."...) → precios["10"], precios["25"], precios["50"], precios["75"]: el precio total de la unidad con ese porcentaje de enganche.
- Las columnas de precio cambian entre PDFs: llena solo las que existan y deja null las demás. No calcules precios que el PDF no trae.

Reglas:
- Transcribe TODAS las filas de unidades de todas las páginas, en el orden del PDF. No inventes filas ni valores.
- Números sin símbolos ni separadores: "$4,250,000" → 4250000; "85.5 m²" → 85.5.
- Si una celda está vacía, dice "-", "N/A" o no existe la columna, usa null.
- Si la unidad está marcada como vendida, apartada o disponible (texto, color o tachado), ponlo en estado ("Vendido", "Apartado", "Disponible"); si no hay marca, null.
- Ignora filas de totales, subtotales, encabezados repetidos y notas al pie.
- nota: algo raro de esa fila (celda ilegible, valor dudoso). Si no hay nada, null.
- columnas_detectadas: los encabezados de la tabla tal como aparecen.
- observaciones: dudas generales (columnas que no supiste mapear, páginas ilegibles, condiciones de pago importantes). Si todo está claro, null.`

function getClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new LecturaPdfError('Falta configurar ANTHROPIC_API_KEY en el servidor.', 503)
  }
  return new Anthropic()
}

/** Manda el PDF a Claude y devuelve la tabla de unidades ya validada. */
export async function leerUnidadesDePdf(pdf: Buffer, nombreDesarrollo: string): Promise<LecturaPdf> {
  const client = getClient()

  try {
    const stream = client.beta.messages.stream({
      model: UNIDADES_PDF_MODEL,
      max_tokens: 64000,
      // Si el clasificador de seguridad rechaza la petición, la API reintenta en otro modelo.
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: {
        effort: 'medium',
        format: betaZodOutputFormat(lecturaPdfSchema),
      },
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'document',
              source: { type: 'base64', media_type: 'application/pdf', data: pdf.toString('base64') },
            },
            { type: 'text', text: `Desarrollo en el CRM: "${nombreDesarrollo}". Transcribe la tabla de unidades de este PDF.` },
          ],
        },
      ],
    })

    const message = await stream.finalMessage()

    if (message.stop_reason === 'refusal') {
      throw new LecturaPdfError('Claude no pudo procesar este PDF. Intenta con otro archivo.', 422)
    }
    if (message.stop_reason === 'max_tokens') {
      throw new LecturaPdfError('El PDF tiene demasiadas unidades para leerlo de una vez. Divídelo en partes.', 422)
    }
    if (!message.parsed_output) {
      throw new LecturaPdfError('No se pudo interpretar la respuesta de Claude. Intenta de nuevo.', 502)
    }
    return message.parsed_output
  } catch (err) {
    if (err instanceof LecturaPdfError) throw err
    if (err instanceof Anthropic.BadRequestError) {
      throw new LecturaPdfError(`El PDF no se pudo leer: ${err.message}`, 400)
    }
    if (err instanceof Anthropic.AuthenticationError) {
      throw new LecturaPdfError('La API key de Claude no es válida.', 503)
    }
    if (err instanceof Anthropic.RateLimitError) {
      throw new LecturaPdfError('Claude está saturado en este momento. Intenta en un minuto.', 429)
    }
    if (err instanceof Anthropic.APIError) {
      throw new LecturaPdfError(`Error de Claude (${err.status ?? 'sin código'}). Intenta de nuevo.`, 502)
    }
    throw err
  }
}
