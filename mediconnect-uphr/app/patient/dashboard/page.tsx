'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { QRCodeSVG } from 'qrcode.react'

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

interface Clinician {
  full_name: string
  hospital_name: string
}

interface AccessLog {
  id: string
  accessed_at: string
  action: string
  clinicians: Clinician | null
}

export default function PatientDashboard() {
  const [patient, setPatient] = useState<Patient | null>(null)
  const [records, setRecords] = useState<Record[]>([])
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([])
  const [loading, setLoading] = useState(true)

  const router = useRouter()

  useEffect(() => {
    fetchPatientData()
  }, [])

  const fetchPatientData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const { data: patientData } = await supabase
        .from('patients')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (!patientData) {
        setLoading(false)
        return
      }

      setPatient(patientData)

      // Fetch records
      const { data: recordsData } = await supabase
        .from('records')
        .select('*')
        .eq('patient_id', patientData.id)
        .order('created_at', { ascending: false })

      setRecords(recordsData || [])

      // Fetch access logs
      const { data: logsData } = await supabase
        .from('access_logs')
        .select('id, accessed_at, action, clinicians(full_name, hospital_name)')
        .eq('patient_id', patientData.id)
        .order('accessed_at', { ascending: false })
        .limit(5)

      // ✅ Transform clinicians array → single object
      const formattedLogs: AccessLog[] = (logsData || []).map((log: any) => ({
        id: log.id,
        accessed_at: log.accessed_at,
        action: log.action,
        clinicians: log.clinicians?.[0] || null
      }))

      setAccessLogs(formattedLogs)
    } catch (error) {
      console.error('Error fetching patient data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading your health record...</p>
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
            Welcome, {patient?.full_name} 👋
          </h2>
          <p className="text-gray-500 mt-1">
            Your unified health record
          </p>
        </div>

        {/* Health ID Card */}
        <div className="bg-blue-600 text-white rounded-2xl p-6 flex items-center justify-between">
          <div>
            <p className="text-blue-200 text-sm">Your Health ID</p>
            <p className="text-2xl font-bold mt-1">{patient?.health_id}</p>
            <p className="text-blue-200 text-xs mt-2">
              Show this to any clinician worldwide
            </p>
          </div>
          <div className="bg-white p-2 rounded-xl">
            <QRCodeSVG
              value={`${
                typeof window !== 'undefined' ? window.location.origin : ''
              }/clinician/access?patient_id=${patient?.health_id}`}
              size={80}
            />
          </div>
        </div>

        {/* Basic Info */}
        <div className="bg-white rounded-2xl p-6">
          <h3 className="font-semibold text-gray-800 mb-4">
            Basic Information
          </h3>
          <div className="grid grid-cols-2 gap-4">
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

        {/* Medical Records */}
        <div className="bg-white rounded-2xl p-6">
          <h3 className="font-semibold text-gray-800 mb-4">
            Medical Records
          </h3>

          {records.length === 0 ? (
            <p className="text-gray-400 text-sm">
              No records yet. Visit a clinic to get started.
            </p>
          ) : (
            <div className="space-y-3">
              {records.map((record) => (
                <div
                  key={record.id}
                  className="border border-gray-100 rounded-xl p-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-800 capitalize">
                      {record.record_type}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(record.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {record.content?.summary || 'No summary available'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Access Log */}
        <div className="bg-white rounded-2xl p-6">
          <h3 className="font-semibold text-gray-800 mb-4">
            Who Viewed Your Records
          </h3>

          {accessLogs.length === 0 ? (
            <p className="text-gray-400 text-sm">
              No one has accessed your records yet.
            </p>
          ) : (
            <div className="space-y-3">
              {accessLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between border border-gray-100 rounded-xl p-4"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      Dr. {log.clinicians?.full_name || 'Unknown'}
                    </p>
                    <p className="text-xs text-gray-400">
                      {log.clinicians?.hospital_name || 'Unknown Hospital'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">
                      {new Date(log.accessed_at).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-blue-500 capitalize">
                      {log.action?.replace('_', ' ')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AI Button */}
        <div className="bg-white rounded-2xl p-6 text-center">
          <button
            onClick={() => router.push('/patient/chat')}
            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-medium hover:bg-blue-700 transition flex items-center justify-center gap-2"
          >
            <span>🤖</span>
            Ask AI About Your Health
          </button>
        </div>
      </div>
    </div>
  )
}
