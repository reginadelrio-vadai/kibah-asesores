'use client'

import { useCallback, useEffect, useState } from 'react'
import { Download, Pencil, Loader2, Link as LinkIcon, FilePlus2 } from 'lucide-react'
import type { Property } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { Toast, type ToastType } from '@/components/ui/Toast'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { PropertyPicker } from '@/components/carta-propuesta/PropertyPicker'
import { generateCartaPdf, type CartaPropuestaData } from '@/components/carta-propuesta/generateCartaPdf'
import { generateCartaDocx } from '@/components/carta-propuesta/generateCartaDocx'

const DIRECTORES = ['Iñaki Gonzalez Gámiz', 'Roberto Martínez Licón']

// Allow digits and a single decimal point. Used for all numeric inputs.
function sanitizeNumeric(s: string): string {
  let cleaned = s.replace(/[^\d.]/g, '')
  const firstDot = cleaned.indexOf('.')
  if (firstDot !== -1) {
    cleaned = cleaned.slice(0, firstDot + 1) + cleaned.slice(firstDot + 1).replace(/\./g, '')
  }
  return cleaned
}

// Format a raw numeric string like "5758150.50" → "5,758,150.50" preserving trailing zeros.
function formatNumericDisplay(raw: string): string {
  if (!raw) return ''
  const [intPart, fracPart] = raw.split('.')
  const n = parseInt(intPart || '0', 10)
  if (isNaN(n)) return raw
  const formattedInt = new Intl.NumberFormat('es-MX').format(n)
  return fracPart !== undefined ? `${formattedInt}.${fracPart}` : formattedInt
}

function toNumber(raw: string): number {
  const n = parseFloat(raw)
  return isNaN(n) ? 0 : n
}

function MoneyField({
  label,
  id,
  value,
  onChange,
  focusedKey,
  setFocusedKey,
}: {
  label: string
  id: string
  value: string
  onChange: (v: string) => void
  focusedKey: string | null
  setFocusedKey: (k: string | null) => void
}) {
  const focused = focusedKey === id
  const display = focused ? value : formatNumericDisplay(value)
  return (
    <div>
      <label className="kibah-label">{label}</label>
      <input
        type="text"
        inputMode="decimal"
        value={display}
        onFocus={() => setFocusedKey(id)}
        onBlur={() => setFocusedKey(null)}
        onChange={(e) => onChange(sanitizeNumeric(e.target.value))}
        placeholder="0"
        className="kibah-input"
      />
    </div>
  )
}

interface FormState {
  selectedProperty: Property | null
  nombreAsesor: string
  director: string
  nombreCliente: string
  nombreDesarrollador: string
  direccion: string
  colonia: string
  unidad: string
  valorDepto: string
  apartado: string
  enganche: string
  pctEnganche: string
  pctPago: string
  mensualidades: string
  montoMensualidades: string
  pagoEscritura: string
}

function makeEmptyForm(asesorName: string): FormState {
  return {
    selectedProperty: null,
    nombreAsesor: asesorName,
    director: '',
    nombreCliente: '',
    nombreDesarrollador: '',
    direccion: '',
    colonia: '',
    unidad: '',
    valorDepto: '',
    apartado: '',
    enganche: '',
    pctEnganche: '',
    pctPago: '',
    mensualidades: '',
    montoMensualidades: '',
    pagoEscritura: '',
  }
}

function hasAnyData(f: FormState, defaultAsesorName: string): boolean {
  return (
    f.selectedProperty !== null ||
    (f.nombreAsesor !== defaultAsesorName && f.nombreAsesor !== '') ||
    f.director !== '' ||
    f.nombreCliente !== '' ||
    f.nombreDesarrollador !== '' ||
    f.direccion !== '' ||
    f.colonia !== '' ||
    f.unidad !== '' ||
    f.valorDepto !== '' ||
    f.apartado !== '' ||
    f.enganche !== '' ||
    f.pctEnganche !== '' ||
    f.pctPago !== '' ||
    f.mensualidades !== '' ||
    f.montoMensualidades !== '' ||
    f.pagoEscritura !== ''
  )
}

export default function CartaPropuestaPage() {
  const [asesorName, setAsesorName] = useState('')
  const [form, setForm] = useState<FormState>(makeEmptyForm(''))
  const [focusedKey, setFocusedKey] = useState<string | null>(null)

  const [generating, setGenerating] = useState(false)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null)
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null)
  const [confirmNew, setConfirmNew] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          const name = (data?.full_name as string) ?? ''
          setAsesorName(name)
          setForm((prev) => (prev.nombreAsesor === '' ? { ...prev, nombreAsesor: name } : prev))
        })
    })
  }, [])

  const showToast = useCallback((message: string, type: ToastType) => {
    setToast({ message, type })
  }, [])

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSelectProperty = (p: Property) => {
    const precioRaw =
      typeof p.precio_unidad === 'number'
        ? p.precio_unidad
        : Number(p.precio_unidad)
    const contacto = (p as unknown as Record<string, unknown>).contacto_desarrollador as string | null
    setForm((prev) => ({
      ...prev,
      selectedProperty: p,
      nombreDesarrollador: contacto ?? '',
      direccion: p.direccion ?? '',
      colonia: p.colonia ?? '',
      unidad: p.unidad ?? '',
      valorDepto: !isNaN(precioRaw) && precioRaw > 0 ? String(precioRaw) : '',
    }))
  }

  const canGenerate =
    form.selectedProperty !== null &&
    form.nombreAsesor.trim() !== '' &&
    form.director !== '' &&
    form.nombreCliente.trim() !== '' &&
    form.nombreDesarrollador.trim() !== '' &&
    form.direccion.trim() !== '' &&
    form.colonia.trim() !== '' &&
    form.unidad.trim() !== '' &&
    form.valorDepto !== '' &&
    form.apartado !== '' &&
    form.enganche !== '' &&
    form.pctEnganche !== '' &&
    form.pctPago !== '' &&
    form.mensualidades !== '' &&
    form.montoMensualidades !== '' &&
    form.pagoEscritura !== ''

  const handleGenerate = async () => {
    if (!canGenerate) return
    setGenerating(true)
    try {
      const data: CartaPropuestaData = {
        nombre_asesor: form.nombreAsesor.trim(),
        director_ventas: form.director,
        nombre_cliente: form.nombreCliente.trim(),
        nombre_desarrollador: form.nombreDesarrollador.trim(),
        direccion: form.direccion.trim(),
        colonia: form.colonia.trim(),
        unidad: form.unidad.trim(),
        valor_departamento: toNumber(form.valorDepto),
        cantidad_apartado: toNumber(form.apartado),
        enganche: toNumber(form.enganche),
        pct_enganche: toNumber(form.pctEnganche),
        pct_pago: toNumber(form.pctPago),
        mensualidades: toNumber(form.mensualidades),
        monto_mensualidades: toNumber(form.montoMensualidades),
        pago_escritura: toNumber(form.pagoEscritura),
      }
      const blob = await generateCartaPdf(data)
      if (pdfUrl) URL.revokeObjectURL(pdfUrl)
      setPdfBlob(blob)
      setPdfUrl(URL.createObjectURL(blob))
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error al generar PDF', 'error')
    } finally {
      setGenerating(false)
    }
  }

  const handleDownload = () => {
    if (!pdfBlob) return
    const url = pdfUrl ?? URL.createObjectURL(pdfBlob)
    const a = document.createElement('a')
    const safeName = form.nombreCliente.trim().replace(/[^a-zA-Z0-9]+/g, '_') || 'Cliente'
    const d = new Date()
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    a.href = url
    a.download = `Carta_Propuesta_${safeName}_${dateStr}.pdf`
    a.click()
  }

  const buildPayload = (): CartaPropuestaData => ({
    nombre_asesor: form.nombreAsesor.trim(),
    director_ventas: form.director,
    nombre_cliente: form.nombreCliente.trim(),
    nombre_desarrollador: form.nombreDesarrollador.trim(),
    direccion: form.direccion.trim(),
    colonia: form.colonia.trim(),
    unidad: form.unidad.trim(),
    valor_departamento: toNumber(form.valorDepto),
    cantidad_apartado: toNumber(form.apartado),
    enganche: toNumber(form.enganche),
    pct_enganche: toNumber(form.pctEnganche),
    pct_pago: toNumber(form.pctPago),
    mensualidades: toNumber(form.mensualidades),
    monto_mensualidades: toNumber(form.montoMensualidades),
    pago_escritura: toNumber(form.pagoEscritura),
  })

  const handleDownloadWord = async () => {
    try {
      const blob = await generateCartaDocx(buildPayload())
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const safeName = form.nombreCliente.trim().replace(/[^a-zA-Z0-9]+/g, '_') || 'Cliente'
      const d = new Date()
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      a.href = url
      a.download = `Carta_Propuesta_${safeName}_${dateStr}.docx`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      showToast('Error al generar Word', 'error')
    }
  }

  const handleEdit = () => {
    if (pdfUrl) URL.revokeObjectURL(pdfUrl)
    setPdfUrl(null)
    setPdfBlob(null)
  }

  const doReset = () => {
    if (pdfUrl) URL.revokeObjectURL(pdfUrl)
    setPdfUrl(null)
    setPdfBlob(null)
    setForm(makeEmptyForm(asesorName))
  }

  const handleNewCarta = () => {
    if (hasAnyData(form, asesorName) || pdfUrl) {
      setConfirmNew(true)
    } else {
      doReset()
    }
  }

  useEffect(() => {
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="kibah-page-title">Carta Propuesta</h1>
          <p className="kibah-page-desc mt-1">Genera una propuesta de compra para tu cliente</p>
        </div>
        <button
          onClick={handleNewCarta}
          className="kibah-btn-secondary"
          style={{ padding: '8px 16px', fontSize: '13px' }}
        >
          <FilePlus2 className="w-4 h-4" strokeWidth={1.5} />
          Nueva Carta
        </button>
      </div>

      {/* Form: kept mounted so PropertyPicker selection persists when toggling preview */}
      <div className={pdfUrl ? 'hidden' : ''}>
        <div className="kibah-card p-6 space-y-5 max-w-4xl">
          {/* 1. Selector de propiedad */}
          <div>
            <h2 className="text-sm font-semibold text-text-primary mb-3">Selecciona una propiedad *</h2>
            <PropertyPicker
              selectedId={form.selectedProperty ? form.selectedProperty.id : null}
              onSelect={handleSelectProperty}
            />
          </div>

          {/* 2. Asesor + Director */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="kibah-label">Nombre del Asesor *</label>
              <input
                type="text"
                value={form.nombreAsesor}
                onChange={(e) => update('nombreAsesor', e.target.value)}
                placeholder="Nombre del asesor"
                className="kibah-input"
              />
            </div>
            <div>
              <label className="kibah-label">Director de ventas *</label>
              <select
                value={form.director}
                onChange={(e) => update('director', e.target.value)}
                className="kibah-input cursor-pointer"
              >
                <option value="">Selecciona un director</option>
                {DIRECTORES.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 3. Cliente */}
          <div>
            <label className="kibah-label">Nombre del Cliente *</label>
            <input
              type="text"
              value={form.nombreCliente}
              onChange={(e) => update('nombreCliente', e.target.value)}
              placeholder="Nombre completo"
              className="kibah-input"
            />
          </div>

          {/* 4. Datos propiedad (prellenados) */}
          <div>
            <h2 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-1.5">
              Datos de la propiedad
              {form.selectedProperty && (
                <span className="text-[11px] font-normal text-text-tertiary flex items-center gap-1">
                  <LinkIcon className="w-3 h-3" strokeWidth={1.5} />
                  prellenado
                </span>
              )}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="kibah-label">Dirección *</label>
                <input type="text" value={form.direccion} onChange={(e) => update('direccion', e.target.value)} className="kibah-input" />
              </div>
              <div>
                <label className="kibah-label">Colonia *</label>
                <input type="text" value={form.colonia} onChange={(e) => update('colonia', e.target.value)} className="kibah-input" />
              </div>
              <div>
                <label className="kibah-label">Unidad *</label>
                <input type="text" value={form.unidad} onChange={(e) => update('unidad', e.target.value)} className="kibah-input" />
              </div>
              <div>
                <label className="kibah-label">Nombre del Desarrollador *</label>
                <input type="text" value={form.nombreDesarrollador} onChange={(e) => update('nombreDesarrollador', e.target.value)} placeholder="Contacto del desarrollador" className="kibah-input" />
              </div>
            </div>
          </div>

          {/* 5. Datos financieros */}
          <div>
            <h2 className="text-sm font-semibold text-text-primary mb-3">Datos financieros</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <MoneyField
                label="Valor del Departamento (MXN) *"
                id="valorDepto"
                value={form.valorDepto}
                onChange={(v) => update('valorDepto', v)}
                focusedKey={focusedKey}
                setFocusedKey={setFocusedKey}
              />
              <MoneyField
                label="Cantidad Apartado (MXN) *"
                id="apartado"
                value={form.apartado}
                onChange={(v) => update('apartado', v)}
                focusedKey={focusedKey}
                setFocusedKey={setFocusedKey}
              />
              <MoneyField
                label="Enganche (MXN) *"
                id="enganche"
                value={form.enganche}
                onChange={(v) => update('enganche', v)}
                focusedKey={focusedKey}
                setFocusedKey={setFocusedKey}
              />
              <MoneyField
                label="Porcentaje Enganche (%) *"
                id="pctEnganche"
                value={form.pctEnganche}
                onChange={(v) => update('pctEnganche', v)}
                focusedKey={focusedKey}
                setFocusedKey={setFocusedKey}
              />
              <MoneyField
                label="Porcentaje Pago (%) *"
                id="pctPago"
                value={form.pctPago}
                onChange={(v) => update('pctPago', v)}
                focusedKey={focusedKey}
                setFocusedKey={setFocusedKey}
              />
              <MoneyField
                label="Mensualidades *"
                id="mensualidades"
                value={form.mensualidades}
                onChange={(v) => update('mensualidades', v)}
                focusedKey={focusedKey}
                setFocusedKey={setFocusedKey}
              />
              <MoneyField
                label="Monto Mensualidades (MXN) *"
                id="montoMensualidades"
                value={form.montoMensualidades}
                onChange={(v) => update('montoMensualidades', v)}
                focusedKey={focusedKey}
                setFocusedKey={setFocusedKey}
              />
              <MoneyField
                label="Pago a la Escritura (MXN) *"
                id="pagoEscritura"
                value={form.pagoEscritura}
                onChange={(v) => update('pagoEscritura', v)}
                focusedKey={focusedKey}
                setFocusedKey={setFocusedKey}
              />
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-border-primary">
            <button
              onClick={handleGenerate}
              disabled={!canGenerate || generating}
              className="kibah-btn-primary"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.5} />
                  Generando...
                </>
              ) : (
                'Generar Carta'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Preview */}
      {pdfUrl && (
        <div className="kibah-card p-6 max-w-4xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-text-primary">Vista previa</h2>
            <div className="flex items-center gap-2">
              <button onClick={handleEdit} className="kibah-btn-secondary" style={{ padding: '8px 16px', fontSize: '13px' }}>
                <Pencil className="w-4 h-4" strokeWidth={1.5} />
                Editar
              </button>
              <button onClick={handleDownloadWord} className="kibah-btn-secondary" style={{ padding: '8px 16px', fontSize: '13px' }}>
                <Download className="w-4 h-4" strokeWidth={1.5} />
                Descargar Word
              </button>
              <button onClick={handleDownload} className="kibah-btn-primary" style={{ padding: '8px 16px', fontSize: '13px' }}>
                <Download className="w-4 h-4" strokeWidth={1.5} />
                Descargar PDF
              </button>
            </div>
          </div>
          <iframe
            src={pdfUrl}
            title="Carta Propuesta preview"
            className="w-full border border-border-primary rounded-[var(--radius-sm)]"
            style={{ height: '80vh', background: '#FFFFFF' }}
          />
        </div>
      )}

      {confirmNew && (
        <ConfirmDialog
          title="Nueva Carta"
          message="¿Empezar una carta nueva? Se perderán los datos actuales."
          confirmLabel="Empezar de nuevo"
          variant="danger"
          onConfirm={() => {
            doReset()
            setConfirmNew(false)
          }}
          onCancel={() => setConfirmNew(false)}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
