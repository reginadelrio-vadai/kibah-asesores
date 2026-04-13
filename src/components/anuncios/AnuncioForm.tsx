'use client'

import { useEffect, useState } from 'react'
import { X, Check } from 'lucide-react'

interface Asesor {
  id: string
  full_name: string
  role: string
}

interface AnuncioFormProps {
  onClose: () => void
  onSuccess: () => void
  onToast: (message: string, type: 'success' | 'error') => void
}

export function AnuncioForm({ onClose, onSuccess, onToast }: AnuncioFormProps) {
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [priority, setPriority] = useState('normal')
  const [targetType, setTargetType] = useState<'all' | 'specific'>('all')
  const [asesores, setAsesores] = useState<Asesor[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetch('/api/asesores')
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((json) => {
        const list: Asesor[] = (json.data ?? []).filter((a: Asesor) => a.role !== 'admin')
        setAsesores(list)
      })
      .catch(() => {})
  }, [])

  const toggleAsesor = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !message.trim()) {
      onToast('Titulo y mensaje son requeridos', 'error')
      return
    }
    if (targetType === 'specific' && selectedIds.size === 0) {
      onToast('Selecciona al menos un asesor', 'error')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/anuncios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          message: message.trim(),
          priority,
          target_type: targetType,
          target_user_ids: targetType === 'specific' ? Array.from(selectedIds) : [],
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        onToast(body.error || 'Error al publicar', 'error')
        return
      }
      onToast('Anuncio publicado', 'success')
      onSuccess()
      onClose()
    } catch {
      onToast('Error de conexion', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[80]">
      <div
        className="absolute inset-0 bg-black/50"
        style={{ backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
        onClick={onClose}
      />
      <div className="absolute inset-0 overflow-y-auto flex items-start justify-center">
        <div className="relative kibah-modal-solid border border-border-primary w-full max-w-md shadow-2xl my-8 mx-4" style={{ borderRadius: '16px' }}>
          <div className="flex items-center justify-between px-6 py-4 border-b border-border-primary">
            <h2 className="text-base font-semibold text-text-primary">Nuevo Anuncio</h2>
            <button onClick={onClose} className="cursor-pointer text-text-tertiary hover:text-text-primary transition-colors">
              <X className="w-5 h-5" strokeWidth={1.5} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Titulo *</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value.slice(0, 100))}
                placeholder="Titulo del anuncio"
                className="kibah-input"
              />
              <p className="text-[10px] text-text-tertiary mt-0.5 text-right">{title.length}/100</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Mensaje *</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                placeholder="Escribe el mensaje..."
                className="kibah-input resize-none"
                style={{ height: 'auto', padding: '8px 12px' }}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Prioridad</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="kibah-input"
              >
                <option value="normal">Normal</option>
                <option value="urgente">Urgente</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-2">Destinatarios</label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="target"
                    checked={targetType === 'all'}
                    onChange={() => setTargetType('all')}
                    className="accent-orange"
                  />
                  <span className="text-sm text-text-primary">Todos los asesores</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="target"
                    checked={targetType === 'specific'}
                    onChange={() => setTargetType('specific')}
                    className="accent-orange"
                  />
                  <span className="text-sm text-text-primary">Asesores específicos</span>
                </label>
              </div>

              {targetType === 'specific' && (
                <div className="mt-3 max-h-48 overflow-y-auto border border-border-primary rounded-[var(--radius-sm)] p-2 space-y-1">
                  {asesores.length === 0 ? (
                    <p className="text-xs text-text-tertiary p-2">No hay asesores disponibles</p>
                  ) : (
                    asesores.map((a) => {
                      const checked = selectedIds.has(a.id)
                      return (
                        <button
                          type="button"
                          key={a.id}
                          onClick={() => toggleAsesor(a.id)}
                          className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-bg-tertiary transition-colors text-left cursor-pointer"
                        >
                          <span
                            className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${checked ? 'bg-orange border-orange' : 'border-border-primary'}`}
                          >
                            {checked && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                          </span>
                          <span className="text-sm text-text-primary truncate">{a.full_name}</span>
                        </button>
                      )
                    })
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-border-primary">
              <button type="button" onClick={onClose} className="kibah-btn-secondary" style={{ padding: '8px 16px', fontSize: '13px' }}>
                Cancelar
              </button>
              <button type="submit" disabled={submitting} className="kibah-btn-primary" style={{ padding: '8px 20px', fontSize: '13px' }}>
                {submitting ? 'Publicando...' : 'Publicar Anuncio'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
