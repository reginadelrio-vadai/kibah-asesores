'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1B2A4A] via-[#162032] to-[#0F1923]">
      <div className="w-full max-w-md px-6">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <img src="/images/kibah-logo-white.png" alt="Kibah" style={{ maxWidth: '180px', height: 'auto', objectFit: 'contain' }} className="mb-4" />
          <p className="text-[#94A3B8] text-sm mt-1">
            Plataforma de Asesores
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-[#94A3B8] mb-1.5"
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
              className="w-full px-4 py-3 rounded-[var(--radius-sm)] bg-white/5 border border-white/10
                text-white placeholder-[#64748B] text-sm
                focus:outline-none focus:ring-2 focus:ring-orange focus:border-transparent
                transition-colors"
              placeholder="tu@email.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-[#94A3B8] mb-1.5"
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
              className="w-full px-4 py-3 rounded-[var(--radius-sm)] bg-white/5 border border-white/10
                text-white placeholder-[#64748B] text-sm
                focus:outline-none focus:ring-2 focus:ring-orange focus:border-transparent
                transition-colors"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="text-sm text-error bg-error/10 border border-error/20 rounded-[var(--radius-sm)] px-4 py-3">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-[var(--radius-sm)] bg-orange hover:bg-orange-hover
              text-white font-semibold text-sm
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors cursor-pointer"
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
          </button>
        </form>
      </div>
    </div>
  )
}
