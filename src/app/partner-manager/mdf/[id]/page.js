// src/app/partner-manager/mdf/[id]/page.js
'use client'

import { useState, useEffect, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, Calendar, DollarSign, Target, Users, 
  TrendingUp, BarChart3, CheckCircle, Clock, XCircle,
  AlertCircle, Building2, Award, User, Mail
} from 'lucide-react'

export default function PartnerManagerMDFDetailPage({ params }) {
  const unwrappedParams = use(params)
  const [mdfRequest, setMdfRequest] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (unwrappedParams.id) {
      loadMDFRequest()
    }
  }, [unwrappedParams.id])

  const loadMDFRequest = async () => {
    try {
      setLoading(true)

      // Get current user and partner manager
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data: pmData } = await supabase
        .from('partner_managers')
        .select('*')
        .eq('auth_user_id', user.id)
        .single()

      if (!pmData) {
        router.push('/partner-manager')
        return
      }

      // Get partners assigned to this manager
      const { data: partnersData } = await supabase
        .from('partners')
        .select('id')
        .eq('partner_manager_id', pmData.id)

      const partnerIds = partnersData?.map(p => p.id) || []

      // Get MDF request with partner data (only if partner is assigned to this manager)
      const { data: mdfData, error } = await supabase
        .from('mdf_requests')
        .select(`
          *,
          partner:partners(
            id,
            first_name,
            last_name,
            email,
            phone,
            organization:organizations(
              id,
              name,
              tier,
              mdf_allocation,
              discount_percentage
            )
          )
        `)
        .eq('id', unwrappedParams.id)
        .in('partner_id', partnerIds)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          router.push('/partner-manager/mdf')
          return
        }
        throw error
      }

      setMdfRequest(mdfData)
    } catch (error) {
      console.error('Error loading MDF request:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'approved': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      case 'disbursed': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return Clock
      case 'approved': return CheckCircle
      case 'rejected': return XCircle
      case 'disbursed': return DollarSign
      default: return AlertCircle
    }
  }

  const formatCurrency = (amount) => {
    if (!amount) return '$0'
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
            <div className="h-8 bg-gray-300 rounded w-1/3 mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="h-64 bg-gray-200 rounded-xl"></div>
              </div>
              <div className="space-y-6">
                <div className="h-48 bg-gray-200 rounded-xl"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!mdfRequest) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">MDF Request not found</h2>
            <p className="text-gray-600 mb-6">The MDF request you're looking for doesn't exist or you don't have access to it.</p>
            <Link
              href="/partner-manager/mdf"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to MDF Requests
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const StatusIcon = getStatusIcon(mdfRequest.status)
  const roiMetrics = mdfRequest.roi_metrics || {}

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Link
              href="/partner-manager/mdf"
              className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-1" />
              Back to MDF Requests
            </Link>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{mdfRequest.campaign_name}</h1>
              <p className="text-gray-600 mt-1">MDF Request Details - Partner Manager View</p>
            </div>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(mdfRequest.status)}`}>
              <StatusIcon className="h-4 w-4 mr-1" />
              {mdfRequest.status?.charAt(0).toUpperCase() + mdfRequest.status?.slice(1)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Partner Information */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Partner Information</h2>
              </div>
              
              <div className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="h-16 w-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                      <User className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Partner Name
                      </label>
                      <p className="text-sm text-gray-900">
                        {mdfRequest.partner?.first_name} {mdfRequest.partner?.last_name}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <a href={`mailto:${mdfRequest.partner?.email}`} className="text-sm text-blue-600 hover:text-blue-700">
                        {mdfRequest.partner?.email}
                      </a>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Organization
                      </label>
                      <p className="text-sm text-gray-900">
                        {mdfRequest.partner?.organization?.name}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tier
                      </label>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        mdfRequest.partner?.organization?.tier === 'platinum' ? 'bg-purple-100 text-purple-800' :
                        mdfRequest.partner?.organization?.tier === 'gold' ? 'bg-yellow-100 text-yellow-800' :
                        mdfRequest.partner?.organization?.tier === 'silver' ? 'bg-gray-100 text-gray-800' :
                        'bg-orange-100 text-orange-800'
                      }`}>
                        {mdfRequest.partner?.organization?.tier?.charAt(0).toUpperCase() + mdfRequest.partner?.organization?.tier?.slice(1)}
                      </span>
                    </div>

                    <div className="col-span-2">
                      <Link
                        href={`/partner-manager/partners/${mdfRequest.partner?.id}`}
                        className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
                      >
                        View Partner Profile →
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Campaign Information */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Campaign Information</h2>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Campaign Name
                    </label>
                    <p className="text-sm text-gray-900">{mdfRequest.campaign_name}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Campaign Type
                    </label>
                    <p className="text-sm text-gray-900 capitalize">
                      {roiMetrics.campaign_type?.replace('_', ' ') || 'N/A'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date
                    </label>
                    <p className="text-sm text-gray-900">
                      {roiMetrics.start_date 
                        ? new Date(roiMetrics.start_date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })
                        : 'N/A'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Date
                    </label>
                    <p className="text-sm text-gray-900">
                      {roiMetrics.end_date 
                        ? new Date(roiMetrics.end_date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })
                        : 'N/A'}
                    </p>
                  </div>
                </div>

                {roiMetrics.description && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Campaign Description
                    </label>
                    <p className="text-sm text-gray-900 leading-relaxed">{roiMetrics.description}</p>
                  </div>
                )}

                {roiMetrics.target_audience && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Target Audience
                    </label>
                    <p className="text-sm text-gray-900 leading-relaxed">{roiMetrics.target_audience}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Expected ROI Metrics */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Expected ROI Metrics</h2>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <Users className="h-8 w-8 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-600">Expected Leads</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {roiMetrics.expected_leads || 0}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <Target className="h-8 w-8 text-purple-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-600">Expected Meetings</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {roiMetrics.expected_meetings || 0}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <TrendingUp className="h-8 w-8 text-green-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-600">Expected Deals</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {roiMetrics.expected_deals || 0}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Campaign Objectives */}
            {roiMetrics.objectives && roiMetrics.objectives.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Campaign Objectives</h2>
                </div>
                
                <div className="p-6">
                  <div className="flex flex-wrap gap-2">
                    {roiMetrics.objectives.map((objective, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800"
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        {objective}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Financial Details */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Financial Details</h2>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Requested Amount
                  </label>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(mdfRequest.requested_amount)}
                  </p>
                </div>

                {mdfRequest.approved_amount && (
                  <div className="pt-4 border-t border-gray-200">
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Approved Amount
                    </label>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(mdfRequest.approved_amount)}
                    </p>
                  </div>
                )}

                <div className="pt-4 border-t border-gray-200">
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Partner MDF Budget
                  </label>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatCurrency(mdfRequest.partner?.organization?.mdf_allocation || 0)}
                  </p>
                </div>
              </div>
            </div>

            {/* Request Timeline */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Request Timeline</h2>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="flex items-start space-x-3">
                  <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Submitted</p>
                    <p className="text-sm text-gray-600">
                      {new Date(mdfRequest.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>

                {mdfRequest.approved_at && (
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Approved</p>
                      <p className="text-sm text-gray-600">
                        {new Date(mdfRequest.approved_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Status Info */}
            <div className={`rounded-xl border p-4 ${
              mdfRequest.status === 'pending' ? 'bg-yellow-50 border-yellow-200' :
              mdfRequest.status === 'approved' ? 'bg-green-50 border-green-200' :
              mdfRequest.status === 'rejected' ? 'bg-red-50 border-red-200' :
              'bg-blue-50 border-blue-200'
            }`}>
              <div className="flex">
                <div className="flex-shrink-0">
                  <StatusIcon className={`h-5 w-5 ${
                    mdfRequest.status === 'pending' ? 'text-yellow-400' :
                    mdfRequest.status === 'approved' ? 'text-green-400' :
                    mdfRequest.status === 'rejected' ? 'text-red-400' :
                    'text-blue-400'
                  }`} />
                </div>
                <div className="ml-3">
                  <h3 className={`text-sm font-medium ${
                    mdfRequest.status === 'pending' ? 'text-yellow-800' :
                    mdfRequest.status === 'approved' ? 'text-green-800' :
                    mdfRequest.status === 'rejected' ? 'text-red-800' :
                    'text-blue-800'
                  }`}>
                    {mdfRequest.status === 'pending' && 'Pending Admin Review'}
                    {mdfRequest.status === 'approved' && 'Request Approved'}
                    {mdfRequest.status === 'rejected' && 'Request Rejected'}
                    {mdfRequest.status === 'disbursed' && 'Funds Disbursed'}
                  </h3>
                  <div className={`mt-2 text-sm ${
                    mdfRequest.status === 'pending' ? 'text-yellow-700' :
                    mdfRequest.status === 'approved' ? 'text-green-700' :
                    mdfRequest.status === 'rejected' ? 'text-red-700' :
                    'text-blue-700'
                  }`}>
                    <p>
                      {mdfRequest.status === 'pending' && 'This MDF request is awaiting admin approval.'}
                      {mdfRequest.status === 'approved' && 'The MDF request has been approved by admin.'}
                      {mdfRequest.status === 'rejected' && 'The MDF request was not approved.'}
                      {mdfRequest.status === 'disbursed' && 'The approved MDF funds have been disbursed.'}
                    </p>
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
