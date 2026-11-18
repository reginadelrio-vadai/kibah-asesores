'use client'

import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, CheckCircle2, Eye, EyeOff, FileText, Loader2, RotateCcw, X } from 'lucide-react'
import { useUnidadesPdf } from '@/hooks/useUnidadesPdf'
import { buscarExistente, columnasPrecioConDatos, erroresFila, etiquetaPrecio, unidadesRepetidas } from '@/lib/utils/unidades-pdf'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import type { OpcionLink } from '@/lib/utils/link-tipo'
import { UnidadesPdfDropzone } from './UnidadesPdfDropzone'
import { UnidadesPdfReviewBar } from './UnidadesPdfReviewBar'
import { UnidadesPdfTable } from './UnidadesPdfTable'

interface UnidadesPdfModalProps {
  desarrolloId: number
  nombre: string
  torreDefault: string | null
  /** Links que ya tiene el desarrollo, para escoger cuál heredan las unidades. */
  opcionesLink: OpcionLink[]
  canEditDesarrollo: boolean
  onClose: () => void
  /** Se llama tras guardar, para refrescar la lista de unidades. */
  onImported: () => void
}

/** Indicador mientras Claude lee; se monta solo en esa etapa, así el contador arranca en 0. */
function Leyendo() {
  const [secs, setSecs] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setSecs((s) => s + 1), 1000)
    return () => clearInterval(t)
  }, [])
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 py-16">
      <Loader2 className="w-8 h-8 text-orange animate-spin" strokeWidth={1.5} />
      <p className="text-sm font-medium text-text-primary">Claude está leyendo el PDF… {secs}s</p>
      <p className="text-xs text-text-tertiary max-w-sm">Una lista de precios larga puede tardar uno o dos minutos. No cierres esta ventana.</p>
    </div>
  )
}

/** Flujo "Subir unidades por PDF": elegir PDF → Claude lo lee → revisar/editar → confirmar → guardar. */
export function UnidadesPdfModal({ desarrolloId, nombre, torreDefault, opcionesLink, canEditDesarrollo, onClose, onImported }: UnidadesPdfModalProps) {
  const pdf = useUnidadesPdf(desarrolloId, torreDefault)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [showPdf, setShowPdf] = useState(true)
  const busy = pdf.etapa === 'saving'

  // Esc cierra el modal, salvo que el diálogo de confirmación esté abierto o se esté guardando.
  const blockEsc = confirmOpen || busy
  useEffect(() => {
    if (blockEsc) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose, blockEsc])

  const repetidas = useMemo(() => unidadesRepetidas(pdf.filas), [pdf.filas])
  // Fijas según lo que leyó Claude: no desaparecen si borras una celda al editar.
  const columnasPrecio = useMemo(() => columnasPrecioConDatos(pdf.lectura?.unidades ?? []), [pdf.lectura])
  // Se recalcula al editar la torre o un número de unidad: misma regla que usa el servidor al guardar.
  const coincidencias = useMemo(
    () => new Map(pdf.filas.map((f) => [f.key, buscarExistente(pdf.existentes, f.unidad, pdf.torre)])),
    [pdf.filas, pdf.existentes, pdf.torre]
  )
  const conteo = useMemo(() => {
    const incluidas = pdf.filas.filter((f) => f.incluir)
    const existe = (key: string) => !!coincidencias.get(key)?.existente
    return {
      leidas: pdf.filas.length,
      nuevas: incluidas.filter((f) => !existe(f.key) && !coincidencias.get(f.key)?.ambigua).length,
      actualizar: incluidas.filter((f) => existe(f.key)).length,
      omitidas: pdf.filas.length - incluidas.length,
      conError: incluidas.filter((f) => erroresFila(f, pdf.precioPrincipal, repetidas, coincidencias.get(f.key)).length > 0).length,
    }
  }, [pdf.filas, pdf.precioPrincipal, repetidas, coincidencias])

  const totalAGuardar = conteo.nuevas + conteo.actualizar
  const puedeGuardar = totalAGuardar > 0 && conteo.conError === 0 && !busy
  const enRevision = pdf.etapa === 'review' || pdf.etapa === 'saving'
  const conPdf = pdf.pdfUrl && (pdf.etapa === 'reading' || enRevision)

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-2 md:p-4">
      <div className="absolute inset-0 bg-black/50" style={{ backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }} onClick={busy ? undefined : onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Subir unidades por PDF"
        className={`relative flex flex-col w-full ${enRevision || pdf.etapa === 'reading' ? 'max-w-[1440px] h-[94vh]' : 'max-w-[640px]'}
          kibah-modal-solid border border-border-primary rounded-[16px] shadow-2xl overflow-hidden
          max-md:fixed max-md:inset-0 max-md:max-w-none max-md:h-auto max-md:rounded-none`}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-border-primary">
          <FileText className="w-5 h-5 text-orange flex-shrink-0" strokeWidth={1.5} />
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold text-text-primary truncate">Subir unidades por PDF</h2>
            <p className="text-xs text-text-tertiary truncate">{nombre}{pdf.fileName ? ` · ${pdf.fileName}` : ''}</p>
          </div>
          {enRevision && (
            <button onClick={() => setShowPdf((v) => !v)} className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-text-secondary bg-bg-tertiary rounded-[var(--radius-sm)] hover:text-orange cursor-pointer">
              {showPdf ? <EyeOff className="w-3.5 h-3.5" strokeWidth={1.5} /> : <Eye className="w-3.5 h-3.5" strokeWidth={1.5} />}
              {showPdf ? 'Ocultar PDF' : 'Ver PDF'}
            </button>
          )}
          <button onClick={onClose} disabled={busy} aria-label="Cerrar" className="flex items-center justify-center w-8 h-8 rounded-[var(--radius-sm)] hover:bg-bg-tertiary disabled:opacity-40 cursor-pointer">
            <X className="w-4 h-4 text-text-secondary" strokeWidth={1.5} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 min-h-0 flex">
          {conPdf && showPdf && (
            <div className="hidden lg:block w-[38%] border-r border-border-primary bg-bg-tertiary">
              <iframe src={pdf.pdfUrl!} title="PDF original" className="w-full h-full" />
            </div>
          )}

          <div className="flex-1 min-w-0 flex flex-col p-5 gap-4 overflow-y-auto">
            {pdf.error && (
              <div className="flex items-start gap-3 p-3 rounded-[var(--radius-sm)] bg-error/10 border border-error/20">
                <AlertCircle className="w-4 h-4 text-error flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                <p className="text-sm text-error">{pdf.error}</p>
              </div>
            )}

            {pdf.etapa === 'select' && <UnidadesPdfDropzone onFile={pdf.leer} />}

            {pdf.etapa === 'reading' && <Leyendo />}

            {enRevision && pdf.lectura && (
              <>
                <UnidadesPdfReviewBar
                  lectura={pdf.lectura}
                  torre={pdf.torre}
                  onTorre={pdf.setTorre}
                  precioPrincipal={pdf.precioPrincipal}
                  onPrecioPrincipal={pdf.setPrecioPrincipal}
                  onBodegaTodas={pdf.setBodegaTodas}
                  linkDriveDesarrollo={pdf.linkDriveDesarrollo}
                  canEditDesarrollo={canEditDesarrollo}
                  opcionesLink={opcionesLink}
                  onLinkDrive={pdf.setLinkDriveDesarrollo}
                  linksRecuperados={pdf.filas.filter((f) => f.link_drive_unidad).length}
                  conteo={conteo}
                />
                <p className="text-xs text-text-tertiary">
                  Revisa cada fila contra el PDF. Puedes corregir cualquier celda o desmarcar filas que no quieras guardar.
                  Las unidades nuevas heredan dirección, colonia, alcaldía, entrega y comisión del desarrollo.
                </p>
                <UnidadesPdfTable
                  filas={pdf.filas}
                  coincidencias={coincidencias}
                  columnasPrecio={columnasPrecio}
                  precioPrincipal={pdf.precioPrincipal}
                  repetidas={repetidas}
                  onChange={pdf.updateFila}
                  onIncluirTodas={pdf.setIncluirTodas}
                />
              </>
            )}

            {pdf.etapa === 'done' && pdf.resultado && (
              <div className="flex flex-col items-center justify-center text-center gap-3 py-12">
                <CheckCircle2 className="w-10 h-10 text-emerald-500" strokeWidth={1.5} />
                <p className="text-base font-semibold text-text-primary">Unidades guardadas</p>
                <p className="text-sm text-text-secondary">
                  {pdf.resultado.insertadas} nuevas · {pdf.resultado.actualizadas} actualizadas
                </p>
                <button onClick={onClose} className="kibah-btn-primary mt-2" style={{ padding: '8px 20px', fontSize: '13px' }}>Listo</button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        {enRevision && (
          <div className="flex items-center gap-3 px-5 py-3 border-t border-border-primary">
            <button onClick={pdf.reiniciar} disabled={busy} className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-orange disabled:opacity-40 cursor-pointer">
              <RotateCcw className="w-4 h-4" strokeWidth={1.5} /> Cambiar PDF
            </button>
            <span className="ml-auto text-xs text-text-tertiary hidden sm:inline">
              {conteo.conError > 0 ? `Corrige ${conteo.conError} fila(s) marcadas en rojo o desmárcalas` : `${totalAGuardar} unidad(es) por guardar`}
            </span>
            <button onClick={() => setConfirmOpen(true)} disabled={!puedeGuardar} className="kibah-btn-primary disabled:opacity-50" style={{ padding: '8px 16px', fontSize: '13px' }}>
              {busy ? 'Guardando…' : `Revisar y guardar (${totalAGuardar})`}
            </button>
          </div>
        )}
      </div>

      {confirmOpen && (
        <ConfirmDialog
          title="¿Todo está bien?"
          message={`Se crearán ${conteo.nuevas} unidades nuevas y se actualizarán ${conteo.actualizar} existentes en ${nombre}. "Precio por unidad" tomará ${etiquetaPrecio(pdf.precioPrincipal)} de cada unidad.${conteo.omitidas ? ` ${conteo.omitidas} fila(s) desmarcadas no se guardan.` : ''}`}
          confirmLabel="Sí, guardar"
          cancelLabel="Seguir revisando"
          onCancel={() => setConfirmOpen(false)}
          onConfirm={async () => {
            setConfirmOpen(false)
            if (await pdf.guardar()) onImported()
          }}
        />
      )}
    </div>
  )
}
