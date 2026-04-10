'use client'

import { useCallback, useEffect } from 'react'
import { X, Pencil, Trash2, MapPin } from 'lucide-react'
import type { CalendarEvent } from '@/lib/google/calendar'

interface EventDetailProps {
  event: CalendarEvent
  onClose: () => void
  onEdit: (event: CalendarEvent) => void
  onDelete: (event: CalendarEvent) => void
}

function formatEventDate(start: string, end: string, allDay: boolean): string {
  const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
  const days = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado']

  const s = new Date(start)
  const dayName = days[s.getDay()]
  const dateStr = `${dayName} ${s.getDate()} de ${months[s.getMonth()]}`

  if (allDay) return `${dateStr} — Todo el dia`

  const fmt = (d: Date) => {
    const h = d.getHours(), m = d.getMinutes().toString().padStart(2, '0')
    const ampm = h >= 12 ? 'PM' : 'AM'
    return `${h % 12 || 12}:${m} ${ampm}`
  }
  return `${dateStr}, ${fmt(s)} - ${fmt(new Date(end))}`
}

export function EventDetail({ event, onClose, onEdit, onDelete }: EventDetailProps) {
  const handleKey = useCallback((e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }, [onClose])

  useEffect(() => {
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [handleKey])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div onClick={(e) => e.stopPropagation()} className="relative w-full max-w-md bg-bg-secondary dark:bg-glass-bg border border-border-primary dark:border-glass-border rounded-[20px] shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-primary">
          <h2 className="text-base font-semibold text-text-primary truncate flex-1">{event.title}</h2>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={() => { onClose(); onEdit(event) }} className="p-1.5 rounded-[var(--radius-sm)] text-text-secondary hover:text-orange hover:bg-orange/10 transition-colors cursor-pointer" title="Editar">
              <Pencil className="w-4 h-4" strokeWidth={1.5} />
            </button>
            <button onClick={() => { onClose(); onDelete(event) }} className="p-1.5 rounded-[var(--radius-sm)] text-text-secondary hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer" title="Eliminar">
              <Trash2 className="w-4 h-4" strokeWidth={1.5} />
            </button>
            <button onClick={onClose} className="p-1.5 rounded-[var(--radius-sm)] hover:bg-bg-tertiary transition-colors cursor-pointer">
              <X className="w-4 h-4 text-text-secondary" strokeWidth={1.5} />
            </button>
          </div>
        </div>
        <div className="px-6 py-5 space-y-3">
          <p className="text-sm text-text-secondary">{formatEventDate(event.start, event.end, event.allDay)}</p>
          {event.location && (
            <div className="flex items-center gap-1.5 text-sm text-text-secondary">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={1.5} />
              {event.location}
            </div>
          )}
          {event.description && (
            <p className="text-sm text-text-primary whitespace-pre-wrap pt-2 border-t border-border-primary">{event.description}</p>
          )}
        </div>
      </div>
    </div>
  )
}
