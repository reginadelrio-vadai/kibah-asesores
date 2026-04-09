'use client'

import { Sun, Moon } from 'lucide-react'
import { useTheme } from '@/hooks/useTheme'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center justify-center w-9 h-9 rounded-[var(--radius-sm)]
        bg-bg-tertiary hover:bg-border-primary
        transition-colors cursor-pointer"
      aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
    >
      {theme === 'dark' ? (
        <Sun className="w-[18px] h-[18px] text-text-secondary" strokeWidth={1.5} />
      ) : (
        <Moon className="w-[18px] h-[18px] text-text-secondary" strokeWidth={1.5} />
      )}
    </button>
  )
}
