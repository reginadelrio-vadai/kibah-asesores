'use client'

import { useCallback, useEffect, useState } from 'react'
import type { Property } from '@/types'

const STORAGE_KEY = 'kibah-pdf-selection'

function loadFromStorage(): Property[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveToStorage(properties: Property[]) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(properties))
  } catch {
    // silent
  }
}

export function usePdfSelection() {
  const [selectedProperties, setSelectedProperties] = useState<Property[]>(() => loadFromStorage())

  useEffect(() => {
    saveToStorage(selectedProperties)
  }, [selectedProperties])

  const addProperty = useCallback((property: Property) => {
    setSelectedProperties((prev) => {
      if (prev.some((p) => p.id === property.id)) return prev
      return [...prev, property]
    })
  }, [])

  const removeProperty = useCallback((id: number) => {
    setSelectedProperties((prev) => prev.filter((p) => p.id !== id))
  }, [])

  const toggleProperty = useCallback((property: Property) => {
    setSelectedProperties((prev) => {
      if (prev.some((p) => p.id === property.id)) {
        return prev.filter((p) => p.id !== property.id)
      }
      return [...prev, property]
    })
  }, [])

  const clearSelection = useCallback(() => {
    setSelectedProperties([])
  }, [])

  const isSelected = useCallback(
    (id: number) => selectedProperties.some((p) => p.id === id),
    [selectedProperties]
  )

  return {
    selectedProperties,
    count: selectedProperties.length,
    addProperty,
    removeProperty,
    toggleProperty,
    clearSelection,
    isSelected,
  }
}
