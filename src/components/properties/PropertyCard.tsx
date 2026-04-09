'use client'

import { Bed, Bath, Ruler, Pencil, Trash2 } from 'lucide-react'
import type { Property, UserRole } from '@/types'
import { formatPrice, displayValue } from '@/lib/utils/format'
import { DISPONIBILIDAD_COLORS, TIPO_PREVENTA_COLORS } from '@/lib/utils/constants'
import { capitalize } from '@/lib/utils/format'

interface PropertyCardProps {
  property: Property
  onClick: (property: Property) => void
  role?: UserRole
  onEdit?: (property: Property) => void
  onDelete?: (property: Property) => void
}

export function PropertyCard({ property, onClick, role, onEdit, onDelete }: PropertyCardProps) {
  const isAdmin = role === 'admin'
  const disponibilidadStyle =
    DISPONIBILIDAD_COLORS[property.disponibilidad ?? '']
  const tipoPreventaStyle =
    TIPO_PREVENTA_COLORS[property.tipo_preventa ?? '']

  return (
    <button
      onClick={() => onClick(property)}
      className="w-full text-left rounded-[var(--radius-lg)] border border-card-border group
        bg-card-bg dark:bg-glass-bg dark:border-glass-border
        dark:backdrop-blur-[var(--glass-blur)]
        shadow-sm hover:shadow-md dark:shadow-none
        hover:-translate-y-0.5 transition-all duration-200
        p-5 cursor-pointer"
    >
      {/* Admin actions */}
      {isAdmin && (
        <div className="flex items-center justify-end gap-1 mb-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit?.(property) }}
            className="p-1.5 rounded-[var(--radius-sm)] text-text-secondary hover:text-orange hover:bg-orange/10 transition-colors cursor-pointer"
            title="Editar"
          >
            <Pencil className="w-3.5 h-3.5" strokeWidth={1.5} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete?.(property) }}
            className="p-1.5 rounded-[var(--radius-sm)] text-text-secondary hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
            title="Eliminar"
          >
            <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
          </button>
        </div>
      )}

      {/* Badges */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        {disponibilidadStyle && property.disponibilidad && (
          <span
            className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${disponibilidadStyle.bg} ${disponibilidadStyle.text}`}
          >
            {property.disponibilidad}
          </span>
        )}
        {tipoPreventaStyle && property.tipo_preventa && (
          <span
            className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${tipoPreventaStyle.bg} ${tipoPreventaStyle.text}`}
          >
            {capitalize(property.tipo_preventa)}
          </span>
        )}
      </div>

      {/* Title */}
      <h3 className="text-sm font-semibold text-text-primary mb-0.5 line-clamp-1">
        {displayValue(property.nombre_kibah || property.nombre_desarrollador)}
      </h3>
      {property.unidad && (
        <p className="text-xs text-text-tertiary mb-1">
          {property.unidad}
        </p>
      )}
      <p className="text-xs text-text-secondary mb-3">
        {displayValue(property.colonia)}
        {property.alcaldia ? `, ${property.alcaldia}` : ''}
      </p>

      {/* Price */}
      <p className="text-lg font-bold text-text-primary mb-4">
        {formatPrice(property.precio_unidad)}
      </p>

      {/* Features */}
      <div className="flex items-center gap-4 text-text-secondary">
        {property.num_recamaras && (
          <div className="flex items-center gap-1.5">
            <Bed className="w-3.5 h-3.5" strokeWidth={1.5} />
            <span className="text-xs">{property.num_recamaras}</span>
          </div>
        )}
        {property.num_banos && (
          <div className="flex items-center gap-1.5">
            <Bath className="w-3.5 h-3.5" strokeWidth={1.5} />
            <span className="text-xs">{property.num_banos}</span>
          </div>
        )}
        {property.m2_totales && (
          <div className="flex items-center gap-1.5">
            <Ruler className="w-3.5 h-3.5" strokeWidth={1.5} />
            <span className="text-xs">{property.m2_totales} m²</span>
          </div>
        )}
      </div>
    </button>
  )
}
