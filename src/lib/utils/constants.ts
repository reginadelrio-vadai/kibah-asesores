export const DISPONIBILIDAD_COLORS: Record<string, { bg: string; text: string }> = {
  Disponible: { bg: 'bg-emerald-500/15 dark:bg-emerald-500/20', text: 'text-emerald-700 dark:text-emerald-400' },
  Apartado: { bg: 'bg-amber-500/15 dark:bg-amber-500/20', text: 'text-amber-700 dark:text-amber-400' },
  Rentado: { bg: 'bg-red-500/15 dark:bg-red-500/20', text: 'text-red-700 dark:text-red-400' },
}

export const TIPO_PREVENTA_COLORS: Record<string, { bg: string; text: string }> = {
  preventa: { bg: 'bg-orange/15 dark:bg-orange/20', text: 'text-orange-700 dark:text-orange-400' },
  'entrega inmediata': { bg: 'bg-blue-500/15 dark:bg-blue-500/20', text: 'text-blue-700 dark:text-blue-400' },
}

export const DISPONIBILIDAD_OPTIONS = ['Disponible', 'Apartado', 'Rentado'] as const
export const TIPO_PREVENTA_OPTIONS = ['preventa', 'entrega inmediata'] as const
export const TIPO_ENTREGA_OPTIONS = ['Terminado', 'Obra blanca', 'Obra Gris', 'Obra Negra'] as const
export const BODEGA_OPTIONS = ['Si', 'No'] as const

/** Unidades (hijas) por página en el detalle de un desarrollo. */
export const UNIDADES_PER_PAGE = 20
/** Tope de filas que el servidor lee para calcular el resumen de un desarrollo (solo columnas ligeras). */
export const UNIDADES_RESUMEN_MAX_ROWS = 1000
/** Etiqueta para unidades cuyo "Nombre Desarrollador" (torre) viene vacío. */
export const TORRE_SIN_NOMBRE = 'Sin torre'
/** Espera (ms) antes de buscar unidades mientras se escribe. */
export const UNIDADES_SEARCH_DEBOUNCE_MS = 300

// ── Subir unidades por PDF ──────────────────────────────────────
/** Modelo de Claude que lee las listas de precios en PDF. */
export const UNIDADES_PDF_MODEL = 'claude-opus-5-5'
/** Tamaño máximo del PDF (Vercel limita el body de una request a ~4.5 MB). */
export const UNIDADES_PDF_MAX_BYTES = 4 * 1024 * 1024
/** Máximo de unidades que se importan de una sola vez. */
export const UNIDADES_PDF_MAX_ROWS = 500
/** Esquemas de enganche que trae el PDF; cada uno tiene su columna "Precio Eng X%". */
export const ENGANCHE_OPTIONS = ['10', '25', '50', '75'] as const
/** Columnas de precio que se leen del PDF: precio de lista + un precio por esquema de enganche. */
export const PRECIO_LISTA = 'lista'
export const PRECIO_COLUMNAS = [PRECIO_LISTA, ...ENGANCHE_OPTIONS] as const
/** Opción "el más alto de la fila" para "Precio por unidad". */
export const PRECIO_MAS_ALTO = 'max'
export const PRECIO_PRINCIPAL_OPTIONS = [PRECIO_MAS_ALTO, ...PRECIO_COLUMNAS] as const
/** Por default "Precio por unidad" es el precio más alto de cada unidad (el precio de lista). */
export const PRECIO_PRINCIPAL_DEFAULT = PRECIO_MAS_ALTO
/** Columnas de base_kibah que se crean en sql/007-unidades-pdf.sql. */
export const BASE_KIBAH_NIVEL = 'Nivel'
export const BASE_KIBAH_ORIENTACION = 'Orientación'
export const BASE_KIBAH_M2_BODEGA = 'M2 Bodega'  // sql/008
export const BASE_KIBAH_PRECIO_ENG_PREFIX = 'Precio Eng '

// ── Links de Drive: Desarrollos es la fuente; las unidades heredan (sql/009) ──
/** Columna de pagina_web_kibah con el Drive del edificio. */
export const DESARROLLO_LINK_DRIVE = 'Link Drive'
/** Columnas de base_kibah: copia del Drive del padre y Drive propio opcional de la unidad. */
export const BASE_KIBAH_LINK_DRIVE_DESARROLLO = 'Link Drive Desarrollo'
export const BASE_KIBAH_LINK_DRIVE_UNIDAD = 'Link Drive Unidad'
/** Respaldo de los links de Drive que tenían las unidades antes de borrarlas (sql/009). */
export const RESPALDO_LINKS_DRIVE_TABLE = 'respaldo_links_drive_unidades_20261117'
