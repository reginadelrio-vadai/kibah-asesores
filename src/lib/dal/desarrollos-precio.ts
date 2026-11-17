import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Filtro de precio de Desarrollos basado en el precio real de sus unidades. Solo lectura.
 *
 * Un desarrollo pasa el filtro si:
 * - tiene unidades (base_kibah con su mismo "Nombre Kibah") y al menos una tiene precio dentro del rango; o
 * - no tiene unidades y su rango guardado (precio_min–precio_max) toca el filtro. Un extremo vacío
 *   se toma igual al otro (un solo precio), nunca como $0 ni como "sin límite".
 */

/** Filas por página al leer columnas ligeras (límite de PostgREST). */
const PAGE = 1000
/** Tope de seguridad: base compartida en plan Nano. */
const MAX_PAGES = 20

const key = (nombre: string | null) => (nombre ?? '').trim().toLowerCase()

interface PrecioUnidad { nombre_kibah: string | null; precio_unidad: number | string | null }
interface PrecioDesarrollo { id: number; nombre_kibah: string | null; precio_min: number | null; precio_max: number | null }

async function leerPreciosUnidades(): Promise<PrecioUnidad[]> {
  const supabase = await createClient()
  const rows: PrecioUnidad[] = []
  for (let page = 0; page < MAX_PAGES; page++) {
    const { data, error } = await supabase
      .from('propiedades_view')
      .select('nombre_kibah, precio_unidad')
      .order('id', { ascending: true })
      .range(page * PAGE, page * PAGE + PAGE - 1)
    if (error) throw new Error(error.message)
    rows.push(...((data ?? []) as PrecioUnidad[]))
    if (!data || data.length < PAGE) break
  }
  return rows
}

async function leerRangosDesarrollos(): Promise<PrecioDesarrollo[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('desarrollos_view')
    .select('id, nombre_kibah, precio_min, precio_max')
    .limit(PAGE)
  if (error) throw new Error(error.message)
  return (data ?? []) as PrecioDesarrollo[]
}

function enRango(precio: number, min?: number, max?: number): boolean {
  return (min === undefined || precio >= min) && (max === undefined || precio <= max)
}

/** IDs de los desarrollos que cumplen el filtro de precio. */
export async function getDesarrolloIdsPorPrecio(min?: number, max?: number): Promise<number[]> {
  const [unidades, desarrollos] = await Promise.all([leerPreciosUnidades(), leerRangosDesarrollos()])

  const conUnidades = new Set<string>()
  const conUnidadEnRango = new Set<string>()
  for (const u of unidades) {
    const k = key(u.nombre_kibah)
    if (!k) continue
    conUnidades.add(k)
    const precio = Number(u.precio_unidad)
    if (u.precio_unidad !== null && !isNaN(precio) && precio > 0 && enRango(precio, min, max)) {
      conUnidadEnRango.add(k)
    }
  }

  return desarrollos
    .filter((d) => {
      const k = key(d.nombre_kibah)
      if (k && conUnidades.has(k)) return conUnidadEnRango.has(k)

      // Sin unidades: usar el rango guardado; un extremo vacío = el otro.
      const lo = d.precio_min ?? d.precio_max
      const hi = d.precio_max ?? d.precio_min
      if (lo === null || hi === null) return false
      return (max === undefined || lo <= max) && (min === undefined || hi >= min)
    })
    .map((d) => d.id)
}
