import { z } from 'zod'

const DISPONIBILIDAD_VALUES = ['Disponible', 'Apartado', 'Rentado'] as const
const TIPO_PREVENTA_VALUES = ['Preventa', 'Entrega Inmediata'] as const
const TIPO_ENTREGA_VALUES = ['Terminado', 'Obra blanca', 'Obra Gris', 'Obra Negra'] as const
const BODEGA_VALUES = ['Si', 'No'] as const

export const createPropertySchema = z.object({
  // Required
  nombre_kibah: z.string().min(1, 'Nombre Kibah es requerido'),
  unidad: z.string().min(1, 'Unidad es requerida'),
  disponibilidad: z.enum(DISPONIBILIDAD_VALUES, { message: 'Disponibilidad inválida' }),
  precio_unidad: z.number({ error: 'Precio debe ser un número' }).positive('Precio debe ser mayor a 0'),
  m2_totales: z.number({ error: 'M2 totales debe ser un número' }).positive('M2 totales debe ser mayor a 0'),
  colonia: z.string().min(1, 'Colonia es requerida'),
  alcaldia: z.string().min(1, 'Alcaldía es requerida'),
  num_recamaras: z.number({ error: 'Recámaras debe ser un número' }).nonnegative('Recámaras debe ser 0 o más'),
  num_banos: z.number({ error: 'Baños debe ser un número' }).nonnegative('Baños debe ser 0 o más'),
  tipo_preventa: z.enum(TIPO_PREVENTA_VALUES, { message: 'Tipo preventa inválido' }),

  // Optional
  nombre_desarrollador: z.string().nullable().optional(),
  m2_habitables: z.number().nonnegative().nullable().optional(),
  m2_exteriores: z.number().nonnegative().nullable().optional(),
  m2_roof_garden: z.number().nonnegative().nullable().optional(),
  estacionamiento: z.number().nonnegative().nullable().optional(),
  bodega: z.enum(BODEGA_VALUES).nullable().optional(),
  amenidades: z.string().nullable().optional(),
  direccion: z.string().nullable().optional(),
  contacto_desarrollador: z.string().nullable().optional(),
  fecha_entrega: z.string().nullable().optional(),
  tipo_entrega: z.enum(TIPO_ENTREGA_VALUES).nullable().optional(),
  pct_comision: z.number().nonnegative().nullable().optional(),
  link_drive: z.string().nullable().optional(),
  /** Drive propio de la unidad; vacío = usa el del desarrollo. */
  link_drive_unidad: z.string().trim().max(1000).nullable().optional(),

  // Lista de precios (sql/007–008)
  nivel: z.string().trim().max(100).nullable().optional(),
  orientacion: z.string().trim().max(100).nullable().optional(),
  m2_bodega: z.number().nonnegative().nullable().optional(),
  precio_eng_10: z.number().nonnegative().nullable().optional(),
  precio_eng_25: z.number().nonnegative().nullable().optional(),
  precio_eng_50: z.number().nonnegative().nullable().optional(),
  precio_eng_75: z.number().nonnegative().nullable().optional(),
})

export const updatePropertySchema = createPropertySchema.partial()

export type CreatePropertyInput = z.infer<typeof createPropertySchema>
export type UpdatePropertyInput = z.infer<typeof updatePropertySchema>

const COLUMN_MAP: Record<string, string> = {
  nombre_desarrollador: 'Nombre Desarrollador',
  unidad: 'Unidad',
  fecha_actualizacion: 'Fecha de Actualización',
  disponibilidad: 'Disponibilidad',
  precio_unidad: 'Precio por unidad',
  m2_totales: 'M2 Totales',
  m2_habitables: 'M2 Habitables',
  m2_exteriores: 'M2 Exteriores',
  m2_roof_garden: 'M2 Roof Garden/Jardín',
  num_recamaras: 'Número de recámaras',
  num_banos: 'Número de baños',
  estacionamiento: 'Lugares de estacionamiento',
  bodega: 'Bodega',
  amenidades: 'Amenidades',
  direccion: 'Dirección',
  colonia: 'Colonia',
  alcaldia: 'Alcaldia',
  contacto_desarrollador: 'Desarrollador/Propietario (Whats grupo)',
  fecha_entrega: 'Fecha de Construcción/Entrega',
  tipo_preventa: 'Entrega Inmediata/Preventa',
  tipo_entrega: 'Tipo de Entrega',
  pct_comision: '% Comisión',
  link_drive: 'Link Drive',
  link_drive_unidad: 'Link Drive Unidad',
  nivel: 'Nivel',
  orientacion: 'Orientación',
  m2_bodega: 'M2 Bodega',
  precio_eng_10: 'Precio Eng 10%',
  precio_eng_25: 'Precio Eng 25%',
  precio_eng_50: 'Precio Eng 50%',
  precio_eng_75: 'Precio Eng 75%',
  nombre_kibah: 'Nombre Kibah',
}

export function mapSnakeToDB(data: Record<string, unknown>): Record<string, unknown> {
  const mapped: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(data)) {
    const dbColumn = COLUMN_MAP[key]
    if (dbColumn) {
      mapped[dbColumn] = value === '' ? null : value
    }
  }
  return mapped
}
