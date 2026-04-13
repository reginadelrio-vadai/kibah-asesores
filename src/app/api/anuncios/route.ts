import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import * as dal from '@/lib/dal/anuncios'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    const role = (profile?.role as string) ?? 'asesor'
    const anuncios = await dal.getAnuncios(user.id, role)
    const readIds = await dal.getReadAnuncioIds(user.id)
    const data = anuncios.map((a) => ({ ...a, is_read: readIds.has(a.id) }))
    return NextResponse.json({ data })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') {
    const { getUserPermissions } = await import('@/lib/dal/roles')
    const perms = await getUserPermissions(user.id)
    if (!perms['anuncios.create'] && !perms._isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  try {
    const body = await request.json()
    const { title, message, priority, target_type, target_user_ids } = body
    if (!title || !message) return NextResponse.json({ error: 'Titulo y mensaje son requeridos' }, { status: 400 })

    const targetType: 'all' | 'specific' = target_type === 'specific' ? 'specific' : 'all'
    const targetUserIds: string[] = Array.isArray(target_user_ids) ? target_user_ids : []
    if (targetType === 'specific' && targetUserIds.length === 0) {
      return NextResponse.json({ error: 'Selecciona al menos un asesor' }, { status: 400 })
    }

    const anuncio = await dal.createAnuncio(
      title,
      message,
      priority || 'normal',
      user.id,
      targetType,
      targetUserIds
    )
    return NextResponse.json({ data: anuncio }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 })
  }
}
