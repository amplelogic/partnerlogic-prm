// src/lib/tierSystem.js
export const TIER_THRESHOLDS = {
  bronze: { min: 0, max: 50000, progress: 25 },
  silver: { min: 50000, max: 150000, progress: 50 },
  gold: { min: 150000, max: 300000, progress: 75 },
  platinum: { min: 300000, max: Infinity, progress: 100 }
}

export const TIER_ORDER = ['bronze', 'silver', 'gold', 'platinum']

export function calculateTierProgress(totalRevenue, currentTier) {
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

export function getTierColor(tier) {
  switch (tier) {
    case 'platinum': return 'from-purple-500 to-purple-700'
    case 'gold': return 'from-yellow-500 to-yellow-700'
    case 'silver': return 'from-gray-400 to-gray-600'
    case 'bronze': return 'from-orange-500 to-orange-700'
    default: return 'from-gray-400 to-gray-600'
  }
}

export function getTierBadgeColor(tier) {
  switch (tier) {
    case 'platinum': return 'bg-purple-100 text-purple-800'
    case 'gold': return 'bg-yellow-100 text-yellow-800'
    case 'silver': return 'bg-gray-100 text-gray-800'
    case 'bronze': return 'bg-orange-100 text-orange-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}