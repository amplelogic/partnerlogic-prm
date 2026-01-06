// src/app/admin/mdf/[id]/page.js
'use client'

import { useState, useEffect, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, Calendar, DollarSign, Target, Users, 
  TrendingUp, BarChart3, CheckCircle, Clock, XCircle,
  AlertCircle, Building2, Award, User, Mail, Edit2, Save, AlertTriangle
} from 'lucide-react'

export default function AdminMDFDetailPage({ params }) {
  const unwrappedParams = use(params)
  const [mdfRequest, setMdfRequest] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [editingStatus, setEditingStatus] = useState(false)
  const [editingAmount, setEditingAmount] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  const [approvedAmount, setApprovedAmount] = useState('')
  const [allocationWarning, setAllocationWarning] = useState(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (unwrappedParams.id) {
      loadMDFRequest()
    }
  }, [unwrappedParams.id])

  // Check MDF allocation when status or approved amount changes
  useEffect(() => {
    const checkAllocation = async () => {
      if (!mdfRequest || newStatus !== 'approved' || mdfRequest.status === 'approved') {
        setAllocationWarning(null)
        return
      }

      const partnerOrg = mdfRequest.partner?.organization
      const mdfAllocation = partnerOrg?.mdf_allocation || 0
      
      // Get current approved amount for this partner
      const { data: existingRequests } = await supabase
        .from('mdf_requests')
        .select('approved_amount')
        .eq('partner_id', mdfRequest.partner_id)
        .in('status', ['approved', 'disbursed'])
        .neq('id', mdfRequest.id)
      
      const currentApproved = (existingRequests || []).reduce(
        (sum, req) => sum + (req.approved_amount || 0), 0
      )
      const newApprovedAmount = parseFloat(approvedAmount) || 0
      const totalAfterApproval = currentApproved + newApprovedAmount
      const remaining = mdfAllocation - currentApproved
      
      if (totalAfterApproval > mdfAllocation) {
        setAllocationWarning({
          mdfAllocation,
          currentApproved,
          remaining,
          requestedApproval: newApprovedAmount,
          exceeded: totalAfterApproval - mdfAllocation
        })
      } else {
        setAllocationWarning(null)
      }
    }

    checkAllocation()
  }, [newStatus, approvedAmount, mdfRequest])

  const loadMDFRequest = async () => {
    try {
      setLoading(true)

      // Get MDF request with partner data
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
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          router.push('/admin/mdf')
          return
        }
        throw error
      }

      setMdfRequest(mdfData)
      setNewStatus(mdfData.status)
      setApprovedAmount(mdfData.approved_amount || mdfData.requested_amount)
    } catch (error) {
      console.error('Error loading MDF request:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async () => {
    try {
      setUpdating(true)

      // Validate MDF allocation before approval
      if (newStatus === 'approved' && !mdfRequest.approved_at) {
        const partnerOrg = mdfRequest.partner?.organization
        const mdfAllocation = partnerOrg?.mdf_allocation || 0
        
        // Get current approved amount for this partner
        const { data: existingRequests } = await supabase
          .from('mdf_requests')
          .select('approved_amount')
          .eq('partner_id', mdfRequest.partner_id)
          .in('status', ['approved', 'disbursed'])
          .neq('id', mdfRequest.id)
        
        const currentApproved = (existingRequests || []).reduce(
          (sum, req) => sum + (req.approved_amount || 0), 0
        )
        const newApprovedAmount = parseFloat(approvedAmount)
        const totalAfterApproval = currentApproved + newApprovedAmount
        
        if (totalAfterApproval > mdfAllocation) {
          const remaining = mdfAllocation - currentApproved
          alert(
            `Cannot approve this request. This would exceed the partner's MDF allocation.\n\n` +
            `Annual Allocation: $${mdfAllocation.toLocaleString()}\n` +
            `Currently Approved: $${currentApproved.toLocaleString()}\n` +
            `Available: $${remaining.toLocaleString()}\n` +
            `Requested Approval: $${newApprovedAmount.toLocaleString()}\n\n` +
            `Please approve only up to $${remaining.toLocaleString()} to stay within the 100% utilization limit.`
          )
          setUpdating(false)
          return
        }
      }

      const updateData = {
        status: newStatus,
        ...(newStatus === 'approved' && !mdfRequest.approved_at && { 
          approved_at: new Date().toISOString(),
          approved_amount: parseFloat(approvedAmount)
        }),
        ...(editingAmount && { approved_amount: parseFloat(approvedAmount) })
      }

      const { error } = await supabase
        .from('mdf_requests')
        .update(updateData)
        .eq('id', mdfRequest.id)

      if (error) throw error

      // Reload the request
      await loadMDFRequest()
      setEditingStatus(false)
      setEditingAmount(false)
    } catch (error) {
      console.error('Error updating MDF request:', error)
      alert('Failed to update MDF request')
    } finally {
      setUpdating(false)
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
            <p className="text-gray-600 mb-6">The MDF request you're looking for doesn't exist.</p>
            <Link
              href="/admin/mdf"
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
              href="/admin/mdf"
              className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-1" />
              Back to MDF Requests
            </Link>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{mdfRequest.campaign_name}</h1>
              <p className="text-gray-600 mt-1">MDF Request Details - Admin View</p>
            </div>
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

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        MDF Allocation
                      </label>
                      <p className="text-sm text-gray-900">
                        {formatCurrency(mdfRequest.partner?.organization?.mdf_allocation || 0)}
                      </p>
                    </div>

                    <div>
                      <Link
                        href={`/admin/partners/${mdfRequest.partner?.id}`}
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
            {/* Status Management */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Status Management</h2>
                  {!editingStatus && (
                    <button
                      onClick={() => setEditingStatus(true)}
                      className="text-blue-600 hover:text-blue-700 text-sm"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
              
              <div className="p-6 space-y-4">
                {editingStatus ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Change Status
                      </label>
                      <select
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-black"
                      >
                        <option value="pending">Pending Review</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                        <option value="disbursed">Disbursed</option>
                      </select>
                    </div>

                    {/* MDF Allocation Warning */}
                    {allocationWarning && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-start space-x-3">
                          <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <h4 className="text-sm font-semibold text-red-900 mb-2">MDF Allocation Exceeded</h4>
                            <div className="text-sm text-red-700 space-y-1">
                              <p>This approval would exceed the partner's annual MDF allocation:</p>
                              <ul className="list-disc list-inside space-y-0.5 mt-2">
                                <li>Annual Allocation: <strong>${allocationWarning.mdfAllocation.toLocaleString()}</strong></li>
                                <li>Currently Approved: <strong>${allocationWarning.currentApproved.toLocaleString()}</strong></li>
                                <li>Available: <strong>${allocationWarning.remaining.toLocaleString()}</strong></li>
                                <li>Requested Approval: <strong>${allocationWarning.requestedApproval.toLocaleString()}</strong></li>
                                <li className="text-red-800 font-semibold">Would Exceed By: <strong>${allocationWarning.exceeded.toLocaleString()}</strong></li>
                              </ul>
                              <p className="mt-2 font-medium">Maximum approvable amount: ${allocationWarning.remaining.toLocaleString()}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex space-x-3">
                      <button
                        onClick={handleStatusUpdate}
                        disabled={updating}
                        className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                      >
                        {updating ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setEditingStatus(false)
                          setNewStatus(mdfRequest.status)
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Status
                    </label>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(mdfRequest.status)}`}>
                      <StatusIcon className="h-4 w-4 mr-1" />
                      {mdfRequest.status?.charAt(0).toUpperCase() + mdfRequest.status?.slice(1)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Financial Management */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Financial Details</h2>
                  {!editingAmount && (
                    <button
                      onClick={() => setEditingAmount(true)}
                      className="text-blue-600 hover:text-blue-700 text-sm"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
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

                {editingAmount ? (
                  <>
                    <div className="pt-4 border-t border-gray-200">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Approved Amount
                      </label>
                      <div className="relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 sm:text-sm">$</span>
                        </div>
                        <input
                          type="number"
                          value={approvedAmount}
                          onChange={(e) => setApprovedAmount(e.target.value)}
                          className="block w-full pl-7 pr-12 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          placeholder="0.00"
                        />
                      </div>
                      {allocationWarning && newStatus === 'approved' && (
                        <p className="mt-2 text-sm text-red-600 flex items-center">
                          <AlertTriangle className="h-4 w-4 mr-1" />
                          Exceeds available budget by ${allocationWarning.exceeded.toLocaleString()}
                        </p>
                      )}
                    </div>

                    <div className="flex space-x-3">
                      <button
                        onClick={handleStatusUpdate}
                        disabled={updating}
                        className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                      >
                        {updating ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setEditingAmount(false)
                          setApprovedAmount(mdfRequest.approved_amount || mdfRequest.requested_amount)
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  mdfRequest.approved_amount && (
                    <div className="pt-4 border-t border-gray-200">
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        Approved Amount
                      </label>
                      <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(mdfRequest.approved_amount)}
                      </p>
                    </div>
                  )
                )}
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
          </div>
        </div>
      </div>
    </div>
  )
}
