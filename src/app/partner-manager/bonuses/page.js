// src/app/partner-manager/bonuses/page.js
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { 
  TrendingUp, DollarSign, Award, Target, CheckCircle,
  Users, BarChart3, Trophy, AlertCircle, Eye,
  Calendar, Plus, XCircle
} from 'lucide-react'

export default function PartnerManagerBonusesPage() {
  const [partners, setPartners] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedPartner, setSelectedPartner] = useState(null)
  const [bonusData, setBonusData] = useState({
    period: '',
    amount: 0,
    status: 'earned',
    notes: ''
  })
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    loadPartnerBonuses()
  }, [])

  const loadPartnerBonuses = async () => {
    try {
      setLoading(true)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get partner manager
      const { data: pmData } = await supabase
        .from('partner_managers')
        .select('*')
        .eq('auth_user_id', user.id)
        .single()

      if (!pmData) return

      // Get all assigned partners with their organizations and tier settings
      const { data: partnersData } = await supabase
        .from('partners')
        .select(`
          *,
          organization:organizations(*),
          tier:tier_settings!inner(*)
        `)
        .eq('partner_manager_id', pmData.id)

      if (!partnersData) return

      // For each partner, get their deals and bonus history
      const partnersWithBonusData = await Promise.all(
        partnersData.map(async (partner) => {
          // Get closed won deals
          const { data: deals } = await supabase
            .from('deals')
            .select('deal_value')
            .eq('partner_id', partner.id)
            .eq('stage', 'closed_won')

          const totalRevenue = deals?.reduce((sum, deal) => sum + (deal.deal_value || 0), 0) || 0

          // Get bonus history
          const { data: bonuses } = await supabase
            .from('partner_bonuses')
            .select('*')
            .eq('partner_id', partner.id)
            .order('created_at', { ascending: false })

          return {
            ...partner,
            totalRevenue,
            bonuses: bonuses || [],
            progress: partner.tier[0]?.max_revenue 
              ? Math.min((totalRevenue / partner.tier[0].max_revenue) * 100, 100) 
              : 0
          }
        })
      )

      setPartners(partnersWithBonusData)
    } catch (error) {
      console.error('Error loading partner bonuses:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAwardBonus = (partner) => {
    setSelectedPartner(partner)
    setBonusData({
      period: new Date().toISOString().slice(0, 7), // YYYY-MM format
      amount: partner.tier[0]?.bonus_amount || 0,
      status: 'earned',
      notes: ''
    })
    setShowModal(true)
  }

  const handleSaveBonus = async () => {
    if (!selectedPartner) return

    try {
      setSaving(true)

      const { error } = await supabase
        .from('partner_bonuses')
        .insert([{
          partner_id: selectedPartner.id,
          period: bonusData.period,
          amount: parseFloat(bonusData.amount),
          status: bonusData.status,
          notes: bonusData.notes
        }])

      if (error) throw error

      setShowModal(false)
      setSelectedPartner(null)
      await loadPartnerBonuses()
    } catch (error) {
      console.error('Error awarding bonus:', error)
      alert('Failed to award bonus')
    } finally {
      setSaving(false)
    }
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
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const totalBonusesAwarded = partners.reduce((sum, p) => 
    sum + p.bonuses.reduce((s, b) => s + (b.amount || 0), 0), 0
  )
  const partnersAtTarget = partners.filter(p => p.progress >= 100).length

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Partner Bonuses</h1>
          <p className="text-gray-600 mt-1">
            Manage and track performance bonuses for your assigned partners
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Bonuses Awarded</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalBonusesAwarded)}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Partners at Target</p>
                <p className="text-2xl font-bold text-gray-900">{partnersAtTarget} / {partners.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Trophy className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Active Partners</p>
                <p className="text-2xl font-bold text-gray-900">{partners.length}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Partners List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Partner Performance</h2>
          </div>

          <div className="divide-y divide-gray-200">
            {partners.map((partner) => {
              const tierSetting = partner.tier[0]
              const isTargetMet = partner.progress >= 100
              const totalBonuses = partner.bonuses.reduce((sum, b) => sum + (b.amount || 0), 0)

              return (
                <div key={partner.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-lg">
                          {partner.first_name?.charAt(0)}{partner.last_name?.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {partner.first_name} {partner.last_name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {partner.organization?.name} • {tierSetting?.tier_label} Tier
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => handleAwardBonus(partner)}
                        className="inline-flex items-center px-3 py-1.5 border border-green-300 rounded-md text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 transition-colors"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Award Bonus
                      </button>
                      <Link
                        href={`/partner-manager/partners/${partner.id}`}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Link>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-600">Progress to Bonus Target</span>
                      <span className="font-medium text-gray-900">{partner.progress.toFixed(1)}%</span>
                    </div>
                    <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${isTargetMet ? 'bg-green-500' : 'bg-blue-500'}`}
                        style={{ width: `${partner.progress}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600 mb-1">Revenue</p>
                      <p className="font-semibold text-gray-900">{formatCurrency(partner.totalRevenue)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 mb-1">Target</p>
                      <p className="font-semibold text-gray-900">{formatCurrency(tierSetting?.max_revenue || 0)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 mb-1">Potential Bonus</p>
                      <p className="font-semibold text-green-600">{formatCurrency(tierSetting?.bonus_amount || 0)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 mb-1">Total Earned</p>
                      <p className="font-semibold text-blue-600">{formatCurrency(totalBonuses)}</p>
                    </div>
                  </div>

                  {/* Status */}
                  {isTargetMet && (
                    <div className="mt-3 flex items-center p-2 bg-green-50 border border-green-200 rounded-lg">
                      <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                      <span className="text-sm text-green-900 font-medium">Target Achieved!</span>
                    </div>
                  )}
                </div>
              )
            })}

            {partners.length === 0 && (
              <div className="text-center py-12">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Partners Assigned</h3>
                <p className="text-gray-600">You don't have any partners assigned to you yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Award Bonus Modal */}
      {showModal && selectedPartner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Award Bonus</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600">
                Partner: <span className="font-medium text-gray-900">
                  {selectedPartner.first_name} {selectedPartner.last_name}
                </span>
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Period</label>
                <input
                  type="month"
                  value={bonusData.period}
                  onChange={(e) => setBonusData({ ...bonusData, period: e.target.value })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                <input
                  type="number"
                  value={bonusData.amount}
                  onChange={(e) => setBonusData({ ...bonusData, amount: e.target.value })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg"
                  min="0"
                  step="100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={bonusData.status}
                  onChange={(e) => setBonusData({ ...bonusData, status: e.target.value })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="earned">Earned</option>
                  <option value="pending">Pending Approval</option>
                  <option value="paid">Paid</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                <textarea
                  value={bonusData.notes}
                  onChange={(e) => setBonusData({ ...bonusData, notes: e.target.value })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows="3"
                  placeholder="Add any notes about this bonus..."
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveBonus}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Award Bonus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
