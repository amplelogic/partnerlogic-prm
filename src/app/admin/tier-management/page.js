// src/app/admin/tier-management/page.js
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  Save, AlertTriangle, CheckCircle, Award, 
  DollarSign, Percent, TrendingUp, RefreshCw,
  Info, ArrowRight
} from 'lucide-react'

export default function TierManagementPage() {
  const [tiers, setTiers] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [hasChanges, setHasChanges] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    loadTiers()
  }, [])

  const loadTiers = async () => {
    try {
      setLoading(true)
      setError('')

      const { data, error: fetchError } = await supabase
        .from('tier_settings')
        .select('*')
        .order('min_revenue', { ascending: true })

      if (fetchError) throw fetchError

      if (data && data.length > 0) {
        setTiers(data)
      } else {
        // Initialize with default tiers if none exist
        await initializeDefaultTiers()
      }
    } catch (err) {
      console.error('Error loading tiers:', err)
      setError('Failed to load tier settings')
    } finally {
      setLoading(false)
    }
  }

  const initializeDefaultTiers = async () => {
    const defaultTiers = [
      {
        tier_name: 'bronze',
        tier_label: 'Bronze',
        min_revenue: 0,
        max_revenue: 50000,
        discount_percentage: 5,
        mdf_allocation: 5000,
        bonus_amount: 1000,
        tier_order: 1,
        is_active: true
      },
      {
        tier_name: 'silver',
        tier_label: 'Silver',
        min_revenue: 50000,
        max_revenue: 150000,
        discount_percentage: 10,
        mdf_allocation: 10000,
        bonus_amount: 5000,
        tier_order: 2,
        is_active: true
      },
      {
        tier_name: 'gold',
        tier_label: 'Gold',
        min_revenue: 150000,
        max_revenue: 300000,
        discount_percentage: 15,
        mdf_allocation: 25000,
        bonus_amount: 15000,
        tier_order: 3,
        is_active: true
      },
      {
        tier_name: 'platinum',
        tier_label: 'Platinum',
        min_revenue: 300000,
        max_revenue: 1000000,
        discount_percentage: 20,
        mdf_allocation: 50000,
        bonus_amount: 35000,
        tier_order: 4,
        is_active: true
      }
    ]

    try {
      const { data, error } = await supabase
        .from('tier_settings')
        .insert(defaultTiers)
        .select()

      if (error) throw error
      setTiers(data)
    } catch (err) {
      console.error('Error initializing tiers:', err)
      setError('Failed to initialize default tiers')
    }
  }

  const handleTierChange = (index, field, value) => {
    const updatedTiers = [...tiers]
    
    // Convert to number for numeric fields
    if (['min_revenue', 'max_revenue', 'discount_percentage', 'mdf_allocation'].includes(field)) {
      value = value === '' ? null : Number(value)
    }
    
    updatedTiers[index][field] = value
    setTiers(updatedTiers)
    setHasChanges(true)
    setSuccess('')
  }

  const validateTiers = () => {
    const errors = []

    // Check for overlapping ranges
    for (let i = 0; i < tiers.length; i++) {
      const tier = tiers[i]
      
      // Validate required fields
      if (!tier.tier_name || !tier.tier_label) {
        errors.push(`${tier.tier_label || 'Tier ' + (i + 1)}: Name and label are required`)
      }

      if (tier.min_revenue < 0) {
        errors.push(`${tier.tier_label}: Minimum revenue cannot be negative`)
      }

      if (tier.max_revenue !== null && tier.max_revenue <= tier.min_revenue) {
        errors.push(`${tier.tier_label}: Maximum revenue must be greater than minimum`)
      }

      if (tier.discount_percentage < 0 || tier.discount_percentage > 100) {
        errors.push(`${tier.tier_label}: Discount must be between 0 and 100`)
      }

      if (tier.mdf_allocation < 0) {
        errors.push(`${tier.tier_label}: MDF allocation cannot be negative`)
      }

      // Check if this tier's max matches next tier's min
      if (i < tiers.length - 1) {
        const nextTier = tiers[i + 1]
        if (tier.max_revenue !== null && tier.max_revenue !== nextTier.min_revenue) {
          errors.push(`${tier.tier_label}: Maximum revenue (${tier.max_revenue}) must equal ${nextTier.tier_label}'s minimum (${nextTier.min_revenue})`)
        }
      }
    }

    return errors
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError('')
      setSuccess('')

      // Validate
      const validationErrors = validateTiers()
      if (validationErrors.length > 0) {
        setError(validationErrors.join('; '))
        return
      }

      // Update all tiers
      const updates = tiers.map(tier => 
        supabase
          .from('tier_settings')
          .upsert({
            id: tier.id,
            tier_name: tier.tier_name,
            tier_label: tier.tier_label,
            min_revenue: tier.min_revenue,
            max_revenue: tier.max_revenue,
            discount_percentage: tier.discount_percentage,
            mdf_allocation: tier.mdf_allocation,
            bonus_amount: tier.bonus_amount,
            tier_order: tier.tier_order,
            is_active: tier.is_active,
            updated_at: new Date().toISOString()
          })
          .select()
      )

      const results = await Promise.all(updates)
      
      // Check for errors
      const hasError = results.some(result => result.error)
      if (hasError) {
        throw new Error('Failed to update some tiers')
      }

      setSuccess('Tier settings saved successfully!')
      setHasChanges(false)
      
      // Reload to get fresh data
      await loadTiers()

      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      console.error('Error saving tiers:', err)
      setError('Failed to save tier settings. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    if (confirm('Are you sure you want to reset to saved values? All unsaved changes will be lost.')) {
      loadTiers()
      setHasChanges(false)
      setSuccess('')
      setError('')
    }
  }

  const getTierColor = (tierName) => {
    switch (tierName) {
      case 'platinum': return 'from-purple-500 to-purple-700'
      case 'gold': return 'from-yellow-500 to-yellow-700'
      case 'silver': return 'from-gray-400 to-gray-600'
      case 'bronze': return 'from-orange-500 to-orange-700'
      default: return 'from-gray-400 to-gray-600'
    }
  }

  const getTierBadgeColor = (tierName) => {
    switch (tierName) {
      case 'platinum': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'gold': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'silver': return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'bronze': return 'bg-orange-100 text-orange-800 border-orange-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatCurrency = (amount) => {
    if (amount === null) return 'Unlimited'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl p-6 border">
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
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
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Tier Management</h1>
              <p className="text-gray-600 mt-1">
                Configure partner tier thresholds, benefits, and progression
              </p>
            </div>
            <div className="flex items-center space-x-3">
              {hasChanges && (
                <button
                  onClick={handleReset}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reset
                </button>
              )}
              <button
                onClick={handleSave}
                disabled={saving || !hasChanges}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Info Box */}
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex">
            <Info className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800 mb-1">Important Notes</h3>
              <ul className="text-sm text-blue-700 space-y-1 list-disc pl-5">
                <li>Changes will affect all new deals and partner tier calculations</li>
                <li>Existing partners will be re-evaluated based on their total closed deal revenue</li>
                <li>Make sure tier ranges don't overlap (max of one tier should equal min of next)</li>
                <li>Set max_revenue to empty/null for the highest tier to make it unlimited</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Tier Cards */}
        <div className="space-y-6">
          {tiers.map((tier, index) => (
            <div key={tier.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Tier Header */}
              <div className={`bg-gradient-to-r ${getTierColor(tier.tier_name)} px-6 py-4`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                      <Award className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">{tier.tier_label}</h3>
                      <p className="text-sm text-white/80">Tier {tier.tier_order} of {tiers.length}</p>
                    </div>
                  </div>
                  <span className={`px-4 py-2 rounded-full text-sm font-medium border-2 ${getTierBadgeColor(tier.tier_name)}`}>
                    {formatCurrency(tier.min_revenue)} - {formatCurrency(tier.max_revenue)}
                  </span>
                </div>
              </div>

              {/* Tier Configuration */}
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Tier Name (Read-only) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tier Name (Internal)
                    </label>
                    <input
                      type="text"
                      value={tier.tier_name}
                      disabled
                      className="block w-full px-3 py-2 text-black border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
                    />
                    <p className="mt-1 text-xs text-gray-500">Internal identifier - cannot be changed</p>
                  </div>

                  {/* Tier Label */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Display Label
                    </label>
                    <input
                      type="text"
                      value={tier.tier_label}
                      onChange={(e) => handleTierChange(index, 'tier_label', e.target.value)}
                      className="block w-full px-3 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., Bronze"
                    />
                    <p className="mt-1 text-xs text-gray-500">Label shown to partners</p>
                  </div>

                  {/* Min Revenue */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <DollarSign className="h-4 w-4 mr-1" />
                      Minimum Revenue
                    </label>
                    <input
                      type="number"
                      value={tier.min_revenue}
                      onChange={(e) => handleTierChange(index, 'min_revenue', e.target.value)}
                      className="block w-full px-3 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0"
                      min="0"
                    />
                    <p className="mt-1 text-xs text-gray-500">Starting revenue threshold (USD)</p>
                  </div>

                  {/* Max Revenue */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <TrendingUp className="h-4 w-4 mr-1" />
                      Maximum Revenue
                    </label>
                    <input
                      type="number"
                      value={tier.max_revenue === null ? '' : tier.max_revenue}
                      onChange={(e) => handleTierChange(index, 'max_revenue', e.target.value)}
                      className="block w-full px-3 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Leave empty for unlimited"
                      min={tier.min_revenue + 1}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      {index === tiers.length - 1 ? 'Leave empty for unlimited (highest tier)' : 'Must equal next tier\'s minimum'}
                    </p>
                  </div>

                  {/* Commission Percentage */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <Percent className="h-4 w-4 mr-1" />
                      Commission
                    </label>
                    <input
                      type="number"
                      value={tier.discount_percentage}
                      onChange={(e) => handleTierChange(index, 'discount_percentage', e.target.value)}
                      className="block w-full px-3 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0"
                      min="0"
                      max="100"
                      step="0.5"
                    />
                    <p className="mt-1 text-xs text-gray-500">Partner commission rate (0-100%)</p>
                  </div>

                  {/* MDF Allocation */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <DollarSign className="h-4 w-4 mr-1" />
                      MDF Allocation
                    </label>
                    <input
                      type="number"
                      value={tier.mdf_allocation}
                      onChange={(e) => handleTierChange(index, 'mdf_allocation', e.target.value)}
                      className="block w-full px-3 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0"
                      min="0"
                      step="1000"
                    />
                    <p className="mt-1 text-xs text-gray-500">Annual marketing fund (USD)</p>
                  </div>

                  {/* Bonus Amount */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <DollarSign className="h-4 w-4 mr-1 text-green-600" />
                      Bonus Amount
                    </label>
                    <input
                      type="number"
                      value={tier.bonus_amount || 0}
                      onChange={(e) => handleTierChange(index, 'bonus_amount', e.target.value)}
                      className="block w-full px-3 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0"
                      min="0"
                      step="100"
                    />
                    <p className="mt-1 text-xs text-gray-500">Bonus when tier max revenue is achieved</p>
                  </div>
                </div>

                {/* Revenue Range Preview */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700">Tier Benefits Summary</span>
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{tier.discount_percentage}%</div>
                      <div className="text-xs text-gray-600">Commission</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{formatCurrency(tier.mdf_allocation)}</div>
                      <div className="text-xs text-gray-600">MDF Fund</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">{formatCurrency(tier.max_revenue)}</div>
                      <div className="text-xs text-gray-600">Bonus Target</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">{formatCurrency(tier.bonus_amount || 0)}</div>
                      <div className="text-xs text-gray-600">Bonus Payout</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Save Button (Bottom) */}
        {hasChanges && (
          <div className="mt-8 flex items-center justify-end space-x-3">
            <button
              onClick={handleReset}
              className="inline-flex items-center px-6 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset Changes
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center px-6 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving Changes...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save All Changes
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}