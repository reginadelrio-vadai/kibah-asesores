'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import type { Property } from '@/types'

interface PropertyFormProps {
  property?: Property | null
  onClose: () => void
  onSuccess: () => void
  onToast: (message: string, type: 'success' | 'error') => void
}

const DISPONIBILIDAD_OPTIONS = ['Disponible', 'Apartado', 'Rentado']
const TIPO_PREVENTA_OPTIONS = ['Preventa', 'Entrega Inmediata']
const TIPO_ENTREGA_OPTIONS = ['Terminado', 'Obra blanca', 'Obra Gris', 'Obra Negra']
const BODEGA_OPTIONS = ['Si', 'No']
const AMENIDADES_OPTIONS = ['Si', 'No']

type FormData = Record<string, string>

interface FilterOptions {
  colonias: string[]
  alcaldias: string[]
}

function buildInitial(property?: Property | null): FormData {
  if (!property) return {}
  return {
    nombre_kibah: property.nombre_kibah ?? '',
    nombre_desarrollador: property.nombre_desarrollador ?? '',
    unidad: property.unidad ?? '',
    disponibilidad: property.disponibilidad ?? '',
    precio_unidad: property.precio_unidad != null ? String(property.precio_unidad) : '',
    tipo_preventa: property.tipo_preventa ?? '',
    direccion: property.direccion ?? '',
    colonia: property.colonia ?? '',
    alcaldia: property.alcaldia ?? '',
    m2_totales: property.m2_totales != null ? String(property.m2_totales) : '',
    m2_habitables: property.m2_habitables != null ? String(property.m2_habitables) : '',
    m2_exteriores: property.m2_exteriores != null ? String(property.m2_exteriores) : '',
    m2_roof_garden: property.m2_roof_garden != null ? String(property.m2_roof_garden) : '',
    num_recamaras: property.num_recamaras != null ? String(property.num_recamaras) : '',
    num_banos: property.num_banos != null ? String(property.num_banos) : '',
    estacionamiento: property.estacionamiento != null ? String(property.estacionamiento) : '',
    bodega: property.bodega ?? '',
    amenidades: property.amenidades ?? '',
    tipo_entrega: property.tipo_entrega ?? '',
    fecha_entrega: property.fecha_entrega ?? '',
    contacto_desarrollador: property.contacto_desarrollador ?? '',
    pct_comision: property.pct_comision != null ? String(property.pct_comision) : '',
    link_drive: property.link_drive ?? '',
  }
}

function toPayload(form: FormData) {
  const num = (key: string) => {
    const v = form[key]?.trim()
    if (!v) return null
    const n = parseFloat(v)
    return isNaN(n) ? null : n
  }
  const str = (key: string) => {
    const v = form[key]?.trim()
    return v || null
  }

  return {
    nombre_kibah: form.nombre_kibah?.trim() || '',
    nombre_desarrollador: str('nombre_desarrollador'),
    unidad: form.unidad?.trim() || '',
    disponibilidad: form.disponibilidad || undefined,
    precio_unidad: num('precio_unidad'),
    tipo_preventa: form.tipo_preventa || undefined,
    direccion: str('direccion'),
    colonia: form.colonia?.trim() || '',
    alcaldia: form.alcaldia?.trim() || '',
    m2_totales: num('m2_totales'),
    m2_habitables: num('m2_habitables'),
    m2_exteriores: num('m2_exteriores'),
    m2_roof_garden: num('m2_roof_garden'),
    num_recamaras: num('num_recamaras'),
    num_banos: num('num_banos'),
    estacionamiento: num('estacionamiento'),
    bodega: str('bodega') as 'Si' | 'No' | null,
    amenidades: str('amenidades'),
    tipo_entrega: str('tipo_entrega') as 'Terminado' | 'Obra blanca' | 'Obra Gris' | 'Obra Negra' | null,
    fecha_entrega: str('fecha_entrega'),
    contacto_desarrollador: str('contacto_desarrollador'),
    pct_comision: num('pct_comision'),
    link_drive: str('link_drive'),
  }
}

export function PropertyForm({ property, onClose, onSuccess, onToast }: PropertyFormProps) {
  const isEdit = !!property
  const [form, setForm] = useState<FormData>(buildInitial(property))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({ colonias: [], alcaldias: [] })
  const [coloniaCustom, setColoniaCustom] = useState(false)
  const [alcaldiaCustom, setAlcaldiaCustom] = useState(false)

  // Fetch filter options for colonia/alcaldia dropdowns
  useEffect(() => {
    fetch('/api/properties/filter-options')
      .then((res) => res.json())
      .then((data) => {
        const opts: FilterOptions = {
          colonias: data.colonias ?? [],
          alcaldias: data.alcaldias ?? [],
        }
        setFilterOptions(opts)
        // If editing and current value isn't in the list, show custom input
        if (property?.colonia && !opts.colonias.includes(property.colonia)) {
          setColoniaCustom(true)
        }
        if (property?.alcaldia && !opts.alcaldias.includes(property.alcaldia)) {
          setAlcaldiaCustom(true)
        }
      })
      .catch(() => {})
  }, [property?.colonia, property?.alcaldia])

  const set = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors((prev) => { const next = { ...prev }; delete next[key]; return next })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setErrors({})

    const payload = toPayload(form)
    const url = isEdit ? `/api/properties/${property!.id}` : '/api/properties'
    const method = isEdit ? 'PUT' : 'POST'

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        if (body.details && Array.isArray(body.details)) {
          const fieldErrors: Record<string, string> = {}
          for (const detail of body.details) {
            const path = detail.path?.[0]
            if (path) fieldErrors[path] = detail.message
          }
          setErrors(fieldErrors)
          onToast('Revisa los campos con errores', 'error')
        } else {
          onToast(body.error || 'Error al guardar', 'error')
        }
        return
      }

      onToast(isEdit ? 'Propiedad actualizada' : 'Propiedad creada', 'success')
      onSuccess()
      onClose()
    } catch {
      onToast('Error de conexión', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const inputClass = (key: string) =>
    `w-full h-9 px-3 text-sm rounded-[var(--radius-sm)] border bg-bg-primary text-text-primary
    placeholder:text-text-tertiary transition-colors
    ${errors[key] ? 'border-red-500' : 'border-border-primary focus:border-orange'}
    focus:outline-none focus:ring-1 ${errors[key] ? 'focus:ring-red-500' : 'focus:ring-orange/30'}`

  const selectClass = (key: string) =>
    `${inputClass(key)} appearance-none cursor-pointer`

  return (
    <div className="fixed inset-0 z-[80]">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute inset-0 overflow-y-auto flex items-start justify-center">
      <div className="relative bg-bg-primary border border-border-primary rounded-[var(--radius-lg)] w-full max-w-2xl shadow-2xl my-8 mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-primary">
          <h2 className="text-base font-semibold text-text-primary">
            {isEdit ? 'Editar Propiedad' : 'Nueva Propiedad'}
          </h2>
          <button onClick={onClose} className="cursor-pointer text-text-tertiary hover:text-text-primary transition-colors">
            <X className="w-5 h-5" strokeWidth={1.5} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Info Principal */}
          <Section title="Información Principal">
            <Field label="Nombre Kibah *" error={errors.nombre_kibah}>
              <input className={inputClass('nombre_kibah')} value={form.nombre_kibah ?? ''} onChange={(e) => set('nombre_kibah', e.target.value)} placeholder="Nombre de la propiedad" />
            </Field>
            <Field label="Nombre Desarrollador" error={errors.nombre_desarrollador}>
              <input className={inputClass('nombre_desarrollador')} value={form.nombre_desarrollador ?? ''} onChange={(e) => set('nombre_desarrollador', e.target.value)} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Unidad *" error={errors.unidad}>
                <input className={inputClass('unidad')} value={form.unidad ?? ''} onChange={(e) => set('unidad', e.target.value)} />
              </Field>
              <Field label="Disponibilidad *" error={errors.disponibilidad}>
                <select className={selectClass('disponibilidad')} value={form.disponibilidad ?? ''} onChange={(e) => set('disponibilidad', e.target.value)}>
                  <option value="">Seleccionar</option>
                  {DISPONIBILIDAD_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Precio *" error={errors.precio_unidad}>
                <input className={inputClass('precio_unidad')} type="number" step="any" value={form.precio_unidad ?? ''} onChange={(e) => set('precio_unidad', e.target.value)} placeholder="0" />
              </Field>
              <Field label="Tipo Preventa *" error={errors.tipo_preventa}>
                <select className={selectClass('tipo_preventa')} value={form.tipo_preventa ?? ''} onChange={(e) => set('tipo_preventa', e.target.value)}>
                  <option value="">Seleccionar</option>
                  {TIPO_PREVENTA_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </Field>
            </div>
          </Section>

          {/* Ubicación */}
          <Section title="Ubicación">
            <Field label="Dirección" error={errors.direccion}>
              <input className={inputClass('direccion')} value={form.direccion ?? ''} onChange={(e) => set('direccion', e.target.value)} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Colonia *" error={errors.colonia}>
                {coloniaCustom ? (
                  <div className="flex gap-2">
                    <input className={inputClass('colonia')} value={form.colonia ?? ''} onChange={(e) => set('colonia', e.target.value)} placeholder="Nueva colonia" />
                    <button
                      type="button"
                      onClick={() => { setColoniaCustom(false); set('colonia', '') }}
                      className="h-9 px-2 text-xs text-text-secondary hover:text-text-primary border border-border-primary rounded-[var(--radius-sm)] whitespace-nowrap cursor-pointer transition-colors"
                    >
                      Lista
                    </button>
                  </div>
                ) : (
                  <select
                    className={selectClass('colonia')}
                    value={form.colonia ?? ''}
                    onChange={(e) => {
                      if (e.target.value === '__other__') {
                        setColoniaCustom(true)
                        set('colonia', '')
                      } else {
                        set('colonia', e.target.value)
                      }
                    }}
                  >
                    <option value="">Seleccionar</option>
                    {filterOptions.colonias.map((c) => <option key={c} value={c}>{c}</option>)}
                    <option value="__other__">Otra...</option>
                  </select>
                )}
              </Field>
              <Field label="Alcaldía *" error={errors.alcaldia}>
                {alcaldiaCustom ? (
                  <div className="flex gap-2">
                    <input className={inputClass('alcaldia')} value={form.alcaldia ?? ''} onChange={(e) => set('alcaldia', e.target.value)} placeholder="Nueva alcaldía" />
                    <button
                      type="button"
                      onClick={() => { setAlcaldiaCustom(false); set('alcaldia', '') }}
                      className="h-9 px-2 text-xs text-text-secondary hover:text-text-primary border border-border-primary rounded-[var(--radius-sm)] whitespace-nowrap cursor-pointer transition-colors"
                    >
                      Lista
                    </button>
                  </div>
                ) : (
                  <select
                    className={selectClass('alcaldia')}
                    value={form.alcaldia ?? ''}
                    onChange={(e) => {
                      if (e.target.value === '__other__') {
                        setAlcaldiaCustom(true)
                        set('alcaldia', '')
                      } else {
                        set('alcaldia', e.target.value)
                      }
                    }}
                  >
                    <option value="">Seleccionar</option>
                    {filterOptions.alcaldias.map((a) => <option key={a} value={a}>{a}</option>)}
                    <option value="__other__">Otra...</option>
                  </select>
                )}
              </Field>
            </div>
          </Section>

          {/* Características */}
          <Section title="Características">
            <div className="grid grid-cols-2 gap-4">
              <Field label="M2 Totales *" error={errors.m2_totales}>
                <input className={inputClass('m2_totales')} type="number" step="any" value={form.m2_totales ?? ''} onChange={(e) => set('m2_totales', e.target.value)} />
              </Field>
              <Field label="M2 Habitables" error={errors.m2_habitables}>
                <input className={inputClass('m2_habitables')} type="number" step="any" value={form.m2_habitables ?? ''} onChange={(e) => set('m2_habitables', e.target.value)} />
              </Field>
              <Field label="M2 Exteriores" error={errors.m2_exteriores}>
                <input className={inputClass('m2_exteriores')} type="number" step="any" value={form.m2_exteriores ?? ''} onChange={(e) => set('m2_exteriores', e.target.value)} />
              </Field>
              <Field label="M2 Roof Garden" error={errors.m2_roof_garden}>
                <input className={inputClass('m2_roof_garden')} type="number" step="any" value={form.m2_roof_garden ?? ''} onChange={(e) => set('m2_roof_garden', e.target.value)} />
              </Field>
              <Field label="Recámaras *" error={errors.num_recamaras}>
                <input className={inputClass('num_recamaras')} type="number" step="any" value={form.num_recamaras ?? ''} onChange={(e) => set('num_recamaras', e.target.value)} />
              </Field>
              <Field label="Baños *" error={errors.num_banos}>
                <input className={inputClass('num_banos')} type="number" step="any" value={form.num_banos ?? ''} onChange={(e) => set('num_banos', e.target.value)} />
              </Field>
              <Field label="Estacionamiento" error={errors.estacionamiento}>
                <input className={inputClass('estacionamiento')} type="number" step="any" value={form.estacionamiento ?? ''} onChange={(e) => set('estacionamiento', e.target.value)} />
              </Field>
              <Field label="Bodega" error={errors.bodega}>
                <select className={selectClass('bodega')} value={form.bodega ?? ''} onChange={(e) => set('bodega', e.target.value)}>
                  <option value="">—</option>
                  {BODEGA_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </Field>
            </div>
            <Field label="Amenidades" error={errors.amenidades}>
              <select className={selectClass('amenidades')} value={form.amenidades ?? ''} onChange={(e) => set('amenidades', e.target.value)}>
                <option value="">—</option>
                {AMENIDADES_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </Field>
          </Section>

          {/* Entrega */}
          <Section title="Entrega">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Tipo de Entrega" error={errors.tipo_entrega}>
                <select className={selectClass('tipo_entrega')} value={form.tipo_entrega ?? ''} onChange={(e) => set('tipo_entrega', e.target.value)}>
                  <option value="">—</option>
                  {TIPO_ENTREGA_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </Field>
              <Field label="Fecha de Entrega" error={errors.fecha_entrega}>
                <input className={inputClass('fecha_entrega')} value={form.fecha_entrega ?? ''} onChange={(e) => set('fecha_entrega', e.target.value)} placeholder="ej. Q4 2025" />
              </Field>
            </div>
          </Section>

          {/* Interno */}
          <Section title="Interno (Admin)">
            <Field label="Contacto Desarrollador" error={errors.contacto_desarrollador}>
              <input className={inputClass('contacto_desarrollador')} value={form.contacto_desarrollador ?? ''} onChange={(e) => set('contacto_desarrollador', e.target.value)} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="% Comisión" error={errors.pct_comision}>
                <input className={inputClass('pct_comision')} type="number" step="any" value={form.pct_comision ?? ''} onChange={(e) => set('pct_comision', e.target.value)} />
              </Field>
              <Field label="Link Drive" error={errors.link_drive}>
                <input className={inputClass('link_drive')} value={form.link_drive ?? ''} onChange={(e) => set('link_drive', e.target.value)} placeholder="https://..." />
              </Field>
            </div>
          </Section>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2 border-t border-border-primary">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-4 text-sm font-medium rounded-[var(--radius-sm)]
                bg-bg-tertiary text-text-primary hover:bg-border-primary
                transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="h-9 px-5 text-sm font-medium rounded-[var(--radius-sm)]
                bg-orange text-white hover:bg-orange-hover
                disabled:opacity-50 transition-colors cursor-pointer"
            >
              {submitting ? 'Guardando...' : isEdit ? 'Guardar Cambios' : 'Crear Propiedad'}
            </button>
          </div>
        </form>
      </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
      {children}
    </div>
  )
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-text-secondary mb-1">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
    </div>
  )
}
