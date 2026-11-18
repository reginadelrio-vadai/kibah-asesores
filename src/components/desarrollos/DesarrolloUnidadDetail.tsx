'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AlertCircle, Loader2, X } from 'lucide-react'
import type { Property } from '@/types'
import { PropertyDetail } from '@/components/properties/PropertyDetail'
import { PropertyForm } from '@/components/properties/PropertyForm'
import { Toast, type ToastType } from '@/components/ui/Toast'
import { usePermissions } from '@/hooks/usePermissions'
import { useColumnVisibility } from '@/hooks/useColumnVisibility'

interface DesarrolloUnidadDetailProps {
  desarrolloId: number
  idPropiedad: string
  onClose: () => void
  /** Se llama al guardar cambios de la unidad, para refrescar la lista del desarrollo. */
  onUpdated?: () => void
}

/** Ficha completa de una unidad (PropertyDetail) encima del detalle del desarrollo, con "Editar" si hay permiso. */
export function DesarrolloUnidadDetail({ desarrolloId, idPropiedad, onClose, onUpdated }: DesarrolloUnidadDetailProps) {
  const [property, setProperty] = useState<Property | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<Property | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null)
  const { permissions, can, loading: permsLoading } = usePermissions()
  const role = permissions._isAdmin ? 'admin' : 'asesor'
  const canEdit = !permsLoading && can('propiedades.edit')
  const { visibleColumns, loading: colsLoading } = useColumnVisibility(role)
  const visibleColumnNames = useMemo(() => new Set(visibleColumns.map((c) => c.column_name)), [visibleColumns])

  useEffect(() => {
    const controller = new AbortController()
    fetch(`/api/desarrollos/${desarrolloId}/unidades/${encodeURIComponent(idPropiedad)}`, { signal: controller.signal })
      .then(async (res) => {
        const json = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(json.error ?? 'Error al cargar la unidad')
        setProperty(json.data as Property)
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') return
        setError(err instanceof Error ? err.message : 'Error desconocido')
      })
    return () => controller.abort()
  }, [desarrolloId, idPropiedad, reloadKey])

  // PropertyDetail llama onClose() y luego onEdit() en el mismo clic: si pidió editar, no cerramos la ficha.
  const editRequested = useRef(false)
  const handleDetailClose = useCallback(() => {
    editRequested.current = false
    queueMicrotask(() => { if (!editRequested.current) onClose() })
  }, [onClose])
  const handleEdit = useCallback((p: Property) => {
    editRequested.current = true
    setEditing(p)
  }, [])

  const toastEl = toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />

  if (editing) {
    return (
      <>
        <PropertyForm
          property={editing}
          onClose={() => setEditing(null)}
          onSuccess={() => {
            setEditing(null)
            setReloadKey((k) => k + 1)
            onUpdated?.()
          }}
          onToast={(message, type) => setToast({ message, type })}
        />
        {toastEl}
      </>
    )
  }

  if (property && !permsLoading && !colsLoading) {
    return (
      <>
        <PropertyDetail
          property={property}
          role={role}
          onClose={handleDetailClose}
          onEdit={canEdit ? handleEdit : undefined}
          visibleColumnNames={visibleColumnNames}
        />
        {toastEl}
      </>
    )
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative flex items-center gap-3 px-5 py-4 rounded-[16px] kibah-modal-solid border border-border-primary shadow-xl"
      >
        {error ? (
          <>
            <AlertCircle className="w-5 h-5 text-error flex-shrink-0" strokeWidth={1.5} />
            <p className="text-sm text-error">{error}</p>
            <button onClick={onClose} className="flex items-center justify-center w-8 h-8 rounded-[var(--radius-sm)] hover:bg-bg-tertiary cursor-pointer">
              <X className="w-4 h-4 text-text-secondary" strokeWidth={1.5} />
            </button>
          </>
        ) : (
          <>
            <Loader2 className="w-5 h-5 text-orange animate-spin" strokeWidth={1.5} />
            <p className="text-sm text-text-secondary">Cargando unidad...</p>
          </>
        )}
      </div>
    </div>
  )
}
