// src/app/admin/mdf/page.js
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { 
  Search, Filter, Calendar, DollarSign, TrendingUp,
  CheckCircle, Clock, XCircle, Eye, BarChart3, AlertCircle,
  ChevronDown, ChevronUp, Building2, User, FileText
} from 'lucide-react'

export default function AdminMDFPage() {
  const [mdfRequests, setMdfRequests] = useState([])
  const [filteredRequests, setFilteredRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState('desc')
  const [showFilters, setShowFilters] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(null)

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

      // Get all MDF requests with partner and organization data
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

  const handleStatusUpdate = async (requestId, newStatus, approvedAmount = null) => {
    try {
      setUpdatingStatus(requestId)

      // Validate MDF allocation before approval
      if (newStatus === 'approved') {
        const request = requests.find(r => r.id === requestId)
        if (request && request.status !== 'approved') {
          const partnerOrg = request.partner?.organization
          const mdfAllocation = partnerOrg?.mdf_allocation || 0
          
          // Get current approved amount for this partner
          const { data: existingRequests } = await supabase
            .from('mdf_requests')
            .select('approved_amount')
            .eq('partner_id', request.partner_id)
            .in('status', ['approved', 'disbursed'])
            .neq('id', requestId)
          
          const currentApproved = (existingRequests || []).reduce(
            (sum, req) => sum + (req.approved_amount || 0), 0
          )
          const newApprovedAmount = approvedAmount !== null ? approvedAmount : request.requested_amount
          const totalAfterApproval = currentApproved + newApprovedAmount
          
          if (totalAfterApproval > mdfAllocation) {
            const remaining = mdfAllocation - currentApproved
            alert(
              `Cannot approve this request. This would exceed the partner's MDF allocation.\n\n` +
              `Partner: ${partnerOrg?.name}\n` +
              `Annual Allocation: $${mdfAllocation.toLocaleString()}\n` +
              `Currently Approved: $${currentApproved.toLocaleString()}\n` +
              `Available: $${remaining.toLocaleString()}\n` +
              `Requested Approval: $${newApprovedAmount.toLocaleString()}\n\n` +
              `Please approve a partial amount up to $${remaining.toLocaleString()} or navigate to the request detail page.`
            )
            setUpdatingStatus(null)
            return
          }
        }
      }

      const updateData = {
        status: newStatus,
        ...(newStatus === 'approved' && { approved_at: new Date().toISOString() }),
        ...(approvedAmount !== null && { approved_amount: approvedAmount })
      }

      const { error } = await supabase
        .from('mdf_requests')
        .update(updateData)
        .eq('id', requestId)

      if (error) throw error

      // Reload requests
      await loadMDFRequests()
    } catch (error) {
      console.error('Error updating MDF request:', error)
      alert('Failed to update MDF request status')
    } finally {
      setUpdatingStatus(null)
    }
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

  const formatCurrency = (amount) => {
    if (!amount) return '$0'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const calculateStats = () => {
    const totalRequests = filteredRequests.length
    const totalRequested = filteredRequests.reduce((sum, req) => sum + (req.requested_amount || 0), 0)
    const totalApproved = filteredRequests
      .filter(req => req.status === 'approved' || req.status === 'disbursed')
      .reduce((sum, req) => sum + (req.approved_amount || 0), 0)
    const pendingAmount = filteredRequests
      .filter(req => req.status === 'pending')
      .reduce((sum, req) => sum + (req.requested_amount || 0), 0)
    const pendingCount = filteredRequests.filter(req => req.status === 'pending').length

    return { totalRequests, totalRequested, totalApproved, pendingAmount, pendingCount }
  }

  const stats = calculateStats()

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
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">MDF Management</h1>
              <p className="text-gray-600 mt-1">
                Review and manage Marketing Development Fund requests from partners
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Requests</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalRequests}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Pending Review</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pendingCount}</p>
                <p className="text-xs text-gray-500 mt-1">{formatCurrency(stats.pendingAmount)}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Requested</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalRequested)}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Approved</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalApproved)}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              {/* Search */}
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search campaigns, partners, organizations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2">
                {statuses.map((status) => (
                  <button
                    key={status.value}
                    onClick={() => setStatusFilter(status.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      statusFilter === status.value
                        ? status.color
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {status.label}
                    {status.value !== 'all' && (
                      <span className="ml-2 text-xs">
                        ({mdfRequests.filter(r => r.status === status.value).length})
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Toggle Filters */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {showFilters ? <ChevronUp className="h-4 w-4 ml-2" /> : <ChevronDown className="h-4 w-4 ml-2" />}
              </button>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="created_at">Date Created</option>
                      <option value="requested_amount">Requested Amount</option>
                      <option value="approved_amount">Approved Amount</option>
                      <option value="status">Status</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Order</label>
                    <select
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="desc">Descending</option>
                      <option value="asc">Ascending</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* MDF Requests List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {filteredRequests.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Campaign
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Partner
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRequests.map((request) => {
                    const StatusIcon = getStatusIcon(request.status)
                    return (
                      <tr key={request.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                              <FileText className="h-5 w-5 text-white" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {request.campaign_name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {request.campaign_type?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            <div className="font-medium text-gray-900">
                              {request.partner?.first_name} {request.partner?.last_name}
                            </div>
                            <div className="text-gray-500 flex items-center mt-1">
                              <Building2 className="h-3 w-3 mr-1" />
                              {request.partner?.organization?.name}
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              Tier: {request.partner?.organization?.tier?.charAt(0).toUpperCase() + request.partner?.organization?.tier?.slice(1)}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {formatCurrency(request.requested_amount)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-green-600">
                            {request.approved_amount ? formatCurrency(request.approved_amount) : '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {request.status?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {new Date(request.created_at).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <Link
                            href={`/admin/mdf/${request.id}`}
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
          ) : (
            <div className="text-center py-12">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No MDF Requests Found</h3>
              <p className="text-gray-600">
                {searchTerm || statusFilter !== 'all'
                  ? 'Try adjusting your filters or search term'
                  : 'MDF requests from partners will appear here'}
              </p>
            </div>
          )}
        </div>

        {/* Results Count */}
        {filteredRequests.length > 0 && (
          <div className="mt-4 text-sm text-gray-600">
            Showing {filteredRequests.length} of {mdfRequests.length} request{mdfRequests.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  )
}
