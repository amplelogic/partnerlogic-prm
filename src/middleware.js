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

    // Check if user is account user
    const { data: accountUserData } = await supabase
      .from('account_users')
      .select('*')
      .eq('auth_user_id', session.user.id)
      .maybeSingle()

    // Check if user is support user
    const { data: supportUserData } = await supabase
      .from('support_users')
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
      if (accountUserData) {
        return NextResponse.redirect(new URL('/accounts', req.url))
      }
      if (supportUserData) {
        return NextResponse.redirect(new URL('/support', req.url))
      }
      // Regular partner stays on /dashboard
    }

    // Protect /accounts routes - only account users allowed
    if (req.nextUrl.pathname.startsWith('/accounts')) {
      if (!accountUserData) {
        if (adminData) return NextResponse.redirect(new URL('/admin', req.url))
        if (partnerManagerData) return NextResponse.redirect(new URL('/partner-manager', req.url))
        if (supportUserData) return NextResponse.redirect(new URL('/support', req.url))
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
    }

    // Protect /support routes - only support users allowed
    if (req.nextUrl.pathname.startsWith('/support')) {
      if (!supportUserData) {
        if (adminData) return NextResponse.redirect(new URL('/admin', req.url))
        if (partnerManagerData) return NextResponse.redirect(new URL('/partner-manager', req.url))
        if (accountUserData) return NextResponse.redirect(new URL('/accounts', req.url))
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
    }

    // If partner manager tries to access /dashboard, redirect to /partner-manager
    if (req.nextUrl.pathname.startsWith('/dashboard') && partnerManagerData) {
      return NextResponse.redirect(new URL('/partner-manager', req.url))
    }

    // If admin tries to access /dashboard, redirect to /admin
    if (req.nextUrl.pathname.startsWith('/dashboard') && adminData) {
      return NextResponse.redirect(new URL('/admin', req.url))
    }

    // If account user tries to access /dashboard, redirect to /accounts
    if (req.nextUrl.pathname.startsWith('/dashboard') && accountUserData) {
      return NextResponse.redirect(new URL('/accounts', req.url))
    }

    // If support user tries to access /dashboard, redirect to /support
    if (req.nextUrl.pathname.startsWith('/dashboard') && supportUserData) {
      return NextResponse.redirect(new URL('/support', req.url))
    }

    // If regular partner tries to access /admin, redirect to /dashboard
    if (req.nextUrl.pathname.startsWith('/admin') && !adminData) {
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
  matcher: ['/dashboard/:path*', '/admin/:path*', '/partner-manager/:path*', '/accounts/:path*', '/support/:path*'],
}