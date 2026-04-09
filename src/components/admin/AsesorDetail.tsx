'use client'

import { useCallback, useEffect, useState } from 'react'
import { X, Copy, KeyRound, AlertTriangle, Loader2 } from 'lucide-react'
import type { Profile } from '@/types'
import type { ToastType } from '@/components/ui/Toast'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

interface AsesorDetailProps {
  asesor: Profile
  onClose: () => void
  onToggle: (asesor: Profile) => void
  onDelete: (asesor: Profile) => void
  onToast: (message: string, type: ToastType) => void
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('es-MX', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}

export function AsesorDetail({ asesor, onClose, onToggle, onDelete, onToast }: AsesorDetailProps) {
  const [resetPassword, setResetPassword] = useState<string | null>(null)
  const [resetting, setResetting] = useState(false)
  const [copied, setCopied] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const isLocked = resetPassword !== null

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLocked) onClose()
    },
    [onClose, isLocked]
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [handleKeyDown])

  const handleReset = async () => {
    setResetting(true)
    try {
      const res = await fetch(`/api/asesores/${asesor.id}/reset-password`, { method: 'POST' })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        onToast(body.error || 'Error al resetear', 'error')
        return
      }
      const json = await res.json()
      setResetPassword(json.password)
    } catch {
      onToast('Error de conexión', 'error')
    } finally {
      setResetting(false)
    }
  }

  const handleCopy = async () => {
    if (!resetPassword) return
    try {
      await navigator.clipboard.writeText(resetPassword)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const input = document.getElementById('reset-pw-display') as HTMLInputElement
      input?.select()
    }
  }

  const handleDeleteConfirm = async () => {
    setDeleteLoading(true)
    try {
      const res = await fetch(`/api/asesores/${asesor.id}`, { method: 'DELETE' })
      if (res.ok || res.status === 204) {
        onToast('Asesor eliminado', 'success')
        setConfirmDelete(false)
        onClose()
        onDelete(asesor)
      } else {
        const body = await res.json().catch(() => ({}))
        onToast(body.error || 'Error al eliminar', 'error')
      }
    } catch {
      onToast('Error de conexión', 'error')
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6"
        onClick={isLocked ? undefined : onClose}
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

        <div
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-[500px] max-h-[90vh] overflow-y-auto
            bg-bg-secondary dark:bg-glass-bg dark:backdrop-blur-[var(--glass-blur)]
            border border-border-primary dark:border-glass-border
            rounded-[20px] shadow-xl
            max-md:fixed max-md:inset-0 max-md:max-w-none max-md:max-h-none max-md:rounded-none"
        >
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-border-primary bg-bg-secondary dark:bg-glass-bg">
            <h2 className="text-lg font-semibold text-text-primary">{asesor.full_name}</h2>
            {!isLocked && (
              <button onClick={onClose} className="flex items-center justify-center w-8 h-8 rounded-[var(--radius-sm)] hover:bg-bg-tertiary transition-colors cursor-pointer" aria-label="Cerrar">
                <X className="w-4 h-4 text-text-secondary" strokeWidth={1.5} />
              </button>
            )}
          </div>

          {/* Body */}
          <div className="px-6 py-5 space-y-5">
            {/* Info */}
            <div className="space-y-3">
              <div>
                <dt className="text-xs text-text-tertiary">Email</dt>
                <dd className="text-sm text-text-primary font-medium mt-0.5">{asesor.email}</dd>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <dt className="text-xs text-text-tertiary">Estado</dt>
                  <dd className="mt-0.5">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full
                      ${asesor.is_active
                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                        : 'bg-red-500/15 text-red-700 dark:text-red-400'
                      }`}>
                      {asesor.is_active ? 'Activo' : 'Desactivado'}
                    </span>
                  </dd>
                </div>
                <div className="flex-1">
                  <dt className="text-xs text-text-tertiary">Registro</dt>
                  <dd className="text-sm text-text-primary font-medium mt-0.5">{formatDate(asesor.created_at)}</dd>
                </div>
              </div>
            </div>

            {/* Password reset */}
            <div className="border-t border-border-primary pt-5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary mb-3">Contraseña</h3>
              {resetPassword ? (
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 rounded-[var(--radius-sm)] bg-orange/10 border border-orange/20">
                    <AlertTriangle className="w-5 h-5 text-orange flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                    <p className="text-sm text-orange font-medium">
                      Esta contraseña solo se muestra una vez. Cópiala ahora.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      id="reset-pw-display"
                      readOnly
                      value={resetPassword}
                      className="flex-1 h-10 px-3 text-sm font-mono rounded-[var(--radius-sm)] border-2 border-orange bg-bg-primary text-text-primary select-all"
                      onClick={(e) => (e.target as HTMLInputElement).select()}
                    />
                    <button onClick={handleCopy} className="h-10 px-4 text-sm font-medium rounded-[var(--radius-sm)] bg-orange text-white hover:bg-orange-hover transition-colors cursor-pointer flex items-center gap-1.5">
                      <Copy className="w-4 h-4" strokeWidth={1.5} />
                      {copied ? 'Copiada' : 'Copiar'}
                    </button>
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={() => { setResetPassword(null); onClose() }}
                      className="h-9 px-4 text-sm font-medium rounded-[var(--radius-sm)] bg-bg-tertiary text-text-primary hover:bg-border-primary transition-colors cursor-pointer"
                    >
                      Listo
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleReset}
                  disabled={resetting}
                  className="flex items-center gap-2 h-9 px-4 text-sm font-medium rounded-[var(--radius-sm)]
                    border border-border-primary text-text-secondary hover:text-text-primary hover:bg-bg-tertiary
                    disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {resetting
                    ? <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.5} />
                    : <KeyRound className="w-4 h-4" strokeWidth={1.5} />
                  }
                  Resetear Contraseña
                </button>
              )}
            </div>

            {/* Actions */}
            {!isLocked && (
              <div className="border-t border-border-primary pt-5 flex items-center gap-3">
                <button
                  onClick={() => onToggle(asesor)}
                  className={`h-9 px-4 text-sm font-medium rounded-[var(--radius-sm)] transition-colors cursor-pointer
                    ${asesor.is_active
                      ? 'border border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10'
                      : 'border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10'
                    }`}
                >
                  {asesor.is_active ? 'Desactivar' : 'Activar'}
                </button>
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="h-9 px-4 text-sm font-medium rounded-[var(--radius-sm)] border border-red-500/30 text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                >
                  Eliminar
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {confirmDelete && (
        <ConfirmDialog
          title="Eliminar Asesor"
          message={`¿Estás seguro de eliminar a "${asesor.full_name}" (${asesor.email})? Se eliminará su cuenta por completo.`}
          confirmLabel="Eliminar"
          variant="danger"
          loading={deleteLoading}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </>
  )
}
