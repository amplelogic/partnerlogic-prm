'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { 
  Users, BarChart3, DollarSign, TrendingUp,
  ArrowRight, Building2, Award, CheckCircle, Clock
} from 'lucide-react'

export default function PartnerManagerDashboardPage() {
  const [stats, setStats] = useState({
    totalPartners: 0,
    totalDeals: 0,
    totalPipelineValue: 0,
    activeDeals: 0
  })
  const [myPartners, setMyPartners] = useState([])
  const [recentDeals, setRecentDeals] = useState([])
  const [loading, setLoading] = useState(true)
  const [partnerManager, setPartnerManager] = useState(null)

  const supabase = createClient()

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
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
      setPartnerManager(managerData)

      // Get partners assigned to this manager
      const { data: partnersData, error: partnersError } = await supabase
        .from('partners')
        .select(`
          *,
          organization:organizations(*)
        `)
        .eq('partner_manager_id', managerData.id)
        .order('created_at', { ascending: false })

      if (partnersError) {
        console.error('Partners error:', partnersError)
      }

      const partners = partnersData || []
      setMyPartners(partners.slice(0, 5)) // Show top 5

      // Get all deals from assigned partners
      const partnerIds = partners.map(p => p.id)
      
      let allDeals = []
      if (partnerIds.length > 0) {
        const { data: dealsData, error: dealsError } = await supabase
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

        if (dealsError) {
          console.error('Deals error:', dealsError)
        }

        allDeals = dealsData || []
      }

      // Calculate stats
      const totalDeals = allDeals.length
      const pipelineValue = allDeals.reduce((sum, deal) => sum + (Number(deal.deal_value) || 0), 0)
      const activeDeals = allDeals.filter(d => !['closed_won', 'closed_lost'].includes(d.stage)).length

      setStats({
        totalPartners: partners.length,
        totalDeals,
        totalPipelineValue: pipelineValue,
        activeDeals
      })

      setRecentDeals(allDeals.slice(0, 5))

    } catch (error) {
      console.error('Error loading dashboard data:', error)
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

  const getTierColor = (tier) => {
    switch (tier) {
      case 'platinum': return 'bg-purple-100 text-purple-800'
      case 'gold': return 'bg-yellow-100 text-yellow-800'
      case 'silver': return 'bg-gray-100 text-gray-800'
      case 'bronze': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">
            Welcome back, {partnerManager?.first_name}!
          </h2>
          <p className="text-gray-600 mt-1">
            Here's an overview of your partners' performance
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Partners */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.totalPartners}</p>
                <p className="text-sm text-gray-600">My Partners</p>
              </div>
            </div>
            <Link 
              href="/partner-manager/partners"
              className="mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center"
            >
              View All <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </div>

          {/* Total Deals */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.totalDeals}</p>
                <p className="text-sm text-gray-600">Total Deals</p>
              </div>
            </div>
            <Link 
              href="/partner-manager/deals"
              className="mt-4 text-sm text-green-600 hover:text-green-700 font-medium flex items-center"
            >
              View All <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </div>

          {/* Pipeline Value */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalPipelineValue)}</p>
                <p className="text-sm text-gray-600">Pipeline Value</p>
              </div>
            </div>
          </div>

          {/* Active Deals */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.activeDeals}</p>
                <p className="text-sm text-gray-600">Active Deals</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* My Partners */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">My Partners</h3>
                <Link 
                  href="/partner-manager/partners"
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center"
                >
                  View all <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </div>
            </div>
            <div className="divide-y divide-gray-200">
              {myPartners.length > 0 ? (
                myPartners.map((partner) => (
                  <div key={partner.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                          <Building2 className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {partner.first_name} {partner.last_name}
                          </h4>
                          <p className="text-sm text-gray-600">{partner.organization?.name}</p>
                        </div>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTierColor(partner.organization?.tier)}`}>
                        <Award className="h-3 w-3 mr-1" />
                        {partner.organization?.tier?.charAt(0).toUpperCase() + partner.organization?.tier?.slice(1)}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No partners assigned yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Deals */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Recent Deals</h3>
                <Link 
                  href="/partner-manager/deals"
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center"
                >
                  View all <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </div>
            </div>
            <div className="divide-y divide-gray-200">
              {recentDeals.length > 0 ? (
                recentDeals.map((deal) => (
                  <div key={deal.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 truncate">
                          {deal.customer_name}
                        </h4>
                        <p className="text-sm text-gray-600 truncate">
                          {deal.customer_company} • {formatCurrency(deal.deal_value)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Partner: {deal.partners?.first_name} {deal.partners?.last_name}
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
      </div>
    </div>
  )
}