export interface ColumnDef {
  header: string
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

function col(header: string, required: boolean, type: 'text' | 'number' | 'date' = 'text'): ColumnDef {
  return { header, required, type, allowedValues: DROPDOWN_OPTIONS[header] }
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
  col('Alcaldia', false),
  col('Tipo de Entrega', false),
  col('% Comisión', false, 'number'),
  col('Link Drive', false),
  col('Fecha de Actualización', false),
]

export const DESARROLLO_COLUMNS: ColumnDef[] = [
  col('Nombre Kibah', true),
  col('Nombre Desarrollador', true),
  col('Precio Max', true, 'number'),
  col('M2 Totales Max', true, 'number'),
  col('Recámaras Max', true, 'number'),
  col('Baños Max', true, 'number'),
  col('Dirección', true),
  col('Dirección BDD', true),
  col('Colonia', true),
  col('Desarrollador/Propietario (Whats grupo)', true),
  col('Fecha de Construcción/Entrega', true),
  col('Entrega Inmediata/Preventa', true),
  col('Descripción Desarrollo', true),
  col('Link Maps', true),
  col('Disponibilidad', false),
  col('Precio Min', false, 'number'),
  col('M2 Totales Min', false, 'number'),
  col('Recámaras Min', false, 'number'),
  col('Baños Min', false, 'number'),
  col('Estacionamientos Min', false, 'number'),
  col('Estacionamientos Max', false, 'number'),
  col('Bodega', false),
  col('Amenidades', false),
  col('Alcaldia', false),
  col('Tipo de Entrega', false),
  col('% Comisión', false, 'number'),
  col('Fecha de Actualización', false),
]

export const DATE_COLUMNS = new Set(['Fecha de Construcción/Entrega', 'Fecha de Actualización'])

export type CargaType = 'propiedades' | 'desarrollos'

export function getColumns(type: CargaType): ColumnDef[] {
  return type === 'propiedades' ? PROPERTY_COLUMNS : DESARROLLO_COLUMNS
}
