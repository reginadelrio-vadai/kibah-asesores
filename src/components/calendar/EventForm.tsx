'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import type { CalendarEvent } from '@/lib/google/calendar'

interface EventFormProps {
  event?: CalendarEvent | null
  defaultStart?: string
  defaultEnd?: string
  onClose: () => void
  onSaved: () => void
  onToast: (msg: string, type: 'success' | 'error') => void
}

export function EventForm({ event, defaultStart, defaultEnd, onClose, onSaved, onToast }: EventFormProps) {
  const isEdit = !!event
  const [title, setTitle] = useState(event?.title === '(Sin titulo)' ? '' : event?.title ?? '')
  const [allDay, setAllDay] = useState(event?.allDay ?? false)
  const [startDate, setStartDate] = useState(() => {
    const s = event?.start || defaultStart || ''
    return s.split('T')[0] || ''
  })
  const [startTime, setStartTime] = useState(() => {
    const s = event?.start || defaultStart || ''
    return s.includes('T') ? s.split('T')[1]?.slice(0, 5) || '09:00' : '09:00'
  })
  const [endDate, setEndDate] = useState(() => {
    const s = event?.end || defaultEnd || ''
    return s.split('T')[0] || startDate
  })
  const [endTime, setEndTime] = useState(() => {
    const s = event?.end || defaultEnd || ''
    return s.includes('T') ? s.split('T')[1]?.slice(0, 5) || '10:00' : '10:00'
  })
  const [description, setDescription] = useState(event?.description ?? '')
  const [location, setLocation] = useState(event?.location ?? '')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) { onToast('Titulo es requerido', 'error'); return }
    if (!startDate) { onToast('Fecha de inicio es requerida', 'error'); return }

    setSubmitting(true)
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    const payload = {
      title: title.trim(),
      allDay,
      start: allDay ? startDate : `${startDate}T${startTime}:00`,
      end: allDay ? (endDate || startDate) : `${endDate || startDate}T${endTime}:00`,
      description: description.trim() || undefined,
      location: location.trim() || undefined,
      timeZone: tz,
    }

    const url = isEdit ? `/api/calendar/events/${event!.id}` : '/api/calendar/events'
    const method = isEdit ? 'PUT' : 'POST'

    try {
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        onToast(body.error || 'Error al guardar', 'error')
        return
      }
      onToast(isEdit ? 'Evento actualizado' : 'Evento creado', 'success')
      onSaved()
      onClose()
    } catch {
      onToast('Error de conexion', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const ic = 'w-full h-9 px-3 text-sm rounded-[var(--radius-sm)] border border-border-primary bg-bg-primary text-text-primary focus:outline-none focus:border-orange focus:ring-1 focus:ring-orange/30'

  return (
    <div className="fixed inset-0 z-[80]">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute inset-0 overflow-y-auto flex items-start justify-center">
        <div className="relative bg-bg-primary border border-border-primary rounded-[var(--radius-lg)] w-full max-w-md shadow-2xl my-8 mx-4">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border-primary">
            <h2 className="text-base font-semibold text-text-primary">{isEdit ? 'Editar Evento' : 'Nuevo Evento'}</h2>
            <button onClick={onClose} className="cursor-pointer text-text-tertiary hover:text-text-primary"><X className="w-5 h-5" strokeWidth={1.5} /></button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Titulo *</label>
              <input className={ic} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nombre del evento" />
            </div>

            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setAllDay(!allDay)}
                className={`relative w-9 h-5 rounded-full transition-colors cursor-pointer flex-shrink-0 ${allDay ? 'bg-orange' : 'bg-bg-tertiary border border-border-primary'}`}>
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${allDay ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </button>
              <span className="text-xs text-text-secondary">Todo el dia</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Fecha inicio *</label>
                <input type="date" className={ic} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              {!allDay && (
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">Hora inicio</label>
                  <input type="time" className={ic} value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Fecha fin</label>
                <input type="date" className={ic} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
              {!allDay && (
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">Hora fin</label>
                  <input type="time" className={ic} value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Descripcion</label>
              <textarea className={`${ic} h-20 py-2 resize-none`} value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Ubicacion</label>
              <input className={ic} value={location} onChange={(e) => setLocation(e.target.value)} />
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-border-primary">
              <button type="button" onClick={onClose} className="h-9 px-4 text-sm font-medium rounded-[var(--radius-sm)] bg-bg-tertiary text-text-primary hover:bg-border-primary transition-colors cursor-pointer">Cancelar</button>
              <button type="submit" disabled={submitting} className="h-9 px-5 text-sm font-medium rounded-[var(--radius-sm)] bg-orange text-white hover:bg-orange-hover disabled:opacity-50 transition-colors cursor-pointer">
                {submitting ? 'Guardando...' : isEdit ? 'Guardar' : 'Crear Evento'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
