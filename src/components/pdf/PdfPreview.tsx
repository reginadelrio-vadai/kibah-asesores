'use client'

import { X } from 'lucide-react'
import type { Property } from '@/types'
import { formatPrice, displayValue } from '@/lib/utils/format'

interface PdfPreviewProps {
  properties: Property[]
  imageMap: Record<string, string>
  onRemove: (id: number) => void
}

export function PdfPreview({ properties, imageMap, onRemove }: PdfPreviewProps) {
  if (properties.length === 0) return null

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-text-primary">
        {properties.length} propiedad{properties.length !== 1 ? 'es' : ''} seleccionada{properties.length !== 1 ? 's' : ''}
      </h3>
      <div className="space-y-2">
        {properties.map((p) => {
          const imgUrl = imageMap[p.nombre_kibah ?? ''] ?? null
          return (
            <div key={p.id} className="flex items-center gap-3 px-3 py-2 rounded-[var(--radius-sm)] border border-border-primary bg-bg-secondary">
              {imgUrl ? (
                <img src={imgUrl} alt="" className="w-12 h-8 rounded object-cover flex-shrink-0" />
              ) : (
                <div className="w-12 h-8 rounded bg-bg-tertiary flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">
                  {displayValue(p.nombre_kibah || p.nombre_desarrollador)}
                </p>
                <p className="text-xs text-text-tertiary">
                  {p.unidad ? `${p.unidad} · ` : ''}{displayValue(p.colonia)} · {formatPrice(p.precio_unidad)}
                </p>
              </div>
              <button
                onClick={() => onRemove(p.id)}
                className="p-1 text-text-tertiary hover:text-red-500 transition-colors cursor-pointer flex-shrink-0"
              >
                <X className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
