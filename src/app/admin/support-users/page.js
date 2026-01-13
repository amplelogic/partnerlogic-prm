'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { 
  Plus, Search, Filter, Eye, Edit, Headphones, Wrench,
  Users, FileText, CheckCircle, XCircle, Mail, Phone, Trash2
} from 'lucide-react'

export default function AdminSupportUsersPage() {
  const [supportUsers, setSupportUsers] = useState([])
  const [filteredUsers, setFilteredUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [deletingId, setDeletingId] = useState(null)

  const supabase = createClient()

  const supportTypes = [
    { value: 'all', label: 'All Types' },
    { value: 'technical', label: 'Technical Support', icon: Wrench },
    { value: 'sales', label: 'Sales Support', icon: Users },
    { value: 'presales', label: 'Pre-sales Engineering', icon: FileText },
    { value: 'accounts', label: 'Account Management', icon: Users }
  ]

  useEffect(() => {
    loadSupportUsers()
  }, [])

  useEffect(() => {
    filterUsers()
  }, [supportUsers, searchTerm, typeFilter, statusFilter])

  const loadSupportUsers = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('support_users')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      setSupportUsers(data || [])

    } catch (error) {
      console.error('Error loading support users:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterUsers = () => {
    let filtered = [...supportUsers]

    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(user => user.support_type === typeFilter)
    }

    if (statusFilter !== 'all') {
      const isActive = statusFilter === 'active'
      filtered = filtered.filter(user => user.active === isActive)
    }

    setFilteredUsers(filtered)
  }

  const handleDelete = async (userId, userName) => {
    if (!confirm(`Are you sure you want to delete ${userName}? This action cannot be undone.`)) {
      return
    }

    try {
      setDeletingId(userId)

      const { error } = await supabase
        .from('support_users')
        .delete()
        .eq('id', userId)

      if (error) throw error

      // Remove from local state
      setSupportUsers(prev => prev.filter(u => u.id !== userId))
      
      alert('Support user deleted successfully')
    } catch (error) {
      console.error('Error deleting support user:', error)
      alert('Failed to delete support user. Please try again.')
    } finally {
      setDeletingId(null)
    }
  }

  const getTypeIcon = (type) => {
    const typeConfig = supportTypes.find(t => t.value === type)
    return typeConfig?.icon || Headphones
  }

  const getTypeLabel = (type) => {
    const typeConfig = supportTypes.find(t => t.value === type)
    return typeConfig?.label || type
  }

  const getTypeColor = (type) => {
    switch (type) {
      case 'technical': return 'bg-blue-100 text-blue-800'
      case 'sales': return 'bg-green-100 text-green-800'
      case 'presales': return 'bg-purple-100 text-purple-800'
      case 'accounts': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
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
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Support Users</h1>
              <p className="text-gray-600 mt-1">
                Manage support team members and their assigned ticket types
              </p>
            </div>
            <Link
              href="/admin/support-users/new"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Support User
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Headphones className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{supportUsers.length}</p>
                <p className="text-sm text-gray-600">Total Users</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">
                  {supportUsers.filter(u => u.active).length}
                </p>
                <p className="text-sm text-gray-600">Active</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Wrench className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">
                  {supportUsers.filter(u => u.support_type === 'technical').length}
                </p>
                <p className="text-sm text-gray-600">Technical</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">
                  {supportUsers.filter(u => u.support_type === 'sales').length}
                </p>
                <p className="text-sm text-gray-600">Sales</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
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

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
              >
                {supportTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <Headphones className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No support users found</h3>
              <p className="text-gray-600 mb-6">
                {supportUsers.length === 0 
                  ? 'Get started by creating your first support user.'
                  : 'Try adjusting your search or filter criteria.'
                }
              </p>
              {supportUsers.length === 0 && (
                <Link
                  href="/admin/support-users/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Support User
                </Link>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredUsers.map((user) => {
                const TypeIcon = getTypeIcon(user.support_type)
                return (
                  <div key={user.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                          <TypeIcon className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-3">
                            <h3 className="text-lg font-medium text-gray-900">
                              {user.first_name} {user.last_name}
                            </h3>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(user.support_type)}`}>
                              {getTypeLabel(user.support_type)}
                            </span>
                            {user.active ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                <XCircle className="h-3 w-3 mr-1" />
                                Inactive
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                            <div className="flex items-center">
                              <Mail className="h-4 w-4 mr-1" />
                              {user.email}
                            </div>
                            {user.phone && (
                              <div className="flex items-center">
                                <Phone className="h-4 w-4 mr-1" />
                                {user.phone}
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Joined {new Date(user.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Link
                          href={`/admin/support-users/${user.id}`}
                          className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Link>
                        <Link
                          href={`/admin/support-users/${user.id}/edit`}
                          className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(user.id, `${user.first_name} ${user.last_name}`)}
                          disabled={deletingId === user.id}
                          className="inline-flex items-center px-3 py-1.5 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          {deletingId === user.id ? 'Deleting...' : 'Delete'}
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