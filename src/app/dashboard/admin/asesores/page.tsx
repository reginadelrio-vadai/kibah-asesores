'use client'

import { useCallback, useState } from 'react'
import { Plus } from 'lucide-react'
import { AsesorList } from '@/components/admin/AsesorList'
import { AsesorCreateModal } from '@/components/admin/AsesorCreateModal'
import { Toast, type ToastType } from '@/components/ui/Toast'

export default function AsesoresPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const showToast = useCallback((message: string, type: ToastType) => {
    setToast({ message, type })
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Gestión de Asesores</h1>
          <p className="text-sm text-text-secondary mt-0.5">
            Crea y administra las cuentas de los asesores de Kibah
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 h-9 px-4 text-sm font-medium rounded-[var(--radius-sm)]
            bg-orange text-white hover:bg-orange-hover transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" strokeWidth={1.5} />
          Nuevo Asesor
        </button>
      </div>

      <AsesorList
        onCreateClick={() => setModalOpen(true)}
        refreshKey={refreshKey}
      />

      {modalOpen && (
        <AsesorCreateModal
          onClose={() => setModalOpen(false)}
          onSuccess={() => setRefreshKey((k) => k + 1)}
          onToast={showToast}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
