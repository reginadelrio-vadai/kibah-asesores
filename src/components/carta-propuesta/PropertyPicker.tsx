'use client'

import { useEffect, useMemo, useState } from 'react'
import { Search, X, Loader2 } from 'lucide-react'
import type { Property } from '@/types'
import { formatPrice, displayValue } from '@/lib/utils/format'

interface PropertyPickerProps {
  selectedId: number | null
  onSelect: (property: Property) => void
}

function normalize(s: string | null | undefined): string {
  if (!s) return ''
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

const PAGE_SIZE = 50

export function PropertyPicker({ selectedId, onSelect }: PropertyPickerProps) {
  const [all, setAll] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  useEffect(() => {
    setLoading(true)
    fetch('/api/carta-propuesta/properties')
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((json) => setAll(json.data ?? []))
      .catch(() => setAll([]))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    const q = normalize(query)
    if (!q) return all
    return all.filter((p) => {
      const haystack = [
        p.nombre_kibah,
        p.nombre_desarrollador,
        p.unidad,
        p.colonia,
        p.direccion,
      ]
        .map((v) => normalize(v as string | null | undefined))
        .join(' ')
      return haystack.includes(q)
    })
  }, [all, query])

  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [query])

  const visible = filtered.slice(0, visibleCount)
  const hasMore = filtered.length > visibleCount

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" strokeWidth={1.5} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar propiedades..."
          className="w-full h-9 pl-9 pr-8 text-sm rounded-[var(--radius-sm)] border border-border-primary bg-bg-primary text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-orange focus:ring-1 focus:ring-orange/30"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer text-text-tertiary hover:text-text-primary"
          >
            <X className="w-4 h-4" strokeWidth={1.5} />
          </button>
        )}
      </div>

      <div className="max-h-64 overflow-y-auto space-y-1 rounded-[var(--radius-sm)] border border-border-primary p-2">
        {loading && (
          <div className="flex items-center justify-center py-4 gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-text-tertiary" strokeWidth={1.5} />
            <span className="text-xs text-text-tertiary">Cargando propiedades...</span>
          </div>
        )}
        {!loading && filtered.length === 0 && (
          <p className="text-xs text-text-tertiary text-center py-4">No hay resultados</p>
        )}
        {!loading &&
          visible.map((p) => {
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
                  <p className="text-xs text-text-tertiary truncate">
                    {p.unidad ? `${p.unidad} · ` : ''}{displayValue(p.colonia)} · {formatPrice(p.precio_unidad)}
                  </p>
                </div>
              </button>
            )
          })}
        {!loading && hasMore && (
          <button
            type="button"
            onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
            className="w-full text-center text-xs text-orange hover:text-orange-hover py-2 cursor-pointer"
          >
            Mostrar más ({filtered.length - visibleCount} restantes)
          </button>
        )}
      </div>
    </div>
  )
}
