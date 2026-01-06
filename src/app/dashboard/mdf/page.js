// src/app/dashboard/mdf/page.js
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { 
  Plus, Search, Filter, Calendar, DollarSign, TrendingUp,
  CheckCircle, Clock, XCircle, Eye, BarChart3, Target,
  AlertCircle, Award, ChevronDown, AlertTriangle
} from 'lucide-react'

export default function MDFPage() {
  const [mdfRequests, setMdfRequests] = useState([])
  const [filteredRequests, setFilteredRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState('desc')
  const [showFilters, setShowFilters] = useState(false)
  const [partner, setPartner] = useState(null)

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
      
      // Get current user and partner
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

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

        // Get MDF requests for this partner
        const { data: mdfData, error } = await supabase
          .from('mdf_requests')
          .select('*')
          .eq('partner_id', partnerData.id)
          .order('created_at', { ascending: false })

        if (error) throw error

        setMdfRequests(mdfData || [])
      }
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
        request.campaign_name.toLowerCase().includes(searchTerm.toLowerCase())
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

    return { totalRequests, totalRequested, totalApproved, pendingAmount }
  }

  const stats = calculateStats()
  const mdfAllocation = partner?.organization?.mdf_allocation || 0
  const remainingMDF = Math.max(0, mdfAllocation - stats.totalApproved)
  const utilizationRate = mdfAllocation > 0 ? Math.round((stats.totalApproved / mdfAllocation) * 100) : 0

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
                Manage your Marketing Development Fund requests and campaigns
              </p>
            </div>
            <Link
              href="/dashboard/mdf/new"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Request MDF
            </Link>
          </div>
        </div>

        {/* MDF Allocation Overview */}
        <div className={`${utilizationRate > 100 ? 'bg-gradient-to-r from-red-600 to-orange-600' : 'bg-gradient-to-r from-blue-600 to-purple-600'} rounded-2xl p-8 text-white mb-8`}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">{formatCurrency(mdfAllocation)}</div>
              <div className={`${utilizationRate > 100 ? 'text-orange-100' : 'text-blue-100'}`}>Annual Allocation</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">{formatCurrency(stats.totalApproved)}</div>
              <div className={`${utilizationRate > 100 ? 'text-orange-100' : 'text-blue-100'}`}>Approved Funds</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">{formatCurrency(remainingMDF)}</div>
              <div className={`${utilizationRate > 100 ? 'text-orange-100' : 'text-blue-100'}`}>Remaining Balance</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">{utilizationRate}%</div>
              <div className={`${utilizationRate > 100 ? 'text-orange-100' : 'text-blue-100'}`}>Utilization Rate</div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-6">
            <div className={`flex justify-between text-sm ${utilizationRate > 100 ? 'text-orange-100' : 'text-blue-100'} mb-2`}>
              <span>MDF Utilization</span>
              <span>{utilizationRate}% used</span>
            </div>
            <div className={`w-full ${utilizationRate > 100 ? 'bg-red-800' : 'bg-blue-800'} rounded-full h-2`}>
              <div 
                className={`${utilizationRate > 100 ? 'bg-yellow-300' : 'bg-white'} h-2 rounded-full transition-all duration-300`}
                style={{ width: `${Math.min(utilizationRate, 100)}%` }}
              ></div>
            </div>
          </div>
          
          {/* Over-utilization Warning */}
          {utilizationRate > 100 && (
            <div className="mt-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-4 flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">MDF Allocation Exceeded</p>
                <p className="text-sm text-orange-100 mt-1">
                  You have exceeded your annual MDF allocation by {formatCurrency(Math.abs(remainingMDF))}. 
                  Please contact your partner manager to discuss additional funding or adjust approved campaigns.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.totalRequests}</p>
                <p className="text-sm text-gray-600">Total Requests</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(stats.totalApproved)}
                </p>
                <p className="text-sm text-gray-600">Approved Amount</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(stats.pendingAmount)}
                </p>
                <p className="text-sm text-gray-600">Pending Review</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">
                  {filteredRequests.filter(r => r.status === 'approved').length}
                </p>
                <p className="text-sm text-gray-600">Active Campaigns</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              {/* Search */}
              <div className="relative flex-1 max-w-lg">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search campaigns..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 text-black border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              {/* Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
                <ChevronDown className={`ml-2 h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* Expandable Filters */}
            {showFilters && (
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="block w-full px-3 py-2 text-black border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {statuses.map(status => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="block w-full px-3 py-2 text-black border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="created_at">Created Date</option>
                    <option value="requested_amount">Requested Amount</option>
                    <option value="approved_amount">Approved Amount</option>
                    <option value="campaign_name">Campaign Name</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Order</label>
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    className="block w-full px-3 py-2 text-black border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="desc">Newest First</option>
                    <option value="asc">Oldest First</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* MDF Requests List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {filteredRequests.length === 0 ? (
            <div className="text-center py-12">
              <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {mdfRequests.length === 0 ? 'No MDF requests yet' : 'No requests match your filters'}
              </h3>
              <p className="text-gray-600 mb-6">
                {mdfRequests.length === 0 
                  ? 'Submit your first Marketing Development Fund request to get started.'
                  : 'Try adjusting your search or filter criteria.'
                }
              </p>
              {mdfRequests.length === 0 && (
                <Link
                  href="/dashboard/mdf/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Request Your First MDF
                </Link>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredRequests.map((request) => {
                const StatusIcon = getStatusIcon(request.status)
                return (
                  <div key={request.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-medium text-gray-900 truncate">
                            {request.campaign_name}
                          </h3>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {request.status?.charAt(0).toUpperCase() + request.status?.slice(1)}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-6 text-sm text-gray-600">
                          <div className="flex items-center">
                            <DollarSign className="h-4 w-4 mr-1" />
                            Requested: {formatCurrency(request.requested_amount)}
                          </div>
                          {request.approved_amount && (
                            <div className="flex items-center">
                              <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                              Approved: {formatCurrency(request.approved_amount)}
                            </div>
                          )}
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {new Date(request.created_at).toLocaleDateString()}
                          </div>
                        </div>

                        {/* ROI Metrics */}
                        {request.roi_metrics && Object.keys(request.roi_metrics).length > 0 && (
                          <div className="mt-3 flex items-center space-x-4 text-sm text-gray-600">
                            {request.roi_metrics.leads && (
                              <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-md">
                                {request.roi_metrics.leads} leads
                              </span>
                            )}
                            {request.roi_metrics.meetings && (
                              <span className="bg-green-50 text-green-700 px-2 py-1 rounded-md">
                                {request.roi_metrics.meetings} meetings
                              </span>
                            )}
                            {request.roi_metrics.deals && (
                              <span className="bg-purple-50 text-purple-700 px-2 py-1 rounded-md">
                                {request.roi_metrics.deals} deals
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        <Link
                          href={`/dashboard/mdf/${request.id}`}
                          className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Link>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}