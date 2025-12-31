// src/app/dashboard/bonuses/page.js
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  TrendingUp, DollarSign, Award, Target, CheckCircle,
  Calendar, BarChart3, AlertCircle, Trophy
} from 'lucide-react'

export default function PartnerBonusesPage() {
  const [partner, setPartner] = useState(null)
  const [tierSettings, setTierSettings] = useState(null)
  const [deals, setDeals] = useState([])
  const [bonusHistory, setBonusHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadBonusData()
  }, [])

  const loadBonusData = async () => {
    try {
      setLoading(true)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get partner with organization and tier info
      const { data: partnerData } = await supabase
        .from('partners')
        .select(`
          *,
          organization:organizations(*)
        `)
        .eq('auth_user_id', user.id)
        .single()

      if (!partnerData) return

      setPartner(partnerData)

      // Get tier settings for current tier
      const { data: tierData } = await supabase
        .from('tier_settings')
        .select('*')
        .eq('tier_name', partnerData.organization.tier)
        .single()

      setTierSettings(tierData)

      // Get all closed won deals for revenue calculation
      const { data: dealsData } = await supabase
        .from('deals')
        .select('*')
        .eq('partner_id', partnerData.id)
        .eq('stage', 'closed_won')
        .order('created_at', { ascending: false })

      setDeals(dealsData || [])

      // Get bonus history (we'll create this table)
      const { data: bonusHistoryData } = await supabase
        .from('partner_bonuses')
        .select('*')
        .eq('partner_id', partnerData.id)
        .order('created_at', { ascending: false })

      setBonusHistory(bonusHistoryData || [])

    } catch (error) {
      console.error('Error loading bonus data:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateTotalRevenue = () => {
    return deals.reduce((sum, deal) => sum + (deal.deal_value || 0), 0)
  }

  const calculateProgress = () => {
    if (!tierSettings?.max_revenue) return 0
    const revenue = calculateTotalRevenue()
    return Math.min((revenue / tierSettings.max_revenue) * 100, 100)
  }

  const getTotalBonusesEarned = () => {
    return bonusHistory
      .filter(b => b.status === 'paid')
      .reduce((sum, b) => sum + (b.amount || 0), 0)
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount || 0)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'earned': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'paid': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const totalRevenue = calculateTotalRevenue()
  const progress = calculateProgress()
  const bonusTarget = tierSettings?.max_revenue || 0
  const bonusAmount = tierSettings?.bonus_amount || 0
  const remaining = Math.max(bonusTarget - totalRevenue, 0)
  const isTargetAchieved = totalRevenue >= bonusTarget

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Bonus Tracker</h1>
          <p className="text-gray-600 mt-1">
            Track your progress towards earning performance bonuses
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Current Revenue</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalRevenue)}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Bonus Target</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(bonusTarget)}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Target className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Bonus Payout</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(bonusAmount)}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <Trophy className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Progress Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Progress to Bonus</h2>
            <span className="text-sm font-medium text-gray-600">{progress.toFixed(1)}%</span>
          </div>

          {/* Progress Bar */}
          <div className="relative w-full h-6 bg-gray-200 rounded-full overflow-hidden mb-4">
            <div
              className={`h-full transition-all duration-500 ${
                isTargetAchieved ? 'bg-green-500' : 'bg-blue-500'
              }`}
              style={{ width: `${progress}%` }}
            ></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-medium text-gray-700">
                {formatCurrency(totalRevenue)} / {formatCurrency(bonusTarget)}
              </span>
            </div>
          </div>

          {isTargetAchieved ? (
            <div className="flex items-center p-4 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-green-900">
                  Congratulations! You've achieved your bonus target!
                </p>
                <p className="text-sm text-green-700 mt-1">
                  You've earned a bonus of {formatCurrency(bonusAmount)}. Contact your partner manager for payout details.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-blue-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-blue-900">
                  {formatCurrency(remaining)} remaining to reach your bonus target
                </p>
                <p className="text-sm text-blue-700 mt-1">
                  Keep closing deals to earn your {formatCurrency(bonusAmount)} bonus!
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Tier Information */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-sm p-6 text-white mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <Award className="h-6 w-6" />
                <h3 className="text-lg font-semibold">Your Tier: {tierSettings?.tier_label}</h3>
              </div>
              <p className="text-sm text-white/80">
                Reach {formatCurrency(bonusTarget)} in revenue (tier max) to unlock your {formatCurrency(bonusAmount)} performance bonus
              </p>
            </div>
            <TrendingUp className="h-12 w-12 text-white/40" />
          </div>
        </div>

        {/* Bonus History */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Bonus History</h2>
          </div>

          {bonusHistory.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {bonusHistory.map((bonus) => (
                    <tr key={bonus.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {bonus.period}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(bonus.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(bonus.status)}`}>
                          {bonus.status?.charAt(0).toUpperCase() + bonus.status?.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(bonus.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Bonus History Yet</h3>
              <p className="text-gray-600">
                Your bonus achievements will appear here once you reach your targets
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
