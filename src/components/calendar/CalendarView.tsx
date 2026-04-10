'use client'

import { useCallback, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'
import type { CalendarEvent } from '@/lib/google/calendar'
import { EventForm } from './EventForm'
import { EventDetail } from './EventDetail'
import { Toast, type ToastType } from '@/components/ui/Toast'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

const FullCalendar = dynamic(() => import('@fullcalendar/react'), { ssr: false })
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'

export function CalendarView() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [defaultStart, setDefaultStart] = useState<string>('')
  const [defaultEnd, setDefaultEnd] = useState<string>('')
  const [deletingEvent, setDeletingEvent] = useState<CalendarEvent | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null)
  const rangeRef = useRef<{ start: string; end: string } | null>(null)

  const showToast = useCallback((msg: string, type: ToastType) => setToast({ message: msg, type }), [])

  const fetchEvents = useCallback(async (start: string, end: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/calendar/events?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`)
      if (res.ok) {
        const json = await res.json()
        setEvents(json.data ?? [])
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [])

  const refetchEvents = useCallback(() => {
    if (rangeRef.current) {
      fetchEvents(rangeRef.current.start, rangeRef.current.end)
    }
  }, [fetchEvents])

  const handleDatesSet = useCallback((info: { startStr: string; endStr: string }) => {
    rangeRef.current = { start: info.startStr, end: info.endStr }
    fetchEvents(info.startStr, info.endStr)
  }, [fetchEvents])

  const handleDateClick = useCallback((info: { dateStr: string; allDay: boolean }) => {
    setEditingEvent(null)
    setDefaultStart(info.dateStr)
    const end = new Date(info.dateStr)
    end.setHours(end.getHours() + 1)
    setDefaultEnd(end.toISOString())
    setFormOpen(true)
  }, [])

  const handleEventClick = useCallback((info: { event: { id: string } }) => {
    const ev = events.find((e) => e.id === info.event.id)
    if (ev) setSelectedEvent(ev)
  }, [events])

  const handleEventDrop = useCallback(async (info: { event: { id: string; startStr: string; endStr: string; allDay: boolean } }) => {
    try {
      await fetch(`/api/calendar/events/${info.event.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ start: info.event.startStr, end: info.event.endStr, allDay: info.event.allDay }),
      })
      refetchEvents()
    } catch {
      showToast('Error al mover evento', 'error')
    }
  }, [refetchEvents, showToast])

  const handleDelete = useCallback(async () => {
    if (!deletingEvent) return
    setDeleteLoading(true)
    try {
      const res = await fetch(`/api/calendar/events/${deletingEvent.id}`, { method: 'DELETE' })
      if (res.ok || res.status === 204) {
        showToast('Evento eliminado', 'success')
        setDeletingEvent(null)
        refetchEvents()
      } else {
        showToast('Error al eliminar', 'error')
      }
    } catch {
      showToast('Error de conexion', 'error')
    } finally {
      setDeleteLoading(false)
    }
  }, [deletingEvent, refetchEvents, showToast])

  return (
    <div className="relative">
      {loading && (
        <div className="absolute top-2 right-2 z-10">
          <Loader2 className="w-5 h-5 text-orange animate-spin" strokeWidth={1.5} />
        </div>
      )}

      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay',
        }}
        locale="es"
        buttonText={{ today: 'Hoy', month: 'Mes', week: 'Semana', day: 'Dia' }}
        events={events}
        editable={true}
        selectable={true}
        dateClick={handleDateClick}
        eventClick={handleEventClick}
        eventDrop={handleEventDrop}
        eventResize={handleEventDrop}
        datesSet={handleDatesSet}
        height="auto"
        dayMaxEvents={3}
      />

      {formOpen && (
        <EventForm
          event={editingEvent}
          defaultStart={defaultStart}
          defaultEnd={defaultEnd}
          onClose={() => setFormOpen(false)}
          onSaved={refetchEvents}
          onToast={showToast}
        />
      )}

      {selectedEvent && (
        <EventDetail
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onEdit={(ev) => { setSelectedEvent(null); setEditingEvent(ev); setFormOpen(true) }}
          onDelete={(ev) => { setSelectedEvent(null); setDeletingEvent(ev) }}
        />
      )}

      {deletingEvent && (
        <ConfirmDialog
          title="Eliminar Evento"
          message={`Eliminar "${deletingEvent.title}"?`}
          confirmLabel="Eliminar"
          variant="danger"
          loading={deleteLoading}
          onConfirm={handleDelete}
          onCancel={() => setDeletingEvent(null)}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
