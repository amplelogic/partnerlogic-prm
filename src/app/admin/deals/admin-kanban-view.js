// src/app/admin/deals/admin-kanban-view.js
'use client'

import { useState, useEffect } from 'react'
import { DndContext, DragOverlay, closestCenter, pointerWithin, rectIntersection, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { createClient } from '@/lib/supabase/client'
import { DollarSign, ExternalLink, User, ChevronRight, ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { CURRENCIES, formatCurrency } from '@/lib/currencyUtils'
import { notifyPartner, NotificationTemplates, sendInvoiceEmail } from '@/lib/notifications'

// SALES STAGES - Visible by default
const SALES_STAGES = [
  { id: 'new_deal', label: 'New Deal', color: 'bg-gray-100 border-gray-300' },
  { id: 'need_analysis', label: 'Need Analysis', color: 'bg-blue-100 border-blue-300' },
  { id: 'proposal', label: 'Proposal', color: 'bg-yellow-100 border-yellow-300' },
  { id: 'negotiation', label: 'Negotiation', color: 'bg-purple-100 border-purple-300' },
  { id: 'closed_won', label: 'Closed Won', color: 'bg-green-100 border-green-300' },
  { id: 'closed_lost', label: 'Closed Lost', color: 'bg-red-100 border-red-300' }
]

// IMPLEMENTATION STAGES - Hidden by default, shown when expanded
const IMPLEMENTATION_STAGES = [
  { id: 'urs', label: 'URS', color: 'bg-cyan-100 border-cyan-300' },
  { id: 'base_deployment', label: 'Base Deployment', color: 'bg-indigo-100 border-indigo-300' },
  { id: 'gap_assessment', label: 'Gap Assessment', color: 'bg-pink-100 border-pink-300' },
  { id: 'development', label: 'Development', color: 'bg-orange-100 border-orange-300' },
  { id: 'uat', label: 'UAT', color: 'bg-teal-100 border-teal-300' },
  { id: 'iq', label: 'IQ', color: 'bg-lime-100 border-lime-300' },
  { id: 'oq', label: 'OQ', color: 'bg-amber-100 border-amber-300' },
  { id: 'deployment', label: 'Deployment', color: 'bg-emerald-100 border-emerald-300' },
  { id: 'pq', label: 'PQ', color: 'bg-violet-100 border-violet-300' },
  { id: 'live', label: 'LIVE', color: 'bg-green-200 border-green-400' }
]

// Deal Card Component (Draggable)
function DealCard({ deal, isDragging }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: deal.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
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

  const getSalesStageColor = (stage) => {
    switch (stage) {
      case 'new_deal': return 'bg-gray-100 text-gray-700'
      case 'need_analysis': return 'bg-blue-100 text-blue-700'
      case 'proposal': return 'bg-yellow-100 text-yellow-700'
      case 'negotiation': return 'bg-purple-100 text-purple-700'
      case 'closed_won': return 'bg-green-100 text-green-700'
      case 'closed_lost': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getSalesStageLabel = (stage) => {
    const labels = {
      'new_deal': 'New',
      'need_analysis': 'Analysis',
      'proposal': 'Proposal',
      'negotiation': 'Negotiation',
      'closed_won': 'Won',
      'closed_lost': 'Lost'
    }
    return labels[stage] || stage
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white rounded-md border border-gray-200 p-2 mb-1.5 shadow-sm hover:shadow-md transition-all group"
    >
      {/* Draggable Area */}
      <div {...attributes} {...listeners} className="cursor-move">
        <h4 className="font-medium text-gray-900 text-xs truncate mb-1">
          {deal.customer_name}
        </h4>

        {deal.stage && (
          <div className="mb-1.5">
            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium ${getSalesStageColor(deal.stage)}`}>
              Sales: {getSalesStageLabel(deal.stage)}
            </span>
          </div>
        )}

        <div className="flex items-center text-xs font-semibold text-green-600 mb-1.5">
          {formatCurrency(deal.deal_value, deal.currency)}
        </div>

        {deal.partner && (
          <div className="flex items-center text-[10px] text-gray-500 mb-1.5 truncate">
            <User className="h-2.5 w-2.5 mr-1 flex-shrink-0" />
            <span className="truncate">{deal.partner.first_name} {deal.partner.last_name}</span>
          </div>
        )}
      </div>

      {/* Open Deal Button - Not draggable */}
      <Link
        href={`/admin/deals/${deal.id}`}
        className="flex items-center justify-center w-full px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-600 text-[10px] font-medium rounded transition-colors"
      >
        <span>Open</span>
        <ExternalLink className="h-2.5 w-2.5 ml-1" />
      </Link>
    </div>
  )
}

// Column Component
function KanbanColumn({ stage, deals, activeId }) {
  const { setNodeRef, isOver } = useSortable({
    id: stage.id,
    data: {
      type: 'column',
      stage: stage.id,
    },
  })

  const dealsInStage = deals.filter(deal => deal.admin_stage === stage.id)
  const totalValue = dealsInStage.reduce((sum, deal) => sum + (deal.deal_value || 0), 0)

const formatCurrency = (amount, currencyCode = 'USD') => {
  if (!amount) return `${CURRENCIES[currencyCode]?.symbol || '$'}0`
  
  const currency = CURRENCIES[currencyCode] || CURRENCIES.USD
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.code,
    minimumFractionDigits: 0
  }).format(amount)
}
  return (
    <div className="flex flex-col w-44 flex-shrink-0 bg-gray-50 rounded-lg">
      <div className={`p-2 border-b-3 rounded-t-lg ${stage.color}`}>
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-semibold text-gray-900 text-[11px] leading-tight">{stage.label}</h3>
          <span className="bg-white px-1.5 py-0.5 rounded-full text-[9px] font-medium text-gray-700">
            {dealsInStage.length}
          </span>
        </div>
        <div className="text-[10px] font-medium text-gray-600">
          {formatCurrency(totalValue, dealsInStage[0]?.currency)}
        </div>
      </div>

      <div
        ref={setNodeRef}
        className={`flex-1 p-1.5 overflow-y-auto min-h-[500px] max-h-[calc(100vh-300px)] transition-colors ${
          isOver ? 'bg-purple-50 ring-2 ring-purple-400 ring-inset' : ''
        }`}
      >
        <SortableContext items={dealsInStage.map(d => d.id)} strategy={verticalListSortingStrategy}>
          {dealsInStage.map(deal => (
            <DealCard
              key={deal.id}
              deal={deal}
              isDragging={activeId === deal.id}
            />
          ))}
        </SortableContext>

        {dealsInStage.length === 0 && (
          <div className="text-center py-6 text-gray-400 text-[10px]">
            Drop here
          </div>
        )}
      </div>
    </div>
  )
}

// Collapsible Divider Component
function CollapsibleDivider({ isExpanded, onToggle, implementationDealsCount }) {
  return (
    <div className="flex flex-col justify-center items-center w-12 flex-shrink-0 mx-2">
      <button
        onClick={onToggle}
        className="group relative flex flex-col items-center justify-center bg-white border-2 border-gray-300 rounded-lg p-2 hover:bg-gray-50 hover:border-purple-400 transition-all shadow-sm hover:shadow-md"
        title={isExpanded ? "Hide implementation stages" : "Show implementation stages"}
      >
        {/* Icon */}
        {isExpanded ? (
          <ChevronDown className="h-6 w-6 text-purple-600 mb-1" />
        ) : (
          <ChevronRight className="h-6 w-6 text-purple-600 mb-1" />
        )}
        
        {/* Label */}
        <div className="text-[9px] font-semibold text-gray-700 text-center leading-tight mb-1">
          {isExpanded ? 'Hide' : 'Show'}
        </div>
        
        {/* Badge */}
        <div className="bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full text-[8px] font-bold">
          {implementationDealsCount}
        </div>
        
        {/* Tooltip */}
        <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
          {isExpanded ? 'Hide implementation stages' : 'Show implementation stages'}
          <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
        </div>
      </button>
      
      {/* Vertical line indicator */}
      <div className="w-0.5 h-full bg-gradient-to-b from-purple-300 via-purple-200 to-transparent mt-2"></div>
    </div>
  )
}

// Main Kanban Board Component
export default function AdminKanbanView({ deals, onDealUpdate }) {
  const [activeId, setActiveId] = useState(null)
  const [isImplementationExpanded, setIsImplementationExpanded] = useState(false)
  
  
  const dealsWithAdminStage = deals.map(deal => ({
    ...deal,
    admin_stage: deal.admin_stage || 'urs'
  }))
  const [localDeals, setLocalDeals] = useState(dealsWithAdminStage)
  const supabase = createClient()

  useEffect(() => {
    const updatedDeals = deals.map(deal => ({
      ...deal,
      admin_stage: deal.admin_stage || 'urs'
    }))
    setLocalDeals(updatedDeals)
  }, [deals])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3,
        delay: 100,
        tolerance: 5,
      },
    })
  )

  // Custom collision detection for better drop zone detection
  const collisionDetectionStrategy = (args) => {
    // First, try pointer-based detection (most accurate for drop zones)
    const pointerCollisions = pointerWithin(args)
    if (pointerCollisions.length > 0) {
      return pointerCollisions
    }

    // Fall back to intersection-based detection
    const intersectionCollisions = rectIntersection(args)
    if (intersectionCollisions.length > 0) {
      return intersectionCollisions
    }

    // Finally, use center-based detection
    return closestCenter(args)
  }

  // Calculate implementation deals count
  const implementationDealsCount = localDeals.filter(deal => 
    IMPLEMENTATION_STAGES.some(stage => stage.id === deal.admin_stage)
  ).length

  // Get all active stages based on expansion state
  const activeStages = isImplementationExpanded 
    ? [...SALES_STAGES, ...IMPLEMENTATION_STAGES]
    : SALES_STAGES

  const handleDragStart = (event) => {
    setActiveId(event.active.id)
  }

  const handleDragOver = (event) => {
    const { active, over } = event

    if (!over) return

    const activeId = active.id
    const overId = over.id

    const activeDeal = localDeals.find(d => d.id === activeId)
    if (!activeDeal) return

    let targetStage

    if (activeStages.find(s => s.id === overId)) {
      targetStage = overId
    } else {
      const overDeal = localDeals.find(d => d.id === overId)
      if (overDeal) {
        targetStage = overDeal.admin_stage
      }
    }

    if (targetStage && activeDeal.admin_stage !== targetStage) {
      setLocalDeals(prevDeals =>
        prevDeals.map(deal =>
          deal.id === activeId ? { ...deal, admin_stage: targetStage } : deal
        )
      )
    }
  }

  const handleDragEnd = async (event) => {
    const { active, over } = event

    setActiveId(null)

    if (!over) return

    const activeId = active.id
    const activeDeal = localDeals.find(d => d.id === activeId)

    if (!activeDeal) return

    const newAdminStage = activeDeal.admin_stage
    const originalDeal = deals.find(d => d.id === activeId)
    const oldAdminStage = originalDeal?.admin_stage || 'urs'

    if (newAdminStage === oldAdminStage) return

    try {
      const updates = {
        admin_stage: newAdminStage,
        updated_at: new Date().toISOString()
      }

      // If moving to closed_won and invoice not sent yet, set timestamp and send emails
      if (newAdminStage === 'closed_won') {
        const { data: dealData } = await supabase
          .from('deals')
          .select('invoice_sent_at, customer_email, customer_name, deal_value, currency, description, partner_id')
          .eq('id', activeId)
          .single()

        if (!dealData?.invoice_sent_at) {
          updates.invoice_sent_at = new Date().toISOString()
          
          // Send invoice emails after updating
          setTimeout(async () => {
            try {
              console.log('📧 Sending invoice emails for closed won deal (admin)...')
              
              // Get partner manager email
              let partnerManagerEmail = null
              if (dealData.partner_id) {
                const { data: partnerData } = await supabase
                  .from('partners')
                  .select('partner_manager_id')
                  .eq('id', dealData.partner_id)
                  .single()
                
                if (partnerData?.partner_manager_id) {
                  const { data: managerData } = await supabase
                    .from('partner_managers')
                    .select('email')
                    .eq('id', partnerData.partner_manager_id)
                    .single()
                  
                  partnerManagerEmail = managerData?.email
                }
              }

              await sendInvoiceEmail({
                dealId: activeId,
                customerName: dealData.customer_name,
                customerEmail: dealData.customer_email,
                partnerManagerEmail,
                amount: formatCurrency(dealData.deal_value, dealData.currency),
                description: dealData.description
              })

              console.log('✅ Invoice emails sent successfully')
            } catch (emailError) {
              console.error('Error sending invoice emails:', emailError)
            }
          }, 500)
        }
      }

      const { data, error } = await supabase
        .from('deals')
        .update(updates)
        .eq('id', activeId)
        .select()

      if (error) throw error

      if (!data || data.length === 0) {
        throw new Error('No deal was updated')
      }

      try {
        await supabase
          .from('deal_activities')
          .insert([{
            deal_id: activeId,
            activity_type: 'stage_updated',
            description: `Implementation stage updated to ${activeStages.find(s => s.id === newAdminStage)?.label}`
          }])
      } catch (activityError) {
        console.error('Error logging activity:', activityError)
      }

      // Notify partner about stage change
      try {
        if (activeDeal.partner_id) {
          const dealName = `${activeDeal.customer_company || activeDeal.customer_name}`
          const oldStageLabel = activeStages.find(s => s.id === oldAdminStage)?.label || oldAdminStage
          const newStageLabel = activeStages.find(s => s.id === newAdminStage)?.label || newAdminStage
          
          const notification = NotificationTemplates.dealStatusChanged(dealName, oldStageLabel, newStageLabel)
          await notifyPartner({
            partnerId: activeDeal.partner_id,
            ...notification,
            referenceId: activeId,
            referenceType: 'deal'
          })
        }
      } catch (notificationError) {
        console.error('Error sending notification:', notificationError)
      }

      // Notify account users when deal is closed won
      if (newAdminStage === 'closed_won' && oldAdminStage !== 'closed_won') {
        try {
          const { data: accountUsers } = await supabase
            .from('account_users')
            .select('auth_user_id')
            .eq('active', true)

          if (accountUsers && accountUsers.length > 0) {
            const dealName = `${activeDeal.customer_company || activeDeal.customer_name}`
            const dealValue = formatCurrency(activeDeal.deal_value, activeDeal.currency)
            
            const notifications = accountUsers.map(user => ({
              user_id: user.auth_user_id,
              title: 'New Invoice Ready',
              message: `Deal "${dealName}" (${dealValue}) has been closed won. Invoice is ready for processing.`,
              type: 'invoice',
              is_read: false,
              reference_id: activeId,
              reference_type: 'deal'
            }))

            await fetch('/api/notifications/create', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ notifications })
            })
          }
        } catch (error) {
          console.error('Error notifying account users:', error)
        }
      }

      // Notify account users when deal is closed won
      if (newAdminStage === 'closed_won' && oldAdminStage !== 'closed_won') {
        console.log('🔔 Notifying account users via API...')
        try {
          const response = await fetch('/api/notifications/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              notifyAccountUsers: true,
              dealId: activeId,
              dealName: `${activeDeal.customer_company || activeDeal.customer_name}`,
              dealValue: formatCurrency(activeDeal.deal_value, activeDeal.currency)
            })
          })

          const result = await response.json()
          
          if (response.ok) {
            console.log('✅ Account users notified successfully:', result)
          } else {
            console.error('❌ Failed to notify account users:', result)
          }
        } catch (error) {
          console.error('❌ Error notifying account users:', error)
        }
      }

      // Notify account users when deal is closed won via API
      if (newAdminStage === 'closed_won' && oldAdminStage !== 'closed_won') {
        console.log('🔔 Notifying account users via API...')
        try {
          const response = await fetch('/api/notifications/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              notifyAccountUsers: true,
              dealId: activeId,
              dealName: `${activeDeal.customer_company || activeDeal.customer_name}`,
              dealValue: formatCurrency(activeDeal.deal_value, activeDeal.currency)
            })
          })

          const result = await response.json()
          
          if (response.ok) {
            console.log('✅ Account users notified successfully:', result)
          } else {
            console.error('❌ Failed to notify account users:', result)
          }
        } catch (error) {
          console.error('❌ Error notifying account users:', error)
        }
      }

      if (onDealUpdate) {
        const updatedDeals = deals.map(deal => 
          deal.id === activeId ? data[0] : deal
        )
        onDealUpdate(updatedDeals)
      }
    } catch (error) {
      console.error('Error updating deal:', error)
      alert(`Failed to update deal stage: ${error.message || 'Please try again.'}`)
      setLocalDeals(deals.map(deal => ({
        ...deal,
        admin_stage: deal.admin_stage || 'urs'
      })))
    }
  }

  const activeDeal = activeId ? localDeals.find(d => d.id === activeId) : null

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetectionStrategy}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-2 overflow-x-auto pb-4">
        <SortableContext items={activeStages.map(s => s.id)} strategy={verticalListSortingStrategy}>
          {/* Sales Stages */}
          {SALES_STAGES.map(stage => (
            <KanbanColumn
              key={stage.id}
              stage={stage}
              deals={localDeals}
              activeId={activeId}
            />
          ))}
          
          {/* Collapsible Divider */}
          <CollapsibleDivider 
            isExpanded={isImplementationExpanded}
            onToggle={() => setIsImplementationExpanded(!isImplementationExpanded)}
            implementationDealsCount={implementationDealsCount}
          />
          
          {/* Implementation Stages (conditionally rendered) */}
          {isImplementationExpanded && IMPLEMENTATION_STAGES.map(stage => (
            <KanbanColumn
              key={stage.id}
              stage={stage}
              deals={localDeals}
              activeId={activeId}
            />
          ))}
        </SortableContext>
      </div>

      <DragOverlay>
        {activeDeal ? (
          <div className="bg-white rounded-md border-2 border-purple-500 p-2 shadow-xl rotate-2 cursor-grabbing w-44">
            <h4 className="font-medium text-gray-900 text-xs truncate">
              {activeDeal.customer_name}
            </h4>
            <div className="flex items-center text-xs font-semibold text-green-600 mt-1">
              <DollarSign className="h-3 w-3 mr-0.5" />
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 0,
                notation: 'compact'
              }).format(activeDeal.deal_value || 0)}
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}