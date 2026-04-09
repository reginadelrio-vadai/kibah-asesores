import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  const { user, supabaseResponse, supabase } = await updateSession(request)
  const { pathname } = request.nextUrl

  // /login → if authenticated → redirect /dashboard
  if (pathname === '/login') {
    if (user) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return supabaseResponse
  }

  // /dashboard/* → if no session → redirect /login
  if (pathname.startsWith('/dashboard')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // /dashboard/admin/* → verify role = 'admin'
    if (pathname.startsWith('/dashboard/admin')) {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        if (!profile || profile.role !== 'admin') {
          return NextResponse.redirect(
            new URL('/dashboard/propiedades', request.url)
          )
        }
      } catch (error) {
        console.error('Error checking admin role in middleware:', error)
        return NextResponse.redirect(new URL('/login', request.url))
      }
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/dashboard/:path*', '/login'],
}
