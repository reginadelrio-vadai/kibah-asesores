'use client'

import { useState } from 'react'
import { X, Eye, EyeOff } from 'lucide-react'

interface AsesorCreateModalProps {
  onClose: () => void
  onSuccess: () => void
  onToast: (message: string, type: 'success' | 'error') => void
}

interface RoleOption { name: string; display_name: string }

export function AsesorCreateModal({ onClose, onSuccess, onToast }: AsesorCreateModalProps) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [selectedRole, setSelectedRole] = useState('asesor')
  const [roles, setRoles] = useState<RoleOption[]>([])
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  useState(() => {
    fetch('/api/roles').then(r => r.json()).then(data => {
      const items = (data.data ?? []).filter((r: { name: string }) => r.name !== 'admin')
      setRoles(items)
    }).catch(() => {})
  })

  const clearError = (key: string) => {
    if (errors[key]) setErrors((prev) => { const n = { ...prev }; delete n[key]; return n })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setErrors({})

    try {
      const res = await fetch('/api/asesores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName.trim(),
          email: email.trim(),
          password,
          role: selectedRole,
        }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        if (body.details && Array.isArray(body.details)) {
          const fieldErrors: Record<string, string> = {}
          for (const d of body.details) {
            const path = d.path?.[0]
            if (path) fieldErrors[path] = d.message
          }
          setErrors(fieldErrors)
          onToast('Revisa los campos con errores', 'error')
        } else {
          onToast(body.error || 'Error al crear asesor', 'error')
        }
        return
      }

      onToast(`Asesor creado: ${email.trim()}`, 'success')
      onSuccess()
      onClose()
    } catch {
      onToast('Error de conexión', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const inputClass = (key: string) =>
    `w-full h-9 px-3 text-sm rounded-[var(--radius-sm)] border bg-bg-primary text-text-primary
    placeholder:text-text-tertiary transition-colors
    ${errors[key] ? 'border-red-500' : 'border-border-primary focus:border-orange'}
    focus:outline-none focus:ring-1 ${errors[key] ? 'focus:ring-red-500' : 'focus:ring-orange/30'}`

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-bg-primary border border-border-primary rounded-[var(--radius-lg)] w-full max-w-md shadow-2xl my-8 mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-primary">
          <h2 className="text-base font-semibold text-text-primary">Nuevo Asesor</h2>
          <button onClick={onClose} className="cursor-pointer text-text-tertiary hover:text-text-primary transition-colors">
            <X className="w-5 h-5" strokeWidth={1.5} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Nombre completo *</label>
            <input className={inputClass('full_name')} value={fullName} onChange={(e) => { setFullName(e.target.value); clearError('full_name') }} placeholder="Juan Pérez" />
            {errors.full_name && <p className="text-xs text-red-500 mt-0.5">{errors.full_name}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Email *</label>
            <input className={inputClass('email')} type="email" value={email} onChange={(e) => { setEmail(e.target.value); clearError('email') }} placeholder="asesor@example.com" />
            {errors.email && <p className="text-xs text-red-500 mt-0.5">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Contraseña * (mín. 8 caracteres)</label>
            <div className="relative">
              <input
                className={inputClass('password')}
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); clearError('password') }}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-text-tertiary hover:text-text-primary cursor-pointer transition-colors"
              >
                {showPassword
                  ? <EyeOff className="w-4 h-4" strokeWidth={1.5} />
                  : <Eye className="w-4 h-4" strokeWidth={1.5} />
                }
              </button>
            </div>
            {errors.password && <p className="text-xs text-red-500 mt-0.5">{errors.password}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Rol</label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full h-9 px-3 text-sm rounded-[var(--radius-sm)] border border-border-primary bg-bg-primary text-text-primary appearance-none cursor-pointer focus:outline-none focus:border-orange"
            >
              {roles.map((r) => <option key={r.name} value={r.name}>{r.display_name}</option>)}
              {roles.length === 0 && <option value="asesor">Asesor</option>}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-border-primary">
            <button type="button" onClick={onClose} className="h-9 px-4 text-sm font-medium rounded-[var(--radius-sm)] bg-bg-tertiary text-text-primary hover:bg-border-primary transition-colors cursor-pointer">
              Cancelar
            </button>
            <button type="submit" disabled={submitting} className="h-9 px-5 text-sm font-medium rounded-[var(--radius-sm)] bg-orange text-white hover:bg-orange-hover disabled:opacity-50 transition-colors cursor-pointer">
              {submitting ? 'Creando...' : 'Crear Asesor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
