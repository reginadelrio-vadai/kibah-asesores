import { Columns3 } from 'lucide-react'

export default function ColumnasPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <Columns3 className="w-12 h-12 text-text-tertiary mb-4" strokeWidth={1.5} />
      <h1 className="text-xl font-semibold text-text-primary mb-2">Columnas</h1>
      <p className="text-text-secondary">Coming in M4</p>
    </div>
  )
}
