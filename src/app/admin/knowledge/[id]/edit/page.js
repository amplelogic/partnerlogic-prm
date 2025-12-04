// src/app/admin/knowledge/[id]/edit/page.js
// COMPLETE VERSION WITH FILE ATTACHMENTS AND FIXED ERROR HANDLING
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, Save, Trash2, Eye, AlertCircle, 
  Upload, X, File, FileText, FileVideo, 
  FileImage, FileAudio, Folder, Tag as TagIcon
} from 'lucide-react'

export default function EditArticlePage({ params }) {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'onboarding',
    access_level: 'all',
    tags: [],
    published: false,
    collection_id: null
  })
  const [collections, setCollections] = useState([])
  const [attachments, setAttachments] = useState([])
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [newTag, setNewTag] = useState('')
  
  const router = useRouter()
  const supabase = createClient()

  const categories = [
    { value: 'onboarding', label: 'Getting Started' },
    { value: 'sales', label: 'Sales Resources' },
    { value: 'technical', label: 'Technical Docs' },
    { value: 'marketing', label: 'Marketing Materials' },
    { value: 'training', label: 'Training Videos' },
    { value: 'case_studies', label: 'Case Studies' }
  ]

  const accessLevels = [
    { value: 'all', label: 'All Partners' },
    { value: 'bronze', label: 'Bronze & Above' },
    { value: 'silver', label: 'Silver & Above' },
    { value: 'gold', label: 'Gold & Above' },
    { value: 'platinum', label: 'Platinum Only' }
  ]

  useEffect(() => {
    loadCollections()
    loadArticle()
  }, [params.id])

  const loadCollections = async () => {
    try {
      const { data, error } = await supabase
        .from('knowledge_collections')
        .select('*')
        .order('name', { ascending: true })

      if (error) {
        console.error('Error loading collections:', error)
        return
      }

      setCollections(data || [])
    } catch (error) {
      console.error('Error loading collections:', error)
    }
  }

  const loadArticle = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('knowledge_articles')
        .select('*')
        .eq('id', params.id)
        .single()

      if (error) {
        console.error('Error loading article:', error)
        setError('Failed to load article. Error: ' + error.message)
        return
      }

      if (!data) {
        setError('Article not found.')
        return
      }

      setFormData({
        title: data.title || '',
        content: data.content || '',
        category: data.category || 'onboarding',
        access_level: data.access_level || 'all',
        tags: data.tags || [],
        published: data.published || false,
        collection_id: data.collection_id || null
      })
      
      setAttachments(data.attachments || [])
    } catch (error) {
      console.error('Error loading article:', error)
      setError('Failed to load article. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return

    setUploading(true)
    const newAttachments = []

    try {
      for (const file of files) {
        // Generate unique filename
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = `${fileName}`

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
          .from('knowledge-files')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          })

        if (error) {
          console.error('Upload error:', error)
          throw error
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('knowledge-files')
          .getPublicUrl(filePath)

        newAttachments.push({
          name: file.name,
          url: publicUrl,
          type: file.type,
          size: file.size,
          uploaded_at: new Date().toISOString()
        })
      }

      setAttachments([...attachments, ...newAttachments])
      alert('Files uploaded successfully!')
    } catch (error) {
      console.error('Error uploading files:', error)
      alert('Error uploading files: ' + error.message)
    } finally {
      setUploading(false)
    }
  }

  const removeAttachment = (index) => {
    if (confirm('Remove this file?')) {
      setAttachments(attachments.filter((_, i) => i !== index))
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

  const handleAddTag = () => {
    if (newTag && !formData.tags.includes(newTag)) {
      setFormData({
        ...formData,
        tags: [...formData.tags, newTag]
      })
      setNewTag('')
    }
  }

  const handleRemoveTag = (tagToRemove) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    })
  }

  const handleSave = async () => {
    if (!formData.title || !formData.content) {
      alert('Please fill in title and content')
      return
    }

    setSaving(true)

    try {
      const { error } = await supabase
        .from('knowledge_articles')
        .update({
          title: formData.title,
          content: formData.content,
          category: formData.category,
          access_level: formData.access_level,
          tags: formData.tags,
          published: formData.published,
          collection_id: formData.collection_id || null,
          attachments: attachments,
          updated_at: new Date().toISOString()
        })
        .eq('id', params.id)

      if (error) throw error

      alert('Article updated successfully!')
      router.push('/admin/knowledge')
    } catch (error) {
      console.error('Error updating article:', error)
      alert('Error updating article: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this article? This cannot be undone.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('knowledge_articles')
        .delete()
        .eq('id', params.id)

      if (error) throw error

      alert('Article deleted successfully')
      router.push('/admin/knowledge')
    } catch (error) {
      console.error('Error deleting article:', error)
      alert('Error deleting article: ' + error.message)
    }
  }

  const handlePreview = () => {
    window.open(`/dashboard/knowledge/${params.id}`, '_blank')
  }

  if (loading) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/4 mb-6"></div>
            <div className="bg-white rounded-xl p-6 border">
              <div className="h-10 bg-gray-200 rounded mb-4"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => router.push('/admin/knowledge')}
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Knowledge Base
          </button>

          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <div className="flex items-center">
              <AlertCircle className="h-6 w-6 text-red-600 mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-red-900">Error Loading Article</h3>
                <p className="text-red-700 mt-1">{error}</p>
              </div>
            </div>
            <button
              onClick={() => loadArticle()}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/admin/knowledge')}
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Knowledge Base
          </button>
          
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Edit Article</h1>
            <div className="flex items-center space-x-3">
              <button
                onClick={handlePreview}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </button>
              <button
                onClick={handleDelete}
                className="inline-flex items-center px-4 py-2 border border-red-300 rounded-lg text-sm font-medium text-red-700 bg-white hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Article Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter article title..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900"
                required
              />
            </div>

            {/* Content */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content *
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Write your article content here..."
                rows={20}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-mono text-sm text-gray-900"
                required
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Publish Status */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-sm font-medium text-gray-700 mb-4">Publish Status</h3>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.published}
                  onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-900">
                  {formData.published ? 'Published' : 'Draft'}
                </span>
              </label>
            </div>

            {/* Collection */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Folder className="inline h-4 w-4 mr-1" />
                Collection
              </label>
              <select
                value={formData.collection_id || ''}
                onChange={(e) => setFormData({ ...formData, collection_id: e.target.value || null })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900"
              >
                <option value="">No Collection (Uncategorized)</option>
                {collections.map(collection => (
                  <option key={collection.id} value={collection.id}>
                    {collection.name}
                  </option>
                ))}
              </select>
              {collections.length === 0 && (
                <p className="mt-2 text-xs text-blue-600 bg-blue-50 p-2 rounded">
                  No collections available yet. Create one from the main page.
                </p>
              )}
            </div>

            {/* Category */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900"
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Access Level */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Access Level
              </label>
              <select
                value={formData.access_level}
                onChange={(e) => setFormData({ ...formData, access_level: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900"
              >
                {accessLevels.map(level => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </select>
            </div>

            {/* File Attachments */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Upload className="inline h-4 w-4 mr-1" />
                File Attachments
              </label>
              
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                disabled={uploading}
                className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-white focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-l-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
              />
              
              <p className="text-xs text-gray-500 mt-1">
                Upload PDFs, videos, images, or documents
              </p>

              {uploading && (
                <div className="mt-2 text-sm text-purple-600">
                  Uploading files...
                </div>
              )}

              {/* Show uploaded files */}
              {attachments.length > 0 && (
                <div className="mt-3 space-y-2">
                  {attachments.map((file, index) => {
                    const FileIcon = getFileIcon(file.type)
                    return (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-2 flex-1 min-w-0">
                          <FileIcon className="h-4 w-4 text-gray-600 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-900 truncate">{file.name}</p>
                            <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => removeAttachment(index)}
                          className="ml-2 text-red-600 hover:text-red-800"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Tags */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <TagIcon className="inline h-4 w-4 mr-1" />
                Tags
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                  placeholder="Add tag..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900"
                />
                <button
                  onClick={handleAddTag}
                  className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Add
                </button>
              </div>
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {formData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded-md"
                    >
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 text-gray-500 hover:text-gray-700"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}