// src/app/dashboard/support/new/page.js
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, Save, AlertTriangle, CheckCircle, 
  Headphones, Wrench, Users, FileText, Upload,
  Info, Clock
} from 'lucide-react'
import { notifyAdmins, notifyPartnerManager, notifySupportUsers, createNotification, NotificationTemplates, sendSupportTicketEmail } from '@/lib/notifications'

export default function NewSupportTicketPage() {
  const [partner, setPartner] = useState(null)
  const [deals, setDeals] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})
  const [success, setSuccess] = useState(false)
  
  const [formData, setFormData] = useState({
    type: 'technical',
    subject: '',
    description: '',
    priority: 'medium',
    deal_id: '',
    attachments: []
  })

  const router = useRouter()
  const supabase = createClient()

  const supportTypes = [
    { 
      value: 'technical', 
      label: 'Technical Support', 
      icon: Wrench, 
      description: 'Issues with software, integration, or technical problems',
      sla: '4 hours'
    },
    { 
      value: 'sales', 
      label: 'Sales Support', 
      icon: Users, 
      description: 'Help with deal progression, pricing, or sales process',
      sla: '2 hours'
    },
    { 
      value: 'presales', 
      label: 'Pre-sales Engineering', 
      icon: FileText, 
      description: 'Technical consultation, demos, or solution design',
      sla: '8 hours'
    },
    { 
      value: 'accounts', 
      label: 'Account Management', 
      icon: Users, 
      description: 'Account issues, billing questions, or contract support',
      sla: '24 hours'
    }
  ]

  const priorities = [
    { 
      value: 'low', 
      label: 'Low Priority', 
      description: 'General questions or minor issues',
      color: 'bg-green-100 text-green-800'
    },
    { 
      value: 'medium', 
      label: 'Medium Priority', 
      description: 'Standard support requests',
      color: 'bg-yellow-100 text-yellow-800'
    },
    { 
      value: 'high', 
      label: 'High Priority', 
      description: 'Urgent issues affecting business operations',
      color: 'bg-orange-100 text-orange-800'
    },
    { 
      value: 'urgent', 
      label: 'Urgent', 
      description: 'Critical issues requiring immediate attention',
      color: 'bg-red-100 text-red-800'
    }
  ]

  useEffect(() => {
    loadPartnerAndDeals()
  }, [])

  const loadPartnerAndDeals = async () => {
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

        // Get partner's active deals for potential linking
        const { data: dealsData } = await supabase
          .from('deals')
          .select('id, customer_name, customer_company, stage')
          .eq('partner_id', partnerData.id)
          .not('stage', 'in', '(closed_won,closed_lost)')
          .order('created_at', { ascending: false })

        setDeals(dealsData || [])
      }
    } catch (error) {
      console.error('Error loading partner and deals:', error)
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

    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required'
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required'
    } else if (formData.description.trim().length < 20) {
      newErrors.description = 'Please provide at least 20 characters describing your issue'
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

      const ticketData = {
        partner_id: partner.id,
        deal_id: formData.deal_id || null,
        type: formData.type,
        subject: formData.subject.trim(),
        description: formData.description.trim(),
        priority: formData.priority,
        status: 'open'
      }

      const { data, error } = await supabase
        .from('support_tickets')
        .insert([ticketData])
        .select()

      if (error) throw error

      // Send notifications to admins, support users, and partner
      try {
        const userName = `${partner.first_name} ${partner.last_name}`
        const notification = NotificationTemplates.supportTicketCreated(
          data[0].id,
          formData.subject,
          userName
        )
        
        // Notify admins
        await notifyAdmins({
          ...notification,
          referenceId: data[0].id,
          referenceType: 'support_ticket'
        })
        
        // Notify support users
        await notifySupportUsers({
          ...notification,
          referenceId: data[0].id,
          referenceType: 'support_ticket'
        })
        
        // Notify partner manager if assigned
        if (partner.partner_manager_id) {
          await notifyPartnerManager({
            partnerId: partner.id,
            ...notification,
            referenceId: data[0].id,
            referenceType: 'support_ticket'
          })
        }
        
        // Send in-app notification to partner (confirmation)
        console.log('🔔 Sending confirmation notification to partner...')
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          await createNotification({
            userId: user.id,
            title: 'Support Ticket Created',
            message: `Your ticket "${formData.subject}" has been submitted. Our team will respond shortly.`,
            type: 'support',
            referenceId: data[0].id,
            referenceType: 'support_ticket'
          })
        }
        
        // Send confirmation email to partner
        console.log('📧 Sending ticket confirmation email to partner...')
        const emailResult = await sendSupportTicketEmail({
          subject: `Support Ticket Created - #${data[0].id.slice(0, 8)}`,
          ticketId: data[0].id,
          ticketSubject: formData.subject,
          status: 'open',
          description: formData.description,
          partnerData: {
            email: partner.email,
            first_name: partner.first_name,
            last_name: partner.last_name
          }
        })
        console.log('Email result:', emailResult)
      } catch (notificationError) {
        console.error('Error sending notification:', notificationError)
      }

      setSuccess(true)
      
      // Redirect after a short delay
      setTimeout(() => {
        router.push(`/dashboard/support/${data[0].id}`)
      }, 2000)

    } catch (error) {
      console.error('Error creating support ticket:', error)
      setErrors({ submit: 'Failed to create support ticket. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  const getTypeInfo = (type) => {
    return supportTypes.find(t => t.value === type) || supportTypes[0]
  }

  const getPriorityInfo = (priority) => {
    return priorities.find(p => p.value === priority) || priorities[1]
  }

  if (loading) {
    return (
      <div className="py-6">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/3 mb-6"></div>
            <div className="bg-white rounded-xl p-6">
              <div className="space-y-6">
                {[...Array(5)].map((_, i) => (
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
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Support Ticket Created!</h2>
            <p className="text-gray-600 mb-6">
              Your support request has been submitted and routed to the appropriate team. You'll receive a confirmation email shortly and we'll get back to you within the expected timeframe.
            </p>
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        </div>
      </div>
    )
  }

  const selectedType = getTypeInfo(formData.type)
  const selectedPriority = getPriorityInfo(formData.priority)

  return (
    <div className="py-6">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4">
            <Link
              href="/dashboard/support"
              className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-1" />
              Back to Support
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mt-4">Create Support Ticket</h1>
          <p className="text-gray-600 mt-1">
            Get help from our expert support team
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

            {/* Support Type Selection */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Headphones className="h-5 w-5 mr-2 text-gray-400" />
                Support Type
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {supportTypes.map((type) => (
                  <div key={type.value} className="relative">
                    <input
                      type="radio"
                      name="type"
                      value={type.value}
                      checked={formData.type === type.value}
                      onChange={handleInputChange}
                      className="sr-only"
                      id={`type-${type.value}`}
                    />
                    <label
                      htmlFor={`type-${type.value}`}
                      className={`cursor-pointer block p-4 border rounded-lg hover:border-blue-500 transition-colors ${
                        formData.type === type.value ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          formData.type === type.value ? 'bg-blue-100' : 'bg-gray-100'
                        }`}>
                          <type.icon className={`h-5 w-5 ${
                            formData.type === type.value ? 'text-blue-600' : 'text-gray-600'
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900">{type.label}</p>
                          <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                          <p className="text-xs text-gray-500 mt-1 flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            Response within {type.sla}
                          </p>
                        </div>
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Priority Level */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Priority Level</h3>
              
              <div className="space-y-3">
                {priorities.map((priority) => (
                  <div key={priority.value} className="relative">
                    <input
                      type="radio"
                      name="priority"
                      value={priority.value}
                      checked={formData.priority === priority.value}
                      onChange={handleInputChange}
                      className="sr-only"
                      id={`priority-${priority.value}`}
                    />
                    <label
                      htmlFor={`priority-${priority.value}`}
                      className={`cursor-pointer flex items-center p-3 border rounded-lg hover:border-blue-500 transition-colors ${
                        formData.priority === priority.value ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                        formData.priority === priority.value ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                      }`}>
                        {formData.priority === priority.value && (
                          <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <span className="font-medium text-gray-900">{priority.label}</span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priority.color}`}>
                            {priority.value.charAt(0).toUpperCase() + priority.value.slice(1)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{priority.description}</p>
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Ticket Details */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Ticket Details</h3>
              
              <div className="space-y-4">
                {/* Subject */}
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                    Subject *
                  </label>
                  <input
                    type="text"
                    name="subject"
                    id="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    className={`block w-full px-3 py-2 text-black border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.subject ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
                    }`}
                    placeholder="Brief summary of your issue or request"
                  />
                  {errors.subject && (
                    <p className="mt-1 text-sm text-red-600">{errors.subject}</p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    name="description"
                    id="description"
                    rows={6}
                    value={formData.description}
                    onChange={handleInputChange}
                    className={`block w-full px-3 py-2 text-black border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${
                      errors.description ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
                    }`}
                    placeholder="Please provide detailed information about your issue, including:&#10;• What you were trying to do&#10;• What happened instead&#10;• Any error messages you received&#10;• Steps to reproduce the issue"
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                  )}
                  <p className="mt-1 text-sm text-gray-500">
                    Characters: {formData.description.length} (minimum 20 required)
                  </p>
                </div>

                {/* Related Deal */}
                {deals.length > 0 && (
                  <div>
                    <label htmlFor="deal_id" className="block text-sm font-medium text-gray-700 mb-2">
                      Related Deal (Optional)
                    </label>
                    <select
                      name="deal_id"
                      id="deal_id"
                      value={formData.deal_id}
                      onChange={handleInputChange}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                    >
                      <option value="">Select a related deal (optional)</option>
                      {deals.map(deal => (
                        <option key={deal.id} value={deal.id}>
                          {deal.customer_name} - {deal.customer_company} ({deal.stage})
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-sm text-gray-500">
                      Link this ticket to a specific deal if it's related to a sales opportunity
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Partner Information Display */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Your Information</h4>
              <div className="text-sm text-gray-600">
                <p><strong>Partner:</strong> {partner?.first_name} {partner?.last_name}</p>
                <p><strong>Organization:</strong> {partner?.organization?.name}</p>
                <p><strong>Tier:</strong> {partner?.organization?.tier?.charAt(0).toUpperCase() + partner?.organization?.tier?.slice(1)} Partner</p>
                <p><strong>Email:</strong> {partner?.email}</p>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-xl flex items-center justify-between">
            <Link
              href="/dashboard/support"
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
                  Creating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Create Ticket
                </>
              )}
            </button>
          </div>
        </form>

        {/* Help Information */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Current Selection Info */}
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <Info className="h-5 w-5 text-blue-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">Selected Support Type</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p className="font-medium">{selectedType.label}</p>
                  <p>{selectedType.description}</p>
                  <p className="mt-1 flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    Response within {selectedType.sla}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Priority Info */}
          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Priority Level</h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p className="font-medium">{selectedPriority.label}</p>
                  <p>{selectedPriority.description}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}