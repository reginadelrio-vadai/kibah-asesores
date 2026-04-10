'use client'

import { useCallback, useEffect, useState } from 'react'
import { Megaphone, Loader2 } from 'lucide-react'
import type { ToastType } from '@/components/ui/Toast'
import { Toast } from '@/components/ui/Toast'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { AnuncioDetail } from './AnuncioDetail'

interface Anuncio {
  id: string
  title: string
  message: string
  priority: 'normal' | 'urgente'
  created_at: string
  is_read: boolean
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Justo ahora'
  if (mins < 60) return `Hace ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `Hace ${hours}h`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'Ayer'
  return `Hace ${days} dias`
}

interface AnuncioListProps {
  isAdmin: boolean
  refreshKey: number
}

export function AnuncioList({ isAdmin, refreshKey }: AnuncioListProps) {
  const [anuncios, setAnuncios] = useState<Anuncio[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Anuncio | null>(null)
  const [deleting, setDeleting] = useState<Anuncio | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null)

  const fetchAnuncios = useCallback(async () => {
    try {
      const res = await fetch('/api/anuncios')
      if (!res.ok) return
      const json = await res.json()
      setAnuncios(json.data ?? [])
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAnuncios()
  }, [fetchAnuncios, refreshKey])

  // Mark all as read on mount
  useEffect(() => {
    if (anuncios.length === 0) return
    const unreadIds = anuncios.filter((a) => !a.is_read).map((a) => a.id)
    if (unreadIds.length === 0) return

    fetch('/api/anuncios/read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ anuncioIds: unreadIds }),
    }).catch(() => {})
  }, [anuncios])

  const handleDelete = async () => {
    if (!deleting) return
    setDeleteLoading(true)
    try {
      const res = await fetch(`/api/anuncios/${deleting.id}`, { method: 'DELETE' })
      if (res.ok || res.status === 204) {
        setToast({ message: 'Anuncio eliminado', type: 'success' })
        setDeleting(null)
        setSelected(null)
        fetchAnuncios()
      } else {
        setToast({ message: 'Error al eliminar', type: 'error' })
      }
    } catch {
      setToast({ message: 'Error de conexion', type: 'error' })
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

  if (anuncios.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Megaphone className="w-12 h-12 text-text-tertiary mb-4" strokeWidth={1.5} />
        <h2 className="text-base font-semibold text-text-primary mb-1">No hay anuncios</h2>
        <p className="text-sm text-text-secondary">
          {isAdmin ? 'Publica un anuncio para tus asesores' : 'Aqui apareceran los anuncios de Kibah'}
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-2">
        {anuncios.map((a) => (
          <button
            key={a.id}
            onClick={() => setSelected(a)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-[var(--radius-sm)] border text-left transition-colors cursor-pointer
              ${!a.is_read
                ? 'border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10'
                : 'border-border-primary bg-bg-secondary hover:bg-bg-tertiary/50'
              }`}
          >
            {!a.is_read && (
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500 flex-shrink-0" />
            )}
            <h3 className={`text-sm text-text-primary truncate flex-1 ${!a.is_read ? 'font-bold' : 'font-medium'}`}>
              {a.title}
            </h3>
            {a.priority === 'urgente' && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/15 text-red-600 dark:text-red-400 flex-shrink-0">
                Urgente
              </span>
            )}
            <span className="text-[10px] text-text-tertiary flex-shrink-0">{timeAgo(a.created_at)}</span>
          </button>
        ))}
      </div>

      {selected && (
        <AnuncioDetail
          anuncio={selected}
          isAdmin={isAdmin}
          onClose={() => setSelected(null)}
          onDelete={(a) => { setSelected(null); setDeleting(a) }}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title="Eliminar Anuncio"
          message={`Eliminar "${deleting.title}"? Esta accion no se puede deshacer.`}
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
