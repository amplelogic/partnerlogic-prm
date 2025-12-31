'use client'

import { useState, useEffect, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import InvoiceGenerator from '@/components/InvoiceGenerator'
import { 
  ArrowLeft, Building2, Mail, Phone, Calendar, 
  DollarSign, User, AlertCircle, TrendingUp,
  FileText, Package, Download, File, FileImage, 
  FileVideo, Paperclip
} from 'lucide-react'
import { CURRENCIES } from '@/lib/currencyUtils'


export default function DealDetailPage({ params }) {
  const unwrappedParams = use(params)
  const dealId = unwrappedParams.id
  
  const [deal, setDeal] = useState(null)
  const [partner, setPartner] = useState(null)
  const [attachments, setAttachments] = useState([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadDealData()
  }, [dealId])

  const loadDealData = async () => {
    try {
      setLoading(true)

      // Get current partner manager
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      const { data: managerData } = await supabase
        .from('partner_managers')
        .select('*')
        .eq('auth_user_id', user.id)
        .single()

      if (!managerData) {
        setLoading(false)
        return
      }

      // Get partners assigned to this manager
      const { data: partnersData } = await supabase
        .from('partners')
        .select('id')
        .eq('partner_manager_id', managerData.id)

      const partnerIds = partnersData?.map(p => p.id) || []

      if (partnerIds.length === 0) {
        setLoading(false)
        return
      }

      // Get deal with partner info - only if it belongs to assigned partners
      const { data: dealData, error: dealError } = await supabase
        .from('deals')
        .select(`
          *,
          partners!inner(
            id,
            first_name,
            last_name,
            email,
            phone,
            organization:organizations(*)
          )
        `)
        .eq('id', dealId)
        .in('partner_id', partnerIds)
        .single()

      if (dealError) {
        console.error('Error loading deal:', dealError)
        setLoading(false)
        return
      }

      setDeal(dealData)
      setPartner(dealData.partners)

      // Parse attachments if they exist
      if (dealData.attachments) {
        try {
          const parsedAttachments = JSON.parse(dealData.attachments)
          setAttachments(parsedAttachments)
        } catch (e) {
          console.error('Error parsing attachments:', e)
        }
      }

    } catch (error) {
      console.error('Error loading deal:', error)
    } finally {
      setLoading(false)
    }
  }

const formatCurrency = (amount, currencyCode = 'USD') => {
  if (!amount) return `${CURRENCIES[currencyCode]?.symbol || '$'}0`
  
  const currency = CURRENCIES[currencyCode] || CURRENCIES.USD
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.code,
    minimumFractionDigits: 0
  }).format(amount)
}

  const getFileIcon = (file) => {
    if (!file || !file.type || typeof file.type !== 'string') return File
    if (file.type.startsWith('video/')) return FileVideo
    if (file.type.startsWith('image/')) return FileImage
    if (file.type.includes('pdf') || file.type.includes('document')) return FileText
    return File
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const getStageColor = (stage) => {
    switch (stage) {
      case 'lead': return 'bg-gray-100 text-gray-800'
      case 'qualified': return 'bg-blue-100 text-blue-800'
      case 'proposal': return 'bg-yellow-100 text-yellow-800'
      case 'negotiation': return 'bg-purple-100 text-purple-800'
      case 'closed_won': return 'bg-green-100 text-green-800'
      case 'closed_lost': return 'bg-red-100 text-red-800'
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

  if (!deal) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Deal Not Found</h2>
            <p className="text-gray-600 mb-6">This deal doesn't exist or you don't have access.</p>
            <Link
              href="/partner-manager/deals"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Deals
            </Link>
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
          <Link
            href="/partner-manager/deals"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <ArrowLeft className="h-5 w-5 mr-1" />
            Back to All Deals
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {deal.customer_name}
              </h1>
              <p className="text-gray-600">{deal.customer_company}</p>
            </div>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStageColor(deal.stage)}`}>
              {deal.stage?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Deal Information */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Deal Information</h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Deal Value</p>
                    <p className="text-xl font-bold text-gray-900">{formatCurrency(deal.deal_value, deal.currency)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Expected Close Date</p>
                    <p className="font-medium text-gray-900">
                      {deal.expected_close_date 
                        ? new Date(deal.expected_close_date).toLocaleDateString()
                        : 'Not set'}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-2">Customer Contact</p>
                  <div className="flex items-center space-x-3 mb-2">
                    <Mail className="h-5 w-5 text-gray-400" />
                    <span className="text-gray-900">{deal.customer_email}</span>
                  </div>
                  {deal.customer_phone && (
                    <div className="flex items-center space-x-3">
                      <Phone className="h-5 w-5 text-gray-400" />
                      <span className="text-gray-900">{deal.customer_phone}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Registered</p>
                    <p className="font-medium text-gray-900">
                      {new Date(deal.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Product Information */}
            {deal.product_name && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Product Information</h2>
                </div>
                <div className="p-6">
                  <div className="flex items-center space-x-3">
                    <Package className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">{deal.product_name}</p>
                      {deal.product_details && (
                        <p className="text-sm text-gray-600 mt-1">{deal.product_details}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notes */}
            {deal.notes && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Notes</h2>
                </div>
                <div className="p-6">
                  <p className="text-gray-700 whitespace-pre-wrap">{deal.notes}</p>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Partner Information */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Partner Information</h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {partner?.first_name} {partner?.last_name}
                    </p>
                    <p className="text-sm text-gray-600">{partner?.organization?.name}</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <div className="space-y-2">
                    <div className="flex items-center text-sm">
                      <Mail className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-gray-900">{partner?.email}</span>
                    </div>
                    {partner?.phone && (
                      <div className="flex items-center text-sm">
                        <Phone className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-gray-900">{partner?.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                <Link
                  href={`/partner-manager/partners/${partner?.id}`}
                  className="block w-full mt-4 px-4 py-2 bg-blue-50 text-blue-700 text-center rounded-lg hover:bg-blue-100 transition-colors"
                >
                  View Partner Profile
                </Link>
              </div>
            </div>

            {/* Deal Metrics */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Deal Metrics</h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Deal Value</span>
                  <span className="text-sm font-semibold text-gray-900">{formatCurrency(deal.deal_value, deal.currency)}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <DollarSign className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Partner Commission</p>
                    <p className="text-sm text-gray-600">{formatCurrency(deal.your_commission, deal.currency)}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <DollarSign className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Price to Ample Logic</p>
                    <p className="text-sm text-gray-600">{formatCurrency(deal.price_to_ample_logic, deal.currency)}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Current Stage</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${getStageColor(deal.stage)}`}>
                    {deal.stage?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Expected Close Date</p>
                    <p className="text-sm text-gray-600">
                      {deal.expected_close_date 
                        ? new Date(deal.expected_close_date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })
                        : 'Not set'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Days in Pipeline</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {Math.floor((new Date() - new Date(deal.created_at)) / (1000 * 60 * 60 * 24))} days
                  </span>
                </div>
              </div>
            </div>
            {/* Attachments */}
            {attachments.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center">
                    <Paperclip className="h-5 w-5 text-gray-400 mr-2" />
                    <h2 className="text-lg font-semibold text-gray-900">Attachments</h2>
                    <span className="ml-2 text-sm text-gray-500">({attachments.length})</span>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="space-y-3">
                    {attachments.map((file, index) => {
                      const FileIcon = getFileIcon(file)
                      return (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          <div className="flex items-center space-x-3 flex-1 min-w-0">
                            <FileIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {file.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {formatFileSize(file.size)}
                              </p>
                            </div>
                          </div>
                          <a
                            href={file.url}
                            download={file.name}
                            className="ml-3 flex-shrink-0 p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                            title="Download file"
                          >
                            <Download className="h-4 w-4" />
                          </a>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Invoice Generator */}
            {(deal.stage === 'closed_won' || deal.admin_stage === 'closed_won') && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Generate Invoice</h2>
                </div>
                
                <div className="p-6">
                  <InvoiceGenerator deal={deal} partner={partner} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}