import { PdfBuilder } from '@/components/pdf/PdfBuilder'

export default function PdfPage() {
  return (
    <div className="space-y-4 max-w-3xl">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">Generar PDF</h1>
        <p className="text-sm text-text-secondary mt-1">
          Selecciona propiedades para generar un PDF profesional para tus clientes
        </p>
      </div>
      <PdfBuilder />
    </div>
  )
}
