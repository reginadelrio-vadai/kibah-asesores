'use client'

import { useCallback, useEffect, useState } from 'react'

interface UsePermissionsReturn {
  permissions: Record<string, boolean>
  can: (permission: string) => boolean
  loading: boolean
}

let cachedPermissions: Record<string, boolean> | null = null

export function usePermissions(): UsePermissionsReturn {
  const [permissions, setPermissions] = useState<Record<string, boolean>>(cachedPermissions ?? {})
  const [loading, setLoading] = useState(!cachedPermissions)

  useEffect(() => {
    if (cachedPermissions) return
    fetch('/api/roles/my-permissions')
      .then((r) => r.json())
      .then((data) => {
        const perms = data.permissions ?? {}
        cachedPermissions = perms
        setPermissions(perms)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const can = useCallback(
    (permission: string) => {
      if (permissions._isAdmin) return true
      return permissions[permission] === true
    },
    [permissions]
  )

  return { permissions, can, loading }
}
