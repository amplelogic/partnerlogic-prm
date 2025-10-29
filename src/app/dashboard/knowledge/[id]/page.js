// src/app/dashboard/knowledge/[id]/page.js
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, BookOpen, Calendar, Tag, User, Share2, 
  Download, Printer as Print, Star, Clock, FileText, Video,
  ExternalLink, ChevronRight, ThumbsUp, ThumbsDown
} from 'lucide-react'

export default function KnowledgeArticlePage({ params }) {
  const [article, setArticle] = useState(null)
  const [relatedArticles, setRelatedArticles] = useState([])
  const [partner, setPartner] = useState(null)
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState(null)
  
  const router = useRouter()
  const supabase = createClient()

  const categories = {
    'onboarding': { label: 'Getting Started', icon: User, color: 'bg-blue-100 text-blue-800' },
    'sales': { label: 'Sales Resources', icon: FileText, color: 'bg-green-100 text-green-800' },
    'technical': { label: 'Technical Docs', icon: FileText, color: 'bg-purple-100 text-purple-800' },
    'marketing': { label: 'Marketing Materials', icon: FileText, color: 'bg-pink-100 text-pink-800' },
    'training': { label: 'Training Videos', icon: Video, color: 'bg-yellow-100 text-yellow-800' },
    'case_studies': { label: 'Case Studies', icon: Star, color: 'bg-orange-100 text-orange-800' }
  }

  useEffect(() => {
    if (params.id) {
      loadArticle()
    }
  }, [params.id])

  const loadArticle = async () => {
    try {
      setLoading(true)
      
      // Get current user and partner for tier-based access
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
        setPartner(partnerData)
        const partnerTier = partnerData.organization?.tier || 'bronze'

        // Get article details
        const { data: articleData, error: articleError } = await supabase
          .from('knowledge_articles')
          .select('*')
          .eq('id', params.id)
          .or(`access_level.eq.all,access_level.eq.${partnerTier}`)
          .single()

        if (articleError) {
          if (articleError.code === 'PGRST116') {
            // Article not found or no access
            router.push('/dashboard/knowledge')
            return
          }
          throw articleError
        }

        setArticle(articleData)

        // Get related articles
        const { data: relatedData } = await supabase
          .from('knowledge_articles')
          .select('id, title, category, created_at')
          .eq('category', articleData.category)
          .neq('id', params.id)
          .or(`access_level.eq.all,access_level.eq.${partnerTier}`)
          .limit(5)
          .order('created_at', { ascending: false })

        setRelatedArticles(relatedData || [])
      }
    } catch (error) {
      console.error('Error loading article:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFeedback = async (helpful) => {
    setFeedback(helpful)
    // In a real implementation, you would save this feedback to a database
    console.log(`Article ${article.id} marked as ${helpful ? 'helpful' : 'not helpful'}`)
  }

  const getCategoryInfo = (category) => {
    return categories[category] || { label: category, icon: FileText, color: 'bg-gray-100 text-gray-800' }
  }

  const getAccessLevelBadge = (accessLevel) => {
    switch (accessLevel) {
      case 'all': return { label: 'All Partners', color: 'bg-green-100 text-green-800' }
      case 'bronze': return { label: 'Bronze+', color: 'bg-orange-100 text-orange-800' }
      case 'silver': return { label: 'Silver+', color: 'bg-gray-100 text-gray-800' }
      case 'gold': return { label: 'Gold+', color: 'bg-yellow-100 text-yellow-800' }
      case 'platinum': return { label: 'Platinum Only', color: 'bg-purple-100 text-purple-800' }
      default: return { label: 'All Partners', color: 'bg-green-100 text-green-800' }
    }
  }

  const formatContent = (content) => {
    // Simple markdown-like formatting
    return content
      .split('\n')
      .map((paragraph, index) => {
        if (paragraph.trim() === '') return null
        
        // Handle headers
        if (paragraph.startsWith('# ')) {
          return <h2 key={index} className="text-2xl font-bold text-gray-900 mt-8 mb-4">{paragraph.slice(2)}</h2>
        }
        if (paragraph.startsWith('## ')) {
          return <h3 key={index} className="text-xl font-semibold text-gray-900 mt-6 mb-3">{paragraph.slice(3)}</h3>
        }
        if (paragraph.startsWith('### ')) {
          return <h4 key={index} className="text-lg font-medium text-gray-900 mt-4 mb-2">{paragraph.slice(4)}</h4>
        }
        
        // Handle bullet points
        if (paragraph.startsWith('- ') || paragraph.startsWith('* ')) {
          return (
            <li key={index} className="ml-6 mb-2 text-gray-700 list-disc">
              {paragraph.slice(2)}
            </li>
          )
        }
        
        // Handle numbered lists
        if (/^\d+\.\s/.test(paragraph)) {
          return (
            <li key={index} className="ml-6 mb-2 text-gray-700 list-decimal">
              {paragraph.replace(/^\d+\.\s/, '')}
            </li>
          )
        }
        
        // Regular paragraphs
        return (
          <p key={index} className="text-gray-700 leading-relaxed mb-4">
            {paragraph}
          </p>
        )
      })
      .filter(Boolean)
  }

  if (loading) {
    return (
      <div className="py-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/3 mb-6"></div>
            <div className="bg-white rounded-xl p-8">
              <div className="h-12 bg-gray-200 rounded mb-6"></div>
              <div className="space-y-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="h-4 bg-gray-200 rounded w-full"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!article) {
    return (
      <div className="py-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Article not found</h2>
            <p className="text-gray-600 mb-6">This article doesn't exist or you don't have access to it.</p>
            <Link
              href="/dashboard/knowledge"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Knowledge Base
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const categoryInfo = getCategoryInfo(article.category)
  const accessBadge = getAccessLevelBadge(article.access_level)
  const CategoryIcon = categoryInfo.icon

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <nav className="flex" aria-label="Breadcrumb">
            <ol className="inline-flex items-center space-x-1 md:space-x-3">
              <li className="inline-flex items-center">
                <Link href="/dashboard/knowledge" className="inline-flex items-center text-gray-600 hover:text-blue-600 transition-colors">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Knowledge Base
                </Link>
              </li>
              <li>
                <div className="flex items-center">
                  <ChevronRight className="h-4 w-4 text-gray-400 mx-1" />
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${categoryInfo.color}`}>
                    <CategoryIcon className="h-3 w-3 mr-1" />
                    {categoryInfo.label}
                  </span>
                </div>
              </li>
            </ol>
          </nav>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Article Content */}
          <div className="lg:col-span-3">
            <article className="bg-white rounded-xl shadow-sm border border-gray-200">
              {/* Article Header */}
              <div className="p-8 border-b border-gray-200">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1">
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">{article.title}</h1>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        Published {new Date(article.created_at).toLocaleDateString()}
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        Updated {new Date(article.updated_at).toLocaleDateString()}
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${accessBadge.color}`}>
                        {accessBadge.label}
                      </span>
                    </div>

                    {article.tags && article.tags.length > 0 && (
                      <div className="flex items-center mt-4">
                        <Tag className="h-4 w-4 mr-2 text-gray-400" />
                        <div className="flex flex-wrap gap-2">
                          {article.tags.map((tag, index) => (
                            <span key={index} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* <div className="flex items-center space-x-2 ml-6">
                    <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
                      <Share2 className="h-5 w-5" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
                      <Print className="h-5 w-5" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
                      <Download className="h-5 w-5" />
                    </button>
                  </div> */}
                </div>
              </div>

              {/* Article Content */}
              <div className="p-8">
                <div className="prose max-w-none">
                  {formatContent(article.content)}
                </div>

                {/* Article Footer - Feedback */}
                <div className="mt-12 pt-8 border-t border-gray-200">
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Was this article helpful?</h3>
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => handleFeedback(true)}
                        className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          feedback === true
                            ? 'bg-green-100 text-green-700 border border-green-200'
                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <ThumbsUp className="h-4 w-4 mr-2" />
                        Yes, helpful
                      </button>
                      <button
                        onClick={() => handleFeedback(false)}
                        className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          feedback === false
                            ? 'bg-red-100 text-red-700 border border-red-200'
                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <ThumbsDown className="h-4 w-4 mr-2" />
                        Needs improvement
                      </button>
                    </div>
                    {feedback !== null && (
                      <p className="text-sm text-gray-600 mt-3">
                        Thank you for your feedback! It helps us improve our resources.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </article>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Quick Navigation */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link
                  href="/dashboard/knowledge"
                  className="w-full flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Knowledge Base
                </Link>
                <Link
                  href="/dashboard/support/new"
                  className="w-full flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Need More Help?
                </Link>
              </div>
            </div>

            {/* Article Information */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Article Information</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Category</span>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${categoryInfo.color}`}>
                    <CategoryIcon className="h-3 w-3 mr-1" />
                    {categoryInfo.label}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Access Level</span>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${accessBadge.color}`}>
                    {accessBadge.label}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Published</span>
                  <span className="font-medium text-black">{new Date(article.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Updated</span>
                  <span className="font-medium text-black">{new Date(article.updated_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {/* Your Access Level */}
            <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Star className="h-5 w-5 text-blue-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">Your Access Level</h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>
                      You have <strong>{partner?.organization?.tier?.charAt(0).toUpperCase() + partner?.organization?.tier?.slice(1)}</strong> tier access.
                    </p>
                    <p className="mt-1">
                      Upgrade your tier to access premium content and exclusive resources.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Related Articles */}
            {relatedArticles.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Related Articles</h3>
                <div className="space-y-3">
                  {relatedArticles.map((relatedArticle) => {
                    const relatedCategoryInfo = getCategoryInfo(relatedArticle.category)
                    const RelatedIcon = relatedCategoryInfo.icon
                    return (
                      <Link
                        key={relatedArticle.id}
                        href={`/dashboard/knowledge/${relatedArticle.id}`}
                        className="block p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100 hover:border-gray-200"
                      >
                        <div className="flex items-start space-x-3">
                          <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <RelatedIcon className="h-4 w-4 text-gray-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {relatedArticle.title}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(relatedArticle.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <ExternalLink className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Help & Support */}
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Need Additional Help?</h3>
              <div className="space-y-2 text-sm">
                <Link href="/dashboard/support/new" className="text-blue-600 hover:text-blue-700 block">
                  Create Support Ticket →
                </Link>
                <Link href="/dashboard/deals" className="text-blue-600 hover:text-blue-700 block">
                  View Your Deals →
                </Link>
                <a href="mailto:support@amplelogic.com" className="text-blue-600 hover:text-blue-700 block">
                  Email Direct Support →
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}