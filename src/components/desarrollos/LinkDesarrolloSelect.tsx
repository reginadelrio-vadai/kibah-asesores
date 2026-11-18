'use client'

import { ExternalLink } from 'lucide-react'
import { LINK_TIPO_STYLES, tipoDeLink, type OpcionLink } from '@/lib/utils/link-tipo'

interface LinkDesarrolloSelectProps {
  opciones: OpcionLink[]
  value: string | null
  onChange: (value: string | null) => void
  label?: string
}

function TipoBadge({ value }: { value: string | null }) {
  const tipo = tipoDeLink(value)
  if (!tipo) return null
  return <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${LINK_TIPO_STYLES[tipo]}`}>{tipo}</span>
}

/**
 * Escoge UN link de los que ya tiene el desarrollo para que lo hereden sus unidades.
 * Muestra el valor completo y si es Drive, Cloudinary o Maps, para que el encargado lo revise.
 */
export function LinkDesarrolloSelect({ opciones, value, onChange, label = 'Link que heredan las unidades' }: LinkDesarrolloSelectProps) {
  const actual = value?.trim() || null
  const enOpciones = actual !== null && opciones.some((o) => o.value === actual)

  return (
    <div className="space-y-1.5">
      <span className="block text-xs text-text-tertiary">{label}</span>
      <select
        value={actual === null ? '' : enOpciones ? actual : '__actual__'}
        onChange={(e) => onChange(e.target.value === '' ? null : e.target.value === '__actual__' ? actual : e.target.value)}
        className="kibah-input cursor-pointer"
      >
        <option value="">— Sin link —</option>
        {actual !== null && !enOpciones && <option value="__actual__">Actual (escrito a mano)</option>}
        {opciones.map((o) => (
          <option key={`${o.campo}-${o.value}`} value={o.value}>
            {o.campo} · {o.tipo} · {o.value.length > 60 ? `${o.value.slice(0, 60)}…` : o.value}
          </option>
        ))}
      </select>
      {actual && (
        <div className="flex items-start gap-2 text-xs">
          <TipoBadge value={actual} />
          <a href={actual} target="_blank" rel="noopener noreferrer" className="text-orange hover:underline break-all min-w-0">
            {actual} <ExternalLink className="inline w-3 h-3 -mt-0.5" strokeWidth={1.5} />
          </a>
        </div>
      )}
      {actual && tipoDeLink(actual) !== 'Drive' && (
        <p className="text-[11px] text-amber-600 dark:text-amber-400">Ojo: este link no es de Google Drive.</p>
      )}
    </div>
  )
}
