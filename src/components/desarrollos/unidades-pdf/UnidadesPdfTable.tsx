'use client'

import { memo, useState } from 'react'
import { AlertCircle, Info } from 'lucide-react'
import { BODEGA_OPTIONS, DISPONIBILIDAD_OPTIONS, PRECIO_LISTA } from '@/lib/utils/constants'
import {
  erroresFila,
  esVendida,
  patchBodega,
  precioPrincipalDe,
  type Bodega,
  type Coincidencia,
  type Disponibilidad,
  type FilaRevision,
} from '@/lib/utils/unidades-pdf'
import type { PrecioColumna, PrecioPrincipal } from '@/types/unidades-pdf'

const priceFormat = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 })
const nombreColumna = (c: PrecioColumna) => (c === PRECIO_LISTA ? 'Lista' : `Eng ${c}%`)

interface UnidadesPdfTableProps {
  filas: FilaRevision[]
  /** Coincidencia con unidades existentes, por key de fila. */
  coincidencias: Map<string, Coincidencia>
  precioPrincipal: PrecioPrincipal
  /** Columnas de precio que trae el PDF (las demás se ocultan). */
  columnasPrecio: PrecioColumna[]
  repetidas: Set<string>
  onChange: (key: string, patch: Partial<FilaRevision>) => void
  onIncluirTodas: (incluir: boolean) => void
}

const cellInput =
  'w-full h-8 px-2 text-xs rounded-[var(--radius-sm)] bg-transparent border border-transparent text-text-primary ' +
  'hover:border-border-primary focus:border-orange focus:outline-none focus:bg-bg-primary tabular-nums'

const numberFormat = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 2 })

function parseNum(raw: string): number | null {
  const clean = raw.replace(/[$,\s]/g, '')
  if (clean === '') return null
  const n = Number(clean)
  return isNaN(n) ? null : n
}

/** Input numérico: muestra el valor con separadores y deja escribir libre mientras tiene foco. */
function NumCell({ value, onChange, width, label }: { value: number | null; onChange: (v: number | null) => void; width: string; label: string }) {
  const [draft, setDraft] = useState<string | null>(null)
  const shown = draft ?? (value === null ? '' : numberFormat.format(value))
  return (
    <input
      inputMode="decimal"
      aria-label={label}
      value={shown}
      placeholder="—"
      onFocus={() => setDraft(value === null ? '' : String(value))}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => { if (draft !== null) onChange(parseNum(draft)); setDraft(null) }}
      className={`${cellInput} text-right ${width}`}
    />
  )
}

function TextCell({ value, onChange, width, label }: { value: string | null; onChange: (v: string | null) => void; width: string; label: string }) {
  return (
    <input
      aria-label={label}
      value={value ?? ''}
      placeholder="—"
      onChange={(e) => onChange(e.target.value || null)}
      className={`${cellInput} ${width}`}
    />
  )
}

/**
 * Sí / No visible (clic de nuevo = sin dato), el tamaño en m² (editable por si el OCR falló)
 * y, debajo, lo que dice el PDF tal cual.
 */
function BodegaCell({ value, m2, pdf, onChange }: {
  value: Bodega | null
  m2: number | null
  pdf: string | null
  onChange: (patch: Partial<FilaRevision>) => void
}) {
  return (
    <div className="flex flex-col items-start gap-1 py-1">
      <div className="flex items-center gap-1">
        <div role="group" aria-label="Bodega" className="inline-flex rounded-[var(--radius-sm)] border border-border-primary overflow-hidden">
          {BODEGA_OPTIONS.map((o) => (
            <button
              key={o}
              type="button"
              aria-pressed={value === o}
              onClick={() => onChange(patchBodega({ bodega: value === o ? null : o }))}
              className={`h-7 px-2.5 text-xs font-medium transition-colors cursor-pointer ${
                value === o ? 'bg-orange text-white' : 'text-text-secondary hover:bg-bg-tertiary'
              }`}
            >
              {o}
            </button>
          ))}
        </div>
        <div className="flex items-center rounded-[var(--radius-sm)] border border-border-primary">
          <NumCell label="Tamaño de bodega m²" value={m2} onChange={(v) => onChange(patchBodega({ bodega_m2: v }))} width="w-14 !border-0" />
          <span className="pr-1.5 text-[10px] text-text-tertiary">m²</span>
        </div>
      </div>
      {pdf && (
        <span className="text-[10px] text-text-tertiary max-w-[96px] truncate" title={`En el PDF: ${pdf}`}>
          PDF: {pdf}
        </span>
      )}
    </div>
  )
}

const Fila = memo(function Fila({ f, c, precioPrincipal, columnasPrecio, repetidas, onChange }: {
  f: FilaRevision
  c: Coincidencia | undefined
  precioPrincipal: PrecioPrincipal
  columnasPrecio: PrecioColumna[]
  repetidas: Set<string>
  onChange: UnidadesPdfTableProps['onChange']
}) {
  const set = (patch: Partial<FilaRevision>) => onChange(f.key, patch)
  const errores = f.incluir ? erroresFila(f, precioPrincipal, repetidas, c) : []
  const precioFinal = precioPrincipalDe(f.precios, precioPrincipal)
  const rowTone = !f.incluir ? 'opacity-45' : errores.length > 0 ? 'bg-error/5' : ''

  return (
    <tr className={`border-b border-border-primary ${rowTone}`}>
      <td className="sticky left-0 z-[1] bg-inherit px-2">
        <input
          type="checkbox"
          checked={f.incluir}
          onChange={(e) => set({ incluir: e.target.checked })}
          aria-label={`Incluir unidad ${f.unidad}`}
          className="w-4 h-4 accent-orange cursor-pointer"
        />
      </td>
      <td className="px-1 whitespace-nowrap">
        <div className="flex items-center gap-1">
          {c?.ambigua ? (
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-red-500/15 text-red-700 dark:text-red-400">¿Cuál?</span>
          ) : c?.existente ? (
            <span
              title={`Se actualiza la unidad existente${c.existente.torre ? ` de ${c.existente.torre}` : ''}`}
              className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-700 dark:text-blue-400"
            >
              Actualizar
            </span>
          ) : (
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">Nueva</span>
          )}
          {c && !c.ambigua && !c.existente && c.otrasTorres.length > 0 && (
            <span
              title={`Ya existe una unidad ${f.unidad} en: ${c.otrasTorres.join(', ')}. Si es la misma, corrige la torre arriba para actualizarla en vez de duplicarla.`}
              className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400"
            >
              Existe en {c.otrasTorres.join(', ')}
            </span>
          )}
          {esVendida(f.estadoPdf) && (
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-red-500/15 text-red-700 dark:text-red-400">Vendida</span>
          )}
          {errores.length > 0 && (
            <span title={errores.join('\n')}><AlertCircle className="w-4 h-4 text-error" strokeWidth={1.5} /></span>
          )}
          {f.nota && (
            <span title={`Nota de la lectura: ${f.nota}`}><Info className="w-4 h-4 text-amber-500" strokeWidth={1.5} /></span>
          )}
        </div>
      </td>
      <td className="px-1"><TextCell label="Unidad" value={f.unidad} onChange={(v) => set({ unidad: v ?? '' })} width="w-20 font-semibold" /></td>
      <td className="px-1"><TextCell label="Nivel" value={f.nivel} onChange={(v) => set({ nivel: v })} width="w-14" /></td>
      <td className="px-1"><TextCell label="Orientación" value={f.orientacion} onChange={(v) => set({ orientacion: v })} width="w-20" /></td>
      <td className="px-1"><NumCell label="Recámaras" value={f.recamaras} onChange={(v) => set({ recamaras: v })} width="w-12" /></td>
      <td className="px-1"><NumCell label="Baños" value={f.banos} onChange={(v) => set({ banos: v })} width="w-12" /></td>
      <td className="px-1"><NumCell label="Interior m²" value={f.m2_interior} onChange={(v) => set({ m2_interior: v })} width="w-16" /></td>
      <td className="px-1"><NumCell label="Balcón m²" value={f.m2_balcon} onChange={(v) => set({ m2_balcon: v })} width="w-16" /></td>
      <td className="px-1"><NumCell label="Patio m²" value={f.m2_patio} onChange={(v) => set({ m2_patio: v })} width="w-16" /></td>
      <td className="px-1"><NumCell label="Total m²" value={f.m2_total} onChange={(v) => set({ m2_total: v })} width="w-16" /></td>
      <td className="px-1">
        <BodegaCell value={f.bodega} m2={f.bodega_m2} pdf={f.bodegaPdf} onChange={set} />
      </td>
      {columnasPrecio.map((col) => (
        <td key={col} className={`px-1 ${col === precioPrincipal ? 'bg-orange/5' : ''}`}>
          <NumCell
            label={`Precio ${nombreColumna(col)}`}
            value={f.precios[col]}
            onChange={(v) => set({ precios: { ...f.precios, [col]: v } })}
            width="w-28"
          />
        </td>
      ))}
      <td className="px-2 text-right font-semibold tabular-nums whitespace-nowrap bg-orange/5 text-text-primary">
        {precioFinal === null ? <span className="text-error">—</span> : priceFormat.format(precioFinal)}
      </td>
      <td className="px-1">
        <TextCell
          label="Drive propio de la unidad"
          value={f.link_drive_unidad}
          onChange={(v) => set({ link_drive_unidad: v })}
          width="w-44"
        />
      </td>
      <td className="px-1">
        <select
          aria-label="Disponibilidad"
          value={f.disponibilidad}
          onChange={(e) => set({ disponibilidad: e.target.value as Disponibilidad })}
          className={`${cellInput} w-28 cursor-pointer`}
        >
          {DISPONIBILIDAD_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      </td>
    </tr>
  )
})

const HEADERS = ['Unidad', 'Nivel', 'Orient.', 'Rec.', 'Baños', 'Int m²', 'Balcón m²', 'Patio m²', 'Total m²', 'Bodega / m²']

/** Tabla editable con lo que Claude leyó del PDF. */
export function UnidadesPdfTable({ filas, coincidencias, precioPrincipal, columnasPrecio, repetidas, onChange, onIncluirTodas }: UnidadesPdfTableProps) {
  const todas = filas.length > 0 && filas.every((f) => f.incluir)
  const th = 'px-2 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-text-tertiary whitespace-nowrap'

  return (
    <div className="overflow-auto rounded-[var(--radius-sm)] border border-border-primary">
      <table className="min-w-max w-full text-xs">
        <thead className="sticky top-0 z-[2] kibah-modal-solid border-b border-border-primary">
          <tr>
            <th className={`${th} sticky left-0 kibah-modal-solid`}>
              <input
                type="checkbox"
                checked={todas}
                onChange={(e) => onIncluirTodas(e.target.checked)}
                aria-label="Incluir todas"
                className="w-4 h-4 cursor-pointer"
              />
            </th>
            <th className={th}>Estado</th>
            {HEADERS.map((h) => <th key={h} className={th}>{h}</th>)}
            {columnasPrecio.map((col) => (
              <th key={col} className={`${th} text-right ${col === precioPrincipal ? '!text-orange' : ''}`}>
                {nombreColumna(col)}{col === precioPrincipal ? ' ★' : ''}
              </th>
            ))}
            <th className={`${th} text-right !text-orange`} title="Lo que se guarda en Precio por unidad">→ Precio por unidad</th>
            <th className={th} title="Vacío = usa el Drive del desarrollo. Se llena solo si la unidad tenía carpeta propia antes.">Drive propio</th>
            <th className={th}>Disponibilidad</th>
          </tr>
        </thead>
        <tbody className="kibah-modal-solid">
          {filas.map((f) => (
            <Fila key={f.key} f={f} c={coincidencias.get(f.key)} precioPrincipal={precioPrincipal} columnasPrecio={columnasPrecio} repetidas={repetidas} onChange={onChange} />
          ))}
        </tbody>
      </table>
    </div>
  )
}
