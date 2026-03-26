'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const recordTypes = ['diagnosis', 'lab', 'prescription', 'imaging']

export default function UploadRecordPage() {
  const [clinician, setClinician] = useState<any>(null)
  const [patient, setPatient] = useState<any>(null)
  const [recordType, setRecordType] = useState('diagnosis')
  const [summary, setSummary] = useState('')
  const [details, setDetails] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
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

    const { data: clinicianData } = await supabase
      .from('clinicians')
      .select('*')
      .eq('user_id', user.id)
      .single()

    setClinician(clinicianData)

    const { data: patientData } = await supabase
      .from('patients')
      .select('*')
      .eq('health_id', patientHealthId)
      .single()

    setPatient(patientData)
    setLoading(false)
  }

  const handleSubmit = async () => {
    if (!summary.trim()) return
    setSubmitting(true)

    await supabase.from('records').insert({
      patient_id: patient.id,
      uploaded_by: clinician.id,
      record_type: recordType,
      content: {
        summary,
        details,
        uploaded_by_name: clinician.full_name,
        hospital: clinician.hospital_name,
      }
    })

    // Log the action
    await supabase.from('access_logs').insert({
      clinician_id: clinician.id,
      patient_id: patient.id,
      action: 'uploaded_record'
    })

    setSuccess(true)
    setSubmitting(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-2xl p-8 text-center max-w-sm mx-auto shadow-sm">
          <div className="text-5xl mb-4">✅</div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            Record Uploaded
          </h3>
          <p className="text-gray-500 text-sm mb-6">
            The record has been saved to {patient?.full_name}'s health profile
          </p>
          <div className="space-y-3">
            <button
              onClick={() => {
                setSuccess(false)
                setSummary('')
                setDetails('')
              }}
              className="w-full border-2 border-blue-600 text-blue-600 py-3 rounded-xl font-medium hover:bg-blue-50 transition"
            >
              Add Another Record
            </button>
            <button
              onClick={() => router.push(
                `/clinician/access?patient_id=${patientHealthId}`
              )}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 transition"
            >
              View Patient Records
            </button>
          </div>
        </div>
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
        {/* Title */}
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            Add Medical Record
          </h2>
          <p className="text-gray-500 mt-1">
            For: {patient?.full_name} · {patient?.health_id}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 space-y-5">
          {/* Record Type */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">
              Record Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              {recordTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => setRecordType(type)}
                  className={`py-3 rounded-xl text-sm font-medium capitalize transition border-2 ${
                    recordType === type
                      ? 'border-blue-600 bg-blue-50 text-blue-600'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {type === 'diagnosis' && '🩺 '}
                  {type === 'lab' && '🧪 '}
                  {type === 'prescription' && '💊 '}
                  {type === 'imaging' && '🔬 '}
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">
              Summary <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="e.g. Patient diagnosed with Type 2 Diabetes"
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-600"
            />
          </div>

          {/* Details */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">
              Details <span className="text-gray-400">(optional)</span>
            </label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="e.g. HbA1c: 8.2%, prescribed Metformin 500mg twice daily, follow up in 3 months"
              rows={4}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-600 resize-none"
            />
          </div>

          {/* Clinician Info */}
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-1">Uploading as</p>
            <p className="text-sm font-medium text-gray-800">
              {clinician?.full_name}
            </p>
            <p className="text-xs text-gray-500">{clinician?.hospital_name}</p>
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={submitting || !summary.trim()}
            className="w-full bg-blue-600 text-white py-4 rounded-xl font-medium hover:bg-blue-700 transition disabled:opacity-50"
          >
            {submitting ? 'Saving Record...' : 'Save Record'}
          </button>
        </div>
      </div>
    </div>
  )
}
