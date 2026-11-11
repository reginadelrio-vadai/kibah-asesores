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
