'use client'

import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import type { Property, ColumnVisibility } from '@/types'
import { formatPrice, formatM2, displayValue, capitalize, formatComision } from '@/lib/utils/format'
import { DISPONIBILIDAD_COLORS, TIPO_PREVENTA_COLORS } from '@/lib/utils/constants'

interface PropertyTableProps {
  properties: Property[]
  loading: boolean
  columns: ColumnVisibility[]
  sortConfig: { column: string; order: 'asc' | 'desc' }
  onSort: (column: string) => void
  onSelect: (property: Property) => void
}

function formatCell(columnName: string, value: unknown, property: Property): React.ReactNode {
  const str = value as string | number | null

  switch (columnName) {
    case 'nombre_kibah':
      return displayValue((property.nombre_kibah || property.nombre_desarrollador) as string | null)
    case 'precio_unidad':
      return formatPrice(str)
    case 'm2_totales':
    case 'm2_habitables':
    case 'm2_exteriores':
    case 'm2_roof_garden':
      return formatM2(str)
    case 'pct_comision':
      return formatComision(str as number | null)
    case 'tipo_preventa':
      return capitalize(str as string | null)
    case 'disponibilidad': {
      const colors = DISPONIBILIDAD_COLORS[str as string] ?? null
      if (!str) return '—'
      if (colors) {
        return (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>
            {str as string}
          </span>
        )
      }
      return displayValue(str)
    }
    default:
      return displayValue(str)
  }
}

function SkeletonRow({ cols }: { cols: number }) {
  return (
    <tr className="border-b border-border-primary">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-bg-tertiary rounded animate-pulse w-3/4" />
        </td>
      ))}
    </tr>
  )
}

export function PropertyTable({
  properties,
  loading,
  columns,
  sortConfig,
  onSort,
  onSelect,
}: PropertyTableProps) {
  const visibleCols = columns
    .filter(
      (c) => c.column_name !== 'id_propiedad' && c.column_name !== 'created_at'
    )
    .map((c) =>
      c.column_name === 'nombre_desarrollador'
        ? { ...c, column_name: 'nombre_kibah', display_label: 'Nombre Kibah' }
        : c
    )

  if (loading && properties.length === 0) {
    return (
      <div className="overflow-x-auto rounded-[var(--radius-sm)] border border-border-primary">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-primary bg-bg-tertiary">
              {visibleCols.slice(0, 8).map((col) => (
                <th key={col.id} className="px-4 py-3 text-left text-xs font-semibold text-text-secondary">
                  {col.display_label ?? col.column_name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonRow key={i} cols={8} />
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-[var(--radius-sm)] border border-border-primary">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border-primary bg-bg-tertiary">
            {visibleCols.map((col) => {
              const isSorted = sortConfig.column === col.column_name
              return (
                <th
                  key={col.id}
                  className="px-4 py-3 text-left text-xs font-semibold text-text-secondary whitespace-nowrap cursor-pointer hover:text-text-primary transition-colors select-none"
                  onClick={() => onSort(col.column_name)}
                >
                  <span className="flex items-center gap-1">
                    {col.display_label ?? col.column_name}
                    {isSorted ? (
                      sortConfig.order === 'asc' ? (
                        <ArrowUp className="w-3 h-3" />
                      ) : (
                        <ArrowDown className="w-3 h-3" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3 h-3 opacity-30" />
                    )}
                  </span>
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {properties.map((property) => (
            <tr
              key={property.id}
              onClick={() => onSelect(property)}
              className="border-b border-border-primary hover:bg-bg-tertiary/50 cursor-pointer transition-colors"
            >
              {visibleCols.map((col) => (
                <td
                  key={col.id}
                  className="px-4 py-3 text-text-primary whitespace-nowrap max-w-[200px] truncate"
                >
                  {formatCell(
                    col.column_name,
                    property[col.column_name as keyof Property],
                    property
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
