'use client'

import { useCallback, useEffect, useState } from 'react'
import { ArrowUp, ArrowDown, Loader2 } from 'lucide-react'
import type { ColumnVisibility } from '@/types'
import { Toast, type ToastType } from '@/components/ui/Toast'

const FILTER_TYPE_OPTIONS = [
  { value: 'none', label: 'Ninguno' },
  { value: 'select', label: 'Select' },
  { value: 'range', label: 'Rango' },
  { value: 'text', label: 'Texto' },
  { value: 'boolean', label: 'Sí/No' },
]

type EditableColumn = ColumnVisibility & { _dirty?: boolean }

export function ColumnVisibilityManager() {
  const [columns, setColumns] = useState<EditableColumn[]>([])
  const [original, setOriginal] = useState<ColumnVisibility[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null)

  const fetchColumns = useCallback(async () => {
    try {
      const res = await fetch('/api/column-visibility')
      if (!res.ok) throw new Error('Error al cargar')
      const data: ColumnVisibility[] = await res.json()
      setColumns(data.map((c) => ({ ...c })))
      setOriginal(data)
    } catch {
      setToast({ message: 'Error al cargar columnas', type: 'error' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchColumns()
  }, [fetchColumns])

  const hasChanges = columns.some((col, i) => {
    const orig = original.find((o) => o.id === col.id)
    if (!orig) return false
    return (
      col.visible_to_asesores !== orig.visible_to_asesores ||
      col.display_label !== orig.display_label ||
      col.display_order !== orig.display_order ||
      col.filter_type !== orig.filter_type
    )
  })

  const changedCount = columns.filter((col) => {
    const orig = original.find((o) => o.id === col.id)
    if (!orig) return false
    return (
      col.visible_to_asesores !== orig.visible_to_asesores ||
      col.display_label !== orig.display_label ||
      col.display_order !== orig.display_order ||
      col.filter_type !== orig.filter_type
    )
  }).length

  const updateColumn = (id: string, field: keyof EditableColumn, value: unknown) => {
    setColumns((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    )
  }

  const moveColumn = (index: number, direction: 'up' | 'down') => {
    const swapIndex = direction === 'up' ? index - 1 : index + 1
    if (swapIndex < 0 || swapIndex >= columns.length) return

    setColumns((prev) => {
      const next = [...prev]
      const aOrder = next[index].display_order
      const bOrder = next[swapIndex].display_order
      next[index] = { ...next[index], display_order: bOrder }
      next[swapIndex] = { ...next[swapIndex], display_order: aOrder }
      // Re-sort by display_order
      next.sort((a, b) => a.display_order - b.display_order)
      return next
    })
  }

  const handleSave = async () => {
    if (!hasChanges) {
      setToast({ message: 'No hay cambios', type: 'warning' })
      return
    }

    const visibleCount = columns.filter((c) => c.visible_to_asesores).length
    if (visibleCount === 0) {
      setToast({ message: 'Al menos 1 columna debe ser visible para asesores', type: 'error' })
      return
    }

    setSaving(true)
    try {
      const payload = columns.map((c) => ({
        id: c.id,
        visible_to_asesores: c.visible_to_asesores,
        display_label: c.display_label || c.column_name,
        display_order: c.display_order,
        filter_type: c.filter_type || 'none',
      }))

      const res = await fetch('/api/column-visibility', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Error al guardar')
      }

      setOriginal(columns.map((c) => ({ ...c })))
      setToast({ message: 'Cambios guardados', type: 'success' })
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : 'Error al guardar', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 text-text-tertiary animate-spin" strokeWidth={1.5} />
      </div>
    )
  }

  return (
    <div className="pb-20">
      {/* Column list */}
      <div className="space-y-2">
        {columns.map((col, index) => {
          const isChanged = (() => {
            const orig = original.find((o) => o.id === col.id)
            if (!orig) return false
            return (
              col.visible_to_asesores !== orig.visible_to_asesores ||
              col.display_label !== orig.display_label ||
              col.display_order !== orig.display_order ||
              col.filter_type !== orig.filter_type
            )
          })()

          return (
            <div
              key={col.id}
              className={`flex items-center gap-3 px-4 py-3 rounded-[var(--radius-sm)] border transition-opacity
                ${isChanged ? 'border-orange/40 bg-orange/5' : 'border-border-primary bg-bg-secondary'}
                ${!col.visible_to_asesores ? 'opacity-50' : ''}`}
            >
              {/* Reorder */}
              <div className="flex flex-col gap-0.5">
                <button
                  onClick={() => moveColumn(index, 'up')}
                  disabled={index === 0}
                  className="p-0.5 text-text-tertiary hover:text-text-primary disabled:opacity-20 cursor-pointer transition-colors"
                  title="Subir"
                >
                  <ArrowUp className="w-3.5 h-3.5" strokeWidth={1.5} />
                </button>
                <button
                  onClick={() => moveColumn(index, 'down')}
                  disabled={index === columns.length - 1}
                  className="p-0.5 text-text-tertiary hover:text-text-primary disabled:opacity-20 cursor-pointer transition-colors"
                  title="Bajar"
                >
                  <ArrowDown className="w-3.5 h-3.5" strokeWidth={1.5} />
                </button>
              </div>

              {/* Toggle visibility */}
              <button
                onClick={() => updateColumn(col.id, 'visible_to_asesores', !col.visible_to_asesores)}
                className={`relative w-9 h-5 rounded-full transition-colors cursor-pointer flex-shrink-0
                  ${col.visible_to_asesores ? 'bg-orange' : 'bg-bg-tertiary border border-border-primary'}`}
              >
                <span
                  className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform
                    ${col.visible_to_asesores ? 'translate-x-4' : 'translate-x-0.5'}`}
                />
              </button>

              {/* Column name (technical, read-only) */}
              <span className="text-xs text-text-tertiary font-mono w-40 flex-shrink-0 truncate" title={col.column_name}>
                {col.column_name}
              </span>

              {/* Display label (editable) */}
              <input
                value={col.display_label ?? ''}
                onChange={(e) => updateColumn(col.id, 'display_label', e.target.value)}
                placeholder={col.column_name}
                className="flex-1 h-8 px-2 text-sm rounded-[var(--radius-sm)] border border-border-primary
                  bg-bg-primary text-text-primary placeholder:text-text-tertiary
                  focus:outline-none focus:border-orange focus:ring-1 focus:ring-orange/30 min-w-0"
              />

              {/* Filter type */}
              <select
                value={col.filter_type ?? 'none'}
                onChange={(e) => updateColumn(col.id, 'filter_type', e.target.value)}
                className="h-8 px-2 text-xs rounded-[var(--radius-sm)] border border-border-primary
                  bg-bg-primary text-text-primary appearance-none cursor-pointer w-24 flex-shrink-0
                  focus:outline-none focus:border-orange focus:ring-1 focus:ring-orange/30"
              >
                {FILTER_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          )
        })}
      </div>

      {/* Sticky save bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-border-primary bg-bg-primary/90 backdrop-blur-md px-6 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="text-sm text-text-secondary">
            {hasChanges ? (
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange" />
                {changedCount} cambio{changedCount !== 1 ? 's' : ''} sin guardar
              </span>
            ) : (
              'Sin cambios pendientes'
            )}
          </div>
          <button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className="h-9 px-5 text-sm font-medium rounded-[var(--radius-sm)]
              bg-orange text-white hover:bg-orange-hover
              disabled:opacity-40 disabled:cursor-not-allowed
              transition-colors cursor-pointer"
          >
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}
