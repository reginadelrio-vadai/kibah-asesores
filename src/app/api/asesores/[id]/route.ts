import { NextRequest, NextResponse } from 'next/server'
import * as dal from '@/lib/dal/users'
import { requirePermission, isAuthError } from '@/lib/auth/permissions'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission('asesores.edit')
  if (isAuthError(auth)) return auth

  const { id } = await params

  if (id === auth.userId) {
    return NextResponse.json({ error: 'No puedes desactivar tu propia cuenta' }, { status: 403 })
  }

  try {
    const body = await request.json()
    if (body.is_active !== undefined) {
      await dal.toggleAsesorActive(id, body.is_active)
    }
    if (body.role) {
      const { createAdminClient } = await import('@/lib/supabase/admin')
      const supabase = createAdminClient()
      await supabase.from('profiles').update({ role: body.role }).eq('id', id)
    }
    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error updating asesor'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission('asesores.delete')
  if (isAuthError(auth)) return auth

  const { id } = await params

  if (id === auth.userId) {
    return NextResponse.json({ error: 'No puedes eliminar tu propia cuenta' }, { status: 403 })
  }

  try {
    await dal.deleteAsesor(id)
    return new NextResponse(null, { status: 204 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error deleting asesor'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
