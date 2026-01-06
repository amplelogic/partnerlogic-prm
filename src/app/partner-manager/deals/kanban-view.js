// src/app/partner-manager/deals/kanban-view.js
'use client'

import { useState, useEffect } from 'react'
import { DndContext, DragOverlay, closestCenter, pointerWithin, rectIntersection, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { createClient } from '@/lib/supabase/client'
import { DollarSign, ExternalLink, User } from 'lucide-react'
import Link from 'next/link'
import { CURRENCIES, formatCurrency } from '@/lib/currencyUtils'


// PARTNER MANAGER STAGES - Same as partner view
const PARTNER_MANAGER_STAGES = [
  { id: 'new_deal', label: 'New Deal', color: 'bg-gray-100 border-gray-300' },
  { id: 'need_analysis', label: 'Need Analysis', color: 'bg-blue-100 border-blue-300' },
  { id: 'proposal', label: 'Proposal', color: 'bg-yellow-100 border-yellow-300' },
  { id: 'negotiation', label: 'Negotiation', color: 'bg-purple-100 border-purple-300' },
  { id: 'closed_won', label: 'Closed Won', color: 'bg-green-100 border-green-300' },
  { id: 'closed_lost', label: 'Closed Lost', color: 'bg-red-100 border-red-300' }
]

// Deal Card Component (Draggable) - Compact Version with Partner Info
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white rounded-md border border-gray-200 p-2 mb-1.5 shadow-sm hover:shadow-md transition-all group"
    >
      {/* Draggable Area */}
      <div {...attributes} {...listeners} className="cursor-move">
        {/* Customer Name */}
        <h4 className="font-medium text-gray-900 text-xs truncate mb-1.5">
          {deal.customer_name}
        </h4>

        {/* Company */}
        {deal.customer_company && (
          <p className="text-[10px] text-gray-600 truncate mb-1">
            {deal.customer_company}
          </p>
        )}

        {/* Partner Info */}
        {deal.partners && (
          <div className="flex items-center text-[10px] text-gray-500 mb-1.5">
            <User className="h-2.5 w-2.5 mr-0.5" />
            <span className="truncate">
              {deal.partners.first_name} {deal.partners.last_name}
            </span>
          </div>
        )}

        {/* Price */}
        <div className="flex items-center text-xs font-semibold text-green-600 mb-1.5">
          {formatCurrency(deal.deal_value, deal.currency)}
        </div>
      </div>

      {/* Open Deal Button - Not draggable */}
      <Link
        href={`/partner-manager/deals/${deal.id}`}
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
      {/* Column Header */}
      <div className={`p-2 border-b-3 rounded-t-lg ${stage.color}`}>
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-semibold text-gray-900 text-[11px] leading-tight">{stage.label}</h3>
          <span className="bg-white px-1.5 py-0.5 rounded-full text-[9px] font-medium text-gray-700">
            {dealsInStage.length}
          </span>
        </div>
        <div className="text-[10px] font-medium text-gray-600">
          {formatCurrency(totalValue)}
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

// Main Kanban Board Component
export default function KanbanView({ deals, onDealUpdate }) {
  const [activeId, setActiveId] = useState(null)
  const [localDeals, setLocalDeals] = useState(deals)
  const supabase = createClient()

  useEffect(() => {
    setLocalDeals(deals)
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
    if (PARTNER_MANAGER_STAGES.find(s => s.id === overId)) {
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

    // Update in database
    try {
      const { error } = await supabase
        .from('deals')
        .update({
          stage: activeDeal.stage,
          updated_at: new Date().toISOString()
        })
        .eq('id', activeId)

      if (error) throw error

      // Log activity
      await supabase
        .from('deal_activities')
        .insert([{
          deal_id: activeId,
          activity_type: 'stage_updated',
          description: `Stage updated to ${PARTNER_MANAGER_STAGES.find(s => s.id === activeDeal.stage)?.label}`
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
        <SortableContext items={PARTNER_MANAGER_STAGES.map(s => s.id)} strategy={verticalListSortingStrategy}>
          {PARTNER_MANAGER_STAGES.map(stage => (
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
            <h4 className="font-medium text-gray-900 text-xs truncate mb-1">
              {activeDeal.customer_name}
            </h4>
            {activeDeal.partners && (
              <div className="flex items-center text-[10px] text-gray-500 mb-1">
                <User className="h-2.5 w-2.5 mr-0.5" />
                <span className="truncate">
                  {activeDeal.partners.first_name} {activeDeal.partners.last_name}
                </span>
              </div>
            )}
            <div className="flex items-center text-xs font-semibold text-green-600">
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