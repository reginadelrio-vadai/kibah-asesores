'use client'

import { useState } from 'react'
import { ExternalLink } from 'lucide-react'

const WHAAPY_URL = 'https://app.whaapy.com'

export default function WhaapyPage() {
  const [error, setError] = useState(false)

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <p className="text-sm text-text-secondary mb-4">No se pudo cargar Whaapy</p>
        <a
          href={WHAAPY_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 h-9 px-4 text-sm font-medium rounded-[var(--radius-sm)]
            bg-orange text-white hover:bg-orange-hover transition-colors"
        >
          <ExternalLink className="w-4 h-4" strokeWidth={1.5} />
          Abrir Whaapy
        </a>
      </div>
    )
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 'var(--topbar-height, 64px)',
        left: 'var(--sidebar-width, 260px)',
        right: 0,
        bottom: 0,
        overflow: 'hidden',
      }}
    >
      <iframe
        src={WHAAPY_URL}
        onError={() => setError(true)}
        allow="clipboard-write; microphone"
        title="Whaapy"
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          display: 'block',
          zoom: 0.9,
        }}
      />
    </div>
  )
}
