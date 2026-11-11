'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { AlertCircle, Bed, Bath, Car, Home, Loader2, Ruler, Search, X } from 'lucide-react'
import type { DesarrolloUnidad, DesarrolloUnidadesResumen } from '@/types/desarrollo'
import { useDesarrolloUnidades } from '@/hooks/useDesarrolloUnidades'
import { DISPONIBILIDAD_COLORS, UNIDADES_SEARCH_DEBOUNCE_MS } from '@/lib/utils/constants'
import { formatM2, formatPrice, displayValue } from '@/lib/utils/format'
import { DesarrolloUnidadDetail } from './DesarrolloUnidadDetail'

interface DesarrolloUnidadesProps {
  desarrolloId: number
  /** Avisa al detalle del desarrollo cuando se abre/cierra la ficha de una unidad (para Esc y scroll). */
  onUnidadDetailChange?: (open: boolean) => void
}

function dispStyle(value: string | null) {
  if (!value) return null
  const key = Object.keys(DISPONIBILIDAD_COLORS).find((k) => k.toLowerCase() === value.trim().toLowerCase())
  return key ? DISPONIBILIDAD_COLORS[key] : null
}

function priceRange(s: DesarrolloUnidadesResumen): string {
  if (s.precio_min === null || s.precio_max === null) return 'Consultar precio'
  if (s.precio_min === s.precio_max) return formatPrice(s.precio_min)
  return `${formatPrice(s.precio_min).replace(' MXN', '')} – ${formatPrice(s.precio_max)}`
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius-sm)] bg-bg-tertiary px-3 py-2.5 min-w-0">
      <dt className="text-xs text-text-tertiary">{label}</dt>
      <dd className="text-sm font-semibold text-text-primary mt-0.5 truncate" title={value}>{value}</dd>
    </div>
  )
}

function TorreChip({ label, count, active, onClick }: { label: string; count: number; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 h-8 px-3 text-xs font-medium rounded-full border transition-colors cursor-pointer ${
        active
          ? 'bg-orange text-white border-orange'
          : 'bg-transparent text-text-secondary border-border-primary hover:text-orange hover:border-orange/50'
      }`}
    >
      {label} <span className={active ? 'text-white/80' : 'text-text-tertiary'}>({count})</span>
    </button>
  )
}

function Spec({ icon: Icon, value }: { icon: typeof Bed; value: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <Icon className="w-3.5 h-3.5 text-text-tertiary" strokeWidth={1.5} /> {value}
    </span>
  )
}

function UnidadRow({ u, showTorre, onSelect }: { u: DesarrolloUnidad; showTorre: boolean; onSelect: (u: DesarrolloUnidad) => void }) {
  const style = dispStyle(u.disponibilidad)
  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(u)}
        className="w-full text-left flex items-center gap-3 py-3 px-2 -mx-2 rounded-[var(--radius-sm)] hover:bg-bg-tertiary transition-colors cursor-pointer"
      >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-text-primary">Unidad {displayValue(u.unidad)}</span>
          {showTorre && u.nombre_desarrollador && (
            <span className="text-xs text-text-tertiary truncate">· {u.nombre_desarrollador}</span>
          )}
        </div>
        <div className="flex items-center gap-3 flex-wrap mt-1 text-xs text-text-secondary">
          <Spec icon={Bed} value={displayValue(u.num_recamaras)} />
          <Spec icon={Bath} value={displayValue(u.num_banos)} />
          <Spec icon={Car} value={displayValue(u.estacionamiento)} />
          <Spec icon={Ruler} value={formatM2(u.m2_totales)} />
        </div>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        <span className="text-sm font-semibold text-text-primary">{formatPrice(u.precio_unidad)}</span>
        {u.disponibilidad && (
          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${style ? `${style.bg} ${style.text}` : 'bg-bg-tertiary text-text-secondary'}`}>
            {u.disponibilidad}
          </span>
        )}
      </div>
      </button>
    </li>
  )
}

function Skeleton() {
  return (
    <div className="space-y-2" aria-hidden>
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-14 rounded-[var(--radius-sm)] bg-bg-tertiary animate-pulse" />
      ))}
    </div>
  )
}

/** Sección "Unidades" del detalle de un desarrollo: sus hijos de base_kibah, agrupables por torre. */
export function DesarrolloUnidades({ desarrolloId, onUnidadDetailChange }: DesarrolloUnidadesProps) {
  const [torre, setTorre] = useState<string | null>(null)
  const [selected, setSelected] = useState<DesarrolloUnidad | null>(null)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), UNIDADES_SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(t)
  }, [searchInput])

  useEffect(() => {
    onUnidadDetailChange?.(selected !== null)
  }, [selected, onUnidadDetailChange])
  const { unidades, summary, loading, loadingMore, error, hasMore, loadMore, retry } =
    useDesarrolloUnidades(desarrolloId, torre, search)

  const torres = summary?.torres ?? []
  const multiTorre = torres.length > 1

  return (
    <div className="py-4">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary mb-3">
        Unidades{summary ? ` (${summary.total})` : ''}
      </h3>

      {summary && summary.total > 0 && (
        <dl className="grid grid-cols-3 gap-2 mb-3">
          <Stat label="Unidades" value={String(summary.total)} />
          <Stat label="Disponibles" value={String(summary.disponibles)} />
          <Stat label="Precio" value={priceRange(summary)} />
        </dl>
      )}

      {summary && summary.total > 0 && (
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary pointer-events-none" strokeWidth={1.5} />
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Buscar unidad (ej. 101, PH, A-302)"
            aria-label="Buscar unidad"
            className="kibah-input !pl-9 !pr-9"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => setSearchInput('')}
              aria-label="Limpiar búsqueda"
              className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center w-6 h-6 rounded hover:bg-bg-tertiary cursor-pointer"
            >
              <X className="w-3.5 h-3.5 text-text-secondary" strokeWidth={1.5} />
            </button>
          )}
        </div>
      )}

      {multiTorre && (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-1 -mx-1 px-1">
          <TorreChip label="Todas" count={summary?.total ?? 0} active={torre === null} onClick={() => setTorre(null)} />
          {torres.map((t) => (
            <TorreChip key={t.nombre} label={t.nombre} count={t.total} active={torre === t.nombre} onClick={() => setTorre(t.nombre)} />
          ))}
        </div>
      )}

      {error ? (
        <div className="flex items-center gap-3 p-3 rounded-[var(--radius-sm)] bg-error/10 border border-error/20">
          <AlertCircle className="w-4 h-4 text-error flex-shrink-0" strokeWidth={1.5} />
          <p className="text-sm text-error flex-1">{error}</p>
          <button onClick={retry} className="text-sm font-medium text-error hover:underline cursor-pointer">Reintentar</button>
        </div>
      ) : loading ? (
        <Skeleton />
      ) : unidades.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Home className="w-8 h-8 text-text-tertiary mb-2" strokeWidth={1.5} />
          <p className="text-sm text-text-secondary">
            {search ? `No hay unidades que coincidan con "${search}"` : 'Sin unidades cargadas'}
          </p>
        </div>
      ) : (
        <>
          <ul className="divide-y divide-border-primary">
            {unidades.map((u) => (
              <UnidadRow key={u.id} u={u} showTorre={multiTorre && torre === null} onSelect={setSelected} />
            ))}
          </ul>
          {hasMore && (
            <div className="flex justify-center pt-3">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="inline-flex items-center gap-2 h-9 px-5 text-sm font-medium rounded-[var(--radius-sm)] bg-bg-tertiary text-text-primary hover:bg-border-primary disabled:opacity-50 transition-colors cursor-pointer"
              >
                {loadingMore && <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.5} />}
                {loadingMore ? 'Cargando...' : 'Cargar más'}
              </button>
            </div>
          )}
        </>
      )}

      {selected && createPortal(
        <DesarrolloUnidadDetail
          desarrolloId={desarrolloId}
          idPropiedad={selected.id_propiedad}
          onClose={() => setSelected(null)}
        />,
        document.body
      )}
    </div>
  )
}
