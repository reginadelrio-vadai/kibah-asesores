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

  const handleRoleUpdated = (id: string, newRole: string) => {
    setAsesores((prev) => prev.map((a) => (a.id === id ? { ...a, role: newRole as Profile['role'] } : a)))
    if (selected?.id === id) {
      setSelected((prev) => (prev ? { ...prev, role: newRole as Profile['role'] } : prev))
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
          <Users className="w-12 h-12 kibah-empty-icon mb-4" strokeWidth={1.5} />
          <h2 className="text-base font-semibold text-text-primary mb-1">No hay asesores registrados</h2>
          <p className="text-sm text-text-secondary mb-4">Crea uno para que pueda acceder a la plataforma</p>
          <button onClick={onCreateClick} className="kibah-btn-primary" style={{ padding: '8px 16px', fontSize: '13px' }}>
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
            className={`kibah-card w-full text-left p-5 cursor-pointer ${!asesor.is_active ? 'opacity-60' : ''}`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="kibah-card-title truncate">{asesor.full_name}</h3>
                <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                  <span className={`kibah-badge ${asesor.is_active ? 'kibah-badge-active' : 'kibah-badge-inactive'}`}>
                    {asesor.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                  {asesor.role && (
                    <span className="kibah-badge kibah-badge-preventa">{asesor.role}</span>
                  )}
                </div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); handleToggle(asesor) }}
                className={`kibah-toggle ${asesor.is_active ? 'kibah-toggle-on' : 'kibah-toggle-off'}`}
                title={asesor.is_active ? 'Desactivar' : 'Activar'}
              >
                <span className="kibah-toggle-thumb" />
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
          onRoleUpdated={handleRoleUpdated}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  )
}
