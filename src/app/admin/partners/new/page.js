// src/app/admin/partners/new/page.js
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, AlertTriangle, CheckCircle, User, Mail, Building2, Package, Users  } from 'lucide-react'
import ProductMultiSelect from '@/components/ProductMultiSelect'

export default function NewPartnerPage() {
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [success, setSuccess] = useState(false)
  const [selectedProducts, setSelectedProducts] = useState([])
  const [partnerManagers, setPartnerManagers] = useState([])
  const [loadingManagers, setLoadingManagers] = useState(false)
  const [tiers, setTiers] = useState([])
  const [loadingTiers, setLoadingTiers] = useState(true)
  
  const [formData, setFormData] = useState({
    // Partner Info
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    partner_manager_id: '',
    // Organization Info
    organization_name: '',
    organization_type: 'reseller',
    tier: 'bronze',
    discount_percentage: 0,
    mdf_allocation: 0,
    mdf_enabled: false,
    learning_enabled: true,
    // Account Type
    account_type: 'partner'
  })

  const router = useRouter()
  const supabase = createClient()

  const organizationTypes = [
    { value: 'reseller', label: 'Reseller Partner' },
    { value: 'referral', label: 'Referral Partner' },
    { value: 'full_cycle', label: 'Full-Cycle Partner' },
    { value: 'white_label', label: 'White-Label Partner' }
  ]

const handleInputChange = (e) => {
  const { name, value, type, checked } = e.target
  
  if (name === 'mdf_enabled') {
    setFormData(prev => ({
      ...prev,
      mdf_enabled: checked,
      mdf_allocation: checked ? (tiers.find(t => t.value === prev.tier)?.mdf || 0) : 0
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
    
    if (formData.account_type === 'partner') {
      if (!formData.organization_name.trim()) {
        newErrors.organization_name = 'Organization name is required'
      }
    }

    setErrors(newErrors)
      return Object.keys(newErrors).length === 0
    }
    useEffect(() => {
      loadPartnerManagers()
      loadTiers()
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

  const loadTiers = async () => {
    try {
      setLoadingTiers(true)
      const { data, error } = await supabase
        .from('tier_settings')
        .select('*')
        .order('min_revenue', { ascending: true })

      if (error) throw error
      
      // Transform data to match expected format
      const transformedTiers = (data || []).map(tier => ({
        value: tier.tier_name,
        label: tier.tier_label,
        discount: tier.discount_percentage,
        mdf: tier.mdf_allocation
      }))
      
      setTiers(transformedTiers)
      
      // Set default tier if tiers are loaded and no tier is selected
      if (transformedTiers.length > 0 && !formData.tier) {
        const defaultTier = transformedTiers[0]
        setFormData(prev => ({
          ...prev,
          tier: defaultTier.value,
          discount_percentage: defaultTier.discount,
          mdf_allocation: 0
        }))
      }
    } catch (error) {
      console.error('Error loading tiers:', error)
    } finally {
      setLoadingTiers(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return

    try {
      setLoading(true)

      // Call edge function to create user with email invitation
      const { data, error } = await supabase.functions.invoke('create-partner', {
        body: {
          email: formData.email.trim(),
          first_name: formData.first_name.trim(),
          last_name: formData.last_name.trim(),
          phone: formData.phone.trim() || null,
          account_type: formData.account_type,
          partner_manager_id: formData.partner_manager_id || null,
          organization: formData.account_type === 'partner' ? {
            name: formData.organization_name.trim(),
            type: formData.organization_type,
            tier: formData.tier,
            discount_percentage: parseInt(formData.discount_percentage),
            mdf_allocation: formData.mdf_enabled ? parseInt(formData.mdf_allocation) : 0,
            mdf_enabled: formData.mdf_enabled,
            learning_enabled: formData.learning_enabled
          } : null,
          // NEW: Send selected product IDs
          product_ids: selectedProducts.map(p => p.id)
        }
      })

      if (error) throw error

      setSuccess(true)
      setTimeout(() => {
        router.push('/admin/partners')
      }, 2000)

    } catch (error) {
      console.error('Error creating account:', error)
      setErrors({ submit: error.message || 'Failed to create account. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="py-6">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {formData.account_type === 'admin' ? 'Admin Created!' : 
              formData.account_type === 'partner_manager' ? 'Partner Manager Created!' : 
              'Partner Created!'}
            </h2>
            <p className="text-gray-600 mb-6">
              An activation email has been sent to {formData.email}. They will receive instructions to set their password and activate their account.
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
            href="/admin/partners"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-1" />
            Back to Partners
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-4">Register New Account</h1>
          <p className="text-gray-600 mt-1">Create a new partner or admin account</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 space-y-6">
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                <span>{errors.submit}</span>
              </div>
            )}

            {/* Account Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account Type *
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className={`cursor-pointer border-2 rounded-lg p-4 ${formData.account_type === 'partner' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}>
                  <input
                    type="radio"
                    name="account_type"
                    value="partner"
                    checked={formData.account_type === 'partner'}
                    onChange={handleInputChange}
                    className="sr-only"
                  />
                  <div className="flex items-center space-x-3">
                    <Building2 className="h-6 w-6 text-blue-600" />
                    <div>
                      <div className="font-medium text-black">Partner Account</div>
                      <div className="text-sm text-gray-600">External partner organization</div>
                    </div>
                  </div>
                </label>
                
                <label className={`cursor-pointer border-2 rounded-lg p-4 ${formData.account_type === 'admin' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}>
                  <input
                    type="radio"
                    name="account_type"
                    value="admin"
                    checked={formData.account_type === 'admin'}
                    onChange={handleInputChange}
                    className="sr-only"
                  />
                  <div className="flex items-center space-x-3">
                    <User className="h-6 w-6 text-purple-600" />
                    <div>
                      <div className="font-medium text-black">Admin Account</div>
                      <div className="text-sm text-gray-600">Internal administrator</div>
                    </div>
                  </div>
                </label>
                <label className={`cursor-pointer border-2 rounded-lg p-4 ${formData.account_type === 'partner_manager' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}>
                  <input
                    type="radio"
                    name="account_type"
                    value="partner_manager"
                    checked={formData.account_type === 'partner_manager'}
                    onChange={handleInputChange}
                    className="sr-only"
                  />
                  <div className="flex items-center space-x-3">
                    <Users className="h-6 w-6 text-indigo-600" />
                    <div>
                      <div className="font-medium text-black">Partner Manager</div>
                      <div className="text-sm text-gray-600">Manages partner relationships</div>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Personal Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
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
                  <p className="mt-1 text-sm text-gray-500">Activation email will be sent to this address</p>
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
              </div>
            </div>
            
            {formData.account_type === 'partner' && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assign Partner Manager (Optional)
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
                      {manager.first_name} {manager.last_name} - {manager.email}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-sm text-gray-500">
                  Assign a partner manager to oversee this partner's relationship
                </p>
                {loadingManagers && (
                  <p className="mt-1 text-sm text-blue-600">Loading partner managers...</p>
                )}
              </div>
            )}

            {/* Organization Information - Only for Partners */}
            {formData.account_type === 'partner' && (
              <>
                {/* NEW: Product Assignment Section */}
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
                      Select the products this partner will be authorized to sell. You can modify this later.
                    </p>
                    {selectedProducts.length > 0 && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm text-blue-800 font-medium">
                          {selectedProducts.length} product{selectedProducts.length !== 1 ? 's' : ''} selected
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Organization Details</h3>
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
                        disabled={loadingTiers}
                        className="block w-full px-3 py-2 text-black border border-gray-300 rounded-lg"
                      >
                        {loadingTiers ? (
                          <option>Loading tiers...</option>
                        ) : (
                          tiers.map(tier => (
                            <option key={tier.value} value={tier.value}>
                              {tier.label} - {tier.discount}% commission{formData.mdf_enabled ? `, $${tier.mdf.toLocaleString()} MDF` : ''}
                            </option>
                          ))
                        )}
                      </select>
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
              </>
            )}
          </div>

          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-xl flex items-center justify-between">
            <Link
              href="/admin/partners"
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Create Account & Send Invite
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}