'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

interface AnuncioFormProps {
  onClose: () => void
  onSuccess: () => void
  onToast: (message: string, type: 'success' | 'error') => void
}

export function AnuncioForm({ onClose, onSuccess, onToast }: AnuncioFormProps) {
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [priority, setPriority] = useState('normal')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !message.trim()) {
      onToast('Titulo y mensaje son requeridos', 'error')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/anuncios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), message: message.trim(), priority }),
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
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute inset-0 overflow-y-auto flex items-start justify-center">
        <div className="relative bg-bg-primary border border-border-primary rounded-[var(--radius-lg)] w-full max-w-md shadow-2xl my-8 mx-4">
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
                className="w-full h-9 px-3 text-sm rounded-[var(--radius-sm)] border border-border-primary bg-bg-primary text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-orange focus:ring-1 focus:ring-orange/30"
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
                className="w-full px-3 py-2 text-sm rounded-[var(--radius-sm)] border border-border-primary bg-bg-primary text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-orange focus:ring-1 focus:ring-orange/30 resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Prioridad</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full h-9 px-3 text-sm rounded-[var(--radius-sm)] border border-border-primary bg-bg-primary text-text-primary appearance-none cursor-pointer focus:outline-none focus:border-orange"
              >
                <option value="normal">Normal</option>
                <option value="urgente">Urgente</option>
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-border-primary">
              <button type="button" onClick={onClose} className="h-9 px-4 text-sm font-medium rounded-[var(--radius-sm)] bg-bg-tertiary text-text-primary hover:bg-border-primary transition-colors cursor-pointer">
                Cancelar
              </button>
              <button type="submit" disabled={submitting} className="h-9 px-5 text-sm font-medium rounded-[var(--radius-sm)] bg-orange text-white hover:bg-orange-hover disabled:opacity-50 transition-colors cursor-pointer">
                {submitting ? 'Publicando...' : 'Publicar Anuncio'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
