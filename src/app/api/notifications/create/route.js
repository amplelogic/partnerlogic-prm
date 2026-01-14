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
    const { notifications, notifyAccountUsers, dealId, dealName, dealValue } = body

    // Handle account user notifications for closed won deals
    if (notifyAccountUsers) {
      // Get all active account users using admin client
      const { data: accountUsers, error: accountUsersError } = await supabaseAdmin
        .from('account_users')
        .select('auth_user_id, first_name, last_name, email')
        .eq('active', true)

      if (accountUsersError) {
        console.error('Error fetching account users:', accountUsersError)
        return NextResponse.json(
          { error: 'Failed to fetch account users', details: accountUsersError.message },
          { status: 500 }
        )
      }

      if (!accountUsers || accountUsers.length === 0) {
        return NextResponse.json(
          { success: true, message: 'No active account users found' },
          { status: 200 }
        )
      }

      // Create notifications for all account users
      const accountNotifications = accountUsers.map(user => ({
        user_id: user.auth_user_id,
        title: 'New Invoice Ready',
        message: `Deal "${dealName}" (${dealValue}) has been closed won. Invoice is ready for processing.`,
        type: 'invoice',
        is_read: false,
        reference_id: dealId,
        reference_type: 'deal'
      }))

      const { data, error } = await supabaseAdmin
        .from('notifications')
        .insert(accountNotifications)
        .select()

      if (error) {
        console.error('Error creating account user notifications:', error)
        return NextResponse.json(
          { error: 'Failed to create notifications', details: error.message },
          { status: 500 }
        )
      }

      // Send emails to all account users
      try {
        console.log('📧 Sending invoice notification emails to account users...')
        
        const emailPromises = accountUsers.map(async (user) => {
          try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-invoice-notification`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
              },
              body: JSON.stringify({
                to: user.email,
                accountUserName: `${user.first_name} ${user.last_name}`,
                dealName,
                dealValue,
                dealId
              })
            })

            if (!response.ok) {
              const errorText = await response.text()
              console.error(`Failed to send email to ${user.email}:`, errorText)
              return { email: user.email, success: false, error: errorText }
            }

            const result = await response.json()
            console.log(`✅ Email sent to ${user.email}`)
            return { email: user.email, success: true, result }
          } catch (emailError) {
            console.error(`Error sending email to ${user.email}:`, emailError)
            return { email: user.email, success: false, error: emailError.message }
          }
        })

        const emailResults = await Promise.all(emailPromises)
        const successCount = emailResults.filter(r => r.success).length
        
        console.log(`📧 Email sending complete: ${successCount}/${accountUsers.length} successful`)
      } catch (emailError) {
        console.error('Error sending notification emails:', emailError)
        // Don't fail the request if emails fail, notifications were still created
      }

      return NextResponse.json({ 
        success: true, 
        data,
        message: `Notified ${accountUsers.length} account users`
      })
    }

    // Handle regular notifications
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
