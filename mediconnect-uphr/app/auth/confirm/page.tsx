'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function ConfirmPage() {
  const router = useRouter()
  const [message, setMessage] = useState('Signing you in...')

  useEffect(() => {
    const handleAuth = async () => {
      try {
        // Wait for Supabase to detect session from URL
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error || !session) {
          // Try waiting a moment for session to establish
          setTimeout(async () => {
            const { data: { session: retrySession } } = await supabase.auth.getSession()
            
            if (!retrySession) {
              setMessage('Something went wrong. Redirecting...')
              setTimeout(() => router.push('/login'), 2000)
              return
            }

            await redirectBasedOnProfile(retrySession.user.id)
          }, 2000)
          return
        }

        await redirectBasedOnProfile(session.user.id)

      } catch (err) {
        router.push('/login')
      }
    }

    const redirectBasedOnProfile = async (userId: string) => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single()

      if (!profile) {
        router.push('/register/role')
        return
      }

      if (profile.role === 'patient') {
        router.push('/patient/dashboard')
      } else {
        router.push('/clinician/dashboard')
      }
    }

    handleAuth()
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-600 font-medium">{message}</p>
        <p className="text-gray-400 text-sm mt-2">Please wait</p>
      </div>
    </div>
  )
}
