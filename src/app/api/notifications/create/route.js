import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Create Supabase admin client with service role key
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function POST(request) {
  try {
    const body = await request.json()
    const { notifications } = body

    if (!notifications || !Array.isArray(notifications)) {
      return NextResponse.json(
        { error: 'Invalid request: notifications array required' },
        { status: 400 }
      )
    }

    // Validate each notification has required fields
    for (const notification of notifications) {
      if (!notification.user_id || !notification.title || !notification.message || !notification.type) {
        return NextResponse.json(
          { error: 'Each notification must have user_id, title, message, and type' },
          { status: 400 }
        )
      }
    }

    // Insert notifications using admin client (bypasses RLS)
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .insert(notifications)
      .select()

    if (error) {
      console.error('Error creating notifications:', error)
      return NextResponse.json(
        { error: 'Failed to create notifications', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error in notifications API:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
