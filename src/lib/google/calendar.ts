import { google } from 'googleapis'
import { getOAuth2Client } from './auth'

export interface CalendarEvent {
  id: string
  title: string
  start: string
  end: string
  description?: string
  location?: string
  backgroundColor?: string
  borderColor?: string
  allDay: boolean
}

export interface CalendarListItem {
  id: string
  summary: string
  backgroundColor: string
  primary: boolean
}

export async function getCalendarList(userId: string): Promise<CalendarListItem[]> {
  const { client } = await getOAuth2Client(userId)
  const cal = google.calendar({ version: 'v3', auth: client })

  const res = await cal.calendarList.list()
  return (res.data.items ?? []).map((item) => ({
    id: item.id!,
    summary: item.summary ?? 'Sin nombre',
    backgroundColor: item.backgroundColor ?? '#E8872A',
    primary: item.primary ?? false,
  }))
}

export async function getEvents(
  userId: string,
  timeMin: string,
  timeMax: string
): Promise<CalendarEvent[]> {
  const { client, selectedCalendarId } = await getOAuth2Client(userId)
  const cal = google.calendar({ version: 'v3', auth: client })

  const res = await cal.events.list({
    calendarId: selectedCalendarId,
    timeMin,
    timeMax,
    singleEvents: true,
    orderBy: 'startTime',
    maxResults: 250,
  })

  return (res.data.items ?? []).map((ev) => {
    const allDay = !!ev.start?.date
    return {
      id: ev.id!,
      title: ev.summary || '(Sin titulo)',
      start: allDay ? ev.start!.date! : ev.start!.dateTime!,
      end: allDay ? ev.end!.date! : ev.end!.dateTime!,
      description: ev.description ?? undefined,
      location: ev.location ?? undefined,
      backgroundColor: ev.colorId ? undefined : '#E8872A',
      borderColor: '#E8872A',
      allDay,
    }
  })
}

interface EventInput {
  title: string
  start: string
  end: string
  description?: string
  location?: string
  allDay?: boolean
}

export async function createEvent(
  userId: string,
  data: EventInput
): Promise<CalendarEvent> {
  const { client, selectedCalendarId } = await getOAuth2Client(userId)
  const cal = google.calendar({ version: 'v3', auth: client })

  const eventBody: Record<string, unknown> = {
    summary: data.title,
    description: data.description || undefined,
    location: data.location || undefined,
  }

  if (data.allDay) {
    eventBody.start = { date: data.start.split('T')[0] }
    eventBody.end = { date: data.end.split('T')[0] }
  } else {
    eventBody.start = { dateTime: data.start }
    eventBody.end = { dateTime: data.end }
  }

  const res = await cal.events.insert({
    calendarId: selectedCalendarId,
    requestBody: eventBody,
  })

  const ev = res.data
  const allDay = !!ev.start?.date
  return {
    id: ev.id!,
    title: ev.summary || data.title,
    start: allDay ? ev.start!.date! : ev.start!.dateTime!,
    end: allDay ? ev.end!.date! : ev.end!.dateTime!,
    description: ev.description ?? undefined,
    location: ev.location ?? undefined,
    allDay,
  }
}

export async function updateEvent(
  userId: string,
  eventId: string,
  data: Partial<EventInput>
): Promise<CalendarEvent> {
  const { client, selectedCalendarId } = await getOAuth2Client(userId)
  const cal = google.calendar({ version: 'v3', auth: client })

  const eventBody: Record<string, unknown> = {}
  if (data.title !== undefined) eventBody.summary = data.title
  if (data.description !== undefined) eventBody.description = data.description
  if (data.location !== undefined) eventBody.location = data.location

  if (data.start && data.end) {
    if (data.allDay) {
      eventBody.start = { date: data.start.split('T')[0] }
      eventBody.end = { date: data.end.split('T')[0] }
    } else {
      eventBody.start = { dateTime: data.start }
      eventBody.end = { dateTime: data.end }
    }
  }

  const res = await cal.events.patch({
    calendarId: selectedCalendarId,
    eventId,
    requestBody: eventBody,
  })

  const ev = res.data
  const allDay = !!ev.start?.date
  return {
    id: ev.id!,
    title: ev.summary || '(Sin titulo)',
    start: allDay ? ev.start!.date! : ev.start!.dateTime!,
    end: allDay ? ev.end!.date! : ev.end!.dateTime!,
    description: ev.description ?? undefined,
    location: ev.location ?? undefined,
    allDay,
  }
}

export async function deleteEvent(userId: string, eventId: string): Promise<void> {
  const { client, selectedCalendarId } = await getOAuth2Client(userId)
  const cal = google.calendar({ version: 'v3', auth: client })

  await cal.events.delete({
    calendarId: selectedCalendarId,
    eventId,
  })
}
