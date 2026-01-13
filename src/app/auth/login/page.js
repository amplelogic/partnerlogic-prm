'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Mail, Lock, AlertTriangle, Eye, EyeOff, Shield } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mathAnswer, setMathAnswer] = useState('')
  const [mathChallenge, setMathChallenge] = useState({ num1: 0, num2: 0, answer: 0 })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  // Generate a new math challenge when component mounts
  useEffect(() => {
    generateMathChallenge()
  }, [])

  const generateMathChallenge = () => {
    const num1 = Math.floor(Math.random() * 10) + 1 // 1-10
    const num2 = Math.floor(Math.random() * 10) + 1 // 1-10
    setMathChallenge({ num1, num2, answer: num1 + num2 })
    setMathAnswer('') // Clear previous answer
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Validate math challenge first
      const userAnswer = parseInt(mathAnswer)
      if (isNaN(userAnswer) || userAnswer !== mathChallenge.answer) {
        generateMathChallenge() // Generate new challenge
        throw new Error('Incorrect answer to the security question. Please try again.')
      }

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) throw signInError

      if (!data.user) {
        throw new Error('No user data returned')
      }

      // Check user role and redirect accordingly
      // Priority: Admin > Support User > Partner Manager > Partner

      // 1. Check if admin
      const { data: adminData } = await supabase
        .from('admins')
        .select('id')
        .eq('auth_user_id', data.user.id)
        .maybeSingle()

      if (adminData) {
        router.push('/admin')
        router.refresh()
        return
      }

      // 2. Check if support user
      const { data: supportUserData } = await supabase
        .from('support_users')
        .select('id, active')
        .eq('auth_user_id', data.user.id)
        .maybeSingle()

      if (supportUserData) {
        if (!supportUserData.active) {
          await supabase.auth.signOut()
          throw new Error('Your support account has been deactivated. Please contact an administrator.')
        }
        router.push('/support')
        router.refresh()
        return
      }

      // 3. Check if account user
      const { data: accountUserData } = await supabase
        .from('account_users')
        .select('id, active')
        .eq('auth_user_id', data.user.id)
        .maybeSingle()

      if (accountUserData) {
        if (!accountUserData.active) {
          await supabase.auth.signOut()
          throw new Error('Your account has been deactivated. Please contact an administrator.')
        }
        router.push('/accounts')
        router.refresh()
        return
      }

      // 4. Check if partner manager
      const { data: partnerManagerData } = await supabase
        .from('partner_managers')
        .select('id')
        .eq('auth_user_id', data.user.id)
        .maybeSingle()

      if (partnerManagerData) {
        router.push('/partner-manager')
        router.refresh()
        return
      }

      // 5. Check if partner
      const { data: partnerData } = await supabase
        .from('partners')
        .select('id')
        .eq('auth_user_id', data.user.id)
        .maybeSingle()

      if (partnerData) {
        router.push('/dashboard')
        router.refresh()
        return
      }

      // If no role found, sign out and show error
      await supabase.auth.signOut()
      throw new Error('No valid role found for this user. Please contact support.')

    } catch (err) {
      console.error('Login error:', err)
      setError(err.message || 'Invalid login credentials')
      // Generate new math challenge on error
      generateMathChallenge()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
              <span className="text-2xl font-bold text-white">PL</span>
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to PartnerLogic
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Access your partner portal
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Math Challenge for MFA */}
            <div>
              <label htmlFor="mathAnswer" className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4 text-blue-600" />
                  <span>Security Check</span>
                </div>
              </label>
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 border border-blue-200 rounded-lg px-4 py-3">
                  <p className="text-base font-semibold text-gray-900 whitespace-nowrap">
                    What is {mathChallenge.num1} + {mathChallenge.num2}?
                  </p>
                </div>
                <input
                  id="mathAnswer"
                  name="mathAnswer"
                  type="number"
                  required
                  value={mathAnswer}
                  onChange={(e) => setMathAnswer(e.target.value)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your answer"
                />
                <button
                  type="button"
                  onClick={generateMathChallenge}
                  className="flex-shrink-0 w-10 h-10 flex items-center justify-center text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors text-xl"
                  title="Generate new question"
                >
                  ↻
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <Link href="/auth/forgot-password" className="font-medium text-blue-600 hover:text-blue-500">
                Forgot password?
              </Link>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Signing in...</span>
              </div>
            ) : (
              'Sign in'
            )}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <Link href="/auth/register" className="font-medium text-blue-600 hover:text-blue-500">
            Contact your administrator
          </Link>
        </p>
      </div>
    </div>
  )
}