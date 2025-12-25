'use client'

import { useState, useEffect } from 'react'
import { DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { createClient } from '@/lib/supabase/client'
import { DollarSign, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { CURRENCIES, formatCurrency } from '@/lib/currencyUtils'

// PARTNER STAGES - Only up to closed_lost
const PARTNER_STAGES = [
  { id: 'new_deal', label: 'New Deal', color: 'bg-gray-100 border-gray-300' },
  { id: 'need_analysis', label: 'Need Analysis', color: 'bg-blue-100 border-blue-300' },
  { id: 'proposal', label: 'Proposal', color: 'bg-yellow-100 border-yellow-300' },
  { id: 'negotiation', label: 'Negotiation', color: 'bg-purple-100 border-purple-300' },
  { id: 'closed_won', label: 'Closed Won', color: 'bg-green-100 border-green-300' },
  { id: 'closed_lost', label: 'Closed Lost', color: 'bg-red-100 border-red-300' }
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
      className="bg-white rounded-md border border-gray-200 p-2 mb-1.5 shadow-sm hover:shadow-md transition-all cursor-move group"
      {...attributes}
      {...listeners}
    >
      {/* Title */}
      <h4 className="font-medium text-gray-900 text-xs truncate mb-1.5">
        {deal.customer_name}
      </h4>

      {/* Price */}
      <div className="flex items-center text-xs font-semibold text-green-600 mb-1.5">
        {formatCurrency(deal.deal_value, deal.currency)}
      </div>

      {/* Open Deal Button */}
      <Link
        href={`/dashboard/deals/${deal.id}`}
        onClick={(e) => e.stopPropagation()}
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
  const { setNodeRef } = useSortable({
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
 
// Main Kanban Board Component
export default function KanbanView({ deals, onDealUpdate }) {
  const [activeId, setActiveId] = useState(null)
  const [localDeals, setLocalDeals] = useState(deals)
  const [showClosedWonModal, setShowClosedWonModal] = useState(false)
  const [pendingClosedWonDeal, setPendingClosedWonDeal] = useState(null)
  const supabase = createClient()

  // ADD THIS: Update localDeals when deals prop changes
  useEffect(() => {
    setLocalDeals(deals)
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
      // Show confirmation modal
      setPendingClosedWonDeal(activeDeal)
      setShowClosedWonModal(true)
      return // Don't update database yet
    }

    // Update in database for other stages
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
      await updateDealStage(pendingClosedWonDeal)
      setShowClosedWonModal(false)
      setPendingClosedWonDeal(null)
    }
  }

  const handleCancelClosedWon = () => {
    // Revert the local state
    setLocalDeals(deals)
    setShowClosedWonModal(false)
    setPendingClosedWonDeal(null)
  }

  const activeDeal = activeId ? localDeals.find(d => d.id === activeId) : null

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-2 overflow-x-auto pb-4">
          <SortableContext items={PARTNER_STAGES.map(s => s.id)} strategy={verticalListSortingStrategy}>
            {PARTNER_STAGES.map(stage => (
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