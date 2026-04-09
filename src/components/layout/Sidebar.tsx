'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Building2,
  MessageSquare,
  Users,
  Columns3,
  Webhook,
  Key,
  Menu,
  X,
} from 'lucide-react'
import type { UserRole } from '@/types'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
}

const asesorNav: NavItem[] = [
  {
    label: 'Propiedades',
    href: '/dashboard/propiedades',
    icon: <Building2 className="w-5 h-5" strokeWidth={1.5} />,
  },
  {
    label: 'Whaapy',
    href: '/dashboard/whaapy',
    icon: <MessageSquare className="w-5 h-5" strokeWidth={1.5} />,
  },
]

const adminNav: NavItem[] = [
  {
    label: 'Asesores',
    href: '/dashboard/admin/asesores',
    icon: <Users className="w-5 h-5" strokeWidth={1.5} />,
  },
  {
    label: 'Columnas',
    href: '/dashboard/admin/columnas',
    icon: <Columns3 className="w-5 h-5" strokeWidth={1.5} />,
  },
  {
    label: 'Webhooks',
    href: '/dashboard/admin/webhooks',
    icon: <Webhook className="w-5 h-5" strokeWidth={1.5} />,
  },
  {
    label: 'API Keys',
    href: '/dashboard/admin/api-keys',
    icon: <Key className="w-5 h-5" strokeWidth={1.5} />,
  },
]

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const isActive = pathname === item.href
  return (
    <Link
      href={item.href}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-sm)] text-sm font-medium transition-colors ${
        isActive
          ? 'bg-white/10 text-white'
          : 'text-[var(--text-on-navy-muted)] hover:bg-white/5 hover:text-white'
      }`}
    >
      {item.icon}
      {item.label}
    </Link>
  )
}

export function Sidebar({ role }: { role: UserRole }) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 h-16 border-b border-white/10">
        <div className="w-8 h-8 rounded-[var(--radius-sm)] bg-orange flex items-center justify-center">
          <span className="text-white font-bold text-sm">K</span>
        </div>
        <span className="text-white font-semibold text-lg">Kibah</span>
      </div>

      {/* Main nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {asesorNav.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} />
        ))}

        {/* Admin section */}
        {role === 'admin' && (
          <>
            <div className="pt-4 pb-2 px-3">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-on-navy-muted)]/50">
                Admin
              </span>
            </div>
            {adminNav.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} />
            ))}
          </>
        )}
      </nav>
    </div>
  )

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden flex items-center justify-center w-10 h-10 rounded-[var(--radius-sm)] bg-navy text-white"
        aria-label="Toggle sidebar"
      >
        {mobileOpen ? (
          <X className="w-5 h-5" strokeWidth={1.5} />
        ) : (
          <Menu className="w-5 h-5" strokeWidth={1.5} />
        )}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 h-screen w-[var(--sidebar-width)] bg-bg-sidebar
          transition-transform duration-200 ease-in-out
          lg:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {sidebarContent}
      </aside>
    </>
  )
}
