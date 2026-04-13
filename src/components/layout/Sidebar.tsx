'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Building2,
  FileText,
  Calendar,
  MessageSquare,
  Megaphone,
  Users,
  Landmark,
  Columns3,
  Webhook,
  Key,
  Shield,
  Menu,
  X,
} from 'lucide-react'
import type { UserRole } from '@/types'
import { useUnreadCount } from '@/hooks/useUnreadCount'
import { usePermissions } from '@/hooks/usePermissions'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  badge?: number
  permission?: string
}

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
      <span className="flex-1">{item.label}</span>
      {item.badge !== undefined && item.badge > 0 && (
        <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold leading-none">
          {item.badge > 99 ? '99+' : item.badge}
        </span>
      )}
    </Link>
  )
}

export function Sidebar({ role }: { role: UserRole }) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const { unreadCount } = useUnreadCount()
  const { can } = usePermissions()

  const isAdmin = role === 'admin'

  const mainNav: NavItem[] = [
    { label: 'Propiedades', href: '/dashboard/propiedades', icon: <Building2 className="w-5 h-5" strokeWidth={1.5} />, permission: 'propiedades.view' },
    { label: 'PDF', href: '/dashboard/pdf', icon: <FileText className="w-5 h-5" strokeWidth={1.5} />, permission: 'pdf.view' },
    { label: 'Calendario', href: isAdmin ? '/dashboard/admin/calendario' : '/dashboard/calendario', icon: <Calendar className="w-5 h-5" strokeWidth={1.5} />, permission: 'calendario.view' },
    { label: 'Whaapy', href: '/dashboard/whaapy', icon: <MessageSquare className="w-5 h-5" strokeWidth={1.5} />, permission: 'whaapy.view' },
    { label: 'Anuncios', href: isAdmin ? '/dashboard/admin/anuncios' : '/dashboard/anuncios', icon: <Megaphone className="w-5 h-5" strokeWidth={1.5} />, badge: unreadCount, permission: 'anuncios.view' },
  ]

  const adminItems: NavItem[] = [
    { label: 'Asesores', href: '/dashboard/admin/asesores', icon: <Users className="w-5 h-5" strokeWidth={1.5} />, permission: 'asesores.view' },
    { label: 'Desarrollos', href: '/dashboard/admin/desarrollos', icon: <Landmark className="w-5 h-5" strokeWidth={1.5} />, permission: 'desarrollos.view' },
    { label: 'Columnas', href: '/dashboard/admin/columnas', icon: <Columns3 className="w-5 h-5" strokeWidth={1.5} />, permission: 'columnas.view' },
    { label: 'Webhooks', href: '/dashboard/admin/webhooks', icon: <Webhook className="w-5 h-5" strokeWidth={1.5} />, permission: 'webhooks.view' },
    { label: 'API Keys', href: '/dashboard/admin/api-keys', icon: <Key className="w-5 h-5" strokeWidth={1.5} />, permission: 'apikeys.view' },
    { label: 'Roles', href: '/dashboard/admin/roles', icon: <Shield className="w-5 h-5" strokeWidth={1.5} /> },
  ]

  const visibleMain = mainNav.filter((item) => !item.permission || can(item.permission))
  const visibleAdmin = adminItems.filter((item) => {
    // Roles page is admin-only, hardcoded (not permission-based)
    if (item.href === '/dashboard/admin/roles') return isAdmin
    return !item.permission || can(item.permission)
  })
  const showAdminSection = visibleAdmin.length > 0

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="flex items-center px-5 h-16 border-b border-white/10">
        <img src="/images/kibah-logo-white.png" alt="Kibah" style={{ maxWidth: '120px', height: 'auto', objectFit: 'contain' }} />
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {visibleMain.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} />
        ))}

        {showAdminSection && (
          <>
            <div className="pt-4 pb-2 px-3">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-on-navy-muted)]/50">
                Admin
              </span>
            </div>
            {visibleAdmin.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} />
            ))}
          </>
        )}
      </nav>
    </div>
  )

  return (
    <>
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden flex items-center justify-center w-10 h-10 rounded-[var(--radius-sm)] bg-navy text-white"
        aria-label="Toggle sidebar"
      >
        {mobileOpen ? <X className="w-5 h-5" strokeWidth={1.5} /> : <Menu className="w-5 h-5" strokeWidth={1.5} />}
      </button>

      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

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
