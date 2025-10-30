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
      .single()

    // If accessing root /dashboard and user is admin, redirect to /admin
    if (req.nextUrl.pathname === '/dashboard' && adminData) {
      return NextResponse.redirect(new URL('/admin', req.url))
    }
    // Check if user is partner manager
    const { data: partnerManagerData } = await supabase
      .from('partner_managers')
      .select('*')
      .eq('auth_user_id', session.user.id)
      .single()

    // If accessing root /dashboard and user is partner manager, redirect to /partner-manager
    if (req.nextUrl.pathname === '/dashboard' && partnerManagerData) {
      return NextResponse.redirect(new URL('/partner-manager', req.url))
    }
  }

  return res
}

export const config = {
  matcher: ['/dashboard'],
}