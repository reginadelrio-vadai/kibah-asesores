import { NextRequest, NextResponse } from 'next/server'
import { z, ZodError } from 'zod'
import * as dal from '@/lib/dal/users'
import { requireAnyPermission, requirePermission, isAuthError } from '@/lib/auth/permissions'

const createAsesorSchema = z.object({
  email: z.string().email('Email inválido'),
  full_name: z.string().min(1, 'Nombre es requerido'),
  password: z.string().min(8, 'Contraseña debe tener al menos 8 caracteres'),
  role: z.string().optional(),
})

export async function GET() {
  // asesores.view grants read access; anuncios.create also needs to list asesores
  const auth = await requireAnyPermission(['asesores.view', 'anuncios.create'])
  if (isAuthError(auth)) return auth

  try {
    const asesores = await dal.getAllAsesores()
    return NextResponse.json({ data: asesores })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error fetching asesores'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = await requirePermission('asesores.create')
  if (isAuthError(auth)) return auth

  try {
    const body = await request.json()
    const validated = createAsesorSchema.parse(body)
    const profile = await dal.createAsesor(validated.email, validated.full_name, validated.password, validated.role)
    return NextResponse.json({ data: profile }, { status: 201 })
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: err.issues },
        { status: 400 }
      )
    }
    const message = err instanceof Error ? err.message : 'Error creating asesor'
    const isDuplicate = message.toLowerCase().includes('already') || message.toLowerCase().includes('duplicate')
    if (isDuplicate) {
      return NextResponse.json({ error: 'Ya existe un usuario con ese email' }, { status: 400 })
    }
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
