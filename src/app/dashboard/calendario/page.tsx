'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, Unlink, Settings } from 'lucide-react'
import { useGoogleConnection } from '@/hooks/useGoogleConnection'
import { GoogleConnectScreen } from '@/components/calendar/GoogleConnectScreen'
import { CalendarView } from '@/components/calendar/CalendarView'
import { CalendarSelector } from '@/components/calendar/CalendarSelector'
import { Toast, type ToastType } from '@/components/ui/Toast'

export default function CalendarioPage() {
  const { isConnected, loading } = useGoogleConnection()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [showSelector, setShowSelector] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    setConnected(isConnected)
  }, [isConnected])

  useEffect(() => {
    if (searchParams.get('setup') === 'true') setShowSelector(true)
    if (searchParams.get('error')) setToast({ message: 'Error al conectar con Google', type: 'error' })
  }, [searchParams])

  const handleDisconnect = useCallback(async () => {
    setDisconnecting(true)
    try {
      await fetch('/api/google/disconnect', { method: 'POST' })
      setConnected(false)
    } catch {
      setToast({ message: 'Error al desconectar', type: 'error' })
    } finally {
      setDisconnecting(false)
    }
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 text-text-tertiary animate-spin" strokeWidth={1.5} />
      </div>
    )
  }

  if (!connected) return <GoogleConnectScreen />

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-text-primary">Calendario</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSelector(true)}
            className="flex items-center gap-1.5 h-8 px-3 text-xs font-medium rounded-[var(--radius-sm)] border border-border-primary text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-colors cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5" strokeWidth={1.5} />
            Cambiar calendario
          </button>
          <button
            onClick={handleDisconnect}
            disabled={disconnecting}
            className="flex items-center gap-1.5 h-8 px-3 text-xs font-medium rounded-[var(--radius-sm)] text-text-tertiary hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Unlink className="w-3.5 h-3.5" strokeWidth={1.5} />
            Desconectar
          </button>
        </div>
      </div>

      <CalendarView />

      {showSelector && (
        <CalendarSelector onSelect={() => { setShowSelector(false); router.replace('/dashboard/calendario') }} />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
