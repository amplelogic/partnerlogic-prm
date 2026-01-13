// src/app/dashboard/layout.js
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Users, BarChart3, Headphones, FileText, Settings, 
  Menu, X, LogOut, Search, Home, TrendingUp,
  User, ChevronDown, BookOpen, Download, ShoppingCart, Trophy
} from 'lucide-react'
import { usePathname } from 'next/navigation'
import NotificationBell from '@/components/NotificationBell'

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const [user, setUser] = useState(null)
  const [partner, setPartner] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/auth/login')
        return
      }

      setUser(user)

      // Get partner profile
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
      }

      setLoading(false)
    }

    getUser()
  }, [router, supabase])

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/')
      router.refresh()
    } catch (error) {
      console.error('Error signing out:', error)
      // Force redirect even if signOut fails
      router.push('/')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // NEW: Check if MDF is enabled for this partner
  const mdfEnabled = partner?.organization?.mdf_enabled !== false // Default to true if not set
  const learningEnabled = partner?.organization?.learning_enabled !== false // Default to true if not set

  // Base navigation items
const baseNavigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'All Deals', href: '/dashboard/deals', icon: BarChart3 },
  // Referral Orders tab is hidden for all partners - deals auto-convert for referral partners
  { name: 'Invoices', href: '/dashboard/invoices', icon: Download },
  { name: 'Support', href: '/dashboard/support', icon: Headphones },
  // Conditionally add Learning tab
  ...(learningEnabled ? [{ name: 'Learning', href: '/dashboard/learning', icon: BookOpen }] : []),
  { name: 'Knowledge Base', href: '/dashboard/knowledge', icon: FileText },
  { name: 'Bonuses', href: '/dashboard/bonuses', icon: Trophy },
]

  // NEW: Conditionally add MDF if enabled
const navigation = [
  ...baseNavigation,
  ...(mdfEnabled ? [{ name: 'MDF Requests', href: '/dashboard/mdf', icon: TrendingUp }] : []),
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
].map(item => ({
  ...item,
  current: pathname === item.href
}))

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity duration-300" 
            onClick={() => setSidebarOpen(false)} 
          />
          <div className="fixed inset-y-0 left-0 flex flex-col w-80 max-w-xs bg-white shadow-xl transform transition-transform duration-300 ease-in-out">
            {/* Close button */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="text-lg font-bold text-gray-900">PartnerLogic</div>
                  <div className="text-xs text-gray-500">by AmpleLogic</div>
                </div>
              </div>
              <button
                type="button"
                className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Partner info */}
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <User className="h-7 w-7 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-medium text-gray-900 truncate">
                    {partner?.first_name} {partner?.last_name}
                  </p>
                  <p className="text-sm text-gray-500 truncate">{partner?.organization?.name}</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-2 ${
                    partner?.organization?.tier === 'platinum' ? 'bg-purple-100 text-purple-800' :
                    partner?.organization?.tier === 'gold' ? 'bg-yellow-100 text-yellow-800' :
                    partner?.organization?.tier === 'silver' ? 'bg-gray-100 text-gray-800' :
                    'bg-orange-100 text-orange-800'
                  }`}>
                    {partner?.organization?.tier?.charAt(0).toUpperCase() + partner?.organization?.tier?.slice(1)} Partner
                  </span>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`group flex items-center px-4 py-3 text-base font-medium rounded-lg transition-all duration-200 ${
                    item.current
                      ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-500'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <item.icon className={`mr-4 flex-shrink-0 h-6 w-6 ${
                    item.current ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                  }`} />
                  {item.name}
                </Link>
              ))}
            </nav>

            {/* Logout */}
            <div className="p-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setSidebarOpen(false)
                  handleLogout()
                }}
                className="group flex items-center w-full px-4 py-3 text-base font-medium rounded-lg text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
              >
                <LogOut className="mr-4 flex-shrink-0 h-6 w-6 text-gray-400 group-hover:text-red-500" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <SidebarContent navigation={navigation} partner={partner} onLogout={handleLogout} />
      </div>

      {/* Main content */}
      <div className="lg:pl-64 flex flex-col flex-1">
        {/* Mobile header */}
        <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <button
            type="button"
            className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div className="text-lg font-bold text-gray-900">PartnerLogic</div>
          </div>

          <div className="relative">
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center space-x-2 p-1 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-white" />
              </div>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </button>

            {/* Mobile Profile Dropdown */}
            {profileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                <div className="py-1">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">
                      {partner?.first_name} {partner?.last_name}
                    </p>
                    <p className="text-xs text-gray-500">{partner?.organization?.name}</p>
                  </div>
                  <Link
                    href="/dashboard/settings"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setProfileDropdownOpen(false)}
                  >
                    <Settings className="h-4 w-4 mr-3" />
                    Settings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <LogOut className="h-4 w-4 mr-3" />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Desktop header */}
        <header className="hidden lg:block bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold leading-7 text-gray-900">
                  Dashboard
                </h1>
              </div>
              
              <div className="ml-4 flex items-center space-x-4">
                {/* Search - Hidden on smaller screens */}
                <div className="hidden xl:block relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search..."
                    className="block w-80 pl-10 pr-3 py-2 text-black border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                {/* Search icon for smaller screens */}
                <button className="xl:hidden p-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md">
                  <Search className="h-5 w-5" />
                </button>

                {/* Notifications */}
                <NotificationBell />

                {/* Profile dropdown */}
                <div className="relative">
                  <button 
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    <div className="text-left hidden md:block">
                      <p className="text-sm font-medium text-gray-900">
                        {partner?.first_name} {partner?.last_name}
                      </p>
                      <p className="text-xs text-gray-500 truncate max-w-32">{partner?.organization?.name}</p>
                    </div>
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  </button>

                  {/* Desktop Profile Dropdown */}
                  {profileDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                      <div className="py-1">
                        <div className="px-4 py-3 border-b border-gray-100">
                          <p className="text-sm font-medium text-gray-900">
                            {partner?.first_name} {partner?.last_name}
                          </p>
                          <p className="text-xs text-gray-500">{partner?.organization?.name}</p>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                            partner?.organization?.tier === 'platinum' ? 'bg-purple-100 text-purple-800' :
                            partner?.organization?.tier === 'gold' ? 'bg-yellow-100 text-yellow-800' :
                            partner?.organization?.tier === 'silver' ? 'bg-gray-100 text-gray-800' :
                            'bg-orange-100 text-orange-800'
                          }`}>
                            {partner?.organization?.tier?.charAt(0).toUpperCase() + partner?.organization?.tier?.slice(1)} Partner
                          </span>
                        </div>
                        <Link
                          href="/dashboard/settings"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setProfileDropdownOpen(false)}
                        >
                          <Settings className="h-4 w-4 mr-3" />
                          Account Settings
                        </Link>
                        <Link
                          href="/dashboard/knowledge"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setProfileDropdownOpen(false)}
                        >
                          <FileText className="h-4 w-4 mr-3" />
                          Help & Resources
                        </Link>
                        <div className="border-t border-gray-100">
                          <button
                            onClick={handleLogout}
                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <LogOut className="h-4 w-4 mr-3" />
                            Sign out
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main content area */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  )
}

function SidebarContent({ navigation, partner, onLogout }) {
  return (
    <div className="flex-1 flex flex-col min-h-0 bg-white border-r border-gray-200">
      {/* Logo */}
      <div className="flex items-center h-16 flex-shrink-0 px-4 bg-white border-b border-gray-200">
        <Link href="/dashboard" className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center">
            <Users className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="text-lg font-bold text-gray-900">PartnerLogic</div>
            <div className="text-xs text-gray-500">by AmpleLogic</div>
          </div>
        </Link>
      </div>

      {/* Partner info */}
      <div className="px-4 py-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
            <User className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {partner?.first_name} {partner?.last_name}
            </p>
            <p className="text-xs text-gray-500 truncate">{partner?.organization?.name}</p>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${
              partner?.organization?.tier === 'platinum' ? 'bg-purple-100 text-purple-800' :
              partner?.organization?.tier === 'gold' ? 'bg-yellow-100 text-yellow-800' :
              partner?.organization?.tier === 'silver' ? 'bg-gray-100 text-gray-800' :
              'bg-orange-100 text-orange-800'
            }`}>
              {partner?.organization?.tier?.charAt(0).toUpperCase() + partner?.organization?.tier?.slice(1)} Partner
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="mt-5 flex-1 px-2 space-y-1 overflow-y-auto">
        {navigation.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
              item.current
                ? 'bg-blue-50 border-r-2 border-blue-500 text-blue-700'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <item.icon className={`mr-3 flex-shrink-0 h-5 w-5 ${
              item.current ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
            }`} />
            {item.name}
          </Link>
        ))}
      </nav>

      {/* Logout */}
      <div className="flex-shrink-0 p-2 border-t border-gray-200">
        <button
          onClick={onLogout}
          className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-red-50 hover:text-red-600 w-full transition-colors"
        >
          <LogOut className="mr-3 flex-shrink-0 h-5 w-5 text-gray-400 group-hover:text-red-500" />
          Sign out
        </button>
      </div>
    </div>
  )
}