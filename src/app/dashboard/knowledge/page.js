// src/app/dashboard/knowledge/page.js
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { 
  Search, Filter, BookOpen, FileText, Video, Download,
  Star, Clock, User, Tag, ChevronDown, Eye, ExternalLink,
  Play, Image, FileIcon, Folder, TrendingUp, Award
} from 'lucide-react'

export default function KnowledgeBasePage() {
  const [articles, setArticles] = useState([])
  const [filteredArticles, setFilteredArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState('desc')
  const [showFilters, setShowFilters] = useState(false)
  const [partner, setPartner] = useState(null)

  const supabase = createClient()

  const baseCategories = [
    { value: 'onboarding', label: 'Getting Started', icon: User, count: 0 },
    { value: 'sales', label: 'Sales Resources', icon: TrendingUp, count: 0 },
    { value: 'technical', label: 'Technical Docs', icon: FileIcon, count: 0 },
    { value: 'marketing', label: 'Marketing Materials', icon: Image, count: 0 },
    { value: 'training', label: 'Training Videos', icon: Video, count: 0 },
    { value: 'case_studies', label: 'Case Studies', icon: Award, count: 0 }
  ]

  const [categories, setCategories] = useState([
    { value: 'all', label: 'All Categories', icon: BookOpen, count: 0 },
    ...baseCategories
  ])

  const contentTypes = [
    { type: 'article', icon: FileText, label: 'Article' },
    { type: 'video', icon: Video, label: 'Video' },
    { type: 'document', icon: Download, label: 'Document' },
    { type: 'presentation', icon: FileIcon, label: 'Presentation' }
  ]

  useEffect(() => {
    loadKnowledgeBase()
  }, [])

  useEffect(() => {
    filterAndSortArticles()
    updateCategoryCounts()
  }, [articles, searchTerm, categoryFilter, sortBy, sortOrder])

  const loadKnowledgeBase = async () => {
    try {
      setLoading(true)
      
      // Get current user and partner for tier-based access
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

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

        // Get knowledge articles based on partner tier and published status
        const { data: articlesData, error } = await supabase
          .from('knowledge_articles')
          .select('*')
          .eq('published', true)
          .or(`access_level.eq.all,access_level.eq.${partnerTier}`)
          .order('created_at', { ascending: false })

        if (error) throw error

        setArticles(articlesData || [])
      }
    } catch (error) {
      console.error('Error loading knowledge base:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateCategoryCounts = () => {
    const updatedCategories = categories.map(category => {
      if (category.value === 'all') {
        return { ...category, count: articles.length }
      }
      const count = articles.filter(article => article.category === category.value).length
      return { ...category, count }
    })
    setCategories(updatedCategories)
  }

  const filterAndSortArticles = () => {
    let filtered = [...articles]

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(article =>
        article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    // Apply category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(article => article.category === categoryFilter)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue = a[sortBy]
      let bValue = b[sortBy]

      if (sortBy === 'created_at' || sortBy === 'updated_at') {
        aValue = new Date(aValue)
        bValue = new Date(bValue)
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
      return 0
    })

    setFilteredArticles(filtered)
  }

  const getContentTypeInfo = (category) => {
    // Infer content type from category
    if (category === 'training') return contentTypes.find(t => t.type === 'video')
    if (category === 'marketing') return contentTypes.find(t => t.type === 'document')
    return contentTypes.find(t => t.type === 'article')
  }

  const getCategoryIcon = (category) => {
    const categoryInfo = categories.find(c => c.value === category)
    return categoryInfo ? categoryInfo.icon : BookOpen
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

  const calculateStats = () => {
    const totalArticles = filteredArticles.length
    const recentArticles = filteredArticles.filter(
      article => new Date(article.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    ).length
    const videoContent = filteredArticles.filter(article => article.category === 'training').length
    const caseStudies = filteredArticles.filter(article => article.category === 'case_studies').length

    return { totalArticles, recentArticles, videoContent, caseStudies }
  }

  const stats = calculateStats()

  if (loading) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl p-6 border">
                  <div className="h-12 bg-gray-200 rounded mb-4"></div>
                  <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                </div>
              ))}
            </div>
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Knowledge Base</h1>
              <p className="text-gray-600 mt-1">
                Access training materials, documentation, and resources
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                partner?.organization?.tier === 'platinum' ? 'bg-purple-100 text-purple-800' :
                partner?.organization?.tier === 'gold' ? 'bg-yellow-100 text-yellow-800' :
                partner?.organization?.tier === 'silver' ? 'bg-gray-100 text-gray-800' :
                'bg-orange-100 text-orange-800'
              }`}>
                {partner?.organization?.tier?.charAt(0).toUpperCase() + partner?.organization?.tier?.slice(1)} Access
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.totalArticles}</p>
                <p className="text-sm text-gray-600">Total Resources</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Clock className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.recentArticles}</p>
                <p className="text-sm text-gray-600">New This Month</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Video className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.videoContent}</p>
                <p className="text-sm text-gray-600">Video Content</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <Star className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.caseStudies}</p>
                <p className="text-sm text-gray-600">Case Studies</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Categories */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Categories</h2>
              <nav className="space-y-2">
                {categories.map((category) => {
                  const IconComponent = category.icon
                  return (
                    <button
                      key={category.value}
                      onClick={() => setCategoryFilter(category.value)}
                      className={`w-full flex items-center justify-between p-3 text-left rounded-lg transition-colors ${
                        categoryFilter === category.value
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <IconComponent className={`h-5 w-5 ${
                          categoryFilter === category.value ? 'text-blue-600' : 'text-gray-400'
                        }`} />
                        <span className="font-medium">{category.label}</span>
                      </div>
                      <span className={`text-sm px-2 py-1 rounded-full ${
                        categoryFilter === category.value 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {category.count}
                      </span>
                    </button>
                  )
                })}
              </nav>

              {/* Partner Tier Info */}
              <div className="mt-6 p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                <div className="flex items-center space-x-2 mb-2">
                  <Star className="h-5 w-5 text-purple-600" />
                  <h3 className="font-semibold text-gray-900">Your Access</h3>
                </div>
                <p className="text-sm text-gray-700">
                  <strong className="capitalize">{partner?.organization?.tier}</strong> tier partners have access to {
                    partner?.organization?.tier === 'platinum' ? 'all' :
                    partner?.organization?.tier === 'gold' ? 'gold, silver, and bronze' :
                    partner?.organization?.tier === 'silver' ? 'silver and bronze' :
                    'bronze'
                  } tier content.
                </p>
                <p className="text-xs text-gray-600 mt-2">
                  Upgrade your tier to unlock premium resources.
                </p>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Search and Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
              <div className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                  {/* Search */}
                  <div className="relative flex-1 max-w-lg">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search articles, docs, and resources..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 text-black border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>

                  {/* Sort */}
                  <div className="flex items-center space-x-4">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="px-3 py-2 text-black border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="created_at">Newest First</option>
                      <option value="updated_at">Recently Updated</option>
                      <option value="title">Alphabetical</option>
                    </select>
                    <button
                      onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      {sortOrder === 'asc' ? '↑' : '↓'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Articles Grid */}
            <div className="space-y-6">
              {filteredArticles.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                  <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {articles.length === 0 ? 'No resources available yet' : 'No resources match your search'}
                  </h3>
                  <p className="text-gray-600">
                    {articles.length === 0 
                      ? 'Resources and documentation will appear here as they become available.'
                      : 'Try adjusting your search terms or selecting a different category.'
                    }
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  {filteredArticles.map((article) => {
                    const CategoryIcon = getCategoryIcon(article.category)
                    const contentType = getContentTypeInfo(article.category)
                    const accessBadge = getAccessLevelBadge(article.access_level)

                    return (
                      <div key={article.id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                        <div className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-start space-x-4 flex-1 min-w-0">
                              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                <CategoryIcon className="h-6 w-6 text-gray-600" />
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-3 mb-2">
                                  <h3 className="text-lg font-semibold text-gray-900 truncate">
                                    {article.title}
                                  </h3>
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${accessBadge.color}`}>
                                    {accessBadge.label}
                                  </span>
                                </div>
                                
                                <p className="text-gray-600 line-clamp-2 mb-3">
                                  {article.content.substring(0, 150)}...
                                </p>

                                <div className="flex items-center space-x-4 text-sm text-gray-500">
                                  <div className="flex items-center">
                                    <contentType.icon className="h-4 w-4 mr-1" />
                                    {contentType.label}
                                  </div>
                                  <div className="flex items-center">
                                    <Clock className="h-4 w-4 mr-1" />
                                    {new Date(article.created_at).toLocaleDateString()}
                                  </div>
                                  {article.tags && article.tags.length > 0 && (
                                    <div className="flex items-center">
                                      <Tag className="h-4 w-4 mr-1" />
                                      {article.tags.slice(0, 2).join(', ')}
                                      {article.tags.length > 2 && '...'}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center space-x-2 ml-4">
                              <Link
                                href={`/dashboard/knowledge/${article.id}`}
                                className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}