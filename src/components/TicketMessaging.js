'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MessageSquare, Send, Paperclip } from 'lucide-react'
import { createNotification, notifyAdmins } from '@/lib/notifications'

export default function TicketMessaging({ 
  ticketId, 
  currentUserId, 
  senderType, 
  senderName,
  ticketData 
}) {
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef(null)
  const supabase = createClient()

  useEffect(() => {
    loadMessages()
    
    // Set up real-time subscription for new messages
    const channel = supabase
      .channel(`ticket_${ticketId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_ticket_messages',
          filter: `ticket_id=eq.${ticketId}`
        },
        (payload) => {
          console.log('New message received:', payload)
          // Only add if not already in the list (prevent duplicates)
          setMessages((prevMessages) => {
            const exists = prevMessages.some(msg => msg.id === payload.new.id)
            if (exists) {
              console.log('Message already exists, skipping duplicate')
              return prevMessages
            }
            return [...prevMessages, payload.new]
          })
          scrollToBottom()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [ticketId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadMessages = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('support_ticket_messages')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true })

      if (error) throw error
      setMessages(data || [])
    } catch (error) {
      console.error('Error loading messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || sendingMessage) return

    try {
      setSendingMessage(true)
      
      // Insert message
      const { data: messageData, error: messageError } = await supabase
        .from('support_ticket_messages')
        .insert([{
          ticket_id: ticketId,
          sender_id: currentUserId,
          sender_type: senderType,
          message: newMessage.trim()
        }])
        .select()
        .single()

      if (messageError) throw messageError

      // Don't manually add to local state - let real-time subscription handle it
      // This prevents duplicate messages
      setNewMessage('')

      // Send notifications based on sender type
      await sendNotifications(newMessage.trim())
      
      console.log('✅ Message sent and notifications dispatched')
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Failed to send message. Please try again.')
    } finally {
      setSendingMessage(false)
    }
  }

  const sendNotifications = async (message) => {
    try {
      const notificationPromises = []
      const messagePreview = message.length > 100 ? `${message.substring(0, 100)}...` : message

      // Get ticket details for notifications
      const { data: ticket } = await supabase
        .from('support_tickets')
        .select(`
          id,
          subject,
          partner_id,
          assigned_to,
          partners!inner(
            auth_user_id,
            first_name,
            last_name,
            partner_manager_id
          )
        `)
        .eq('id', ticketId)
        .single()

      if (!ticket) return

      if (senderType === 'partner') {
        // Partner sent message - notify support, partner manager, and admins
        
        // Notify assigned support user
        if (ticket.assigned_to) {
          const { data: supportUser } = await supabase
            .from('support_users')
            .select('auth_user_id')
            .eq('id', ticket.assigned_to)
            .single()

          if (supportUser) {
            notificationPromises.push(
              createNotification({
                userId: supportUser.auth_user_id,
                title: `New message on ticket #${ticketId.slice(0, 8)}`,
                message: `${senderName} sent: "${messagePreview}"`,
                type: 'support',
                referenceId: ticketId,
                referenceType: 'support_ticket'
              })
            )
          }
        }

        // Notify partner manager
        if (ticket.partners.partner_manager_id) {
          const { data: partnerManager } = await supabase
            .from('partner_managers')
            .select('auth_user_id')
            .eq('id', ticket.partners.partner_manager_id)
            .single()

          if (partnerManager) {
            notificationPromises.push(
              createNotification({
                userId: partnerManager.auth_user_id,
                title: `Partner message on ticket #${ticketId.slice(0, 8)}`,
                message: `${senderName} sent: "${messagePreview}"`,
                type: 'support',
                referenceId: ticketId,
                referenceType: 'support_ticket'
              })
            )
          }
        }

        // Notify admins
        notificationPromises.push(
          notifyAdmins({
            title: `New message on ticket #${ticketId.slice(0, 8)}`,
            message: `${senderName} sent a message on ${ticket.subject}`,
            type: 'support',
            referenceId: ticketId,
            referenceType: 'support_ticket'
          })
        )
      } else {
        // Support/Admin/Partner Manager sent message - notify partner
        if (ticket.partners.auth_user_id) {
          notificationPromises.push(
            createNotification({
              userId: ticket.partners.auth_user_id,
              title: `New response on ticket #${ticketId.slice(0, 8)}`,
              message: `${senderName} replied: "${messagePreview}"`,
              type: 'support',
              referenceId: ticketId,
              referenceType: 'support_ticket'
            })
          )
        }

        // If support user sent, also notify partner manager and admins
        if (senderType === 'support') {
          if (ticket.partners.partner_manager_id) {
            const { data: partnerManager } = await supabase
              .from('partner_managers')
              .select('auth_user_id')
              .eq('id', ticket.partners.partner_manager_id)
              .single()

            if (partnerManager) {
              notificationPromises.push(
                createNotification({
                  userId: partnerManager.auth_user_id,
                  title: `Support response on ticket #${ticketId.slice(0, 8)}`,
                  message: `${senderName} replied: "${messagePreview}"`,
                  type: 'support',
                  referenceId: ticketId,
                  referenceType: 'support_ticket'
                })
              )
            }
          }

          notificationPromises.push(
            notifyAdmins({
              title: `Support response on ticket #${ticketId.slice(0, 8)}`,
              message: `${senderName} replied to ${ticket.subject}`,
              type: 'support',
              referenceId: ticketId,
              referenceType: 'support_ticket'
            })
          )
        }
      }

      await Promise.all(notificationPromises)
    } catch (error) {
      console.error('Error sending notifications:', error)
    }
  }

  const getSenderLabel = (msg) => {
    switch (msg.sender_type) {
      case 'partner': return 'Partner'
      case 'support': return 'Support Team'
      case 'admin': return 'Admin'
      case 'partner_manager': return 'Partner Manager'
      default: return msg.sender_type
    }
  }

  const isCurrentUser = (msg) => msg.sender_id === currentUserId

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Communication</h2>
      </div>
      
      <div className="p-6">
        {/* Messages List */}
        {loading ? (
          <div className="text-center py-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
            {messages.map((msg) => {
              const isSender = isCurrentUser(msg)
              return (
                <div key={msg.id} className={`flex ${isSender ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-lg p-4 ${
                    isSender 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-900'
                  }`}>
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-xs font-medium opacity-75">
                        {isSender ? 'You' : getSenderLabel(msg)}
                      </span>
                      <span className="text-xs opacity-60">
                        {new Date(msg.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Message Input */}
        <div className="border-t border-gray-200 pt-6">
          <div className="flex space-x-4">
            <div className="flex-1">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    sendMessage()
                  }
                }}
                placeholder="Type your message..."
                className="block w-full px-3 py-2 text-black border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                rows={3}
              />
              <p className="mt-1 text-xs text-gray-500">Press Enter to send, Shift+Enter for new line</p>
            </div>
            <div className="flex flex-col space-y-2">
              <button
                onClick={sendMessage}
                disabled={!newMessage.trim() || sendingMessage}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                title="Send message"
              >
                {sendingMessage ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
