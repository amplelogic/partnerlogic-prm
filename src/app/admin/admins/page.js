// src/app/admin/admins/page.js
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { 
  Search, Filter, Eye, Edit2, Users, Shield,
  Mail, Calendar, ChevronDown, Plus, Trash2
} from 'lucide-react'

export default function AdminsPage() {
  const [admins, setAdmins] = useState([])
  const [filteredAdmins, setFilteredAdmins] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState('desc')
  const [showFilters, setShowFilters] = useState(false)
  const [deleting, setDeleting] = useState(null)

  const supabase = createClient()

  useEffect(() => {
    loadAdmins()
  }, [])

  useEffect(() => {
    filterAndSortAdmins()
  }, [admins, searchTerm, sortBy, sortOrder])

  const loadAdmins = async () => {
    try {
      setLoading(true)
      
      const { data: adminsData, error } = await supabase
        .from('admins')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      setAdmins(adminsData || [])
    } catch (error) {
      console.error('Error loading admins:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterAndSortAdmins = () => {
    let filtered = [...admins]

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(admin =>
        admin.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        admin.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        admin.email?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue

      if (sortBy === 'name') {
        aValue = `${a.first_name} ${a.last_name}`
        bValue = `${b.first_name} ${b.last_name}`
      } else {
        aValue = a[sortBy]
        bValue = b[sortBy]
      }

      if (sortBy === 'created_at') {
        aValue = new Date(aValue)
        bValue = new Date(bValue)
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
      return 0
    })

    setFilteredAdmins(filtered)
  }

  const handleDelete = async (adminId) => {
    if (!confirm('Are you sure you want to delete this admin? This action cannot be undone.')) {
      return
    }

    try {
      setDeleting(adminId)
      
      // Get admin to find auth_user_id
      const admin = admins.find(a => a.id === adminId)
      
      if (!admin) {
        throw new Error('Admin not found')
      }

      // Delete admin record
      const { error: adminError } = await supabase
        .from('admins')
        .delete()
        .eq('id', adminId)

      if (adminError) throw adminError

      // Delete auth user
      if (admin.auth_user_id) {
        const { error: authError } = await supabase.auth.admin.deleteUser(admin.auth_user_id)
        if (authError) {
          console.error('Error deleting auth user:', authError)
        }
      }

      // Remove from local state
      setAdmins(admins.filter(a => a.id !== adminId))
      
    } catch (error) {
      console.error('Error deleting admin:', error)
      alert('Failed to delete admin. Please try again.')
    } finally {
      setDeleting(null)
    }
  }

  const calculateStats = () => {
    const totalAdmins = filteredAdmins.length
    const recentAdmins = filteredAdmins.filter(a => {
      const createdDate = new Date(a.created_at)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      return createdDate > thirtyDaysAgo
    }).length

    return { totalAdmins, recentAdmins }
  }

  const stats = calculateStats()

  if (loading) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl p-6 border">
                  <div className="h-12 bg-gray-200 rounded mb-4"></div>
                  <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                </div>
              ))}
            </div>
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
              <h1 className="text-2xl font-bold text-gray-900">Admin Management</h1>
              <p className="text-gray-600 mt-1">
                Manage administrator accounts and permissions
              </p>
            </div>
            <Link
              href="/admin/partners/new"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Admin
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Shield className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.totalAdmins}</p>
                <p className="text-sm text-gray-600">Total Admins</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.recentAdmins}</p>
                <p className="text-sm text-gray-600">Added (30 days)</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Shield className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.totalAdmins}</p>
                <p className="text-sm text-gray-600">Active Admins</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              {/* Search */}
              <div className="relative flex-1 max-w-lg">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-purple-500 focus:border-purple-500 sm:text-sm text-gray-900"
                />
              </div>

              {/* Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <Filter className="h-4 w-4 mr-2" />
                Sort
                <ChevronDown className={`ml-2 h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* Expandable Filters */}
            {showFilters && (
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sort By
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900"
                  >
                    <option value="created_at">Join Date</option>
                    <option value="name">Name</option>
                    <option value="email">Email</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Order
                  </label>
                  <button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    {sortOrder === 'asc' ? '↑ Ascending' : '↓ Descending'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Admins List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {filteredAdmins.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {admins.length === 0 ? 'No admins yet' : 'No admins match your filters'}
              </h3>
              <p className="text-gray-600 mb-6">
                {admins.length === 0 
                  ? 'Add your first administrator to get started.'
                  : 'Try adjusting your search criteria.'
                }
              </p>
              {admins.length === 0 && (
                <Link
                  href="/admin/partners/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Admin
                </Link>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredAdmins.map((admin) => (
                <div key={admin.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <Shield className="h-6 w-6 text-white" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-1">
                          <h3 className="text-lg font-medium text-gray-900">
                            {admin.first_name} {admin.last_name}
                          </h3>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            <Shield className="h-3 w-3 mr-1" />
                            Administrator
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-6 text-sm text-gray-600">
                          <div className="flex items-center">
                            <Mail className="h-4 w-4 mr-1" />
                            {admin.email}
                          </div>
                          {admin.phone && (
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              {admin.phone}
                            </div>
                          )}
                        </div>

                        <div className="mt-2 flex items-center text-sm text-gray-500">
                          <Calendar className="h-4 w-4 mr-1" />
                          <span>Joined {new Date(admin.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <Link
                        href={`/admin/admins/${admin.id}`}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Link>
                      <Link
                        href={`/admin/admins/${admin.id}/edit`}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <Edit2 className="h-4 w-4 mr-1" />
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(admin.id)}
                        disabled={deleting === admin.id}
                        className="inline-flex items-center px-3 py-1.5 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                      >
                        {deleting === admin.id ? (
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
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}