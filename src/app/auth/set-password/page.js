// src/app/auth/set-password/page.js
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, Lock, Eye, EyeOff, AlertCircle, CheckCircle, Users, Mail} from 'lucide-react'

export default function SetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [validating, setValidating] = useState(true)
  const [user, setUser] = useState(null)
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false)
  
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkAuthAndSetSession = async () => {
      console.log('=== Set Password Page ===')
      console.log('Full URL:', window.location.href)
      
      try {
        // First, check if there's a hash with tokens
        const hash = window.location.hash
        if (hash) {
          console.log('Found hash:', hash)
          const hashParams = new URLSearchParams(hash.substring(1))
          const accessToken = hashParams.get('access_token')
          const refreshToken = hashParams.get('refresh_token')
          const type = hashParams.get('type')

          console.log('Hash params:', { 
            hasAccessToken: !!accessToken, 
            hasRefreshToken: !!refreshToken, 
            type 
          })

          if (accessToken && refreshToken) {
            console.log('Setting session from hash tokens...')
            
            const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            })

            if (sessionError) {
              console.error('Session error:', sessionError)
              setError('Failed to authenticate. Please try the activation link again.')
              setValidating(false)
              return
            }

            console.log('Session set successfully')

            // Get user after setting session
            const { data: { user: authenticatedUser }, error: userError } = await supabase.auth.getUser()
            
            if (userError || !authenticatedUser) {
              console.error('User error:', userError)
              setError('Failed to verify user. Please try again.')
              setValidating(false)
              return
            }

            console.log('User authenticated:', authenticatedUser.email)
            setUser(authenticatedUser)
            setValidating(false)
            return
          }
        }

        // If no hash, check if already authenticated
        console.log('No hash found, checking existing session...')
        const { data: { user: existingUser }, error: userError } = await supabase.auth.getUser()
        
        if (userError) {
          console.error('Error getting user:', userError)
          setError('Failed to verify authentication. Please try the activation link again.')
          setValidating(false)
          return
        }

        if (!existingUser) {
          console.error('No user found')
          setError('Invalid or expired activation link. Please contact support.')
          setValidating(false)
          return
        }
        
        console.log('User authenticated from existing session:', existingUser.email)
        setUser(existingUser)
        setValidating(false)

      } catch (err) {
        console.error('Unexpected error in checkAuthAndSetSession:', err)
        setError('An unexpected error occurred. Please try again.')
        setValidating(false)
      }
    }
    
    checkAuthAndSetSession()
  }, [supabase])

  const validatePassword = (pass) => {
    if (pass.length < 8) {
      return 'Password must be at least 8 characters long'
    }
    if (!/[A-Z]/.test(pass)) {
      return 'Password must contain at least one uppercase letter'
    }
    if (!/[a-z]/.test(pass)) {
      return 'Password must contain at least one lowercase letter'
    }
    if (!/[0-9]/.test(pass)) {
      return 'Password must contain at least one number'
    }
    return null
  }

  const handleSetPassword = async (e) => {
  e.preventDefault()
  setLoading(true)
  setError('')

  // Validate password
  const passwordError = validatePassword(password)
  if (passwordError) {
    setError(passwordError)
    setLoading(false)
    return
  }

  // Check if passwords match
  if (password !== confirmPassword) {
    setError('Passwords do not match')
    setLoading(false)
    return
  }

  try {
    console.log('Updating user password...')
    
    // Update user password
    const { data: updateData, error: updateError } = await supabase.auth.updateUser({
      password: password
    })

    if (updateError) {
      console.error('Password update error:', updateError)
      setError(updateError.message)
      setLoading(false)
      return
    }

    console.log('Password updated successfully')

    // Get fresh user data
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    
    if (!currentUser) {
      throw new Error('Could not verify user after password update')
    }

    console.log('Current user:', currentUser.email)
    console.log('User metadata:', currentUser.user_metadata)

    // Update partner status to active if this is a partner account
    if (currentUser.user_metadata?.account_type === 'partner') {
      console.log('Activating partner account...')
      console.log('User ID:', currentUser.id)
      
      try {
        // Call the database function to activate partner
        const { data: activateData, error: activateError } = await supabase
          .rpc('activate_partner_account', {
            user_id: currentUser.id
          })

        if (activateError) {
          console.error('Error activating partner:', activateError)
          console.error('Error details:', JSON.stringify(activateError, null, 2))
          // Don't fail the whole process - password is already set
          console.log('Continuing despite activation error - admin can manually activate')
        } else {
          console.log('Partner account activated successfully')
        }
      } catch (activateErr) {
        console.error('Unexpected error activating partner:', activateErr)
        // Don't fail - password is set, admin can manually activate
      }
    } else if (currentUser.user_metadata?.account_type === 'admin') {
      console.log('Admin account - no status update needed')
    }else if (currentUser.user_metadata?.account_type === 'partner_manager') {
  console.log('Activating partner manager account...')
  console.log('User ID:', currentUser.id)
  
  try {
    const { data: activateData, error: activateError } = await supabase
      .rpc('activate_partner_manager_account', {
        user_id: currentUser.id
      })

    if (activateError) {
      console.error('Error activating partner manager:', activateError)
      console.log('Continuing despite activation error - admin can manually activate')
    } else {
      console.log('Partner manager account activated successfully')
    }
  } catch (activateErr) {
    console.error('Unexpected error activating partner manager:', activateErr)
  }
}

setSuccess(true)

// Redirect based on account type after 2 seconds
setTimeout(() => {
  if (currentUser.user_metadata?.account_type === 'admin') {
    router.push('/admin')
  } else if (currentUser.user_metadata?.account_type === 'partner_manager') {
    router.push('/partner-manager')
  } else {
    router.push('/dashboard')
  }
  router.refresh()
}, 2000)

  } catch (err) {
    console.error('Unexpected error:', err)
    setError('An unexpected error occurred. Please try again.')
  } finally {
    setLoading(false)
  }
}
  if (validating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center py-12 px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Validating your activation link...</p>
        </div>
      </div>
    )
  }

  if (error && !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Activation Link Invalid</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <p className="text-sm text-gray-500 mb-6">
            Please contact your administrator to resend the invitation email.
          </p>
          <Link
            href="/auth/login"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Login
          </Link>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Account Activated!</h2>
          <p className="text-gray-600 mb-6">
            Your password has been set successfully. Redirecting you to the dashboard...
          </p>
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <Link href="/" className="inline-flex items-center space-x-3 mb-8 group">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
              <Users className="h-7 w-7 text-white" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">PartnerLogic</div>
              <div className="text-sm text-gray-500">by AmpleLogic</div>
            </div>
          </Link>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Set Your Password
          </h2>
          <p className="text-gray-600">
            Welcome {user?.user_metadata?.first_name}! Create a secure password to activate your account
          </p>
        </div>

        {/* Form */}
        {/* Form */}
<div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
  <form onSubmit={handleSetPassword} className="space-y-6">
    {error && (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center space-x-2">
        <AlertCircle className="h-4 w-4 flex-shrink-0" />
        <span>{error}</span>
      </div>
    )}

    {/* Email Field (Read-only) */}
    <div>
      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
        Email Address
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Mail className="h-5 w-5 text-gray-400" />
        </div>
        <input
          id="email"
          type="email"
          value={user?.email || ''}
          disabled
          readOnly
          className="appearance-none relative block w-full pl-10 pr-3 py-3 border border-gray-300 bg-gray-50 text-gray-700 rounded-lg cursor-not-allowed sm:text-sm"
        />
      </div>
      <p className="mt-1 text-xs text-gray-500">
        This email cannot be changed
      </p>
    </div>

    {/* Password Input */}
    <div>
      <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
        New Password
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Lock className="h-5 w-5 text-gray-400" />
        </div>
        <input
          id="password"
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="appearance-none relative block w-full pl-10 pr-10 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          placeholder="Enter your password"
        />
        <button
          type="button"
          className="absolute inset-y-0 right-0 pr-3 flex items-center"
          onClick={() => setShowPassword(!showPassword)}
        >
          {showPassword ? (
            <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
          ) : (
            <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
          )}
        </button>
      </div>
    </div>

    {/* Confirm Password Input */}
    <div>
      <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
        Confirm Password
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Lock className="h-5 w-5 text-gray-400" />
        </div>
        <input
          id="confirmPassword"
          type={showConfirmPassword ? "text" : "password"}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          className="appearance-none relative block w-full pl-10 pr-10 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          placeholder="Confirm your password"
        />
        <button
          type="button"
          className="absolute inset-y-0 right-0 pr-3 flex items-center"
          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
        >
          {showConfirmPassword ? (
            <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
          ) : (
            <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
          )}
        </button>
      </div>
    </div>

    {/* Password Requirements */}
    <div className="bg-blue-50 rounded-lg p-4">
      <p className="text-sm font-medium text-blue-900 mb-2">Password Requirements:</p>
      <ul className="text-sm text-blue-700 space-y-1">
        <li className="flex items-center">
          <CheckCircle className={`h-4 w-4 mr-2 ${password.length >= 8 ? 'text-green-600' : 'text-gray-400'}`} />
          At least 8 characters
        </li>
        <li className="flex items-center">
          <CheckCircle className={`h-4 w-4 mr-2 ${/[A-Z]/.test(password) ? 'text-green-600' : 'text-gray-400'}`} />
          One uppercase letter
        </li>
        <li className="flex items-center">
          <CheckCircle className={`h-4 w-4 mr-2 ${/[a-z]/.test(password) ? 'text-green-600' : 'text-gray-400'}`} />
          One lowercase letter
        </li>
        <li className="flex items-center">
          <CheckCircle className={`h-4 w-4 mr-2 ${/[0-9]/.test(password) ? 'text-green-600' : 'text-gray-400'}`} />
          One number
        </li>
      </ul>
    </div>

    {/* Terms & Privacy Acceptance */}
    <div className="space-y-3 pt-2">
      <div className="flex items-start">
        <div className="flex items-center h-5">
          <input
            id="terms"
            type="checkbox"
            checked={acceptedTerms}
            onChange={(e) => setAcceptedTerms(e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
          />
        </div>
        <div className="ml-3">
          <label htmlFor="terms" className="text-sm text-gray-700">
            I agree to the{' '}
            <Link 
              href="/terms" 
              target="_blank"
              className="text-blue-600 hover:text-blue-700 underline font-medium"
            >
              Terms & Conditions
            </Link>
          </label>
        </div>
      </div>

      <div className="flex items-start">
        <div className="flex items-center h-5">
          <input
            id="privacy"
            type="checkbox"
            checked={acceptedPrivacy}
            onChange={(e) => setAcceptedPrivacy(e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
          />
        </div>
        <div className="ml-3">
          <label htmlFor="privacy" className="text-sm text-gray-700">
            I agree to the{' '}
            <Link 
              href="/privacy" 
              target="_blank"
              className="text-blue-600 hover:text-blue-700 underline font-medium"
            >
              Privacy Policy
            </Link>
          </label>
        </div>
      </div>

      <p className="text-xs text-gray-500 mt-2">
        By creating an account, you agree to our data collection and processing practices as 
        described in our Privacy Policy, in compliance with GDPR and other applicable regulations.
      </p>
    </div>

    {/* Submit Button */}
    <button
      type="submit"
      disabled={loading || !acceptedTerms || !acceptedPrivacy}
      className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
    >
      {loading ? (
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          Setting password...
        </div>
      ) : (
        <div className="flex items-center">
          <span>Activate Account</span>
          <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </div>
      )}
    </button>
  </form>
</div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-sm text-gray-500">
            Need help? Contact{' '}
            <a href="mailto:support@amplelogic.com" className="font-medium text-blue-600 hover:text-blue-500">
              support@amplelogic.com
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}