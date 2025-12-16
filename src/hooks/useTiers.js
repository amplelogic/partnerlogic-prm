// src/hooks/useTiers.js
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useTiers() {
  const [tiers, setTiers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  const supabase = createClient()

  useEffect(() => {
    loadTiers()
  }, [])

  const loadTiers = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('tier_settings')
        .select('*')
        .eq('is_active', true)
        .order('tier_order', { ascending: true })

      if (fetchError) throw fetchError

      if (data && data.length > 0) {
        // Transform to format needed by forms
        const tierOptions = data.map(tier => ({
          value: tier.tier_name,
          label: tier.tier_label,
          discount: tier.discount_percentage,
          mdf: tier.mdf_allocation,
          minRevenue: tier.min_revenue,
          maxRevenue: tier.max_revenue
        }))
        
        setTiers(tierOptions)
      } else {
        // Fallback to default tiers if database is empty
        setTiers([
          { value: 'bronze', label: 'Bronze', discount: 5, mdf: 5000, minRevenue: 0, maxRevenue: 50000 },
          { value: 'silver', label: 'Silver', discount: 10, mdf: 10000, minRevenue: 50000, maxRevenue: 150000 },
          { value: 'gold', label: 'Gold', discount: 15, mdf: 25000, minRevenue: 150000, maxRevenue: 300000 },
          { value: 'platinum', label: 'Platinum', discount: 20, mdf: 50000, minRevenue: 300000, maxRevenue: null }
        ])
      }
    } catch (err) {
      console.error('Error loading tiers:', err)
      setError(err.message)
      
      // Fallback to default tiers on error
      setTiers([
        { value: 'bronze', label: 'Bronze', discount: 5, mdf: 5000, minRevenue: 0, maxRevenue: 50000 },
        { value: 'silver', label: 'Silver', discount: 10, mdf: 10000, minRevenue: 50000, maxRevenue: 150000 },
        { value: 'gold', label: 'Gold', discount: 15, mdf: 25000, minRevenue: 150000, maxRevenue: 300000 },
        { value: 'platinum', label: 'Platinum', discount: 20, mdf: 50000, minRevenue: 300000, maxRevenue: null }
      ])
    } finally {
      setLoading(false)
    }
  }

  const getTierByName = (tierName) => {
    return tiers.find(t => t.value === tierName)
  }

  const formatRevenue = (amount) => {
    if (amount === null) return 'Unlimited'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount)
  }

  return {
    tiers,
    loading,
    error,
    getTierByName,
    formatRevenue,
    reload: loadTiers
  }
}