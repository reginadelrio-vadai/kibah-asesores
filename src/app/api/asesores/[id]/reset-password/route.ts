import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { resetAsesorPassword } from '@/lib/dal/users'
import { requirePermission, isAuthError } from '@/lib/auth/permissions'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission('asesores.edit')
  if (isAuthError(auth)) return auth

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
