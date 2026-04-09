'use client'

import { useCallback, useEffect, useState } from 'react'
import { Users, Trash2, Loader2 } from 'lucide-react'
import type { Profile } from '@/types'
import type { ToastType } from '@/components/ui/Toast'
import { Toast } from '@/components/ui/Toast'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' })
}

interface AsesorListProps {
  onCreateClick: () => void
  refreshKey: number
}

export function AsesorList({ onCreateClick, refreshKey }: AsesorListProps) {
  const [asesores, setAsesores] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<Profile | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null)

  const fetchAsesores = useCallback(async () => {
    try {
      const res = await fetch('/api/asesores')
      if (!res.ok) return
      const json = await res.json()
      setAsesores(json.data ?? [])
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAsesores()
  }, [fetchAsesores, refreshKey])

  const showToast = useCallback((message: string, type: ToastType) => {
    setToast({ message, type })
  }, [])

  const handleToggle = async (asesor: Profile) => {
    try {
      const res = await fetch(`/api/asesores/${asesor.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !asesor.is_active }),
      })
      if (res.ok) {
        setAsesores((prev) =>
          prev.map((a) => a.id === asesor.id ? { ...a, is_active: !a.is_active } : a)
        )
        showToast(asesor.is_active ? 'Asesor desactivado' : 'Asesor activado', 'success')
      } else {
        const body = await res.json().catch(() => ({}))
        showToast(body.error || 'Error al cambiar estado', 'error')
      }
    } catch {
      showToast('Error de conexión', 'error')
    }
  }

  const handleDelete = async () => {
    if (!deleting) return
    setDeleteLoading(true)
    try {
      const res = await fetch(`/api/asesores/${deleting.id}`, { method: 'DELETE' })
      if (res.ok || res.status === 204) {
        showToast('Asesor eliminado', 'success')
        setDeleting(null)
        fetchAsesores()
      } else {
        const body = await res.json().catch(() => ({}))
        showToast(body.error || 'Error al eliminar', 'error')
      }
    } catch {
      showToast('Error de conexión', 'error')
    } finally {
      setDeleteLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 text-text-tertiary animate-spin" strokeWidth={1.5} />
      </div>
    )
  }

  if (asesores.length === 0) {
    return (
      <>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Users className="w-12 h-12 text-text-tertiary mb-4" strokeWidth={1.5} />
          <h2 className="text-base font-semibold text-text-primary mb-1">No hay asesores registrados</h2>
          <p className="text-sm text-text-secondary mb-4">Crea uno para que pueda acceder a la plataforma</p>
          <button onClick={onCreateClick} className="h-9 px-4 text-sm font-medium rounded-[var(--radius-sm)] bg-orange text-white hover:bg-orange-hover transition-colors cursor-pointer">
            Crear Asesor
          </button>
        </div>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </>
    )
  }

  return (
    <>
      <div className="space-y-3">
        {asesores.map((asesor) => (
          <div
            key={asesor.id}
            className={`flex items-center gap-4 px-4 py-3 rounded-[var(--radius-sm)] border border-border-primary bg-bg-secondary transition-opacity
              ${!asesor.is_active ? 'opacity-50' : ''}`}
          >
            {/* Toggle */}
            <button
              onClick={() => handleToggle(asesor)}
              className={`relative w-9 h-5 rounded-full transition-colors cursor-pointer flex-shrink-0
                ${asesor.is_active ? 'bg-orange' : 'bg-bg-tertiary border border-border-primary'}`}
            >
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform
                ${asesor.is_active ? 'translate-x-4' : 'translate-x-0.5'}`} />
            </button>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-sm font-medium text-text-primary truncate">{asesor.full_name}</span>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full
                  ${asesor.is_active
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                    : 'bg-red-500/15 text-red-700 dark:text-red-400'
                  }`}>
                  {asesor.is_active ? 'Activo' : 'Desactivado'}
                </span>
              </div>
              <p className="text-xs text-text-tertiary truncate">{asesor.email}</p>
            </div>

            {/* Meta */}
            <span className="text-[10px] text-text-tertiary flex-shrink-0">
              {timeAgo(asesor.created_at)}
            </span>

            {/* Delete */}
            <button
              onClick={() => setDeleting(asesor)}
              className="p-1.5 rounded-[var(--radius-sm)] text-text-secondary hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer flex-shrink-0"
              title="Eliminar"
            >
              <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
            </button>
          </div>
        ))}
      </div>

      {deleting && (
        <ConfirmDialog
          title="Eliminar Asesor"
          message={`¿Estás seguro de eliminar a "${deleting.full_name}" (${deleting.email})? Se eliminará su cuenta por completo.`}
          confirmLabel="Eliminar"
          variant="danger"
          loading={deleteLoading}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  )
}
