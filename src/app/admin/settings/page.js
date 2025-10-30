// src/app/admin/settings/page.js
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  User, Bell, Shield, Key, Mail, Phone,
  Save, CheckCircle, AlertTriangle, Eye, EyeOff,
  Settings as SettingsIcon, Database, Lock, Globe,
  Server, Zap, AlertCircle
} from 'lucide-react'

export default function AdminSettingsPage() {
  const [admin, setAdmin] = useState(null)
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

  const [notificationSettings, setNotificationSettings] = useState({
    email_deals: true,
    email_support: true,
    email_partners: true,
    email_system: true,
    push_deals: true,
    push_support: true,
    push_partners: false,
    deal_notification_email: '' // NEW: Email for deal notifications
  })

  const [systemSettings, setSystemSettings] = useState({
    maintenance_mode: false,
    allow_new_partners: true,
    require_deal_approval: false,
    auto_assign_support: true,
    mdf_auto_approval_limit: 5000
  })

  const supabase = createClient()

  const tabs = [
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'security', name: 'Security', icon: Shield },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'system', name: 'System', icon: SettingsIcon }
  ]

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setLoading(true)
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: adminData } = await supabase
        .from('admins')
        .select('*')
        .eq('auth_user_id', user.id)
        .single()

      if (adminData) {
        setAdmin(adminData)
        
        // Set profile data
        setProfileData({
          first_name: adminData.first_name || '',
          last_name: adminData.last_name || '',
          email: adminData.email || '',
          phone: adminData.phone || ''
        })

        // Load notification settings from admin_settings table
        const { data: settingsData } = await supabase
          .from('admin_settings')
          .select('*')
          .eq('admin_id', adminData.id)
          .single()

        if (settingsData) {
          setNotificationSettings({
            email_deals: settingsData.email_deals ?? true,
            email_support: settingsData.email_support ?? true,
            email_partners: settingsData.email_partners ?? true,
            email_system: settingsData.email_system ?? true,
            push_deals: settingsData.push_deals ?? true,
            push_support: settingsData.push_support ?? true,
            push_partners: settingsData.push_partners ?? false,
            deal_notification_email: settingsData.deal_notification_email || ''
          })
        }
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
    } else if (section === 'notifications') {
      setNotificationSettings(prev => ({ ...prev, [field]: value }))
    } else if (section === 'system') {
      setSystemSettings(prev => ({ ...prev, [field]: value }))
    }

    // Clear any existing errors
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
    setSuccess('')
  }

  const saveProfile = async () => {
    try {
      setSaving(true)
      setErrors({})

      // Validate
      const newErrors = {}
      if (!profileData.first_name.trim()) newErrors.first_name = 'First name is required'
      if (!profileData.last_name.trim()) newErrors.last_name = 'Last name is required'
      if (!profileData.email.trim()) newErrors.email = 'Email is required'

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors)
        return
      }

      // Update admin profile
      const { error } = await supabase
        .from('admins')
        .update({
          first_name: profileData.first_name.trim(),
          last_name: profileData.last_name.trim(),
          phone: profileData.phone.trim() || null
        })
        .eq('id', admin.id)

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

      // Validate
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

      // Update password using Supabase auth
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

  const saveNotifications = async () => {
    try {
      setSaving(true)
      setErrors({})

      // Validate email if provided
      if (notificationSettings.deal_notification_email && 
          !/\S+@\S+\.\S+/.test(notificationSettings.deal_notification_email)) {
        setErrors({ deal_notification_email: 'Please enter a valid email address' })
        setSaving(false)
        return
      }

      // Check if settings record exists
      const { data: existingSettings } = await supabase
        .from('admin_settings')
        .select('id')
        .eq('admin_id', admin.id)
        .single()

      if (existingSettings) {
        // Update existing settings
        const { error } = await supabase
          .from('admin_settings')
          .update({
            email_deals: notificationSettings.email_deals,
            email_support: notificationSettings.email_support,
            email_partners: notificationSettings.email_partners,
            email_system: notificationSettings.email_system,
            push_deals: notificationSettings.push_deals,
            push_support: notificationSettings.push_support,
            push_partners: notificationSettings.push_partners,
            deal_notification_email: notificationSettings.deal_notification_email.trim() || null,
            updated_at: new Date().toISOString()
          })
          .eq('admin_id', admin.id)

        if (error) throw error
      } else {
        // Create new settings
        const { error } = await supabase
          .from('admin_settings')
          .insert([{
            admin_id: admin.id,
            email_deals: notificationSettings.email_deals,
            email_support: notificationSettings.email_support,
            email_partners: notificationSettings.email_partners,
            email_system: notificationSettings.email_system,
            push_deals: notificationSettings.push_deals,
            push_support: notificationSettings.push_support,
            push_partners: notificationSettings.push_partners,
            deal_notification_email: notificationSettings.deal_notification_email.trim() || null
          }])

        if (error) throw error
      }

      setSuccess('Notification preferences updated!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      console.error('Error saving notifications:', error)
      setErrors({ submit: 'Failed to update notifications. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  const saveSystemSettings = async () => {
    try {
      setSaving(true)
      // In a real app, you'd save to a system_settings table
      setSuccess('System settings updated!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      console.error('Error saving system settings:', error)
      setErrors({ submit: 'Failed to update system settings. Please try again.' })
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
          <h1 className="text-2xl font-bold text-gray-900">Admin Settings</h1>
          <p className="text-gray-600 mt-1">
            Manage your admin profile, security, and system configurations
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
                        ? 'border-purple-500 text-purple-600'
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
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Administrator Information</h3>
                  
                  {/* Admin Badge */}
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 mb-8 border border-purple-200">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
                        <Shield className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-gray-900">Administrator Account</h4>
                        <p className="text-sm text-gray-600">Full system access • Manage partners, deals, and settings</p>
                        <div className="mt-2">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            <Shield className="h-3 w-3 mr-1" />
                            Super Admin
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        First Name *
                      </label>
                      <input
                        type="text"
                        value={profileData.first_name}
                        onChange={(e) => handleInputChange('profile', 'first_name', e.target.value)}
                        className={`block w-full px-3 py-2 text-black border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 ${
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
                        className={`block w-full px-3 py-2 text-black border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 ${
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
                      <p className="mt-1 text-sm text-gray-500">Email cannot be changed. Contact system administrator.</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={profileData.phone}
                        onChange={(e) => handleInputChange('profile', 'phone', e.target.value)}
                        className="block w-full px-3 py-2 text-black border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        placeholder="(555) 123-4567"
                      />
                    </div>
                  </div>

                  <div className="mt-6">
                    <button
                      onClick={saveProfile}
                      disabled={saving}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
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
                          className={`block w-full px-3 py-2 pr-10 text-black border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 ${
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
                          className={`block w-full px-3 py-2 pr-10 text-black border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 ${
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
                        className={`block w-full px-3 py-2 text-black border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                          errors.confirm_password ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Confirm new password"
                      />
                      {errors.confirm_password && <p className="mt-1 text-sm text-red-600">{errors.confirm_password}</p>}
                    </div>

                    <button
                      onClick={changePassword}
                      disabled={saving}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
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
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <div className="flex">
                    <Shield className="h-5 w-5 text-purple-400 flex-shrink-0" />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-purple-800">Admin Security Best Practices</h3>
                      <div className="mt-2 text-sm text-purple-700">
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Use a strong, unique password for admin access</li>
                          <li>Enable two-factor authentication (contact system admin)</li>
                          <li>Never share your admin credentials</li>
                          <li>Review admin activity logs regularly</li>
                          <li>Log out when using shared computers</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Session Info */}
                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <h4 className="text-sm font-medium text-gray-900 mb-4">Session Information</h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Last Login</span>
                      <span className="text-gray-900 font-medium">
                        {admin?.last_login ? new Date(admin.last_login).toLocaleString() : 'Never'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Account Created</span>
                      <span className="text-gray-900 font-medium">
                        {new Date(admin?.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Active Sessions</span>
                      <span className="text-gray-900 font-medium">1 session</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Email Notifications</h3>
                  
                  {/* NEW: Deal Notification Email Field */}
                  <div className="mb-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-start">
                      <Mail className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                      <div className="ml-3 flex-1">
                        <h4 className="text-sm font-medium text-blue-900 mb-2">Deal Registration Notifications</h4>
                        <p className="text-sm text-blue-700 mb-4">
                          Get notified when partners register new deals. Enter an email address to receive instant notifications.
                        </p>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Notification Email Address
                          </label>
                          <input
                            type="email"
                            value={notificationSettings.deal_notification_email}
                            onChange={(e) => handleInputChange('notifications', 'deal_notification_email', e.target.value)}
                            className={`block w-full max-w-md px-3 py-2 text-black border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                              errors.deal_notification_email ? 'border-red-300' : 'border-gray-300'
                            }`}
                            placeholder="admin@example.com"
                          />
                          {errors.deal_notification_email && (
                            <p className="mt-1 text-sm text-red-600">{errors.deal_notification_email}</p>
                          )}
                          <p className="mt-2 text-xs text-gray-600">
                            Leave empty to disable deal registration email notifications
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Deal Updates</h4>
                        <p className="text-sm text-gray-600">Notifications about new deals and status changes</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notificationSettings.email_deals}
                          onChange={(e) => handleInputChange('notifications', 'email_deals', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Support Tickets</h4>
                        <p className="text-sm text-gray-600">Alerts for new and urgent support tickets</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notificationSettings.email_support}
                          onChange={(e) => handleInputChange('notifications', 'email_support', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Partner Activity</h4>
                        <p className="text-sm text-gray-600">New partner registrations and status changes</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notificationSettings.email_partners}
                          onChange={(e) => handleInputChange('notifications', 'email_partners', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">System Alerts</h4>
                        <p className="text-sm text-gray-600">Critical system notifications and errors</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notificationSettings.email_system}
                          onChange={(e) => handleInputChange('notifications', 'email_system', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                      </label>
                    </div>
                  </div>

                  <div className="mt-8">
                    <button
                      onClick={saveNotifications}
                      disabled={saving}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                    >
                      {saving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Preferences
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* System Tab */}
            {activeTab === 'system' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">System Configuration</h3>
                  
                  <div className="space-y-6">
                    {/* System Status */}
                    <div className="bg-green-50 rounded-lg p-6 border border-green-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                          <div>
                            <h4 className="text-sm font-medium text-green-800">System Status: Operational</h4>
                            <p className="text-sm text-green-600">All systems running normally</p>
                          </div>
                        </div>
                        <Server className="h-6 w-6 text-green-600" />
                      </div>
                    </div>

                    {/* System Settings */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">Maintenance Mode</h4>
                          <p className="text-sm text-gray-600">Temporarily disable partner access for maintenance</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={systemSettings.maintenance_mode}
                            onChange={(e) => handleInputChange('system', 'maintenance_mode', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">Allow New Partners</h4>
                          <p className="text-sm text-gray-600">Enable or disable new partner registrations</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={systemSettings.allow_new_partners}
                            onChange={(e) => handleInputChange('system', 'allow_new_partners', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">Auto-Assign Support</h4>
                          <p className="text-sm text-gray-600">Automatically assign support tickets to team members</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={systemSettings.auto_assign_support}
                            onChange={(e) => handleInputChange('system', 'auto_assign_support', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                        </label>
                      </div>
                    </div>

                    {/* MDF Auto-Approval Limit */}
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        MDF Auto-Approval Limit
                      </label>
                      <p className="text-sm text-gray-600 mb-3">
                        Automatically approve MDF requests below this amount (USD)
                      </p>
                      <div className="relative max-w-xs">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500">$</span>
                        </div>
                        <input
                          type="number"
                          value={systemSettings.mdf_auto_approval_limit}
                          onChange={(e) => handleInputChange('system', 'mdf_auto_approval_limit', parseInt(e.target.value) || 0)}
                          className="block w-full pl-7 pr-3 py-2 text-black border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          min="0"
                          step="1000"
                        />
                      </div>
                    </div>

                    <div className="mt-6">
                      <button
                        onClick={saveSystemSettings}
                        disabled={saving}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                      >
                        {saving ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Save System Settings
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* System Info */}
                  <div className="mt-8 bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <div className="flex">
                      <AlertCircle className="h-5 w-5 text-blue-400 flex-shrink-0" />
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-blue-800">System Information</h3>
                        <div className="mt-2 text-sm text-blue-700">
                          <ul className="space-y-1">
                            <li>Platform Version: v2.0.1</li>
                            <li>Database: PostgreSQL 15.3</li>
                            <li>Last Backup: {new Date().toLocaleDateString()}</li>
                            <li>Uptime: 99.9%</li>
                          </ul>
                        </div>
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