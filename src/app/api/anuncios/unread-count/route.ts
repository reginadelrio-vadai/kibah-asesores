import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import * as dal from '@/lib/dal/anuncios'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const count = await dal.getUnreadCount(user.id)
    return NextResponse.json({ count })
  } catch {
    return NextResponse.json({ count: 0 })
  }
}
