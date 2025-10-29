// src/app/admin/knowledge/[id]/preview/page.js
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, Edit2, Trash2, Calendar, Tag, Lock, Unlock, 
  FileText, Video, Image, AlertCircle, Eye, Share2
} from 'lucide-react'

export default function AdminArticlePreviewPage({ params }) {
  const [article, setArticle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(false)
  
  const router = useRouter()
  const supabase = createClient()

  const categories = {
    'onboarding': { label: 'Getting Started', icon: FileText, color: 'bg-blue-100 text-blue-800' },
    'sales': { label: 'Sales Resources', icon: FileText, color: 'bg-green-100 text-green-800' },
    'technical': { label: 'Technical Docs', icon: FileText, color: 'bg-purple-100 text-purple-800' },
    'marketing': { label: 'Marketing Materials', icon: Image, color: 'bg-pink-100 text-pink-800' },
    'training': { label: 'Training Videos', icon: Video, color: 'bg-yellow-100 text-yellow-800' },
    'case_studies': { label: 'Case Studies', icon: FileText, color: 'bg-orange-100 text-orange-800' }
  }

  const accessLevels = {
    'all': { label: 'All Partners', color: 'bg-green-100 text-green-800', icon: Unlock },
    'bronze': { label: 'Bronze+', color: 'bg-orange-100 text-orange-800', icon: Lock },
    'silver': { label: 'Silver+', color: 'bg-gray-100 text-gray-800', icon: Lock },
    'gold': { label: 'Gold+', color: 'bg-yellow-100 text-yellow-800', icon: Lock },
    'platinum': { label: 'Platinum Only', color: 'bg-purple-100 text-purple-800', icon: Lock }
  }

  useEffect(() => {
    if (params.id) {
      loadArticle()
    }
  }, [params.id])

  const loadArticle = async () => {
    try {
      setLoading(true)
      
      const { data: articleData, error: articleError } = await supabase
        .from('knowledge_articles')
        .select('*')
        .eq('id', params.id)
        .single()

      if (articleError) throw articleError

      setArticle(articleData)
    } catch (err) {
      console.error('Error loading article:', err)
      setError('Failed to load article. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this article? This action cannot be undone.')) {
      return
    }

    try {
      setDeleting(true)
      
      const { error: deleteError } = await supabase
        .from('knowledge_articles')
        .delete()
        .eq('id', params.id)

      if (deleteError) throw deleteError

      router.push('/admin/knowledge')
      router.refresh()

    } catch (err) {
      console.error('Error deleting article:', err)
      setError('Failed to delete article. Please try again.')
    } finally {
      setDeleting(false)
    }
  }

  const formatContent = (content) => {
    return content
      .split('\n')
      .map((paragraph, index) => {
        if (paragraph.trim() === '') return null
        
        if (paragraph.startsWith('# ')) {
          return <h2 key={index} className="text-2xl font-bold text-gray-900 mt-8 mb-4">{paragraph.slice(2)}</h2>
        }
        if (paragraph.startsWith('## ')) {
          return <h3 key={index} className="text-xl font-semibold text-gray-900 mt-6 mb-3">{paragraph.slice(3)}</h3>
        }
        if (paragraph.startsWith('### ')) {
          return <h4 key={index} className="text-lg font-medium text-gray-900 mt-4 mb-2">{paragraph.slice(4)}</h4>
        }
        
        if (paragraph.startsWith('- ') || paragraph.startsWith('* ')) {
          return (
            <li key={index} className="ml-6 mb-2 text-gray-700 list-disc">
              {paragraph.slice(2)}
            </li>
          )
        }
        
        if (/^\d+\.\s/.test(paragraph)) {
          return (
            <li key={index} className="ml-6 mb-2 text-gray-700 list-decimal">
              {paragraph.replace(/^\d+\.\s/, '')}
            </li>
          )
        }
        
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/4 mb-8"></div>
            <div className="bg-white rounded-xl p-8 border">
              <div className="h-12 bg-gray-200 rounded mb-6"></div>
              <div className="space-y-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="h-4 bg-gray-200 rounded"></div>
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Article not found</h2>
            <p className="text-gray-600 mb-6">This article doesn't exist or has been deleted.</p>
            <Link
              href="/admin/knowledge"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Knowledge Base
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const categoryInfo = categories[article.category] || { label: article.category, icon: FileText, color: 'bg-gray-100 text-gray-800' }
  const accessInfo = accessLevels[article.access_level] || accessLevels['all']
  const CategoryIcon = categoryInfo.icon
  const AccessIcon = accessInfo.icon

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin/knowledge"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Knowledge Base
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Article Preview</h1>
              <p className="text-gray-600 mt-1">
                Viewing as admin - this is how partners will see this article
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Link
                href={`/admin/knowledge/${article.id}/edit`}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Edit Article
              </Link>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-lg text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
              >
                {deleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-2"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
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
                        <Calendar className="h-4 w-4 mr-1" />
                        Updated {new Date(article.updated_at).toLocaleDateString()}
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${categoryInfo.color}`}>
                        <CategoryIcon className="h-3 w-3 mr-1" />
                        {categoryInfo.label}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${accessInfo.color}`}>
                        <AccessIcon className="h-3 w-3 mr-1" />
                        {accessInfo.label}
                      </span>
                      {!article.published && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Draft
                        </span>
                      )}
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
                </div>
              </div>

              {/* Article Content */}
              <div className="p-8">
                <div className="prose max-w-none">
                  {formatContent(article.content)}
                </div>
              </div>
            </article>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Article Status */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Article Status</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Publication Status
                  </label>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    article.published 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {article.published ? 'Published' : 'Draft'}
                  </span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${categoryInfo.color}`}>
                    <CategoryIcon className="h-3 w-3 mr-1" />
                    {categoryInfo.label}
                  </span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Access Level
                  </label>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${accessInfo.color}`}>
                    <AccessIcon className="h-3 w-3 mr-1" />
                    {accessInfo.label}
                  </span>
                </div>

                <div className="pt-4 border-t">
                  <div className="text-sm text-gray-600 space-y-2">
                    <div className="flex justify-between">
                      <span>Created:</span>
                      <span className="font-medium text-gray-900">
                        {new Date(article.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Updated:</span>
                      <span className="font-medium text-gray-900">
                        {new Date(article.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              
              <div className="space-y-3">
                <Link
                  href={`/admin/knowledge/${article.id}/edit`}
                  className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit Article
                </Link>
{/*                 
                <Link
                  href={`/dashboard/knowledge/${article.id}`}
                  target="_blank"
                  className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View as Partner
                </Link>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/dashboard/knowledge/${article.id}`)
                    alert('Link copied to clipboard!')
                  }}
                  className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Copy Partner Link
                </button> */}
              </div>
            </div>

            {/* Partner Visibility Info */}
            <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AccessIcon className="h-5 w-5 text-blue-600" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-900">Partner Visibility</h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>
                      This article is visible to <strong>{accessInfo.label}</strong>.
                    </p>
                    {article.access_level !== 'all' && (
                      <p className="mt-2">
                        Partners with {accessInfo.label.split('+')[0]} tier or higher can access this content.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}