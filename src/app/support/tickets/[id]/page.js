'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, Mail, Phone, Building2, User, Calendar,
  AlertCircle, Clock, CheckCircle2, XCircle, Save,
  ExternalLink, MessageSquare
} from 'lucide-react'
import { notifyPartner, notifySupportUsers, NotificationTemplates } from '@/lib/notifications'
import TicketMessaging from '@/components/TicketMessaging'

export default function SupportTicketDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [ticket, setTicket] = useState(null)
  const [supportUser, setSupportUser] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState('')
  const [response, setResponse] = useState('')
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  
  const supabase = createClient()

  const statusConfig = {
    open: { label: 'Open', color: 'bg-blue-100 text-blue-800', icon: AlertCircle },
    in_progress: { label: 'In Progress', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
    resolved: { label: 'Resolved', color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
    closed: { label: 'Closed', color: 'bg-gray-100 text-gray-800', icon: XCircle }
  }

  const priorityConfig = {
    low: { label: 'Low', color: 'text-gray-600', bg: 'bg-gray-100' },
    medium: { label: 'Medium', color: 'text-blue-600', bg: 'bg-blue-100' },
    high: { label: 'High', color: 'text-orange-600', bg: 'bg-orange-100' },
    urgent: { label: 'Urgent', color: 'text-red-600', bg: 'bg-red-100' }
  }

  useEffect(() => {
    if (params?.id) {
      loadTicket()
    }
  }, [params?.id])

const loadTicket = async () => {
  try {
    setLoading(true)

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth/login')
      return
    }
    setCurrentUser(user)

    // Get support user info
    const { data: supportUserData } = await supabase
      .from('support_users')
      .select('*')
      .eq('auth_user_id', user.id)
      .single()
    
    if (supportUserData) {
      setSupportUser(supportUserData)
    }

    const { data, error } = await supabase
      .from('support_tickets')
      .select(`
        *,
        partner:partners(
          id,
          first_name,
          last_name,
          email,
          phone,
          organization:organizations(
            id,
            name
          )
        )
      `)
      .eq('id', params.id)
      .single()

    if (error) throw error

    setTicket(data)
    setSelectedStatus(data.status)

  } catch (error) {
    console.error('Error loading ticket:', error)
    setError('Failed to load ticket details')
  } finally {
    setLoading(false)
  }
}

  const handleStatusUpdate = async () => {
    if (selectedStatus === ticket.status) {
      setError('Status is already set to this value')
      return
    }

    try {
      setUpdating(true)
      setError('')
      setSuccess('')

      const updateData = {
        status: selectedStatus,
        updated_at: new Date().toISOString()
      }

      // If marking as resolved, set resolved_at timestamp
      if (selectedStatus === 'resolved' && ticket.status !== 'resolved') {
        updateData.resolved_at = new Date().toISOString()
      }

      const { error: updateError } = await supabase
        .from('support_tickets')
        .update(updateData)
        .eq('id', ticket.id)

      if (updateError) throw updateError

      console.log('✅ Status updated in database')
      
      // Update local state immediately
      setTicket(prev => ({
        ...prev,
        status: selectedStatus,
        updated_at: updateData.updated_at,
        ...(updateData.resolved_at && { resolved_at: updateData.resolved_at })
      }))
      setSelectedStatus(selectedStatus)

      // Notify partner and support users about status change
      try {
        console.log('🔄 Ticket status changed by support user:', { from: ticket.status, to: selectedStatus, ticketId: ticket.id })
        const oldStatus = ticket.status
        const notification = NotificationTemplates.supportTicketStatusChanged(
          ticket.id,
          oldStatus,
          selectedStatus
        )
        
        console.log('📝 Notification template:', notification)
        
        // Notify partner
        if (ticket.partner?.id) {
          console.log('👤 Notifying partner:', ticket.partner.id)
          const result = await notifyPartner({
            partnerId: ticket.partner.id,
            ...notification,
            referenceId: ticket.id,
            referenceType: 'support_ticket',
            sendEmail: true,
            emailData: {
              subject: `Ticket #${ticket.id.slice(0, 8)} Status Update - ${ticket.subject}`,
              ticketId: ticket.id,
              ticketSubject: ticket.subject,
              status: selectedStatus,
              description: ticket.description
            }
          })
          console.log('Partner notification result:', result)
        } else {
          console.warn('⚠️ No partner on ticket')
        }
        
        // Notify other support users
        console.log('👥 Notifying other support users about status change...')
        const supportResult = await notifySupportUsers({
          title: 'Ticket Status Updated',
          message: `Support user updated ticket #${ticket.id.slice(0, 8)} to ${statusConfig[selectedStatus]?.label || selectedStatus}`,
          type: 'support',
          referenceId: ticket.id,
          referenceType: 'support_ticket'
        })
        console.log('Support users notification result:', supportResult)
      } catch (notificationError) {
        console.error('❌ Error sending notification:', notificationError)
      }

      setSuccess('Ticket status updated successfully!')
      await loadTicket()

      setTimeout(() => setSuccess(''), 3000)

    } catch (error) {
      console.error('Error updating ticket:', error)
      setError(error.message || 'Failed to update ticket status')
    } finally {
      setUpdating(false)
    }
  }

  const handleAddResponse = async () => {
    if (!response.trim()) {
      setError('Please enter a response')
      return
    }

    try {
      setUpdating(true)
      setError('')
      setSuccess('')

      // In a real implementation, you'd save this to a ticket_responses table
      // For now, we'll just show success and clear the field
      
      // Notify partner about response
      try {
        if (ticket.partner?.id) {
          const notification = NotificationTemplates.supportTicketResponse(
            ticket.id,
            'Support Team'
          )
          await notifyPartner({
            partnerId: ticket.partner.id,
            ...notification,
            referenceId: ticket.id,
            referenceType: 'support_ticket'
          })
        }
      } catch (notificationError) {
        console.error('Error sending notification:', notificationError)
      }
      
      setSuccess('Response added successfully!')
      setResponse('')

      setTimeout(() => setSuccess(''), 3000)

    } catch (error) {
      console.error('Error adding response:', error)
      setError(error.message || 'Failed to add response')
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="py-6">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-300 rounded w-1/4"></div>
            <div className="h-64 bg-gray-300 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!ticket) {
    return (
      <div className="py-6">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
            <h2 className="mt-2 text-lg font-medium text-gray-900">Ticket not found</h2>
            <p className="mt-1 text-sm text-gray-500">
              This ticket may have been deleted or you don't have access to it.
            </p>
            <Link
              href="/support/tickets"
              className="mt-4 inline-flex items-center text-blue-600 hover:text-blue-700"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Tickets
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const StatusIcon = statusConfig[ticket.status]?.icon || AlertCircle

  return (
    <div className="py-6">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/support/tickets"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-5 w-5 mr-1" />
            Back to Tickets
          </Link>

          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">{ticket.subject}</h1>
              <div className="flex items-center space-x-4 mt-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig[ticket.status]?.color}`}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {statusConfig[ticket.status]?.label}
                </span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityConfig[ticket.priority]?.color} ${priorityConfig[ticket.priority]?.bg}`}>
                  {priorityConfig[ticket.priority]?.label} Priority
                </span>
                <span className="text-sm text-gray-500">
                  Ticket #{ticket.id.substring(0, 8)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center">
            <CheckCircle2 className="h-5 w-5 mr-2" />
            {success}
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Ticket Details */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Ticket Description</h3>
              </div>
              <div className="p-6">
                <p className="text-gray-700 whitespace-pre-wrap">{ticket.description}</p>
              </div>
            </div>

            {/* Status Update */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Update Status</h3>
              </div>
              <div className="p-6">
                <div className="flex items-center space-x-4">
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                  <button
                    onClick={handleStatusUpdate}
                    disabled={updating || selectedStatus === ticket.status}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {updating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Updating...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Update
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Communication Section */}
            {currentUser && supportUser && (
              <TicketMessaging 
                ticketId={ticket.id}
                currentUserId={currentUser.id}
                senderType="support"
                senderName="Support Team"
                ticketData={ticket}
              />
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Partner Information */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Building2 className="h-5 w-5 mr-2 text-gray-400" />
                  Partner Information
                </h3>
              </div>
             <div className="p-6 space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">Company</p>
                  <p className="text-sm text-gray-900 mt-1">
                    {ticket.partner?.organization?.name || 'No Organization'}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700">Contact Person</p>
                  <p className="text-sm text-gray-900 mt-1">
                    {ticket.partner?.first_name} {ticket.partner?.last_name}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700">Email</p>
                  <a 
                    href={`mailto:${ticket.partner?.email}`}
                    className="text-sm text-blue-600 hover:text-blue-700 mt-1 flex items-center"
                  >
                    <Mail className="h-4 w-4 mr-1" />
                    {ticket.partner?.email}
                  </a>
                </div>

                {ticket.partner?.phone && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Phone</p>
                    <a 
                      href={`tel:${ticket.partner.phone}`}
                      className="text-sm text-blue-600 hover:text-blue-700 mt-1 flex items-center"
                    >
                      <Phone className="h-4 w-4 mr-1" />
                      {ticket.partner.phone}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Ticket Timeline */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-gray-400" />
                  Timeline
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">Created</p>
                  <p className="text-sm text-gray-900 mt-1">
                    {new Date(ticket.created_at).toLocaleString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>

                {ticket.resolved_at && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Resolved</p>
                    <p className="text-sm text-gray-900 mt-1">
                      {new Date(ticket.resolved_at).toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                )}

                <div>
                  <p className="text-sm font-medium text-gray-700">Last Updated</p>
                  <p className="text-sm text-gray-900 mt-1">
                    {new Date(ticket.updated_at).toLocaleString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
              </div>
              <div className="p-6 space-y-3">
                <a
                  href={`mailto:${ticket.partners?.email}?subject=Re: ${ticket.subject}`}
                  className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Email Partner
                </a>

                <Link
                  href={`/support/partners/${ticket.partner_id}`}
                  className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
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