export interface Desarrollo {
  id: number
  created_at: string
  id_propiedad: string
  nombre_kibah: string | null
  nombre_desarrollador: string | null
  fecha_actualizacion: string | null
  disponibilidad: string | null
  precio_min: number | null
  precio_max: number | null
  m2_totales_min: number | null
  m2_totales_max: number | null
  recamaras_min: number | null
  recamaras_max: number | null
  banos_min: number | null
  banos_max: number | null
  estacionamientos_min: number | null
  estacionamientos_max: number | null
  bodega: string | null
  amenidades: string | null
  direccion: string | null
  direccion_bdd: string | null
  colonia: string | null
  alcaldia: string | null
  contacto_desarrollador: string | null
  fecha_entrega: string | null
  tipo_preventa: string | null
  tipo_entrega: string | null
  pct_comision: number | null
  descripcion: string | null
  imagen_principal: string | null
  link_maps: string | null
  imagen_1: string | null
  imagen_2: string | null
  imagen_3: string | null
  /** Calculado en el listado: unidades de base_kibah con el mismo Nombre Kibah. */
  unidades_count?: number
}

/** Unidad (hija) de un desarrollo, leída de propiedades_view. */
export interface DesarrolloUnidad {
  id: number
  id_propiedad: string
  unidad: string | null
  nombre_desarrollador: string | null
  disponibilidad: string | null
  precio_unidad: number | string | null
  m2_totales: number | string | null
  num_recamaras: number | string | null
  num_banos: number | string | null
  estacionamiento: number | string | null
}

export interface TorreResumen {
  nombre: string
  total: number
  disponibles: number
}

export interface DesarrolloUnidadesResumen {
  total: number
  disponibles: number
  precio_min: number | null
  precio_max: number | null
  torres: TorreResumen[]
}
