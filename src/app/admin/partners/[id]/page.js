// src/app/admin/partners/[id]/page.js
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams } from 'next/navigation' // Changed import
import Link from 'next/link'
import { 
  ArrowLeft, Edit2, Mail, Phone, Building2, Calendar, 
  Award, Percent, DollarSign, BarChart3, Headphones,
  CheckCircle, Clock, XCircle, User, TrendingUp, FileText,
  AlertCircle, Shield, BookOpen
} from 'lucide-react'

export default function PartnerViewPage() { // Removed params from props
  const params = useParams() // Use useParams hook instead
  const [partner, setPartner] = useState(null)
  const [stats, setStats] = useState({
    totalDeals: 0,
    pipelineValue: 0,
    openTickets: 0,
    mdfRequests: 0
  })
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (params?.id) { // Add check for params.id
      loadPartnerData()
    }
  }, [params?.id]) // Update dependency

  const loadPartnerData = async () => {
    try {
      setLoading(true)

      // Get partner with organization
      const { data: partnerData, error: partnerError } = await supabase
        .from('partners')
        .select(`
          *,
          organization:organizations(*),
          partner_manager:partner_managers(*)
        `)
        .eq('id', params.id)
        .single()

      if (partnerError) throw partnerError

      setPartner(partnerData)

      // Get stats
      const [dealsResult, ticketsResult, mdfResult] = await Promise.all([
        supabase
          .from('deals')
          .select('deal_value')
          .eq('partner_id', params.id),
        supabase
          .from('support_tickets')
          .select('id', { count: 'exact', head: true })
          .eq('partner_id', params.id)
          .in('status', ['open', 'in_progress']),
        supabase
          .from('mdf_requests')
          .select('id', { count: 'exact', head: true })
          .eq('partner_id', params.id)
      ])

      const deals = dealsResult.data || []
      const pipelineValue = deals.reduce((sum, deal) => sum + (Number(deal.deal_value) || 0), 0)

      setStats({
        totalDeals: deals.length,
        pipelineValue,
        openTickets: ticketsResult.count || 0,
        mdfRequests: mdfResult.count || 0
      })

    } catch (error) {
      console.error('Error loading partner:', error)
    } finally {
      setLoading(false)
    }
  }

  // Rest of your component code stays the same...
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'inactive': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return CheckCircle
      case 'pending': return Clock
      case 'inactive': return XCircle
      default: return AlertCircle
    }
  }

  if (loading) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/4 mb-6"></div>
            <div className="bg-white rounded-xl p-6 space-y-4">
              <div className="h-6 bg-gray-200 rounded w-3/4"></div>
              <div className="h-6 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!partner) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Partner Not Found</h2>
            <p className="text-gray-600 mb-6">The partner you're looking for doesn't exist.</p>
            <Link
              href="/admin/partners"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Partners
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const StatusIcon = getStatusIcon(partner.status)

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin/partners"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <ArrowLeft className="h-5 w-5 mr-1" />
            Back to Partners
          </Link>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <User className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {partner.first_name} {partner.last_name}
                </h1>
                <p className="text-gray-600">{partner.organization?.name}</p>
              </div>
            </div>
            
            <Link
              href={`/admin/partners/${partner.id}/edit`}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Edit2 className="h-4 w-4 mr-2" />
              Edit Partner
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.totalDeals}</p>
                <p className="text-sm text-gray-600">Total Deals</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.pipelineValue)}</p>
                <p className="text-sm text-gray-600">Pipeline Value</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <Headphones className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.openTickets}</p>
                <p className="text-sm text-gray-600">Open Tickets</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.mdfRequests}</p>
                <p className="text-sm text-gray-600">MDF Requests</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact Information */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Contact Information</h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Mail className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium text-gray-900">{partner.email}</p>
                  </div>
                </div>

                {partner.phone && (
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <Phone className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Phone</p>
                      <p className="font-medium text-gray-900">{partner.phone}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <StatusIcon className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Account Status</p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(partner.status)}`}>
                      {partner.status?.charAt(0).toUpperCase() + partner.status?.slice(1)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Joined</p>
                    <p className="font-medium text-gray-900">
                      {new Date(partner.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                {partner.partner_manager && (
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <User className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Partner Manager</p>
                      <p className="font-medium text-gray-900">
                        {partner.partner_manager.first_name} {partner.partner_manager.last_name}
                      </p>
                      <p className="text-xs text-gray-500">{partner.partner_manager.email}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Organization Details */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Organization Details</h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Organization Name</p>
                    <p className="font-medium text-gray-900">{partner.organization?.name}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Shield className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Partner Type</p>
                    <p className="font-medium text-gray-900 capitalize">
                      {partner.organization?.type?.replace('_', ' ')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <Award className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Partner Tier</p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTierColor(partner.organization?.tier)}`}>
                      <Award className="h-3 w-3 mr-1" />
                      {partner.organization?.tier?.charAt(0).toUpperCase() + partner.organization?.tier?.slice(1)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Percent className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Discount Percentage</p>
                    <p className="font-medium text-gray-900">{partner.organization?.discount_percentage}%</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">MDF Allocation</p>
                    <p className="font-medium text-gray-900">
                      {formatCurrency(partner.organization?.mdf_allocation)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-cyan-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">MDF Status</p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      partner.organization?.mdf_enabled 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {partner.organization?.mdf_enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>

                {/* Learning Access Status - NEW */}
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Learning Access</p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      partner.organization?.learning_enabled 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {partner.organization?.learning_enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
              </div>
              <div className="p-6 space-y-3">
                <Link
                  href={`/admin/partners/${partner.id}/edit`}
                  className="flex items-center justify-between w-full px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <div className="flex items-center">
                    <Edit2 className="h-5 w-5 mr-3" />
                    <span className="font-medium">Edit Partner</span>
                  </div>
                </Link>

                <Link
                  href={`/admin/deals?partner=${partner.id}`}
                  className="flex items-center justify-between w-full px-4 py-3 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center">
                    <BarChart3 className="h-5 w-5 mr-3" />
                    <span className="font-medium">View Deals</span>
                  </div>
                  <span className="text-sm text-gray-500">{stats.totalDeals}</span>
                </Link>

                {partner.organization?.mdf_enabled && (
                  <Link
                    href={`/admin/mdf?partner=${partner.id}`}
                    className="flex items-center justify-between w-full px-4 py-3 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center">
                      <TrendingUp className="h-5 w-5 mr-3" />
                      <span className="font-medium">MDF Requests</span>
                    </div>
                    <span className="text-sm text-gray-500">{stats.mdfRequests}</span>
                  </Link>
                )}

                <button
                  className="flex items-center justify-between w-full px-4 py-3 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center">
                    <Mail className="h-5 w-5 mr-3" />
                    <span className="font-medium">Send Email</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Activity Summary */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Activity Summary</h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Deals</span>
                  <span className="text-sm font-semibold text-gray-900">{stats.totalDeals}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Pipeline Value</span>
                  <span className="text-sm font-semibold text-gray-900">{formatCurrency(stats.pipelineValue)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Open Tickets</span>
                  <span className="text-sm font-semibold text-gray-900">{stats.openTickets}</span>
                </div>
                {partner.organization?.mdf_enabled && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">MDF Requests</span>
                    <span className="text-sm font-semibold text-gray-900">{stats.mdfRequests}</span>
                  </div>
                )}
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Member Since</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {new Date(partner.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}