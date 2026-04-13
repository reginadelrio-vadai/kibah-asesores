import { createAdminClient } from '@/lib/supabase/admin'

export interface Anuncio {
  id: string
  title: string
  message: string
  priority: 'normal' | 'urgente'
  created_by: string
  created_at: string
  target_type: 'all' | 'specific'
  target_user_ids: string[]
  author_name?: string
  author_role?: string
  target_names?: string[]
}

export async function getAnuncios(userId: string, role: string): Promise<Anuncio[]> {
  const supabase = createAdminClient()

  let query = supabase
    .from('anuncios')
    .select('*')
    .order('created_at', { ascending: false })

  if (role !== 'admin') {
    query = query.or(
      `target_type.eq.all,target_user_ids.cs.{${userId}},created_by.eq.${userId}`
    )
  }

  const { data: anuncios, error } = await query
  if (error) throw new Error(error.message)

  const authorIds = new Set<string>()
  const targetIds = new Set<string>()
  for (const a of anuncios ?? []) {
    authorIds.add(a.created_by as string)
    for (const uid of (a.target_user_ids as string[] | null) ?? []) targetIds.add(uid)
  }

  const allIds = [...new Set([...authorIds, ...targetIds])]
  if (allIds.length === 0) return (anuncios ?? []) as Anuncio[]

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .in('id', allIds)

  const profileMap = new Map((profiles ?? []).map((p) => [p.id as string, { name: p.full_name as string, role: p.role as string }]))

  return (anuncios ?? []).map((a) => {
    const author = profileMap.get(a.created_by as string)
    const targetUserIds = ((a.target_user_ids as string[] | null) ?? [])
    return {
      ...(a as Anuncio),
      target_user_ids: targetUserIds,
      author_name: author?.role === 'admin' ? 'Administracion' : author?.name ?? 'Desconocido',
      author_role: author?.role ?? '',
      target_names: targetUserIds.map((uid) => profileMap.get(uid)?.name ?? 'Desconocido'),
    }
  })
}

export async function createAnuncio(
  title: string,
  message: string,
  priority: string,
  userId: string,
  targetType: 'all' | 'specific',
  targetUserIds: string[]
): Promise<Anuncio> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('anuncios')
    .insert({
      title,
      message,
      priority,
      created_by: userId,
      target_type: targetType,
      target_user_ids: targetType === 'specific' ? targetUserIds : [],
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as Anuncio
}

export async function deleteAnuncio(id: string): Promise<void> {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('anuncios')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
}

export async function getUnreadCount(userId: string, role: string): Promise<number> {
  const supabase = createAdminClient()

  let idsQuery = supabase.from('anuncios').select('id')
  if (role !== 'admin') {
    idsQuery = idsQuery.or(
      `target_type.eq.all,target_user_ids.cs.{${userId}},created_by.eq.${userId}`
    )
  }

  const { data: visibleIds, error: idsErr } = await idsQuery
  if (idsErr || !visibleIds) return 0
  const total = visibleIds.length
  if (total === 0) return 0

  const { data: reads } = await supabase
    .from('anuncio_reads')
    .select('anuncio_id')
    .eq('user_id', userId)
    .in('anuncio_id', visibleIds.map((r) => r.id as string))

  return Math.max(total - (reads?.length ?? 0), 0)
}

export async function markAsRead(anuncioIds: string[], userId: string): Promise<void> {
  if (anuncioIds.length === 0) return
  const supabase = createAdminClient()

  const rows = anuncioIds.map((anuncio_id) => ({ anuncio_id, user_id: userId }))
  const { error } = await supabase
    .from('anuncio_reads')
    .upsert(rows, { onConflict: 'anuncio_id,user_id' })

  if (error) console.error('Error marking as read:', error.message)
}

export async function getReadAnuncioIds(userId: string): Promise<Set<string>> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('anuncio_reads')
    .select('anuncio_id')
    .eq('user_id', userId)

  if (error) return new Set()
  return new Set((data ?? []).map((r) => r.anuncio_id as string))
}
