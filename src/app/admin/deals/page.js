// src/app/admin/deals/page.js
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { 
  Search, Filter, Eye, DollarSign, Calendar, User,
  Building2, ChevronDown, BarChart3, TrendingUp, LayoutGrid, List, Download, Plus, Trash2
} from 'lucide-react'
import { CURRENCIES } from '@/lib/currencyUtils'


// Dynamically import Kanban to avoid SSR issues with drag-and-drop
const AdminKanbanView = dynamic(() => import('./admin-kanban-view'), { ssr: false })

export default function AdminAllDealsPage() {
  const [deals, setDeals] = useState([])
  const [filteredDeals, setFilteredDeals] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [stageFilter, setStageFilter] = useState('all')
  const [partnerFilter, setPartnerFilter] = useState('all')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState('desc')
  const [showFilters, setShowFilters] = useState(false)
  const [partners, setPartners] = useState([])
  const [viewMode, setViewMode] = useState('kanban') // 'list' or 'kanban'
  const [deletingDeal, setDeletingDeal] = useState(null)

  const supabase = createClient()

  const handleDeleteDeal = async (dealId, customerName) => {
    if (!confirm(`Are you sure you want to delete the deal for "${customerName}"? This action cannot be undone.`)) {
      return
    }

    try {
      setDeletingDeal(dealId)

      const { error } = await supabase
        .from('deals')
        .delete()
        .eq('id', dealId)

      if (error) throw error

      // Reload deals after deletion
      await loadDeals()
      alert('Deal deleted successfully')
    } catch (error) {
      console.error('Error deleting deal:', error)
      alert('Failed to delete deal. Please try again.')
    } finally {
      setDeletingDeal(null)
    }
  }

  const stages = [
    { value: 'all', label: 'All Stages', color: 'bg-gray-100 text-gray-800' },
    { value: 'new_deal', label: 'New Deal', color: 'bg-gray-100 text-gray-800' },
    { value: 'need_analysis', label: 'Need Analysis', color: 'bg-blue-100 text-blue-800' },
    { value: 'proposal', label: 'Proposal', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'negotiation', label: 'Negotiation', color: 'bg-purple-100 text-purple-800' },
    { value: 'closed_won', label: 'Closed Won', color: 'bg-green-100 text-green-800' },
    { value: 'closed_lost', label: 'Closed Lost', color: 'bg-red-100 text-red-800' },
    { value: 'urs', label: 'URS', color: 'bg-cyan-100 text-cyan-800' },
    { value: 'base_deployment', label: 'Base Deployment', color: 'bg-indigo-100 text-indigo-800' },
    { value: 'gap_assessment', label: 'Gap Assessment', color: 'bg-pink-100 text-pink-800' },
    { value: 'development', label: 'Development', color: 'bg-orange-100 text-orange-800' },
    { value: 'uat', label: 'UAT', color: 'bg-teal-100 text-teal-800' },
    { value: 'iq', label: 'IQ', color: 'bg-lime-100 text-lime-800' },
    { value: 'oq', label: 'OQ', color: 'bg-amber-100 text-amber-800' },
    { value: 'deployment', label: 'Deployment', color: 'bg-emerald-100 text-emerald-800' },
    { value: 'pq', label: 'PQ', color: 'bg-violet-100 text-violet-800' },
    { value: 'live', label: 'LIVE', color: 'bg-green-200 text-green-800' }
  ]

  useEffect(() => {
    loadDeals()
    loadPartners()
  }, [])

  useEffect(() => {
    filterAndSortDeals()
  }, [deals, searchTerm, stageFilter, partnerFilter, sortBy, sortOrder])

  const loadDeals = async () => {
    try {
      setLoading(true)
      
      const { data: dealsData, error } = await supabase
        .from('deals')
        .select(`
          *,
          partner:partners(
            id,
            first_name,
            last_name,
            email,
            organization:organizations(
              name,
              tier,
              type
            )
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Ensure admin_stage has a default value if null
      const dealsWithAdminStage = (dealsData || []).map(deal => ({
        ...deal,
        admin_stage: deal.admin_stage || 'urs'
      }))

      setDeals(dealsWithAdminStage)
    } catch (error) {
      console.error('Error loading deals:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadPartners = async () => {
    try {
      const { data: partnersData } = await supabase
        .from('partners')
        .select(`
          id,
          first_name,
          last_name,
          organization:organizations(name)
        `)
        .order('first_name', { ascending: true })

      setPartners(partnersData || [])
    } catch (error) {
      console.error('Error loading partners:', error)
    }
  }

  const filterAndSortDeals = () => {
    let filtered = [...deals]

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(deal =>
        deal.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deal.customer_company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deal.customer_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deal.partner?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deal.partner?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deal.partner?.organization?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply stage filter
    if (stageFilter !== 'all') {
      filtered = filtered.filter(deal => deal.stage === stageFilter)
    }

    // Apply partner filter
    if (partnerFilter !== 'all') {
      filtered = filtered.filter(deal => deal.partner_id === partnerFilter)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue = a[sortBy]
      let bValue = b[sortBy]

      if (sortBy === 'deal_value') {
        aValue = aValue || 0
        bValue = bValue || 0
      }

      if (sortBy === 'created_at' || sortBy === 'updated_at') {
        aValue = new Date(aValue)
        bValue = new Date(bValue)
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
      return 0
    })

    setFilteredDeals(filtered)
  }

  const getStageColor = (stage) => {
    const stageConfig = stages.find(s => s.value === stage)
    return stageConfig ? stageConfig.color : 'bg-gray-100 text-gray-800'
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

const formatCurrency = (amount, currencyCode = 'USD') => {
  if (!amount) return `${CURRENCIES[currencyCode]?.symbol || '$'}0`
  
  const currency = CURRENCIES[currencyCode] || CURRENCIES.USD
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.code,
    minimumFractionDigits: 0
  }).format(amount)
}

  const calculateStats = () => {
    const totalDeals = filteredDeals.length
    const totalValue = filteredDeals.reduce((sum, deal) => sum + (deal.deal_value || 0), 0)
    const wonDeals = filteredDeals.filter(deal => deal.stage === 'closed_won').length
    const winRate = totalDeals > 0 ? Math.round((wonDeals / totalDeals) * 100) : 0

    return { totalDeals, totalValue, wonDeals, winRate }
  }

  const stats = calculateStats()

  const exportToCSV = () => {
  // Prepare CSV headers
  const headers = [
    'Customer Name',
    'Company',
    'Email',
    'Phone',
    'Deal Value',
    'Currency',
    'Commission',
    'Stage',
    'Priority',
    'Expected Close Date',
    'Created Date',
    'Notes'
  ]

  // Prepare CSV rows
  const rows = filteredDeals.map(deal => [
    deal.customer_name || '',
    deal.customer_company || '',
    deal.customer_email || '',
    deal.customer_phone || '',
    deal.deal_value || 0,
    deal.currency || 'USD',
    deal.your_commission || 0,
    deal.stage || '',
    deal.priority || '',
    deal.expected_close_date 
      ? new Date(deal.expected_close_date).toLocaleDateString()
      : '',
    new Date(deal.created_at).toLocaleDateString(),
    deal.notes ? `"${deal.notes.replace(/"/g, '""')}"` : ''
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
  link.setAttribute('download', `deals_export_${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
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
      <div className="max-w-[calc(100vw-280px)] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">All Deals</h1>
              <p className="text-gray-600 mt-1">
                View and manage all partner deals across the platform
              </p>
            </div>
            <div className="flex items-center space-x-3">
              {/* View Toggle */}
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('list')}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'list'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <List className="h-4 w-4 mr-2" />
                  List
                </button>
                <button
                  onClick={() => setViewMode('kanban')}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'kanban'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <LayoutGrid className="h-4 w-4 mr-2" />
                  Kanban
                </button>
              </div>
              {/* Create Deal Button */}
              <Link
                href="/admin/deals/new"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Register Deal
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.totalDeals}</p>
                <p className="text-sm text-gray-600">Total Deals</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(stats.totalValue)}
                </p>
                <p className="text-sm text-gray-600">Pipeline Value</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.wonDeals}</p>
                <p className="text-sm text-gray-600">Deals Won</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.winRate}%</p>
                <p className="text-sm text-gray-600">Win Rate</p>
              </div>
            </div>
          </div>
        </div>
        {/* Filters and Search for List View */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
              <div className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                  <div className="relative flex-1 max-w-lg">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search by customer, company, partner, or email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-purple-500 focus:border-purple-500 sm:text-sm text-gray-900"
                    />
                  </div>

                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                    <ChevronDown className={`ml-2 h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                  </button>
                  <button
                    onClick={exportToCSV}
                    disabled={filteredDeals.length === 0}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    title={filteredDeals.length === 0 ? 'No deals to export' : 'Export filtered deals to CSV'}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV ({filteredDeals.length})
                  </button>
                </div>

                {showFilters && (
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Stage
                      </label>
                      <select
                        value={stageFilter}
                        onChange={(e) => setStageFilter(e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900"
                      >
                        {stages.map(stage => (
                          <option key={stage.value} value={stage.value}>
                            {stage.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Partner
                      </label>
                      <select
                        value={partnerFilter}
                        onChange={(e) => setPartnerFilter(e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900"
                      >
                        <option value="all">All Partners</option>
                        {partners.map(partner => (
                          <option key={partner.id} value={partner.id}>
                            {partner.first_name} {partner.last_name} - {partner.organization?.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Sort By
                      </label>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900"
                      >
                        <option value="created_at">Created Date</option>
                        <option value="updated_at">Updated Date</option>
                        <option value="deal_value">Deal Value</option>
                        <option value="customer_name">Customer Name</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Order
                      </label>
                      <button
                        onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        {sortOrder === 'asc' ? '↑ Ascending' : '↓ Descending'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
        </div>
        {/* Kanban or List View */}
        {viewMode === 'kanban' ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <AdminKanbanView deals={filteredDeals} onDealUpdate={setDeals} />
          </div>
        ) : (
          <>
            {/* List View */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              {filteredDeals.length === 0 ? (
                <div className="text-center py-12">
                  <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {deals.length === 0 ? 'No deals registered yet' : 'No deals match your filters'}
                  </h3>
                  <p className="text-gray-600">
                    {deals.length === 0 
                      ? 'Deals will appear here as partners register them.'
                      : 'Try adjusting your search or filter criteria.'
                    }
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredDeals.map((deal) => (
                    <div key={deal.id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-medium text-gray-900 truncate">
                              {deal.customer_name}
                            </h3>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStageColor(deal.stage)}`}>
                              {stages.find(s => s.value === deal.stage)?.label || deal.stage}
                            </span>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(deal.priority)}`}>
                              {deal.priority?.charAt(0).toUpperCase() + deal.priority?.slice(1)}
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-6 text-sm text-gray-600">
                            {deal.customer_company && (
                              <div className="flex items-center">
                                <Building2 className="h-4 w-4 mr-1" />
                                {deal.customer_company}
                              </div>
                            )}
                            <div className="flex items-center">
                              {formatCurrency(deal.deal_value, deal.currency)}
                            </div>
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              {new Date(deal.created_at).toLocaleDateString()}
                            </div>
                          </div>

                          <div className="mt-2 flex items-center text-sm text-gray-500">
                            <User className="h-4 w-4 mr-1" />
                            <span>Partner: {deal.partner?.first_name} {deal.partner?.last_name}</span>
                            <span className="mx-2">•</span>
                            <span>{deal.partner?.organization?.name}</span>
                            <span className="mx-2">•</span>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              deal.partner?.organization?.tier === 'platinum' ? 'bg-purple-100 text-purple-800' :
                              deal.partner?.organization?.tier === 'gold' ? 'bg-yellow-100 text-yellow-800' :
                              deal.partner?.organization?.tier === 'silver' ? 'bg-gray-100 text-gray-800' :
                              'bg-orange-100 text-orange-800'
                            }`}>
                              {deal.partner?.organization?.tier?.charAt(0).toUpperCase() + deal.partner?.organization?.tier?.slice(1)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 ml-4">
                          <Link
                            href={`/admin/deals/${deal.id}`}
                            className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Link>
                          <button
                            onClick={() => handleDeleteDeal(deal.id, deal.customer_name)}
                            disabled={deletingDeal === deal.id}
                            className="inline-flex items-center px-3 py-1.5 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                          >
                            {deletingDeal === deal.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-700 mr-1"></div>
                            ) : (
                              <Trash2 className="h-4 w-4 mr-1" />
                            )}
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}