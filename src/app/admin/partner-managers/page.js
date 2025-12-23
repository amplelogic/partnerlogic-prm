'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { 
  Search, Eye, Edit2, Users, Mail, Calendar, Plus,
  CheckCircle, Clock, XCircle, Trash2
} from 'lucide-react'

export default function PartnerManagersPage() {
  const [managers, setManagers] = useState([])
  const [filteredManagers, setFilteredManagers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [deleting, setDeleting] = useState(null)
  const supabase = createClient()

  useEffect(() => {
    loadManagers()
  }, [])

  useEffect(() => {
    filterManagers()
  }, [managers, searchTerm])

  const loadManagers = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('partner_managers')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      setManagers(data || [])
    } catch (error) {
      console.error('Error loading partner managers:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterManagers = () => {
    if (!searchTerm) {
      setFilteredManagers(managers)
      return
    }

    const filtered = managers.filter(manager =>
      manager.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      manager.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      manager.email?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredManagers(filtered)
  }

  const handleDelete = async (managerId) => {
    if (!confirm('Are you sure you want to delete this partner manager? This action cannot be undone.')) {
      return
    }

    try {
      setDeleting(managerId)
      
      // Get manager to find auth_user_id
      const manager = managers.find(m => m.id === managerId)
      
      if (!manager) {
        throw new Error('Partner manager not found')
      }

      // Delete partner manager record
      const { error: managerError } = await supabase
        .from('partner_managers')
        .delete()
        .eq('id', managerId)

      if (managerError) throw managerError

      // Delete auth user
      if (manager.auth_user_id) {
        const { error: authError } = await supabase.auth.admin.deleteUser(manager.auth_user_id)
        if (authError) {
          console.error('Error deleting auth user:', authError)
        }
      }

      // Remove from local state
      setManagers(managers.filter(m => m.id !== managerId))
      
    } catch (error) {
      console.error('Error deleting partner manager:', error)
      alert('Failed to delete partner manager. Please try again.')
    } finally {
      setDeleting(null)
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
      default: return Clock
    }
  }

  if (loading) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/4 mb-6"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Partner Managers</h1>
              <p className="text-gray-600 mt-1">
                Manage partner relationship managers
              </p>
            </div>
            <Link
              href="/admin/partners/new"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Partner Manager
            </Link>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="p-6">
            <div className="relative max-w-lg">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-gray-900"
              />
            </div>
          </div>
        </div>

        {/* List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {filteredManagers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No partner managers found
              </h3>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredManagers.map((manager) => {
                const StatusIcon = getStatusIcon(manager.status)
                return (
                  <div key={manager.id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 flex-1">
                        <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                          <Users className="h-6 w-6 text-white" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3 mb-1">
                            <h3 className="text-lg font-medium text-gray-900">
                              {manager.first_name} {manager.last_name}
                            </h3>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(manager.status)}`}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {manager.status?.charAt(0).toUpperCase() + manager.status?.slice(1)}
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-6 text-sm text-gray-600">
                            <div className="flex items-center">
                              <Mail className="h-4 w-4 mr-1" />
                              {manager.email}
                            </div>
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              Joined {new Date(manager.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        <Link
                          href={`/admin/partner-managers/${manager.id}`}
                          className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Link>
                        <Link
                          href={`/admin/partner-managers/${manager.id}/edit`}
                          className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                          <Edit2 className="h-4 w-4 mr-1" />
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(manager.id)}
                          disabled={deleting === manager.id}
                          className="inline-flex items-center px-3 py-1.5 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                        >
                          {deleting === manager.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                          ) : (
                            <>
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}