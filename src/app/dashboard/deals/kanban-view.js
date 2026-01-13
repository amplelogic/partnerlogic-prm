'use client'

import { useState, useEffect, useMemo } from 'react'
import { DndContext, DragOverlay, closestCenter, pointerWithin, rectIntersection, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { createClient } from '@/lib/supabase/client'
import { DollarSign, ExternalLink, ChevronRight, ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { CURRENCIES, formatCurrency } from '@/lib/currencyUtils'
import { sendInvoiceEmail } from '@/lib/notifications'

// SALES STAGES - For all partners
const SALES_STAGES = [
  { id: 'new_deal', label: 'New Deal', color: 'bg-gray-100 border-gray-300' },
  { id: 'need_analysis', label: 'Need Analysis', color: 'bg-blue-100 border-blue-300' },
  { id: 'proposal', label: 'Proposal', color: 'bg-yellow-100 border-yellow-300' },
  { id: 'negotiation', label: 'Negotiation', color: 'bg-purple-100 border-purple-300' },
  { id: 'closed_won', label: 'Closed Won', color: 'bg-green-100 border-green-300' },
  { id: 'closed_lost', label: 'Closed Lost', color: 'bg-red-100 border-red-300' }
]

// IMPLEMENTATION STAGES - Only for full-cycle partners
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

// Deal Card Component (Draggable) - Compact Version
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white rounded-md border border-gray-200 p-2 mb-1.5 shadow-sm hover:shadow-md transition-all group"
    >
      {/* Draggable Area */}
      <div {...attributes} {...listeners} className="cursor-move">
        {/* Title */}
        <h4 className="font-medium text-gray-900 text-xs truncate mb-1.5">
          {deal.customer_name}
        </h4>

        {/* Price */}
        <div className="flex items-center text-xs font-semibold text-green-600 mb-1.5">
          {formatCurrency(deal.deal_value, deal.currency)}
        </div>
      </div>

      {/* Open Deal Button - Not draggable */}
      <Link
        href={`/dashboard/deals/${deal.id}`}
        className="flex items-center justify-center w-full px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-600 text-[10px] font-medium rounded transition-colors"
      >
        <span>Open</span>
        <ExternalLink className="h-2.5 w-2.5 ml-1" />
      </Link>
    </div>
  )
}

// Column Component (Drop Zone) - Narrower
function KanbanColumn({ stage, deals, activeId }) {
  const { setNodeRef, isOver } = useSortable({
    id: stage.id,
    data: {
      type: 'column',
      stage: stage.id,
    },
  })

  const dealsInStage = deals.filter(deal => deal.stage === stage.id)
  const totalValue = dealsInStage.reduce((sum, deal) => sum + (deal.deal_value || 0), 0)

  return (
    <div className="flex flex-col w-44 flex-shrink-0 bg-gray-50 rounded-lg">
      {/* Column Header */}
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

      {/* Drop Zone */}
      <div
        ref={setNodeRef}
        className={`flex-1 p-1.5 overflow-y-auto min-h-[500px] max-h-[calc(100vh-300px)] transition-colors ${
          isOver ? 'bg-blue-50 ring-2 ring-blue-400 ring-inset' : ''
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
export default function KanbanView({ deals, onDealUpdate, partnerOrganizationType, partnerId }) {
  const [activeId, setActiveId] = useState(null)
  const [localDeals, setLocalDeals] = useState(deals)
  const [showClosedWonModal, setShowClosedWonModal] = useState(false)
  const [pendingClosedWonDeal, setPendingClosedWonDeal] = useState(null)
  const [isImplementationExpanded, setIsImplementationExpanded] = useState(false)
  const supabase = createClient()
  
  // Determine which stages to show based on partner type (memoized to prevent infinite loops)
  const PARTNER_STAGES = useMemo(() => {
    return partnerOrganizationType === 'full_cycle' 
      ? [...SALES_STAGES, ...IMPLEMENTATION_STAGES] 
      : SALES_STAGES
  }, [partnerOrganizationType])
  
  // Debug log to verify partner type
  useEffect(() => {
    console.log('Partner Organization Type:', partnerOrganizationType)
    console.log('Total Stages:', PARTNER_STAGES.length)
    console.log('Stages:', PARTNER_STAGES.map(s => s.label))
  }, [partnerOrganizationType, PARTNER_STAGES])

  // Update localDeals when deals prop changes
  useEffect(() => {
    setLocalDeals(deals)
  }, [deals])
  
  // Auto-move deals to "new_deal" if they're in unauthorized stages
  useEffect(() => {
    const moveUnauthorizedDeals = async () => {
      const allowedStageIds = PARTNER_STAGES.map(s => s.id)
      const dealsToMove = localDeals.filter(deal => !allowedStageIds.includes(deal.stage))
      
      if (dealsToMove.length > 0) {
        console.log(`Moving ${dealsToMove.length} deal(s) from unauthorized stages to New Deal`)
        
        // Move each deal to new_deal stage
        for (const deal of dealsToMove) {
          try {
            const { error } = await supabase
              .from('deals')
              .update({
                stage: 'new_deal',
                updated_at: new Date().toISOString()
              })
              .eq('id', deal.id)

            if (error) throw error

            // Log activity
            await supabase
              .from('deal_activities')
              .insert([{
                deal_id: deal.id,
                activity_type: 'stage_updated',
                description: `Stage automatically moved from ${deal.stage} to New Deal due to partner type change`
              }])
          } catch (error) {
            console.error('Error moving deal:', error)
          }
        }
        
        // Update local state
        const updatedDeals = prevDeals.map(deal => 
          !allowedStageIds.includes(deal.stage) 
            ? { ...deal, stage: 'new_deal' }
            : deal
        )
        setLocalDeals(updatedDeals)
        
        // Notify parent with updated deals
        if (onDealUpdate) {
          onDealUpdate(updatedDeals)
        }
      }
    }
    
    if (localDeals.length > 0 && PARTNER_STAGES.length > 0) {
      moveUnauthorizedDeals()
    }
  }, [PARTNER_STAGES, localDeals.length]) // Only run when stages change or deal count changes

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

  const handleDragStart = (event) => {
    setActiveId(event.active.id)
  }

  const handleDragOver = (event) => {
    const { active, over } = event

    if (!over) return

    const activeId = active.id
    const overId = over.id

    // Find the active deal
    const activeDeal = localDeals.find(d => d.id === activeId)
    if (!activeDeal) return

    // Determine the target stage
    let targetStage

    // Check if we're over a column
    if (PARTNER_STAGES.find(s => s.id === overId)) {
      targetStage = overId
    } else {
      // We're over another deal, find its stage
      const overDeal = localDeals.find(d => d.id === overId)
      if (overDeal) {
        targetStage = overDeal.stage
      }
    }

    // Update local state if stage changed
    if (targetStage && activeDeal.stage !== targetStage) {
      setLocalDeals(prevDeals =>
        prevDeals.map(deal =>
          deal.id === activeId ? { ...deal, stage: targetStage } : deal
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

    // Check if deal is being moved to closed_won
    if (activeDeal.stage === 'closed_won') {
      // Check if invoice has already been sent (deal was previously closed_won)
      try {
        const { data: dealData } = await supabase
          .from('deals')
          .select('invoice_sent_at')
          .eq('id', activeDeal.id)
          .single()

        // Only show modal if invoice hasn't been sent yet
        if (!dealData?.invoice_sent_at) {
          setPendingClosedWonDeal(activeDeal)
          setShowClosedWonModal(true)
          return // Don't update database yet
        }
      } catch (error) {
        console.error('Error checking invoice status:', error)
      }
    }

    // Update in database for other stages or if invoice already sent
    await updateDealStage(activeDeal)
  }

  const updateDealStage = async (deal) => {
    try {
      const { error } = await supabase
        .from('deals')
        .update({
          stage: deal.stage,
          updated_at: new Date().toISOString()
        })
        .eq('id', deal.id)

      if (error) throw error

      // Log activity
      await supabase
        .from('deal_activities')
        .insert([{
          deal_id: deal.id,
          activity_type: 'stage_updated',
          description: `Stage updated to ${PARTNER_STAGES.find(s => s.id === deal.stage)?.label}`
        }])

      // Notify parent component
      if (onDealUpdate) {
        onDealUpdate(localDeals)
      }
    } catch (error) {
      console.error('Error updating deal:', error)
      // Revert on error
      setLocalDeals(deals)
    }
  }

  const handleConfirmClosedWon = async () => {
    if (pendingClosedWonDeal) {
      try {
        // Check if this is a referral partner
        const { data: partnerData } = await supabase
          .from('partners')
          .select('organization:organizations(type)')
          .eq('id', partnerId)
          .single()

        const isReferralPartner = partnerData?.organization?.type === 'referral'

        // Check if invoice already sent to prevent duplicates
        const { data: currentDeal } = await supabase
          .from('deals')
          .select('invoice_sent_at')
          .eq('id', pendingClosedWonDeal.id)
          .single()

        if (currentDeal?.invoice_sent_at) {
          console.log('⚠️ Invoice already sent, skipping email')
          // Still update the stage but don't send email
          await supabase
            .from('deals')
            .update({
              stage: pendingClosedWonDeal.stage,
              updated_at: new Date().toISOString()
            })
            .eq('id', pendingClosedWonDeal.id)

          await supabase
            .from('deal_activities')
            .insert([{
              deal_id: pendingClosedWonDeal.id,
              activity_type: 'stage_updated',
              description: `Stage updated to Closed Won`
            }])

          if (onDealUpdate) {
            onDealUpdate(localDeals)
          }

          setShowClosedWonModal(false)
          setPendingClosedWonDeal(null)
          return
        }

        // If referral partner, create referral order instead of sending invoice
        if (isReferralPartner) {
          console.log('🔄 Creating referral order for referral partner...')
          console.log('Deal data:', pendingClosedWonDeal)
          
          // Create referral order from the deal
          const { data: referralData, error: referralError } = await supabase
            .from('referral_orders')
            .insert([{
              partner_id: partnerId,
              client_name: pendingClosedWonDeal.customer_name,
              client_email: pendingClosedWonDeal.customer_email,
              client_company: pendingClosedWonDeal.customer_company || null,
              client_phone: pendingClosedWonDeal.customer_phone || null,
              product_name: pendingClosedWonDeal.support_type_needed || 'Service',
              product_description: pendingClosedWonDeal.notes || null,
              order_value: parseFloat(pendingClosedWonDeal.deal_value) || 0,
              currency: pendingClosedWonDeal.currency || 'USD',
              commission_percentage: pendingClosedWonDeal.your_commission && pendingClosedWonDeal.deal_value ? 
                parseFloat((pendingClosedWonDeal.your_commission / pendingClosedWonDeal.deal_value * 100).toFixed(2)) : 0,
              commission_amount: parseFloat(pendingClosedWonDeal.your_commission) || 0,
              expected_delivery_date: new Date().toISOString().split('T')[0],
              status: 'completed',
              notes: `Created from Deal: ${pendingClosedWonDeal.customer_name}`
            }])
            .select()

          if (referralError) {
            console.error('❌ Referral order creation failed:', referralError)
            console.error('Error message:', referralError.message)
            console.error('Error code:', referralError.code)
            throw referralError
          }

          console.log('✅ Referral order created successfully:', referralData)

          // Update deal stage and mark as converted to referral order
          await supabase
            .from('deals')
            .update({
              stage: pendingClosedWonDeal.stage,
              invoice_sent_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', pendingClosedWonDeal.id)

          // Log activity
          await supabase
            .from('deal_activities')
            .insert([{
              deal_id: pendingClosedWonDeal.id,
              activity_type: 'stage_updated',
              description: `Stage updated to Closed Won - Converted to Referral Order`
            }])

          // Send invoice emails for referral order
          console.log('📧 Sending invoice emails for referral order...')
          
          // Get partner manager email
          let partnerManagerEmail = null
          if (pendingClosedWonDeal.partner_id) {
            const { data: partnerData } = await supabase
              .from('partners')
              .select('partner_manager_id')
              .eq('id', pendingClosedWonDeal.partner_id)
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
            dealId: pendingClosedWonDeal.id,
            customerName: pendingClosedWonDeal.customer_name,
            customerEmail: pendingClosedWonDeal.customer_email,
            partnerManagerEmail,
            amount: formatCurrency(pendingClosedWonDeal.deal_value, pendingClosedWonDeal.currency),
            description: pendingClosedWonDeal.description
          })

          console.log('✅ Invoice emails sent successfully')

          // Notify account users about new invoice via API
          console.log('🔔 Notifying account users via API...')
          try {
            const response = await fetch('/api/notifications/create', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                notifyAccountUsers: true,
                dealId: pendingClosedWonDeal.id,
                dealName: `${pendingClosedWonDeal.customer_company || pendingClosedWonDeal.customer_name}`,
                dealValue: formatCurrency(pendingClosedWonDeal.deal_value, pendingClosedWonDeal.currency)
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

          if (onDealUpdate) {
            onDealUpdate(localDeals)
          }

          setShowClosedWonModal(false)
          setPendingClosedWonDeal(null)
          return
        }

        // Update deal stage and set invoice_sent_at timestamp
        const { error } = await supabase
          .from('deals')
          .update({
            stage: pendingClosedWonDeal.stage,
            invoice_sent_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', pendingClosedWonDeal.id)

        if (error) throw error

        // Log activity
        await supabase
          .from('deal_activities')
          .insert([{
            deal_id: pendingClosedWonDeal.id,
            activity_type: 'stage_updated',
            description: `Stage updated to Closed Won - Invoice sent to Ample Logic`
          }])

        // Send invoice emails to client and partner manager
        console.log('📧 Sending invoice emails for closed won deal...')
        
        // Get partner manager email
        let partnerManagerEmail = null
        if (pendingClosedWonDeal.partner_id) {
          const { data: partnerData } = await supabase
            .from('partners')
            .select('partner_manager_id')
            .eq('id', pendingClosedWonDeal.partner_id)
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
          dealId: pendingClosedWonDeal.id,
          customerName: pendingClosedWonDeal.customer_name,
          customerEmail: pendingClosedWonDeal.customer_email,
          partnerManagerEmail,
          amount: formatCurrency(pendingClosedWonDeal.deal_value, pendingClosedWonDeal.currency),
          description: pendingClosedWonDeal.description
        })

        console.log('✅ Invoice emails sent successfully')

        // Notify account users about new invoice via API
        console.log('🔔 Notifying account users via API...')
        try {
          const response = await fetch('/api/notifications/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              notifyAccountUsers: true,
              dealId: pendingClosedWonDeal.id,
              dealName: `${pendingClosedWonDeal.customer_company || pendingClosedWonDeal.customer_name}`,
              dealValue: formatCurrency(pendingClosedWonDeal.deal_value, pendingClosedWonDeal.currency)
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

        // Notify parent component
        if (onDealUpdate) {
          onDealUpdate(localDeals)
        }

        setShowClosedWonModal(false)
        setPendingClosedWonDeal(null)
      } catch (error) {
        console.error('Error updating deal:', error)
        // Revert on error
        setLocalDeals(deals)
        setShowClosedWonModal(false)
        setPendingClosedWonDeal(null)
      }
    }
  }

  const handleCancelClosedWon = () => {
    // Revert the local state
    setLocalDeals(deals)
    setShowClosedWonModal(false)
    setPendingClosedWonDeal(null)
  }

  const activeDeal = activeId ? localDeals.find(d => d.id === activeId) : null

  // Calculate implementation deals count
  const implementationDealsCount = useMemo(() => {
    if (partnerOrganizationType !== 'full_cycle') return 0
    return localDeals.filter(deal => 
      IMPLEMENTATION_STAGES.some(stage => stage.id === deal.stage)
    ).length
  }, [localDeals, partnerOrganizationType])

  // Determine which stages to display based on partner type and expansion state
  const displayedStages = useMemo(() => {
    if (partnerOrganizationType !== 'full_cycle') {
      return SALES_STAGES
    }
    return isImplementationExpanded 
      ? [...SALES_STAGES, ...IMPLEMENTATION_STAGES]
      : SALES_STAGES
  }, [partnerOrganizationType, isImplementationExpanded])

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetectionStrategy}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-2 overflow-x-auto pb-4">
          <SortableContext items={PARTNER_STAGES.map(s => s.id)} strategy={verticalListSortingStrategy}>
            {/* Render sales stages */}
            {SALES_STAGES.map((stage) => (
              <KanbanColumn
                key={stage.id}
                stage={stage}
                deals={localDeals}
                activeId={activeId}
              />
            ))}
            
            {/* Show collapsible divider for full-cycle partners after sales stages */}
            {partnerOrganizationType === 'full_cycle' && (
              <CollapsibleDivider
                isExpanded={isImplementationExpanded}
                onToggle={() => setIsImplementationExpanded(!isImplementationExpanded)}
                implementationDealsCount={implementationDealsCount}
              />
            )}
            
            {/* Render implementation stages if expanded and full-cycle */}
            {partnerOrganizationType === 'full_cycle' && isImplementationExpanded && IMPLEMENTATION_STAGES.map((stage) => (
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
            <div className="bg-white rounded-md border-2 border-blue-500 p-2 shadow-xl rotate-2 cursor-grabbing w-44">
              <h4 className="font-medium text-gray-900 text-xs truncate">
                {activeDeal.customer_name}
              </h4>
              <div className="flex items-center text-xs font-semibold text-green-600 mt-1">
                {formatCurrency(activeDeal.deal_value, activeDeal.currency)}
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Closed Won Confirmation Modal */}
      {showClosedWonModal && (
        <div className="fixed inset-0 bg-transparent flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Invoice sent to Ample Logic
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                The invoice for this deal will be sent to Ample Logic. Click OK to confirm and move the deal to Closed Won.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={handleCancelClosedWon}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmClosedWon}
                  className="flex-1 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}