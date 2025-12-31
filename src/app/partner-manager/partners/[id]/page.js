'use client'

import { useState, useEffect, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, Mail, Phone, Building2, Calendar, 
  Award, Percent, DollarSign, BarChart3,
  User, TrendingUp, AlertCircle
} from 'lucide-react'

export default function PartnerDetailPage({ params }) {
  const unwrappedParams = use(params)
  const [partner, setPartner] = useState(null)
  const [stats, setStats] = useState({
    totalDeals: 0,
    pipelineValue: 0,
    openTickets: 0,
    closedWonDeals: 0
  })
  const [recentDeals, setRecentDeals] = useState([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (unwrappedParams.id) {
      loadPartnerData()
    }
  }, [unwrappedParams.id])

  const loadPartnerData = async () => {
    try {
      setLoading(true)

      // Get partner with organization
      const { data: partnerData, error: partnerError } = await supabase
        .from('partners')
        .select(`
          *,
          organization:organizations(*)
        `)
        .eq('id', unwrappedParams.id)
        .single()

      if (partnerError) throw partnerError

      setPartner(partnerData)

      // Get stats
      const [dealsResult, ticketsResult] = await Promise.all([
        supabase
          .from('deals')
          .select('deal_value, stage')
          .eq('partner_id', unwrappedParams.id),
        supabase
          .from('support_tickets')
          .select('id', { count: 'exact', head: true })
          .eq('partner_id', unwrappedParams.id)
          .in('status', ['open', 'in_progress'])
      ])

      const deals = dealsResult.data || []
      const pipelineValue = deals.reduce((sum, deal) => sum + (Number(deal.deal_value) || 0), 0)
      const closedWonDeals = deals.filter(d => d.stage === 'closed_won').length

      setStats({
        totalDeals: deals.length,
        pipelineValue,
        openTickets: ticketsResult.count || 0,
        closedWonDeals
      })

      // Get recent deals
      const { data: recentDealsData } = await supabase
        .from('deals')
        .select('*')
        .eq('partner_id', params.id)
        .order('created_at', { ascending: false })
        .limit(5)

      setRecentDeals(recentDealsData || [])

    } catch (error) {
      console.error('Error loading partner:', error)
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

  const getTierColor = (tier) => {
    switch (tier) {
      case 'platinum': return 'bg-purple-100 text-purple-800'
      case 'gold': return 'bg-yellow-100 text-yellow-800'
      case 'silver': return 'bg-gray-100 text-gray-800'
      case 'bronze': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
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

  if (!partner) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Partner Not Found</h2>
            <p className="text-gray-600 mb-6">This partner doesn't exist or you don't have access.</p>
            <Link
              href="/partner-manager/partners"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Partners
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
            href="/partner-manager/partners"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <ArrowLeft className="h-5 w-5 mr-1" />
            Back to Partners
          </Link>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <User className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {partner.first_name} {partner.last_name}
                </h1>
                <p className="text-gray-600">{partner.organization?.name}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
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
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.pipelineValue)}</p>
                <p className="text-sm text-gray-600">Pipeline Value</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.openTickets}</p>
                <p className="text-sm text-gray-600">Open Tickets</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.closedWonDeals}</p>
                <p className="text-sm text-gray-600">Won Deals</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact Information */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Contact Information</h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Mail className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium text-gray-900">{partner.email}</p>
                  </div>
                </div>

                {partner.phone && (
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <Phone className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Phone</p>
                      <p className="font-medium text-gray-900">{partner.phone}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Joined</p>
                    <p className="font-medium text-gray-900">
                      {new Date(partner.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Organization Details */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Organization Details</h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Organization Name</p>
                    <p className="font-medium text-gray-900">{partner.organization?.name}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <Award className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Partner Tier</p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTierColor(partner.organization?.tier)}`}>
                      <Award className="h-3 w-3 mr-1" />
                      {partner.organization?.tier?.charAt(0).toUpperCase() + partner.organization?.tier?.slice(1)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Percent className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Discount Percentage</p>
                    <p className="font-medium text-gray-900">{partner.organization?.discount_percentage}%</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">MDF Allocation</p>
                    <p className="font-medium text-gray-900">
                      {formatCurrency(partner.organization?.mdf_allocation)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Deals */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Recent Deals</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {recentDeals.length > 0 ? (
                  recentDeals.map((deal) => (
                    <div key={deal.id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 truncate">
                            {deal.customer_name}
                          </h3>
                          <p className="text-sm text-gray-600 truncate">
                            {deal.customer_company} • {formatCurrency(deal.deal_value)}
                          </p>
                        </div>
                        <div className="ml-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStageColor(deal.stage)}`}>
                            {deal.stage?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center">
                    <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No deals yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Activity Summary */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Activity Summary</h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Deals</span>
                  <span className="text-sm font-semibold text-gray-900">{stats.totalDeals}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Pipeline Value</span>
                  <span className="text-sm font-semibold text-gray-900">{formatCurrency(stats.pipelineValue)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Won Deals</span>
                  <span className="text-sm font-semibold text-gray-900">{stats.closedWonDeals}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Open Tickets</span>
                  <span className="text-sm font-semibold text-gray-900">{stats.openTickets}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}