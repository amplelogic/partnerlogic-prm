// src/app/admin/logs/page.js
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  Search, Filter, Download, Calendar, User, Activity,
  ChevronDown, FileText, AlertCircle, CheckCircle, 
  Clock, TrendingUp, Users, Building2, Award
} from 'lucide-react'

export default function AdminLogsPage() {
  const [logs, setLogs] = useState([])
  const [filteredLogs, setFilteredLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  
  // Filter states
  const [activityTypeFilter, setActivityTypeFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [userTypeFilter, setUserTypeFilter] = useState('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const supabase = createClient()

  useEffect(() => {
    loadLogs()
  }, [])

  useEffect(() => {
    filterLogs()
  }, [searchTerm, activityTypeFilter, dateFilter, userTypeFilter, startDate, endDate, logs])

  const loadLogs = async () => {
    try {
      setLoading(true)
      const combinedLogs = []

      // Fetch deal activities
      try {
        const { data: dealActivities, error: dealError } = await supabase
          .from('deal_activities')
          .select(`
            id,
            deal_id,
            user_id,
            activity_type,
            description,
            created_at,
            deals (
              id,
              customer_name,
              customer_company,
              deal_value
            )
          `)
          .order('created_at', { ascending: false })
          .limit(1000)

        if (dealError) {
          console.warn('Error fetching deal activities:', dealError)
        } else if (dealActivities) {
          combinedLogs.push(...dealActivities.map(activity => ({
            id: `deal_${activity.id}`,
            type: 'deal_activity',
            activity_type: activity.activity_type,
            description: activity.description,
            user_id: activity.user_id,
            related_id: activity.deal_id,
            related_name: activity.deals?.customer_name || 'Unknown',
            related_company: activity.deals?.customer_company,
            related_value: activity.deals?.deal_value,
            created_at: activity.created_at,
            user_type: 'partner' // Most deal activities are from partners
          })))
        }
      } catch (err) {
        console.warn('Deal activities table not accessible:', err)
      }

      // Fetch notification activities
      try {
        const { data: notifications, error: notifError } = await supabase
          .from('notifications')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(500)

        if (notifError) {
          console.warn('Error fetching notifications:', notifError)
        } else if (notifications) {
          combinedLogs.push(...notifications.map(notif => ({
            id: `notif_${notif.id}`,
            type: 'notification',
            activity_type: notif.type,
            description: notif.message,
            user_id: notif.user_id,
            related_id: notif.related_id,
            related_name: notif.title,
            created_at: notif.created_at,
            user_type: notif.user_type || 'system'
          })))
        }
      } catch (err) {
        console.warn('Notifications table not accessible:', err)
      }

      // Fetch support ticket activities (optional - may not exist)
      try {
        const { data: ticketMessages, error: ticketError } = await supabase
          .from('support_ticket_messages')
          .select(`
            id,
            ticket_id,
            sender_id,
            sender_type,
            message,
            created_at,
            support_tickets (
              id,
              subject,
              status
            )
          `)
          .order('created_at', { ascending: false })
          .limit(500)

        if (!ticketError && ticketMessages) {
          combinedLogs.push(...ticketMessages.map(msg => ({
            id: `ticket_${msg.id}`,
            type: 'support_ticket',
            activity_type: 'ticket_message',
            description: msg.message?.substring(0, 100) + (msg.message?.length > 100 ? '...' : ''),
            user_id: msg.sender_id,
            related_id: msg.ticket_id,
            related_name: msg.support_tickets?.subject || 'Support Ticket',
            created_at: msg.created_at,
            user_type: msg.sender_type || 'unknown'
          })))
        }
      } catch (err) {
        // Support ticket messages table may not exist - silently skip
        console.info('Support ticket messages not available')
      }

      // Sort by date (newest first)
      combinedLogs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

      setLogs(combinedLogs)
      setFilteredLogs(combinedLogs)
      
      if (combinedLogs.length === 0) {
        console.info('No activity logs found in the database')
      } else {
        console.log(`Loaded ${combinedLogs.length} activity logs`)
      }
    } catch (error) {
      console.error('Error loading logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterLogs = () => {
    let filtered = [...logs]

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(log => 
        log.description?.toLowerCase().includes(term) ||
        log.related_name?.toLowerCase().includes(term) ||
        log.related_company?.toLowerCase().includes(term) ||
        log.activity_type?.toLowerCase().includes(term)
      )
    }

    // Activity type filter
    if (activityTypeFilter !== 'all') {
      filtered = filtered.filter(log => log.type === activityTypeFilter)
    }

    // User type filter
    if (userTypeFilter !== 'all') {
      filtered = filtered.filter(log => log.user_type === userTypeFilter)
    }

    // Date filter
    if (dateFilter !== 'all' && dateFilter !== 'custom') {
      const now = new Date()
      const filterDate = new Date()
      
      switch (dateFilter) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0)
          filtered = filtered.filter(log => new Date(log.created_at) >= filterDate)
          break
        case 'yesterday':
          filterDate.setDate(now.getDate() - 1)
          filterDate.setHours(0, 0, 0, 0)
          const yesterdayEnd = new Date(filterDate)
          yesterdayEnd.setHours(23, 59, 59, 999)
          filtered = filtered.filter(log => {
            const logDate = new Date(log.created_at)
            return logDate >= filterDate && logDate <= yesterdayEnd
          })
          break
        case 'week':
          filterDate.setDate(now.getDate() - 7)
          filtered = filtered.filter(log => new Date(log.created_at) >= filterDate)
          break
        case 'month':
          filterDate.setMonth(now.getMonth() - 1)
          filtered = filtered.filter(log => new Date(log.created_at) >= filterDate)
          break
        case 'quarter':
          filterDate.setMonth(now.getMonth() - 3)
          filtered = filtered.filter(log => new Date(log.created_at) >= filterDate)
          break
      }
    }

    // Custom date range filter
    if (dateFilter === 'custom' && startDate) {
      const start = new Date(startDate)
      start.setHours(0, 0, 0, 0)
      filtered = filtered.filter(log => new Date(log.created_at) >= start)
    }

    if (dateFilter === 'custom' && endDate) {
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999)
      filtered = filtered.filter(log => new Date(log.created_at) <= end)
    }

    setFilteredLogs(filtered)
  }

  const exportToCSV = () => {
    try {
      // Define CSV headers
      const headers = [
        'Date',
        'Time',
        'Activity Type',
        'Type',
        'Description',
        'Related Item',
        'Related Company',
        'User Type'
      ]

      // Convert logs to CSV rows
      const rows = filteredLogs.map(log => [
        new Date(log.created_at).toLocaleDateString(),
        new Date(log.created_at).toLocaleTimeString(),
        log.activity_type || 'N/A',
        log.type || 'N/A',
        `"${(log.description || '').replace(/"/g, '""')}"`, // Escape quotes
        `"${(log.related_name || '').replace(/"/g, '""')}"`,
        `"${(log.related_company || '').replace(/"/g, '""')}"`,
        log.user_type || 'N/A'
      ])

      // Combine headers and rows
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n')

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      
      link.setAttribute('href', url)
      link.setAttribute('download', `activity_logs_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      console.log(`Exported ${filteredLogs.length} logs to CSV`)
    } catch (error) {
      console.error('Error exporting to CSV:', error)
      alert('Failed to export CSV. Please try again.')
    }
  }

  const getActivityIcon = (type) => {
    switch (type) {
      case 'deal_activity':
        return TrendingUp
      case 'notification':
        return AlertCircle
      case 'support_ticket':
        return FileText
      default:
        return Activity
    }
  }

  const getActivityColor = (type) => {
    switch (type) {
      case 'deal_activity':
        return 'bg-blue-100 text-blue-600'
      case 'notification':
        return 'bg-yellow-100 text-yellow-600'
      case 'support_ticket':
        return 'bg-purple-100 text-purple-600'
      default:
        return 'bg-gray-100 text-gray-600'
    }
  }

  const getUserTypeBadge = (userType) => {
    const styles = {
      partner: 'bg-green-100 text-green-800',
      admin: 'bg-red-100 text-red-800',
      support: 'bg-blue-100 text-blue-800',
      system: 'bg-gray-100 text-gray-800',
      partner_manager: 'bg-purple-100 text-purple-800'
    }
    return styles[userType] || styles.system
  }

  if (loading) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/4 mb-6"></div>
            <div className="space-y-4">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
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
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Activity Logs</h1>
              <p className="mt-1 text-sm text-gray-600">
                Track all system activities and user actions
              </p>
            </div>
            <button
              onClick={exportToCSV}
              disabled={filteredLogs.length === 0}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV ({filteredLogs.length})
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Logs</p>
                <p className="text-2xl font-bold text-gray-900">{filteredLogs.length}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Deal Activities</p>
                <p className="text-2xl font-bold text-gray-900">
                  {filteredLogs.filter(l => l.type === 'deal_activity').length}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Notifications</p>
                <p className="text-2xl font-bold text-gray-900">
                  {filteredLogs.filter(l => l.type === 'notification').length}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-yellow-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Support Tickets</p>
                <p className="text-2xl font-bold text-gray-900">
                  {filteredLogs.filter(l => l.type === 'support_ticket' || (l.type === 'notification' || l.activity_type === 'support_ticket_created')).length}
                </p>
              </div>
              <FileText className="h-8 w-8 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search logs by description, name, or activity type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
              <ChevronDown className={`ml-2 h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Activity Type Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Activity Type
                  </label>
                  <select
                    value={activityTypeFilter}
                    onChange={(e) => setActivityTypeFilter(e.target.value)}
                    className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  >
                    <option value="all">All Types</option>
                    <option value="deal_activity">Deal Activities</option>
                    <option value="notification">Notifications</option>
                    <option value="support_ticket">Support Tickets</option>
                  </select>
                </div>

                {/* User Type Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    User Type
                  </label>
                  <select
                    value={userTypeFilter}
                    onChange={(e) => setUserTypeFilter(e.target.value)}
                    className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  >
                    <option value="all">All Users</option>
                    <option value="partner">Partners</option>
                    <option value="admin">Admins</option>
                    <option value="partner_manager">Partner Managers</option>
                    <option value="support">Support</option>
                    <option value="system">System</option>
                  </select>
                </div>

                {/* Date Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date Range
                  </label>
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="yesterday">Yesterday</option>
                    <option value="week">Last 7 Days</option>
                    <option value="month">Last 30 Days</option>
                    <option value="quarter">Last 90 Days</option>
                    <option value="custom">Custom Range</option>
                  </select>
                </div>

                {/* Clear Filters */}
                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setSearchTerm('')
                      setActivityTypeFilter('all')
                      setUserTypeFilter('all')
                      setDateFilter('all')
                      setStartDate('')
                      setEndDate('')
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              {/* Custom Date Range */}
              {dateFilter === 'custom' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="block w-full pl-3 pr-3 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="block w-full pl-3 pr-3 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Logs List */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No logs found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || activityTypeFilter !== 'all' || dateFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'No activity logs available'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Activity Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Related To
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User Type
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredLogs.map((log) => {
                    const Icon = getActivityIcon(log.type)
                    return (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm">
                            <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                            <div>
                              <div className="text-gray-900">
                                {new Date(log.created_at).toLocaleDateString()}
                              </div>
                              <div className="text-gray-500 text-xs">
                                {new Date(log.created_at).toLocaleTimeString()}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActivityColor(log.type)}`}>
                            <Icon className="h-3 w-3 mr-1" />
                            {log.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-md truncate">
                            {log.description}
                          </div>
                          {log.activity_type && (
                            <div className="text-xs text-gray-500 mt-1">
                              {log.activity_type.replace(/_/g, ' ')}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            <div className="text-gray-900 font-medium">
                              {log.related_name}
                            </div>
                            {log.related_company && (
                              <div className="text-gray-500 text-xs">
                                {log.related_company}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getUserTypeBadge(log.user_type)}`}>
                            {log.user_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Results Info */}
        {filteredLogs.length > 0 && (
          <div className="mt-4 text-sm text-gray-600 text-center">
            Showing {filteredLogs.length} of {logs.length} total logs
          </div>
        )}
      </div>
    </div>
  )
}
