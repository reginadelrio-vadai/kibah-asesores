'use client'

import { useCallback, useState } from 'react'
import { Plus } from 'lucide-react'
import { AnuncioList } from '@/components/anuncios/AnuncioList'
import { AnuncioForm } from '@/components/anuncios/AnuncioForm'
import { Toast, type ToastType } from '@/components/ui/Toast'

export default function AnunciosAdminPage() {
  const [formOpen, setFormOpen] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const showToast = useCallback((msg: string, type: ToastType) => setToast({ message: msg, type }), [])

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Anuncios</h1>
          <p className="text-sm text-text-secondary mt-1">Publica comunicados para tus asesores</p>
        </div>
        <button
          onClick={() => setFormOpen(true)}
          className="flex items-center gap-2 h-9 px-4 text-sm font-medium rounded-[var(--radius-sm)] bg-orange text-white hover:bg-orange-hover transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" strokeWidth={1.5} />
          Nuevo Anuncio
        </button>
      </div>

      <AnuncioList isAdmin={true} refreshKey={refreshKey} />

      {formOpen && (
        <AnuncioForm
          onClose={() => setFormOpen(false)}
          onSuccess={() => setRefreshKey((k) => k + 1)}
          onToast={showToast}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
