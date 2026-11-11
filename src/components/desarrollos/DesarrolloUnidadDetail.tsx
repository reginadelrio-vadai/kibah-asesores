'use client'

import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, Loader2, X } from 'lucide-react'
import type { Property } from '@/types'
import { PropertyDetail } from '@/components/properties/PropertyDetail'
import { usePermissions } from '@/hooks/usePermissions'
import { useColumnVisibility } from '@/hooks/useColumnVisibility'

interface DesarrolloUnidadDetailProps {
  desarrolloId: number
  idPropiedad: string
  onClose: () => void
}

/** Abre la ficha completa de una unidad (PropertyDetail) encima del detalle del desarrollo. Solo lectura. */
export function DesarrolloUnidadDetail({ desarrolloId, idPropiedad, onClose }: DesarrolloUnidadDetailProps) {
  const [property, setProperty] = useState<Property | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { permissions, loading: permsLoading } = usePermissions()
  const role = permissions._isAdmin ? 'admin' : 'asesor'
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
  }, [desarrolloId, idPropiedad])

  if (property && !permsLoading && !colsLoading) {
    return (
      <PropertyDetail
        property={property}
        role={role}
        onClose={onClose}
        visibleColumnNames={visibleColumnNames}
      />
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
