'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { 
  Ticket, AlertCircle, CheckCircle, Clock, TrendingUp,
  ArrowRight, User, Building2
} from 'lucide-react'

export default function SupportDashboardPage() {
  const [stats, setStats] = useState({
    totalTickets: 0,
    openTickets: 0,
    inProgressTickets: 0,
    resolvedTickets: 0
  })
  const [recentTickets, setRecentTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [supportUser, setSupportUser] = useState(null)

  const supabase = createClient()

  useEffect(() => {
    loadDashboardData()
  }, [])

const loadDashboardData = async () => {
  try {
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: supportUserData } = await supabase
      .from('support_users')
      .select('*')
      .eq('auth_user_id', user.id)
      .eq('active', true)
      .single()

    if (!supportUserData) return
    setSupportUser(supportUserData)

    // FIXED: Nested join to get organization name
    const { data: ticketsData, error: ticketsError } = await supabase
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
      .eq('type', supportUserData.support_type)
      .order('created_at', { ascending: false })

    console.log('📋 Tickets loaded:', ticketsData)
    console.log('❌ Error:', ticketsError)

    if (ticketsError) {
      console.error('Tickets error:', ticketsError)
    }

    const tickets = ticketsData || []

    setStats({
      totalTickets: tickets.length,
      openTickets: tickets.filter(t => t.status === 'open').length,
      inProgressTickets: tickets.filter(t => t.status === 'in_progress').length,
      resolvedTickets: tickets.filter(t => t.status === 'resolved').length
    })

    setRecentTickets(tickets.slice(0, 5))

  } catch (error) {
    console.error('Error loading dashboard data:', error)
  } finally {
    setLoading(false)
  }
}

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'bg-red-100 text-red-800'
      case 'in_progress': return 'bg-yellow-100 text-yellow-800'
      case 'resolved': return 'bg-green-100 text-green-800'
      case 'closed': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
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

  const getSupportTypeLabel = () => {
    switch (supportUser?.support_type) {
      case 'technical': return 'Technical Support'
      case 'sales': return 'Sales Support'
      case 'presales': return 'Pre-sales Engineering'
      case 'accounts': return 'Account Management'
      default: return 'Support'
    }
  }

  if (loading) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl p-6 border">
                  <div className="h-12 bg-gray-200 rounded mb-4"></div>
                  <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">
            Welcome back, {supportUser?.first_name}!
          </h2>
          <p className="text-gray-600 mt-1">
            You're managing {getSupportTypeLabel()} tickets
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Tickets */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Ticket className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.totalTickets}</p>
                <p className="text-sm text-gray-600">Total Tickets</p>
              </div>
            </div>
            <Link 
              href="/support/tickets"
              className="mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center"
            >
              View All <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </div>

          {/* Open Tickets */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.openTickets}</p>
                <p className="text-sm text-gray-600">Open</p>
              </div>
            </div>
          </div>

          {/* In Progress */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.inProgressTickets}</p>
                <p className="text-sm text-gray-600">In Progress</p>
              </div>
            </div>
          </div>

          {/* Resolved */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.resolvedTickets}</p>
                <p className="text-sm text-gray-600">Resolved</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Tickets */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Recent Tickets</h3>
              <Link 
                href="/support/tickets"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center"
              >
                View all <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {recentTickets.length > 0 ? (
              recentTickets.map((ticket) => (
                <div key={ticket.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-medium text-gray-900 truncate">
                          {ticket.subject}
                        </h4>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                          {ticket.status?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                          {ticket.priority?.charAt(0).toUpperCase() + ticket.priority?.slice(1)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-1">
                        {ticket.description}
                      </p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-1" />
                          {ticket.partner?.first_name} {ticket.partner?.last_name}
                        </div>
                        <div className="flex items-center">
                          <Building2 className="h-4 w-4 mr-1" />
                          {ticket.partner?.organization?.name || 'No Organization'}
                        </div>
                        <div>Created {new Date(ticket.created_at).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <div className="ml-4">
                      <Link
                        href={`/support/tickets/${ticket.id}`}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        View
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center">
                <Ticket className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No tickets yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}