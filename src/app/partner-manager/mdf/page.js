// src/app/partner-manager/mdf/page.js
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { 
  Search, Filter, Calendar, DollarSign, TrendingUp,
  CheckCircle, Clock, XCircle, Eye, BarChart3, AlertCircle,
  ChevronDown, Building2, User
} from 'lucide-react'

export default function PartnerManagerMDFPage() {
  const [mdfRequests, setMdfRequests] = useState([])
  const [filteredRequests, setFilteredRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState('desc')
  const [showFilters, setShowFilters] = useState(false)
  const [partnerManager, setPartnerManager] = useState(null)

  const supabase = createClient()

  const statuses = [
    { value: 'all', label: 'All Requests', color: 'bg-gray-100 text-gray-800' },
    { value: 'pending', label: 'Pending Review', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'approved', label: 'Approved', color: 'bg-green-100 text-green-800' },
    { value: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-800' },
    { value: 'disbursed', label: 'Disbursed', color: 'bg-blue-100 text-blue-800' }
  ]

  useEffect(() => {
    loadMDFRequests()
  }, [])

  useEffect(() => {
    filterAndSortRequests()
  }, [mdfRequests, searchTerm, statusFilter, sortBy, sortOrder])

  const loadMDFRequests = async () => {
    try {
      setLoading(true)

      // Get current user and partner manager
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: pmData } = await supabase
        .from('partner_managers')
        .select('*')
        .eq('auth_user_id', user.id)
        .single()

      if (!pmData) return

      setPartnerManager(pmData)

      // Get partners assigned to this manager
      const { data: partnersData } = await supabase
        .from('partners')
        .select('id')
        .eq('partner_manager_id', pmData.id)

      const partnerIds = partnersData?.map(p => p.id) || []

      if (partnerIds.length === 0) {
        setMdfRequests([])
        setLoading(false)
        return
      }

      // Get MDF requests for assigned partners
      const { data: mdfData, error } = await supabase
        .from('mdf_requests')
        .select(`
          *,
          partner:partners(
            id,
            first_name,
            last_name,
            email,
            organization:organizations(
              id,
              name,
              tier,
              mdf_allocation
            )
          )
        `)
        .in('partner_id', partnerIds)
        .order('created_at', { ascending: false })

      if (error) throw error

      setMdfRequests(mdfData || [])
    } catch (error) {
      console.error('Error loading MDF requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterAndSortRequests = () => {
    let filtered = [...mdfRequests]

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(request =>
        request.campaign_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.partner?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.partner?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.partner?.organization?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(request => request.status === statusFilter)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue = a[sortBy]
      let bValue = b[sortBy]

      if (sortBy === 'created_at' || sortBy === 'approved_at') {
        aValue = new Date(aValue || 0)
        bValue = new Date(bValue || 0)
      }

      if (sortBy === 'requested_amount' || sortBy === 'approved_amount') {
        aValue = aValue || 0
        bValue = bValue || 0
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
      return 0
    })

    setFilteredRequests(filtered)
  }

  const getStatusColor = (status) => {
    const statusConfig = statuses.find(s => s.value === status)
    return statusConfig ? statusConfig.color : 'bg-gray-100 text-gray-800'
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return Clock
      case 'approved': return CheckCircle
      case 'rejected': return XCircle
      case 'disbursed': return DollarSign
      default: return AlertCircle
    }
  }

  const calculateStats = () => {
    const total = filteredRequests.length
    const pending = filteredRequests.filter(r => r.status === 'pending').length
    const approved = filteredRequests.filter(r => r.status === 'approved' || r.status === 'disbursed').length
    const totalRequested = filteredRequests.reduce((sum, r) => sum + (r.requested_amount || 0), 0)
    const totalApproved = filteredRequests.reduce((sum, r) => sum + (r.approved_amount || 0), 0)

    return { total, pending, approved, totalRequested, totalApproved }
  }

  const stats = calculateStats()

  if (loading) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/3 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
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
          <h1 className="text-2xl font-bold text-gray-900">Partner MDF Requests</h1>
          <p className="mt-1 text-sm text-gray-600">
            View and track MDF requests from your assigned partners
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Requests</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Approved</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${stats.totalApproved.toLocaleString()}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-500" />
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
                placeholder="Search by campaign name, partner, or organization..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
              <ChevronDown className={`ml-2 h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  >
                    {statuses.map(status => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sort By
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  >
                    <option value="created_at">Date Created</option>
                    <option value="requested_amount">Requested Amount</option>
                    <option value="approved_amount">Approved Amount</option>
                    <option value="approved_at">Approval Date</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Order
                  </label>
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  >
                    <option value="desc">Descending</option>
                    <option value="asc">Ascending</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* MDF Requests List */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
          {filteredRequests.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No MDF Requests</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || statusFilter !== 'all'
                  ? 'No requests match your filters'
                  : 'Your partners haven\'t submitted any MDF requests yet'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Partner / Campaign
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Requested
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Approved
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRequests.map((request) => {
                    const StatusIcon = getStatusIcon(request.status)
                    return (
                      <tr key={request.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="flex-shrink-0">
                              <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                                <User className="h-5 w-5 text-white" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {request.partner?.first_name} {request.partner?.last_name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {request.campaign_name}
                              </div>
                              <div className="text-xs text-gray-400">
                                {request.partner?.organization?.name}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            ${request.requested_amount?.toLocaleString() || 0}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {request.approved_amount
                              ? `$${request.approved_amount.toLocaleString()}`
                              : '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {request.status?.charAt(0).toUpperCase() + request.status?.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(request.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Link
                            href={`/partner-manager/mdf/${request.id}`}
                            className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
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

        {/* Results Info */}
        {filteredRequests.length > 0 && (
          <div className="mt-4 text-sm text-gray-600 text-center">
            Showing {filteredRequests.length} of {mdfRequests.length} MDF requests
          </div>
        )}
      </div>
    </div>
  )
}
