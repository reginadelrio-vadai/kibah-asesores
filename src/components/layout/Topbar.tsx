'use client'

import { ThemeToggle } from './ThemeToggle'

interface TopbarProps {
  userName: string | null
}

export function Topbar({ userName }: TopbarProps) {
  return (
    <header
      className="h-[var(--topbar-height)] border-b border-border-primary bg-bg-secondary
        flex items-center justify-end px-6 gap-4"
    >
      <ThemeToggle />

      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-text-primary">
          {userName ?? 'Usuario'}
        </span>
        <div className="w-8 h-8 rounded-full bg-bg-tertiary flex items-center justify-center">
          <span className="text-xs font-semibold text-text-secondary">
            {userName ? userName.charAt(0).toUpperCase() : 'U'}
          </span>
        </div>
      </div>
    </header>
  )
}
