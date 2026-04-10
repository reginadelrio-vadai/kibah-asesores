'use client'

import { useCallback, useEffect, useState } from 'react'

export function useUnreadCount() {
  const [unreadCount, setUnreadCount] = useState(0)

  const refetch = useCallback(async () => {
    try {
      const res = await fetch('/api/anuncios/unread-count')
      if (!res.ok) return
      const data = await res.json()
      setUnreadCount(data.count ?? 0)
    } catch {
      // silent
    }
  }, [])

  useEffect(() => {
    refetch()
    const interval = setInterval(refetch, 30000)
    return () => clearInterval(interval)
  }, [refetch])

  return { unreadCount, refetch }
}
