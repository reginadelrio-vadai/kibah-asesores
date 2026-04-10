import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Profile, ThemePreference } from '@/types'

export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    console.error('Error fetching profile:', error.message)
    return null
  }

  return data as Profile
}

export async function createProfile(data: {
  id: string
  email: string
  full_name: string
  role?: 'asesor' | 'admin'
}): Promise<Profile | null> {
  const supabase = createAdminClient()
  const { data: profile, error } = await supabase
    .from('profiles')
    .insert({
      id: data.id,
      email: data.email,
      full_name: data.full_name,
      role: data.role ?? 'asesor',
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating profile:', error.message)
    return null
  }

  return profile as Profile
}

export async function updateThemePreference(
  userId: string,
  theme: ThemePreference
): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('profiles')
    .update({ theme_preference: theme })
    .eq('id', userId)

  if (error) {
    console.error('Error updating theme preference:', error.message)
  }
}

export async function getAllAsesores(): Promise<Profile[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .neq('role', 'admin')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching asesores:', error.message)
    throw new Error(error.message)
  }
  return data as Profile[]
}

export async function createAsesor(
  email: string,
  fullName: string,
  password: string,
  role?: string
): Promise<Profile> {
  const supabase = createAdminClient()

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (authError) {
    throw new Error(authError.message)
  }

  const userId = authData.user.id

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      email,
      full_name: fullName,
      role: role || 'asesor',
    })
    .select()
    .single()

  if (profileError) {
    // Rollback: delete auth user if profile creation fails
    await supabase.auth.admin.deleteUser(userId)
    throw new Error(profileError.message)
  }

  return profile as Profile
}

export async function toggleAsesorActive(
  id: string,
  isActive: boolean
): Promise<void> {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('profiles')
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    throw new Error(error.message)
  }
}

export async function deleteAsesor(id: string): Promise<void> {
  const supabase = createAdminClient()
  const { error } = await supabase.auth.admin.deleteUser(id)

  if (error) {
    throw new Error(error.message)
  }
}

export async function resetAsesorPassword(
  id: string,
  newPassword: string
): Promise<void> {
  const supabase = createAdminClient()
  const { error } = await supabase.auth.admin.updateUserById(id, {
    password: newPassword,
  })

  if (error) {
    throw new Error(error.message)
  }
}
