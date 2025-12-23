'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, Edit2, Mail, Phone, Calendar, Shield,
  CheckCircle, AlertCircle, User, Activity
} from 'lucide-react'

export default function AdminViewPage() {
  const params = useParams()
  const router = useRouter()
  const [admin, setAdmin] = useState(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (params?.id) {
      loadAdmin()
    }
  }, [params?.id])

  const loadAdmin = async () => {
    try {
      setLoading(true)

      const { data, error } = await supabase
        .from('admins')
        .select('*')
        .eq('id', params.id)
        .single()

      if (error) throw error

      setAdmin(data)

    } catch (error) {
      console.error('Error loading admin:', error)
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
            <div className="bg-white rounded-xl p-6 space-y-4">
              <div className="h-6 bg-gray-200 rounded w-3/4"></div>
              <div className="h-6 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!admin) {
    return (
      <div className="py-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Admin not found</h2>
            <Link href="/admin/admins" className="text-purple-600 hover:text-purple-700">
              Back to Admins
            </Link>
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
          <Link
            href="/admin/admins"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-5 w-5 mr-1" />
            Back to Admins
          </Link>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {admin.first_name} {admin.last_name}
                </h1>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    <Shield className="h-3 w-3 mr-1" />
                    Administrator
                  </span>
                </div>
              </div>
            </div>

            <Link
              href={`/admin/admins/${admin.id}/edit`}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <Edit2 className="h-4 w-4 mr-2" />
              Edit Admin
            </Link>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Contact Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Contact Information</h2>
            </div>
            <div className="p-6">
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <dt className="flex items-center text-sm font-medium text-gray-500 mb-1">
                    <User className="h-4 w-4 mr-2" />
                    First Name
                  </dt>
                  <dd className="text-base text-gray-900">{admin.first_name}</dd>
                </div>

                <div>
                  <dt className="flex items-center text-sm font-medium text-gray-500 mb-1">
                    <User className="h-4 w-4 mr-2" />
                    Last Name
                  </dt>
                  <dd className="text-base text-gray-900">{admin.last_name}</dd>
                </div>

                <div>
                  <dt className="flex items-center text-sm font-medium text-gray-500 mb-1">
                    <Mail className="h-4 w-4 mr-2" />
                    Email Address
                  </dt>
                  <dd className="text-base text-gray-900">
                    <a href={`mailto:${admin.email}`} className="text-purple-600 hover:text-purple-700">
                      {admin.email}
                    </a>
                  </dd>
                </div>

                {admin.phone && (
                  <div>
                    <dt className="flex items-center text-sm font-medium text-gray-500 mb-1">
                      <Phone className="h-4 w-4 mr-2" />
                      Phone Number
                    </dt>
                    <dd className="text-base text-gray-900">
                      <a href={`tel:${admin.phone}`} className="text-purple-600 hover:text-purple-700">
                        {admin.phone}
                      </a>
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </div>

          {/* Account Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Account Information</h2>
            </div>
            <div className="p-6">
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <dt className="flex items-center text-sm font-medium text-gray-500 mb-1">
                    <Calendar className="h-4 w-4 mr-2" />
                    Account Created
                  </dt>
                  <dd className="text-base text-gray-900">
                    {new Date(admin.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </dd>
                </div>

                <div>
                  <dt className="flex items-center text-sm font-medium text-gray-500 mb-1">
                    <Activity className="h-4 w-4 mr-2" />
                    Last Updated
                  </dt>
                  <dd className="text-base text-gray-900">
                    {new Date(admin.updated_at || admin.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </dd>
                </div>

                <div>
                  <dt className="flex items-center text-sm font-medium text-gray-500 mb-1">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Admin ID
                  </dt>
                  <dd className="text-base text-gray-900 font-mono text-sm">{admin.id}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
