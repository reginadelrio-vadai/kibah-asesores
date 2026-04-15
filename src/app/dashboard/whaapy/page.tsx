'use client'

import { useEffect, useRef, useState } from 'react'
import { ExternalLink } from 'lucide-react'

const WHAAPY_URL = 'https://app.whaapy.com'
const IFRAME_WIDTH = 2000

export default function WhaapyPage() {
  const [error, setError] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const [iframeHeight, setIframeHeight] = useState(1000)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const update = () => {
      const w = el.clientWidth
      const h = el.clientHeight
      if (w === 0 || h === 0) return
      const s = w / IFRAME_WIDTH
      setScale(s)
      setIframeHeight(h / s)
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
          position: 'absolute',
          top: 0,
          left: 0,
          width: `${IFRAME_WIDTH}px`,
          height: `${iframeHeight}px`,
          border: 'none',
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
      />
    </div>
  )
}
