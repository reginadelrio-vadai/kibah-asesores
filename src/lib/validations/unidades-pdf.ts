import { z } from 'zod'
import {
  BASE_KIBAH_LINK_DRIVE_UNIDAD,
  BASE_KIBAH_M2_BODEGA,
  BASE_KIBAH_NIVEL,
  BASE_KIBAH_ORIENTACION,
  BASE_KIBAH_PRECIO_ENG_PREFIX,
  BODEGA_OPTIONS,
  DISPONIBILIDAD_OPTIONS,
  ENGANCHE_OPTIONS,
  PRECIO_PRINCIPAL_OPTIONS,
  UNIDADES_PDF_MAX_ROWS,
} from '@/lib/utils/constants'
import type { PrecioPrincipal } from '@/types/unidades-pdf'
import { etiquetaPrecio, precioPrincipalDe } from '@/lib/utils/unidades-pdf'

// ── Lo que Claude devuelve al leer el PDF (structured output) ──────────
// Sin min/max: los structured outputs no aceptan esas restricciones; se validan después.

const num = z.number().nullable()

export const lecturaPdfSchema = z.object({
  titulo: z.string().nullable(),
  columnas_detectadas: z.array(z.string()),
  unidades: z.array(
    z.object({
      unidad: z.string(),
      nivel: z.string().nullable(),
      orientacion: z.string().nullable(),
      recamaras: num,
      banos: num,
      m2_interior: num,
      m2_balcon: num,
      m2_patio: num,
      m2_total: num,
      bodega: z.string().nullable(),
      bodega_m2: num,
      precios: z.object({ lista: num, '10': num, '25': num, '50': num, '75': num }),
      estado: z.string().nullable(),
      nota: z.string().nullable(),
    })
  ),
  observaciones: z.string().nullable(),
})

// ── Lo que el usuario confirma en la pantalla de revisión ──────────────

const optionalNum = z.number().nonnegative().nullable()
const optionalText = z.string().trim().max(100).nullable()

export const unidadImportSchema = z.object({
  unidad: z.string().trim().min(1, 'Unidad es requerida').max(50),
  nivel: optionalText,
  orientacion: optionalText,
  recamaras: optionalNum,
  banos: optionalNum,
  m2_interior: optionalNum,
  m2_balcon: optionalNum,
  m2_patio: optionalNum,
  m2_total: optionalNum,
  bodega: z.enum(BODEGA_OPTIONS).nullable(),
  bodega_m2: optionalNum,
  precios: z.object({ lista: optionalNum, '10': optionalNum, '25': optionalNum, '50': optionalNum, '75': optionalNum }),
  disponibilidad: z.enum(DISPONIBILIDAD_OPTIONS, { message: 'Disponibilidad inválida' }),
  /** Drive propio de la unidad; null = usa el del desarrollo. */
  link_drive_unidad: z.string().trim().max(1000).nullable(),
})

export const importarUnidadesSchema = z
  .object({
    precio_principal: z.enum(PRECIO_PRINCIPAL_OPTIONS, { message: 'Opción de precio inválida' }),
    torre: z.string().trim().max(200).nullable(),
    unidades: z.array(unidadImportSchema).min(1, 'No hay unidades para importar').max(UNIDADES_PDF_MAX_ROWS),
  })
  .superRefine((data, ctx) => {
    const vistas = new Set<string>()
    data.unidades.forEach((u, i) => {
      if (precioPrincipalDe(u.precios, data.precio_principal) === null) {
        ctx.addIssue({ code: 'custom', path: ['unidades', i, 'precios'], message: `Unidad ${u.unidad}: falta ${etiquetaPrecio(data.precio_principal)}` })
      }
      const key = u.unidad.toLowerCase()
      if (vistas.has(key)) {
        ctx.addIssue({ code: 'custom', path: ['unidades', i, 'unidad'], message: `Unidad ${u.unidad} está repetida` })
      }
      vistas.add(key)
    })
  })

export type UnidadImport = z.infer<typeof unidadImportSchema>
export type ImportarUnidadesInput = z.infer<typeof importarUnidadesSchema>

function toText(v: number | string | null): string | null {
  if (v === null) return null
  const s = String(v).trim()
  return s === '' ? null : s
}

/** Columnas de base_kibah (nombres originales, sin comillas) que salen de una fila del PDF. */
export function mapUnidadPdfToDB(u: UnidadImport, precioPrincipal: PrecioPrincipal): Record<string, string | null> {
  const row: Record<string, string | null> = {
    'Unidad': u.unidad,
    [BASE_KIBAH_NIVEL]: toText(u.nivel),
    [BASE_KIBAH_ORIENTACION]: toText(u.orientacion),
    'Número de recámaras': toText(u.recamaras),
    'Número de baños': toText(u.banos),
    'M2 Habitables': toText(u.m2_interior),
    'M2 Exteriores': toText(u.m2_balcon),
    'M2 Roof Garden/Jardín': toText(u.m2_patio),
    'M2 Totales': toText(u.m2_total),
    'Bodega': u.bodega,
    [BASE_KIBAH_M2_BODEGA]: toText(u.bodega_m2),
    'Precio por unidad': toText(precioPrincipalDe(u.precios, precioPrincipal)),
    'Disponibilidad': u.disponibilidad,
    [BASE_KIBAH_LINK_DRIVE_UNIDAD]: u.link_drive_unidad?.trim() || null,
  }
  for (const eng of ENGANCHE_OPTIONS) {
    row[`${BASE_KIBAH_PRECIO_ENG_PREFIX}${eng}%`] = toText(u.precios[eng])
  }
  return row
}
