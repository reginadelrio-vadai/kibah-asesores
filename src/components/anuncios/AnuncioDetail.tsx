'use client'

import { useCallback, useEffect } from 'react'
import { X, Trash2 } from 'lucide-react'

interface Anuncio {
  id: string
  title: string
  message: string
  priority: 'normal' | 'urgente'
  created_at: string
  is_read: boolean
  author_name?: string
}

interface AnuncioDetailProps {
  anuncio: Anuncio
  isAdmin: boolean
  onClose: () => void
  onDelete?: (anuncio: Anuncio) => void
}

function formatFullDate(dateStr: string): string {
  const d = new Date(dateStr)
  const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
  const hours = d.getHours()
  const mins = d.getMinutes().toString().padStart(2, '0')
  const ampm = hours >= 12 ? 'PM' : 'AM'
  const h12 = hours % 12 || 12
  return `${d.getDate()} de ${months[d.getMonth()]} de ${d.getFullYear()}, ${h12}:${mins} ${ampm}`
}

export function AnuncioDetail({ anuncio, isAdmin, onClose, onDelete }: AnuncioDetailProps) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
  }, [onClose])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [handleKeyDown])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[600px] max-h-[80vh] overflow-y-auto
          bg-bg-secondary dark:bg-glass-bg dark:backdrop-blur-[var(--glass-blur)]
          border border-border-primary dark:border-glass-border
          rounded-[20px] shadow-xl"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-border-primary bg-bg-secondary dark:bg-glass-bg">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <h2 className="text-base font-semibold text-text-primary truncate">{anuncio.title}</h2>
            {anuncio.priority === 'urgente' && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/15 text-red-600 dark:text-red-400 flex-shrink-0">
                Urgente
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {isAdmin && onDelete && (
              <button
                onClick={() => { onClose(); onDelete(anuncio) }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-text-secondary bg-bg-tertiary rounded-[var(--radius-sm)] hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} /> Eliminar
              </button>
            )}
            <button onClick={onClose} className="flex items-center justify-center w-8 h-8 rounded-[var(--radius-sm)] hover:bg-bg-tertiary transition-colors cursor-pointer">
              <X className="w-4 h-4 text-text-secondary" strokeWidth={1.5} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <div className="flex items-center gap-2 text-xs text-text-tertiary mb-4">
            <span>{formatFullDate(anuncio.created_at)}</span>
            {anuncio.author_name && <><span>·</span><span>Enviado por: {anuncio.author_name}</span></>}
          </div>
          <p className="text-sm text-text-primary whitespace-pre-wrap leading-relaxed">{anuncio.message}</p>
        </div>
      </div>
    </div>
  )
}
