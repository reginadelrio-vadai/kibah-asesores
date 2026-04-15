'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { clearPermissionsCache } from '@/hooks/usePermissions'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    clearPermissionsCache()

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      setError(
        authError.message === 'Invalid login credentials'
          ? 'Email o contraseña incorrectos'
          : authError.message
      )
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #0F1923 0%, #1B2A4A 100%)' }}
    >
      <div
        className="w-full"
        style={{
          maxWidth: '420px',
          padding: '40px',
          background: 'rgba(27, 42, 74, 0.4)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '0.5px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '24px',
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.4)',
        }}
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <img
            src="/images/kibah-logo-white.png"
            alt="Kibah"
            style={{ maxWidth: '180px', height: 'auto', objectFit: 'contain' }}
          />
          <p className="text-[13px] mt-3" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Plataforma de Asesores
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-[13px] font-medium mb-1.5"
              style={{ color: 'rgba(255,255,255,0.7)' }}
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="tu@email.com"
              style={{
                width: '100%',
                padding: '11px 14px',
                fontSize: '14px',
                color: '#FFFFFF',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => { e.target.style.borderColor = '#E8872A' }}
              onBlur={(e) => { e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)' }}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-[13px] font-medium mb-1.5"
              style={{ color: 'rgba(255,255,255,0.7)' }}
            >
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              style={{
                width: '100%',
                padding: '11px 14px',
                fontSize: '14px',
                color: '#FFFFFF',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => { e.target.style.borderColor = '#E8872A' }}
              onBlur={(e) => { e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)' }}
            />
          </div>

          {error && (
            <div
              className="text-[14px] px-4 py-3 rounded-lg"
              style={{
                color: '#F87171',
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              padding: '12px 16px',
              fontSize: '14px',
              fontWeight: 600,
              color: '#FFFFFF',
              background: '#E8872A',
              border: 'none',
              borderRadius: '8px',
              transition: 'background 0.2s',
              marginTop: '8px',
            }}
            onMouseEnter={(e) => { if (!loading) (e.target as HTMLButtonElement).style.background = '#D97A1F' }}
            onMouseLeave={(e) => { (e.target as HTMLButtonElement).style.background = '#E8872A' }}
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
          </button>
        </form>
      </div>
    </div>
  )
}
