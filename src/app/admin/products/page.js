// src/app/admin/products/page.js
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { 
  Search, Filter, Plus, Edit2, Trash2, Package,
  CheckCircle, XCircle, Eye, Image as ImageIcon
} from 'lucide-react'

export default function AdminProductsPage() {
  const [products, setProducts] = useState([])
  const [filteredProducts, setFilteredProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    short_name: '',
    description: '',
    image_url: '',
    is_active: true
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const supabase = createClient()

  useEffect(() => {
    console.log('Component mounted, loading products...')
    loadProducts()
  }, [])

  useEffect(() => {
    filterProducts()
  }, [products, searchTerm])

  // Debug: Log when showModal changes
  useEffect(() => {
    console.log('showModal state changed:', showModal)
  }, [showModal])

  const loadProducts = async () => {
    try {
      setLoading(true)
      console.log('Fetching products from Supabase...')
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name', { ascending: true })

      if (error) {
        console.error('Error loading products:', error)
        throw error
      }

      console.log('Products loaded:', data)
      setProducts(data || [])
    } catch (error) {
      console.error('Error loading products:', error)
      alert('Failed to load products: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const filterProducts = () => {
    let filtered = [...products]

    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.short_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredProducts(filtered)
  }

  const handleOpenModal = (product = null) => {
  console.log('=== OPENING MODAL ===')
  console.log('Product:', product)
  
  if (product) {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      short_name: product.short_name,
      description: product.description || '',
      image_url: product.image_url || '',
      is_active: product.is_active
    })
  } else {
    setEditingProduct(null)
    setFormData({
      name: '',
      short_name: '',
      description: '',
      image_url: '',
      is_active: true
    })
  }
  
  setError('')
  
  // Force a small delay to ensure state is set
  setTimeout(() => {
    console.log('Setting showModal to TRUE')
    setShowModal(true)
  }, 0)
}

  const handleCloseModal = () => {
    console.log('Closing modal')
    setShowModal(false)
    setEditingProduct(null)
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    console.log('Form submitted with data:', formData)
    
    if (!formData.name.trim() || !formData.short_name.trim()) {
      setError('Name and Short Name are required')
      return
    }

    try {
      setSaving(true)
      setError('')

      if (editingProduct) {
        console.log('Updating product:', editingProduct.id)
        // Update existing product
        const { error } = await supabase
          .from('products')
          .update({
            name: formData.name.trim(),
            short_name: formData.short_name.trim(),
            description: formData.description.trim() || null,
            image_url: formData.image_url.trim() || null,
            is_active: formData.is_active
          })
          .eq('id', editingProduct.id)

        if (error) throw error
        console.log('Product updated successfully')
      } else {
        console.log('Creating new product')
        // Create new product
        const { error } = await supabase
          .from('products')
          .insert({
            name: formData.name.trim(),
            short_name: formData.short_name.trim(),
            description: formData.description.trim() || null,
            image_url: formData.image_url.trim() || null,
            is_active: formData.is_active
          })

        if (error) throw error
        console.log('Product created successfully')
      }

      await loadProducts()
      handleCloseModal()
    } catch (error) {
      console.error('Error saving product:', error)
      setError(error.message || 'Failed to save product')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (product) => {
    if (!confirm(`Are you sure you want to delete "${product.name}"? This will remove it from all partner assignments.`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', product.id)

      if (error) throw error

      await loadProducts()
    } catch (error) {
      console.error('Error deleting product:', error)
      alert('Failed to delete product: ' + error.message)
    }
  }

  const handleToggleActive = async (product) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: !product.is_active })
        .eq('id', product.id)

      if (error) throw error

      await loadProducts()
    } catch (error) {
      console.error('Error toggling product status:', error)
    }
  }

  if (loading) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/4 mb-6"></div>
            <div className="bg-white rounded-xl p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  console.log('Rendering component, showModal:', showModal)

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Product Management</h1>
              <p className="text-gray-600 mt-1">
                Manage products that can be assigned to partners
              </p>
            </div>
            <button
              onClick={() => {
                console.log('Add Product button clicked')
                handleOpenModal()
              }}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{products.length}</p>
                <p className="text-sm text-gray-600">Total Products</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">
                  {products.filter(p => p.is_active).length}
                </p>
                <p className="text-sm text-gray-600">Active Products</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                <XCircle className="h-6 w-6 text-gray-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">
                  {products.filter(p => !p.is_active).length}
                </p>
                <p className="text-sm text-gray-600">Inactive Products</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="p-6">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search products by name, short name, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-purple-500 focus:border-purple-500 sm:text-sm text-gray-900"
              />
            </div>
          </div>
        </div>

        {/* Products List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {products.length === 0 ? 'No products yet' : 'No products match your search'}
              </h3>
              <p className="text-gray-600 mb-4">
                {products.length === 0 
                  ? 'Create your first product to start assigning to partners.'
                  : 'Try adjusting your search criteria.'
                }
              </p>
              {products.length === 0 && (
                <button
                  onClick={() => {
                    console.log('Add First Product button clicked')
                    handleOpenModal()
                  }}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Product
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredProducts.map((product) => (
                <div key={product.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      {/* Product Image */}
                      <div className="w-16 h-16 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {product.image_url ? (
                          <img 
                            src={product.image_url} 
                            alt={product.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none'
                              e.target.parentElement.innerHTML = `<div class="text-white font-bold text-lg">${product.short_name}</div>`
                            }}
                          />
                        ) : (
                          <div className="text-white font-bold text-lg">
                            {product.short_name}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-1">
                          <h3 className="text-lg font-medium text-gray-900">
                            {product.name}
                          </h3>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {product.short_name}
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            product.is_active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {product.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        
                        {product.description && (
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {product.description}
                          </p>
                        )}

                        <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                          <span>Created {new Date(product.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => handleToggleActive(product)}
                        className={`inline-flex items-center px-3 py-1.5 border text-sm font-medium rounded-md transition-colors ${
                          product.is_active
                            ? 'border-yellow-300 text-yellow-700 bg-yellow-50 hover:bg-yellow-100'
                            : 'border-green-300 text-green-700 bg-green-50 hover:bg-green-100'
                        }`}
                        title={product.is_active ? 'Deactivate' : 'Activate'}
                      >
                        {product.is_active ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => handleOpenModal(product)}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <Edit2 className="h-4 w-4 mr-1" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(product)}
                        className="inline-flex items-center px-3 py-1.5 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal - Fixed z-index and positioning */}
{/* Modal - Fixed visibility and positioning */}
{showModal && (
  <>
    {/* Background overlay */}
    <div 
      className="fixed inset-0 bg-white/20 backdrop-blur-lg border border-white/30 z-[100000]"
      onClick={handleCloseModal}
    />
    
    {/* Modal container */}
    <div className="fixed inset-0 z-[100001] overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        {/* Modal content */}
        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg">
          <form onSubmit={handleSubmit}>
            {/* Header */}
            <div className="bg-white px-6 pt-6 pb-4 rounded-t-lg">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h3>
            </div>

            {/* Body */}
            <div className="px-6 pb-4 space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="block w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Customer Relationship Management"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Short Name *
                </label>
                <input
                  type="text"
                  value={formData.short_name}
                  onChange={(e) => setFormData({ ...formData, short_name: e.target.value })}
                  className="block w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., CRM"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="block w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Brief description of the product"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Image URL
                </label>
                <input
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  className="block w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://example.com/image.png"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Optional: URL to product image or logo
                </p>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                  Active (available for partner assignment)
                </label>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 rounded-b-lg flex flex-row-reverse gap-3">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : (editingProduct ? 'Update Product' : 'Create Product')}
              </button>
              <button
                type="button"
                onClick={handleCloseModal}
                className="inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </>
)}
    </div>
  )
}