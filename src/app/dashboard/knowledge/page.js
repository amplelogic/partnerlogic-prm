// src/app/dashboard/knowledge/page.js
// UPDATED VERSION WITH COLLECTIONS/FOLDERS SUPPORT
'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { 
  Search, Filter, BookOpen, FileText, Video, Download,
  Star, Clock, User, Tag, ChevronDown, Eye, ExternalLink,
  Play, Image, FileIcon, Folder, TrendingUp, Award, Package,
  Briefcase, GraduationCap, FileStack, LayoutGrid, List
} from 'lucide-react'

export default function KnowledgeBasePage() {
  const [articles, setArticles] = useState([])
  const [collections, setCollections] = useState([])
  const [filteredArticles, setFilteredArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [collectionFilter, setCollectionFilter] = useState('all')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState('desc')
  const [showFilters, setShowFilters] = useState(false)
  const [partner, setPartner] = useState(null)
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'list'
  const resultsRef = useRef(null)

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

  // Collection types with icons and colors
  const collectionTypes = {
    'product_collateral': { label: 'Product Collateral', icon: Package, color: 'bg-blue-100 text-blue-800 border-blue-200' },
    'product_videos': { label: 'Product Videos', icon: Video, color: 'bg-purple-100 text-purple-800 border-purple-200' },
    'case_studies': { label: 'Case Studies', icon: Award, color: 'bg-green-100 text-green-800 border-green-200' },
    'user_manuals': { label: 'User Manuals', icon: BookOpen, color: 'bg-orange-100 text-orange-800 border-orange-200' },
    'marketing_materials': { label: 'Marketing Materials', icon: Image, color: 'bg-pink-100 text-pink-800 border-pink-200' },
    'sales_enablement': { label: 'Sales Enablement', icon: Briefcase, color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
    'training_resources': { label: 'Training Resources', icon: GraduationCap, color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    'documentation': { label: 'Documentation', icon: FileStack, color: 'bg-gray-100 text-gray-800 border-gray-200' }
  }

  useEffect(() => {
    loadKnowledgeBase()
  }, [])

  useEffect(() => {
    filterAndSortArticles()
    updateCategoryCounts()
  }, [articles, searchTerm, categoryFilter, collectionFilter, sortBy, sortOrder])

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

        // Get knowledge collections based on partner tier
        // Build access level filter based on tier hierarchy
        let accessFilter = 'access_level.eq.all'
        if (partnerTier === 'bronze') {
          accessFilter = 'access_level.eq.all,access_level.eq.bronze'
        } else if (partnerTier === 'silver') {
          accessFilter = 'access_level.eq.all,access_level.eq.bronze,access_level.eq.silver'
        } else if (partnerTier === 'gold') {
          accessFilter = 'access_level.eq.all,access_level.eq.bronze,access_level.eq.silver,access_level.eq.gold'
        } else if (partnerTier === 'platinum') {
          accessFilter = 'access_level.eq.all,access_level.eq.bronze,access_level.eq.silver,access_level.eq.gold,access_level.eq.platinum'
        }
        
        const { data: collectionsData, error: collectionsError } = await supabase
          .from('knowledge_collections')
          .select('*')
          .or(accessFilter)
          .order('name', { ascending: true })

        if (collectionsError) throw collectionsError
        setCollections(collectionsData || [])

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

        // Get knowledge articles based on partner tier and published status
        const { data: articlesData, error } = await supabase
          .from('knowledge_articles')
          .select('*')
          .eq('published', true)
          .or(articleAccessFilter)
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

    // Apply collection filter
    if (collectionFilter !== 'all') {
      if (collectionFilter === 'uncategorized') {
        filtered = filtered.filter(article => !article.collection_id)
      } else {
        filtered = filtered.filter(article => article.collection_id === collectionFilter)
      }
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

  const getCollectionType = (typeValue) => {
    return collectionTypes[typeValue] || collectionTypes['documentation']
  }

  const getArticleCountByCollection = (collectionId) => {
    return articles.filter(a => a.collection_id === collectionId).length
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

  const handleBrowseCollection = (collectionId) => {
    setCollectionFilter(collectionId)
    // Scroll to results section smoothly
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }

  const calculateStats = () => {
    const totalArticles = filteredArticles.length
    const totalCollections = collections.length
    const recentArticles = filteredArticles.filter(
      article => new Date(article.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    ).length
    const videoContent = filteredArticles.filter(article => article.category === 'training').length

    return { totalArticles, totalCollections, recentArticles, videoContent }
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
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Folder className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.totalCollections}</p>
                <p className="text-sm text-gray-600">Collections</p>
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
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <Video className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.videoContent}</p>
                <p className="text-sm text-gray-600">Video Content</p>
              </div>
            </div>
          </div>
        </div>

        {/* Collections Section */}
        {collections.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                <Folder className="inline h-6 w-6 mr-2 text-blue-600" />
                Browse by Collection
              </h2>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'grid' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <LayoutGrid className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'list' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <List className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6' : 'space-y-4'}>
              {collections.map((collection) => {
                const collectionType = getCollectionType(collection.type)
                const TypeIcon = collectionType.icon
                const articleCount = getArticleCountByCollection(collection.id)

                if (viewMode === 'grid') {
                  return (
                    <button
                      key={collection.id}
                      onClick={() => handleBrowseCollection(collection.id)}
                      className={`bg-white rounded-xl shadow-sm border-2 hover:shadow-md transition-all text-left ${
                        collectionFilter === collection.id ? 'border-blue-500' : 'border-gray-200'
                      }`}
                    >
                      <div className="p-6">
                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 ${collectionType.color}`}>
                          <TypeIcon className="h-7 w-7" />
                        </div>
                        
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {collection.name}
                        </h3>
                        
                        {collection.description && (
                          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                            {collection.description}
                          </p>
                        )}

                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <FileText className="h-4 w-4" />
                            <span>{articleCount} {articleCount === 1 ? 'item' : 'items'}</span>
                          </div>
                          <span className="text-sm font-medium text-blue-600">
                            Browse →
                          </span>
                        </div>
                      </div>
                    </button>
                  )
                } else {
                  return (
                    <button
                      key={collection.id}
                      onClick={() => handleBrowseCollection(collection.id)}
                      className={`w-full bg-white rounded-xl shadow-sm border-2 hover:shadow-md transition-all text-left ${
                        collectionFilter === collection.id ? 'border-blue-500' : 'border-gray-200'
                      }`}
                    >
                      <div className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4 flex-1">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${collectionType.color}`}>
                              <TypeIcon className="h-6 w-6" />
                            </div>
                            
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                {collection.name}
                              </h3>
                              {collection.description && (
                                <p className="text-sm text-gray-600 line-clamp-1">
                                  {collection.description}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center space-x-4">
                            <span className="text-sm text-gray-600">
                              {articleCount} {articleCount === 1 ? 'item' : 'items'}
                            </span>
                            <span className="text-sm font-medium text-blue-600">
                              Browse →
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  )
                }
              })}
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div ref={resultsRef} className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
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
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900"
                />
              </div>

              {/* Sort and Filter Toggle */}
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
                  onClick={() => setShowFilters(!showFilters)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                  <ChevronDown className={`ml-2 h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                </button>
              </div>
            </div>

            {/* Expandable Filters */}
            {showFilters && (
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Collection
                  </label>
                  <select
                    value={collectionFilter}
                    onChange={(e) => setCollectionFilter(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  >
                    <option value="all">All Collections</option>
                    <option value="uncategorized">Uncategorized</option>
                    {collections.map(col => (
                      <option key={col.id} value={col.id}>
                        {col.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  >
                    {categories.map(cat => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Order
                  </label>
                  <button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    {sortOrder === 'asc' ? '↑ Ascending' : '↓ Descending'}
                  </button>
                </div>
              </div>
            )}

            {/* Active Filters Display */}
            {(collectionFilter !== 'all' || categoryFilter !== 'all') && (
              <div className="mt-4 flex items-center space-x-2">
                <span className="text-sm text-gray-600">Active filters:</span>
                {collectionFilter !== 'all' && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {collections.find(c => c.id === collectionFilter)?.name || 'Uncategorized'}
                    <button
                      onClick={() => setCollectionFilter('all')}
                      className="ml-1 hover:text-blue-600"
                    >
                      ×
                    </button>
                  </span>
                )}
                {categoryFilter !== 'all' && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {categories.find(c => c.value === categoryFilter)?.label}
                    <button
                      onClick={() => setCategoryFilter('all')}
                      className="ml-1 hover:text-green-600"
                    >
                      ×
                    </button>
                  </span>
                )}
                <button
                  onClick={() => {
                    setCollectionFilter('all')
                    setCategoryFilter('all')
                  }}
                  className="text-sm text-gray-600 hover:text-gray-900 underline"
                >
                  Clear all
                </button>
              </div>
            )}
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
                  : 'Try adjusting your search terms or selecting a different filter.'
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {filteredArticles.map((article) => {
                const CategoryIcon = getCategoryIcon(article.category)
                const accessBadge = getAccessLevelBadge(article.access_level)
                const collection = collections.find(c => c.id === article.collection_id)
                const collectionType = collection ? getCollectionType(collection.type) : null

                return (
                  <div key={article.id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start space-x-4 flex-1 min-w-0">
                          <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                            <CategoryIcon className="h-6 w-6 text-gray-600" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-3 mb-2 flex-wrap">
                              <h3 className="text-lg font-semibold text-gray-900 truncate">
                                {article.title}
                              </h3>
                              {collection && collectionType && (
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${collectionType.color}`}>
                                  <Folder className="h-3 w-3 mr-1" />
                                  {collection.name}
                                </span>
                              )}
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${accessBadge.color}`}>
                                {accessBadge.label}
                              </span>
                            </div>
                            
                            <p className="text-gray-600 line-clamp-2 mb-3">
                              {article.content.substring(0, 150)}...
                            </p>

                            <div className="flex items-center space-x-4 text-sm text-gray-500">
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
  )
}