'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Download, Loader2, AlertTriangle } from 'lucide-react'
import { usePdfSelection } from '@/hooks/usePdfSelection'
import { PdfPreview } from './PdfPreview'
import { PdfPropertySelector } from './PdfPropertySelector'
import { generatePdf } from './generatePdf'
import { Toast, type ToastType } from '@/components/ui/Toast'

export function PdfBuilder() {
  const { selectedProperties, count, removeProperty, toggleProperty, clearSelection } = usePdfSelection()
  const [imageMap, setImageMap] = useState<Record<string, string>>({})
  const [generating, setGenerating] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null)

  const selectedIds = useMemo(
    () => new Set(selectedProperties.map((p) => p.id)),
    [selectedProperties]
  )

  // Fetch images for selected properties
  useEffect(() => {
    const nombres = selectedProperties
      .map((p) => p.nombre_kibah)
      .filter((n): n is string => !!n)
    const unique = [...new Set(nombres)]
    if (unique.length === 0) { setImageMap({}); return }

    fetch('/api/pdf/images', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombres: unique }),
    })
      .then((r) => r.json())
      .then((data) => setImageMap(data.images ?? {}))
      .catch(() => {})
  }, [selectedProperties])

  const handleGenerate = useCallback(async () => {
    if (count === 0) return
    setGenerating(true)
    try {
      const blob = await generatePdf(selectedProperties, imageMap)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const date = new Date().toISOString().slice(0, 10)
      a.download = `Kibah-Propiedades-${date}.pdf`
      a.click()
      URL.revokeObjectURL(url)
      setToast({ message: 'PDF descargado', type: 'success' })
    } catch (err) {
      console.error('PDF generation error:', err)
      setToast({ message: 'Error al generar PDF', type: 'error' })
    } finally {
      setGenerating(false)
    }
  }, [count, selectedProperties, imageMap])

  return (
    <div className="space-y-6">
      {/* Preview */}
      <PdfPreview
        properties={selectedProperties}
        imageMap={imageMap}
        onRemove={removeProperty}
      />

      {count > 0 && (
        <div className="flex items-center gap-3">
          <button
            onClick={clearSelection}
            className="text-xs text-text-tertiary hover:text-text-secondary transition-colors cursor-pointer"
          >
            Limpiar selección
          </button>
        </div>
      )}

      {count >= 50 && (
        <div className="flex items-center gap-2 p-3 rounded-[var(--radius-sm)] bg-amber-500/10 border border-amber-500/20">
          <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" strokeWidth={1.5} />
          <p className="text-xs text-amber-600 dark:text-amber-400">El PDF puede tardar en generarse con muchas propiedades.</p>
        </div>
      )}

      {/* Generate button */}
      <button
        onClick={handleGenerate}
        disabled={count === 0 || generating}
        className="flex items-center justify-center gap-2 w-full h-11 text-sm font-medium rounded-[var(--radius-sm)]
          bg-orange text-white hover:bg-orange-hover disabled:opacity-40 disabled:cursor-not-allowed
          transition-colors cursor-pointer"
      >
        {generating ? (
          <><Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.5} /> Generando PDF...</>
        ) : (
          <><Download className="w-4 h-4" strokeWidth={1.5} /> Generar y Descargar PDF ({count})</>
        )}
      </button>

      {/* Separator */}
      <div className="border-t border-border-primary pt-4">
        <h3 className="text-sm font-semibold text-text-primary mb-3">Agregar propiedades</h3>
        <PdfPropertySelector selectedIds={selectedIds} onToggle={toggleProperty} />
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
