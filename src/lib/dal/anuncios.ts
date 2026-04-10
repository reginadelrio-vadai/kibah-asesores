import { createAdminClient } from '@/lib/supabase/admin'

export interface Anuncio {
  id: string
  title: string
  message: string
  priority: 'normal' | 'urgente'
  created_by: string
  created_at: string
  author_name?: string
  author_role?: string
}

export async function getAnuncios(): Promise<Anuncio[]> {
  const supabase = createAdminClient()

  const { data: anuncios, error } = await supabase
    .from('anuncios')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)

  const userIds = [...new Set((anuncios ?? []).map((a) => a.created_by as string))]
  if (userIds.length === 0) return anuncios as Anuncio[]

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .in('id', userIds)

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, { name: p.full_name, role: p.role }]))

  return (anuncios ?? []).map((a) => {
    const author = profileMap.get(a.created_by as string)
    return {
      ...(a as Anuncio),
      author_name: author?.role === 'admin' ? 'Administracion' : (author?.name as string) ?? 'Desconocido',
      author_role: (author?.role as string) ?? '',
    }
  })
}

export async function createAnuncio(
  title: string,
  message: string,
  priority: string,
  userId: string
): Promise<Anuncio> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('anuncios')
    .insert({ title, message, priority, created_by: userId })
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

export async function getUnreadCount(userId: string): Promise<number> {
  const supabase = createAdminClient()

  const { count: totalCount, error: totalErr } = await supabase
    .from('anuncios')
    .select('*', { count: 'exact', head: true })

  if (totalErr) return 0

  const { count: readCount, error: readErr } = await supabase
    .from('anuncio_reads')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  if (readErr) return totalCount ?? 0

  return Math.max((totalCount ?? 0) - (readCount ?? 0), 0)
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
