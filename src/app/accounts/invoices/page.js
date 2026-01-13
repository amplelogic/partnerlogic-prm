// src/app/accounts/invoices/page.js
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import InvoiceGenerator from '@/components/InvoiceGenerator'
import ReferralInvoiceGenerator from '@/components/ReferralInvoiceGenerator'
import { 
  Search, Filter, FileText, Download, 
  Building2, User, Mail, DollarSign, Calendar,
  Eye, ChevronDown, ShoppingCart, Tag
} from 'lucide-react'
import { formatCurrency as formatCurrencyUtil } from '@/lib/currencyUtils'
import { sendInvoiceEmail, sendOverduePaymentEmail } from '@/lib/notifications'

export default function AccountsInvoicesPage() {
  const [deals, setDeals] = useState([])
  const [filteredDeals, setFilteredDeals] = useState([])
  const [referralOrders, setReferralOrders] = useState([])
  const [filteredReferralOrders, setFilteredReferralOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [partnerFilter, setPartnerFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [partners, setPartners] = useState([])
  const [viewMode, setViewMode] = useState('deals') // 'deals' or 'referrals'
  const [updatingStatus, setUpdatingStatus] = useState({})
  
  const supabase = createClient()

  const paymentStatuses = [
    { value: 'unpaid', label: 'Unpaid', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'paid', label: 'Paid', color: 'bg-green-100 text-green-800' },
    { value: 'partial', label: 'Partial', color: 'bg-blue-100 text-blue-800' },
    { value: 'overdue', label: 'Overdue', color: 'bg-red-100 text-red-800' }
  ]

  useEffect(() => {
    loadInvoices()
  }, [])

  useEffect(() => {
    filterDeals()
    filterReferralOrders()
  }, [searchTerm, partnerFilter, dateFilter, deals, referralOrders])

  const loadInvoices = async () => {
    try {
      console.log('Loading invoices for account user...')
      
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
          ),
          deal_activities!inner(created_at, activity_type)
        `)
        .or('stage.eq.closed_won,admin_stage.eq.closed_won')
        .order('updated_at', { ascending: false })

      if (dealsError) {
        console.error('Error loading deals:', dealsError)
      } else {
        console.log('Loaded deals:', dealsData?.length || 0, dealsData)
      }

      // Process deals to add closed_won_date from deal_activities
      const processedDeals = (dealsData || []).map(deal => {
        const closedWonActivity = deal.deal_activities?.find(
          activity => activity.activity_type === 'stage_updated' && 
                     (deal.stage === 'closed_won' || deal.admin_stage === 'closed_won')
        )
        return {
          ...deal,
          closed_won_date: closedWonActivity?.created_at || deal.updated_at
        }
      })

      setDeals(processedDeals)
      console.log('Processed deals:', processedDeals.length)

      // Extract unique partners for filter
      const uniquePartners = [...new Map(
        dealsData?.map(d => d.partner).filter(Boolean).map(p => [p.id, p])
      ).values()]
      setPartners(uniquePartners)

      // Load completed referral orders with partner info
      const { data: referralData, error: referralError } = await supabase
        .from('referral_orders')
        .select(`
          *,
          partner:partners (
            id,
            first_name,
            last_name,
            email,
            organization:organizations (
              name,
              type
            )
          )
        `)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })

      if (referralError) {
        console.error('Error loading referral orders:', referralError)
      } else {
        console.log('Loaded referral orders:', referralData?.length || 0)
      }

      setReferralOrders(referralData || [])

    } catch (error) {
      console.error('Error loading invoices:', error)
    } finally {
      setLoading(false)
    }
  }

  const updatePaymentStatus = async (dealId, newStatus) => {
    try {
      setUpdatingStatus(prev => ({ ...prev, [dealId]: true }))

      const { error } = await supabase
        .from('deals')
        .update({ payment_status: newStatus })
        .eq('id', dealId)

      if (error) throw error

      // Update local state
      const updatedDeal = deals.find(d => d.id === dealId)
      setDeals(prevDeals =>
        prevDeals.map(deal =>
          deal.id === dealId ? { ...deal, payment_status: newStatus } : deal
        )
      )

      console.log(`✅ Payment status updated to ${newStatus}`)

      // Send overdue reminder email to partner if status is overdue
      if (newStatus === 'overdue' && updatedDeal) {
        try {
          console.log('📧 Sending overdue payment reminder to partner...')
          
          // Get partner email
          const { data: partnerData } = await supabase
            .from('partners')
            .select('email, first_name, last_name')
            .eq('id', updatedDeal.partner_id)
            .single()

          if (partnerData?.email) {
            await sendOverduePaymentEmail({
              dealId: updatedDeal.id,
              customerName: updatedDeal.customer_name,
              partnerEmail: partnerData.email,
              partnerName: `${partnerData.first_name} ${partnerData.last_name}`,
              amount: formatCurrency(updatedDeal.deal_value, updatedDeal.currency),
              description: updatedDeal.description
            })
            console.log('✅ Overdue payment reminder sent')
          }
        } catch (emailError) {
          console.error('Error sending overdue reminder:', emailError)
          // Don't block status update if email fails
        }
      }
    } catch (error) {
      console.error('Error updating payment status:', error)
      alert('Failed to update payment status')
    } finally {
      setUpdatingStatus(prev => ({ ...prev, [dealId]: false }))
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

    // Date filter - use closed_won_date instead of created_at
    if (dateFilter !== 'all') {
      const now = new Date()
      const filterDate = new Date()
      
      switch (dateFilter) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0)
          filtered = filtered.filter(deal => new Date(deal.closed_won_date) >= filterDate)
          break
        case 'week':
          filterDate.setDate(now.getDate() - 7)
          filtered = filtered.filter(deal => new Date(deal.closed_won_date) >= filterDate)
          break
        case 'month':
          filterDate.setMonth(now.getMonth() - 1)
          filtered = filtered.filter(deal => new Date(deal.closed_won_date) >= filterDate)
          break
        case 'quarter':
          filterDate.setMonth(now.getMonth() - 3)
          filtered = filtered.filter(deal => new Date(deal.closed_won_date) >= filterDate)
          break
      }
    }

    setFilteredDeals(filtered)
  }

  const filterReferralOrders = () => {
    let filtered = [...referralOrders]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.client_company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.client_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.partner?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.partner?.last_name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Partner filter
    if (partnerFilter !== 'all') {
      filtered = filtered.filter(order => order.partner_id === partnerFilter)
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date()
      const filterDate = new Date()
      
      switch (dateFilter) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0)
          filtered = filtered.filter(order => new Date(order.created_at) >= filterDate)
          break
        case 'week':
          filterDate.setDate(now.getDate() - 7)
          filtered = filtered.filter(order => new Date(order.created_at) >= filterDate)
          break
        case 'month':
          filterDate.setMonth(now.getMonth() - 1)
          filtered = filtered.filter(order => new Date(order.created_at) >= filterDate)
          break
        case 'quarter':
          filterDate.setMonth(now.getMonth() - 3)
          filtered = filtered.filter(order => new Date(order.created_at) >= filterDate)
          break
      }
    }

    setFilteredReferralOrders(filtered)
  }

  const formatCurrency = (amount, currency = 'USD') => {
    return formatCurrencyUtil(amount, currency)
  }

  const getPartnerTypeBadge = (type) => {
    const badges = {
      referral: { label: 'Referral Partner', color: 'bg-purple-100 text-purple-800' },
      reseller: { label: 'Reseller Partner', color: 'bg-blue-100 text-blue-800' },
      full_cycle: { label: 'Full Cycle Partner', color: 'bg-indigo-100 text-indigo-800' }
    }
    return badges[type] || { label: 'Partner', color: 'bg-gray-100 text-gray-800' }
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
                All closed won deals and completed referral orders
              </p>
            </div>
            <div className="flex items-center space-x-3">
              {/* Toggle Switch */}
              <div className="inline-flex rounded-lg border border-gray-300 bg-white p-1">
                <button
                  onClick={() => setViewMode('deals')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    viewMode === 'deals'
                      ? 'bg-green-600 text-white'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <FileText className="h-4 w-4 inline mr-1" />
                  Deals ({filteredDeals.length})
                </button>
                <button
                  onClick={() => setViewMode('referrals')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    viewMode === 'referrals'
                      ? 'bg-green-600 text-white'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <ShoppingCart className="h-4 w-4 inline mr-1" />
                  Referrals ({filteredReferralOrders.length})
                </button>
              </div>
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
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-green-500 focus:border-green-500 sm:text-sm"
              />
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
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
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md text-black border"
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
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md text-black border"
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

        {/* Deals View */}
        {viewMode === 'deals' && (
          <>
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
                      {deal.partner?.organization?.type && (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPartnerTypeBadge(deal.partner.organization.type).color}`}>
                          <Tag className="h-3 w-3 mr-1" />
                          {getPartnerTypeBadge(deal.partner.organization.type).label}
                        </span>
                      )}
                      
                      {/* Payment Status Dropdown */}
                      <div className="relative">
                        <select
                          value={deal.payment_status || 'unpaid'}
                          onChange={(e) => updatePaymentStatus(deal.id, e.target.value)}
                          disabled={updatingStatus[deal.id]}
                          className={`pl-3 pr-8 py-1 text-xs font-medium rounded-full border-0 focus:ring-2 focus:ring-green-500 cursor-pointer ${
                            paymentStatuses.find(s => s.value === (deal.payment_status || 'unpaid'))?.color || 'bg-gray-100 text-gray-800'
                          } ${updatingStatus[deal.id] ? 'opacity-50' : ''}`}
                        >
                          {paymentStatuses.map(status => (
                            <option key={status.value} value={status.value}>
                              {status.label}
                            </option>
                          ))}
                        </select>
                      </div>
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
                      <button
                        onClick={() => {
                          const generator = document.createElement('div');
                          const root = document.createElement('div');
                          document.body.appendChild(root);
                          const React = require('react');
                          const ReactDOM = require('react-dom/client');
                          const InvoiceGen = require('@/components/InvoiceGenerator').default;
                          const reactRoot = ReactDOM.createRoot(root);
                          reactRoot.render(React.createElement(InvoiceGen, { deal, partner: deal.partner }));
                          setTimeout(() => {
                            const btn = root.querySelector('button');
                            if (btn) btn.click();
                            setTimeout(() => {
                              reactRoot.unmount();
                              document.body.removeChild(root);
                            }, 100);
                          }, 100);
                        }}
                        className="inline-flex items-center px-3 py-1.5 border border-green-300 text-sm font-medium rounded-md text-green-700 bg-white hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Generate & Download Invoice
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary Stats */}
        {filteredDeals.length > 0 && (
          <div className="mt-6 bg-green-50 rounded-lg p-6 border border-green-100">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <p className="text-sm font-medium text-green-900">Total Invoices</p>
                <p className="mt-1 text-2xl font-bold text-green-600">{filteredDeals.length}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-green-900">Total Value</p>
                <p className="mt-1 text-2xl font-bold text-green-600">
                  {formatCurrency(filteredDeals.reduce((sum, deal) => sum + (deal.deal_value || 0), 0))}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-green-900">Partners</p>
                <p className="mt-1 text-2xl font-bold text-green-600">
                  {new Set(filteredDeals.map(d => d.partner_id).filter(Boolean)).size}
                </p>
              </div>
            </div>
          </div>
        )}
          </>
        )}

        {/* Referral Orders View */}
        {viewMode === 'referrals' && (
          <>
            {filteredReferralOrders.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <ShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No referral order invoices found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || partnerFilter !== 'all' || dateFilter !== 'all' 
                  ? 'Try adjusting your search or filters' 
                  : 'Completed referral orders will appear here'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredReferralOrders.map((order) => (
                <div key={order.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:border-green-300 transition-colors">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {order.client_name}
                          </h3>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Completed
                          </span>
                          {order.partner?.organization?.type && (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPartnerTypeBadge(order.partner.organization.type).color}`}>
                              <Tag className="h-3 w-3 mr-1" />
                              {getPartnerTypeBadge(order.partner.organization.type).label}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          Product: <span className="font-medium">{order.product_name}</span>
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      {/* Client Info */}
                      <div className="space-y-2">
                        <h4 className="text-xs font-semibold text-gray-500 uppercase">Client</h4>
                        <div className="flex items-center text-sm text-gray-600">
                          <Building2 className="h-4 w-4 mr-2 text-gray-400" />
                          {order.client_company || 'N/A'}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Mail className="h-4 w-4 mr-2 text-gray-400" />
                          {order.client_email}
                        </div>
                      </div>

                      {/* Partner Info */}
                      <div className="space-y-2">
                        <h4 className="text-xs font-semibold text-gray-500 uppercase">Referring Partner</h4>
                        <div className="flex items-center text-sm text-gray-600">
                          <User className="h-4 w-4 mr-2 text-gray-400" />
                          {order.partner ? (
                            <span>
                              {order.partner.first_name} {order.partner.last_name}
                            </span>
                          ) : (
                            'No Partner'
                          )}
                        </div>
                        {order.partner?.organization && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Building2 className="h-4 w-4 mr-2 text-gray-400" />
                            {order.partner.organization.name}
                          </div>
                        )}
                      </div>

                      {/* Order Info */}
                      <div className="space-y-2">
                        <h4 className="text-xs font-semibold text-gray-500 uppercase">Order Details</h4>
                        <div className="flex items-center text-sm text-gray-600">
                          <DollarSign className="h-4 w-4 mr-2 text-gray-400" />
                          <div>
                            <span className="font-semibold text-gray-900">
                              {formatCurrency(order.order_value, order.currency)}
                            </span>
                            {order.commission_amount && (
                              <span className="ml-2 text-xs text-green-600">
                                (Commission: {formatCurrency(order.commission_amount, order.currency)})
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                          {new Date(order.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => {
                          const generator = document.createElement('div');
                          const root = document.createElement('div');
                          document.body.appendChild(root);
                          const React = require('react');
                          const ReactDOM = require('react-dom/client');
                          const RefInvoiceGen = require('@/components/ReferralInvoiceGenerator').default;
                          const reactRoot = ReactDOM.createRoot(root);
                          reactRoot.render(React.createElement(RefInvoiceGen, { referralOrder: order, partner: order.partner }));
                          setTimeout(() => {
                            const btn = root.querySelector('button');
                            if (btn) btn.click();
                            setTimeout(() => {
                              reactRoot.unmount();
                              document.body.removeChild(root);
                            }, 100);
                          }, 100);
                        }}
                        className="inline-flex items-center px-3 py-1.5 border border-green-300 text-sm font-medium rounded-md text-green-700 bg-white hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Generate & Download Invoice
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Referral Orders Summary Stats */}
          {filteredReferralOrders.length > 0 && (
            <div className="mt-6 bg-green-50 rounded-lg p-6 border border-green-100">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm font-medium text-green-900">Total Referral Orders</p>
                  <p className="mt-1 text-2xl font-bold text-green-600">{filteredReferralOrders.length}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-green-900">Total Order Value</p>
                  <p className="mt-1 text-2xl font-bold text-green-600">
                    {formatCurrency(filteredReferralOrders.reduce((sum, order) => sum + (order.order_value || 0), 0))}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-green-900">Total Commissions</p>
                  <p className="mt-1 text-2xl font-bold text-green-600">
                    {formatCurrency(filteredReferralOrders.reduce((sum, order) => sum + (order.commission_amount || 0), 0))}
                  </p>
                </div>
              </div>
            </div>
          )}
          </>
        )}

        {/* Overall Summary */}
        {(filteredDeals.length > 0 || filteredReferralOrders.length > 0) && (
            <div className="mt-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 border-2 border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Overall Summary</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm font-medium text-gray-700">Total Invoices</p>
                  <p className="mt-1 text-2xl font-bold text-gray-900">
                    {filteredDeals.length + filteredReferralOrders.length}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Combined Revenue</p>
                  <p className="mt-1 text-2xl font-bold text-gray-900">
                    {formatCurrency(
                      filteredDeals.reduce((sum, deal) => sum + (deal.deal_value || 0), 0) +
                      filteredReferralOrders.reduce((sum, order) => sum + (order.order_value || 0), 0)
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Total Commissions</p>
                  <p className="mt-1 text-2xl font-bold text-gray-900">
                    {formatCurrency(
                      filteredReferralOrders.reduce((sum, order) => sum + (order.commission_amount || 0), 0)
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}
      </div>
    </div>
  )
}
