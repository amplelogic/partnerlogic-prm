import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'

export async function middleware(req) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (session) {
    // Check if user is admin
    const { data: adminData } = await supabase
      .from('admins')
      .select('*')
      .eq('auth_user_id', session.user.id)
      .maybeSingle()

    // Check if user is partner manager
    const { data: partnerManagerData } = await supabase
      .from('partner_managers')
      .select('*')
      .eq('auth_user_id', session.user.id)
      .maybeSingle()

    // If accessing /dashboard or /partner-manager, redirect based on role
    if (req.nextUrl.pathname === '/dashboard') {
      if (adminData) {
        return NextResponse.redirect(new URL('/admin', req.url))
      }
      if (partnerManagerData) {
        return NextResponse.redirect(new URL('/partner-manager', req.url))
      }
      // Regular partner stays on /dashboard
    }

    // If partner manager tries to access /dashboard, redirect to /partner-manager
    if (req.nextUrl.pathname.startsWith('/dashboard') && partnerManagerData) {
      return NextResponse.redirect(new URL('/partner-manager', req.url))
    }

    // If admin tries to access /dashboard, redirect to /admin
    if (req.nextUrl.pathname.startsWith('/dashboard') && adminData) {
      return NextResponse.redirect(new URL('/admin', req.url))
    }

    // If regular partner tries to access /admin, redirect to /dashboard
    if (req.nextUrl.pathname.startsWith('/admin') && !adminData && !partnerManagerData) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    // If regular partner tries to access /partner-manager, redirect to /dashboard
    if (req.nextUrl.pathname.startsWith('/partner-manager') && !partnerManagerData) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    // If partner manager tries to access /admin, redirect to /partner-manager
    if (req.nextUrl.pathname.startsWith('/admin') && partnerManagerData && !adminData) {
      return NextResponse.redirect(new URL('/partner-manager', req.url))
    }
  }

  return res
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/partner-manager/:path*'],
}