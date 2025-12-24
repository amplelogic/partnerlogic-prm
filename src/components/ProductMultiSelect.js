// src/components/ProductMultiSelect.js
'use client'

import { useState, useEffect, useRef } from 'react'
import { ChevronDown, X, Package, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function ProductMultiSelect({ selectedProducts = [], onChange, disabled = false }) {
  const [products, setProducts] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const dropdownRef = useRef(null)
  const supabase = createClient()

  useEffect(() => {
    loadProducts()
  }, [])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true })

      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error('Error loading products:', error)
    }
  }

  const handleToggleProduct = (product) => {
    const isSelected = selectedProducts.some(p => p.id === product.id)
    
    if (isSelected) {
      onChange(selectedProducts.filter(p => p.id !== product.id))
    } else {
      onChange([...selectedProducts, product])
    }
  }

  const handleRemoveProduct = (productId) => {
    onChange(selectedProducts.filter(p => p.id !== productId))
  }

  const handleSelectAll = () => {
    const allProductIds = filteredProducts.map(p => p.id)
    const allSelected = filteredProducts.every(product => 
      selectedProducts.some(sp => sp.id === product.id)
    )

    if (allSelected) {
      // Deselect all filtered products
      onChange(selectedProducts.filter(sp => 
        !allProductIds.includes(sp.id)
      ))
    } else {
      // Select all filtered products (merge with existing)
      const newProducts = filteredProducts.filter(product => 
        !selectedProducts.some(sp => sp.id === product.id)
      )
      onChange([...selectedProducts, ...newProducts])
    }
  }

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.short_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const allFilteredSelected = filteredProducts.length > 0 && filteredProducts.every(product =>
    selectedProducts.some(sp => sp.id === product.id)
  )

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Selected Products Display */}
      <div 
        className={`min-h-[42px] w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 ${
          disabled ? 'bg-gray-100 cursor-not-allowed' : 'cursor-pointer'
        }`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <div className="flex flex-wrap gap-2 items-center">
          {selectedProducts.length === 0 ? (
            <span className="text-gray-500 text-sm">Select products...</span>
          ) : (
            selectedProducts.map((product) => (
              <div
                key={product.id}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-100 text-blue-800 rounded-md text-sm font-medium"
                onClick={(e) => e.stopPropagation()}
              >
                <span>{product.short_name}</span>
                {!disabled && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRemoveProduct(product.id)
                    }}
                    className="hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))
          )}
          {!disabled && (
            <ChevronDown className={`h-4 w-4 text-gray-400 ml-auto transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          )}
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-hidden">
          {/* Search */}
          <div className="p-2 border-b border-gray-200">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search products..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Select All */}
          {filteredProducts.length > 0 && (
            <div className="p-2 border-b border-gray-200 bg-gray-50">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  handleSelectAll()
                }}
                className="w-full px-3 py-2 text-sm font-medium text-left rounded-md hover:bg-gray-100 transition-colors flex items-center justify-between"
              >
                <span className="text-gray-700">
                  {allFilteredSelected ? 'Deselect All' : 'Select All'}
                </span>
                {allFilteredSelected && (
                  <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                )}
              </button>
            </div>
          )}

          {/* Product List */}
          <div className="max-h-48 overflow-y-auto">
            {filteredProducts.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500 text-center">
                No products found
              </div>
            ) : (
              filteredProducts.map((product) => {
                const isSelected = selectedProducts.some(p => p.id === product.id)
                
                return (
                  <div
                    key={product.id}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleToggleProduct(product)
                    }}
                    className={`px-4 py-2.5 cursor-pointer hover:bg-gray-50 flex items-center justify-between transition-colors ${
                      isSelected ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      {/* Product Icon/Image */}
                      <div className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {product.image_url ? (
                          <img 
                            src={product.image_url} 
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-white font-bold text-xs">
                            {product.short_name}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {product.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {product.short_name}
                        </div>
                      </div>
                    </div>

                    {isSelected && (
                      <div className="flex-shrink-0 ml-2">
                        <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>

          {/* Footer */}
          {selectedProducts.length > 0 && (
            <div className="p-2 border-t border-gray-200 bg-gray-50">
              <div className="text-xs text-gray-600 text-center">
                {selectedProducts.length} product{selectedProducts.length !== 1 ? 's' : ''} selected
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}