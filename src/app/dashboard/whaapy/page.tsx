'use client'

import { useState } from 'react'
import { ExternalLink } from 'lucide-react'

const WHAAPY_URL = 'https://app.whaapy.com/inbox'

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
      className="-m-6"
      style={{
        position: 'relative',
        width: '100%',
        height: 'calc(100vh - 64px)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '-50px',
          width: 'calc(100% + 50px)',
          height: '100%',
        }}
      >
        <iframe
          src={WHAAPY_URL}
          onError={() => setError(true)}
          allow="clipboard-write; microphone"
          title="Whaapy"
          style={{
            width: '170%',
            height: '100%',
            border: 'none',
            zoom: 0.65,
          }}
        />
      </div>
    </div>
  )
}
