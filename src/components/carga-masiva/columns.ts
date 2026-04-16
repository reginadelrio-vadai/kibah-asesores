export interface ColumnDef {
  header: string
  required: boolean
  type: 'text' | 'number' | 'date'
}

export const PROPERTY_COLUMNS: ColumnDef[] = [
  { header: 'Nombre Kibah', required: true, type: 'text' },
  { header: 'Nombre Desarrollador', required: true, type: 'text' },
  { header: 'Unidad', required: true, type: 'text' },
  { header: 'Precio por unidad', required: true, type: 'number' },
  { header: 'M2 Totales', required: true, type: 'number' },
  { header: 'Número de recámaras', required: true, type: 'number' },
  { header: 'Número de baños', required: true, type: 'number' },
  { header: 'Dirección', required: true, type: 'text' },
  { header: 'Colonia', required: true, type: 'text' },
  { header: 'Desarrollador/Propietario (Whats grupo)', required: true, type: 'text' },
  { header: 'Fecha de Construcción/Entrega', required: true, type: 'text' },
  { header: 'Entrega Inmediata/Preventa', required: true, type: 'text' },
  { header: 'Disponibilidad', required: false, type: 'text' },
  { header: 'M2 Habitables', required: false, type: 'number' },
  { header: 'M2 Exteriores', required: false, type: 'number' },
  { header: 'M2 Roof Garden/Jardín', required: false, type: 'number' },
  { header: 'Lugares de estacionamiento', required: false, type: 'number' },
  { header: 'Bodega', required: false, type: 'text' },
  { header: 'Amenidades', required: false, type: 'text' },
  { header: 'Alcaldia', required: false, type: 'text' },
  { header: 'Tipo de Entrega', required: false, type: 'text' },
  { header: '% Comisión', required: false, type: 'number' },
  { header: 'Link Drive', required: false, type: 'text' },
  { header: 'Fecha de Actualización', required: false, type: 'text' },
  { header: 'Descripción Desarrollo', required: false, type: 'text' },
]

export const DESARROLLO_COLUMNS: ColumnDef[] = [
  { header: 'Nombre Kibah', required: true, type: 'text' },
  { header: 'Nombre Desarrollador', required: true, type: 'text' },
  { header: 'Precio Max', required: true, type: 'number' },
  { header: 'M2 Totales Max', required: true, type: 'number' },
  { header: 'Recámaras Max', required: true, type: 'number' },
  { header: 'Baños Max', required: true, type: 'number' },
  { header: 'Dirección', required: true, type: 'text' },
  { header: 'Dirección BDD', required: true, type: 'text' },
  { header: 'Colonia', required: true, type: 'text' },
  { header: 'Desarrollador/Propietario (Whats grupo)', required: true, type: 'text' },
  { header: 'Fecha de Construcción/Entrega', required: true, type: 'text' },
  { header: 'Entrega Inmediata/Preventa', required: true, type: 'text' },
  { header: 'Descripción Desarrollo', required: true, type: 'text' },
  { header: 'Link Maps', required: true, type: 'text' },
  { header: 'Disponibilidad', required: false, type: 'text' },
  { header: 'Precio Min', required: false, type: 'number' },
  { header: 'M2 Totales Min', required: false, type: 'number' },
  { header: 'Recámaras Min', required: false, type: 'number' },
  { header: 'Baños Min', required: false, type: 'number' },
  { header: 'Estacionamientos Min', required: false, type: 'number' },
  { header: 'Estacionamientos Max', required: false, type: 'number' },
  { header: 'Bodega', required: false, type: 'text' },
  { header: 'Amenidades', required: false, type: 'text' },
  { header: 'Alcaldia', required: false, type: 'text' },
  { header: 'Tipo de Entrega', required: false, type: 'text' },
  { header: '% Comisión', required: false, type: 'number' },
  { header: 'Fecha de Actualización', required: false, type: 'text' },
]

export type CargaType = 'propiedades' | 'desarrollos'

export function getColumns(type: CargaType): ColumnDef[] {
  return type === 'propiedades' ? PROPERTY_COLUMNS : DESARROLLO_COLUMNS
}
