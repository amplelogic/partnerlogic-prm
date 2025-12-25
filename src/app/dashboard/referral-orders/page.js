// src/app/dashboard/referral-orders/page.js
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { 
  Search, Plus, ShoppingCart, Calendar, DollarSign,
  Eye, Tag, CheckCircle, Clock, AlertCircle, Filter, Trash2
} from 'lucide-react'
import { formatCurrency as formatCurrencyUtil } from '@/lib/currencyUtils'

export default function ReferralOrdersPage() {
  const [orders, setOrders] = useState([])
  const [filteredOrders, setFilteredOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [partner, setPartner] = useState(null)
  const [deleting, setDeleting] = useState(null)
  
  const supabase = createClient()

  useEffect(() => {
    loadOrders()
  }, [])

  useEffect(() => {
    filterOrders()
  }, [searchTerm, statusFilter, orders])

  const loadOrders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: partnerData } = await supabase
        .from('partners')
        .select('*')
        .eq('auth_user_id', user.id)
        .single()

      if (!partnerData) return
      setPartner(partnerData)

      const { data: ordersData, error } = await supabase
        .from('referral_orders')
        .select('*')
        .eq('partner_id', partnerData.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setOrders(ordersData || [])
    } catch (error) {
      console.error('Error loading referral orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterOrders = () => {
    let filtered = [...orders]

    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.client_company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.product_name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter)
    }

    setFilteredOrders(filtered)
  }

  const handleDelete = async (orderId) => {
    if (!confirm('Are you sure you want to delete this referral order? This action cannot be undone.')) {
      return
    }

    try {
      setDeleting(orderId)
      
      const { error } = await supabase
        .from('referral_orders')
        .delete()
        .eq('id', orderId)

      if (error) throw error

      // Remove from local state
      setOrders(orders.filter(o => o.id !== orderId))
      
    } catch (error) {
      console.error('Error deleting referral order:', error)
      alert('Failed to delete referral order. Please try again.')
    } finally {
      setDeleting(null)
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getStatusIcon = (status) => {
    const icons = {
      pending: Clock,
      processing: AlertCircle,
      completed: CheckCircle,
      cancelled: AlertCircle
    }
    return icons[status] || Clock
  }

  if (loading) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/4 mb-6"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
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
              <h1 className="text-2xl font-bold text-gray-900">Referral Orders</h1>
              <p className="mt-1 text-sm text-gray-600">
                Manage your referral orders and track commissions
              </p>
            </div>
            <Link
              href="/dashboard/referral-orders/new"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Referral Order
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search by client name, company, or product..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <ShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No referral orders</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || statusFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Get started by creating your first referral order'}
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <div className="mt-6">
                <Link
                  href="/dashboard/referral-orders/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Referral Order
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 divide-y divide-gray-200">
            {filteredOrders.map((order) => {
              const StatusIcon = getStatusIcon(order.status)
              return (
                <div key={order.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {order.client_name}
                        </h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {order.status?.charAt(0).toUpperCase() + order.status?.slice(1)}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="space-y-1">
                          <p className="text-sm text-gray-500">Company</p>
                          <p className="text-sm font-medium text-gray-900">{order.client_company || 'N/A'}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-gray-500">Product/Service</p>
                          <p className="text-sm font-medium text-gray-900">{order.product_name || 'N/A'}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-gray-500">Order Value</p>
                          <p className="text-sm font-semibold text-green-600">
                            {formatCurrencyUtil(order.order_value, order.currency)}
                          </p>
                        </div>
                      </div>

                      {order.commission_amount && (
                        <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-green-800">Your Commission</span>
                            <span className="text-base font-bold text-green-900">
                              {formatCurrencyUtil(order.commission_amount, order.currency)}
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {new Date(order.created_at).toLocaleDateString()}
                        </div>
                        {order.expected_delivery_date && (
                          <div className="flex items-center">
                            <Tag className="h-4 w-4 mr-1" />
                            Expected: {new Date(order.expected_delivery_date).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="ml-4 flex-shrink-0">
                      <div className="flex items-center space-x-3">
                        <Link
                          href={`/dashboard/referral-orders/${order.id}`}
                          className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Link>
                        <button
                          onClick={() => handleDelete(order.id)}
                          disabled={deleting === order.id}
                          className="inline-flex items-center px-3 py-1.5 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                        >
                          {deleting === order.id ? (
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
                </div>
              )
            })}
          </div>
        )}

        {/* Summary Stats */}
        {filteredOrders.length > 0 && (
          <div className="mt-6 bg-blue-50 rounded-lg p-6 border border-blue-100">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <p className="text-sm font-medium text-blue-900">Total Orders</p>
                <p className="mt-1 text-2xl font-bold text-blue-600">{filteredOrders.length}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-blue-900">Total Order Value</p>
                <p className="mt-1 text-2xl font-bold text-blue-600">
                  {formatCurrencyUtil(filteredOrders.reduce((sum, order) => sum + (order.order_value || 0), 0))}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-blue-900">Total Commission</p>
                <p className="mt-1 text-2xl font-bold text-blue-600">
                  {formatCurrencyUtil(filteredOrders.reduce((sum, order) => sum + (order.commission_amount || 0), 0))}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
