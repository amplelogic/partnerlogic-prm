// src/app/admin/knowledge/page.js
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { 
  Search, Filter, Eye, Edit2, Trash2, Plus, FileText,
  Video, Image, Award, ChevronDown, Calendar, Tag,
  Lock, Unlock, User, Folder, FolderOpen, Grid,
  List, LayoutGrid, Package, BookOpen, Briefcase,
  GraduationCap, FileStack
} from 'lucide-react'

export default function AdminKnowledgeBasePage() {
  const [articles, setArticles] = useState([])
  const [collections, setCollections] = useState([])
  const [filteredArticles, setFilteredArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [collectionFilter, setCollectionFilter] = useState('all')
  const [accessFilter, setAccessFilter] = useState('all')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState('desc')
  const [showFilters, setShowFilters] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'list'
  const [showCollectionModal, setShowCollectionModal] = useState(false)
  const [editingCollection, setEditingCollection] = useState(null)

  const supabase = createClient()

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'onboarding', label: 'Getting Started' },
    { value: 'sales', label: 'Sales Resources' },
    { value: 'technical', label: 'Technical Docs' },
    { value: 'marketing', label: 'Marketing Materials' },
    { value: 'training', label: 'Training Videos' },
    { value: 'case_studies', label: 'Case Studies' }
  ]

  const accessLevels = [
    { value: 'all', label: 'All Access Levels' },
    { value: 'all_partners', label: 'All Partners', color: 'bg-green-100 text-green-800' },
    { value: 'bronze', label: 'Bronze+', color: 'bg-orange-100 text-orange-800' },
    { value: 'silver', label: 'Silver+', color: 'bg-gray-100 text-gray-800' },
    { value: 'gold', label: 'Gold+', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'platinum', label: 'Platinum Only', color: 'bg-purple-100 text-purple-800' }
  ]

  // Predefined collection types with icons and colors
  const collectionTypes = [
    { value: 'product_collateral', label: 'Product Collateral', icon: Package, color: 'bg-blue-100 text-blue-800 border-blue-200' },
    { value: 'product_videos', label: 'Product Videos', icon: Video, color: 'bg-purple-100 text-purple-800 border-purple-200' },
    { value: 'case_studies', label: 'Case Studies', icon: Award, color: 'bg-green-100 text-green-800 border-green-200' },
    { value: 'user_manuals', label: 'User Manuals', icon: BookOpen, color: 'bg-orange-100 text-orange-800 border-orange-200' },
    { value: 'marketing_materials', label: 'Marketing Materials', icon: Image, color: 'bg-pink-100 text-pink-800 border-pink-200' },
    { value: 'sales_enablement', label: 'Sales Enablement', icon: Briefcase, color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
    { value: 'training_resources', label: 'Training Resources', icon: GraduationCap, color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    { value: 'documentation', label: 'Documentation', icon: FileStack, color: 'bg-gray-100 text-gray-800 border-gray-200' }
  ]

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    filterAndSortArticles()
  }, [articles, searchTerm, categoryFilter, collectionFilter, accessFilter, sortBy, sortOrder])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Load collections
      const { data: collectionsData, error: collectionsError } = await supabase
        .from('knowledge_collections')
        .select('*')
        .order('name', { ascending: true })

      if (collectionsError) throw collectionsError
      setCollections(collectionsData || [])

      // Load articles
      const { data: articlesData, error: articlesError } = await supabase
        .from('knowledge_articles')
        .select('*')
        .order('created_at', { ascending: false })

      if (articlesError) throw articlesError
      setArticles(articlesData || [])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterAndSortArticles = () => {
    let filtered = [...articles]

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(article =>
        article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    // Apply category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(article => article.category === categoryFilter)
    }

    // Apply collection filter
    if (collectionFilter !== 'all') {
      filtered = filtered.filter(article => article.collection_id === collectionFilter)
    }

    // Apply access level filter
    if (accessFilter !== 'all') {
      filtered = filtered.filter(article => article.access_level === accessFilter)
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

  const handleDeleteArticle = async (articleId) => {
    if (!confirm('Are you sure you want to delete this article? This action cannot be undone.')) {
      return
    }

    try {
      setDeleting(articleId)
      
      const { error } = await supabase
        .from('knowledge_articles')
        .delete()
        .eq('id', articleId)

      if (error) throw error

      setArticles(articles.filter(a => a.id !== articleId))
    } catch (error) {
      console.error('Error deleting article:', error)
      alert('Failed to delete article. Please try again.')
    } finally {
      setDeleting(null)
    }
  }

  const handleDeleteCollection = async (collectionId) => {
    const articlesInCollection = articles.filter(a => a.collection_id === collectionId).length
    
    if (articlesInCollection > 0) {
      if (!confirm(`This collection contains ${articlesInCollection} article(s). Deleting it will remove the collection reference from these articles. Continue?`)) {
        return
      }
    } else {
      if (!confirm('Are you sure you want to delete this collection?')) {
        return
      }
    }

    try {
      const { error } = await supabase
        .from('knowledge_collections')
        .delete()
        .eq('id', collectionId)

      if (error) throw error

      setCollections(collections.filter(c => c.id !== collectionId))
      
      // Update articles to remove collection reference
      const updatedArticles = articles.map(a => 
        a.collection_id === collectionId ? { ...a, collection_id: null } : a
      )
      setArticles(updatedArticles)
    } catch (error) {
      console.error('Error deleting collection:', error)
      alert('Failed to delete collection. Please try again.')
    }
  }

  const getCollectionType = (typeValue) => {
    return collectionTypes.find(t => t.value === typeValue) || collectionTypes[0]
  }

  const getArticleCountByCollection = (collectionId) => {
    return articles.filter(a => a.collection_id === collectionId).length
  }

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'training': return Video
      case 'marketing': return Image
      default: return FileText
    }
  }

  const getCategoryColor = (category) => {
    switch (category) {
      case 'onboarding': return 'bg-blue-100 text-blue-800'
      case 'sales': return 'bg-green-100 text-green-800'
      case 'technical': return 'bg-purple-100 text-purple-800'
      case 'marketing': return 'bg-pink-100 text-pink-800'
      case 'training': return 'bg-yellow-100 text-yellow-800'
      case 'case_studies': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getAccessBadge = (accessLevel) => {
    const level = accessLevels.find(l => l.value === accessLevel)
    return level || { label: 'All Partners', color: 'bg-green-100 text-green-800' }
  }

  const calculateStats = () => {
    const totalArticles = filteredArticles.length
    const totalCollections = collections.length
    const publicArticles = filteredArticles.filter(a => a.access_level === 'all').length
    const restrictedArticles = filteredArticles.filter(a => a.access_level !== 'all').length
    const videoContent = filteredArticles.filter(a => a.category === 'training').length

    return { totalArticles, totalCollections, publicArticles, restrictedArticles, videoContent }
  }

  const stats = calculateStats()

  if (loading) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
              {[...Array(5)].map((_, i) => (
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
              <h1 className="text-2xl font-bold text-gray-900">Knowledge Base Management</h1>
              <p className="text-gray-600 mt-1">
                Manage collections, articles, videos, and resources for partners
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowCollectionModal(true)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
              >
                <Folder className="h-4 w-4 mr-2" />
                New Collection
              </button>
              <Link
                href="/admin/knowledge/new"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Article
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.totalArticles}</p>
                <p className="text-sm text-gray-600">Total Articles</p>
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
                <Unlock className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.publicArticles}</p>
                <p className="text-sm text-gray-600">Public Access</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <Lock className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.restrictedArticles}</p>
                <p className="text-sm text-gray-600">Restricted</p>
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
              <h2 className="text-xl font-bold text-gray-900">Collections & Folders</h2>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'grid' 
                      ? 'bg-purple-100 text-purple-700' 
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <LayoutGrid className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'list' 
                      ? 'bg-purple-100 text-purple-700' 
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
                    <div
                      key={collection.id}
                      className="bg-white rounded-xl shadow-sm border-2 hover:shadow-md transition-all cursor-pointer group"
                    >
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${collectionType.color}`}>
                            <TypeIcon className="h-7 w-7" />
                          </div>
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => {
                                setEditingCollection(collection)
                                setShowCollectionModal(true)
                              }}
                              className="p-1.5 text-gray-400 hover:text-purple-600 rounded-lg hover:bg-purple-50 transition-colors"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteCollection(collection.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        
                        <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">
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
                          <button
                            onClick={() => setCollectionFilter(collection.id)}
                            className="text-sm font-medium text-purple-600 hover:text-purple-700"
                          >
                            View →
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                } else {
                  return (
                    <div
                      key={collection.id}
                      className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all"
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
                              <div className="flex items-center space-x-4 mt-2">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${collectionType.color}`}>
                                  {collectionType.label}
                                </span>
                                <span className="text-sm text-gray-600">
                                  {articleCount} {articleCount === 1 ? 'item' : 'items'}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => setCollectionFilter(collection.id)}
                              className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </button>
                            <button
                              onClick={() => {
                                setEditingCollection(collection)
                                setShowCollectionModal(true)
                              }}
                              className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                            >
                              <Edit2 className="h-4 w-4 mr-1" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteCollection(collection.id)}
                              className="inline-flex items-center px-3 py-1.5 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                }
              })}
            </div>
          </div>
        )}

        {/* Filters and Search */}
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
                  placeholder="Search articles by title, content, or tags..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 text-black border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                />
              </div>

              {/* Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {(collectionFilter !== 'all' || categoryFilter !== 'all' || accessFilter !== 'all') && (
                  <span className="ml-2 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs">
                    Active
                  </span>
                )}
                <ChevronDown className={`ml-2 h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* Expandable Filters */}
            {showFilters && (
              <div className="mt-6 grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Collection
                  </label>
                  <select
                    value={collectionFilter}
                    onChange={(e) => setCollectionFilter(e.target.value)}
                    className="block w-full px-3 py-2 text-black border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
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
                    className="block w-full px-3 py-2 text-black border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
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
                    Access Level
                  </label>
                  <select
                    value={accessFilter}
                    onChange={(e) => setAccessFilter(e.target.value)}
                    className="block w-full px-3 py-2 text-black border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    {accessLevels.map(level => (
                      <option key={level.value} value={level.value}>
                        {level.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sort By
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="block w-full px-3 py-2 text-black border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="created_at">Created Date</option>
                    <option value="updated_at">Updated Date</option>
                    <option value="title">Title</option>
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
            {(collectionFilter !== 'all' || categoryFilter !== 'all' || accessFilter !== 'all') && (
              <div className="mt-4 flex items-center space-x-2">
                <span className="text-sm text-gray-600">Active filters:</span>
                {collectionFilter !== 'all' && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    {collections.find(c => c.id === collectionFilter)?.name || 'Uncategorized'}
                    <button
                      onClick={() => setCollectionFilter('all')}
                      className="ml-1 hover:text-purple-600"
                    >
                      ×
                    </button>
                  </span>
                )}
                {categoryFilter !== 'all' && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {categories.find(c => c.value === categoryFilter)?.label}
                    <button
                      onClick={() => setCategoryFilter('all')}
                      className="ml-1 hover:text-blue-600"
                    >
                      ×
                    </button>
                  </span>
                )}
                {accessFilter !== 'all' && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {accessLevels.find(l => l.value === accessFilter)?.label}
                    <button
                      onClick={() => setAccessFilter('all')}
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
                    setAccessFilter('all')
                  }}
                  className="text-sm text-gray-600 hover:text-gray-900 underline"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Articles List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {filteredArticles.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {articles.length === 0 ? 'No articles created yet' : 'No articles match your filters'}
              </h3>
              <p className="text-gray-600 mb-6">
                {articles.length === 0 
                  ? 'Create your first knowledge base article to get started.'
                  : 'Try adjusting your search or filter criteria.'
                }
              </p>
              {articles.length === 0 && (
                <Link
                  href="/admin/knowledge/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Article
                </Link>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredArticles.map((article) => {
                const CategoryIcon = getCategoryIcon(article.category)
                const accessBadge = getAccessBadge(article.access_level)
                const collection = collections.find(c => c.id === article.collection_id)
                
                return (
                  <div key={article.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                          <CategoryIcon className="h-6 w-6 text-gray-600" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-medium text-gray-900 truncate">
                              {article.title}
                            </h3>
                            {collection && (
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCollectionType(collection.type).color}`}>
                                <Folder className="h-3 w-3 mr-1" />
                                {collection.name}
                              </span>
                            )}
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(article.category)}`}>
                              {categories.find(c => c.value === article.category)?.label || article.category}
                            </span>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-black ${accessBadge.color}`}>
                              {article.access_level === 'all' ? (
                                <Unlock className="h-3 w-3 mr-1" />
                              ) : (
                                <Lock className="h-3 w-3 mr-1" />
                              )}
                              {accessBadge.label}
                            </span>
                            {!article.published && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                Draft
                              </span>
                            )}
                          </div>
                          
                          <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                            {article.content.substring(0, 150)}...
                          </p>

                          <div className="flex items-center space-x-6 text-sm text-gray-500">
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              Created {new Date(article.created_at).toLocaleDateString()}
                            </div>
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              Updated {new Date(article.updated_at).toLocaleDateString()}
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
                          href={`/admin/knowledge/${article.id}/preview`}
                          className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Preview
                        </Link>
                        <Link
                          href={`/admin/knowledge/${article.id}/edit`}
                          className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                          <Edit2 className="h-4 w-4 mr-1" />
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDeleteArticle(article.id)}
                          disabled={deleting === article.id}
                          className="inline-flex items-center px-3 py-1.5 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                        >
                          {deleting === article.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                          ) : (
                            <>
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Collection Modal */}
      {showCollectionModal && (
        <CollectionModal
          collection={editingCollection}
          collectionTypes={collectionTypes}
          onClose={() => {
            setShowCollectionModal(false)
            setEditingCollection(null)
          }}
          onSave={loadData}
        />
      )}
    </div>
  )
}

// Collection Modal Component
function CollectionModal({ collection, collectionTypes, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: collection?.name || '',
    description: collection?.description || '',
    type: collection?.type || 'product_collateral',
    access_level: collection?.access_level || 'all'
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  
  const supabase = createClient()

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setError('Collection name is required')
      return
    }

    try {
      setSaving(true)
      setError('')

      if (collection) {
        // Update existing collection
        const { error: updateError } = await supabase
          .from('knowledge_collections')
          .update(formData)
          .eq('id', collection.id)

        if (updateError) throw updateError
      } else {
        // Create new collection
        const { error: insertError } = await supabase
          .from('knowledge_collections')
          .insert([formData])

        if (insertError) throw insertError
      }

      onSave()
      onClose()
    } catch (err) {
      console.error('Error saving collection:', err)
      setError('Failed to save collection. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const selectedType = collectionTypes.find(t => t.value === formData.type)
  const TypeIcon = selectedType?.icon

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {collection ? 'Edit Collection' : 'Create New Collection'}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Organize your knowledge base articles into collections
          </p>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Collection Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Collection Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Product Brochures, Training Videos, User Manuals"
              className="block w-full px-4 py-2 text-black border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of this collection..."
              rows={3}
              className="block w-full px-4 py-2 text-black border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Collection Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Collection Type *
            </label>
            <div className="grid grid-cols-2 gap-3">
              {collectionTypes.map((type) => {
                const Icon = type.icon
                return (
                  <label
                    key={type.value}
                    className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      formData.type === type.value
                        ? `${type.color} border-current`
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="type"
                      value={type.value}
                      checked={formData.type === type.value}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="sr-only"
                    />
                    <Icon className="h-5 w-5 mr-3" />
                    <span className="text-sm font-medium">{type.label}</span>
                  </label>
                )
              })}
            </div>
          </div>

          {/* Access Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Default Access Level
            </label>
            <select
              value={formData.access_level}
              onChange={(e) => setFormData({ ...formData, access_level: e.target.value })}
              className="block w-full px-4 py-2 text-black border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Partners</option>
              <option value="bronze">Bronze+</option>
              <option value="silver">Silver+</option>
              <option value="gold">Gold+</option>
              <option value="platinum">Platinum Only</option>
            </select>
            <p className="text-sm text-gray-500 mt-1">
              This will be the default access level for articles added to this collection
            </p>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : collection ? 'Save Changes' : 'Create Collection'}
          </button>
        </div>
      </div>
    </div>
  )
}