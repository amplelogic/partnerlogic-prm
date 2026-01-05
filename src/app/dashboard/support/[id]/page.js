// src/app/dashboard/support/[id]/page.js
'use client'

import { useState, useEffect, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, MessageSquare, Calendar, User, Tag, Clock,
  AlertCircle, CheckCircle, RefreshCw, Send, Paperclip,
  Headphones, Wrench, Users, FileText, Eye
} from 'lucide-react'
import TicketMessaging from '@/components/TicketMessaging'

export default function SupportTicketDetailsPage({ params }) {
  const unwrappedParams = use(params)
  const [ticket, setTicket] = useState(null)
  const [partner, setPartner] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)
  const [relatedDeal, setRelatedDeal] = useState(null)
  const [loading, setLoading] = useState(true)
  
  const router = useRouter()
  const supabase = createClient()

  const ticketTypes = [
    { value: 'technical', label: 'Technical Support', icon: Wrench },
    { value: 'sales', label: 'Sales Support', icon: Users },
    { value: 'presales', label: 'Pre-sales Engineering', icon: FileText },
    { value: 'accounts', label: 'Account Management', icon: Users }
  ]

  const ticketStatuses = [
    { 
      value: 'open', 
      label: 'Open', 
      color: 'bg-red-100 text-red-800',
      description: 'Ticket has been created and is awaiting response'
    },
    { 
      value: 'in_progress', 
      label: 'In Progress', 
      color: 'bg-yellow-100 text-yellow-800',
      description: 'Our team is actively working on your request'
    },
    { 
      value: 'resolved', 
      label: 'Resolved', 
      color: 'bg-green-100 text-green-800',
      description: 'Issue has been resolved, awaiting confirmation'
    },
    { 
      value: 'closed', 
      label: 'Closed', 
      color: 'bg-gray-100 text-gray-800',
      description: 'Ticket has been closed and resolved'
    }
  ]

  useEffect(() => {
    if (unwrappedParams.id) {
      loadTicketDetails()
    }
  }, [unwrappedParams.id])

  const loadTicketDetails = async () => {
    try {
      setLoading(true)
      
      // Get current user and partner
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      setCurrentUser(user)

      const { data: partnerData } = await supabase
        .from('partners')
        .select(`
          *,
          organization:organizations(*)
        `)
        .eq('auth_user_id', user.id)
        .single()

      if (partnerData) {
        setPartner(partnerData)

        // Get ticket details
        const { data: ticketData, error: ticketError } = await supabase
          .from('support_tickets')
          .select('*')
          .eq('id', unwrappedParams.id)
          .eq('partner_id', partnerData.id)
          .single()

        if (ticketError) {
          if (ticketError.code === 'PGRST116') {
            // Ticket not found
            router.push('/dashboard/support')
            return
          }
          throw ticketError
        }

        setTicket(ticketData)

        // Get related deal if exists
        if (ticketData.deal_id) {
          const { data: dealData } = await supabase
            .from('deals')
            .select('id, customer_name, customer_company, stage, deal_value')
            .eq('id', ticketData.deal_id)
            .single()

          if (dealData) {
            setRelatedDeal(dealData)
          }
        }
      }
    } catch (error) {
      console.error('Error loading ticket details:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTypeInfo = (type) => {
    return ticketTypes.find(t => t.value === type) || ticketTypes[0]
  }

  const getStatusInfo = (status) => {
    return ticketStatuses.find(s => s.value === status) || ticketStatuses[0]
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

  const formatCurrency = (amount) => {
    if (!amount) return '$0'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const calculateResponseTime = () => {
    if (!ticket) return null
    
    const created = new Date(ticket.created_at)
    const now = new Date()
    const hoursDiff = Math.floor((now - created) / (1000 * 60 * 60))
    
    if (hoursDiff < 1) return 'Less than 1 hour ago'
    if (hoursDiff < 24) return `${hoursDiff} hour${hoursDiff > 1 ? 's' : ''} ago`
    
    const daysDiff = Math.floor(hoursDiff / 24)
    return `${daysDiff} day${daysDiff > 1 ? 's' : ''} ago`
  }

  if (loading) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/3 mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="bg-white rounded-xl p-6 mb-6">
                  <div className="h-6 bg-gray-200 rounded mb-4"></div>
                  <div className="space-y-4">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="h-4 bg-gray-200 rounded w-3/4"></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
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
            <p className="text-gray-600 mb-6">The support ticket you're looking for doesn't exist or you don't have access to it.</p>
            <Link
              href="/dashboard/support"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Support
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const typeInfo = getTypeInfo(ticket.type)
  const statusInfo = getStatusInfo(ticket.status)

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Link
              href="/dashboard/support"
              className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-1" />
              Back to Support
            </Link>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{ticket.subject}</h1>
              <p className="text-gray-600">Ticket #{ticket.id.slice(0, 8)}</p>
            </div>
            <div className="flex items-center space-x-3">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}>
                {ticket.status === 'open' && <AlertCircle className="h-4 w-4 mr-1" />}
                {ticket.status === 'in_progress' && <RefreshCw className="h-4 w-4 mr-1" />}
                {ticket.status === 'resolved' && <CheckCircle className="h-4 w-4 mr-1" />}
                {ticket.status === 'closed' && <CheckCircle className="h-4 w-4 mr-1" />}
                {statusInfo.label}
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
            {/* Description Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Description</h2>
              </div>
              <div className="p-6">
                {ticket.description ? (
                  <div className="prose prose-sm max-w-none text-gray-700">
                    <p className="whitespace-pre-wrap">{ticket.description}</p>
                  </div>
                ) : (
                  <p className="text-gray-500 italic">No description provided.</p>
                )}
              </div>
            </div>

            {/* Communication Section */}
            {currentUser && partner && (
              <TicketMessaging 
                ticketId={ticket.id}
                currentUserId={currentUser.id}
                senderType="partner"
                senderName={`${partner.first_name} ${partner.last_name}`}
                ticketData={ticket}
              />
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Ticket Information */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Ticket Information</h2>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Status</span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                    {statusInfo.label}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Type</span>
                  <div className="flex items-center space-x-1">
                    <typeInfo.icon className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-900">{typeInfo.label}</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Priority</span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                    {ticket.priority?.charAt(0).toUpperCase() + ticket.priority?.slice(1)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Created</span>
                  <span className="text-sm font-medium text-gray-900">
                    {new Date(ticket.created_at).toLocaleDateString()}
                  </span>
                </div>

                {ticket.resolved_at && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Resolved</span>
                    <span className="text-sm font-medium text-gray-900">
                      {new Date(ticket.resolved_at).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Status Description */}
            <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  {statusInfo.value === 'open' && <AlertCircle className="h-5 w-5 text-blue-400" />}
                  {statusInfo.value === 'in_progress' && <RefreshCw className="h-5 w-5 text-blue-400" />}
                  {statusInfo.value === 'resolved' && <CheckCircle className="h-5 w-5 text-blue-400" />}
                  {statusInfo.value === 'closed' && <CheckCircle className="h-5 w-5 text-blue-400" />}
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">Current Status</h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>{statusInfo.description}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Related Deal */}
            {relatedDeal && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Related Deal</h2>
                </div>
                
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-medium text-gray-900">{relatedDeal.customer_name}</h3>
                      <p className="text-sm text-gray-600">{relatedDeal.customer_company}</p>
                    </div>
                    <Link
                      href={`/dashboard/deals/${relatedDeal.id}`}
                      className="inline-flex items-center px-2 py-1 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Link>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Value</span>
                      <span className="font-medium">{formatCurrency(relatedDeal.deal_value)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Stage</span>
                      <span className="font-medium capitalize">{relatedDeal.stage?.replace('_', ' ')}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Partner Information */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Your Information</h2>
              </div>
              
              <div className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {partner?.first_name} {partner?.last_name}
                    </p>
                    <p className="text-sm text-gray-600">{partner?.organization?.name}</p>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Partner Type</span>
                    <span className="font-medium capitalize text-black">{partner?.organization?.type?.replace('_', ' ')}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tier</span>
                    <span className={`font-medium px-2 py-1 rounded-full text-xs ${
                      partner?.organization?.tier === 'platinum' ? 'bg-purple-100 text-purple-800' :
                      partner?.organization?.tier === 'gold' ? 'bg-yellow-100 text-yellow-800' :
                      partner?.organization?.tier === 'silver' ? 'bg-gray-100 text-gray-800' :
                      'bg-orange-100 text-orange-800'
                    }`}>
                      {partner?.organization?.tier?.charAt(0).toUpperCase() + partner?.organization?.tier?.slice(1)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email</span>
                    <span className="font-medium text-black">{partner?.email}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
              </div>
              
              <div className="p-6 space-y-3">
                <Link
                  href="/dashboard/support/new"
                  className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Create New Ticket
                </Link>
                
                <Link
                  href="/dashboard/support"
                  className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  All Tickets
                </Link>
              </div>
            </div>

            {/* Help Resources */}
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Need More Help?</h3>
              <div className="space-y-2 text-sm">
                <Link href="/dashboard/knowledge" className="text-blue-600 hover:text-blue-700 block">
                  Browse Knowledge Base →
                </Link>
                <Link href="/dashboard/deals" className="text-blue-600 hover:text-blue-700 block">
                  View Your Deals →
                </Link>
                <a href="mailto:support@amplelogic.com" className="text-blue-600 hover:text-blue-700 block">
                  Email Direct Support →
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}