// src/app/admin/invoices/page.js
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import InvoiceGenerator from '@/components/InvoiceGenerator'
import { 
  Search, Filter, FileText, Download, 
  Building2, User, Mail, DollarSign, Calendar,
  Eye, ChevronDown
} from 'lucide-react'
import { formatCurrency as formatCurrencyUtil } from '@/lib/currencyUtils'

export default function AdminInvoicesPage() {
  const [deals, setDeals] = useState([])
  const [filteredDeals, setFilteredDeals] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [partnerFilter, setPartnerFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [partners, setPartners] = useState([])
  
  const supabase = createClient()

  useEffect(() => {
    loadInvoices()
  }, [])

  useEffect(() => {
    filterDeals()
  }, [searchTerm, partnerFilter, dateFilter, deals])

  const loadInvoices = async () => {
    try {
      // Load all closed_won deals with partner info
      const { data: dealsData, error: dealsError } = await supabase
        .from('deals')
        .select(`
          *,
          partner:partners (
            id,
            first_name,
            last_name,
            email,
            phone,
            organization:organizations (
              name,
              type
            )
          )
        `)
        .eq('admin_stage', 'closed_won')
        .order('created_at', { ascending: false })

      if (dealsError) throw dealsError

      setDeals(dealsData || [])

      // Extract unique partners for filter
      const uniquePartners = [...new Map(
        dealsData?.map(d => d.partner).filter(Boolean).map(p => [p.id, p])
      ).values()]
      setPartners(uniquePartners)

    } catch (error) {
      console.error('Error loading invoices:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterDeals = () => {
    let filtered = [...deals]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(deal =>
        deal.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deal.customer_company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deal.customer_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deal.partner?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deal.partner?.last_name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Partner filter
    if (partnerFilter !== 'all') {
      filtered = filtered.filter(deal => deal.partner_id === partnerFilter)
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date()
      const filterDate = new Date()
      
      switch (dateFilter) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0)
          filtered = filtered.filter(deal => new Date(deal.created_at) >= filterDate)
          break
        case 'week':
          filterDate.setDate(now.getDate() - 7)
          filtered = filtered.filter(deal => new Date(deal.created_at) >= filterDate)
          break
        case 'month':
          filterDate.setMonth(now.getMonth() - 1)
          filtered = filtered.filter(deal => new Date(deal.created_at) >= filterDate)
          break
        case 'quarter':
          filterDate.setMonth(now.getMonth() - 3)
          filtered = filtered.filter(deal => new Date(deal.created_at) >= filterDate)
          break
      }
    }

    setFilteredDeals(filtered)
  }

  const formatCurrency = (amount, currency = 'USD') => {
    return formatCurrencyUtil(amount, currency)
  }

  if (loading) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/4 mb-6"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
              <p className="mt-1 text-sm text-gray-600">
                All closed won deals ready for invoicing
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <span className="inline-flex items-center px-3 py-2 rounded-lg bg-green-100 text-green-800 text-sm font-medium">
                <FileText className="h-4 w-4 mr-2" />
                {filteredDeals.length} {filteredDeals.length === 1 ? 'Invoice' : 'Invoices'}
              </span>
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
                placeholder="Search by customer, company, or partner..."
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
            <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Partner Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Partner
                </label>
                <select
                  value={partnerFilter}
                  onChange={(e) => setPartnerFilter(e.target.value)}
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                >
                  <option value="all">All Partners</option>
                  {partners.map((partner) => (
                    <option key={partner.id} value={partner.id}>
                      {partner.first_name} {partner.last_name}
                    </option>
                  ))}
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
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">Last 7 Days</option>
                  <option value="month">Last 30 Days</option>
                  <option value="quarter">Last 90 Days</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Invoices List */}
        {filteredDeals.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No invoices found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || partnerFilter !== 'all' || dateFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'No closed won deals available for invoicing'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 divide-y divide-gray-200">
            {filteredDeals.map((deal) => (
              <div key={deal.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {deal.customer_name}
                      </h3>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Closed Won
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      {/* Customer Info */}
                      <div className="space-y-2">
                        <div className="flex items-center text-sm text-gray-600">
                          <Building2 className="h-4 w-4 mr-2 text-gray-400" />
                          {deal.customer_company || 'N/A'}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Mail className="h-4 w-4 mr-2 text-gray-400" />
                          {deal.customer_email}
                        </div>
                      </div>

                      {/* Partner Info */}
                      <div className="space-y-2">
                        <div className="flex items-center text-sm text-gray-600">
                          <User className="h-4 w-4 mr-2 text-gray-400" />
                          {deal.partner ? (
                            <span>
                              {deal.partner.first_name} {deal.partner.last_name}
                            </span>
                          ) : (
                            'No Partner Assigned'
                          )}
                        </div>
                        {deal.partner?.organization && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Building2 className="h-4 w-4 mr-2 text-gray-400" />
                            {deal.partner.organization.name}
                          </div>
                        )}
                      </div>

                      {/* Deal Info */}
                      <div className="space-y-2">
                        <div className="flex items-center text-sm text-gray-600">
                          <DollarSign className="h-4 w-4 mr-2 text-gray-400" />
                          <span className="font-semibold text-gray-900">
                            {formatCurrency(deal.deal_value, deal.currency)}
                          </span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                          {new Date(deal.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-3">
                      <Link
                        href={`/admin/deals/${deal.id}`}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Deal
                      </Link>
                      <div className="flex-1 max-w-xs">
                        <InvoiceGenerator deal={deal} partner={deal.partner} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary Stats */}
        {filteredDeals.length > 0 && (
          <div className="mt-6 bg-blue-50 rounded-lg p-6 border border-blue-100">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <p className="text-sm font-medium text-blue-900">Total Invoices</p>
                <p className="mt-1 text-2xl font-bold text-blue-600">{filteredDeals.length}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-blue-900">Total Value</p>
                <p className="mt-1 text-2xl font-bold text-blue-600">
                  {formatCurrency(filteredDeals.reduce((sum, deal) => sum + (deal.deal_value || 0), 0))}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-blue-900">Partners</p>
                <p className="mt-1 text-2xl font-bold text-blue-600">
                  {new Set(filteredDeals.map(d => d.partner_id).filter(Boolean)).size}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
