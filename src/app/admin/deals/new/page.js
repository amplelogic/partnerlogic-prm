'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, User, Mail, Building2, DollarSign, AlertTriangle, CheckCircle, Users, Upload, X, File, FileText, FileImage, FileVideo, Paperclip } from 'lucide-react'
import { getCurrencyOptions } from '@/lib/currencyUtils'

export default function AdminNewDealPage() {
  const [admin, setAdmin] = useState(null)
  const [partners, setPartners] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})
  const [success, setSuccess] = useState(false)
  const [currencyOptions, setCurrencyOptions] = useState([])
  const [attachments, setAttachments] = useState([])
  const [uploading, setUploading] = useState(false)
  
  const [formData, setFormData] = useState({
    partner_id: '',
    customer_name: '',
    customer_email: '',
    customer_company: '',
    customer_phone: '',
    deal_value: '',
    currency: 'USD',
    your_commission: '',
    price_to_ample_logic: '',
    stage: 'new_deal',
    admin_stage: 'urs',
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
    { value: 'negotiation', label: 'Negotiation' },
    { value: 'closed_won', label: 'Closed Won' },
    { value: 'closed_lost', label: 'Closed Lost' }
  ]

  const adminStages = [
    { value: 'urs', label: 'URS' },
    { value: 'base_deployment', label: 'Base Deployment' },
    { value: 'gap_assessment', label: 'Gap Assessment' },
    { value: 'development', label: 'Development' },
    { value: 'uat', label: 'UAT' },
    { value: 'iq', label: 'IQ' },
    { value: 'oq', label: 'OQ' },
    { value: 'deployment', label: 'Deployment' },
    { value: 'pq', label: 'PQ' },
    { value: 'live', label: 'LIVE' }
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
    loadAdminAndPartners()
    loadCurrencies()
  }, [])

  const loadCurrencies = async () => {
    try {
      const options = await getCurrencyOptions()
      setCurrencyOptions(options)
    } catch (error) {
      console.error('Error loading currencies:', error)
      setCurrencyOptions([{ value: 'USD', label: 'USD - US Dollar ($)' }])
    }
  }

  const loadAdminAndPartners = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      // Get admin info
      const { data: adminData } = await supabase
        .from('admins')
        .select('*')
        .eq('auth_user_id', user.id)
        .single()

      if (adminData) {
        setAdmin(adminData)
      }

      // Get all partners
      const { data: partnersData } = await supabase
        .from('partners')
        .select(`
          id,
          first_name,
          last_name,
          email,
          organization:organizations(
            name,
            tier,
            discount_percentage
          )
        `)
        .order('first_name', { ascending: true })

      // Fetch tier settings to get current commission percentages
      const { data: tierSettings } = await supabase
        .from('tier_settings')
        .select('tier_name, discount_percentage')
      
      // Map tier settings for quick lookup
      const tierCommissions = {}
      if (tierSettings) {
        tierSettings.forEach(tier => {
          tierCommissions[tier.tier_name] = tier.discount_percentage
        })
      }
      
      // Update partners with current tier commission percentages
      const partnersWithCurrentCommissions = (partnersData || []).map(partner => ({
        ...partner,
        organization: partner.organization ? {
          ...partner.organization,
          discount_percentage: tierCommissions[partner.organization.tier] ?? partner.organization.discount_percentage
        } : null
      }))
      
      setPartners(partnersWithCurrentCommissions)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => {
      const updated = {
        ...prev,
        [name]: value
      }
      
      // Auto-calculate commission and invoice when deal value or partner changes
      if ((name === 'deal_value' || name === 'partner_id') && updated.deal_value && updated.partner_id) {
        const selectedPartner = partners.find(p => p.id === updated.partner_id)
        const dealValue = parseFloat(updated.deal_value) || 0
        
        if (selectedPartner?.organization?.discount_percentage) {
          const commissionRate = selectedPartner.organization.discount_percentage / 100
          const commission = dealValue * commissionRate
          const invoiceToAmpleLogic = dealValue - commission
          
          updated.your_commission = commission.toFixed(2)
          updated.price_to_ample_logic = invoiceToAmpleLogic.toFixed(2)
        }
      }
      
      return updated
    })
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return

    setUploading(true)
    const newAttachments = []

    try {
      for (const file of files) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = `deal-attachments/${fileName}`

        const { data, error } = await supabase.storage
          .from('deal-files')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          })

        if (error) throw error

        const { data: { publicUrl } } = supabase.storage
          .from('deal-files')
          .getPublicUrl(filePath)

        newAttachments.push({
          name: file.name,
          url: publicUrl,
          type: file.type,
          size: file.size,
          uploaded_at: new Date().toISOString()
        })
      }

      setAttachments([...attachments, ...newAttachments])
    } catch (error) {
      console.error('Error uploading files:', error)
      alert('Error uploading files: ' + error.message)
    } finally {
      setUploading(false)
    }
  }

  const removeAttachment = (index) => {
    if (confirm('Remove this file?')) {
      setAttachments(attachments.filter((_, i) => i !== index))
    }
  }

  const getFileIcon = (type) => {
    if (!type) return File
    if (type.startsWith('video/')) return FileVideo
    if (type.startsWith('image/')) return FileImage
    if (type.includes('pdf') || type.includes('document')) return FileText
    return File
  }

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.partner_id) {
      newErrors.partner_id = 'Please select a partner'
    }

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
        partner_id: formData.partner_id,
        customer_name: formData.customer_name.trim(),
        customer_email: formData.customer_email.trim(),
        customer_company: formData.customer_company.trim(),
        deal_value: formData.deal_value ? parseFloat(formData.deal_value) : null,
        currency: formData.currency,
        your_commission: formData.your_commission ? parseFloat(formData.your_commission) : null,
        price_to_ample_logic: formData.price_to_ample_logic ? parseFloat(formData.price_to_ample_logic) : null,
        stage: formData.stage,
        admin_stage: formData.admin_stage,
        priority: formData.priority,
        support_type_needed: formData.support_type_needed,
        notes: formData.notes.trim() || null,
        expected_close_date: formData.expected_close_date || null,
        attachments: attachments.length > 0 ? JSON.stringify(attachments) : null
      }

      console.log('Creating deal with data:', dealData)

      const { data, error } = await supabase
        .from('deals')
        .insert([dealData])
        .select()

      if (error) {
        console.error('Supabase error details:', error)
        throw error
      }

      // Create initial activity log
      if (data[0]) {
        await supabase
          .from('deal_activities')
          .insert([{
            deal_id: data[0].id,
            user_id: admin.auth_user_id,
            activity_type: 'created',
            description: `Deal created by admin ${admin.first_name} ${admin.last_name}`
          }])
      }

      setSuccess(true)
      
      // Redirect after a short delay
      setTimeout(() => {
        router.push(`/admin/deals/${data[0].id}`)
      }, 2000)

    } catch (error) {
      console.error('Error creating deal:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      
      let errorMessage = 'Failed to create deal. Please try again.'
      
      if (error?.message) {
        errorMessage = error.message
      }
      
      if (error?.details) {
        console.error('Additional error details:', error.details)
      }
      
      if (error?.hint) {
        console.error('Error hint:', error.hint)
      }
      
      setErrors({ submit: errorMessage })
    } finally {
      setSaving(false)
    }
  }

  const getSelectedPartner = () => {
    return partners.find(p => p.id === formData.partner_id)
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
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Deal Created Successfully!</h2>
            <p className="text-gray-600 mb-6">
              The deal has been created and assigned to the partner. You'll be redirected to the deal details page shortly.
            </p>
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        </div>
      </div>
    )
  }

  const selectedPartner = getSelectedPartner()

  return (
    <div className="py-6">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4">
            <Link
              href="/admin/deals"
              className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-1" />
              Back to Deals
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mt-4">Create New Deal</h1>
          <p className="text-gray-600 mt-1">
            Create and assign a new deal to a partner
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

            {/* Partner Selection */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Users className="h-5 w-5 mr-2 text-blue-600" />
                Assign to Partner
              </h3>
              
              <div>
                <label htmlFor="partner_id" className="block text-sm font-medium text-gray-700 mb-2">
                  Select Partner *
                </label>
                <select
                  name="partner_id"
                  id="partner_id"
                  value={formData.partner_id}
                  onChange={handleInputChange}
                  className={`block w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 ${
                    errors.partner_id ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
                  }`}
                >
                  <option value="">Choose a partner...</option>
                  {partners.map(partner => (
                    <option key={partner.id} value={partner.id}>
                      {partner.first_name} {partner.last_name} - {partner.organization?.name} ({partner.organization?.tier})
                    </option>
                  ))}
                </select>
                {errors.partner_id && (
                  <p className="mt-1 text-sm text-red-600">{errors.partner_id}</p>
                )}
                
                {selectedPartner && (
                  <div className="mt-3 p-3 bg-white border border-blue-200 rounded-lg">
                    <p className="text-sm font-medium text-gray-900">Selected Partner:</p>
                    <p className="text-sm text-gray-600 mt-1">
                      <strong>Name:</strong> {selectedPartner.first_name} {selectedPartner.last_name}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Email:</strong> {selectedPartner.email}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Organization:</strong> {selectedPartner.organization?.name}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Tier:</strong> {selectedPartner.organization?.tier?.charAt(0).toUpperCase() + selectedPartner.organization?.tier?.slice(1)}
                    </p>
                  </div>
                )}
              </div>
            </div>

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
                    className={`block w-full text-gray-900 px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
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
                    className={`block w-full px-3 text-gray-900 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
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
                    className={`block w-full px-3 text-gray-900 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
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
                    className="block w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    Deal Value
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
                      className={`block w-full pl-10 pr-3 py-2 text-gray-900 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
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
                  <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-2">
                    Currency
                  </label>
                  <select
                    name="currency"
                    id="currency"
                    value={formData.currency}
                    onChange={handleInputChange}
                    className="block w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {currencyOptions.map(curr => (
                      <option key={curr.value} value={curr.value}>
                        {curr.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="your_commission" className="block text-sm font-medium text-gray-700 mb-2">
                    Partner Commission
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <DollarSign className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="number"
                      name="your_commission"
                      id="your_commission"
                      min="0"
                      step="0.01"
                      value={formData.your_commission}
                      onChange={handleInputChange}
                      readOnly
                      className="block w-full pl-10 pr-3 py-2 text-gray-900 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                      placeholder="5000.00"
                    />
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    Auto-calculated based on partner's tier commission rate
                  </p>
                </div>

                <div>
                  <label htmlFor="price_to_ample_logic" className="block text-sm font-medium text-gray-700 mb-2">
                    Invoice to Ample Logic
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <DollarSign className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="number"
                      name="price_to_ample_logic"
                      id="price_to_ample_logic"
                      min="0"
                      step="0.01"
                      value={formData.price_to_ample_logic}
                      onChange={handleInputChange}
                      readOnly
                      className="block w-full pl-10 pr-3 py-2 text-gray-900 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                      placeholder="4500.00"
                    />
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    Auto-calculated (Deal Value - Commission)
                  </p>
                </div>

                <div>
                  <label htmlFor="stage" className="block text-sm font-medium text-gray-700 mb-2">
                    Partner Stage
                  </label>
                  <select
                    name="stage"
                    id="stage"
                    value={formData.stage}
                    onChange={handleInputChange}
                    className="block w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {stages.map(stage => (
                      <option key={stage.value} value={stage.value}>
                        {stage.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="admin_stage" className="block text-sm font-medium text-gray-700 mb-2">
                    Admin Stage
                  </label>
                  <select
                    name="admin_stage"
                    id="admin_stage"
                    value={formData.admin_stage}
                    onChange={handleInputChange}
                    className="block w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {adminStages.map(stage => (
                      <option key={stage.value} value={stage.value}>
                        {stage.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="expected_close_date" className="block text-sm font-medium text-gray-700 mb-2">
                    Expected Close Date
                  </label>
                  <input
                    type="date"
                    name="expected_close_date"
                    id="expected_close_date"
                    value={formData.expected_close_date}
                    onChange={handleInputChange}
                    min={new Date().toISOString().split('T')[0]}
                    className="block w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
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
                    className="block w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    className="block w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              
              <div className="space-y-6">
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
                    className="block w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter any additional details about this deal..."
                  />
                </div>

                {/* File Attachments */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Paperclip className="inline h-4 w-4 mr-1" />
                    File Attachments
                  </label>
                  
                  <input
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-white focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-l-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
                  />
                  
                  <p className="text-xs text-gray-500 mt-1">
                    Upload any relevant documents, proposals, contracts, or files (no limit on file count or type)
                  </p>

                  {uploading && (
                    <div className="mt-2 text-sm text-blue-600 flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                      Uploading files...
                    </div>
                  )}

                  {/* Show uploaded files */}
                  {attachments.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-sm font-medium text-gray-700">{attachments.length} file(s) attached:</p>
                      {attachments.map((file, index) => {
                        const FileIcon = getFileIcon(file.type)
                        return (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex items-center space-x-3 flex-1 min-w-0">
                              <FileIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                                <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeAttachment(index)}
                              className="ml-2 p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-xl flex items-center justify-between">
            <Link
              href="/admin/deals"
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
                  Create Deal
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
              <h3 className="text-sm font-medium text-blue-800">Admin Deal Creation</h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc pl-5 space-y-1">
                  <li>Select a partner to assign this deal to</li>
                  <li>Set both partner-facing and admin-facing stages</li>
                  <li>The assigned partner will be able to view and track this deal</li>
                  <li>You can manage the deal from the admin deals dashboard</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
