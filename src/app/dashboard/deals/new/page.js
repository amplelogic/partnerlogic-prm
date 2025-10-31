// src/app/dashboard/deals/new/page.js
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, User, Mail, Building2, DollarSign, AlertTriangle, CheckCircle } from 'lucide-react'

export default function NewDealPage() {
  const [partner, setPartner] = useState(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})
  const [success, setSuccess] = useState(false)
  
  const [formData, setFormData] = useState({
  customer_name: '',
  customer_email: '',
  customer_company: '',
  customer_phone: '',
  deal_value: '',
  stage: 'new_deal',  // ✅ NEW - Use this instead
  priority: 'medium',
  support_type_needed: 'sales',
  notes: '',
  expected_close_date: ''
})

  const router = useRouter()
  const supabase = createClient()

  const stages = [
  { value: 'new_deal', label: 'New Deal' },
  { value: 'need_analysis', label: 'Need Analysis' },
  { value: 'proposal', label: 'Proposal' },
  { value: 'negotiation', label: 'Negotiation' }
]

  const priorities = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' }
  ]

  const supportTypes = [
    { value: 'sales', label: 'Sales Support' },
    { value: 'presales', label: 'Pre-sales Engineering' },
    { value: 'technical', label: 'Technical Support' },
    { value: 'accounts', label: 'Account Management' }
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
      }
    } catch (error) {
      console.error('Error loading partner:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.customer_name.trim()) {
      newErrors.customer_name = 'Customer name is required'
    }

    if (!formData.customer_email.trim()) {
      newErrors.customer_email = 'Customer email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.customer_email)) {
      newErrors.customer_email = 'Please enter a valid email address'
    }

    if (!formData.customer_company.trim()) {
      newErrors.customer_company = 'Company name is required'
    }

    if (formData.deal_value && (isNaN(formData.deal_value) || parseFloat(formData.deal_value) < 0)) {
      newErrors.deal_value = 'Please enter a valid deal value'
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

    const dealData = {
      partner_id: partner.id,
      customer_name: formData.customer_name.trim(),
      customer_email: formData.customer_email.trim(),
      customer_company: formData.customer_company.trim(),
      deal_value: formData.deal_value ? parseFloat(formData.deal_value) : null,
      stage: formData.stage,
      admin_stage: 'urs',
      priority: formData.priority,
      support_type_needed: formData.support_type_needed,
      notes: formData.notes.trim() || null
    }

    const { data, error } = await supabase
      .from('deals')
      .insert([dealData])
      .select()

    if (error) throw error

    // Create initial activity log
    if (data[0]) {
      await supabase
        .from('deal_activities')
        .insert([{
          deal_id: data[0].id,
          user_id: partner.auth_user_id,
          activity_type: 'created',
          description: `Deal registered by ${partner.first_name} ${partner.last_name}`
        }])

      // ✅ NEW: Send email notification to admin
      // Replace the email sending block (around line 289) with:
try {
  const { data: adminSettings } = await supabase
    .from('admin_settings')
    .select('deal_notification_email')
    .not('deal_notification_email', 'is', null)
    .limit(1)
    .single()

  if (adminSettings?.deal_notification_email) {
    console.log('📧 Sending email to:', adminSettings.deal_notification_email)
    
    const { data: emailData, error: emailError } = await supabase.functions.invoke('send-deal-notification', {
  body: {
    dealData: {
      id: data[0].id,
      customer_name: formData.customer_name,
      customer_company: formData.customer_company,
      customer_email: formData.customer_email,
      deal_value: formData.deal_value,
      stage: formData.stage,
      priority: formData.priority,
      support_type_needed: formData.support_type_needed,
      notes: formData.notes
    },
    partnerData: {
      name: `${partner.first_name} ${partner.last_name}`,
      email: partner.email,
      organization: partner.organization?.name,
      tier: partner.organization?.tier
    }
  }
})

console.log('📬 Email response:', { emailData, emailError })

if (emailError) {
  console.error('❌ Email failed:', emailError)
} else {
  console.log('✅ Email sent!')
}
  }
} catch (emailError) {
  console.error('❌ Email exception:', emailError)
}
    }

    setSuccess(true)
    
    // Redirect after a short delay
    setTimeout(() => {
      router.push(`/dashboard/deals/${data[0].id}`)
    }, 2000)

  } catch (error) {
    console.error('Error creating deal:', error)
    setErrors({ submit: 'Failed to register deal. Please try again.' })
  } finally {
    setSaving(false)
  }
}


  if (loading) {
    return (
      <div className="py-6">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/3 mb-6"></div>
            <div className="bg-white rounded-xl p-6">
              <div className="space-y-6">
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
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Deal Registered Successfully!</h2>
            <p className="text-gray-600 mb-6">
              Your deal has been registered and our team has been notified. You'll be redirected to the deal details page shortly.
            </p>
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="py-6">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4">
            <Link
              href="/dashboard/deals"
              className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-1" />
              Back to Deals
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mt-4">Register New Deal</h1>
          <p className="text-gray-600 mt-1">
            Add a new sales opportunity to your pipeline
          </p>
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

            {/* Customer Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <User className="h-5 w-5 mr-2 text-gray-400" />
                Customer Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="customer_name" className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Name *
                  </label>
                  <input
                    type="text"
                    name="customer_name"
                    id="customer_name"
                    value={formData.customer_name}
                    onChange={handleInputChange}
                    className={`block w-full text-black px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.customer_name ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
                    }`}
                    placeholder="Enter customer contact name"
                  />
                  {errors.customer_name && (
                    <p className="mt-1 text-sm text-red-600">{errors.customer_name}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="customer_email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="customer_email"
                    id="customer_email"
                    value={formData.customer_email}
                    onChange={handleInputChange}
                    className={`block w-full px-3 text-black py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.customer_email ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
                    }`}
                    placeholder="customer@company.com"
                  />
                  {errors.customer_email && (
                    <p className="mt-1 text-sm text-red-600">{errors.customer_email}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="customer_company" className="block text-sm font-medium text-gray-700 mb-2">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    name="customer_company"
                    id="customer_company"
                    value={formData.customer_company}
                    onChange={handleInputChange}
                    className={`block w-full px-3 text-black py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.customer_company ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
                    }`}
                    placeholder="Enter company name"
                  />
                  {errors.customer_company && (
                    <p className="mt-1 text-sm text-red-600">{errors.customer_company}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="customer_phone" className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="customer_phone"
                    id="customer_phone"
                    value={formData.customer_phone}
                    onChange={handleInputChange}
                    className="block w-full px-3 py-2 text-black border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>
            </div>

            {/* Deal Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <DollarSign className="h-5 w-5 mr-2 text-gray-400" />
                Deal Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="deal_value" className="block text-sm font-medium text-gray-700 mb-2">
                    Deal Value (USD)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <DollarSign className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="number"
                      name="deal_value"
                      id="deal_value"
                      min="0"
                      step="0.01"
                      value={formData.deal_value}
                      onChange={handleInputChange}
                      className={`block w-full pl-10 pr-3 py-2 text-black border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.deal_value ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
                      }`}
                      placeholder="50000.00"
                    />
                  </div>
                  {errors.deal_value && (
                    <p className="mt-1 text-sm text-red-600">{errors.deal_value}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="stage" className="block text-sm font-medium text-gray-700 mb-2">
                    Current Stage
                  </label>
                  <select
                    name="stage"
                    id="stage"
                    value={formData.stage}
                    onChange={handleInputChange}
                    className="block w-full px-3 py-2 text-black border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {stages.map(stage => (
                      <option key={stage.value} value={stage.value}>
                        {stage.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
                    Priority Level
                  </label>
                  <select
                    name="priority"
                    id="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                    className="block w-full px-3 py-2 text-black border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {priorities.map(priority => (
                      <option key={priority.value} value={priority.value}>
                        {priority.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="support_type_needed" className="block text-sm font-medium text-gray-700 mb-2">
                    Support Type Needed
                  </label>
                  <select
                    name="support_type_needed"
                    id="support_type_needed"
                    value={formData.support_type_needed}
                    onChange={handleInputChange}
                    className="block w-full px-3 py-2 text-black border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {supportTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Building2 className="h-5 w-5 mr-2 text-gray-400" />
                Additional Information
              </h3>
              
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                  Notes & Requirements
                </label>
                <textarea
                  name="notes"
                  id="notes"
                  rows={4}
                  value={formData.notes}
                  onChange={handleInputChange}
                  className="block w-full px-3 py-2 text-black border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Add any additional notes, requirements, or context about this deal..."
                />
              </div>
            </div>

            {/* Partner Information Display */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Registering Partner</h4>
              <div className="text-sm text-gray-600">
                <p><strong>Partner:</strong> {partner?.first_name} {partner?.last_name}</p>
                <p><strong>Organization:</strong> {partner?.organization?.name}</p>
                <p><strong>Tier:</strong> {partner?.organization?.tier?.charAt(0).toUpperCase() + partner?.organization?.tier?.slice(1)}</p>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-xl flex items-center justify-between">
            <Link
              href="/dashboard/deals"
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
                  Registering...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Register Deal
                </>
              )}
            </button>
          </div>
        </form>

        {/* Help Text */}
        <div className="mt-6 bg-blue-50 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <CheckCircle className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">What happens next?</h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc pl-5 space-y-1">
                  <li>Your deal will be registered in the system immediately</li>
                  <li>The appropriate AmpleLogic team will be notified based on support type</li>
                  <li>A dedicated partner manager will reach out within 24 hours</li>
                  <li>You'll be able to track progress and collaborate on this deal</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}