'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const router = useRouter()

  const handleGoogleLogin = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `https://udpr.vercel.app/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      }
    }
  })
  if (error) setError(error.message)
}

  const handleEmailAuth = async () => {
  if (!email || !password) {
    setError('Please fill in all fields')
    return
  }

  if (password.length < 8) {
    setError('Password must be at least 8 characters')
    return
  }

  if (!/\d/.test(password)) {
    setError('Password must contain at least one number')
    return
  }

  setLoading(true)
  setError('')

  if (isSignUp) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    if (data.user) {
      router.push('/register/role')
    }

  } else {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    if (data.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()

      if (!profile) {
        router.push('/register/role')
      } else if (profile.role === 'patient') {
        router.push('/patient/dashboard')
      } else {
        router.push('/clinician/dashboard')
      }
    }
  }

  setLoading(false)
}

  {/* Password requirements */}
{isSignUp && password.length > 0 && (
  <div className="space-y-1">
    <p className={`text-xs flex items-center gap-2 ${password.length >= 8 ? 'text-green-500' : 'text-red-400'}`}>
      {password.length >= 8 ? '✓' : '✗'} At least 8 characters
    </p>
    <p className={`text-xs flex items-center gap-2 ${/\d/.test(password) ? 'text-green-500' : 'text-red-400'}`}>
      {/\d/.test(password) ? '✓' : '✗'} Contains at least one number
    </p>
  </div>
)}
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-600">UPHR</h1>
          <p className="text-gray-500 mt-2">Unified Patient Health Record</p>
          <p className="text-sm text-gray-400 mt-1">
            Your health record, anywhere in the world
          </p>
        </div>

        {/* Email/Password */}
        <div className="space-y-3 mb-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-600"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            onKeyDown={(e) => e.key === 'Enter' && handleEmailAuth()}
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-600"
          />
          {error && (
            <p className={`text-sm ${error.includes('Check your email') ? 'text-green-500' : 'text-red-500'}`}>
              {error}
            </p>
          )}
          <button
            onClick={handleEmailAuth}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? 'Please wait...' : isSignUp ? 'Create Account' : 'Sign In'}
          </button>
        </div>

        <p className="text-center text-sm text-gray-500 mb-4">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-blue-600 font-medium"
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </p>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 border-t border-gray-200" />
          <span className="text-xs text-gray-400">or</span>
          <div className="flex-1 border-t border-gray-200" />
        </div>

        {/* Google */}
        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-200 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-50 transition"
        >
          <img
            src="https://www.google.com/favicon.ico"
            alt="Google"
            className="w-5 h-5"
          />
          Continue with Google
        </button>

        <p className="text-center text-xs text-gray-400 mt-6">
          By continuing you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  )
}
