// src/app/partner-manager/settings/page.js
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  User, Shield, Key, Save, CheckCircle, 
  AlertTriangle, Eye, EyeOff, Mail, Phone
} from 'lucide-react'

export default function PartnerManagerSettingsPage() {
  const [partnerManager, setPartnerManager] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')
  const [errors, setErrors] = useState({})
  const [success, setSuccess] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)

  const [profileData, setProfileData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: ''
  })

  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  })

  const supabase = createClient()

  const tabs = [
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'security', name: 'Security', icon: Shield }
  ]

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setLoading(true)
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: managerData } = await supabase
        .from('partner_managers')
        .select('*')
        .eq('auth_user_id', user.id)
        .single()

      if (managerData) {
        setPartnerManager(managerData)
        
        setProfileData({
          first_name: managerData.first_name || '',
          last_name: managerData.last_name || '',
          email: managerData.email || '',
          phone: managerData.phone || ''
        })
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (section, field, value) => {
    if (section === 'profile') {
      setProfileData(prev => ({ ...prev, [field]: value }))
    } else if (section === 'password') {
      setPasswordData(prev => ({ ...prev, [field]: value }))
    }

    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const saveProfile = async () => {
    try {
      setSaving(true)
      setErrors({})

      const newErrors = {}
      if (!profileData.first_name.trim()) newErrors.first_name = 'First name is required'
      if (!profileData.last_name.trim()) newErrors.last_name = 'Last name is required'
      if (!profileData.email.trim()) newErrors.email = 'Email is required'

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors)
        return
      }

      const { error } = await supabase
        .from('partner_managers')
        .update({
          first_name: profileData.first_name.trim(),
          last_name: profileData.last_name.trim(),
          phone: profileData.phone.trim() || null
        })
        .eq('id', partnerManager.id)

      if (error) throw error

      setSuccess('Profile updated successfully!')
      setTimeout(() => setSuccess(''), 3000)

    } catch (error) {
      console.error('Error saving profile:', error)
      setErrors({ submit: 'Failed to update profile. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  const changePassword = async () => {
    try {
      setSaving(true)
      setErrors({})

      const newErrors = {}
      if (!passwordData.current_password) newErrors.current_password = 'Current password is required'
      if (!passwordData.new_password) newErrors.new_password = 'New password is required'
      if (passwordData.new_password.length < 8) newErrors.new_password = 'Password must be at least 8 characters'
      if (passwordData.new_password !== passwordData.confirm_password) {
        newErrors.confirm_password = 'Passwords do not match'
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors)
        return
      }

      const { error } = await supabase.auth.updateUser({
        password: passwordData.new_password
      })

      if (error) throw error

      setSuccess('Password updated successfully!')
      setPasswordData({ current_password: '', new_password: '', confirm_password: '' })
      setTimeout(() => setSuccess(''), 3000)

    } catch (error) {
      console.error('Error changing password:', error)
      setErrors({ submit: 'Failed to change password. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="py-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/4 mb-8"></div>
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

  return (
    <div className="py-6">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">
            Manage your partner manager profile and preferences
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
                      activeTab === tab.id
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.name}</span>
                  </button>
                )
              })}
            </nav>
          </div>

          <div className="p-6">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        First Name *
                      </label>
                      <input
                        type="text"
                        value={profileData.first_name}
                        onChange={(e) => handleInputChange('profile', 'first_name', e.target.value)}
                        className={`block w-full px-3 py-2 text-black border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                          errors.first_name ? 'border-red-300' : 'border-gray-300'
                        }`}
                      />
                      {errors.first_name && <p className="mt-1 text-sm text-red-600">{errors.first_name}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        value={profileData.last_name}
                        onChange={(e) => handleInputChange('profile', 'last_name', e.target.value)}
                        className={`block w-full px-3 py-2 text-black border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                          errors.last_name ? 'border-red-300' : 'border-gray-300'
                        }`}
                      />
                      {errors.last_name && <p className="mt-1 text-sm text-red-600">{errors.last_name}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        value={profileData.email}
                        className="block w-full px-3 py-2 text-black border border-gray-300 rounded-lg shadow-sm bg-gray-50 text-gray-500"
                        disabled
                      />
                      <p className="mt-1 text-sm text-gray-500">Email cannot be changed. Contact admin if needed.</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={profileData.phone}
                        onChange={(e) => handleInputChange('profile', 'phone', e.target.value)}
                        className="block w-full px-3 py-2 text-black border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="(555) 123-4567"
                      />
                    </div>
                  </div>

                  <div className="mt-6">
                    <button
                      onClick={saveProfile}
                      disabled={saving}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
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
                </div>

                {/* Role Information */}
                <div className="pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Role Information</h3>
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-4 border border-indigo-200">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                        <User className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-indigo-900">Partner Manager</p>
                        <p className="text-sm text-indigo-700">You manage partner relationships and performance</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Change Password</h3>
                  
                  <div className="space-y-6 max-w-md">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Current Password *
                      </label>
                      <div className="relative">
                        <input
                          type={showCurrentPassword ? "text" : "password"}
                          value={passwordData.current_password}
                          onChange={(e) => handleInputChange('password', 'current_password', e.target.value)}
                          className={`block w-full px-3 py-2 pr-10 text-black border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                            errors.current_password ? 'border-red-300' : 'border-gray-300'
                          }`}
                          placeholder="Enter current password"
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-3 flex items-center z-10"
                          onClick={(e) => {
                            e.preventDefault()
                            setShowCurrentPassword(!showCurrentPassword)
                          }}
                        >
                          {showCurrentPassword ? (
                            <EyeOff className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                          )}
                        </button>
                      </div>
                      {errors.current_password && <p className="mt-1 text-sm text-red-600">{errors.current_password}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        New Password *
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? "text" : "password"}
                          value={passwordData.new_password}
                          onChange={(e) => handleInputChange('password', 'new_password', e.target.value)}
                          className={`block w-full px-3 py-2 pr-10 text-black border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                            errors.new_password ? 'border-red-300' : 'border-gray-300'
                          }`}
                          placeholder="Enter new password"
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-3 flex items-center z-10"
                          onClick={(e) => {
                            e.preventDefault()
                            setShowNewPassword(!showNewPassword)
                          }}
                        >
                          {showNewPassword ? (
                            <EyeOff className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                          )}
                        </button>
                      </div>
                      {errors.new_password && <p className="mt-1 text-sm text-red-600">{errors.new_password}</p>}
                      <p className="mt-1 text-sm text-gray-500">Must be at least 8 characters long</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Confirm New Password *
                      </label>
                      <input
                        type="password"
                        value={passwordData.confirm_password}
                        onChange={(e) => handleInputChange('password', 'confirm_password', e.target.value)}
                        className={`block w-full px-3 py-2 text-black border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                          errors.confirm_password ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Confirm new password"
                      />
                      {errors.confirm_password && <p className="mt-1 text-sm text-red-600">{errors.confirm_password}</p>}
                    </div>

                    <button
                      onClick={changePassword}
                      disabled={saving}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                      {saving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Updating...
                        </>
                      ) : (
                        <>
                          <Key className="h-4 w-4 mr-2" />
                          Update Password
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Security Info */}
                <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
                  <div className="flex">
                    <Shield className="h-5 w-5 text-indigo-400 flex-shrink-0" />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-indigo-800">Security Tips</h3>
                      <div className="mt-2 text-sm text-indigo-700">
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Use a strong, unique password</li>
                          <li>Enable two-factor authentication when available</li>
                          <li>Don't share your login credentials</li>
                          <li>Log out when using shared computers</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Error Display */}
            {errors.submit && (
              <div className="mt-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                <span>{errors.submit}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}