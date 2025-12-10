'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, Save, AlertTriangle, Headphones, User,
  Mail, Phone, Wrench, Users, FileText, CheckCircle
} from 'lucide-react'

export default function EditSupportUserPage() {
  const params = useParams()
  const router = useRouter()
  const [supportUser, setSupportUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    supportType: 'technical',
    active: true
  })

  const supabase = createClient()

  const supportTypes = [
    { 
      value: 'technical', 
      label: 'Technical Support', 
      icon: Wrench,
      description: 'Handles software, integration, and technical issues',
      color: 'bg-blue-100 text-blue-800 border-blue-300'
    },
    { 
      value: 'sales', 
      label: 'Sales Support', 
      icon: Users,
      description: 'Assists with deal progression and sales process',
      color: 'bg-green-100 text-green-800 border-green-300'
    },
    { 
      value: 'presales', 
      label: 'Pre-sales Engineering', 
      icon: FileText,
      description: 'Provides technical consultation and demos',
      color: 'bg-purple-100 text-purple-800 border-purple-300'
    },
    { 
      value: 'accounts', 
      label: 'Account Management', 
      icon: Users,
      description: 'Manages billing and contract support',
      color: 'bg-orange-100 text-orange-800 border-orange-300'
    }
  ]

  useEffect(() => {
    if (params?.id) {
      loadSupportUser()
    }
  }, [params?.id])

  const loadSupportUser = async () => {
    try {
      setLoading(true)

      const { data, error } = await supabase
        .from('support_users')
        .select('*')
        .eq('id', params.id)
        .single()

      if (error) throw error

      setSupportUser(data)
      setFormData({
        firstName: data.first_name || '',
        lastName: data.last_name || '',
        email: data.email || '',
        phone: data.phone || '',
        supportType: data.support_type || 'technical',
        active: data.active !== false
      })

    } catch (error) {
      console.error('Error loading support user:', error)
      setErrors({ submit: 'Failed to load support user' })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required'
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format'
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

      // Update support user
      const { error: updateError } = await supabase
        .from('support_users')
        .update({
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          phone: formData.phone || null,
          support_type: formData.supportType,
          active: formData.active,
          updated_at: new Date().toISOString()
        })
        .eq('id', params.id)

      if (updateError) throw updateError

      // If email changed, update auth user email
      if (formData.email !== supportUser.email) {
        const { error: emailError } = await supabase.auth.admin.updateUserById(
          supportUser.auth_user_id,
          { email: formData.email }
        )

        if (emailError) {
          console.error('Error updating auth email:', emailError)
          // Don't throw error, just log it
        }
      }

      alert('Support user updated successfully!')
      router.push(`/admin/support-users/${params.id}`)

    } catch (error) {
      console.error('Error updating support user:', error)
      setErrors({ submit: error.message || 'Failed to update support user' })
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
          </div>
        </div>
      </div>
    )
  }

  if (!supportUser) {
    return (
      <div className="py-6">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Support user not found</h2>
            <Link href="/admin/support-users" className="text-blue-600 hover:text-blue-700">
              Back to Support Users
            </Link>
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
          <Link
            href={`/admin/support-users/${params.id}`}
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-5 w-5 mr-1" />
            Back to Support User
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Edit Support User</h1>
          <p className="text-gray-600 mt-1">
            Update support user information
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

            {/* Personal Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                    First Name *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="firstName"
                      id="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className={`block w-full pl-10 pr-3 py-2 text-black border rounded-lg ${
                        errors.firstName ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                  </div>
                  {errors.firstName && (
                    <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="lastName"
                      id="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className={`block w-full pl-10 pr-3 py-2 text-black border rounded-lg ${
                        errors.lastName ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                  </div>
                  {errors.lastName && (
                    <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      name="email"
                      id="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`block w-full pl-10 pr-3 py-2 text-black border rounded-lg ${
                        errors.email ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    Phone
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="tel"
                      name="phone"
                      id="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="block w-full pl-10 pr-3 py-2 text-black border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Support Type Selection */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Headphones className="h-5 w-5 mr-2 text-gray-400" />
                Support Type *
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {supportTypes.map((type) => {
                  const TypeIcon = type.icon
                  return (
                    <div key={type.value}>
                      <input
                        type="radio"
                        name="supportType"
                        value={type.value}
                        checked={formData.supportType === type.value}
                        onChange={handleInputChange}
                        className="sr-only"
                        id={`type-${type.value}`}
                      />
                      <label
                        htmlFor={`type-${type.value}`}
                        className={`cursor-pointer block p-4 border-2 rounded-lg transition-all ${
                          formData.supportType === type.value 
                            ? type.color + ' border-current'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            formData.supportType === type.value ? type.color : 'bg-gray-100'
                          }`}>
                            <TypeIcon className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900">{type.label}</p>
                            <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                          </div>
                        </div>
                      </label>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Account Status */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Account Status</h3>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="active"
                  id="active"
                  checked={formData.active}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="active" className="ml-3">
                  <span className="text-sm font-medium text-gray-900">Active Account</span>
                  <p className="text-sm text-gray-500">
                    Inactive users cannot log in to the system
                  </p>
                </label>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-xl flex items-center justify-between">
            <Link
              href={`/admin/support-users/${params.id}`}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
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