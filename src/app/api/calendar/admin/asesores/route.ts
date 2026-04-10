import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getConnectedUsersWithProfiles } from '@/lib/dal/google-tokens'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || profile.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const users = await getConnectedUsersWithProfiles()
    return NextResponse.json({ data: users })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 })
  }
}
