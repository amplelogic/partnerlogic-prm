'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function NotificationsRedirect() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const detectAndRedirect = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/auth/login')
          return
        }

        // Check if admin
        const { data: adminData } = await supabase
          .from('admins')
          .select('id')
          .eq('auth_user_id', user.id)
          .maybeSingle()

        if (adminData) {
          router.push('/admin/notifications')
          return
        }

        // Check if partner manager
        const { data: managerData } = await supabase
          .from('partner_managers')
          .select('id')
          .eq('auth_user_id', user.id)
          .maybeSingle()

        if (managerData) {
          router.push('/partner-manager/notifications')
          return
        }

        // Check if support user
        const { data: supportData } = await supabase
          .from('support_users')
          .select('id')
          .eq('auth_user_id', user.id)
          .maybeSingle()

        if (supportData) {
          router.push('/support/notifications')
          return
        }

        // Default to dashboard (partner)
        router.push('/dashboard/notifications')
      } catch (error) {
        console.error('Error detecting user role:', error)
        router.push('/dashboard/notifications')
      }
    }

    detectAndRedirect()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirecting to notifications...</p>
      </div>
    </div>
  )
}
