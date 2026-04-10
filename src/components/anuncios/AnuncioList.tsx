'use client'

import { useCallback, useEffect, useState } from 'react'
import { Megaphone, Trash2, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import type { ToastType } from '@/components/ui/Toast'
import { Toast } from '@/components/ui/Toast'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

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
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
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

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleDelete = async () => {
    if (!deleting) return
    setDeleteLoading(true)
    try {
      const res = await fetch(`/api/anuncios/${deleting.id}`, { method: 'DELETE' })
      if (res.ok || res.status === 204) {
        setToast({ message: 'Anuncio eliminado', type: 'success' })
        setDeleting(null)
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
          {isAdmin ? 'Publica un anuncio para tus asesores' : 'Aqui aparecerán los anuncios de Kibah'}
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-3">
        {anuncios.map((a) => {
          const expanded = expandedIds.has(a.id)
          const isLong = a.message.length > 200
          return (
            <div
              key={a.id}
              className={`px-4 py-3 rounded-[var(--radius-sm)] border transition-colors
                ${!a.is_read
                  ? 'border-blue-500/30 bg-blue-500/5'
                  : 'border-border-primary bg-bg-secondary'
                }`}
            >
              <div className="flex items-start gap-3">
                {/* Unread dot */}
                {!a.is_read && (
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className={`text-sm text-text-primary truncate ${!a.is_read ? 'font-bold' : 'font-medium'}`}>
                      {a.title}
                    </h3>
                    {a.priority === 'urgente' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/15 text-red-600 dark:text-red-400 flex-shrink-0">
                        Urgente
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-text-secondary whitespace-pre-wrap">
                    {isLong && !expanded ? a.message.slice(0, 200) + '...' : a.message}
                  </p>

                  {isLong && (
                    <button
                      onClick={() => toggleExpand(a.id)}
                      className="flex items-center gap-1 text-xs text-orange hover:text-orange-hover mt-1 cursor-pointer transition-colors"
                    >
                      {expanded ? <><ChevronUp className="w-3 h-3" strokeWidth={1.5} /> Ver menos</> : <><ChevronDown className="w-3 h-3" strokeWidth={1.5} /> Ver mas</>}
                    </button>
                  )}

                  <p className="text-[10px] text-text-tertiary mt-2">{timeAgo(a.created_at)}</p>
                </div>

                {/* Admin delete */}
                {isAdmin && (
                  <button
                    onClick={() => setDeleting(a)}
                    className="p-1.5 rounded-[var(--radius-sm)] text-text-secondary hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer flex-shrink-0"
                    title="Eliminar"
                  >
                    <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

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
