// src/app/admin/partners/page.js
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { 
  Search, Filter, Eye, Edit2, Users, Building2,
  Mail, Calendar, ChevronDown, Award, Percent,
  DollarSign, BarChart3, TrendingUp, Plus, User, Trash2
} from 'lucide-react'

export default function AdminPartnersPage() {
  const [partners, setPartners] = useState([])
  const [filteredPartners, setFilteredPartners] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [tierFilter, setTierFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState('desc')
  const [showFilters, setShowFilters] = useState(false)
  const [deleting, setDeleting] = useState(null)

  const supabase = createClient()

  const tiers = [
    { value: 'all', label: 'All Tiers' },
    { value: 'bronze', label: 'Bronze' },
    { value: 'silver', label: 'Silver' },
    { value: 'gold', label: 'Gold' },
    { value: 'platinum', label: 'Platinum' }
  ]

  const partnerTypes = [
    { value: 'all', label: 'All Types' },
    { value: 'reseller', label: 'Reseller' },
    { value: 'referral', label: 'Referral' },
    { value: 'full_cycle', label: 'Full-Cycle' },
    { Give: 'white_label', label: 'White-Label' }
  ]

  useEffect(() => {
    loadPartners()
  }, [])

  useEffect(() => {
    filterAndSortPartners()
  }, [partners, searchTerm, tierFilter, typeFilter, sortBy, sortOrder])

  const loadPartners = async () => {
    try {
      setLoading(true)
      
      const { data: partnersData, error } = await supabase
      .from('partners')
      .select(`
        *,
        organization:organizations(*),
        partner_manager:partner_managers(*)
      `)
      .order('created_at', { ascending: false })

      if (error) throw error

      setPartners(partnersData || [])
    } catch (error) {
      console.error('Error loading partners:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (partnerId) => {
    if (!confirm('Are you sure you want to delete this partner? This action cannot be undone.')) {
      return
    }

    try {
      setDeleting(partnerId)
      
      // Get partner to find auth_user_id and organization
      const partner = partners.find(p => p.id === partnerId)
      
      if (!partner) {
        throw new Error('Partner not found')
      }

      // Delete partner record
      const { error: partnerError } = await supabase
        .from('partners')
        .delete()
        .eq('id', partnerId)

      if (partnerError) throw partnerError

      // Delete auth user
      if (partner.auth_user_id) {
        const { error: authError } = await supabase.auth.admin.deleteUser(partner.auth_user_id)
        if (authError) {
          console.error('Error deleting auth user:', authError)
        }
      }

      // Remove from local state
      setPartners(partners.filter(p => p.id !== partnerId))
      
    } catch (error) {
      console.error('Error deleting partner:', error)
      alert('Failed to delete partner. Please try again.')
    } finally {
      setDeleting(null)
    }
  }

  const filterAndSortPartners = () => {
    let filtered = [...partners]

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(partner =>
        partner.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        partner.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        partner.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        partner.organization?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply tier filter
    if (tierFilter !== 'all') {
      filtered = filtered.filter(partner => partner.organization?.tier === tierFilter)
    }

    // Apply type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(partner => partner.organization?.type === typeFilter)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue

      if (sortBy === 'name') {
        aValue = `${a.first_name} ${a.last_name}`
        bValue = `${b.first_name} ${b.last_name}`
      } else if (sortBy === 'organization') {
        aValue = a.organization?.name || ''
        bValue = b.organization?.name || ''
      } else if (sortBy === 'tier') {
        const tierOrder = { bronze: 1, silver: 2, gold: 3, platinum: 4 }
        aValue = tierOrder[a.organization?.tier] || 0
        bValue = tierOrder[b.organization?.tier] || 0
      } else {
        aValue = a[sortBy]
        bValue = b[sortBy]
      }

      if (sortBy === 'created_at') {
        aValue = new Date(aValue)
        bValue = new Date(bValue)
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
      return 0
    })

    setFilteredPartners(filtered)
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

  const calculateStats = () => {
    const totalPartners = filteredPartners.length
    const platinumPartners = filteredPartners.filter(p => p.organization?.tier === 'platinum').length
    const goldPartners = filteredPartners.filter(p => p.organization?.tier === 'gold').length
    const activePartners = filteredPartners.filter(p => p.status === 'active').length

    return { totalPartners, platinumPartners, goldPartners, activePartners }
  }

  const stats = calculateStats()

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
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Partner Management</h1>
              <p className="text-gray-600 mt-1">
                Manage partner organizations and their tier assignments
              </p>
            </div>
            <Link
              href="/admin/partners/new"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Register Partner
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.totalPartners}</p>
                <p className="text-sm text-gray-600">Total Partners</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Award className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.platinumPartners}</p>
                <p className="text-sm text-gray-600">Platinum Tier</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <Award className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.goldPartners}</p>
                <p className="text-sm text-gray-600">Gold Tier</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.activePartners}</p>
                <p className="text-sm text-gray-600">Active Partners</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              {/* Search */}
              <div className="relative flex-1 max-w-lg">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search by name, email, or organization..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-purple-500 focus:border-purple-500 sm:text-sm text-gray-900"
                />
              </div>

              {/* Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
                <ChevronDown className={`ml-2 h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* Expandable Filters */}
            {showFilters && (
              <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tier
                  </label>
                  <select
                    value={tierFilter}
                    onChange={(e) => setTierFilter(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900"
                  >
                    {tiers.map(tier => (
                      <option key={tier.value} value={tier.value}>
                        {tier.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Partner Type
                  </label>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900"
                  >
                    {partnerTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sort By
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900"
                  >
                    <option value="created_at">Join Date</option>
                    <option value="name">Name</option>
                    <option value="organization">Organization</option>
                    <option value="tier">Tier</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Order
                  </label>
                  <button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    {sortOrder === 'asc' ? '↑ Ascending' : '↓ Descending'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Partners List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {filteredPartners.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {partners.length === 0 ? 'No partners registered yet' : 'No partners match your filters'}
              </h3>
              <p className="text-gray-600">
                {partners.length === 0 
                  ? 'Partners will appear here as they join the program.'
                  : 'Try adjusting your search or filter criteria.'
                }
              </p>
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
                          <div className="flex items-center capitalize">
                            {partner.organization?.type?.replace('_', ' ')}
                          </div>
                          {partner.partner_manager && (
                            <div className="flex items-center text-indigo-600">
                              <User className="h-4 w-4 mr-1" />
                              {partner.partner_manager.first_name} {partner.partner_manager.last_name}
                            </div>
                          )}
                        </div>

                        <div className="mt-2 flex items-center space-x-6 text-sm text-gray-500">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            Joined {new Date(partner.created_at).toLocaleDateString()}
                          </div>
                          <div className="flex items-center">
                            <Percent className="h-4 w-4 mr-1" />
                            {partner.organization?.discount_percentage || 0}% Discount
                          </div>
                          <div className="flex items-center">
                            <DollarSign className="h-4 w-4 mr-1" />
                            ${(partner.organization?.mdf_allocation || 0).toLocaleString()} MDF
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <Link
                        href={`/admin/partners/${partner.id}`}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Link>
                      <Link
                        href={`/admin/partners/${partner.id}/edit`}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <Edit2 className="h-4 w-4 mr-1" />
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(partner.id)}
                        disabled={deleting === partner.id}
                        className="inline-flex items-center px-3 py-1.5 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                      >
                        {deleting === partner.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                        ) : (
                          <>
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </>
                        )}
                      </button>
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