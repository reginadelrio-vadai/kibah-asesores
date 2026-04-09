'use client'

import { useCallback, useState } from 'react'
import { Building2, AlertCircle } from 'lucide-react'
import type { Property, UserRole } from '@/types'
import { useProperties } from '@/hooks/useProperties'
import { useFilters } from '@/hooks/useFilters'
import { useColumnVisibility } from '@/hooks/useColumnVisibility'
import { PropertyFilters } from '@/components/properties/PropertyFilters'
import { PropertyGrid } from '@/components/properties/PropertyGrid'
import { PropertyTable } from '@/components/properties/PropertyTable'
import { PropertyDetail } from '@/components/properties/PropertyDetail'
import { ViewToggle } from '@/components/properties/ViewToggle'

type ViewMode = 'grid' | 'list'

export function PropiedadesView({ role }: { role: UserRole }) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)

  const {
    activeFilters,
    debouncedFilters,
    filterChips,
    setFilter,
    removeFilter,
    clearAll,
  } = useFilters()

  const {
    properties,
    loading,
    loadingMore,
    error,
    hasMore,
    loadMore,
    sortConfig,
    setSortConfig,
    retry,
  } = useProperties(debouncedFilters)

  const { visibleColumns, filterableColumns } = useColumnVisibility(role)

  const handleSort = useCallback(
    (column: string) => {
      setSortConfig({
        column,
        order:
          sortConfig.column === column && sortConfig.order === 'desc'
            ? 'asc'
            : 'desc',
      })
    },
    [sortConfig, setSortConfig]
  )

  const handleViewChange = useCallback((mode: ViewMode) => {
    setViewMode(mode)
  }, [])

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">
            Propiedades
          </h1>
          {!loading && properties.length > 0 && (
            <p className="text-sm text-text-secondary mt-0.5">
              {properties.length} propiedad{properties.length !== 1 ? 'es' : ''}{hasMore ? '+' : ''}
            </p>
          )}
        </div>
        <ViewToggle onChange={handleViewChange} />
      </div>

      {/* Filters */}
      <PropertyFilters
        filterableColumns={filterableColumns}
        activeFilters={activeFilters}
        filterChips={filterChips}
        onSetFilter={setFilter}
        onRemoveFilter={removeFilter}
        onClearAll={clearAll}
      />

      {/* Error state */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-[var(--radius-sm)] bg-error/10 border border-error/20">
          <AlertCircle className="w-5 h-5 text-error flex-shrink-0" strokeWidth={1.5} />
          <p className="text-sm text-error flex-1">{error}</p>
          <button
            onClick={retry}
            className="text-sm font-medium text-error hover:underline cursor-pointer"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Content */}
      {!error && (
        <>
          {viewMode === 'grid' ? (
            <PropertyGrid
              properties={properties}
              loading={loading}
              onSelect={setSelectedProperty}
            />
          ) : (
            <PropertyTable
              properties={properties}
              loading={loading}
              columns={visibleColumns}
              sortConfig={sortConfig}
              onSort={handleSort}
              onSelect={setSelectedProperty}
            />
          )}

          {/* Empty state */}
          {!loading && properties.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Building2
                className="w-12 h-12 text-text-tertiary mb-4"
                strokeWidth={1.5}
              />
              <h2 className="text-base font-semibold text-text-primary mb-1">
                No hay propiedades con estos filtros
              </h2>
              <p className="text-sm text-text-secondary mb-4">
                Intenta ajustar los filtros para ver más resultados
              </p>
              {filterChips.length > 0 && (
                <button
                  onClick={clearAll}
                  className="text-sm font-medium text-orange hover:text-orange-hover transition-colors cursor-pointer"
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          )}

          {/* Load more */}
          {hasMore && properties.length > 0 && (
            <div className="flex justify-center pt-4">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="h-10 px-6 text-sm font-medium rounded-[var(--radius-sm)]
                  bg-bg-tertiary text-text-primary hover:bg-border-primary
                  disabled:opacity-50 transition-colors cursor-pointer"
              >
                {loadingMore ? 'Cargando...' : 'Cargar más'}
              </button>
            </div>
          )}
        </>
      )}

      {/* Detail modal */}
      {selectedProperty && (
        <PropertyDetail
          property={selectedProperty}
          role={role}
          onClose={() => setSelectedProperty(null)}
        />
      )}
    </div>
  )
}
