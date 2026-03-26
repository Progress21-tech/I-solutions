'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface Clinician {
  full_name: string
  hospital_name: string
  specialty: string
  license_number: string
}

export default function ClinicianDashboard() {
  const [clinician, setClinician] = useState<Clinician | null>(null)
  const [searchId, setSearchId] = useState('')
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    fetchClinicianData()
  }, [])

  const fetchClinicianData = async () => {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    const { data: clinicianData } = await supabase
      .from('clinicians')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (clinicianData) {
      setClinician(clinicianData)
    }

    setLoading(false)
  }

  const handleSearch = async () => {
    if (!searchId.trim()) return
    setSearching(true)
    setError('')

    const { data: patient } = await supabase
      .from('patients')
      .select('*')
      .eq('health_id', searchId.trim().toUpperCase())
      .single()

    if (!patient) {
      setError('No patient found with that Health ID. Please check and try again.')
      setSearching(false)
      return
    }

    router.push(`/clinician/access?patient_id=${patient.health_id}`)
    setSearching(false)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading your dashboard...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-blue-600">UPHR</h1>
        <button
          onClick={handleSignOut}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Sign Out
        </button>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        {/* Welcome */}
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            Welcome, Dr. {clinician?.full_name} 👋
          </h2>
          <p className="text-gray-500 mt-1">
            Search for a patient to access their records
          </p>
        </div>

        {/* Clinician Info */}
        <div className="bg-white rounded-2xl p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Your Profile</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-400">Hospital</p>
              <p className="font-medium text-gray-800">
                {clinician?.hospital_name || 'Not set'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Specialty</p>
              <p className="font-medium text-gray-800">
                {clinician?.specialty || 'Not set'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400">License Number</p>
              <p className="font-medium text-gray-800">
                {clinician?.license_number || 'Not set'}
              </p>
            </div>
          </div>
        </div>

        {/* Search Patient */}
        <div className="bg-white rounded-2xl p-6">
          <h3 className="font-semibold text-gray-800 mb-4">
            Search Patient by Health ID
          </h3>
          <div className="flex gap-3">
            <input
              type="text"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="e.g. UPH-A1B2C3D4"
              className="flex-1 border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-600"
            />
            <button
              onClick={handleSearch}
              disabled={searching}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition disabled:opacity-50"
            >
              {searching ? 'Searching...' : 'Search'}
            </button>
          </div>
          {error && (
            <p className="text-red-500 text-sm mt-3">{error}</p>
          )}
          <p className="text-xs text-gray-400 mt-3">
            Ask the patient to show you their Health ID or scan their QR code
          </p>
        </div>

        {/* Pricing Banner */}
        <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
          <h3 className="font-semibold text-green-800 mb-1">
            Upgrade Your Plan
          </h3>
          <p className="text-green-700 text-sm mb-4">
            Access unlimited patient records and AI-powered insights
          </p>
          <button
            onClick={() => router.push('/clinician/pricing')}
            className="bg-green-600 text-white px-6 py-2 rounded-xl text-sm font-medium hover:bg-green-700 transition"
          >
            View Plans
          </button>
        </div>
      </div>
    </div>
  )
}