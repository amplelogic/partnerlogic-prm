'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import InvoiceGenerator from '@/components/InvoiceGenerator'
import { 
  ArrowLeft, Building2, Mail, Phone, Calendar, 
  DollarSign, User, AlertCircle, TrendingUp,
  FileText, Package
} from 'lucide-react'

export default function DealDetailPage({ params }) {
  const [deal, setDeal] = useState(null)
  const [partner, setPartner] = useState(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadDealData()
  }, [params.id])

  const loadDealData = async () => {
    try {
      setLoading(true)

      // Get deal with partner info
      const { data: dealData, error: dealError } = await supabase
        .from('deals')
        .select(`
          *,
          partners!inner(
            id,
            first_name,
            last_name,
            email,
            phone,
            organization:organizations(*)
          )
        `)
        .eq('id', params.id)
        .single()

      if (dealError) throw dealError

      setDeal(dealData)
      setPartner(dealData.partners)

    } catch (error) {
      console.error('Error loading deal:', error)
    } finally {
      setLoading(false)
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

  if (!deal) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Deal Not Found</h2>
            <p className="text-gray-600 mb-6">This deal doesn't exist or you don't have access.</p>
            <Link
              href="/partner-manager/deals"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Deals
            </Link>
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
          <Link
            href="/partner-manager/deals"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <ArrowLeft className="h-5 w-5 mr-1" />
            Back to All Deals
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {deal.customer_name}
              </h1>
              <p className="text-gray-600">{deal.customer_company}</p>
            </div>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStageColor(deal.stage)}`}>
              {deal.stage?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Deal Information */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Deal Information</h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Deal Value</p>
                    <p className="text-xl font-bold text-gray-900">{formatCurrency(deal.deal_value)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Expected Close Date</p>
                    <p className="font-medium text-gray-900">
                      {deal.expected_close_date 
                        ? new Date(deal.expected_close_date).toLocaleDateString()
                        : 'Not set'}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-2">Customer Contact</p>
                  <div className="flex items-center space-x-3 mb-2">
                    <Mail className="h-5 w-5 text-gray-400" />
                    <span className="text-gray-900">{deal.customer_email}</span>
                  </div>
                  {deal.customer_phone && (
                    <div className="flex items-center space-x-3">
                      <Phone className="h-5 w-5 text-gray-400" />
                      <span className="text-gray-900">{deal.customer_phone}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Registered</p>
                    <p className="font-medium text-gray-900">
                      {new Date(deal.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Product Information */}
            {deal.product_name && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Product Information</h2>
                </div>
                <div className="p-6">
                  <div className="flex items-center space-x-3">
                    <Package className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">{deal.product_name}</p>
                      {deal.product_details && (
                        <p className="text-sm text-gray-600 mt-1">{deal.product_details}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notes */}
            {deal.notes && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Notes</h2>
                </div>
                <div className="p-6">
                  <p className="text-gray-700 whitespace-pre-wrap">{deal.notes}</p>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Partner Information */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Partner Information</h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {partner?.first_name} {partner?.last_name}
                    </p>
                    <p className="text-sm text-gray-600">{partner?.organization?.name}</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <div className="space-y-2">
                    <div className="flex items-center text-sm">
                      <Mail className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-gray-900">{partner?.email}</span>
                    </div>
                    {partner?.phone && (
                      <div className="flex items-center text-sm">
                        <Phone className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-gray-900">{partner?.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                <Link
                  href={`/partner-manager/partners/${partner?.id}`}
                  className="block w-full mt-4 px-4 py-2 bg-blue-50 text-blue-700 text-center rounded-lg hover:bg-blue-100 transition-colors"
                >
                  View Partner Profile
                </Link>
              </div>
            </div>

            {/* Deal Metrics */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Deal Metrics</h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Deal Value</span>
                  <span className="text-sm font-semibold text-gray-900">{formatCurrency(deal.deal_value)}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <DollarSign className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Partner Commission</p>
                    <p className="text-sm text-gray-600">{formatCurrency(deal.your_commission)}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <DollarSign className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Price to Ample Logic</p>
                    <p className="text-sm text-gray-600">{formatCurrency(deal.price_to_ample_logic)}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Current Stage</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${getStageColor(deal.stage)}`}>
                    {deal.stage?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Days in Pipeline</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {Math.floor((new Date() - new Date(deal.created_at)) / (1000 * 60 * 60 * 24))} days
                  </span>
                </div>
              </div>
            </div>
            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
              </div>
              
              <div className="p-6">
                <InvoiceGenerator deal={deal} partner={partner} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}