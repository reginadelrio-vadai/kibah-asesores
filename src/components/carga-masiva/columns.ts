export interface ColumnDef {
  header: string
  dbColumn?: string
  required: boolean
  type: 'text' | 'number' | 'date'
  allowedValues?: string[]
}

export const DROPDOWN_OPTIONS: Record<string, string[]> = {
  'Disponibilidad': ['Disponible', 'Apartado', 'Rentado'],
  'Bodega': ['Sí', 'No'],
  'Entrega Inmediata/Preventa': ['Preventa', 'Entrega Inmediata'],
  'Tipo de Entrega': ['Terminado', 'Obra Blanca', 'Obra Gris', 'Obra Negra'],
}

function col(header: string, required: boolean, type: 'text' | 'number' | 'date' = 'text', dbColumn?: string): ColumnDef {
  return { header, dbColumn, required, type, allowedValues: DROPDOWN_OPTIONS[header] }
}

export const PROPERTY_COLUMNS: ColumnDef[] = [
  col('Nombre Kibah', true),
  col('Nombre Desarrollador', true),
  col('Unidad', true),
  col('Precio por unidad', true, 'number'),
  col('M2 Totales', true, 'number'),
  col('Número de recámaras', true, 'number'),
  col('Número de baños', true, 'number'),
  col('Dirección', true),
  col('Colonia', true),
  col('Desarrollador/Propietario (Whats grupo)', true),
  col('Fecha de Construcción/Entrega', true),
  col('Entrega Inmediata/Preventa', true),
  col('Disponibilidad', false),
  col('M2 Habitables', false, 'number'),
  col('M2 Exteriores', false, 'number'),
  col('M2 Roof Garden/Jardín', false, 'number'),
  col('Lugares de estacionamiento', false, 'number'),
  col('Bodega', false),
  col('Amenidades', false),
  col('Alcaldía', false, 'text', 'Alcaldia'),
  col('Tipo de Entrega', false),
  col('% Comisión', false, 'number'),
  col('Link Drive', false),
  col('Fecha de Actualización', false),
]

export const DESARROLLO_COLUMNS: ColumnDef[] = [
  col('Nombre Kibah', true),
  col('Nombre Desarrollador', true),
  col('Disponibilidad', false),
  col('Precio Min', false, 'number'),
  col('Precio Max', true, 'number'),
  col('M2 Totales Min', false, 'number'),
  col('M2 Totales Max', true, 'number'),
  col('Recámaras Min', false, 'number'),
  col('Recámaras Max', true, 'number'),
  col('Baños Min', false, 'number'),
  col('Baños Max', true, 'number'),
  col('Estacionamientos Min', false, 'number'),
  col('Estacionamientos Max', true, 'number'),
  col('Bodega', false),
  col('Amenidades', false),
  col('Dirección (sin número)', true, 'text', 'Dirección'),
  col('Dirección BDD', true),
  col('Colonia', true),
  col('Alcaldía', false, 'text', 'Alcaldia'),
  col('Desarrollador/Propietario (Whats grupo)', true),
  col('Fecha de Construcción/Entrega', true),
  col('Entrega Inmediata/Preventa', true),
  col('Tipo de Entrega', false),
  col('% Comisión', false, 'number'),
  col('Descripción Desarrollo', true),
  col('Link Maps', true),
  col('Fecha de Actualización', false),
]

export const DATE_COLUMNS = new Set(['Fecha de Construcción/Entrega', 'Fecha de Actualización'])

export type CargaType = 'propiedades' | 'desarrollos'

export function getColumns(type: CargaType): ColumnDef[] {
  return type === 'propiedades' ? PROPERTY_COLUMNS : DESARROLLO_COLUMNS
}

// Normalize accent on string for dictionary lookup
function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
}

const LOCATION_DICT: Record<string, string> = {}
const KNOWN_LOCATIONS = [
  'Cuauhtémoc', 'Álvaro Obregón', 'Benito Juárez', 'Miguel Hidalgo', 'Coyoacán',
  'Tlalpan', 'Gustavo A. Madero', 'Iztapalapa', 'Azcapotzalco', 'Venustiano Carranza',
  'Iztacalco', 'Xochimilco', 'Magdalena Contreras', 'Cuajimalpa de Morelos', 'Tláhuac', 'Milpa Alta',
  'Condesa', 'Hipódromo', 'Hipódromo Condesa', 'Roma Norte', 'Roma Sur',
  'Narvarte', 'Nápoles', 'Del Valle', 'Polanco', 'Santa Fe', 'Juárez',
  'Anzures', 'Escandón', 'San Rafael', 'San Miguel Chapultepec', 'Tabacalera',
  'Doctores', 'Obrera', 'Centro Histórico', 'San Pedro de los Pinos', 'Mixcoac',
]
for (const loc of KNOWN_LOCATIONS) LOCATION_DICT[normalize(loc)] = loc

const LOWERCASE_WORDS = new Set(['de', 'del', 'la', 'las', 'los', 'el', 'en', 'y'])

export function smartTitleCase(value: string): string {
  if (!value.trim()) return value
  const words = value.toLowerCase().trim().split(/\s+/)
  const titled = words.map((w, i) => {
    if (i > 0 && LOWERCASE_WORDS.has(w)) return w
    return w.charAt(0).toUpperCase() + w.slice(1)
  }).join(' ')
  const key = normalize(titled)
  return LOCATION_DICT[key] ?? titled
}
