import { createClient } from '@/lib/supabase/client'

/**
 * Create a notification for a user via API route
 */
export async function createNotification({
  userId,
  title,
  message,
  type = 'general',
  referenceId = null,
  referenceType = null
}) {
  try {
    console.log('🔔 Creating notification:', { userId, title, type, referenceType })
    
    const response = await fetch('/api/notifications/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        notifications: [{
          user_id: userId,
          title,
          message,
          type,
          reference_id: referenceId,
          reference_type: referenceType
        }]
      })
    })

    const result = await response.json()
    
    if (!response.ok) {
      console.error('❌ Notification creation failed:', result)
      throw new Error(result.error || 'Failed to create notification')
    }
    
    console.log('✅ Notification created successfully:', result.data?.[0]?.id)
    return { data: result.data?.[0], error: null }
  } catch (error) {
    console.error('Error creating notification:', error)
    return { data: null, error }
  }
}

/**
 * Create notifications for multiple users via API route
 */
export async function createBulkNotifications(notifications) {
  try {
    console.log(`🔔 Creating ${notifications.length} bulk notifications`)
    
    const response = await fetch('/api/notifications/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ notifications })
    })

    const result = await response.json()
    
    if (!response.ok) {
      console.error('❌ Bulk notification creation failed:', result)
      throw new Error(result.error || 'Failed to create notifications')
    }
    
    console.log(`✅ Created ${result.data?.length || 0} notifications successfully`)
    return { data: result.data, error: null }
  } catch (error) {
    console.error('Error creating bulk notifications:', error)
    return { data: null, error }
  }
}

/**
 * Notify all admins
 */
export async function notifyAdmins({ title, message, type, referenceId, referenceType }) {
  try {
    const supabase = createClient()
    
    // Get all admin users from the admins table
    const { data: admins, error: adminsError } = await supabase
      .from('admins')
      .select('auth_user_id')

    if (adminsError) throw adminsError
    
    if (!admins || admins.length === 0) {
      console.warn('No admins found to notify')
      return { data: null, error: 'No admins found' }
    }

    const notifications = admins.map(admin => ({
      user_id: admin.auth_user_id,
      title,
      message,
      type,
      reference_id: referenceId,
      reference_type: referenceType
    }))

    return await createBulkNotifications(notifications)
  } catch (error) {
    console.error('Error notifying admins:', error)
    return { data: null, error }
  }
}

/**
 * Notify partner manager of a partner
 */
export async function notifyPartnerManager({ partnerId, title, message, type, referenceId, referenceType }) {
  try {
    const supabase = createClient()
    
    // Get the partner's manager
    const { data: partner, error: partnerError } = await supabase
      .from('partners')
      .select('partner_manager_id')
      .eq('id', partnerId)
      .single()

    if (partnerError) throw partnerError
    if (!partner.partner_manager_id) {
      console.warn('No partner manager assigned to this partner')
      return { data: null, error: 'No partner manager assigned' }
    }

    // Get the manager's auth_user_id
    const { data: manager, error: managerError } = await supabase
      .from('partner_managers')
      .select('auth_user_id')
      .eq('id', partner.partner_manager_id)
      .single()

    if (managerError) throw managerError

    return await createNotification({
      userId: manager.auth_user_id,
      title,
      message,
      type,
      referenceId,
      referenceType
    })
  } catch (error) {
    console.error('Error notifying partner manager:', error)
    return { data: null, error }
  }
}

/**
 * Notify all support users
 */
export async function notifySupportUsers({ title, message, type, referenceId, referenceType }) {
  try {
    console.log('👥 Notifying support users...')
    const supabase = createClient()
    
    // Get all active support users
    const { data: supportUsers, error: supportUsersError } = await supabase
      .from('support_users')
      .select('auth_user_id')
      .eq('active', true)

    if (supportUsersError) {
      console.error('❌ Error fetching support users:', supportUsersError)
      throw supportUsersError
    }
    
    if (!supportUsers || supportUsers.length === 0) {
      console.warn('⚠️ No active support users found to notify')
      return { data: null, error: 'No active support users found' }
    }

    console.log(`✅ Found ${supportUsers.length} active support users`)

    const notifications = supportUsers.map(user => ({
      user_id: user.auth_user_id,
      title,
      message,
      type,
      reference_id: referenceId,
      reference_type: referenceType
    }))

    return await createBulkNotifications(notifications)
  } catch (error) {
    console.error('Error notifying support users:', error)
    return { data: null, error }
  }
}

/**
 * Send email for support ticket updates
 */
export async function sendSupportTicketEmail({ subject, ticketId, ticketSubject, status, description, partnerData }) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase environment variables')
      return { success: false, error: 'Missing configuration' }
    }

    console.log('📧 Sending email via edge function:', {
      to: partnerData.email,
      subject,
      ticketId: ticketId.slice(0, 8),
      status
    })

    const response = await fetch(`${supabaseUrl}/functions/v1/send-support-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`
      },
      body: JSON.stringify({
        to: partnerData.email,
        subject,
        ticketId,
        ticketSubject,
        status,
        description: description || '',
        partnerName: `${partnerData.first_name} ${partnerData.last_name}`
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Email sending failed:', errorText)
      throw new Error(`Email sending failed: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    console.log('✅ Email sent successfully:', data)
    
    return { success: true, data }
  } catch (error) {
    console.error('Error sending email:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Send overdue payment reminder email to partner
 */
export async function sendOverduePaymentEmail({ 
  dealId, 
  customerName, 
  partnerEmail,
  partnerName,
  amount, 
  description 
}) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase environment variables')
      return { success: false, error: 'Missing configuration' }
    }

    console.log('📧 Sending overdue payment reminder via edge function:', {
      partnerEmail,
      dealId: dealId?.slice(0, 8)
    })

    const response = await fetch(`${supabaseUrl}/functions/v1/send-overdue-reminder`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`
      },
      body: JSON.stringify({
        partnerEmail,
        partnerName,
        dealDetails: {
          id: dealId,
          customerName,
          amount,
          description: description || ''
        }
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Overdue reminder email sending failed:', errorText)
      throw new Error(`Email sending failed: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    console.log('✅ Overdue reminder email sent successfully:', data)
    
    return { success: true, data }
  } catch (error) {
    console.error('Error sending overdue reminder email:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Send invoice email to client and partner manager
 */
export async function sendInvoiceEmail({ 
  dealId, 
  customerName, 
  customerEmail, 
  partnerManagerEmail,
  amount, 
  description 
}) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase environment variables')
      return { success: false, error: 'Missing configuration' }
    }

    // Send invoice to admin instead of customer
    const adminEmail = 'billing@amplelogic.com'
    
    console.log('📧 Sending invoice email via edge function:', {
      adminEmail,
      partnerManagerEmail,
      dealId: dealId?.slice(0, 8)
    })

    const response = await fetch(`${supabaseUrl}/functions/v1/send-invoice-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`
      },
      body: JSON.stringify({
        clientEmail: adminEmail,
        partnerManagerEmail: partnerManagerEmail || null,
        dealDetails: {
          id: dealId,
          customerName,
          amount,
          description: description || ''
        }
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Invoice email sending failed:', errorText)
      throw new Error(`Email sending failed: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    console.log('✅ Invoice email sent successfully:', data)
    
    return { success: true, data }
  } catch (error) {
    console.error('Error sending invoice email:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Notify a partner (with optional email)
 */
export async function notifyPartner({ 
  partnerId, 
  title, 
  message, 
  type, 
  referenceId, 
  referenceType,
  sendEmail = false,
  emailData = null 
}) {
  try {
    console.log('💼 notifyPartner called:', { partnerId, title, sendEmail })
    const supabase = createClient()
    
    // Get the partner's auth_user_id and email
    const { data: partner, error: partnerError } = await supabase
      .from('partners')
      .select('auth_user_id, email, first_name, last_name')
      .eq('id', partnerId)
      .single()

    if (partnerError) {
      console.error('❌ Error fetching partner:', partnerError)
      throw partnerError
    }
    
    if (!partner) {
      console.error('❌ Partner not found:', partnerId)
      throw new Error('Partner not found')
    }

    console.log('✅ Partner found:', { email: partner.email, auth_user_id: partner.auth_user_id })

    // Send in-app notification
    console.log('📱 Sending in-app notification to partner...')
    const notificationResult = await createNotification({
      userId: partner.auth_user_id,
      title,
      message,
      type,
      referenceId,
      referenceType
    })

    // Send email if requested
    if (sendEmail && emailData) {
      console.log('📧 Sending email to partner:', partner.email)
      const emailResult = await sendSupportTicketEmail({
        ...emailData,
        partnerData: partner
      })
      console.log('Email result:', emailResult)
    } else {
      console.log('ℹ️ Email not requested or no email data')
    }

    return notificationResult
  } catch (error) {
    console.error('❌ Error in notifyPartner:', error)
    return { data: null, error }
  }
}

// Notification templates for common events

export const NotificationTemplates = {
  // Deal notifications
  dealCreated: (dealName, partnerName) => ({
    title: 'New Deal Created',
    message: `${partnerName} created a new deal: ${dealName}`,
    type: 'deal'
  }),
  
  dealStatusChanged: (dealName, oldStatus, newStatus) => ({
    title: 'Deal Status Updated',
    message: `${dealName} status changed from ${oldStatus} to ${newStatus}`,
    type: 'deal'
  }),
  
  dealApprovalNeeded: (dealName, partnerName) => ({
    title: 'Deal Approval Required',
    message: `${partnerName} submitted ${dealName} for approval`,
    type: 'deal'
  }),

  // Support ticket notifications
  supportTicketCreated: (ticketId, subject, userName) => ({
    title: 'New Support Ticket Created',
    message: `${userName} created ticket #${ticketId.slice(0, 8)}: ${subject}`,
    type: 'support'
  }),
  
  supportTicketResponse: (ticketId, responderName, responsePreview) => ({
    title: 'New Response on Your Ticket',
    message: `${responderName} responded: "${responsePreview.substring(0, 50)}${responsePreview.length > 50 ? '...' : ''}"`,
    type: 'support'
  }),
  
  supportTicketStatusChanged: (ticketId, oldStatus, newStatus) => ({
    title: 'Ticket Status Updated',
    message: `Ticket #${ticketId.slice(0, 8)} changed from ${oldStatus.replace('_', ' ')} to ${newStatus.replace('_', ' ')}`,
    type: 'support'
  }),
  
  supportTicketResolved: (ticketId, subject) => ({
    title: '✅ Ticket Resolved',
    message: `Your ticket "${subject}" has been marked as resolved`,
    type: 'support'
  }),
  
  supportTicketClosed: (ticketId, subject) => ({
    title: 'Ticket Closed',
    message: `Your ticket "${subject}" has been closed`,
    type: 'support'
  }),

  // Partner notifications
  partnerRegistered: (partnerName) => ({
    title: 'New Partner Registration',
    message: `${partnerName} has registered and needs approval`,
    type: 'partner'
  }),
  
  partnerApproved: () => ({
    title: 'Partner Account Approved',
    message: 'Your partner account has been approved and is now active',
    type: 'partner'
  }),

  // General notifications
  passwordReset: () => ({
    title: 'Password Reset',
    message: 'Your password has been reset by an administrator',
    type: 'general'
  })
}