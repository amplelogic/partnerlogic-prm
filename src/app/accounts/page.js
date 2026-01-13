'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  FileText, DollarSign, TrendingUp, ShoppingCart,
  Clock, CheckCircle, AlertCircle, XCircle
} from 'lucide-react'
import { formatCurrency } from '@/lib/currencyUtils'

export default function AccountsPage() {
  const [stats, setStats] = useState({
    totalInvoices: 0,
    totalDeals: 0,
    totalReferrals: 0,
    totalRevenue: 0,
    paidInvoices: 0,
    unpaidInvoices: 0,
    overdueInvoices: 0,
    partialInvoices: 0
  })
  const [recentInvoices, setRecentInvoices] = useState([])
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      console.log('Loading dashboard data...')
      
      // Load all closed_won deals
      const { data: dealsData, error: dealsError } = await supabase
        .from('deals')
        .select(`
          *,
          partner:partners (
            id,
            first_name,
            last_name,
            organization:organizations (name)
          )
        `)
        .or('stage.eq.closed_won,admin_stage.eq.closed_won')
        .order('updated_at', { ascending: false })
        .limit(5)

      if (dealsError) {
        console.error('Error loading deals:', dealsError)
      } else {
        console.log('Loaded deals:', dealsData?.length || 0)
      }

      // Load completed referral orders
      const { data: referralData, error: referralError } = await supabase
        .from('referral_orders')
        .select(`
          *,
          partner:partners (
            id,
            first_name,
            last_name,
            organization:organizations (name)
          )
        `)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(5)

      if (referralError) {
        console.error('Error loading referrals:', referralError)
      } else {
        console.log('Loaded referral orders:', referralData?.length || 0)
      }

      // Load all deals for stats
      const { data: allDeals } = await supabase
        .from('deals')
        .select('*')
        .or('stage.eq.closed_won,admin_stage.eq.closed_won')

      // Load all referrals for stats
      const { data: allReferrals } = await supabase
        .from('referral_orders')
        .select('*')
        .eq('status', 'completed')

      // Calculate statistics
      const totalDeals = allDeals?.length || 0
      const totalReferrals = allReferrals?.length || 0
      const totalRevenue = (allDeals?.reduce((sum, d) => sum + (d.deal_value || 0), 0) || 0) +
                          (allReferrals?.reduce((sum, r) => sum + (r.order_value || 0), 0) || 0)

      const paidCount = allDeals?.filter(d => d.payment_status === 'paid')?.length || 0
      const unpaidCount = allDeals?.filter(d => !d.payment_status || d.payment_status === 'unpaid')?.length || 0
      const overdueCount = allDeals?.filter(d => d.payment_status === 'overdue')?.length || 0
      const partialCount = allDeals?.filter(d => d.payment_status === 'partial')?.length || 0

      setStats({
        totalInvoices: totalDeals + totalReferrals,
        totalDeals,
        totalReferrals,
        totalRevenue,
        paidInvoices: paidCount,
        unpaidInvoices: unpaidCount,
        overdueInvoices: overdueCount,
        partialInvoices: partialCount
      })

      // Combine and sort recent items
      const combinedRecent = [
        ...(dealsData?.map(d => ({ ...d, type: 'deal' })) || []),
        ...(referralData?.map(r => ({ ...r, type: 'referral' })) || [])
      ]
        .sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at))
        .slice(0, 5)

      setRecentInvoices(combinedRecent)

    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getPaymentStatusBadge = (status) => {
    const badges = {
      paid: { label: 'Paid', color: 'bg-green-100 text-green-800', icon: CheckCircle },
      unpaid: { label: 'Unpaid', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      partial: { label: 'Partial', color: 'bg-blue-100 text-blue-800', icon: AlertCircle },
      overdue: { label: 'Overdue', color: 'bg-red-100 text-red-800', icon: XCircle }
    }
    return badges[status] || badges.unpaid
  }

  if (loading) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-300 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
            <div className="h-64 bg-gray-200 rounded-lg"></div>
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
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="mt-1 text-sm text-gray-600">
            Monitor invoices, deals, and payment statuses
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Invoices */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Invoices</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">{stats.totalInvoices}</p>
                <p className="mt-1 text-xs text-gray-500">
                  {stats.totalDeals} deals, {stats.totalReferrals} referrals
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Total Revenue */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {formatCurrency(stats.totalRevenue)}
                </p>
                <p className="mt-1 text-xs text-green-600 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  From all invoices
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          {/* Paid Invoices */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Paid Invoices</p>
                <p className="mt-2 text-3xl font-bold text-green-600">{stats.paidInvoices}</p>
                <p className="mt-1 text-xs text-gray-500">
                  {stats.totalDeals > 0 ? ((stats.paidInvoices / stats.totalDeals) * 100).toFixed(0) : 0}% of deals
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          {/* Pending Invoices */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Payment</p>
                <p className="mt-2 text-3xl font-bold text-yellow-600">
                  {stats.unpaidInvoices + stats.partialInvoices}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {stats.overdueInvoices} overdue
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Payment Status Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Status Distribution */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Status Distribution</h2>
            <div className="space-y-4">
              {[
                { label: 'Paid', count: stats.paidInvoices, color: 'bg-green-500', textColor: 'text-green-700' },
                { label: 'Unpaid', count: stats.unpaidInvoices, color: 'bg-yellow-500', textColor: 'text-yellow-700' },
                { label: 'Partial', count: stats.partialInvoices, color: 'bg-blue-500', textColor: 'text-blue-700' },
                { label: 'Overdue', count: stats.overdueInvoices, color: 'bg-red-500', textColor: 'text-red-700' }
              ].map((status) => {
                const percentage = stats.totalDeals > 0 ? (status.count / stats.totalDeals) * 100 : 0
                return (
                  <div key={status.label}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-sm font-medium ${status.textColor}`}>
                        {status.label}
                      </span>
                      <span className="text-sm text-gray-600">
                        {status.count} ({percentage.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`${status.color} h-2 rounded-full transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <a
                href="/accounts/invoices"
                className="flex items-center justify-between p-4 rounded-lg border-2 border-gray-200 hover:border-green-500 hover:bg-green-50 transition-all group"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-green-100 transition-colors">
                    <FileText className="h-5 w-5 text-blue-600 group-hover:text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">View All Deal Invoices</p>
                    <p className="text-xs text-gray-500">Manage closed won deals</p>
                  </div>
                </div>
                <span className="text-gray-400 group-hover:text-green-600">→</span>
              </a>

              <a
                href="/accounts/invoices"
                className="flex items-center justify-between p-4 rounded-lg border-2 border-gray-200 hover:border-green-500 hover:bg-green-50 transition-all group"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                    <ShoppingCart className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">View Referral Orders</p>
                    <p className="text-xs text-gray-500">Completed referral invoices</p>
                  </div>
                </div>
                <span className="text-gray-400 group-hover:text-green-600">→</span>
              </a>

              <a
                href="/accounts/settings"
                className="flex items-center justify-between p-4 rounded-lg border-2 border-gray-200 hover:border-green-500 hover:bg-green-50 transition-all group"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-green-100 transition-colors">
                    <DollarSign className="h-5 w-5 text-gray-600 group-hover:text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Account Settings</p>
                    <p className="text-xs text-gray-500">Manage your profile</p>
                  </div>
                </div>
                <span className="text-gray-400 group-hover:text-green-600">→</span>
              </a>
            </div>
          </div>
        </div>

        {/* Recent Invoices */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Recent Invoices</h2>
              <a
                href="/accounts/invoices"
                className="text-sm font-medium text-green-600 hover:text-green-700"
              >
                View All →
              </a>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {recentInvoices.length === 0 ? (
              <div className="p-12 text-center">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No invoices yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Invoices will appear here as deals are closed
                </p>
              </div>
            ) : (
              recentInvoices.map((item) => (
                <div key={`${item.type}-${item.id}`} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-sm font-semibold text-gray-900">
                          {item.type === 'deal' ? item.customer_name : item.client_name}
                        </h3>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          item.type === 'deal' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {item.type === 'deal' ? 'Deal Invoice' : 'Referral Order'}
                        </span>
                        {item.type === 'deal' && (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            getPaymentStatusBadge(item.payment_status).color
                          }`}>
                            {getPaymentStatusBadge(item.payment_status).label}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span className="font-medium text-gray-900">
                          {formatCurrency(
                            item.type === 'deal' ? item.deal_value : item.order_value,
                            item.currency
                          )}
                        </span>
                        <span>•</span>
                        <span>
                          {item.partner 
                            ? `${item.partner.first_name} ${item.partner.last_name}`
                            : 'No Partner'
                          }
                        </span>
                        <span>•</span>
                        <span>
                          {new Date(item.updated_at || item.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
