import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import * as apiKeyService from '@/lib/services/api-key-service'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id_propiedad: string }> }
) {
  const apiKey = request.headers.get('x-api-key')
  if (!apiKey) {
    return NextResponse.json({ error: 'API key required' }, { status: 401 })
  }

  const key = await apiKeyService.validateApiKey(apiKey)
  if (!key) {
    return NextResponse.json({ error: 'Invalid or expired API key' }, { status: 401 })
  }

  if (!key.permissions.includes('properties.read')) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  if (!apiKeyService.checkRateLimit(key.id)) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429, headers: { 'Retry-After': '60' } }
    )
  }

  const { id_propiedad } = await params
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('propiedades_view')
    .select('*')
    .eq('id_propiedad', id_propiedad)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}
