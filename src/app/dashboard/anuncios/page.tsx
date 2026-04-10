import { AnuncioList } from '@/components/anuncios/AnuncioList'

export default function AnunciosAsesorPage() {
  return (
    <div className="space-y-4 max-w-2xl">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">Anuncios</h1>
        <p className="text-sm text-text-secondary mt-1">Comunicados de Kibah para el equipo</p>
      </div>
      <AnuncioList isAdmin={false} refreshKey={0} />
    </div>
  )
}
