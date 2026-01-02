// src/app/dashboard/referral-orders/new/page.js
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, Save, ShoppingCart, User, Mail, Building2, 
  Phone, DollarSign, Calendar, FileText, Tag, Package
} from 'lucide-react'
import { getCurrencyOptionsSync, formatCurrency } from '@/lib/currencyUtils'
import ProductMultiSelect from '@/components/ProductMultiSelect'
import { sendInvoiceEmail } from '@/lib/notifications'

export default function NewReferralOrderPage() {
  const [partner, setPartner] = useState(null)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState({})
  const [formData, setFormData] = useState({
    client_name: '',
    client_email: '',
    client_company: '',
    client_phone: '',
    selected_products: [],
    order_value: '',
    currency: 'USD',
    commission_percentage: '',
    commission_amount: '',
    status: 'completed',
    notes: ''
  })
  
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadPartner()
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true })

      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error('Error loading products:', error)
    }
  }

  const loadPartner = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data: partnerData } = await supabase
        .from('partners')
        .select(`
          *,
          organization:organizations(*)
        `)
        .eq('auth_user_id', user.id)
        .single()

      if (partnerData) {
        // Fetch current tier settings to get up-to-date commission percentage
        const { data: tierData } = await supabase
          .from('tier_settings')
          .select('discount_percentage')
          .eq('tier_name', partnerData.organization.tier)
          .single()
        
        // Override organization discount with current tier setting
        if (tierData) {
          partnerData.organization.discount_percentage = tierData.discount_percentage
        }
        
        setPartner(partnerData)
        // Set default commission percentage from partner's tier
        if (tierData?.discount_percentage) {
          setFormData(prev => ({
            ...prev,
            commission_percentage: tierData.discount_percentage
          }))
        }
      }
    } catch (error) {
      console.error('Error loading partner:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => {
      const updated = { ...prev, [name]: value }
      
      // Auto-calculate commission amount when order value or percentage changes
      if (name === 'order_value' || name === 'commission_percentage') {
        const orderValue = parseFloat(name === 'order_value' ? value : prev.order_value) || 0
        const percentage = parseFloat(name === 'commission_percentage' ? value : prev.commission_percentage) || 0
        updated.commission_amount = ((orderValue * percentage) / 100).toFixed(2)
      }
      
      return updated
    })
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.client_name.trim()) {
      newErrors.client_name = 'Client name is required'
    }
    
    if (!formData.client_email.trim()) {
      newErrors.client_email = 'Client email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.client_email)) {
      newErrors.client_email = 'Invalid email address'
    }
    
    if (!formData.selected_products || formData.selected_products.length === 0) {
      newErrors.selected_products = 'At least one product must be selected'
    }
    
    if (!formData.order_value || parseFloat(formData.order_value) <= 0) {
      newErrors.order_value = 'Order value must be greater than 0'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    setSubmitting(true)
    
    try {
      // Get selected product details - combine names
      const productNames = formData.selected_products.map(p => p.name).join(', ')
      const productDescriptions = formData.selected_products.map(p => p.description).filter(Boolean).join(' | ')
      
      console.log('Creating referral order with data:', {
        partner_id: partner.id,
        client_name: formData.client_name,
        client_email: formData.client_email,
        order_value: parseFloat(formData.order_value),
        currency: formData.currency
      })

      const { data, error } = await supabase
        .from('referral_orders')
        .insert([{
          partner_id: partner.id,
          client_name: formData.client_name,
          client_email: formData.client_email,
          client_company: formData.client_company || null,
          client_phone: formData.client_phone || null,
          product_name: productNames,
          product_description: productDescriptions || null,
          order_value: parseFloat(formData.order_value),
          currency: formData.currency,
          commission_percentage: parseFloat(formData.commission_percentage) || 0,
          commission_amount: parseFloat(formData.commission_amount) || 0,
          expected_delivery_date: new Date().toISOString().split('T')[0], // Today's date
          status: 'completed', // Always completed
          notes: formData.notes || null
        }])
        .select()

      if (error) {
        console.error('Supabase error details:', error)
        console.error('Error message:', error.message)
        console.error('Error code:', error.code)
        console.error('Error hint:', error.hint)
        console.error('Error details:', error.details)
        alert(`Database Error: ${error.message || error.code || 'Unknown error'}\n\nCheck console for details`)
        throw error
      }

      console.log('✅ Referral order created:', data[0].id)

      // Send invoice emails to client and partner manager (async, non-blocking)
      setTimeout(async () => {
        try {
          console.log('📧 Sending invoice emails for referral order...')
          
          // Get partner manager email
          let partnerManagerEmail = null
          if (partner.partner_manager_id) {
            const { data: managerData } = await supabase
              .from('partner_managers')
              .select('email')
              .eq('id', partner.partner_manager_id)
              .single()
            
            partnerManagerEmail = managerData?.email
          }

          await sendInvoiceEmail({
            dealId: data[0].id,
            customerName: formData.client_name,
            customerEmail: formData.client_email,
            partnerManagerEmail,
            amount: formatCurrency(parseFloat(formData.order_value), formData.currency),
            description: formData.notes || `Referral order for ${productNames}`
          })

          console.log('✅ Referral order invoice emails sent successfully')
        } catch (emailError) {
          console.error('Error sending invoice emails:', emailError)
        }
      }, 500)

      router.push('/dashboard/referral-orders')
      router.refresh()
    } catch (error) {
      console.error('Error creating referral order:', error)
      console.error('Full error object:', JSON.stringify(error, null, 2))
      alert(`Failed to create referral order: ${error.message || 'Please try again.'}`)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="py-6">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/3 mb-6"></div>
            <div className="space-y-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="py-6">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard/referral-orders"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Referral Orders
          </Link>
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <ShoppingCart className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Create Referral Order</h1>
              <p className="mt-1 text-sm text-gray-600">
                Submit a new referral order and earn commission
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Client Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <User className="h-5 w-5 mr-2 text-gray-400" />
              Client Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Client Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="client_name"
                  value={formData.client_name}
                  onChange={handleChange}
                  className={`block w-full px-3 py-2 border ${errors.client_name ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black`}
                  placeholder="John Doe"
                />
                {errors.client_name && (
                  <p className="mt-1 text-sm text-red-600">{errors.client_name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Client Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="client_email"
                  value={formData.client_email}
                  onChange={handleChange}
                  className={`block w-full px-3 py-2 border ${errors.client_email ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black`}
                  placeholder="john@example.com"
                />
                {errors.client_email && (
                  <p className="mt-1 text-sm text-red-600">{errors.client_email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name
                </label>
                <input
                  type="text"
                  name="client_company"
                  value={formData.client_company}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
                  placeholder="Acme Corp"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="client_phone"
                  value={formData.client_phone}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
                  placeholder="+1 (555) 000-0000"
                />
              </div>
            </div>
          </div>

          {/* Product/Service Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <Package className="h-5 w-5 mr-2 text-gray-400" />
              Product/Service Information
            </h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Products <span className="text-red-500">*</span>
                </label>
                <ProductMultiSelect
                  selectedProducts={formData.selected_products}
                  onChange={(products) => {
                    setFormData(prev => ({ ...prev, selected_products: products }))
                    if (errors.selected_products) {
                      setErrors(prev => ({ ...prev, selected_products: '' }))
                    }
                  }}
                />
                {errors.selected_products && (
                  <p className="mt-1 text-sm text-red-600">{errors.selected_products}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">You can select multiple products for this referral order</p>
              </div>
            </div>
          </div>

          {/* Order Details */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <DollarSign className="h-5 w-5 mr-2 text-gray-400" />
              Order Details
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Order Value <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="order_value"
                  value={formData.order_value}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  className={`block w-full px-3 py-2 border ${errors.order_value ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black`}
                  placeholder="0.00"
                />
                {errors.order_value && (
                  <p className="mt-1 text-sm text-red-600">{errors.order_value}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Currency
                </label>
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
                >
                  {getCurrencyOptionsSync().map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Commission Percentage (%)
                </label>
                <input
                  type="number"
                  name="commission_percentage"
                  value={formData.commission_percentage}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  max="100"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Commission Amount
                </label>
                <input
                  type="number"
                  name="commission_amount"
                  value={formData.commission_amount}
                  readOnly
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-600"
                  placeholder="Auto-calculated"
                />
                <p className="mt-1 text-xs text-gray-500">Automatically calculated</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Order Date
                </label>
                <input
                  type="text"
                  value={new Date().toLocaleDateString()}
                  readOnly
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-600"
                />
                <p className="mt-1 text-xs text-gray-500">Automatically set to today</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <input
                  type="text"
                  value="Completed"
                  readOnly
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-green-50 text-green-700 font-medium"
                />
                <p className="mt-1 text-xs text-gray-500">Referral orders are automatically completed</p>
              </div>
            </div>
          </div>

          {/* Additional Notes */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <FileText className="h-5 w-5 mr-2 text-gray-400" />
              Additional Notes
            </h2>
            
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={4}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
              placeholder="Any additional information about this referral order..."
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <Link
              href="/dashboard/referral-orders"
              className="px-6 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Create Referral Order
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
