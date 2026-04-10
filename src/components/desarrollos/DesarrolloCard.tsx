'use client'

import { Bed, Bath, Ruler, Pencil, Trash2 } from 'lucide-react'
import type { Desarrollo } from '@/types/desarrollo'
import { DISPONIBILIDAD_COLORS } from '@/lib/utils/constants'
import { toTitleCase } from '@/lib/utils/format'

interface DesarrolloCardProps {
  desarrollo: Desarrollo
  onClick: (d: Desarrollo) => void
  onEdit?: (d: Desarrollo) => void
  onDelete?: (d: Desarrollo) => void
}

function formatPriceRange(min: number | null, max: number | null): string {
  const fmt = (n: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n)
  if (min && max && min !== max) return `${fmt(min)} - ${fmt(max)}`
  if (min && max && min === max) return fmt(min)
  if (min) return `Desde ${fmt(min)}`
  if (max) return `Hasta ${fmt(max)}`
  return 'Consultar precio'
}

function formatRange(min: number | null, max: number | null): string | null {
  if (min && max && min !== max) return `${min}-${max}`
  if (min && max) return String(min)
  if (min) return String(min)
  if (max) return String(max)
  return null
}

export function DesarrolloCard({ desarrollo, onClick, onEdit, onDelete }: DesarrolloCardProps) {
  const disponibilidadStyle = DISPONIBILIDAD_COLORS[desarrollo.disponibilidad ?? '']
  const recamaras = formatRange(desarrollo.recamaras_min, desarrollo.recamaras_max)
  const banos = formatRange(desarrollo.banos_min, desarrollo.banos_max)
  const m2 = formatRange(desarrollo.m2_totales_min, desarrollo.m2_totales_max)

  return (
    <button
      onClick={() => onClick(desarrollo)}
      className="w-full text-left rounded-[var(--radius-lg)] border border-card-border group
        bg-card-bg dark:bg-glass-bg dark:border-glass-border
        dark:backdrop-blur-[var(--glass-blur)]
        shadow-sm hover:shadow-md dark:shadow-none
        hover:-translate-y-0.5 transition-all duration-200
        overflow-hidden cursor-pointer"
    >
      {/* Image */}
      {desarrollo.imagen_principal ? (
        <img src={desarrollo.imagen_principal} alt={desarrollo.nombre_kibah ?? ''} className="w-full h-36 object-cover" />
      ) : (
        <div className="w-full h-36 bg-bg-tertiary flex items-center justify-center">
          <span className="text-text-tertiary text-xs">Sin imagen</span>
        </div>
      )}

      <div className="p-4">
        {/* Admin actions */}
        <div className="flex items-center justify-end gap-1 mb-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit?.(desarrollo) }}
            className="p-1.5 rounded-[var(--radius-sm)] text-text-secondary hover:text-orange hover:bg-orange/10 transition-colors cursor-pointer"
            title="Editar"
          >
            <Pencil className="w-3.5 h-3.5" strokeWidth={1.5} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete?.(desarrollo) }}
            className="p-1.5 rounded-[var(--radius-sm)] text-text-secondary hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
            title="Eliminar"
          >
            <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
          </button>
        </div>

        {/* Badges */}
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          {disponibilidadStyle && desarrollo.disponibilidad && (
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${disponibilidadStyle.bg} ${disponibilidadStyle.text}`}>
              {desarrollo.disponibilidad}
            </span>
          )}
          {desarrollo.tipo_preventa && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-700 dark:text-blue-400">
              {toTitleCase(desarrollo.tipo_preventa)}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-sm font-semibold text-text-primary mb-0.5 line-clamp-1">
          {desarrollo.nombre_kibah || desarrollo.nombre_desarrollador || '—'}
        </h3>
        <p className="text-xs text-text-secondary mb-2">
          {toTitleCase(desarrollo.colonia)}
          {desarrollo.alcaldia ? `, ${toTitleCase(desarrollo.alcaldia)}` : ''}
        </p>

        {/* Price */}
        <p className="text-base font-bold text-text-primary mb-3">
          {formatPriceRange(desarrollo.precio_min, desarrollo.precio_max)}
        </p>

        {/* Specs */}
        <div className="flex items-center gap-4 text-text-secondary">
          {recamaras && (
            <div className="flex items-center gap-1.5">
              <Bed className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span className="text-xs">{recamaras}</span>
            </div>
          )}
          {banos && (
            <div className="flex items-center gap-1.5">
              <Bath className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span className="text-xs">{banos}</span>
            </div>
          )}
          {m2 && (
            <div className="flex items-center gap-1.5">
              <Ruler className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span className="text-xs">{m2} m²</span>
            </div>
          )}
        </div>
      </div>
    </button>
  )
}
