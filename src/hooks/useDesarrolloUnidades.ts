'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { DesarrolloUnidad, DesarrolloUnidadesResumen } from '@/types/desarrollo'
import { UNIDADES_PER_PAGE } from '@/lib/utils/constants'

interface UnidadesResponse {
  data: DesarrolloUnidad[]
  summary?: DesarrolloUnidadesResumen
  pagination: { next_cursor: string | null; has_more: boolean }
}

/** Unidades (hijas) de un desarrollo, paginadas por cursor y filtrables por torre y por número de unidad. */
export function useDesarrolloUnidades(desarrolloId: number, torre: string | null, search: string) {
  const [unidades, setUnidades] = useState<DesarrolloUnidad[]>([])
  const [summary, setSummary] = useState<DesarrolloUnidadesResumen | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cursor, setCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const summaryLoadedFor = useRef<number | null>(null)

  const buildUrl = useCallback(
    (opts: { cursor?: string | null; withSummary?: boolean }) => {
      const params = new URLSearchParams({ per_page: String(UNIDADES_PER_PAGE) })
      if (opts.cursor) params.set('cursor', opts.cursor)
      if (torre) params.set('torre', torre)
      if (search.trim()) params.set('q', search.trim())
      if (opts.withSummary) params.set('include_summary', '1')
      return `/api/desarrollos/${desarrolloId}/unidades?${params.toString()}`
    },
    [desarrolloId, torre, search]
  )

  useEffect(() => {
    const controller = new AbortController()
    const withSummary = summaryLoadedFor.current !== desarrolloId

    setLoading(true)
    setError(null)
    fetch(buildUrl({ withSummary }), { signal: controller.signal })
      .then(async (res) => {
        const json = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(json.error ?? 'Error al cargar unidades')
        return json as UnidadesResponse
      })
      .then((json) => {
        setUnidades(json.data)
        setCursor(json.pagination.next_cursor)
        setHasMore(json.pagination.has_more)
        if (json.summary) {
          setSummary(json.summary)
          summaryLoadedFor.current = desarrolloId
        }
        setLoading(false)
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') return
        setError(err instanceof Error ? err.message : 'Error desconocido')
        setLoading(false)
      })

    return () => controller.abort()
  }, [buildUrl, desarrolloId, reloadKey])

  const loadMore = useCallback(async () => {
    if (!cursor || loadingMore) return
    setLoadingMore(true)
    try {
      const res = await fetch(buildUrl({ cursor }))
      const json = (await res.json().catch(() => ({}))) as Partial<UnidadesResponse> & { error?: string }
      if (!res.ok || !json.data || !json.pagination) throw new Error(json.error ?? 'Error al cargar más unidades')
      setUnidades((prev) => [...prev, ...json.data!])
      setCursor(json.pagination.next_cursor)
      setHasMore(json.pagination.has_more)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoadingMore(false)
    }
  }, [cursor, loadingMore, buildUrl])

  const retry = useCallback(() => {
    summaryLoadedFor.current = null
    setReloadKey((k) => k + 1)
  }, [])

  return { unidades, summary, loading, loadingMore, error, hasMore, loadMore, retry }
}
