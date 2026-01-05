'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, MessageSquare, User, Building2, AlertCircle,
  CheckCircle, Clock, Save, Mail
} from 'lucide-react'
import { notifyPartner, notifySupportUsers, NotificationTemplates } from '@/lib/notifications'
import TicketMessaging from '@/components/TicketMessaging'

export default function PartnerManagerSupportTicketDetailPage() {
  const params = useParams()
  const [ticket, setTicket] = useState(null)
  const [partnerManager, setPartnerManager] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  
  const router = useRouter()
  const supabase = createClient()

  const ticketStatuses = [
    { value: 'open', label: 'Open', color: 'bg-red-100 text-red-800' },
    { value: 'in_progress', label: 'In Progress', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'resolved', label: 'Resolved', color: 'bg-green-100 text-green-800' },
    { value: 'closed', label: 'Closed', color: 'bg-gray-100 text-gray-800' }
  ]

  useEffect(() => {
    if (params?.id) {
      loadTicketDetails()
    }
  }, [params?.id])

  const loadTicketDetails = async () => {
    try {
      setLoading(true)
      
      // Get current user and partner manager
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      setCurrentUser(user)

      const { data: managerData } = await supabase
        .from('partner_managers')
        .select('*')
        .eq('auth_user_id', user.id)
        .single()

      if (!managerData) {
        router.push('/dashboard')
        return
      }

      setPartnerManager(managerData)

      // Get ticket details with partner info
      const { data: ticketData, error: ticketError } = await supabase
        .from('support_tickets')
        .select(`
          *,
          partner:partners(
            id,
            first_name,
            last_name,
            email,
            phone,
            partner_manager_id,
            organization:organizations(name, tier, type)
          )
        `)
        .eq('id', params.id)
        .single()

      if (ticketError) {
        console.error('Ticket error:', ticketError)
        throw ticketError
      }

      // Check if this partner belongs to the current partner manager
      if (ticketData.partner?.partner_manager_id !== managerData.id) {
        console.error('Access denied: Partner does not belong to this manager')
        router.push('/partner-manager/support')
        return
      }

      setTicket(ticketData)
      setNewStatus(ticketData.status)

    } catch (error) {
      console.error('Error loading ticket:', error)
      router.push('/partner-manager/support')
    } finally {
      setLoading(false)
    }
  }

  const updateTicketStatus = async () => {
    try {
      setUpdating(true)

      const updates = {
        status: newStatus,
        updated_at: new Date().toISOString()
      }

      if (newStatus === 'resolved' && !ticket.resolved_at) {
        updates.resolved_at = new Date().toISOString()
      }

      const { error } = await supabase
        .from('support_tickets')
        .update(updates)
        .eq('id', params.id)

      if (error) {
        console.error('Update error:', error)
        throw error
      }

      console.log('✅ Status updated in database')
      
      // Update local state immediately
      setTicket(prev => ({
        ...prev,
        status: newStatus,
        updated_at: updates.updated_at,
        ...(updates.resolved_at && { resolved_at: updates.resolved_at })
      }))

      // Notify partner and support users about status change
      try {
        console.log('🔄 Ticket status changed:', { from: ticket.status, to: newStatus, ticketId: ticket.id })
        const oldStatus = ticket.status
        const notification = NotificationTemplates.supportTicketStatusChanged(
          ticket.id,
          oldStatus,
          newStatus
        )
        
        console.log('📝 Notification template:', notification)
        
        // Notify partner
        if (ticket.partner_id) {
          console.log('👤 Notifying partner:', ticket.partner_id)
          const result = await notifyPartner({
            partnerId: ticket.partner_id,
            ...notification,
            referenceId: ticket.id,
            referenceType: 'support_ticket',
            sendEmail: true,
            emailData: {
              subject: `Ticket #${ticket.id.slice(0, 8)} Status Update - ${ticket.subject}`,
              ticketId: ticket.id,
              ticketSubject: ticket.subject,
              status: newStatus,
              description: ticket.description
            }
          })
          console.log('Partner notification result:', result)
        } else {
          console.warn('⚠️ No partner_id on ticket')
        }
        
        // Notify support users
        console.log('👥 Notifying support users about status change...')
        const supportResult = await notifySupportUsers({
          title: 'Ticket Status Updated',
          message: `Partner Manager updated ticket #${ticket.id.slice(0, 8)} to ${ticketStatuses.find(s => s.value === newStatus)?.label || newStatus}`,
          type: 'support',
          referenceId: ticket.id,
          referenceType: 'support_ticket'
        })
        console.log('Support users notification result:', supportResult)
      } catch (notificationError) {
        console.error('❌ Error sending notification:', notificationError)
      }

      await loadTicketDetails()
      alert('Ticket status updated successfully!')

    } catch (error) {
      console.error('Error updating ticket:', error)
      alert('Failed to update ticket status: ' + error.message)
    } finally {
      setUpdating(false)
    }
  }

  const getStatusColor = (status) => {
    const statusConfig = ticketStatuses.find(s => s.value === status)
    return statusConfig?.color || 'bg-gray-100 text-gray-800'
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'low': return 'bg-green-100 text-green-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'urgent': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/3 mb-6"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!ticket) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Ticket not found</h2>
            <p className="text-gray-600 mb-4">You don't have access to this ticket or it doesn't exist.</p>
            <Link href="/partner-manager/support" className="text-blue-600 hover:text-blue-700">
              Back to Support
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            href="/partner-manager/support"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-5 w-5 mr-1" />
            Back to Support
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{ticket.subject}</h1>
              <p className="text-gray-600">Ticket #{ticket.id.slice(0, 8)}</p>
            </div>
            <div className="flex items-center space-x-3">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(ticket.status)}`}>
                {ticket.status?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </span>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(ticket.priority)}`}>
                {ticket.priority?.charAt(0).toUpperCase() + ticket.priority?.slice(1)} Priority
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Ticket Description */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Description</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{ticket.description}</p>
            </div>

            {/* Status Management */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Update Status</h2>
              <div className="flex items-center space-x-4">
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                >
                  {ticketStatuses.map(status => (
                    <option key={status.value} value={status.value}>{status.label}</option>
                  ))}
                </select>
                <button
                  onClick={updateTicketStatus}
                  disabled={updating || newStatus === ticket.status}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updating ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Update Status
                </button>
              </div>
            </div>

            {/* Communication Section */}
            {currentUser && partnerManager && (
              <TicketMessaging 
                ticketId={ticket.id}
                currentUserId={currentUser.id}
                senderType="partner_manager"
                senderName={`${partnerManager.first_name} ${partnerManager.last_name}`}
                ticketData={ticket}
              />
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Partner Information */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Partner Information</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Partner</p>
                  <p className="font-medium text-gray-900">
                    {ticket.partner?.first_name} {ticket.partner?.last_name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Organization</p>
                  <p className="font-medium text-gray-900">{ticket.partner?.organization?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <a href={`mailto:${ticket.partner?.email}`} className="text-blue-600 hover:text-blue-700">
                    {ticket.partner?.email}
                  </a>
                </div>
                {ticket.partner?.phone && (
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="font-medium text-gray-900">{ticket.partner?.phone}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Ticket Info */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Ticket Information</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Type</p>
                  <p className="font-medium text-gray-900 capitalize">{ticket.type?.replace('_', ' ')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Priority</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                    {ticket.priority?.charAt(0).toUpperCase() + ticket.priority?.slice(1)}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Created</p>
                  <p className="font-medium text-gray-900">
                    {new Date(ticket.created_at).toLocaleString()}
                  </p>
                </div>
                {ticket.resolved_at && (
                  <div>
                    <p className="text-sm text-gray-600">Resolved</p>
                    <p className="font-medium text-gray-900">
                      {new Date(ticket.resolved_at).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <a 
                  href={`mailto:${ticket.partner?.email}?subject=Re: ${ticket.subject}`}
                  className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Email Partner
                </a>
                <Link
                  href={`/partner-manager/partners/${ticket.partner?.id}`}
                  className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <User className="h-4 w-4 mr-2" />
                  View Partner Profile
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}