'use client'

import { Search, X } from 'lucide-react'
import type { Property } from '@/types'
import { useProperties } from '@/hooks/useProperties'
import { useFilters } from '@/hooks/useFilters'
import { formatPrice, displayValue } from '@/lib/utils/format'

interface PropertyPickerProps {
  selectedId: number | null
  onSelect: (property: Property) => void
}

export function PropertyPicker({ selectedId, onSelect }: PropertyPickerProps) {
  const { activeFilters, debouncedFilters, setFilter } = useFilters()
  const { properties, loading, loadingMore, hasMore, loadMore } = useProperties(debouncedFilters)

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" strokeWidth={1.5} />
        <input
          value={activeFilters.search ?? ''}
          onChange={(e) => setFilter('search', e.target.value)}
          placeholder="Buscar propiedades..."
          className="w-full h-9 pl-9 pr-8 text-sm rounded-[var(--radius-sm)] border border-border-primary bg-bg-primary text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-orange focus:ring-1 focus:ring-orange/30"
        />
        {activeFilters.search && (
          <button
            type="button"
            onClick={() => setFilter('search', '')}
            className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer text-text-tertiary hover:text-text-primary"
          >
            <X className="w-4 h-4" strokeWidth={1.5} />
          </button>
        )}
      </div>

      <div className="max-h-64 overflow-y-auto space-y-1 rounded-[var(--radius-sm)] border border-border-primary p-2">
        {loading && properties.length === 0 && (
          <p className="text-xs text-text-tertiary text-center py-4">Cargando...</p>
        )}
        {!loading && properties.length === 0 && (
          <p className="text-xs text-text-tertiary text-center py-4">No hay resultados</p>
        )}
        {properties.map((p) => {
          const selected = selectedId === p.id
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onSelect(p)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-[var(--radius-sm)] text-left transition-colors cursor-pointer
                ${selected
                  ? 'bg-orange/10 border border-orange'
                  : 'hover:bg-bg-tertiary border border-transparent'}`}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">
                  {displayValue(p.nombre_kibah || p.nombre_desarrollador)}
                </p>
                <p className="text-xs text-text-tertiary">
                  {p.unidad ? `${p.unidad} · ` : ''}{displayValue(p.colonia)} · {formatPrice(p.precio_unidad)}
                </p>
              </div>
            </button>
          )
        })}
        {hasMore && (
          <button
            type="button"
            onClick={loadMore}
            disabled={loadingMore}
            className="w-full text-center text-xs text-orange hover:text-orange-hover py-2 cursor-pointer"
          >
            {loadingMore ? 'Cargando...' : 'Cargar más'}
          </button>
        )}
      </div>
    </div>
  )
}
