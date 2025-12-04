// src/app/dashboard/knowledge/[id]/page.js
// COMPLETE VERSION WITH FILE ATTACHMENTS SUPPORT
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, Calendar, User, Tag, Clock, 
  BookOpen, Share2, FileText, FileVideo, 
  FileImage, FileAudio, File, Download,
  Folder, Star
} from 'lucide-react'

export default function ArticleViewPage({ params }) {
  const [article, setArticle] = useState(null)
  const [collection, setCollection] = useState(null)
  const [loading, setLoading] = useState(true)
  const [partner, setPartner] = useState(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadArticle()
  }, [params.id])

  const loadArticle = async () => {
    try {
      setLoading(true)

      // Get current partner for access control
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
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

        // Build article access filter based on tier hierarchy
        let articleAccessFilter = 'access_level.eq.all'
        if (partnerTier === 'bronze') {
          articleAccessFilter = 'access_level.eq.all,access_level.eq.bronze'
        } else if (partnerTier === 'silver') {
          articleAccessFilter = 'access_level.eq.all,access_level.eq.bronze,access_level.eq.silver'
        } else if (partnerTier === 'gold') {
          articleAccessFilter = 'access_level.eq.all,access_level.eq.bronze,access_level.eq.silver,access_level.eq.gold'
        } else if (partnerTier === 'platinum') {
          articleAccessFilter = 'access_level.eq.all,access_level.eq.bronze,access_level.eq.silver,access_level.eq.gold,access_level.eq.platinum'
        }

        // Get the article
        const { data: articleData, error } = await supabase
          .from('knowledge_articles')
          .select('*')
          .eq('id', params.id)
          .eq('published', true)
          .or(articleAccessFilter)
          .single()

        if (error) {
          console.error('Error loading article:', error)
          router.push('/dashboard/knowledge')
          return
        }

        setArticle(articleData)

        // Load collection if article has one
        if (articleData.collection_id) {
          const { data: collectionData } = await supabase
            .from('knowledge_collections')
            .select('*')
            .eq('id', articleData.collection_id)
            .single()

          if (collectionData) {
            setCollection(collectionData)
          }
        }
      }
    } catch (error) {
      console.error('Error loading article:', error)
      router.push('/dashboard/knowledge')
    } finally {
      setLoading(false)
    }
  }

  const getFileIcon = (type) => {
    if (!type) return File
    if (type.startsWith('video/')) return FileVideo
    if (type.startsWith('image/')) return FileImage
    if (type.startsWith('audio/')) return FileAudio
    if (type.includes('pdf')) return FileText
    return File
  }

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const getCategoryInfo = (category) => {
    const categories = {
      'onboarding': { label: 'Getting Started', color: 'bg-blue-100 text-blue-800' },
      'sales': { label: 'Sales Resources', color: 'bg-green-100 text-green-800' },
      'technical': { label: 'Technical Docs', color: 'bg-purple-100 text-purple-800' },
      'marketing': { label: 'Marketing Materials', color: 'bg-pink-100 text-pink-800' },
      'training': { label: 'Training Videos', color: 'bg-yellow-100 text-yellow-800' },
      'case_studies': { label: 'Case Studies', color: 'bg-orange-100 text-orange-800' }
    }
    return categories[category] || { label: category, color: 'bg-gray-100 text-gray-800' }
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

  const getCollectionTypeInfo = (type) => {
    const types = {
      'product_collateral': { label: 'Product Collateral', color: 'bg-blue-100 text-blue-800' },
      'product_videos': { label: 'Product Videos', color: 'bg-purple-100 text-purple-800' },
      'case_studies': { label: 'Case Studies', color: 'bg-green-100 text-green-800' },
      'user_manuals': { label: 'User Manuals', color: 'bg-orange-100 text-orange-800' },
      'marketing_materials': { label: 'Marketing Materials', color: 'bg-pink-100 text-pink-800' },
      'sales_enablement': { label: 'Sales Enablement', color: 'bg-indigo-100 text-indigo-800' },
      'training_resources': { label: 'Training Resources', color: 'bg-yellow-100 text-yellow-800' },
      'documentation': { label: 'Documentation', color: 'bg-gray-100 text-gray-800' }
    }
    return types[type] || { label: 'General', color: 'bg-gray-100 text-gray-800' }
  }

  if (loading) {
    return (
      <div className="py-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
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
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Article not found</h3>
            <p className="text-gray-600 mb-6">
              This article doesn't exist or you don't have access to it.
            </p>
            <button
              onClick={() => router.push('/dashboard/knowledge')}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Knowledge Base
            </button>
          </div>
        </div>
      </div>
    )
  }

  const categoryInfo = getCategoryInfo(article.category)
  const accessBadge = getAccessLevelBadge(article.access_level)
  const collectionTypeInfo = collection ? getCollectionTypeInfo(collection.type) : null

  return (
    <div className="py-6">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => router.push('/dashboard/knowledge')}
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Knowledge Base
        </button>

        {/* Article Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-8">
            {/* Title */}
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {article.title}
            </h1>

            {/* Meta Information */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
              {/* Collection Badge */}
              {collection && collectionTypeInfo && (
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${collectionTypeInfo.color}`}>
                  <Folder className="h-4 w-4 mr-1" />
                  {collection.name}
                </span>
              )}

              {/* Category Badge */}
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${categoryInfo.color}`}>
                <BookOpen className="h-4 w-4 mr-1" />
                {categoryInfo.label}
              </span>

              {/* Access Level Badge */}
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${accessBadge.color}`}>
                <Star className="h-4 w-4 mr-1" />
                {accessBadge.label}
              </span>

              {/* Created Date */}
              <span className="inline-flex items-center text-sm text-gray-600">
                <Calendar className="h-4 w-4 mr-1" />
                {new Date(article.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>

              {/* Updated Date (if different from created) */}
              {article.updated_at && article.updated_at !== article.created_at && (
                <span className="inline-flex items-center text-sm text-gray-600">
                  <Clock className="h-4 w-4 mr-1" />
                  Updated {new Date(article.updated_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </span>
              )}
            </div>

            {/* Tags */}
            {article.tags && article.tags.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mb-6">
                <Tag className="h-4 w-4 text-gray-400" />
                {article.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Divider */}
            <div className="border-t border-gray-200 my-6"></div>

            {/* Article Content */}
            <div className="prose prose-lg max-w-none">
              <div className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                {article.content}
              </div>
            </div>

            {/* File Attachments Section */}
            {article.attachments && article.attachments.length > 0 && (
              <div className="mt-8 border-t border-gray-200 pt-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Download className="h-5 w-5 mr-2 text-purple-600" />
                  Attachments ({article.attachments.length})
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {article.attachments.map((file, index) => {
                    const FileIcon = getFileIcon(file.type)
                    return (
                      <a
                        key={index}
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        download={file.name}
                        className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all group"
                      >
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-purple-100 transition-colors flex-shrink-0">
                          <FileIcon className="h-6 w-6 text-gray-600 group-hover:text-purple-600 transition-colors" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate group-hover:text-purple-700 transition-colors">
                            {file.name}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {formatFileSize(file.size)}
                          </p>
                        </div>
                        <Download className="h-5 w-5 text-gray-400 group-hover:text-purple-600 transition-colors flex-shrink-0" />
                      </a>
                    )
                  })}
                </div>

                {/* Video Preview Section */}
                {article.attachments.some(f => f.type?.startsWith('video/')) && (
                  <div className="mt-6">
                    <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center">
                      <FileVideo className="h-4 w-4 mr-2 text-purple-600" />
                      Video Preview
                    </h4>
                    <div className="grid grid-cols-1 gap-4">
                      {article.attachments
                        .filter(f => f.type?.startsWith('video/'))
                        .map((file, index) => (
                          <div key={index} className="bg-gray-900 rounded-lg overflow-hidden">
                            <video
                              controls
                              className="w-full"
                              preload="metadata"
                            >
                              <source src={file.url} type={file.type} />
                              Your browser does not support the video tag.
                            </video>
                            <div className="p-3 bg-gray-800">
                              <p className="text-sm text-white">{file.name}</p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Image Preview Section */}
                {article.attachments.some(f => f.type?.startsWith('image/')) && (
                  <div className="mt-6">
                    <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center">
                      <FileImage className="h-4 w-4 mr-2 text-purple-600" />
                      Image Preview
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {article.attachments
                        .filter(f => f.type?.startsWith('image/'))
                        .map((file, index) => (
                          <a
                            key={index}
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group"
                          >
                            <div className="border border-gray-200 rounded-lg overflow-hidden hover:border-purple-500 transition-colors">
                              <img
                                src={file.url}
                                alt={file.name}
                                className="w-full h-48 object-cover group-hover:opacity-90 transition-opacity"
                              />
                              <div className="p-2 bg-white">
                                <p className="text-sm text-gray-900 truncate">{file.name}</p>
                              </div>
                            </div>
                          </a>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Related Articles or Actions */}
        <div className="mt-6 flex items-center justify-between">
          <button
            onClick={() => router.push('/dashboard/knowledge')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Knowledge Base
          </button>

          {collection && (
            <button
              onClick={() => router.push(`/dashboard/knowledge?collection=${collection.id}`)}
              className="inline-flex items-center px-4 py-2 border border-purple-300 rounded-md shadow-sm text-sm font-medium text-purple-700 bg-purple-50 hover:bg-purple-100"
            >
              <Folder className="h-4 w-4 mr-2" />
              More from {collection.name}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}