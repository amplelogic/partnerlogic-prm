// src/app/page.js
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Users, TrendingUp, Shield, Zap, BarChart3, FileText, Headphones, CheckCircle, Star, Play, Globe, Clock, Award, Target, ChevronDown } from 'lucide-react'

export default function HomePage() {
  const [openFAQ, setOpenFAQ] = useState(null)
  const faqs = [
    {
      id: 1,
      question: "What types of partnerships does AmpleLogic offer?",
      answer: "We offer four comprehensive partnership models: Referral Partners (earn commission for qualified referrals), Reseller Partners (resell our solutions with full support), Full-Cycle Partners (manage entire sales and implementation cycles), and White-Label Partners (rebrand our solutions with complete customization)."
    },
    {
      id: 2,
      question: "How does the tier-based partner program work?",
      answer: "Partners are automatically assigned to Bronze, Silver, Gold, or Platinum tiers based on performance metrics including revenue generated, deals closed, and certifications earned. Higher tiers unlock enhanced benefits like increased MDF allocations, better discount percentages, priority lead routing, and premium support levels."
    },
    {
      id: 3,
      question: "What level of support do partners receive?",
      answer: "Every partner receives a dedicated partner success manager, complete access to our knowledge base and training materials, comprehensive sales collateral, and 24/7 technical support. We also provide presales engineering support, co-selling assistance for major opportunities, and regular business reviews to ensure your success."
    },
    {
      id: 4,
      question: "How quickly can I get started as a partner?",
      answer: "Our streamlined onboarding process gets you up and running quickly. Once your partnership agreement is signed, you'll receive access to PartnerLogic within 24 hours. Your dedicated partner manager will schedule comprehensive onboarding within 48 hours, and most partners register their first deal within one week."
    },
    {
      id: 5,
      question: "Is there any cost to join the partner program?",
      answer: "Joining the AmpleLogic partner program is completely free with no upfront costs or ongoing fees. We invest heavily in our partners' success by providing all tools, training, support, and resources at no charge. Our success is directly tied to your success, which is why we're committed to providing exceptional value."
    },
    {
      id: 6,
      question: "What makes PartnerLogic different from other PRM platforms?",
      answer: "PartnerLogic is purpose-built for modern partner relationships with intelligent automation, real-time collaboration tools, and comprehensive analytics. Our platform integrates seamlessly with existing business systems, provides tier-based partner progression, and offers enterprise-grade security with complete data isolation for each partner organization."
    }
  ]

  const toggleFAQ = (id) => {
    setOpenFAQ(openFAQ === id ? null : id)
  }
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center shadow-lg">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="text-xl font-bold text-gray-900">PartnerLogic</div>
                  <div className="text-xs text-gray-500">by AmpleLogic</div>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex space-x-8">
              <a href="#features" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">Features</a>
              <a href="#solutions" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">Solutions</a>
              <a href="#partners" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">Partners</a>
              <a href="#resources" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">Resources</a>
            </nav>

            {/* CTA Buttons */}
            <div className="flex items-center space-x-4">
              <Link href="/auth/login" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">
                Sign In
              </Link>
              <Link 
                href="/auth/login" 
                className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition-all transform hover:scale-105 shadow-md flex items-center space-x-2 font-medium"
              >
                <span>Get Started</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-24 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-blue-50/30 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Hero Content */}
            <div className="space-y-10">
              <div className="space-y-6">
                <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 text-blue-700 text-sm font-medium">
                  <Zap className="h-4 w-4 mr-2" />
                  Trusted by 500+ Partners Worldwide
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-gray-900 leading-tight">
                  Streamline Your
                  <span className="text-blue-600 block">Partner Success</span>
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed max-w-xl">
                  The unified Partner Relationship Management platform that empowers your resellers, referral partners, and full-cycle partners to drive revenue growth together.
                </p>
              </div>

              {/* Key Benefits */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex items-center space-x-3 p-4 bg-white rounded-xl shadow-sm border">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Zap className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Streamlined</div>
                    <div className="text-sm text-gray-600">Workflows</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-4 bg-white rounded-xl shadow-sm border">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Tiered</div>
                    <div className="text-sm text-gray-600">Programs</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-4 bg-white rounded-xl shadow-sm border">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Shield className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Enterprise</div>
                    <div className="text-sm text-gray-600">Security</div>
                  </div>
                </div>
              </div>

              {/* CTA */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Link 
                  href="/auth/login"
                  className="bg-blue-600 text-white px-8 py-4 rounded-xl hover:bg-blue-700 transition-all transform hover:scale-105 shadow-lg flex items-center justify-center space-x-2 text-lg font-semibold"
                >
                  <span>Start Your Partnership</span>
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <button className="group border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-xl hover:border-blue-600 hover:text-blue-600 transition-all text-lg font-semibold flex items-center justify-center space-x-2">
                  <Play className="h-5 w-5 group-hover:scale-110 transition-transform" />
                  <span>Watch Demo</span>
                </button>
              </div>

              {/* Social Proof */}
              <div className="pt-8 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
                  <div className="text-sm text-gray-500">Trusted by leading companies:</div>
                  <div className="flex flex-wrap items-center gap-x-8 gap-y-2 opacity-70">
                    <div className="text-gray-400 font-bold text-lg">TechCorp</div>
                    <div className="text-gray-400 font-bold text-lg">CloudSync</div>
                    <div className="text-gray-400 font-bold text-lg">DataPro</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Hero Image/Dashboard Preview */}
            <div className="relative">
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-3xl p-4 sm:p-8 shadow-2xl">
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                  {/* Mock Dashboard Header */}
                  <div className="bg-gray-50 px-4 sm:px-6 py-4 border-b flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex space-x-1">
                        <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                        <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                        <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                      </div>
                      <div className="text-sm font-medium text-gray-700">PartnerLogic Dashboard</div>
                    </div>
                    <div className="text-xs text-gray-500">Live Demo</div>
                  </div>
                  
                  <div className="p-4 sm:p-8 space-y-6">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-3 gap-2 sm:gap-4">
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 sm:p-4 rounded-xl border border-blue-200">
                        <div className="text-xl sm:text-2xl font-bold text-blue-700">24</div>
                        <div className="text-xs font-medium text-blue-600">Active Deals</div>
                      </div>
                      <div className="bg-gradient-to-br from-green-50 to-green-100 p-3 sm:p-4 rounded-xl border border-green-200">
                        <div className="text-xl sm:text-2xl font-bold text-green-700">$450K</div>
                        <div className="text-xs font-medium text-green-600">Pipeline Value</div>
                      </div>
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-3 sm:p-4 rounded-xl border border-purple-200">
                        <div className="text-xl sm:text-2xl font-bold text-purple-700">Gold</div>
                        <div className="text-xs font-medium text-purple-600">Partner Tier</div>
                      </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="space-y-3">
                      <div className="text-sm font-semibold text-gray-700 mb-3">Recent Activity</div>
                      <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-xl">
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-sm text-gray-700">Acme Corp - CRM Implementation</div>
                            <div className="text-xs text-gray-500">$45,000 • Moved to Proposal</div>
                          </div>
                        </div>
                        <div className="text-xs text-gray-400 whitespace-nowrap ml-2">2h ago</div>
                      </div>
                      <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-xl">
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-sm text-gray-700">TechStart - Analytics Platform</div>
                            <div className="text-xs text-gray-500">$28,000 • Support Ticket Resolved</div>
                          </div>
                        </div>
                        <div className="text-xs text-gray-400 whitespace-nowrap ml-2">4h ago</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Elements */}
              <div className="absolute -top-4 -right-4 bg-green-500 text-white p-3 rounded-full shadow-lg">
                <CheckCircle className="h-6 w-6" />
              </div>
              <div className="absolute -bottom-4 -left-4 bg-yellow-500 text-white p-3 rounded-full shadow-lg">
                <Star className="h-6 w-6" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 text-blue-700 text-sm font-medium mb-6">
              <Target className="h-4 w-4 mr-2" />
              Complete Solution
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Everything You Need to Succeed
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              From deal registration to support routing, PartnerLogic provides all the tools your partners need to drive revenue growth with confidence.
            </p>
          </div>

          {/* Feature Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
  {/* Deal Management */}
  <div className="group bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-blue-200">
    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
      <BarChart3 className="h-7 w-7 text-white" />
    </div>
    <h3 className="font-bold mb-3 text-gray-900">Agreement Signing</h3>
    <p className="text-sm text-gray-600 leading-relaxed">
      Sign partnership agreements and choose your ideal partner type based on your business model
    </p>
  </div>

  {/* Step 2 */}
  <div className="group bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-green-200">
    <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
      <CheckCircle className="h-7 w-7 text-white" />
    </div>
    <h3 className="font-bold mb-3 text-gray-900">Platform Access</h3>
    <p className="text-sm text-gray-600 leading-relaxed">
      Receive secure credentials and instant access to the complete PartnerLogic platform
    </p>
  </div>

  {/* Step 3 */}
  <div className="group bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-yellow-200">
    <div className="w-14 h-14 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
      <FileText className="h-7 w-7 text-white" />
    </div>
    <h3 className="font-bold mb-3 text-gray-900">Training & Resources</h3>
    <p className="text-sm text-gray-600 leading-relaxed">
      Access comprehensive knowledge base, interactive training, and premium sales tools
    </p>
  </div>

  {/* Step 4 */}
  <div className="group bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-purple-200">
    <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
      <Headphones className="h-7 w-7 text-white" />
    </div>
    <h3 className="font-bold mb-3 text-gray-900">Dedicated Support</h3>
    <p className="text-sm text-gray-600 leading-relaxed">
      Get paired with a dedicated partner manager and technical support team
    </p>
  </div>

  {/* Step 5 */}
  <div className="group bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-cyan-200">
    <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
      <TrendingUp className="h-7 w-7 text-white" />
    </div>
    <h3 className="font-bold mb-3 text-gray-900">Start Selling</h3>
    <p className="text-sm text-gray-600 leading-relaxed">
      Begin registering deals, accessing MDF funds, and earning revenue with full support
    </p>
  </div>

  {/* Step 6 - Optional: Add a sixth card to make the grid more balanced */}
  <div className="group bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-indigo-200">
    <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
      <Award className="h-7 w-7 text-white" />
    </div>
    <h3 className="font-bold mb-3 text-gray-900">Grow & Scale</h3>
    <p className="text-sm text-gray-600 leading-relaxed">
      Advance through partner tiers and unlock premium benefits as your business grows
    </p>
  </div>
          </div>

          {/* Timeline Stats */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="p-6 bg-blue-50 rounded-2xl border border-blue-200">
              <div className="text-3xl font-bold text-blue-600 mb-2">24hrs</div>
              <div className="text-gray-700 font-medium">Platform Access</div>
            </div>
            <div className="p-6 bg-green-50 rounded-2xl border border-green-200">
              <div className="text-3xl font-bold text-green-600 mb-2">48hrs</div>
              <div className="text-gray-700 font-medium">Manager Assignment</div>
            </div>
            <div className="p-6 bg-purple-50 rounded-2xl border border-purple-200">
              <div className="text-3xl font-bold text-purple-600 mb-2">1 Week</div>
              <div className="text-gray-700 font-medium">First Deal Registration</div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-yellow-100 text-yellow-700 text-sm font-medium mb-6">
              <Star className="h-4 w-4 mr-2" />
              Success Stories
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              What Our Partners Say
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Real stories from partners who are transforming their business and driving exceptional growth with PartnerLogic.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Testimonial 1 */}
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="flex items-center mb-6">
                <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                  JS
                </div>
                <div className="ml-4">
                  <div className="font-bold text-gray-900">John Smith</div>
                  <div className="text-sm text-gray-500">CEO, TechSolutions Inc.</div>
                  <div className="flex text-yellow-400 mt-1">
                    <Star className="h-4 w-4 fill-current" />
                    <Star className="h-4 w-4 fill-current" />
                    <Star className="h-4 w-4 fill-current" />
                    <Star className="h-4 w-4 fill-current" />
                    <Star className="h-4 w-4 fill-current" />
                  </div>
                </div>
              </div>
              <p className="text-gray-700 mb-4 leading-relaxed italic">
                "PartnerLogic completely transformed how we manage our partnership with AmpleLogic. The deal registration process is incredibly intuitive, and having dedicated support makes all the difference in closing deals faster."
              </p>
              <div className="text-sm text-gray-500">
                Increased deal closure rate by 45%
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="flex items-center mb-6">
                <div className="w-14 h-14 bg-gradient-to-r from-green-500 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                  MJ
                </div>
                <div className="ml-4">
                  <div className="font-bold text-gray-900">Maria Johnson</div>
                  <div className="text-sm text-gray-500">Partner Manager, CloudVentures</div>
                  <div className="flex text-yellow-400 mt-1">
                    <Star className="h-4 w-4 fill-current" />
                    <Star className="h-4 w-4 fill-current" />
                    <Star className="h-4 w-4 fill-current" />
                    <Star className="h-4 w-4 fill-current" />
                    <Star className="h-4 w-4 fill-current" />
                  </div>
                </div>
              </div>
              <p className="text-gray-700 mb-4 leading-relaxed italic">
                "The MDF management feature is a game-changer. We can track ROI on every campaign with precision, and the approval process went from weeks to hours. It's incredibly efficient."
              </p>
              <div className="text-sm text-gray-500">
                Reduced MDF approval time by 90%
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="flex items-center mb-6">
                <div className="w-14 h-14 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                  DL
                </div>
                <div className="ml-4">
                  <div className="font-bold text-gray-900">David Lee</div>
                  <div className="text-sm text-gray-500">Sales Director, DataSync Pro</div>
                  <div className="flex text-yellow-400 mt-1">
                    <Star className="h-4 w-4 fill-current" />
                    <Star className="h-4 w-4 fill-current" />
                    <Star className="h-4 w-4 fill-current" />
                    <Star className="h-4 w-4 fill-current" />
                    <Star className="h-4 w-4 fill-current" />
                  </div>
                </div>
              </div>
              <p className="text-gray-700 mb-4 leading-relaxed italic">
                "Since implementing PartnerLogic, our pipeline visibility improved dramatically and our deal closure rate increased by 40%. The collaborative tools keep everyone perfectly aligned."
              </p>
              <div className="text-sm text-gray-500">
                $2.3M additional revenue in 6 months
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-500 text-white relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-transparent"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Trusted by Industry Leaders</h2>
            <p className="text-xl text-blue-100">Join a thriving ecosystem of successful partners</p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div className="p-6">
              <div className="text-5xl font-bold mb-3">500+</div>
              <div className="text-blue-100 text-lg font-medium">Active Partners</div>
              <div className="text-sm text-blue-200 mt-2">Across 40+ countries</div>
            </div>
            <div className="p-6">
              <div className="text-5xl font-bold mb-3">$50M+</div>
              <div className="text-blue-100 text-lg font-medium">Pipeline Value</div>
              <div className="text-sm text-blue-200 mt-2">Managed annually</div>
            </div>
            <div className="p-6">
              <div className="text-5xl font-bold mb-3">95%</div>
              <div className="text-blue-100 text-lg font-medium">Partner Satisfaction</div>
              <div className="text-sm text-blue-200 mt-2">NPS Score of 85+</div>
            </div>
            <div className="p-6">
              <div className="text-5xl font-bold mb-3">24/7</div>
              <div className="text-blue-100 text-lg font-medium">Support Available</div>
              <div className="text-sm text-blue-200 mt-2">Global coverage</div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="resources" className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-gray-100 text-gray-700 text-sm font-medium mb-6">
              <Globe className="h-4 w-4 mr-2" />
              Knowledge Base
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-600 leading-relaxed">
              Everything you need to know about partnering with AmpleLogic and maximizing your success.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq) => (
              <div
                key={faq.id}
                className="border border-gray-200 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow duration-300"
              >
                <button
                  onClick={() => toggleFAQ(faq.id)}
                  className="w-full px-6 py-5 text-left flex items-center justify-between hover:bg-gray-50 rounded-xl transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                  aria-expanded={openFAQ === faq.id}
                  aria-controls={`faq-answer-${faq.id}`}
                >
                  <h3 className="text-lg font-semibold text-gray-900 pr-8">
                    {faq.question}
                  </h3>
                  <div className="flex-shrink-0">
                    <ChevronDown
                      className={`h-5 w-5 text-gray-500 transition-transform duration-300 ${
                        openFAQ === faq.id ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                </button>
                
                <div
                  id={`faq-answer-${faq.id}`}
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    openFAQ === faq.id ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="px-6 pb-5 pt-0">
                    <div className="border-t border-gray-100 pt-4">
                      <p className="text-gray-700 leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Additional Help Section */}
          <div className="mt-16 text-center">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 border border-blue-100">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Still have questions?
              </h3>
              <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                Our partner success team is here to help you every step of the way. Get personalized answers to your specific questions.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors duration-200">
                  Contact Partner Success
                </button>
                <button className="inline-flex items-center px-6 py-3 border-2 border-blue-600 text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-colors duration-200">
                  Schedule a Call
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gray-900 text-white relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/20 to-purple-900/20"></div>
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <div className="mb-12">
            <h2 className="text-4xl lg:text-5xl font-bold mb-6 leading-tight">
              Ready to Transform Your Partner Program?
            </h2>
            <p className="text-xl text-gray-300 leading-relaxed max-w-2xl mx-auto">
              Join hundreds of successful partners who are accelerating revenue growth and building stronger customer relationships with PartnerLogic.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link 
              href="/auth/login"
              className="bg-blue-600 text-white px-10 py-4 rounded-xl hover:bg-blue-700 transition-all transform hover:scale-105 shadow-xl flex items-center justify-center space-x-3 text-lg font-semibold"
            >
              <span>Get Started Today</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
            <button className="border-2 border-white text-white px-10 py-4 rounded-xl hover:bg-white hover:text-gray-900 transition-all text-lg font-semibold flex items-center justify-center space-x-3 group">
              <Play className="h-5 w-5 group-hover:scale-110 transition-transform" />
              <span>Schedule Demo</span>
            </button>
          </div>

          <div className="text-center">
            <p className="text-gray-400 mb-4">No setup fees • Free onboarding • 24/7 support</p>
            <div className="flex items-center justify-center space-x-6 text-sm text-gray-500">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <span>SOC2 Compliant</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <span>GDPR Ready</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <span>99.9% Uptime</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid md:grid-cols-5 gap-8">
            {/* Logo and Description */}
            <div className="col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center shadow-lg">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="text-xl font-bold text-gray-900">PartnerLogic</div>
                  <div className="text-xs text-gray-500">by AmpleLogic</div>
                </div>
              </div>
              <p className="text-gray-600 mb-6 leading-relaxed">
                The unified Partner Relationship Management platform that empowers your partners to drive revenue growth with confidence and efficiency.
              </p>
              <div className="text-sm text-gray-500">
                © 2025 AmpleLogic. All rights reserved.
              </div>
            </div>

            {/* Product Links */}
            <div>
              <h3 className="font-bold text-gray-900 mb-6">Product</h3>
              <ul className="space-y-3 text-gray-600">
                <li><a href="#features" className="hover:text-blue-600 transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors">Integrations</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors">API Documentation</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors">Security</a></li>
              </ul>
            </div>

            {/* Solutions Links */}
            <div>
              <h3 className="font-bold text-gray-900 mb-6">Solutions</h3>
              <ul className="space-y-3 text-gray-600">
                <li><a href="#partners" className="hover:text-blue-600 transition-colors">Partner Types</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors">Deal Management</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors">MDF Programs</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors">Analytics</a></li>
              </ul>
            </div>

            {/* Support Links */}
            <div>
              <h3 className="font-bold text-gray-900 mb-6">Support</h3>
              <ul className="space-y-3 text-gray-600">
                <li><a href="#" className="hover:text-blue-600 transition-colors">Help Center</a></li>
                <li><a href="#resources" className="hover:text-blue-600 transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors">Contact Support</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors">System Status</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom Footer */}
          <div className="mt-12 pt-8 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-6 text-sm text-gray-500">
              <a href="#" className="hover:text-blue-600 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-blue-600 transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-blue-600 transition-colors">Cookie Policy</a>
            </div>
            <div className="flex items-center space-x-4 mt-4 md:mt-0">
              <div className="text-sm text-gray-500">Follow us:</div>
              <div className="flex space-x-3">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-blue-100 transition-colors cursor-pointer">
                  <Globe className="h-4 w-4 text-gray-600" />
                </div>
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-blue-100 transition-colors cursor-pointer">
                  <Users className="h-4 w-4 text-gray-600" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}