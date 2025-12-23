'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, Edit2, Mail, Phone, Calendar, Users,
  CheckCircle, Clock, XCircle, AlertCircle, User, Activity,
  Building2
} from 'lucide-react'

export default function PartnerManagerViewPage() {
  const params = useParams()
  const router = useRouter()
  const [manager, setManager] = useState(null)
  const [partners, setPartners] = useState([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (params?.id) {
      loadManagerData()
    }
  }, [params?.id])

  const loadManagerData = async () => {
    try {
      setLoading(true)

      // Get partner manager
      const { data: managerData, error: managerError } = await supabase
        .from('partner_managers')
        .select('*')
        .eq('id', params.id)
        .single()

      if (managerError) throw managerError

      setManager(managerData)

      // Get partners assigned to this manager
      const { data: partnersData, error: partnersError } = await supabase
        .from('partners')
        .select(`
          *,
          organization:organizations(*)
        `)
        .eq('partner_manager_id', params.id)

      if (partnersError) throw partnersError

      setPartners(partnersData || [])

    } catch (error) {
      console.error('Error loading partner manager:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'inactive': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return CheckCircle
      case 'pending': return Clock
      case 'inactive': return XCircle
      default: return AlertCircle
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

  if (!manager) {
    return (
      <div className="py-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Partner Manager not found</h2>
            <Link href="/admin/partner-managers" className="text-blue-600 hover:text-blue-700">
              Back to Partner Managers
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const StatusIcon = getStatusIcon(manager.status)

  return (
    <div className="py-6">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin/partner-managers"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-5 w-5 mr-1" />
            Back to Partner Managers
          </Link>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                <Users className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {manager.first_name} {manager.last_name}
                </h1>
                <div className="flex items-center space-x-2 mt-1">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(manager.status)}`}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {manager.status?.charAt(0).toUpperCase() + manager.status?.slice(1)}
                  </span>
                </div>
              </div>
            </div>

            <Link
              href={`/admin/partner-managers/${manager.id}/edit`}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <Edit2 className="h-4 w-4 mr-2" />
              Edit Manager
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
                  <dd className="text-base text-gray-900">{manager.first_name}</dd>
                </div>

                <div>
                  <dt className="flex items-center text-sm font-medium text-gray-500 mb-1">
                    <User className="h-4 w-4 mr-2" />
                    Last Name
                  </dt>
                  <dd className="text-base text-gray-900">{manager.last_name}</dd>
                </div>

                <div>
                  <dt className="flex items-center text-sm font-medium text-gray-500 mb-1">
                    <Mail className="h-4 w-4 mr-2" />
                    Email Address
                  </dt>
                  <dd className="text-base text-gray-900">
                    <a href={`mailto:${manager.email}`} className="text-blue-600 hover:text-blue-700">
                      {manager.email}
                    </a>
                  </dd>
                </div>

                {manager.phone && (
                  <div>
                    <dt className="flex items-center text-sm font-medium text-gray-500 mb-1">
                      <Phone className="h-4 w-4 mr-2" />
                      Phone Number
                    </dt>
                    <dd className="text-base text-gray-900">
                      <a href={`tel:${manager.phone}`} className="text-blue-600 hover:text-blue-700">
                        {manager.phone}
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
                    {new Date(manager.created_at).toLocaleDateString('en-US', {
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
                    {new Date(manager.updated_at || manager.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </dd>
                </div>

                <div>
                  <dt className="flex items-center text-sm font-medium text-gray-500 mb-1">
                    <Users className="h-4 w-4 mr-2" />
                    Manager ID
                  </dt>
                  <dd className="text-base text-gray-900 font-mono text-sm">{manager.id}</dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Assigned Partners */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Assigned Partners</h2>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {partners.length} {partners.length === 1 ? 'Partner' : 'Partners'}
                </span>
              </div>
            </div>
            <div className="p-6">
              {partners.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No partners assigned yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {partners.map((partner) => (
                    <div key={partner.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {partner.first_name} {partner.last_name}
                          </p>
                          <div className="flex items-center text-sm text-gray-600">
                            <Building2 className="h-3 w-3 mr-1" />
                            {partner.organization?.name || 'No organization'}
                          </div>
                        </div>
                      </div>
                      <Link
                        href={`/admin/partners/${partner.id}`}
                        className="text-sm text-blue-600 hover:text-blue-700"
                      >
                        View Partner
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
