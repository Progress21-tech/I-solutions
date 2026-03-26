'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function RoleSelectionPage() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const selectRole = async (role: 'patient' | 'clinician') => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()

    // Save role to profiles table
    await supabase.from('profiles').insert({
      id: user?.id,
      role
    })

    // Create role-specific record
    if (role === 'patient') {
      await supabase.from('patients').insert({
        user_id: user?.id,
        full_name: user?.user_metadata?.full_name || 'Patient'
      })
      router.push('/patient/dashboard')
    } else {
      await supabase.from('clinicians').insert({
        user_id: user?.id,
        full_name: user?.user_metadata?.full_name || 'Clinician'
      })
      router.push('/clinician/dashboard')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-600">UPHR</h1>
          <p className="text-gray-500 mt-2">Who are you?</p>
          <p className="text-sm text-gray-400 mt-1">
            Select your role to continue
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => selectRole('patient')}
            disabled={loading}
            className="flex flex-col items-center gap-3 border-2 border-blue-600 text-blue-600 py-8 rounded-xl font-medium hover:bg-blue-50 transition disabled:opacity-50"
          >
            <span className="text-4xl">🧑‍⚕️</span>
            <span>I am a Patient</span>
          </button>
          <button
            onClick={() => selectRole('clinician')}
            disabled={loading}
            className="flex flex-col items-center gap-3 border-2 border-green-600 text-green-600 py-8 rounded-xl font-medium hover:bg-green-50 transition disabled:opacity-50"
          >
            <span className="text-4xl">👨‍⚕️</span>
            <span>I am a Clinician</span>
          </button>
        </div>
        {loading && (
          <p className="text-center text-gray-400 text-sm mt-6">
            Setting up your account...
          </p>
        )}
      </div>
    </div>
  )
}