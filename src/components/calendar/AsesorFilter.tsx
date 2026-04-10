'use client'

import { useEffect, useState } from 'react'

const ASESOR_COLORS = [
  '#E8872A', '#3B82F6', '#10B981', '#8B5CF6',
  '#F59E0B', '#EC4899', '#06B6D4', '#F97316',
]

interface ConnectedUser {
  userId: string
  fullName: string
  calendarEmail: string | null
}

interface AsesorFilterProps {
  value: string
  onChange: (userId: string) => void
}

export function AsesorFilter({ value, onChange }: AsesorFilterProps) {
  const [users, setUsers] = useState<ConnectedUser[]>([])

  useEffect(() => {
    fetch('/api/calendar/admin/asesores')
      .then((r) => r.json())
      .then((data) => setUsers(data.data ?? []))
      .catch(() => {})
  }, [])

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button
        onClick={() => onChange('')}
        className={`h-8 px-3 text-xs font-medium rounded-full border transition-colors cursor-pointer
          ${!value ? 'bg-orange text-white border-orange' : 'border-border-primary text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'}`}
      >
        Todos
      </button>
      {users.map((u, idx) => (
        <button
          key={u.userId}
          onClick={() => onChange(u.userId)}
          className={`h-8 px-3 text-xs font-medium rounded-full border transition-colors cursor-pointer flex items-center gap-1.5
            ${value === u.userId ? 'text-white border-transparent' : 'border-border-primary text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'}`}
          style={value === u.userId ? { backgroundColor: ASESOR_COLORS[idx % ASESOR_COLORS.length], borderColor: ASESOR_COLORS[idx % ASESOR_COLORS.length] } : undefined}
        >
          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: ASESOR_COLORS[idx % ASESOR_COLORS.length] }} />
          {u.fullName}
        </button>
      ))}
    </div>
  )
}
