'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { 
  Search, Filter, Eye, BarChart3, DollarSign,
  Building2, Calendar, ChevronDown, Users, LayoutGrid, List, Download
} from 'lucide-react'
import { CURRENCIES } from '@/lib/currencyUtils'


// Dynamically import Kanban to avoid SSR issues
const KanbanView = dynamic(() => import('./kanban-view'), { ssr: false })

export default function AllDealsPage() {
  const [deals, setDeals] = useState([])
  const [filteredDeals, setFilteredDeals] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [stageFilter, setStageFilter] = useState('all')
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState('kanban') // 'list' or 'kanban'

  const supabase = createClient()

  const stages = [
    { value: 'all', label: 'All Stages' },
    { value: 'lead', label: 'Lead' },
    { value: 'qualified', label: 'Qualified' },
    { value: 'proposal', label: 'Proposal' },
    { value: 'negotiation', label: 'Negotiation' },
    { value: 'closed_won', label: 'Closed Won' },
    { value: 'closed_lost', label: 'Closed Lost' }
  ]

  useEffect(() => {
    loadDeals()
  }, [])

  useEffect(() => {
    filterDeals()
  }, [deals, searchTerm, stageFilter])

  const loadDeals = async () => {
    try {
      setLoading(true)

      // Get current partner manager
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: managerData } = await supabase
        .from('partner_managers')
        .select('*')
        .eq('auth_user_id', user.id)
        .single()

      if (!managerData) return

      // Get partners assigned to this manager
      const { data: partnersData } = await supabase
        .from('partners')
        .select('id')
        .eq('partner_manager_id', managerData.id)

      const partnerIds = partnersData?.map(p => p.id) || []

      if (partnerIds.length === 0) {
        setDeals([])
        setLoading(false)
        return
      }

      // Get all deals from assigned partners
      const { data: dealsData, error } = await supabase
        .from('deals')
        .select(`
          *,
          partners!inner(
            id,
            first_name,
            last_name,
            organization:organizations(name, tier)
          )
        `)
        .in('partner_id', partnerIds)
        .order('created_at', { ascending: false })

      if (error) throw error

      setDeals(dealsData || [])
    } catch (error) {
      console.error('Error loading deals:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterDeals = () => {
    let filtered = [...deals]

    if (searchTerm) {
      filtered = filtered.filter(deal =>
        deal.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deal.customer_company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deal.partners?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deal.partners?.last_name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (stageFilter !== 'all') {
      filtered = filtered.filter(deal => deal.stage === stageFilter)
    }

    setFilteredDeals(filtered)
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

  const getStageColor = (stage) => {
    switch (stage) {
      case 'lead': return 'bg-gray-100 text-gray-800'
      case 'qualified': return 'bg-blue-100 text-blue-800'
      case 'proposal': return 'bg-yellow-100 text-yellow-800'
      case 'negotiation': return 'bg-purple-100 text-purple-800'
      case 'closed_won': return 'bg-green-100 text-green-800'
      case 'closed_lost': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const calculateStats = () => {
    const totalValue = filteredDeals.reduce((sum, deal) => sum + (Number(deal.deal_value) || 0), 0)
    const activeDeals = filteredDeals.filter(d => !['closed_won', 'closed_lost'].includes(d.stage)).length
    const wonDeals = filteredDeals.filter(d => d.stage === 'closed_won').length

    return { totalValue, activeDeals, wonDeals, totalDeals: filteredDeals.length }
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
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="py-6">
      <div className="max-w-[calc(100vw-280px)] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">All Deals</h1>
              <p className="text-gray-600 mt-1">
                Deals from all your assigned partners
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
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalValue, deals[0]?.currency)}</p>
                <p className="text-sm text-gray-600">Total Value</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.activeDeals}</p>
                <p className="text-sm text-gray-600">Active Deals</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.wonDeals}</p>
                <p className="text-sm text-gray-600">Won Deals</p>
              </div>
            </div>
          </div>
        </div>

        {/* Kanban or List View */}
        {viewMode === 'kanban' ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <KanbanView deals={filteredDeals} onDealUpdate={setDeals} />
          </div>
        ) : (
          <>
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
                      placeholder="Search by customer, company, or partner..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                    />
                  </div>

                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
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
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Stage
                      </label>
                      <select
                        value={stageFilter}
                        onChange={(e) => setStageFilter(e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                      >
                        {stages.map(stage => (
                          <option key={stage.value} value={stage.value}>
                            {stage.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Deals List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              {filteredDeals.length === 0 ? (
                <div className="text-center py-12">
                  <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {deals.length === 0 ? 'No deals yet' : 'No deals match your filters'}
                  </h3>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredDeals.map((deal) => (
                    <div key={deal.id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-medium text-gray-900">
                              {deal.customer_name}
                            </h3>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStageColor(deal.stage)}`}>
                              {deal.stage?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-6 text-sm text-gray-600">
                            <div className="flex items-center">
                              <Building2 className="h-4 w-4 mr-1" />
                              {deal.customer_company}
                            </div>
                            <div className="flex items-center">
                              {formatCurrency(deal.deal_value, deal.currency)}
                            </div>
                            <div className="flex items-center">
                              <Users className="h-4 w-4 mr-1" />
                              {deal.partners?.first_name} {deal.partners?.last_name}
                            </div>
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              {new Date(deal.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>

                        <div className="ml-4">
                          <Link
                            href={`/partner-manager/deals/${deal.id}`}
                            className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Link>
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