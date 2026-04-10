'use client'

import { Pencil, Trash2 } from 'lucide-react'
import type { Desarrollo } from '@/types/desarrollo'
import { DISPONIBILIDAD_COLORS } from '@/lib/utils/constants'
import { toTitleCase } from '@/lib/utils/format'

interface DesarrolloTableProps {
  desarrollos: Desarrollo[]
  loading: boolean
  onSelect: (d: Desarrollo) => void
  onEdit?: (d: Desarrollo) => void
  onDelete?: (d: Desarrollo) => void
}

function formatPriceShort(min: number | null, max: number | null): string {
  const fmt = (n: number) => {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
    if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
    return `$${n}`
  }
  if (min && max && min !== max) return `${fmt(min)} - ${fmt(max)}`
  if (min && max) return fmt(min)
  if (min) return fmt(min)
  if (max) return fmt(max)
  return '—'
}

function formatRange(min: number | null, max: number | null): string {
  if (min && max && min !== max) return `${min}-${max}`
  if (min) return String(min)
  if (max) return String(max)
  return '—'
}

function SkeletonRow() {
  return (
    <tr className="border-b border-border-primary">
      {Array.from({ length: 7 }).map((_, i) => (
        <td key={i} className="px-4 py-3"><div className="h-4 bg-bg-tertiary rounded animate-pulse w-3/4" /></td>
      ))}
    </tr>
  )
}

export function DesarrolloTable({ desarrollos, loading, onSelect, onEdit, onDelete }: DesarrolloTableProps) {
  if (loading && desarrollos.length === 0) {
    return (
      <div className="overflow-x-auto rounded-[var(--radius-sm)] border border-border-primary">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-primary bg-bg-tertiary">
              <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary">Nombre</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary">Colonia</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary">Precio</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary">Recámaras</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary">Disponibilidad</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary">Preventa</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-text-secondary w-24">Acciones</th>
            </tr>
          </thead>
          <tbody>{Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)}</tbody>
        </table>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-[var(--radius-sm)] border border-border-primary">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border-primary bg-bg-tertiary">
            <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary">Nombre</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary">Colonia</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary">Precio</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary">Recámaras</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary">Disponibilidad</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary">Preventa</th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-text-secondary w-24">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {desarrollos.map((d) => {
            const dispColors = DISPONIBILIDAD_COLORS[d.disponibilidad ?? '']
            return (
              <tr key={d.id} onClick={() => onSelect(d)} className="border-b border-border-primary hover:bg-bg-tertiary/50 cursor-pointer transition-colors group">
                <td className="px-4 py-3 text-text-primary whitespace-nowrap max-w-[200px] truncate">
                  <div className="flex items-center gap-2">
                    {d.imagen_principal ? (
                      <img src={d.imagen_principal} alt="" className="w-8 h-8 rounded object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-8 h-8 rounded bg-bg-tertiary flex-shrink-0" />
                    )}
                    <span className="truncate">{d.nombre_kibah || d.nombre_desarrollador || '—'}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-text-primary whitespace-nowrap">{toTitleCase(d.colonia)}</td>
                <td className="px-4 py-3 text-text-primary whitespace-nowrap">{formatPriceShort(d.precio_min, d.precio_max)}</td>
                <td className="px-4 py-3 text-text-primary whitespace-nowrap">{formatRange(d.recamaras_min, d.recamaras_max)}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {dispColors && d.disponibilidad ? (
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${dispColors.bg} ${dispColors.text}`}>{d.disponibilidad}</span>
                  ) : (d.disponibilidad || '—')}
                </td>
                <td className="px-4 py-3 text-text-primary whitespace-nowrap">{d.tipo_preventa || '—'}</td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 md:transition-opacity">
                    <button onClick={(e) => { e.stopPropagation(); onEdit?.(d) }} className="p-1.5 rounded-[var(--radius-sm)] text-text-secondary hover:text-orange hover:bg-orange/10 transition-colors cursor-pointer" title="Editar">
                      <Pencil className="w-3.5 h-3.5" strokeWidth={1.5} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onDelete?.(d) }} className="p-1.5 rounded-[var(--radius-sm)] text-text-secondary hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer" title="Eliminar">
                      <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
