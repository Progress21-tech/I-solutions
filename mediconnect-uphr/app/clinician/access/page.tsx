'use client'
import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface Patient {
  id: string
  full_name: string
  health_id: string
  blood_group: string
  genotype: string
  date_of_birth: string
}

interface Record {
  id: string
  record_type: string
  content: any
  created_at: string
}

function ClinicianAccessPage() {
  const [patient, setPatient] = useState<Patient | null>(null)
  const [records, setRecords] = useState<Record[]>([])
  const [clinician, setClinician] = useState<any>(null)
  const [hasAccess, setHasAccess] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()
  const patientHealthId = searchParams.get('patient_id')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    // Get clinician
    const { data: clinicianData } = await supabase
      .from('clinicians')
      .select('*')
      .eq('user_id', user.id)
      .single()

    setClinician(clinicianData)

    // Get patient by health ID
    const { data: patientData } = await supabase
      .from('patients')
      .select('*')
      .eq('health_id', patientHealthId)
      .single()

    if (!patientData) {
      router.push('/clinician/dashboard')
      return
    }

    setPatient(patientData)

    // Check if clinician has active access grant
    const { data: grant } = await supabase
      .from('access_grants')
      .select('*')
      .eq('clinician_id', clinicianData.id)
      .eq('patient_id', patientData.id)
      .eq('payment_confirmed', true)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (grant) {
      setHasAccess(true)

      // Log the access
      await supabase.from('access_logs').insert({
        clinician_id: clinicianData.id,
        patient_id: patientData.id,
        action: 'viewed_records'
      })

      // Fetch records
      const { data: recordsData } = await supabase
        .from('records')
        .select('*')
        .eq('patient_id', patientData.id)
        .order('created_at', { ascending: false })

      setRecords(recordsData || [])
    }

    setLoading(false)
  }

  const handlePayForAccess = async () => {
    router.push(`/clinician/pricing`)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading patient records...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="text-gray-500 hover:text-gray-700"
          >
            ←
          </button>
          <h1 className="text-xl font-bold text-blue-600">UPHR</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        {/* Patient Basic Info - Always Visible */}
        <div className="bg-white rounded-2xl p-6">
          <h2 className="font-semibold text-gray-800 mb-4">Patient Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-400">Full Name</p>
              <p className="font-medium text-gray-800">{patient?.full_name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Health ID</p>
              <p className="font-medium text-gray-800">{patient?.health_id}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Blood Group</p>
              <p className="font-medium text-gray-800">
                {patient?.blood_group || 'Not set'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Genotype</p>
              <p className="font-medium text-gray-800">
                {patient?.genotype || 'Not set'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Date of Birth</p>
              <p className="font-medium text-gray-800">
                {patient?.date_of_birth || 'Not set'}
              </p>
            </div>
          </div>
        </div>

        {/* Records Section */}
        {hasAccess ? (
          <div className="bg-white rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">Medical Records</h3>
              <button
                onClick={() => router.push(
                  `/clinician/upload?patient_id=${patient?.health_id}`
                )}
                className="text-sm bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition"
              >
                + Add Record
              </button>
            </div>
            {records.length === 0 ? (
              <p className="text-gray-400 text-sm">
                No records yet for this patient.
              </p>
            ) : (
              <div className="space-y-3">
                {records.map((record) => (
                  <div
                    key={record.id}
                    className="border border-gray-100 rounded-xl p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-blue-600 capitalize bg-blue-50 px-3 py-1 rounded-full">
                        {record.record_type}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(record.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      {record.content?.summary || 'No summary available'}
                    </p>
                    {record.content?.details && (
                      <p className="text-xs text-gray-400 mt-1">
                        {record.content.details}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* No Access — Payment Gate */
          <div className="bg-white rounded-2xl p-8 text-center">
            <div className="text-5xl mb-4">🔒</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              Records are locked
            </h3>
            <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
              Subscribe to a plan to access this patient's full medical 
              history and records
            </p>
            <button
              onClick={handlePayForAccess}
              className="bg-blue-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-blue-700 transition"
            >
              View Plans & Subscribe
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p className="text-gray-500">Loading...</p></div>}>
      <ClinicianAccessPage />
    </Suspense>
  )
}
