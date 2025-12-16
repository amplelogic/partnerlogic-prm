// src/app/admin/currencies/page.js
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  Plus, Search, Edit2, Trash2, Save, X, 
  DollarSign, Globe, CheckCircle, AlertCircle,
  ArrowUpDown, Eye, EyeOff
} from 'lucide-react'

export default function AdminCurrenciesPage() {
  const [currencies, setCurrencies] = useState([])
  const [filteredCurrencies, setFilteredCurrencies] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [sortField, setSortField] = useState('code')
  const [sortOrder, setSortOrder] = useState('asc')
  const [editForm, setEditForm] = useState({
    code: '',
    symbol: '',
    name: '',
    is_active: true
  })
  const [errors, setErrors] = useState({})
  
  const supabase = createClient()

  useEffect(() => {
    loadCurrencies()
  }, [])

  useEffect(() => {
    filterAndSortCurrencies()
  }, [currencies, searchTerm, sortField, sortOrder])

  const loadCurrencies = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('currencies')
        .select('*')
        .order('code', { ascending: true })

      if (error) throw error
      setCurrencies(data || [])
    } catch (error) {
      console.error('Error loading currencies:', error)
      alert('Failed to load currencies')
    } finally {
      setLoading(false)
    }
  }

  const filterAndSortCurrencies = () => {
    let filtered = [...currencies]

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(currency =>
        currency.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        currency.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        currency.symbol.includes(searchTerm)
      )
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue = a[sortField]
      let bValue = b[sortField]

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase()
        bValue = bValue.toLowerCase()
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
      return 0
    })

    setFilteredCurrencies(filtered)
  }

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  const validateForm = (formData) => {
    const newErrors = {}

    if (!formData.code || formData.code.length !== 3) {
      newErrors.code = 'Currency code must be exactly 3 characters'
    }

    if (!formData.symbol || formData.symbol.trim() === '') {
      newErrors.symbol = 'Symbol is required'
    }

    if (!formData.name || formData.name.trim() === '') {
      newErrors.name = 'Name is required'
    }

    // Check for duplicate code (only when adding new or changing code)
    const isDuplicate = currencies.some(c => 
      c.code.toUpperCase() === formData.code.toUpperCase() && 
      c.id !== editingId
    )
    if (isDuplicate) {
      newErrors.code = 'Currency code already exists'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleAdd = () => {
    setEditForm({
      code: '',
      symbol: '',
      name: '',
      is_active: true
    })
    setErrors({})
    setShowAddModal(true)
  }

  const handleEdit = (currency) => {
    setEditingId(currency.id)
    setEditForm({
      code: currency.code,
      symbol: currency.symbol,
      name: currency.name,
      is_active: currency.is_active
    })
    setErrors({})
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditForm({
      code: '',
      symbol: '',
      name: '',
      is_active: true
    })
    setErrors({})
  }

  const handleSaveNew = async () => {
    if (!validateForm(editForm)) return

    try {
      const { error } = await supabase
        .from('currencies')
        .insert([{
          code: editForm.code.toUpperCase(),
          symbol: editForm.symbol,
          name: editForm.name,
          is_active: editForm.is_active
        }])

      if (error) throw error

      setShowAddModal(false)
      setEditForm({
        code: '',
        symbol: '',
        name: '',
        is_active: true
      })
      await loadCurrencies()
      alert('Currency added successfully!')
    } catch (error) {
      console.error('Error adding currency:', error)
      alert('Failed to add currency: ' + error.message)
    }
  }

  const handleSaveEdit = async () => {
    if (!validateForm(editForm)) return

    try {
      const { error } = await supabase
        .from('currencies')
        .update({
          code: editForm.code.toUpperCase(),
          symbol: editForm.symbol,
          name: editForm.name,
          is_active: editForm.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingId)

      if (error) throw error

      setEditingId(null)
      setEditForm({
        code: '',
        symbol: '',
        name: '',
        is_active: true
      })
      await loadCurrencies()
      alert('Currency updated successfully!')
    } catch (error) {
      console.error('Error updating currency:', error)
      alert('Failed to update currency: ' + error.message)
    }
  }

  const handleDelete = async (id, code) => {
    if (!confirm(`Are you sure you want to delete ${code}? This action cannot be undone.`)) {
      return
    }

    try {
      // Check if currency is in use
      const { data: dealsData } = await supabase
        .from('deals')
        .select('id')
        .eq('currency', code)
        .limit(1)

      if (dealsData && dealsData.length > 0) {
        alert(`Cannot delete ${code} because it is currently in use by deals. Consider deactivating it instead.`)
        return
      }

      const { error } = await supabase
        .from('currencies')
        .delete()
        .eq('id', id)

      if (error) throw error

      await loadCurrencies()
      alert('Currency deleted successfully!')
    } catch (error) {
      console.error('Error deleting currency:', error)
      alert('Failed to delete currency: ' + error.message)
    }
  }

  const handleToggleActive = async (currency) => {
    try {
      const { error } = await supabase
        .from('currencies')
        .update({
          is_active: !currency.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', currency.id)

      if (error) throw error

      await loadCurrencies()
    } catch (error) {
      console.error('Error toggling currency status:', error)
      alert('Failed to update currency status')
    }
  }

  const stats = {
    total: currencies.length,
    active: currencies.filter(c => c.is_active).length,
    inactive: currencies.filter(c => !c.is_active).length
  }

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
              <h1 className="text-2xl font-bold text-gray-900">Currency Management</h1>
              <p className="text-gray-600 mt-1">
                Manage supported currencies for deals and transactions
              </p>
            </div>
            <button
              onClick={handleAdd}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Currency
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Globe className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-sm text-gray-600">Total Currencies</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
                <p className="text-sm text-gray-600">Active Currencies</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-gray-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.inactive}</p>
                <p className="text-sm text-gray-600">Inactive Currencies</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="p-6">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by code, name, or symbol..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900"
              />
            </div>
          </div>
        </div>

        {/* Currencies Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    onClick={() => handleSort('code')}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    <div className="flex items-center space-x-1">
                      <span>Code</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Symbol
                  </th>
                  <th 
                    onClick={() => handleSort('name')}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    <div className="flex items-center space-x-1">
                      <span>Name</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Updated
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCurrencies.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center">
                      <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-4">
                        {searchTerm ? 'No currencies match your search' : 'No currencies configured yet'}
                      </p>
                      {!searchTerm && (
                        <button
                          onClick={handleAdd}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Your First Currency
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredCurrencies.map((currency) => (
                    <tr key={currency.id} className="hover:bg-gray-50">
                      {editingId === currency.id ? (
                        <>
                          <td className="px-6 py-4">
                            <input
                              type="text"
                              value={editForm.code}
                              onChange={(e) => setEditForm({ ...editForm, code: e.target.value.toUpperCase() })}
                              maxLength={3}
                              className={`block w-20 px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-black ${
                                errors.code ? 'border-red-300' : 'border-gray-300'
                              }`}
                              placeholder="USD"
                            />
                            {errors.code && <p className="text-xs text-red-600 mt-1">{errors.code}</p>}
                          </td>
                          <td className="px-6 py-4">
                            <input
                              type="text"
                              value={editForm.symbol}
                              onChange={(e) => setEditForm({ ...editForm, symbol: e.target.value })}
                              className={`block w-16 px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-black ${
                                errors.symbol ? 'border-red-300' : 'border-gray-300'
                              }`}
                              placeholder="$"
                            />
                            {errors.symbol && <p className="text-xs text-red-600 mt-1">{errors.symbol}</p>}
                          </td>
                          <td className="px-6 py-4">
                            <input
                              type="text"
                              value={editForm.name}
                              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                              className={`block w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-black ${
                                errors.name ? 'border-red-300' : 'border-gray-300'
                              }`}
                              placeholder="US Dollar"
                            />
                            {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
                          </td>
                          <td className="px-6 py-4">
                            <label className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={editForm.is_active}
                                onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-sm text-gray-700">Active</span>
                            </label>
                          </td>
                          <td className="px-6 py-4"></td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={handleSaveEdit}
                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700"
                              >
                                <Save className="h-3 w-3 mr-1" />
                                Save
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                              >
                                <X className="h-3 w-3 mr-1" />
                                Cancel
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{currency.code}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-lg font-semibold text-gray-900">{currency.symbol}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">{currency.name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => handleToggleActive(currency)}
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                currency.is_active
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {currency.is_active ? (
                                <>
                                  <Eye className="h-3 w-3 mr-1" />
                                  Active
                                </>
                              ) : (
                                <>
                                  <EyeOff className="h-3 w-3 mr-1" />
                                  Inactive
                                </>
                              )}
                            </button>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(currency.updated_at || currency.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() => handleEdit(currency)}
                                className="text-blue-600 hover:text-blue-900"
                                title="Edit"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(currency.id, currency.code)}
                                className="text-red-600 hover:text-red-900"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Currency Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Add New Currency</h2>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Currency Code *
                  </label>
                  <input
                    type="text"
                    value={editForm.code}
                    onChange={(e) => setEditForm({ ...editForm, code: e.target.value.toUpperCase() })}
                    maxLength={3}
                    className={`block w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black ${
                      errors.code ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="USD"
                  />
                  {errors.code && <p className="text-xs text-red-600 mt-1">{errors.code}</p>}
                  <p className="text-xs text-gray-500 mt-1">3-letter ISO currency code</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Symbol *
                  </label>
                  <input
                    type="text"
                    value={editForm.symbol}
                    onChange={(e) => setEditForm({ ...editForm, symbol: e.target.value })}
                    className={`block w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black ${
                      errors.symbol ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="$"
                  />
                  {errors.symbol && <p className="text-xs text-red-600 mt-1">{errors.symbol}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Currency Name *
                  </label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className={`block w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black ${
                      errors.name ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="US Dollar"
                  />
                  {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editForm.is_active}
                      onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Set as active</span>
                  </label>
                </div>
              </div>

              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-xl flex items-center justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowAddModal(false)
                    setEditForm({ code: '', symbol: '', name: '', is_active: true })
                    setErrors({})
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveNew}
                  className="px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Save className="h-4 w-4 inline mr-2" />
                  Add Currency
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}