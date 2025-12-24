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
      throw new Error(result.error || 'Failed to create notification')
    }
    
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
    const response = await fetch('/api/notifications/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ notifications })
    })

    const result = await response.json()
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to create notifications')
    }
    
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
 * Notify a partner
 */
export async function notifyPartner({ partnerId, title, message, type, referenceId, referenceType }) {
  try {
    const supabase = createClient()
    
    // Get the partner's auth_user_id
    const { data: partner, error: partnerError } = await supabase
      .from('partners')
      .select('auth_user_id')
      .eq('id', partnerId)
      .single()

    if (partnerError) throw partnerError

    return await createNotification({
      userId: partner.auth_user_id,
      title,
      message,
      type,
      referenceId,
      referenceType
    })
  } catch (error) {
    console.error('Error notifying partner:', error)
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
    title: 'New Support Ticket',
    message: `${userName} created ticket #${ticketId}: ${subject}`,
    type: 'support'
  }),
  
  supportTicketResponse: (ticketId, responderName) => ({
    title: 'Support Ticket Updated',
    message: `${responderName} responded to your ticket #${ticketId}`,
    type: 'support'
  }),
  
  supportTicketStatusChanged: (ticketId, newStatus) => ({
    title: 'Ticket Status Updated',
    message: `Your ticket #${ticketId} status changed to ${newStatus}`,
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
