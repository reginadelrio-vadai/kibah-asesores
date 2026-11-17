'use client'

import { Sparkles } from 'lucide-react'
import { BODEGA_OPTIONS, ENGANCHE_OPTIONS } from '@/lib/utils/constants'
import type { Bodega } from '@/lib/utils/unidades-pdf'
import type { EngancheOption, LecturaPdf } from '@/types/unidades-pdf'

interface UnidadesPdfReviewBarProps {
  lectura: LecturaPdf
  torre: string
  onTorre: (v: string) => void
  precioPrincipal: EngancheOption
  onPrecioPrincipal: (v: EngancheOption) => void
  onBodegaTodas: (v: Bodega) => void
  conteo: { leidas: number; nuevas: number; actualizar: number; omitidas: number; conError: number }
}

function Count({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return (
    <div className="rounded-[var(--radius-sm)] bg-bg-tertiary px-3 py-2 min-w-[84px]">
      <dt className="text-[11px] text-text-tertiary">{label}</dt>
      <dd className={`text-sm font-semibold mt-0.5 ${tone ?? 'text-text-primary'}`}>{value}</dd>
    </div>
  )
}

/** Controles y resumen arriba de la tabla de revisión. */
export function UnidadesPdfReviewBar({ lectura, torre, onTorre, precioPrincipal, onPrecioPrincipal, onBodegaTodas, conteo }: UnidadesPdfReviewBarProps) {
  return (
    <div className="space-y-3">
      <dl className="flex flex-wrap gap-2">
        <Count label="Leídas" value={conteo.leidas} />
        <Count label="Nuevas" value={conteo.nuevas} tone="text-emerald-600 dark:text-emerald-400" />
        <Count label="Actualizar" value={conteo.actualizar} tone="text-blue-600 dark:text-blue-400" />
        <Count label="Omitidas" value={conteo.omitidas} tone="text-text-secondary" />
        {conteo.conError > 0 && <Count label="Con error" value={conteo.conError} tone="text-error" />}
      </dl>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <label className="block">
          <span className="text-xs text-text-tertiary">Torre (para comparar con las existentes y asignar a las nuevas)</span>
          <input value={torre} onChange={(e) => onTorre(e.target.value)} placeholder="Ej. SEVILLA 1" className="kibah-input mt-1" />
        </label>
        <label className="block">
          <span className="text-xs text-text-tertiary">¿Qué precio va en &quot;Precio por unidad&quot;?</span>
          <select
            value={precioPrincipal}
            onChange={(e) => onPrecioPrincipal(e.target.value as EngancheOption)}
            className="kibah-input mt-1 cursor-pointer"
          >
            {ENGANCHE_OPTIONS.map((e) => <option key={e} value={e}>Precio con enganche {e}%</option>)}
          </select>
        </label>
        <div>
          <span className="text-xs text-text-tertiary">Bodega para todas las marcadas</span>
          <div className="flex gap-2 mt-1">
            {BODEGA_OPTIONS.map((o) => (
              <button
                key={o}
                type="button"
                onClick={() => onBodegaTodas(o)}
                className="kibah-btn-secondary flex-1"
                style={{ padding: '8px 12px', fontSize: '13px' }}
              >
                Todas {o}
              </button>
            ))}
          </div>
        </div>
      </div>

      {(lectura.observaciones || lectura.columnas_detectadas.length > 0) && (
        <div className="flex gap-3 p-3 rounded-[var(--radius-sm)] bg-orange/5 border border-orange/20">
          <Sparkles className="w-4 h-4 text-orange flex-shrink-0 mt-0.5" strokeWidth={1.5} />
          <div className="text-xs text-text-secondary space-y-1.5 min-w-0">
            {lectura.columnas_detectadas.length > 0 && (
              <p>
                <span className="font-medium text-text-primary">Columnas que encontró Claude:</span>{' '}
                {lectura.columnas_detectadas.join(' · ')}
              </p>
            )}
            {lectura.observaciones && (
              <p><span className="font-medium text-text-primary">Observaciones:</span> {lectura.observaciones}</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
