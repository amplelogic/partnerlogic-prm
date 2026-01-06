// src/app/dashboard/mdf/new/page.js
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, Save, DollarSign, Calendar, Target, 
  AlertTriangle, CheckCircle, Users, TrendingUp, BarChart3
} from 'lucide-react'

export default function NewMDFRequestPage() {
  const [partner, setPartner] = useState(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})
  const [success, setSuccess] = useState(false)
  const [mdfRequests, setMdfRequests] = useState([])
  
  const [formData, setFormData] = useState({
    campaign_name: '',
    requested_amount: '',
    campaign_type: 'event',
    start_date: '',
    end_date: '',
    description: '',
    target_audience: '',
    expected_leads: '',
    expected_meetings: '',
    expected_deals: '',
    objectives: []
  })

  const router = useRouter()
  const supabase = createClient()

  const campaignTypes = [
    { value: 'event', label: 'Trade Show / Event', description: 'Conferences, exhibitions, networking events' },
    { value: 'digital', label: 'Digital Marketing', description: 'Online ads, social media, content marketing' },
    { value: 'webinar', label: 'Webinars / Training', description: 'Educational content, product demos' },
    { value: 'print', label: 'Print Materials', description: 'Brochures, flyers, promotional items' },
    { value: 'partner_event', label: 'Partner Event', description: 'Joint events with other partners' }
  ]

  const objectiveOptions = [
    'Lead Generation',
    'Brand Awareness',
    'Customer Education',
    'Product Launch',
    'Partner Recruitment',
    'Market Penetration'
  ]

  useEffect(() => {
    loadPartner()
  }, [])

  const loadPartner = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data: partnerData } = await supabase
        .from('partners')
        .select(`
          *,
          organization:organizations(*)
        `)
        .eq('auth_user_id', user.id)
        .single()

      if (partnerData) {
        setPartner(partnerData)

        // Load MDF requests to calculate remaining budget
        const { data: mdfData } = await supabase
          .from('mdf_requests')
          .select('*')
          .eq('partner_id', partnerData.id)

        if (mdfData) {
          setMdfRequests(mdfData)
        }
      }
    } catch (error) {
      console.error('Error loading partner:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    
    if (name === 'objectives') {
      if (checked) {
        setFormData(prev => ({
          ...prev,
          objectives: [...prev.objectives, value]
        }))
      } else {
        setFormData(prev => ({
          ...prev,
          objectives: prev.objectives.filter(obj => obj !== value)
        }))
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }))
    }
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.campaign_name.trim()) {
      newErrors.campaign_name = 'Campaign name is required'
    }

    if (!formData.requested_amount || parseFloat(formData.requested_amount) <= 0) {
      newErrors.requested_amount = 'Please enter a valid amount'
    }

    const requestedAmount = parseFloat(formData.requested_amount)
    const mdfAllocation = partner?.organization?.mdf_allocation || 0
    
    // Calculate total approved MDF (approved or disbursed)
    const totalApproved = mdfRequests
      .filter(req => req.status === 'approved' || req.status === 'disbursed')
      .reduce((sum, req) => sum + (req.approved_amount || 0), 0)
    
    const remainingBudget = Math.max(0, mdfAllocation - totalApproved)
    
    if (requestedAmount > remainingBudget) {
      newErrors.requested_amount = `Amount exceeds your remaining budget of ${formatCurrency(remainingBudget)}`
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Campaign description is required'
    }

    if (!formData.start_date) {
      newErrors.start_date = 'Start date is required'
    }

    if (!formData.end_date) {
      newErrors.end_date = 'End date is required'
    }

    if (formData.start_date && formData.end_date && new Date(formData.start_date) >= new Date(formData.end_date)) {
      newErrors.end_date = 'End date must be after start date'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    try {
      setSaving(true)

      const requestData = {
        partner_id: partner.id,
        campaign_name: formData.campaign_name.trim(),
        requested_amount: parseFloat(formData.requested_amount),
        status: 'pending',
        roi_metrics: {
          campaign_type: formData.campaign_type,
          start_date: formData.start_date,
          end_date: formData.end_date,
          description: formData.description.trim(),
          target_audience: formData.target_audience.trim(),
          expected_leads: formData.expected_leads ? parseInt(formData.expected_leads) : null,
          expected_meetings: formData.expected_meetings ? parseInt(formData.expected_meetings) : null,
          expected_deals: formData.expected_deals ? parseInt(formData.expected_deals) : null,
          objectives: formData.objectives
        }
      }

      const { data, error } = await supabase
        .from('mdf_requests')
        .insert([requestData])
        .select()

      if (error) throw error

      setSuccess(true)
      
      // Redirect after a short delay
      setTimeout(() => {
        router.push(`/dashboard/mdf/${data[0].id}`)
      }, 2000)

    } catch (error) {
      console.error('Error creating MDF request:', error)
      setErrors({ submit: 'Failed to submit MDF request. Please try again.' })
    } finally {
      setSaving(false)
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
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/3 mb-6"></div>
            <div className="bg-white rounded-xl p-6 space-y-6">
              {[...Array(6)].map((_, i) => (
                <div key={i}>
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="py-6">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">MDF Request Submitted!</h2>
            <p className="text-gray-600 mb-6">
              Your Marketing Development Fund request has been submitted for review. You'll receive an email confirmation shortly.
            </p>
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        </div>
      </div>
    )
  }

  const mdfAllocation = partner?.organization?.mdf_allocation || 0
  
  // Calculate total approved MDF (same logic as main MDF page)
  const totalApproved = mdfRequests
    .filter(req => req.status === 'approved' || req.status === 'disbursed')
    .reduce((sum, req) => sum + (req.approved_amount || 0), 0)
  
  const remainingBudget = Math.max(0, mdfAllocation - totalApproved)

  return (
    <div className="py-6">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4">
            <Link
              href="/dashboard/mdf"
              className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-1" />
              Back to MDF
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mt-4">Request Marketing Development Funds</h1>
          <p className="text-gray-600 mt-1">
            Submit a request for marketing support funding
          </p>
        </div>

        {/* Budget Overview */}
        <div className="bg-blue-50 rounded-xl border border-blue-200 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-blue-900 mb-2">Your MDF Allocation</h3>
              <p className="text-3xl font-bold text-blue-700">{formatCurrency(mdfAllocation)}</p>
              <p className="text-sm text-blue-600 mt-1">Annual budget available</p>
            </div>
            <div>
              <h3 className="text-lg font-medium text-blue-900 mb-2">Remaining Budget</h3>
              <p className="text-3xl font-bold text-blue-700">{formatCurrency(remainingBudget)}</p>
              <p className="text-sm text-blue-600 mt-1">Available for new requests</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 space-y-6">
            {/* General Errors */}
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                <span>{errors.submit}</span>
              </div>
            )}

            {/* Campaign Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Target className="h-5 w-5 mr-2 text-gray-400" />
                Campaign Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label htmlFor="campaign_name" className="block text-sm font-medium text-gray-700 mb-2">
                    Campaign Name *
                  </label>
                  <input
                    type="text"
                    name="campaign_name"
                    id="campaign_name"
                    value={formData.campaign_name}
                    onChange={handleInputChange}
                    className={`block w-full px-3 py-2 text-black border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.campaign_name ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
                    }`}
                    placeholder="Q1 2025 Trade Show Participation"
                  />
                  {errors.campaign_name && (
                    <p className="mt-1 text-sm text-red-600">{errors.campaign_name}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="requested_amount" className="block text-sm font-medium text-gray-700 mb-2">
                    Requested Amount (USD) *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <DollarSign className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="number"
                      name="requested_amount"
                      id="requested_amount"
                      min="1"
                      step="0.01"
                      value={formData.requested_amount}
                      onChange={handleInputChange}
                      className={`block w-full pl-10 pr-3 py-2 text-black border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.requested_amount ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
                      }`}
                      placeholder="15000.00"
                    />
                  </div>
                  {errors.requested_amount && (
                    <p className="mt-1 text-sm text-red-600">{errors.requested_amount}</p>
                  )}
                  {formData.requested_amount && parseFloat(formData.requested_amount) > remainingBudget && (
                    <div className="mt-2 bg-yellow-50 border border-yellow-200 text-yellow-800 px-3 py-2 rounded-lg flex items-start space-x-2">
                      <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">
                        Warning: Requested amount (${parseFloat(formData.requested_amount).toLocaleString()}) exceeds your remaining budget (${remainingBudget.toLocaleString()}). 
                        This request may be partially approved or rejected.
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="campaign_type" className="block text-sm font-medium text-gray-700 mb-2">
                    Campaign Type
                  </label>
                  <select
                    name="campaign_type"
                    id="campaign_type"
                    value={formData.campaign_type}
                    onChange={handleInputChange}
                    className="block w-full px-3 py-2 text-black border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {campaignTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-sm text-gray-500">
                    {campaignTypes.find(t => t.value === formData.campaign_type)?.description}
                  </p>
                </div>

                <div>
                  <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    name="start_date"
                    id="start_date"
                    value={formData.start_date}
                    onChange={handleInputChange}
                    className={`block w-full px-3 py-2 text-black border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.start_date ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
                    }`}
                  />
                  {errors.start_date && (
                    <p className="mt-1 text-sm text-red-600">{errors.start_date}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-2">
                    End Date *
                  </label>
                  <input
                    type="date"
                    name="end_date"
                    id="end_date"
                    value={formData.end_date}
                    onChange={handleInputChange}
                    className={`block w-full px-3 py-2 text-black border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.end_date ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
                    }`}
                  />
                  {errors.end_date && (
                    <p className="mt-1 text-sm text-red-600">{errors.end_date}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Campaign Details */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Campaign Details</h3>
              
              <div className="space-y-6">
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                    Campaign Description *
                  </label>
                  <textarea
                    name="description"
                    id="description"
                    rows={4}
                    value={formData.description}
                    onChange={handleInputChange}
                    className={`block w-full px-3 py-2 text-black border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${
                      errors.description ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
                    }`}
                    placeholder="Describe your campaign objectives, target audience, and planned activities..."
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="target_audience" className="block text-sm font-medium text-gray-700 mb-2">
                    Target Audience
                  </label>
                  <input
                    type="text"
                    name="target_audience"
                    id="target_audience"
                    value={formData.target_audience}
                    onChange={handleInputChange}
                    className="block w-full px-3 py-2 text-black border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enterprise decision makers, IT professionals, etc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Campaign Objectives</label>
                  <div className="grid grid-cols-2 gap-3">
                    {objectiveOptions.map(objective => (
                      <label key={objective} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          name="objectives"
                          value={objective}
                          checked={formData.objectives.includes(objective)}
                          onChange={handleInputChange}
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{objective}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Expected Results */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <BarChart3 className="h-5 w-5 mr-2 text-gray-400" />
                Expected Results
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label htmlFor="expected_leads" className="block text-sm font-medium text-gray-700 mb-2">
                    Expected Leads
                  </label>
                  <input
                    type="number"
                    name="expected_leads"
                    id="expected_leads"
                    min="0"
                    value={formData.expected_leads}
                    onChange={handleInputChange}
                    className="block w-full px-3 py-2 text-black border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="50"
                  />
                </div>

                <div>
                  <label htmlFor="expected_meetings" className="block text-sm font-medium text-gray-700 mb-2">
                    Expected Meetings
                  </label>
                  <input
                    type="number"
                    name="expected_meetings"
                    id="expected_meetings"
                    min="0"
                    value={formData.expected_meetings}
                    onChange={handleInputChange}
                    className="block w-full px-3 py-2 text-black border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="15"
                  />
                </div>

                <div>
                  <label htmlFor="expected_deals" className="block text-sm font-medium text-gray-700 mb-2">
                    Expected Deals
                  </label>
                  <input
                    type="number"
                    name="expected_deals"
                    id="expected_deals"
                    min="0"
                    value={formData.expected_deals}
                    onChange={handleInputChange}
                    className="block w-full px-3 py-2 text-black border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="3"
                  />
                </div>
              </div>
            </div>

            {/* Partner Information */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Partner Information</h4>
              <div className="text-sm text-gray-600">
                <p><strong>Partner:</strong> {partner?.first_name} {partner?.last_name}</p>
                <p><strong>Organization:</strong> {partner?.organization?.name}</p>
                <p><strong>Tier:</strong> {partner?.organization?.tier?.charAt(0).toUpperCase() + partner?.organization?.tier?.slice(1)}</p>
                <p><strong>MDF Allocation:</strong> {formatCurrency(mdfAllocation)}</p>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-xl flex items-center justify-between">
            <Link
              href="/dashboard/mdf"
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Submit Request
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}