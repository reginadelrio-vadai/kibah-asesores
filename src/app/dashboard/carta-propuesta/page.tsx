'use client'

import { useCallback, useEffect, useState } from 'react'
import { Download, Pencil, Loader2, Link as LinkIcon } from 'lucide-react'
import type { Property } from '@/types'
import { Toast, type ToastType } from '@/components/ui/Toast'
import { PropertyPicker } from '@/components/carta-propuesta/PropertyPicker'
import { generateCartaPdf, type CartaPropuestaData } from '@/components/carta-propuesta/generateCartaPdf'

const DIRECTORES = ['Iñaki Gonzalez Gámiz', 'Roberto Martínez Licón']

function fmtNumber(n: number | ''): string {
  if (n === '' || isNaN(Number(n))) return ''
  return new Intl.NumberFormat('es-MX', { maximumFractionDigits: 2 }).format(Number(n))
}

function parseNumber(s: string): number | '' {
  const cleaned = s.replace(/[^\d.]/g, '')
  if (cleaned === '') return ''
  const n = Number(cleaned)
  return isNaN(n) ? '' : n
}

export default function CartaPropuestaPage() {
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)

  const [director, setDirector] = useState('')
  const [nombreCliente, setNombreCliente] = useState('')
  const [direccion, setDireccion] = useState('')
  const [colonia, setColonia] = useState('')
  const [unidad, setUnidad] = useState('')
  const [valorDepto, setValorDepto] = useState<number | ''>('')
  const [apartado, setApartado] = useState<number | ''>('')
  const [enganche, setEnganche] = useState<number | ''>('')
  const [pctEnganche, setPctEnganche] = useState<number | ''>('')
  const [pctPago, setPctPago] = useState<number | ''>('')
  const [mensualidades, setMensualidades] = useState<number | ''>('')
  const [montoMensualidades, setMontoMensualidades] = useState<number | ''>('')
  const [pagoEscritura, setPagoEscritura] = useState<number | ''>('')

  const [generating, setGenerating] = useState(false)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null)
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null)

  const showToast = useCallback((message: string, type: ToastType) => {
    setToast({ message, type })
  }, [])

  const handleSelectProperty = (p: Property) => {
    setSelectedProperty(p)
    setDireccion(p.direccion ?? '')
    setColonia(p.colonia ?? '')
    setUnidad(p.unidad ?? '')
    const precio = typeof p.precio_unidad === 'number' ? p.precio_unidad : Number(p.precio_unidad)
    setValorDepto(!isNaN(precio) && precio > 0 ? precio : '')
  }

  const canGenerate =
    !!selectedProperty &&
    !!director &&
    nombreCliente.trim().length > 0 &&
    direccion.trim().length > 0 &&
    colonia.trim().length > 0 &&
    unidad.trim().length > 0 &&
    valorDepto !== '' &&
    apartado !== '' &&
    enganche !== '' &&
    pctEnganche !== '' &&
    pctPago !== '' &&
    mensualidades !== '' &&
    montoMensualidades !== '' &&
    pagoEscritura !== ''

  const handleGenerate = async () => {
    if (!canGenerate) return
    setGenerating(true)
    try {
      const data: CartaPropuestaData = {
        director_ventas: director,
        nombre_cliente: nombreCliente.trim(),
        direccion: direccion.trim(),
        colonia: colonia.trim(),
        unidad: unidad.trim(),
        valor_departamento: Number(valorDepto),
        cantidad_apartado: Number(apartado),
        enganche: Number(enganche),
        pct_enganche: Number(pctEnganche),
        pct_pago: Number(pctPago),
        mensualidades: Number(mensualidades),
        monto_mensualidades: Number(montoMensualidades),
        pago_escritura: Number(pagoEscritura),
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
    const safeName = nombreCliente.trim().replace(/[^a-zA-Z0-9]+/g, '_') || 'Cliente'
    const d = new Date()
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    a.href = url
    a.download = `Carta_Propuesta_${safeName}_${dateStr}.pdf`
    a.click()
  }

  const handleEdit = () => {
    if (pdfUrl) URL.revokeObjectURL(pdfUrl)
    setPdfUrl(null)
    setPdfBlob(null)
  }

  useEffect(() => {
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="space-y-4">
      <div>
        <h1 className="kibah-page-title">Carta Propuesta</h1>
        <p className="kibah-page-desc mt-1">Genera una propuesta de compra para tu cliente</p>
      </div>

      {!pdfUrl ? (
        <div className="kibah-card p-6 space-y-5 max-w-4xl">
          {/* 1. Selector de propiedad */}
          <div>
            <h2 className="text-sm font-semibold text-text-primary mb-3">Selecciona una propiedad *</h2>
            <PropertyPicker
              selectedId={selectedProperty ? selectedProperty.id : null}
              onSelect={handleSelectProperty}
            />
          </div>

          {/* 2. Director de ventas */}
          <div>
            <label className="kibah-label">Director de ventas *</label>
            <select value={director} onChange={(e) => setDirector(e.target.value)} className="kibah-input cursor-pointer">
              <option value="">Selecciona un director</option>
              {DIRECTORES.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* 3. Cliente */}
          <div>
            <label className="kibah-label">Nombre del Cliente *</label>
            <input
              type="text"
              value={nombreCliente}
              onChange={(e) => setNombreCliente(e.target.value)}
              placeholder="Nombre completo"
              className="kibah-input"
            />
          </div>

          {/* 4. Datos de la propiedad (prellenados) */}
          <div>
            <h2 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-1.5">
              Datos de la propiedad
              {selectedProperty && (
                <span className="text-[11px] font-normal text-text-tertiary flex items-center gap-1">
                  <LinkIcon className="w-3 h-3" strokeWidth={1.5} />
                  prellenado
                </span>
              )}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="kibah-label">Dirección *</label>
                <input type="text" value={direccion} onChange={(e) => setDireccion(e.target.value)} className="kibah-input" />
              </div>
              <div>
                <label className="kibah-label">Colonia *</label>
                <input type="text" value={colonia} onChange={(e) => setColonia(e.target.value)} className="kibah-input" />
              </div>
              <div>
                <label className="kibah-label">Unidad *</label>
                <input type="text" value={unidad} onChange={(e) => setUnidad(e.target.value)} className="kibah-input" />
              </div>
            </div>
          </div>

          {/* 5. Datos financieros */}
          <div>
            <h2 className="text-sm font-semibold text-text-primary mb-3">Datos financieros</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="kibah-label">Valor del Departamento (MXN) *</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={fmtNumber(valorDepto)}
                  onChange={(e) => setValorDepto(parseNumber(e.target.value))}
                  placeholder="$0"
                  className="kibah-input"
                />
              </div>
              <div>
                <label className="kibah-label">Cantidad Apartado (MXN) *</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={fmtNumber(apartado)}
                  onChange={(e) => setApartado(parseNumber(e.target.value))}
                  placeholder="$0"
                  className="kibah-input"
                />
              </div>
              <div>
                <label className="kibah-label">Enganche (MXN) *</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={fmtNumber(enganche)}
                  onChange={(e) => setEnganche(parseNumber(e.target.value))}
                  placeholder="$0"
                  className="kibah-input"
                />
              </div>
              <div>
                <label className="kibah-label">Porcentaje Enganche (%) *</label>
                <input
                  type="number"
                  value={pctEnganche}
                  onChange={(e) => setPctEnganche(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="0"
                  className="kibah-input"
                />
              </div>
              <div>
                <label className="kibah-label">Porcentaje Pago (%) *</label>
                <input
                  type="number"
                  value={pctPago}
                  onChange={(e) => setPctPago(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="0"
                  className="kibah-input"
                />
              </div>
              <div>
                <label className="kibah-label">Mensualidades *</label>
                <input
                  type="number"
                  step="1"
                  value={mensualidades}
                  onChange={(e) => setMensualidades(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="0"
                  className="kibah-input"
                />
              </div>
              <div>
                <label className="kibah-label">Monto Mensualidades (MXN) *</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={fmtNumber(montoMensualidades)}
                  onChange={(e) => setMontoMensualidades(parseNumber(e.target.value))}
                  placeholder="$0"
                  className="kibah-input"
                />
              </div>
              <div>
                <label className="kibah-label">Pago a la Escritura (MXN) *</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={fmtNumber(pagoEscritura)}
                  onChange={(e) => setPagoEscritura(parseNumber(e.target.value))}
                  placeholder="$0"
                  className="kibah-input"
                />
              </div>
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
      ) : (
        <div className="kibah-card p-6 max-w-4xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-text-primary">Vista previa</h2>
            <div className="flex items-center gap-2">
              <button onClick={handleEdit} className="kibah-btn-secondary" style={{ padding: '8px 16px', fontSize: '13px' }}>
                <Pencil className="w-4 h-4" strokeWidth={1.5} />
                Editar
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

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
