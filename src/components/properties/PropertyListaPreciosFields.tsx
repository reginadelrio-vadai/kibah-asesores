'use client'

/** Campos de la lista de precios del desarrollador (Nivel, Orientación, m² bodega, precios por enganche). */

export const LISTA_PRECIOS_TEXT_FIELDS = ['nivel', 'orientacion'] as const
export const LISTA_PRECIOS_NUMBER_FIELDS = ['m2_bodega', 'precio_eng_10', 'precio_eng_25', 'precio_eng_50', 'precio_eng_75'] as const

const FIELDS: { key: (typeof LISTA_PRECIOS_TEXT_FIELDS)[number] | (typeof LISTA_PRECIOS_NUMBER_FIELDS)[number]; label: string; numeric: boolean; placeholder?: string }[] = [
  { key: 'nivel', label: 'Nivel', numeric: false, placeholder: 'Ej. 3, PB, PH' },
  { key: 'orientacion', label: 'Orientación', numeric: false, placeholder: 'Ej. Norte, Interior' },
  { key: 'm2_bodega', label: 'M2 Bodega', numeric: true },
  { key: 'precio_eng_10', label: 'Precio con enganche 10%', numeric: true },
  { key: 'precio_eng_25', label: 'Precio con enganche 25%', numeric: true },
  { key: 'precio_eng_50', label: 'Precio con enganche 50%', numeric: true },
  { key: 'precio_eng_75', label: 'Precio con enganche 75%', numeric: true },
]

interface Props {
  form: Record<string, string>
  errors: Record<string, string>
  set: (key: string, value: string) => void
  inputClass: (key: string) => string
}

export function PropertyListaPreciosFields({ form, errors, set, inputClass }: Props) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {FIELDS.map((f) => (
        <div key={f.key}>
          <label className="block text-xs font-medium text-text-secondary mb-1">{f.label}</label>
          <input
            className={inputClass(f.key)}
            type={f.numeric ? 'number' : 'text'}
            step={f.numeric ? 'any' : undefined}
            value={form[f.key] ?? ''}
            placeholder={f.placeholder}
            onChange={(e) => set(f.key, e.target.value)}
          />
          {errors[f.key] && <p className="text-xs text-red-500 mt-0.5">{errors[f.key]}</p>}
        </div>
      ))}
    </div>
  )
}
