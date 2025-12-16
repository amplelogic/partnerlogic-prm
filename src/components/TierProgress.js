// src/components/TierProgress.js
'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, Award, Target, Zap } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { calculateTierProgress, getTierColor, getTierBadgeColor } from '@/lib/tierSystem'

export default function TierProgress({ currentTier, totalRevenue }) {
  const [progressData, setProgressData] = useState({
    progress: 0,
    progressInTier: 0,
    nextTier: null,
    amountToNext: 0,
    currentTierRevenue: 0,
    totalRevenue: 0,
    tierRange: 0
  })
  const [tierLabel, setTierLabel] = useState('')
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  
  const tierColor = getTierColor(currentTier)
  const badgeColor = getTierBadgeColor(currentTier)

  useEffect(() => {
    const loadProgress = async () => {
      try {
        setLoading(true)
        
        // Fetch tier label from tier_settings
        const { data: tierData } = await supabase
          .from('tier_settings')
          .select('tier_label')
          .eq('tier_name', currentTier)
          .single()
        
        if (tierData) {
          setTierLabel(tierData.tier_label)
        }
        
        const data = await calculateTierProgress(totalRevenue, currentTier)
        setProgressData(data)
      } catch (error) {
        console.error('Error calculating tier progress:', error)
      } finally {
        setLoading(false)
      }
    }

    loadProgress()
  }, [totalRevenue, currentTier, supabase])

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
              <div>
                <div className="h-5 bg-gray-200 rounded w-32 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-24"></div>
              </div>
            </div>
            <div className="h-8 w-20 bg-gray-200 rounded-full"></div>
          </div>
          <div className="h-4 bg-gray-200 rounded mb-8"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-24 bg-gray-200 rounded-xl"></div>
            <div className="h-24 bg-gray-200 rounded-xl"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className={`w-12 h-12 bg-gradient-to-r ${tierColor} rounded-xl flex items-center justify-center`}>
            <Award className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Partner Tier Progress</h3>
            <p className="text-sm text-gray-600">Your current tier and progression</p>
          </div>
        </div>
        <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${badgeColor}`}>
          {tierLabel}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="space-y-3 mb-6">
        <div className="flex items-center justify-between text-sm mb-8">
          <span className="font-medium text-gray-700">Overall Progress</span>
          <span className="font-bold text-gray-900">{progressData.progress.toFixed(1)}%</span>
        </div>
        
        <div className="relative">
          {/* Background bar */}
          <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
            {/* Progress bar with gradient */}
            <div
              className={`h-full bg-gradient-to-r ${tierColor} transition-all duration-500 ease-out relative`}
              style={{ width: `${progressData.progress}%` }}
            >
              {/* Animated shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
            </div>
          </div>
          
          {/* Tier markers */}
          <div className="absolute top-0 left-0 right-0 flex justify-between -mt-6">
            {['Bronze', 'Silver', 'Gold', 'Platinum'].map((tier, index) => (
              <div key={tier} className="flex flex-col items-center" style={{ marginLeft: index === 0 ? '0' : '-24px' }}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mb-1 ${
                  progressData.progress >= (index + 1) * 25
                    ? `bg-gradient-to-r ${getTierColor(tier.toLowerCase())} text-white shadow-lg`
                    : 'bg-gray-300 text-gray-600'
                }`}>
                  {(index + 1) * 25}%
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mt-8">
        <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
          <div className="flex items-center space-x-2 mb-2">
            <TrendingUp className="h-4 w-4 text-blue-600" />
            <span className="text-xs font-medium text-blue-700">Total Revenue</span>
          </div>
          <p className="text-2xl font-bold text-blue-900">{formatCurrency(totalRevenue)}</p>
          <p className="text-xs text-blue-600 mt-1">All closed deals</p>
        </div>

        {progressData.nextTier && (
          <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
            <div className="flex items-center space-x-2 mb-2">
              <Target className="h-4 w-4 text-purple-600" />
              <span className="text-xs font-medium text-purple-700">To {progressData.nextTier}</span>
            </div>
            <p className="text-2xl font-bold text-purple-900">{formatCurrency(progressData.amountToNext)}</p>
            <p className="text-xs text-purple-600 mt-1">Revenue needed</p>
          </div>
        )}
        
        {!progressData.nextTier && (
          <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
            <div className="flex items-center space-x-2 mb-2">
              <Zap className="h-4 w-4 text-purple-600" />
              <span className="text-xs font-medium text-purple-700">Status</span>
            </div>
            <p className="text-lg font-bold text-purple-900">Max Tier!</p>
            <p className="text-xs text-purple-600 mt-1">You've reached the top</p>
          </div>
        )}
      </div>

      {/* Next Tier Info */}
      {progressData.nextTier && (
        <div className="mt-4 p-4 bg-gray-50 rounded-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Next Milestone: {progressData.nextTier.charAt(0).toUpperCase() + progressData.nextTier.slice(1)} Tier
                </p>
                <p className="text-xs text-gray-600">
                  Unlock enhanced benefits and higher commissions
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}