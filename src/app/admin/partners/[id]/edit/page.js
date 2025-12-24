// src/app/admin/partners/[id]/edit/page.js
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams } from 'next/navigation' 
import Link from 'next/link'
import { 
  ArrowLeft, Save, AlertTriangle, CheckCircle, User, Mail, 
  Phone, Building2, Shield, Package, Key, Eye, EyeOff
} from 'lucide-react'
import ProductMultiSelect from '@/components/ProductMultiSelect'


export default function EditPartnerPage({}) {
  const params = useParams()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})
  const [success, setSuccess] = useState(false)
  const [selectedProducts, setSelectedProducts] = useState([])
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [formData, setFormData] = useState({
    // Partner Info
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    status: 'active',
    partner_manager_id: '',
    // Organization Info
    organization_name: '',
    organization_type: 'reseller',
    tier: 'bronze',
    discount_percentage: 0,
    mdf_allocation: 0,
    mdf_enabled: true,
    learning_enabled: true,
    organization_id: null
  })

  const router = useRouter()
  const supabase = createClient()
  const [partnerManagers, setPartnerManagers] = useState([])
  const [loadingManagers, setLoadingManagers] = useState(false)

  const organizationTypes = [
    { value: 'reseller', label: 'Reseller Partner' },
    { value: 'referral', label: 'Referral Partner' },
    { value: 'full_cycle', label: 'Full-Cycle Partner' },
    { value: 'white_label', label: 'White-Label Partner' }
  ]

  const tiers = [
    { value: 'bronze', label: 'Bronze', discount: 5, mdf: 5000 },
    { value: 'silver', label: 'Silver', discount: 10, mdf: 10000 },
    { value: 'gold', label: 'Gold', discount: 15, mdf: 25000 },
    { value: 'platinum', label: 'Platinum', discount: 20, mdf: 50000 }
  ]

  const statuses = [
    { value: 'active', label: 'Active' },
    { value: 'pending', label: 'Pending' },
    { value: 'inactive', label: 'Inactive' }
  ]

  useEffect(() => {
     if (params?.id) { 
      loadPartner()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params?.id])

  const loadPartner = async () => {
    try {
      setLoading(true)

      // Force fresh data by using maybeSingle() and checking cache
      const { data: partnerData, error } = await supabase
        .from('partners')
        .select(`
          *,
          organization:organizations(*)
        `)
        .eq('id', params.id)
        .maybeSingle()

      if (error) {
        console.error('Load partner error:', error)
        throw error
      }

      if (!partnerData) {
        throw new Error('Partner not found')
      }

      if (partnerData) {
        console.log('Loaded partner data:', partnerData)
        
        // Ensure we have the organization data
        if (!partnerData.organization && partnerData.organization_id) {
          // Fetch organization separately if not loaded
          const { data: orgData } = await supabase
            .from('organizations')
            .select('*')
            .eq('id', partnerData.organization_id)
            .single()
          
          if (orgData) {
            partnerData.organization = orgData
          }
        }
        
        setFormData({
          first_name: partnerData.first_name || '',
          last_name: partnerData.last_name || '',
          email: partnerData.email || '',
          phone: partnerData.phone || '',
          status: partnerData.status || 'active',
          partner_manager_id: partnerData.partner_manager_id || '',
          organization_name: partnerData.organization?.name || '',
          organization_type: partnerData.organization?.type || 'reseller',
          tier: partnerData.organization?.tier || 'bronze',
          discount_percentage: partnerData.organization?.discount_percentage || 0,
          mdf_allocation: partnerData.organization?.mdf_allocation || 0,
          mdf_enabled: partnerData.organization?.mdf_enabled ?? true,
          learning_enabled: partnerData.organization?.learning_enabled ?? true,
          organization_id: partnerData.organization_id
        })

        // Fetch assigned products
        const { data: assignedProductsData } = await supabase
          .from('partner_products')
          .select(`
            product_id,
            products (
              id,
              name,
              short_name,
              description,
              image_url
            )
          `)
          .eq('partner_id', params.id)

        const products = assignedProductsData?.map(pp => pp.products).filter(Boolean) || []
        setSelectedProducts(products)
        console.log('Loaded assigned products:', products)
      }
    } catch (error) {
      console.error('Error loading partner:', error)
      setErrors({ submit: `Failed to load partner data: ${error.message}` })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
  loadPartnerManagers()
}, [])

const loadPartnerManagers = async () => {
  try {
    setLoadingManagers(true)
    const { data, error } = await supabase
      .from('partner_managers')
      .select('*')
      .eq('status', 'active')
      .order('first_name', { ascending: true })

    if (error) throw error
    setPartnerManagers(data || [])
  } catch (error) {
    console.error('Error loading partner managers:', error)
  } finally {
    setLoadingManagers(false)
  }
}

const handleInputChange = (e) => {
  const { name, value, type, checked } = e.target
  
  if (name === 'mdf_enabled') {
    setFormData(prev => ({
      ...prev,
      mdf_enabled: checked,
      mdf_allocation: checked ? prev.mdf_allocation : 0
    }))
  } else if (name === 'learning_enabled') { // NEW
    setFormData(prev => ({
      ...prev,
      learning_enabled: checked
    }))
  } else {
    setFormData(prev => ({ ...prev, [name]: value }))
    
    if (name === 'tier') {
      const tierInfo = tiers.find(t => t.value === value)
      if (tierInfo) {
        setFormData(prev => ({
          ...prev,
          discount_percentage: tierInfo.discount,
          mdf_allocation: prev.mdf_enabled ? tierInfo.mdf : 0
        }))
      }
    }
  }
  
  if (errors[name]) {
    setErrors(prev => ({ ...prev, [name]: '' }))
  }
}

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.first_name.trim()) newErrors.first_name = 'First name is required'
    if (!formData.last_name.trim()) newErrors.last_name = 'Last name is required'
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email format'
    }
    if (!formData.organization_name.trim()) {
      newErrors.organization_name = 'Organization name is required'
    }
    if (!formData.organization_id) {
      newErrors.organization_id = 'Organization ID is missing'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      console.error('Validation failed:', errors)
      return
    }

    try {
      setSaving(true)
      setErrors({})

      console.log('=== UPDATE STARTING ===')
      console.log('Partner ID:', params.id)
      console.log('Organization ID:', formData.organization_id)
      console.log('Form Data:', formData)

      // Prepare partner update data
      const partnerUpdatePayload = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || null,
        status: formData.status,
        partner_manager_id: formData.partner_manager_id || null
      }
      
      console.log('Partner Update Payload:', partnerUpdatePayload)

      // Update partner
      const { data: partnerUpdateData, error: partnerError } = await supabase
        .from('partners')
        .update(partnerUpdatePayload)
        .eq('id', params.id)
        .select()

      if (partnerError) {
        console.error('Partner update error:', partnerError)
        throw new Error(`Failed to update partner: ${partnerError.message}`)
      }

      console.log('Partner updated successfully:', partnerUpdateData)

      // Prepare organization update data
      const orgUpdatePayload = {
        name: formData.organization_name.trim(),
        type: formData.organization_type,
        tier: formData.tier,
        discount_percentage: parseInt(formData.discount_percentage) || 0,
        mdf_allocation: formData.mdf_enabled ? (parseInt(formData.mdf_allocation) || 0) : 0,
        mdf_enabled: formData.mdf_enabled,
        learning_enabled: formData.learning_enabled
      }
      
      console.log('Organization Update Payload:', orgUpdatePayload)

      // Update organization
      const { data: orgUpdateData, error: orgError } = await supabase
        .from('organizations')
        .update(orgUpdatePayload)
        .eq('id', formData.organization_id)
        .select()

      if (orgError) {
        console.error('Organization update error:', orgError)
        throw new Error(`Failed to update organization: ${orgError.message}`)
      }

      console.log('Organization updated successfully:', orgUpdateData)
      console.log('=== UPDATE COMPLETED ===')


      // Update product assignments
      console.log('Updating product assignments...')
      console.log('Selected products:', selectedProducts)

      // Delete existing assignments
      const { error: deleteError } = await supabase
        .from('partner_products')
        .delete()
        .eq('partner_id', params.id)

      if (deleteError) {
        console.error('Error deleting old product assignments:', deleteError)
        // Don't fail the whole operation, just log it
      }

      // Insert new assignments
      if (selectedProducts.length > 0) {
        const productAssignments = selectedProducts.map(product => ({
          partner_id: params.id,
          product_id: product.id
        }))

        const { error: insertError } = await supabase
          .from('partner_products')
          .insert(productAssignments)

        if (insertError) {
          console.error('Error inserting product assignments:', insertError)
          throw new Error(`Failed to update product assignments: ${insertError.message}`)
        }

        console.log('Product assignments updated successfully')
      } else {
        console.log('No products selected, all assignments removed')
      }

      // Verify the update by fetching fresh data
      const { data: verifyData } = await supabase
        .from('partners')
        .select(`
          *,
          organization:organizations(*)
        `)
        .eq('id', params.id)
        .single()
      
      console.log('Verification - Fresh data from DB:', verifyData)

      setSuccess(true)
      setTimeout(() => {
        router.push(`/admin/partners/${params.id}`)
      }, 1500)

    } catch (error) {
      console.error('Error updating partner:', error)
      setErrors({ submit: error.message || 'Failed to update partner. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="py-6">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/4 mb-6"></div>
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
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Partner Updated!</h2>
            <p className="text-gray-600 mb-6">
              Partner information has been successfully updated.
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
        <div className="mb-8">
          <Link
            href={`/admin/partners/${params.id}`}
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-1" />
            Back to Partner
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-4">Edit Partner</h1>
          <p className="text-gray-600 mt-1">Update partner and organization information</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 space-y-6">
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                <span>{errors.submit}</span>
              </div>
            )}

            {errors.organization_id && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                <span>{errors.organization_id}</span>
              </div>
            )}

            {/* Personal Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <User className="h-5 w-5 mr-2 text-gray-400" />
                Personal Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    className={`block w-full px-3 py-2 text-black border rounded-lg ${errors.first_name ? 'border-red-300' : 'border-gray-300'}`}
                  />
                  {errors.first_name && <p className="mt-1 text-sm text-red-600">{errors.first_name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    className={`block w-full px-3 py-2 text-black border rounded-lg ${errors.last_name ? 'border-red-300' : 'border-gray-300'}`}
                  />
                  {errors.last_name && <p className="mt-1 text-sm text-red-600">{errors.last_name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`block w-full px-3 py-2 text-black border rounded-lg ${errors.email ? 'border-red-300' : 'border-gray-300'}`}
                  />
                  {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="block w-full px-3 py-2 text-black border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="block w-full px-3 py-2 text-black border border-gray-300 rounded-lg"
                  >
                    {statuses.map(status => (
                      <option key={status.value} value={status.value}>{status.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Partner Manager
                  </label>
                  <select
                    name="partner_manager_id"
                    value={formData.partner_manager_id}
                    onChange={handleInputChange}
                    disabled={loadingManagers}
                    className="block w-full px-3 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">No Partner Manager Assigned</option>
                    {partnerManagers.map(manager => (
                      <option key={manager.id} value={manager.id}>
                        {manager.first_name} {manager.last_name}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-sm text-gray-500">
                    Assign a partner manager to oversee this partner
                  </p>
                </div>
              </div>
            </div>
            {/* Product Assignment Section - NEW */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Package className="h-5 w-5 mr-2 text-gray-400" />
                Product Assignment
              </h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assign Products
                </label>
                <ProductMultiSelect
                  selectedProducts={selectedProducts}
                  onChange={setSelectedProducts}
                />
                <p className="mt-2 text-sm text-gray-500">
                  Select the products this partner is authorized to sell
                </p>
                {selectedProducts.length > 0 && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-800 font-medium">
                      {selectedProducts.length} product{selectedProducts.length !== 1 ? 's' : ''} assigned
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {selectedProducts.map(product => (
                        <span key={product.id} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-white text-blue-700 border border-blue-300">
                          {product.short_name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            {/* Organization Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Building2 className="h-5 w-5 mr-2 text-gray-400" />
                Organization Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Organization Name *</label>
                  <input
                    type="text"
                    name="organization_name"
                    value={formData.organization_name}
                    onChange={handleInputChange}
                    className={`block w-full px-3 py-2 text-black border rounded-lg ${errors.organization_name ? 'border-red-300' : 'border-gray-300'}`}
                  />
                  {errors.organization_name && <p className="mt-1 text-sm text-red-600">{errors.organization_name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Partner Type</label>
                  <select
                    name="organization_type"
                    value={formData.organization_type}
                    onChange={handleInputChange}
                    className="block w-full px-3 py-2 text-black border border-gray-300 rounded-lg"
                  >
                    {organizationTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Partner Tier</label>
                  <select
                    name="tier"
                    value={formData.tier}
                    onChange={handleInputChange}
                    className="block w-full px-3 py-2 text-black border border-gray-300 rounded-lg"
                  >
                    {tiers.map(tier => (
                      <option key={tier.value} value={tier.value}>
                        {tier.label} - {tier.discount}% discount{formData.mdf_enabled ? `, $${tier.mdf.toLocaleString()} MDF` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Discount %</label>
                  <input
                    type="number"
                    name="discount_percentage"
                    value={formData.discount_percentage}
                    onChange={handleInputChange}
                    min="0"
                    max="100"
                    className="block w-full px-3 py-2 text-black border border-gray-300 rounded-lg"
                  />
                </div>

                {/* MDF Enabled Toggle */}
                <div className="md:col-span-2">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex-1">
                      <label htmlFor="mdf_enabled" className="block text-sm font-medium text-gray-900 mb-1">
                        Enable MDF (Marketing Development Fund)
                      </label>
                      <p className="text-sm text-gray-600">
                        Allow this partner to request and manage marketing development funds
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer ml-4">
                      <input
                        type="checkbox"
                        id="mdf_enabled"
                        name="mdf_enabled"
                        checked={formData.mdf_enabled}
                        onChange={handleInputChange}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>

                {/* Learning Access Toggle - NEW */}
                <div className="md:col-span-2">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex-1">
                      <label htmlFor="learning_enabled" className="block text-sm font-medium text-gray-900 mb-1">
                        Enable Learning Center Access
                      </label>
                      <p className="text-sm text-gray-600">
                        Allow this partner to access training courses and earn certificates
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer ml-4">
                      <input
                        type="checkbox"
                        id="learning_enabled"
                        name="learning_enabled"
                        checked={formData.learning_enabled}
                        onChange={handleInputChange}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>

                {/* Conditionally show MDF Allocation field */}
                {formData.mdf_enabled && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">MDF Allocation ($)</label>
                    <input
                      type="number"
                      name="mdf_allocation"
                      value={formData.mdf_allocation}
                      onChange={handleInputChange}
                      min="0"
                      className="block w-full px-3 py-2 text-black border border-gray-300 rounded-lg"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Annual marketing development fund allocation for this partner
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Password Reset */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Reset Password</h2>
                  <p className="text-sm text-gray-600 mt-1">Set a new password for this partner</p>
                </div>
                {passwordSuccess && (
                  <div className="flex items-center text-green-600">
                    <CheckCircle className="h-5 w-5 mr-2" />
                    <span className="text-sm font-medium">Password updated successfully</span>
                  </div>
                )}
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Key className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value)
                        setPasswordSuccess(false)
                        if (errors.newPassword) {
                          setErrors(prev => ({ ...prev, newPassword: '' }))
                        }
                      }}
                      className={`block w-full pl-10 pr-10 py-2 border ${
                        errors.newPassword ? 'border-red-300' : 'border-gray-300'
                      } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900`}
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      )}
                    </button>
                  </div>
                  {errors.newPassword && (
                    <p className="mt-1 text-sm text-red-600">{errors.newPassword}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">Must be at least 6 characters</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Key className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value)
                        setPasswordSuccess(false)
                        if (errors.confirmPassword) {
                          setErrors(prev => ({ ...prev, confirmPassword: '' }))
                        }
                      }}
                      className={`block w-full pl-10 pr-10 py-2 border ${
                        errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                      } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900`}
                      placeholder="Confirm new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={async () => {
                  setErrors({})
                  setPasswordSuccess(false)

                  if (!newPassword) {
                    setErrors({ newPassword: 'Password is required' })
                    return
                  }

                  if (newPassword.length < 6) {
                    setErrors({ newPassword: 'Password must be at least 6 characters' })
                    return
                  }

                  if (newPassword !== confirmPassword) {
                    setErrors({ confirmPassword: 'Passwords do not match' })
                    return
                  }

                  try {
                    // Get current admin user
                    const { data: { user: currentUser } } = await supabase.auth.getUser()
                    if (!currentUser) {
                      throw new Error('Not authenticated')
                    }

                    // First get the partner's auth_user_id
                    const { data: partnerData } = await supabase
                      .from('partners')
                      .select('auth_user_id')
                      .eq('id', params.id)
                      .single()

                    if (!partnerData?.auth_user_id) {
                      throw new Error('Partner auth user not found')
                    }

                    // Call API route to update password
                    const response = await fetch('/api/admin/update-password', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        userId: partnerData.auth_user_id,
                        newPassword: newPassword,
                        adminAuthUserId: currentUser.id
                      })
                    })

                    const result = await response.json()

                    if (!response.ok) {
                      throw new Error(result.error || 'Failed to update password')
                    }

                    setPasswordSuccess(true)
                    setNewPassword('')
                    setConfirmPassword('')
                    
                    setTimeout(() => setPasswordSuccess(false), 5000)
                  } catch (error) {
                    console.error('Password update error:', error)
                    setErrors({ submit: error.message || 'Failed to update password. Please try again.' })
                  }
                }}
                disabled={!newPassword || !confirmPassword}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Key className="h-4 w-4 mr-2" />
                Update Password
              </button>
            </div>
          </div>

          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-xl flex items-center justify-between">
            <Link
              href={`/admin/partners/${params.id}`}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}