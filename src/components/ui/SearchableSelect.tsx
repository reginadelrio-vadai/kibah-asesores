'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, ChevronDown, PenLine, Search } from 'lucide-react'

interface SearchableSelectProps {
  options: string[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  /** Texto de la opción para escribir un valor que no está en la lista. */
  otroLabel?: string
  className?: string
  hasError?: boolean
}

const normalize = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

/**
 * Select con buscador. Hasta arriba "Otro" para escribir un valor nuevo.
 * Si el valor actual no está en la lista, arranca en modo "Otro".
 */
export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Seleccionar',
  otroLabel = 'Otro (escribir)',
  className = '',
  hasError = false,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [custom, setCustom] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const customRef = useRef<HTMLInputElement>(null)

  const inList = useMemo(() => options.some((o) => normalize(o) === normalize(value)), [options, value])
  const isCustom = custom || (value.trim() !== '' && options.length > 0 && !inList)

  const filtered = useMemo(() => {
    const q = normalize(query)
    return q ? options.filter((o) => normalize(o).includes(q)) : options
  }, [options, query])

  useEffect(() => {
    if (!open) return
    searchRef.current?.focus()
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  const choose = (v: string) => {
    onChange(v)
    setCustom(false)
    setOpen(false)
    setQuery('')
  }

  const chooseOtro = () => {
    setCustom(true)
    setOpen(false)
    setQuery('')
    onChange('')
    requestAnimationFrame(() => customRef.current?.focus())
  }

  const border = hasError ? 'border-red-500' : 'border-border-primary focus:border-orange'
  const base = `w-full h-9 px-3 text-sm rounded-[var(--radius-sm)] border bg-bg-primary text-text-primary transition-colors ${border}`

  if (isCustom) {
    return (
      <div className={`flex gap-2 ${className}`}>
        <input ref={customRef} className={base} value={value} onChange={(e) => onChange(e.target.value)} placeholder="Escribe el nombre" />
        <button
          type="button"
          onClick={() => { setCustom(false); onChange('') }}
          className="h-9 px-2 text-xs text-text-secondary hover:text-text-primary border border-border-primary rounded-[var(--radius-sm)] whitespace-nowrap cursor-pointer transition-colors"
        >
          Lista
        </button>
      </div>
    )
  }

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`${base} flex items-center justify-between gap-2 text-left cursor-pointer`}
      >
        <span className={`truncate ${value ? '' : 'text-text-tertiary'}`}>{value || placeholder}</span>
        <ChevronDown className="w-4 h-4 text-text-tertiary flex-shrink-0" strokeWidth={1.5} />
      </button>

      {open && (
        <div className="absolute z-20 mt-1 w-full kibah-modal-solid border border-border-primary rounded-[var(--radius-sm)] shadow-xl overflow-hidden">
          <button
            type="button"
            onClick={chooseOtro}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-orange hover:bg-orange/10 border-b border-border-primary cursor-pointer"
          >
            <PenLine className="w-4 h-4" strokeWidth={1.5} /> {otroLabel}
          </button>
          <div className="relative border-b border-border-primary">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary pointer-events-none" strokeWidth={1.5} />
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); setOpen(false) }
                if (e.key === 'Enter') { e.preventDefault(); if (filtered[0]) choose(filtered[0]) }
              }}
              placeholder="Buscar..."
              aria-label="Buscar"
              className="w-full h-9 pl-9 pr-3 text-sm bg-transparent text-text-primary focus:outline-none"
            />
          </div>
          <ul role="listbox" className="max-h-60 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-text-tertiary">Sin resultados. Usa &quot;{otroLabel}&quot;.</li>
            ) : (
              filtered.map((o) => {
                const selected = normalize(o) === normalize(value)
                return (
                  <li key={o}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={selected}
                      onClick={() => choose(o)}
                      className={`w-full flex items-center justify-between gap-2 px-3 py-1.5 text-sm text-left cursor-pointer hover:bg-bg-tertiary ${selected ? 'text-orange font-medium' : 'text-text-primary'}`}
                    >
                      <span className="truncate">{o}</span>
                      {selected && <Check className="w-4 h-4 flex-shrink-0" strokeWidth={1.5} />}
                    </button>
                  </li>
                )
              })
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
