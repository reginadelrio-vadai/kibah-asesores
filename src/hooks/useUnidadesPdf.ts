'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { PRECIO_PRINCIPAL_DEFAULT, UNIDADES_PDF_MAX_BYTES } from '@/lib/utils/constants'
import {
  patchBodega,
  toFilasRevision,
  toImportPayload,
  type Bodega,
  type FilaRevision,
} from '@/lib/utils/unidades-pdf'
import type { ImportarUnidadesResponse, PrecioPrincipal, LecturaPdf, LecturaPdfResponse, UnidadExistente } from '@/types/unidades-pdf'

export type EtapaPdf = 'select' | 'reading' | 'review' | 'saving' | 'done'

async function readError(res: Response, fallback: string): Promise<string> {
  const json = await res.json().catch(() => ({}))
  return typeof json.error === 'string' ? json.error : fallback
}

/** Flujo "Subir unidades por PDF": leer con Claude → revisar/editar → guardar. */
export function useUnidadesPdf(desarrolloId: number, torreDefault: string | null) {
  const [etapa, setEtapa] = useState<EtapaPdf>('select')
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [lectura, setLectura] = useState<LecturaPdf | null>(null)
  const [filas, setFilas] = useState<FilaRevision[]>([])
  const [existentes, setExistentes] = useState<UnidadExistente[]>([])
  const [linkDriveDesarrollo, setLinkDriveDesarrollo] = useState<string | null>(null)
  const [precioPrincipal, setPrecioPrincipal] = useState<PrecioPrincipal>(PRECIO_PRINCIPAL_DEFAULT)
  const [torre, setTorre] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [resultado, setResultado] = useState<ImportarUnidadesResponse | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  // Liberar la URL del PDF y cancelar la lectura al cerrar.
  useEffect(() => () => abortRef.current?.abort(), [])
  useEffect(() => () => { if (pdfUrl) URL.revokeObjectURL(pdfUrl) }, [pdfUrl])

  const leer = useCallback(async (file: File) => {
    setError(null)
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setError('El archivo debe ser PDF.')
      return
    }
    if (file.size > UNIDADES_PDF_MAX_BYTES) {
      setError('El PDF pesa más de 4 MB. Comprímelo o divídelo.')
      return
    }

    setFileName(file.name)
    setPdfUrl(URL.createObjectURL(file))
    setEtapa('reading')

    const controller = new AbortController()
    abortRef.current = controller
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch(`/api/desarrollos/${desarrolloId}/unidades/pdf`, {
        method: 'POST',
        body: form,
        signal: controller.signal,
      })
      if (!res.ok) throw new Error(await readError(res, 'Error al leer el PDF'))
      const data = (await res.json()) as LecturaPdfResponse

      if (data.lectura.unidades.length === 0) {
        throw new Error(data.lectura.observaciones || 'No se encontró ninguna tabla de unidades en el PDF.')
      }
      const torreInicial = data.lectura.titulo?.trim() || torreDefault || ''
      const nuevasFilas = toFilasRevision(data, torreInicial)
      setExistentes(data.existentes)
      setLinkDriveDesarrollo(data.link_drive_desarrollo)
      setLectura(data.lectura)
      setFilas(nuevasFilas)
      setPrecioPrincipal(PRECIO_PRINCIPAL_DEFAULT)
      setTorre(torreInicial)
      setEtapa('review')
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      setError(err instanceof Error ? err.message : 'Error al leer el PDF')
      setEtapa('select')
    }
  }, [desarrolloId, torreDefault])

  const updateFila = useCallback((key: string, patch: Partial<FilaRevision>) => {
    setFilas((prev) => prev.map((f) => (f.key === key ? { ...f, ...patch } : f)))
  }, [])

  const setIncluirTodas = useCallback((incluir: boolean) => {
    setFilas((prev) => prev.map((f) => ({ ...f, incluir })))
  }, [])

  /** Corrige la bodega de todas las filas incluidas de una vez (cuando la lectura salió mal en bloque). */
  const setBodegaTodas = useCallback((bodega: Bodega | null) => {
    setFilas((prev) => prev.map((f) => (f.incluir ? { ...f, ...patchBodega({ bodega }) } : f)))
  }, [])

  const guardar = useCallback(async (): Promise<boolean> => {
    setError(null)
    setEtapa('saving')
    try {
      const res = await fetch(`/api/desarrollos/${desarrolloId}/unidades/importar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toImportPayload(filas, precioPrincipal, torre)),
      })
      if (!res.ok) throw new Error(await readError(res, 'Error al guardar las unidades'))
      setResultado((await res.json()) as ImportarUnidadesResponse)
      setEtapa('done')
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar las unidades')
      setEtapa('review')
      return false
    }
  }, [desarrolloId, filas, precioPrincipal, torre])

  const reiniciar = useCallback(() => {
    abortRef.current?.abort()
    setEtapa('select')
    setPdfUrl(null)
    setFileName(null)
    setLectura(null)
    setFilas([])
    setExistentes([])
    setError(null)
    setResultado(null)
  }, [])

  return {
    etapa, pdfUrl, fileName, lectura, filas, existentes, linkDriveDesarrollo, precioPrincipal, torre, error, resultado,
    leer, updateFila, setIncluirTodas, setBodegaTodas, setPrecioPrincipal, setTorre, guardar, reiniciar,
  }
}
