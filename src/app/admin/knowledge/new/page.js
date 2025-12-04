// src/app/admin/knowledge/new/page.js
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, Save, X, Plus, Tag as TagIcon, Lock, Unlock,
  FileText, Video, Image, AlertCircle, Eye, Folder, Upload, File,
   FileVideo, FileImage, FileAudio, Download
} from 'lucide-react'

export default function NewKnowledgeArticlePage() {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'onboarding',
    access_level: 'all',
    tags: [],
    published: true,
    collection_id: null  // ⭐ NEW: Collection support
  })
  const [tagInput, setTagInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [collections, setCollections] = useState([])
  const [attachments, setAttachments] = useState([])
  const [uploading, setUploading] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  const categories = [
    { value: 'onboarding', label: 'Getting Started', icon: FileText },
    { value: 'sales', label: 'Sales Resources', icon: FileText },
    { value: 'technical', label: 'Technical Docs', icon: FileText },
    { value: 'marketing', label: 'Marketing Materials', icon: Image },
    { value: 'training', label: 'Training Videos', icon: Video },
    { value: 'case_studies', label: 'Case Studies', icon: FileText }
  ]

  const accessLevels = [
    { value: 'all', label: 'All Partners', description: 'Visible to all partner tiers', color: 'bg-green-100 text-green-800' },
    { value: 'bronze', label: 'Bronze+', description: 'Bronze tier and above', color: 'bg-orange-100 text-orange-800' },
    { value: 'silver', label: 'Silver+', description: 'Silver tier and above', color: 'bg-gray-100 text-gray-800' },
    { value: 'gold', label: 'Gold+', description: 'Gold tier and above', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'platinum', label: 'Platinum Only', description: 'Platinum partners only', color: 'bg-purple-100 text-purple-800' }
  ]

  // ⭐ NEW: Load collections on mount
  useEffect(() => {
    loadCollections()
  }, [])

  // ⭐ NEW: Load collections function
  const loadCollections = async () => {
    try {
      const { data, error } = await supabase
        .from('knowledge_collections')
        .select('*')
        .order('name', { ascending: true })
      
      if (error) throw error
      setCollections(data || [])
    } catch (err) {
      console.error('Error loading collections:', err)
    }
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError('')
  }

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }))
      setTagInput('')
    }
  }

  const handleRemoveTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTag()
    }
  }

  const validateForm = () => {
    if (!formData.title.trim()) {
      setError('Title is required')
      return false
    }
    if (!formData.content.trim()) {
      setError('Content is required')
      return false
    }
    if (formData.title.length < 10) {
      setError('Title must be at least 10 characters long')
      return false
    }
    if (formData.content.length < 50) {
      setError('Content must be at least 50 characters long')
      return false
    }
    return true
  }

  const handleSave = async (publishStatus) => {
    if (!validateForm()) return

    try {
      setLoading(true)
      setError('')

      const { data, error: insertError } = await supabase
        .from('knowledge_articles')
        .insert([{
          title: formData.title.trim(),
          content: formData.content.trim(),
          category: formData.category,
          access_level: formData.access_level,
          tags: formData.tags,
          published: publishStatus,
          collection_id: formData.collection_id || null,
          attachments: attachments
        }])
        .select()

      if (insertError) throw insertError

      router.push('/admin/knowledge')
      router.refresh()

    } catch (err) {
      console.error('Error saving article:', err)
      setError('Failed to save article. Please try again.')
    } finally {
      setLoading(false)
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

      if (error) throw error

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
    } catch (error) {
      console.error('Error uploading files:', error)
      alert('Error uploading files: ' + error.message)
    } finally {
      setUploading(false)
    }
  }

  const removeAttachment = (index) => {
    setAttachments(attachments.filter((_, i) => i !== index))
  }

  const getFileIcon = (type) => {
    if (type.startsWith('video/')) return FileVideo
    if (type.startsWith('image/')) return FileImage
    if (type.startsWith('audio/')) return FileAudio
    if (type.includes('pdf')) return FileText
    return File
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <Link
                href="/admin/knowledge"
                className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Knowledge Base
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Create New Article</h1>
              <p className="text-gray-600 mt-1">
                Create a new knowledge base article for partners
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <Eye className="h-4 w-4 mr-2" />
                {showPreview ? 'Edit' : 'Preview'}
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {showPreview ? (
              // Preview Mode
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">
                  {formData.title || 'Untitled Article'}
                </h2>
                <div className="prose max-w-none">
                  {formData.content ? (
                    formatContent(formData.content)
                  ) : (
                    <p className="text-gray-400 italic">No content yet...</p>
                  )}
                </div>
              </div>
            ) : (
              // Edit Mode
              <div className="space-y-6">
                {/* Title */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Article Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Enter a clear, descriptive title..."
                    className="block w-full px-4 py-3 text-black border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-lg font-medium"
                    maxLength={200}
                  />
                  <div className="mt-2 flex justify-between text-sm">
                    <p className="text-gray-500">
                      This will be the main heading for your article
                    </p>
                    <span className="text-gray-400">
                      {formData.title.length}/200
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Article Content *
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => handleInputChange('content', e.target.value)}
                    placeholder="Write your article content here...

You can use simple markdown formatting:
# Main Heading
## Sub Heading
### Smaller Heading

- Bullet point
- Another point

1. Numbered list
2. Second item

Just start new lines for paragraphs."
                    className="block w-full px-4 py-3 text-black border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-mono text-sm"
                    rows={20}
                  />
                  <div className="mt-2 flex justify-between text-sm">
                    <p className="text-gray-500">
                      Use markdown-style formatting for headers, lists, and paragraphs
                    </p>
                    <span className="text-gray-400">
                      {formData.content.length} characters
                    </span>
                  </div>
                </div>

                {/* Formatting Help */}
                <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
                  <h3 className="text-sm font-semibold text-blue-900 mb-2">
                    Formatting Tips
                  </h3>
                  <div className="text-sm text-blue-700 space-y-1">
                    <p>• Start lines with <code className="bg-blue-100 px-1 rounded">#</code> for headings (use ##, ### for smaller headings)</p>
                    <p>• Start lines with <code className="bg-blue-100 px-1 rounded">-</code> or <code className="bg-blue-100 px-1 rounded">*</code> for bullet points</p>
                    <p>• Start lines with <code className="bg-blue-100 px-1 rounded">1.</code> for numbered lists</p>
                    <p>• Leave blank lines between paragraphs</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Publish Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Publish</h3>
              
              <div className="space-y-3">
                <button
                  onClick={() => handleSave(true)}
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Publishing...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Publish Article
                    </>
                  )}
                </button>

                <button
                  onClick={() => handleSave(false)}
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center px-4 py-3 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                >
                  Save as Draft
                </button>

                <Link
                  href="/admin/knowledge"
                  className="w-full inline-flex items-center justify-center px-4 py-3 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </Link>
              </div>

              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600">
                  <strong>Publish:</strong> Makes article visible to partners based on access level
                </p>
                <p className="text-xs text-gray-600 mt-2">
                  <strong>Draft:</strong> Saves article but keeps it hidden from partners
                </p>
              </div>
            </div>

            {/* ⭐ NEW: Collection Selection */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                <Folder className="inline h-5 w-5 mr-2 text-purple-600" />
                Collection
              </h3>
              
              <select
                value={formData.collection_id || ''}
                onChange={(e) => handleInputChange('collection_id', e.target.value || null)}
                className="block w-full px-3 py-2 text-black border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="">No Collection (Uncategorized)</option>
                {collections.map(col => (
                  <option key={col.id} value={col.id}>
                    {col.name}
                  </option>
                ))}
              </select>
              
              <p className="mt-2 text-sm text-gray-500">
                Organize this article into a folder/collection for better organization
              </p>

              {collections.length === 0 && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs text-blue-700">
                    No collections yet. Go to Knowledge Base main page to create collections.
                  </p>
                </div>
              )}
            </div>

            {/* Category */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Category</h3>
              
              <select
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className="block w-full px-3 py-2 text-black border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>

              <p className="mt-2 text-sm text-gray-500">
                Choose the category that best describes this article
              </p>
            </div>
            
            {/* File Attachments */}
            <div>
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

            {/* Access Level */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Access Level</h3>
              
              <div className="space-y-3">
                {accessLevels.map(level => (
                  <label
                    key={level.value}
                    className={`flex items-start p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                      formData.access_level === level.value
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="access_level"
                      value={level.value}
                      checked={formData.access_level === level.value}
                      onChange={(e) => handleInputChange('access_level', e.target.value)}
                      className="mt-1 h-4 w-4 text-purple-600 focus:ring-purple-500"
                    />
                    <div className="ml-3 flex-1">
                      <div className="flex items-center space-x-2">
                        {level.value === 'all' ? (
                          <Unlock className="h-4 w-4 text-green-600" />
                        ) : (
                          <Lock className="h-4 w-4 text-gray-600" />
                        )}
                        <span className="font-medium text-gray-900">{level.label}</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{level.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Tags</h3>
              
              <div className="space-y-3">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Add a tag..."
                    className="flex-1 px-3 py-2 text-black border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                  <button
                    onClick={handleAddTag}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800"
                      >
                        <TagIcon className="h-3 w-3 mr-1" />
                        {tag}
                        <button
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-2 hover:text-purple-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <p className="text-sm text-gray-500">
                  Add tags to help partners find this article
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}