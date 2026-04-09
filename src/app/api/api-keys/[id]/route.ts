import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import * as dal from '@/lib/dal/api-keys'

export async function DELETE(
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

  try {
    await dal.revokeApiKey(id)
    return new NextResponse(null, { status: 204 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error revoking API key'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
