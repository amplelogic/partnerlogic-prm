// src/app/admin/deals/admin-kanban-view.js
'use client'

import { useState, useEffect } from 'react'
import { DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { createClient } from '@/lib/supabase/client'
import { DollarSign, ExternalLink, User } from 'lucide-react'
import Link from 'next/link'

// ADMIN STAGES - All stages from new_deal to live
const ADMIN_STAGES = [
  { id: 'new_deal', label: 'New Deal', color: 'bg-gray-100 border-gray-300' },
  { id: 'need_analysis', label: 'Need Analysis', color: 'bg-blue-100 border-blue-300' },
  { id: 'proposal', label: 'Proposal', color: 'bg-yellow-100 border-yellow-300' },
  { id: 'negotiation', label: 'Negotiation', color: 'bg-purple-100 border-purple-300' },
  { id: 'closed_won', label: 'Closed Won', color: 'bg-green-100 border-green-300' },
  { id: 'closed_lost', label: 'Closed Lost', color: 'bg-red-100 border-red-300' },
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

  const formatCurrency = (amount) => {
    if (!amount) return '$0'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      notation: 'compact'
    }).format(amount)
  }

  // Get partner sales stage badge
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
      className="bg-white rounded-md border border-gray-200 p-2 mb-1.5 shadow-sm hover:shadow-md transition-all cursor-move group"
      {...attributes}
      {...listeners}
    >
      {/* Title */}
      <h4 className="font-medium text-gray-900 text-xs truncate mb-1">
        {deal.customer_name}
      </h4>

      {/* Sales Stage Badge */}
      {deal.stage && (
        <div className="mb-1.5">
          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium ${getSalesStageColor(deal.stage)}`}>
            Sales: {getSalesStageLabel(deal.stage)}
          </span>
        </div>
      )}

      {/* Price */}
      <div className="flex items-center text-xs font-semibold text-green-600 mb-1.5">
        <DollarSign className="h-3 w-3 mr-0.5" />
        {formatCurrency(deal.deal_value)}
      </div>

      {/* Partner Info */}
      {deal.partner && (
        <div className="flex items-center text-[10px] text-gray-500 mb-1.5 truncate">
          <User className="h-2.5 w-2.5 mr-1 flex-shrink-0" />
          <span className="truncate">{deal.partner.first_name} {deal.partner.last_name}</span>
        </div>
      )}

      {/* Open Deal Button */}
      <Link
        href={`/admin/deals/${deal.id}`}
        onClick={(e) => e.stopPropagation()}
        className="flex items-center justify-center w-full px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-600 text-[10px] font-medium rounded transition-colors"
      >
        <span>Open</span>
        <ExternalLink className="h-2.5 w-2.5 ml-1" />
      </Link>
    </div>
  )
}

// Column Component (Drop Zone) - Narrower
function KanbanColumn({ stage, deals, activeId }) {
  const { setNodeRef } = useSortable({
    id: stage.id,
    data: {
      type: 'column',
      stage: stage.id,
    },
  })

  const dealsInStage = deals.filter(deal => deal.admin_stage === stage.id)
  const totalValue = dealsInStage.reduce((sum, deal) => sum + (deal.deal_value || 0), 0)

  const formatCurrency = (amount) => {
    if (!amount) return '$0'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      notation: 'compact'
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
        className="flex-1 p-1.5 overflow-y-auto min-h-[500px] max-h-[calc(100vh-300px)]"
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

// Main Kanban Board Component for Admin
export default function AdminKanbanView({ deals, onDealUpdate }) {
  const [activeId, setActiveId] = useState(null)
  // Ensure all deals have admin_stage set
  const dealsWithAdminStage = deals.map(deal => ({
    ...deal,
    admin_stage: deal.admin_stage || 'urs'
  }))
  const [localDeals, setLocalDeals] = useState(dealsWithAdminStage)
  const supabase = createClient()

  // Update local deals when parent deals change
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
        distance: 8,
      },
    })
  )

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
    if (ADMIN_STAGES.find(s => s.id === overId)) {
      targetStage = overId
    } else {
      // We're over another deal, find its admin_stage
      const overDeal = localDeals.find(d => d.id === overId)
      if (overDeal) {
        targetStage = overDeal.admin_stage
      }
    }

    // Update local state if admin_stage changed
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

    // Don't update if stage hasn't changed
    if (newAdminStage === oldAdminStage) return

    console.log('Updating deal:', activeId, 'from', oldAdminStage, 'to', newAdminStage)

    // Update in database - only update admin_stage
    try {
      const { data, error, count } = await supabase
        .from('deals')
        .update({
          admin_stage: newAdminStage,
          updated_at: new Date().toISOString()
        })
        .eq('id', activeId)
        .select()

      console.log('Update response:', { data, error, count })

      if (error) {
        console.error('Supabase update error:', error)
        throw error
      }

      if (!data || data.length === 0) {
        throw new Error('No deal was updated. Check if the deal exists and you have permissions.')
      }

      const updatedDeal = data[0]
      console.log('Update successful:', updatedDeal)

      // Log activity (don't let this fail the whole operation)
      try {
        await supabase
          .from('deal_activities')
          .insert([{
            deal_id: activeId,
            activity_type: 'stage_updated',
            description: `Implementation stage updated to ${ADMIN_STAGES.find(s => s.id === newAdminStage)?.label}`
          }])
      } catch (activityError) {
        console.error('Error logging activity:', activityError)
      }

      // Notify parent component with updated deals
      if (onDealUpdate) {
        const updatedDeals = deals.map(deal => 
          deal.id === activeId ? updatedDeal : deal
        )
        onDealUpdate(updatedDeals)
      }
    } catch (error) {
      console.error('Error updating deal admin stage:', error)
      console.error('Error message:', error.message)
      alert(`Failed to update deal stage: ${error.message || 'Please try again.'}`)
      // Revert local state to match original deals
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
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-2 overflow-x-auto pb-4">
        <SortableContext items={ADMIN_STAGES.map(s => s.id)} strategy={verticalListSortingStrategy}>
          {ADMIN_STAGES.map(stage => (
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