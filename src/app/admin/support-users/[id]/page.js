'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, Edit, Mail, Phone, Calendar, Shield,
  Headphones, CheckCircle, XCircle, User, Wrench,
  Users, FileText
} from 'lucide-react'

export default function SupportUserViewPage() {
  const params = useParams()
  const router = useRouter()
  const [supportUser, setSupportUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const supportTypes = {
    technical: { label: 'Technical Support', icon: Wrench, color: 'bg-blue-100 text-blue-800' },
    sales: { label: 'Sales Support', icon: Users, color: 'bg-green-100 text-green-800' },
    presales: { label: 'Pre-sales Engineering', icon: FileText, color: 'bg-purple-100 text-purple-800' },
    accounts: { label: 'Account Management', icon: Users, color: 'bg-orange-100 text-orange-800' }
  }

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

    } catch (error) {
      console.error('Error loading support user:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="py-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
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

  const typeInfo = supportTypes[supportUser.support_type] || supportTypes.technical
  const TypeIcon = typeInfo.icon

  return (
    <div className="py-6">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin/support-users"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-5 w-5 mr-1" />
            Back to Support Users
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {supportUser.first_name} {supportUser.last_name}
              </h1>
              <p className="text-gray-600">{typeInfo.label}</p>
            </div>
            <Link
              href={`/admin/support-users/${supportUser.id}/edit`}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Link>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Status Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                  <TypeIcon className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {supportUser.first_name} {supportUser.last_name}
                  </h2>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeInfo.color}`}>
                    <Headphones className="h-3 w-3 mr-1" />
                    {typeInfo.label}
                  </span>
                </div>
              </div>
              <div>
                {supportUser.active ? (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                    <XCircle className="h-4 w-4 mr-1" />
                    Inactive
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <User className="h-5 w-5 mr-2 text-gray-400" />
                Contact Information
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Email</p>
                    <p className="text-sm text-gray-900">{supportUser.email}</p>
                  </div>
                </div>
              </div>

              {supportUser.phone && (
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div className="flex items-center space-x-3">
                    <Phone className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Phone</p>
                      <p className="text-sm text-gray-900">{supportUser.phone}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between py-3">
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Joined</p>
                    <p className="text-sm text-gray-900">
                      {new Date(supportUser.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Support Type Details */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Headphones className="h-5 w-5 mr-2 text-gray-400" />
                Support Assignment
              </h3>
            </div>
            <div className="p-6">
              <div className="flex items-start space-x-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${typeInfo.color}`}>
                  <TypeIcon className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{typeInfo.label}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {supportUser.support_type === 'technical' && 'Handles software, integration, and technical issues'}
                    {supportUser.support_type === 'sales' && 'Assists with deal progression and sales process'}
                    {supportUser.support_type === 'presales' && 'Provides technical consultation and demos'}
                    {supportUser.support_type === 'accounts' && 'Manages billing and contract support'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}