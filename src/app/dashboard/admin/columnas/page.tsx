import { ColumnVisibilityManager } from '@/components/admin/ColumnVisibilityManager'

export default function ColumnasPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">
          Configuración de Columnas
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          Controla qué columnas pueden ver los asesores en los filtros y en el detalle de propiedades
        </p>
      </div>
      <ColumnVisibilityManager />
    </div>
  )
}
