'use client'

import { useCallback, useEffect, useState } from 'react'
import { Users, Loader2 } from 'lucide-react'
import type { Profile } from '@/types'
import type { ToastType } from '@/components/ui/Toast'
import { Toast } from '@/components/ui/Toast'
import { AsesorDetail } from './AsesorDetail'

interface AsesorListProps {
  onCreateClick: () => void
  refreshKey: number
}

export function AsesorList({ onCreateClick, refreshKey }: AsesorListProps) {
  const [asesores, setAsesores] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Profile | null>(null)
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
        const updated = { ...asesor, is_active: !asesor.is_active }
        setAsesores((prev) => prev.map((a) => a.id === asesor.id ? updated : a))
        if (selected?.id === asesor.id) setSelected(updated)
        showToast(asesor.is_active ? 'Asesor desactivado' : 'Asesor activado', 'success')
      } else {
        const body = await res.json().catch(() => ({}))
        showToast(body.error || 'Error al cambiar estado', 'error')
      }
    } catch {
      showToast('Error de conexión', 'error')
    }
  }

  const handleDelete = () => {
    setSelected(null)
    fetchAsesores()
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {asesores.map((asesor) => (
          <button
            key={asesor.id}
            onClick={() => setSelected(asesor)}
            className={`w-full text-left rounded-[var(--radius-lg)] border border-card-border group
              bg-card-bg dark:bg-glass-bg dark:border-glass-border
              dark:backdrop-blur-[var(--glass-blur)]
              shadow-sm hover:shadow-md dark:shadow-none
              hover:-translate-y-0.5 transition-all duration-200
              p-5 cursor-pointer
              ${!asesor.is_active ? 'opacity-60' : ''}`}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-text-primary truncate flex-1 mr-3">
                {asesor.full_name}
              </h3>
              <button
                onClick={(e) => { e.stopPropagation(); handleToggle(asesor) }}
                className={`relative w-9 h-5 rounded-full transition-colors cursor-pointer flex-shrink-0
                  ${asesor.is_active ? 'bg-orange' : 'bg-bg-tertiary border border-border-primary'}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform
                  ${asesor.is_active ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </button>
            </div>
          </button>
        ))}
      </div>

      {selected && (
        <AsesorDetail
          asesor={selected}
          onClose={() => setSelected(null)}
          onToggle={handleToggle}
          onDelete={handleDelete}
          onToast={showToast}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  )
}
