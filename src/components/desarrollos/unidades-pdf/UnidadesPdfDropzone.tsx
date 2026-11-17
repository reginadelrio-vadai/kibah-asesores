'use client'

import { useRef, useState } from 'react'
import { FileUp } from 'lucide-react'

interface UnidadesPdfDropzoneProps {
  onFile: (file: File) => void
}

/** Zona para arrastrar o elegir el PDF de la lista de precios. */
export function UnidadesPdfDropzone({ onFile }: UnidadesPdfDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragging(false)
        const file = e.dataTransfer.files[0]
        if (file) onFile(file)
      }}
      className={`flex flex-col items-center justify-center text-center gap-3 px-6 py-14 rounded-[16px] border-2 border-dashed transition-colors ${
        dragging ? 'border-orange bg-orange/5' : 'border-border-primary'
      }`}
    >
      <div className="w-12 h-12 rounded-full bg-orange/10 flex items-center justify-center">
        <FileUp className="w-6 h-6 text-orange" strokeWidth={1.5} />
      </div>
      <div>
        <p className="text-sm font-semibold text-text-primary">Arrastra aquí el PDF de la lista de precios</p>
        <p className="text-xs text-text-tertiary mt-1">
          Claude lee la tabla de unidades (departamento, nivel, orientación, m², bodega, precio de lista y precios por enganche).
          <br />Nada se guarda hasta que revises y confirmes. Máximo 4 MB.
        </p>
      </div>
      <button type="button" onClick={() => inputRef.current?.click()} className="kibah-btn-primary" style={{ padding: '8px 16px', fontSize: '13px' }}>
        Elegir PDF
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onFile(file)
          e.target.value = ''
        }}
      />
    </div>
  )
}
