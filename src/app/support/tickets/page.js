'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { 
  Search, Filter, AlertCircle, Clock, CheckCircle2, 
  XCircle, ArrowUpCircle, Ticket, Mail, Building2
} from 'lucide-react'

export default function SupportTicketsPage() {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [supportUser, setSupportUser] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  
  const supabase = createClient()

  const statusConfig = {
    open: { label: 'Open', color: 'bg-blue-100 text-blue-800', icon: AlertCircle },
    in_progress: { label: 'In Progress', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
    resolved: { label: 'Resolved', color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
    closed: { label: 'Closed', color: 'bg-gray-100 text-gray-800', icon: XCircle }
  }

  const priorityConfig = {
    low: { label: 'Low', color: 'text-gray-600' },
    medium: { label: 'Medium', color: 'text-blue-600' },
    high: { label: 'High', color: 'text-orange-600' },
    urgent: { label: 'Urgent', color: 'text-red-600' }
  }

  useEffect(() => {
    loadSupportUser()
  }, [])

  useEffect(() => {
    if (supportUser) {
      loadTickets()
    }
  }, [supportUser])

  const loadSupportUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('support_users')
        .select('*')
        .eq('auth_user_id', user.id)
        .single()

      if (error) throw error
      setSupportUser(data)
    } catch (error) {
      console.error('Error loading support user:', error)
    }
  }

// From src/app/support/tickets/page.js

const loadTickets = async () => {
  try {
    setLoading(true)

    // Support users should see all tickets, or only tickets matching their support_type
    // If support_type is null or undefined, show all tickets
    let query = supabase
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

    // Only filter by type if support user has a specific type
    if (supportUser.support_type) {
      query = query.eq('type', supportUser.support_type)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    console.log('📋 Support Type:', supportUser.support_type)
    console.log('📋 Tickets loaded:', data?.length)
    console.log('❌ Error:', error)

    if (error) throw error
    setTickets(data || [])
  } catch (error) {
    console.error('Error loading tickets:', error)
  } finally {
    setLoading(false)
  }
}

const filteredTickets = tickets.filter(ticket => {
  const matchesSearch = 
    ticket.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.partner?.organization?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.partner?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.partner?.last_name?.toLowerCase().includes(searchTerm.toLowerCase())

  const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter
  const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter

  return matchesSearch && matchesStatus && matchesPriority
})

  const stats = {
    total: filteredTickets.length,
    open: filteredTickets.filter(t => t.status === 'open').length,
    in_progress: filteredTickets.filter(t => t.status === 'in_progress').length,
    resolved: filteredTickets.filter(t => t.status === 'resolved').length
  }

  if (loading) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-300 rounded w-1/4"></div>
            <div className="h-32 bg-gray-300 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Support Tickets</h1>
          <p className="text-gray-600 mt-1">
            Manage and respond to {supportUser?.support_type} support requests
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Tickets</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
              </div>
              <Ticket className="h-10 w-10 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Open</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{stats.open}</p>
              </div>
              <AlertCircle className="h-10 w-10 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.in_progress}</p>
              </div>
              <Clock className="h-10 w-10 text-yellow-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Resolved</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{stats.resolved}</p>
              </div>
              <CheckCircle2 className="h-10 w-10 text-green-500" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search tickets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Statuses</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            {/* Priority Filter */}
            <div>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tickets List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {filteredTickets.length === 0 ? (
            <div className="text-center py-12">
              <Ticket className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No tickets found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'No support tickets assigned yet'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ticket
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Partner
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Priority
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTickets.map((ticket) => {
                    const StatusIcon = statusConfig[ticket.status]?.icon || AlertCircle
                    return (
                      <tr key={ticket.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-start">
                            <Ticket className="h-5 w-5 text-gray-400 mt-0.5 mr-3 flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {ticket.subject}
                              </p>
                              <p className="text-sm text-gray-500 truncate mt-1">
                                {ticket.description.substring(0, 20)}...
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Building2 className="h-5 w-5 text-gray-400 mr-2" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {ticket.partner?.organization?.name || 'No Organization'}
                              </p>
                              <p className="text-sm text-gray-500">
                                {ticket.partner?.first_name} {ticket.partner?.last_name}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-sm font-medium ${priorityConfig[ticket.priority]?.color}`}>
                            {priorityConfig[ticket.priority]?.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig[ticket.status]?.color}`}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusConfig[ticket.status]?.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(ticket.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Link
                            href={`/support/tickets/${ticket.id}`}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            View Details
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}