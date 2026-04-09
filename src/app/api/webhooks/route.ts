import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { createWebhookSchema } from '@/lib/validations/webhook'
import * as dal from '@/lib/dal/webhooks'

async function verifyAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized', status: 401 }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') return { error: 'Forbidden', status: 403 }
  return { user }
}

export async function GET() {
  const auth = await verifyAdmin()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const webhooks = await dal.getWebhooks()
    return NextResponse.json({ data: webhooks })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error fetching webhooks'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = await verifyAdmin()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const body = await request.json()
    const validated = createWebhookSchema.parse(body)
    const webhook = await dal.createWebhook(validated, auth.user.id)
    return NextResponse.json({ data: webhook }, { status: 201 })
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: err.issues },
        { status: 400 }
      )
    }
    const message = err instanceof Error ? err.message : 'Error creating webhook'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
