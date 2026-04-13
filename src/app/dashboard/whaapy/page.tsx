'use client'

import { useEffect, useRef, useState } from 'react'
import { ExternalLink } from 'lucide-react'

const WHAAPY_URL = 'https://app.whaapy.com'
const IFRAME_WIDTH = 2000
const IFRAME_HEIGHT = 1000

export default function WhaapyPage() {
  const [error, setError] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const update = () => {
      const w = el.clientWidth
      const h = el.clientHeight
      setScale(Math.min(w / IFRAME_WIDTH, h / IFRAME_HEIGHT))
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

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
      ref={containerRef}
      className="-m-6"
      style={{
        width: '100%',
        height: 'calc(100vh - 64px)',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <iframe
        src={WHAAPY_URL}
        onError={() => setError(true)}
        allow="clipboard-write; microphone"
        title="Whaapy"
        style={{
          width: `${IFRAME_WIDTH}px`,
          height: `${IFRAME_HEIGHT}px`,
          border: 'none',
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
      />
    </div>
  )
}
