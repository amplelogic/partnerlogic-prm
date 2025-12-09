'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { 
  Search, Eye, Users, Building2, Mail, Calendar,
  Award, Percent, DollarSign, BarChart3
} from 'lucide-react'

export default function MyPartnersPage() {
  const [partners, setPartners] = useState([])
  const [filteredPartners, setFilteredPartners] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  const supabase = createClient()

  useEffect(() => {
    loadPartners()
  }, [])

  useEffect(() => {
    filterPartners()
  }, [partners, searchTerm])

  const loadPartners = async () => {
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

      // Get partners assigned to this manager
      const { data: partnersData, error } = await supabase
        .from('partners')
        .select(`
          *,
          organization:organizations(*)
        `)
        .eq('partner_manager_id', managerData.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Get deal counts for each partner
      const partnersWithStats = await Promise.all(
        (partnersData || []).map(async (partner) => {
          const { count: dealsCount } = await supabase
            .from('deals')
            .select('*', { count: 'exact', head: true })
            .eq('partner_id', partner.id)

          const { data: dealsData } = await supabase
            .from('deals')
            .select('deal_value')
            .eq('partner_id', partner.id)

          const pipelineValue = dealsData?.reduce((sum, deal) => sum + (Number(deal.deal_value) || 0), 0) || 0

          return {
            ...partner,
            dealsCount: dealsCount || 0,
            pipelineValue
          }
        })
      )

      setPartners(partnersWithStats)
    } catch (error) {
      console.error('Error loading partners:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterPartners = () => {
    if (!searchTerm) {
      setFilteredPartners(partners)
      return
    }

    const filtered = partners.filter(partner =>
      partner.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      partner.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      partner.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      partner.organization?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredPartners(filtered)
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

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">My Partners</h1>
          <p className="text-gray-600 mt-1">
            Partners assigned to you
          </p>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="p-6">
            <div className="relative max-w-lg">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by name, email, or organization..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-gray-900"
              />
            </div>
          </div>
        </div>

        {/* Partners List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {filteredPartners.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {partners.length === 0 ? 'No partners assigned yet' : 'No partners match your search'}
              </h3>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredPartners.map((partner) => (
                <div key={partner.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <Users className="h-6 w-6 text-white" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-1">
                          <h3 className="text-lg font-medium text-gray-900">
                            {partner.first_name} {partner.last_name}
                          </h3>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTierColor(partner.organization?.tier)}`}>
                            <Award className="h-3 w-3 mr-1" />
                            {partner.organization?.tier?.charAt(0).toUpperCase() + partner.organization?.tier?.slice(1)}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-6 text-sm text-gray-600">
                          <div className="flex items-center">
                            <Building2 className="h-4 w-4 mr-1" />
                            {partner.organization?.name}
                          </div>
                          <div className="flex items-center">
                            <Mail className="h-4 w-4 mr-1" />
                            {partner.email}
                          </div>
                        </div>

                        <div className="mt-2 flex items-center space-x-6 text-sm text-gray-500">
                          <div className="flex items-center">
                            <BarChart3 className="h-4 w-4 mr-1" />
                            {partner.dealsCount} Deals
                          </div>
                          <div className="flex items-center">
                            {formatCurrency(partner.pipelineValue, partner.currency)} Pipeline
                          </div>
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            Joined {new Date(partner.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <Link
                        href={`/partner-manager/partners/${partner.id}`}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}