import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { userId, newPassword, adminAuthUserId } = await request.json()

    console.log('=== PASSWORD UPDATE REQUEST ===')
    console.log('Target User ID:', userId)
    console.log('Admin Auth User ID:', adminAuthUserId)

    // Validate input
    if (!userId || !newPassword || !adminAuthUserId) {
      return NextResponse.json(
        { error: 'User ID, new password, and admin ID are required' },
        { status: 400 }
      )
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      )
    }

    // Validate environment variables
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY')
      return NextResponse.json(
        { error: 'Server configuration error - missing service role key' },
        { status: 500 }
      )
    }

    // Create admin client with service role key (bypasses RLS)
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

    // Verify the requesting user is an admin (using service role to bypass RLS)
    const { data: adminData, error: adminError } = await supabaseAdmin
      .from('admins')
      .select('id, first_name, last_name, email')
      .eq('auth_user_id', adminAuthUserId)
      .maybeSingle()

    console.log('Admin check - found:', !!adminData)

    if (adminError) {
      console.error('Admin query error:', adminError)
      return NextResponse.json(
        { error: `Database error: ${adminError.message}` },
        { status: 500 }
      )
    }

    if (!adminData) {
      console.error('User is not an admin')
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      )
    }

    console.log('✅ Admin verified:', adminData.email)
    console.log('Updating password for user:', userId)

    // Update the user's password
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { password: newPassword }
    )

    if (error) {
      console.error('❌ Password update error:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to update password' },
        { status: 500 }
      )
    }

    console.log('✅ Password updated successfully!')

    return NextResponse.json(
      { success: true, message: 'Password updated successfully' },
      { status: 200 }
    )

  } catch (error) {
    console.error('❌ API error:', error)
    console.error('Stack:', error.stack)
    return NextResponse.json(
      { error: `Internal server error: ${error.message}` },
      { status: 500 }
    )
  }
}