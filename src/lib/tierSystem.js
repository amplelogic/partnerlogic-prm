// src/lib/tierSystem.js
import { createClient } from '@/lib/supabase/client'

// Fallback thresholds if database is unavailable
const FALLBACK_TIER_THRESHOLDS = {
  bronze: { min: 0, max: 50000, progress: 25, discount: 5, mdf: 5000 },
  silver: { min: 50000, max: 150000, progress: 50, discount: 10, mdf: 10000 },
  gold: { min: 150000, max: 300000, progress: 75, discount: 15, mdf: 25000 },
  platinum: { min: 300000, max: Infinity, progress: 100, discount: 20, mdf: 50000 }
}

export const TIER_ORDER = ['bronze', 'silver', 'gold', 'platinum']

// Cache for tier configurations
let cachedTierConfig = null
let cacheTimestamp = null
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

/**
 * Fetch tier configurations from database
 */
export async function getTierConfigurations() {
  // Return cached data if still valid
  if (cachedTierConfig && cacheTimestamp && (Date.now() - cacheTimestamp < CACHE_DURATION)) {
    return cachedTierConfig
  }

  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('tier_settings')
      .select('*')
      .eq('is_active', true)
      .order('tier_order', { ascending: true })

    if (error) throw error

    if (!data || data.length === 0) {
      console.warn('No tier settings found, using fallback')
      return FALLBACK_TIER_THRESHOLDS
    }

    // Convert database format to app format
    const tierConfig = {}
    data.forEach((tier, index) => {
      const maxRevenue = tier.max_revenue === null ? Infinity : tier.max_revenue
      tierConfig[tier.tier_name] = {
        min: parseFloat(tier.min_revenue),
        max: maxRevenue,
        progress: (index + 1) * 25, // 25% per tier
        discount: tier.discount_percentage,
        mdf: parseFloat(tier.mdf_allocation)
      }
    })

    // Update cache
    cachedTierConfig = tierConfig
    cacheTimestamp = Date.now()

    return tierConfig
  } catch (error) {
    console.error('Error fetching tier configurations:', error)
    return FALLBACK_TIER_THRESHOLDS
  }
}

/**
 * Get tier thresholds (with caching)
 */
export async function getTierThresholds() {
  return await getTierConfigurations()
}

/**
 * Clear the tier configuration cache
 * Call this after updating tier configurations
 */
export function clearTierCache() {
  cachedTierConfig = null
  cacheTimestamp = null
}

/**
 * Calculate tier progress based on total revenue
 */
export async function calculateTierProgress(totalRevenue, currentTier) {
  const TIER_THRESHOLDS = await getTierConfigurations()
  const tierInfo = TIER_THRESHOLDS[currentTier]
  
  if (!tierInfo) return { progress: 0, nextTier: null, amountToNext: 0 }
  
  // If already at max tier
  if (currentTier === 'platinum') {
    return {
      progress: 100,
      nextTier: null,
      amountToNext: 0,
      currentTierRevenue: totalRevenue,
      totalRevenue
    }
  }
  
  // Find next tier
  const currentTierIndex = TIER_ORDER.indexOf(currentTier)
  const nextTier = TIER_ORDER[currentTierIndex + 1]
  const nextTierThreshold = TIER_THRESHOLDS[nextTier]
  
  // Calculate progress within current tier
  const tierRange = tierInfo.max - tierInfo.min
  const revenueInTier = totalRevenue - tierInfo.min
  const progressInTier = (revenueInTier / tierRange) * 100
  
  // Calculate overall progress (0-100 scale)
  const baseProgress = tierInfo.progress - 25 // Start of current tier
  const tierProgressRange = 25 // Each tier is 25% of total
  const overallProgress = baseProgress + (progressInTier / 100) * tierProgressRange
  
  return {
    progress: Math.min(Math.max(overallProgress, 0), 100),
    progressInTier: Math.min(progressInTier, 100),
    nextTier,
    amountToNext: Math.max(nextTierThreshold.min - totalRevenue, 0),
    currentTierRevenue: revenueInTier,
    totalRevenue,
    tierRange
  }
}

/**
 * Determine appropriate tier based on revenue
 */
export async function calculateTierFromRevenue(totalRevenue) {
  const TIER_THRESHOLDS = await getTierConfigurations()
  
  for (const tier of TIER_ORDER.reverse()) {
    const tierInfo = TIER_THRESHOLDS[tier]
    if (totalRevenue >= tierInfo.min) {
      return tier
    }
  }
  
  return 'bronze' // Default to bronze if no match
}

/**
 * Get tier color gradient
 */
export function getTierColor(tier) {
  switch (tier) {
    case 'platinum': return 'from-purple-500 to-purple-700'
    case 'gold': return 'from-yellow-500 to-yellow-700'
    case 'silver': return 'from-gray-400 to-gray-600'
    case 'bronze': return 'from-orange-500 to-orange-700'
    default: return 'from-gray-400 to-gray-600'
  }
}

/**
 * Get tier badge color
 */
export function getTierBadgeColor(tier) {
  switch (tier) {
    case 'platinum': return 'bg-purple-100 text-purple-800'
    case 'gold': return 'bg-yellow-100 text-yellow-800'
    case 'silver': return 'bg-gray-100 text-gray-800'
    case 'bronze': return 'bg-orange-100 text-orange-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}