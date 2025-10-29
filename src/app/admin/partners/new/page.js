'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, AlertTriangle, CheckCircle, User, Mail, Building2 } from 'lucide-react'

export default function NewPartnerPage() {
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [success, setSuccess] = useState(false)
  
  const [formData, setFormData] = useState({
    // Partner Info
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    // Organization Info
    organization_name: '',
    organization_type: 'reseller',
    tier: 'bronze',
    discount_percentage: 0,
    mdf_allocation: 0,
    // Account Type
    account_type: 'partner' // 'partner' or 'admin'
  })

  const router = useRouter()
  const supabase = createClient()

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

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Auto-fill discount and MDF based on tier
    if (name === 'tier') {
      const tierInfo = tiers.find(t => t.value === value)
      if (tierInfo) {
        setFormData(prev => ({
          ...prev,
          discount_percentage: tierInfo.discount,
          mdf_allocation: tierInfo.mdf
        }))
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
          organization: formData.account_type === 'partner' ? {
            name: formData.organization_name.trim(),
            type: formData.organization_type,
            tier: formData.tier,
            discount_percentage: parseInt(formData.discount_percentage),
            mdf_allocation: parseInt(formData.mdf_allocation)
          } : null
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
              {formData.account_type === 'admin' ? 'Admin Created!' : 'Partner Created!'}
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

            {/* Organization Information - Only for Partners */}
            {formData.account_type === 'partner' && (
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
                      className="block w-full px-3 py-2 text-black border border-gray-300 rounded-lg"
                    >
                      {tiers.map(tier => (
                        <option key={tier.value} value={tier.value}>
                          {tier.label} - {tier.discount}% discount, ${tier.mdf.toLocaleString()} MDF
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">MDF Allocation ($)</label>
                    <input
                      type="number"
                      name="mdf_allocation"
                      value={formData.mdf_allocation}
                      onChange={handleInputChange}
                      min="0"
                      className="block w-full px-3 py-2 text-black border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>
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