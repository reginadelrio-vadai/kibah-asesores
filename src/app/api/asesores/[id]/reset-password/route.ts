import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { resetAsesorPassword } from '@/lib/dal/users'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const newPassword = crypto.randomBytes(9).toString('base64url').slice(0, 12)

  try {
    await resetAsesorPassword(id, newPassword)
    return NextResponse.json({ password: newPassword })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error resetting password'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
