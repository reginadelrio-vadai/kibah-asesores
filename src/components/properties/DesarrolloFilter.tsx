'use client'

import { useEffect, useId, useMemo, useState } from 'react'
import { Layers, X } from 'lucide-react'

export interface DesarrolloOption {
  nombre_kibah: string
  torres: string[]
}

interface DesarrolloFilterProps {
  options: DesarrolloOption[]
  /** Valor activo del filtro (Nombre Kibah) o undefined. */
  value: string | undefined
  onChange: (key: string, value: string, label?: string, displayValue?: string) => void
  className?: string
}

export const DESARROLLO_FILTER_KEY = 'nombre_kibah'
const DESARROLLO_FILTER_LABEL = 'Desarrollo'

/**
 * Filtro de Propiedades por desarrollo (padre = Nombre Kibah). Se escribe para buscar
 * y se aplica al elegir un desarrollo de la lista. La lista también sugiere por nombre de torre.
 */
export function DesarrolloFilter({ options, value, onChange, className = '' }: DesarrolloFilterProps) {
  const listId = useId()
  const [text, setText] = useState(value ?? '')

  const byLower = useMemo(() => {
    const m = new Map<string, string>()
    for (const o of options) m.set(o.nombre_kibah.toLowerCase(), o.nombre_kibah)
    return m
  }, [options])

  // Sincroniza cuando el filtro cambia desde fuera (chip quitado, "Limpiar", filtro guardado).
  useEffect(() => {
    if (value) setText(value)
    else setText((t) => (byLower.has(t.trim().toLowerCase()) ? '' : t))
  }, [value, byLower])

  const handleChange = (next: string) => {
    setText(next)
    const match = byLower.get(next.trim().toLowerCase())
    if (match) onChange(DESARROLLO_FILTER_KEY, match, DESARROLLO_FILTER_LABEL, match)
    else if (value) onChange(DESARROLLO_FILTER_KEY, '')
  }

  return (
    <div className={`relative ${className}`}>
      <Layers className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary pointer-events-none" strokeWidth={1.5} />
      <input
        type="text"
        list={listId}
        value={text}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Filtrar por desarrollo..."
        aria-label="Filtrar por desarrollo"
        className="h-10 w-full pl-9 pr-8 text-sm rounded-[var(--radius-sm)] bg-input-bg border border-input-border
          text-text-primary focus:outline-none focus:ring-2 focus:ring-input-focus-ring"
      />
      {text && (
        <button
          type="button"
          onClick={() => handleChange('')}
          aria-label="Quitar filtro de desarrollo"
          className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center w-6 h-6 rounded hover:bg-bg-tertiary cursor-pointer"
        >
          <X className="w-3.5 h-3.5 text-text-secondary" strokeWidth={1.5} />
        </button>
      )}
      <datalist id={listId}>
        {options.map((o) => (
          <option key={o.nombre_kibah} value={o.nombre_kibah}>
            {o.torres.join(' · ')}
          </option>
        ))}
      </datalist>
    </div>
  )
}
