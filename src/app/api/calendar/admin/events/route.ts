import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { getConnectedUsersWithProfiles } from '@/lib/dal/google-tokens'
import { getEvents } from '@/lib/google/calendar'

const ASESOR_COLORS = [
  '#E8872A', '#3B82F6', '#10B981', '#8B5CF6',
  '#F59E0B', '#EC4899', '#06B6D4', '#F97316',
]

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || profile.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const params = request.nextUrl.searchParams
  const start = params.get('start')
  const end = params.get('end')
  const filterUserId = params.get('userId')

  if (!start || !end) return NextResponse.json({ error: 'start and end required' }, { status: 400 })

  try {
    let users = await getConnectedUsersWithProfiles()
    if (filterUserId) {
      users = users.filter((u) => u.userId === filterUserId)
    }

    const results = await Promise.allSettled(
      users.slice(0, 10).map(async (u, idx) => {
        const events = await getEvents(u.userId, start, end)
        const color = ASESOR_COLORS[idx % ASESOR_COLORS.length]
        return events.map((ev) => ({
          ...ev,
          backgroundColor: color,
          borderColor: color,
          title: `${ev.title} (${u.fullName})`,
        }))
      })
    )

    const allEvents = results
      .filter((r): r is PromiseFulfilledResult<typeof r extends PromiseFulfilledResult<infer T> ? T : never> => r.status === 'fulfilled')
      .flatMap((r) => r.value)

    return NextResponse.json({ data: allEvents })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 })
  }
}
