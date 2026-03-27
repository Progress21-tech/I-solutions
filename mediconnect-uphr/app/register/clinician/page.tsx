'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type FormData = {
  full_name: string
  hospital_name: string
  specialty: string
  license_number: string
}

const SPECIALTIES = [
  'General Practice',
  'Cardiology',
  'Neurology',
  'Oncology',
  'Pediatrics',
  'Psychiatry',
  'Surgery',
  'Internal Medicine',
  'Endocrinology',
  'Dermatology',
  'Obstetrics & Gynecology',
  'Other',
]

const STEPS = [
  {
    field: 'full_name',
    title: 'What is your name?',
    subtitle: 'Your full professional name as it appears on your license.',
  },
  {
    field: 'hospital_name',
    title: 'Hospital or clinic name?',
    subtitle: 'The primary facility where you practice.',
  },
  {
    field: 'specialty',
    title: 'What is your specialty?',
    subtitle: 'Select the one that best describes your practice.',
  },
  {
    field: 'license_number',
    title: 'Your medical license number?',
    subtitle: 'Used for identity verification. Your account will be reviewed before activation.',
  },
]

export default function ClinicianOnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState<FormData>({
    full_name: '',
    hospital_name: '',
    specialty: '',
    license_number: '',
  })

  const current = STEPS[step]
  const isLast = step === STEPS.length - 1
  const progress = Math.round(((step + 1) / STEPS.length) * 100)

  const canProceed = () => {
    const val = form[current.field as keyof FormData]
    return val.trim() !== ''
  }

  const handleNext = async () => {
    if (isLast) {
      await handleSubmit()
    } else {
      setStep((s) => s + 1)
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No authenticated user found.')

      const { error: clinicianError } = await supabase.from('clinicians').upsert({
        user_id: user.id,
        full_name: form.full_name,
        hospital_name: form.hospital_name,
        specialty: form.specialty,
        license_number: form.license_number,
        verification_status: 'pending',
      })

      if (clinicianError) throw clinicianError

      router.push('/clinician/pending')
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-md">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-green-600">UPHR</h1>
            <p className="text-xs text-gray-400 mt-0.5">Clinician Onboarding</p>
          </div>
          <span className="text-sm text-gray-400 font-medium">
            {step + 1} / {STEPS.length}
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-100 rounded-full h-1.5 mb-8">
          <div
            className="bg-green-600 h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Question */}
        <h2 className="text-xl font-semibold text-gray-800 mb-1">
          {current.title}
        </h2>
        <p className="text-sm text-gray-400 mb-6">{current.subtitle}</p>

        {/* --- Specialty picker --- */}
        {current.field === 'specialty' && (
          <div className="grid grid-cols-2 gap-2 mb-6">
            {SPECIALTIES.map((s) => (
              <button
                key={s}
                onClick={() => setForm((f) => ({ ...f, specialty: s }))}
                className={`py-3 px-3 rounded-xl border-2 font-medium text-sm text-left transition ${
                  form.specialty === s
                    ? 'border-green-600 bg-green-600 text-white'
                    : 'border-gray-200 text-gray-600 hover:border-green-300'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* --- Text inputs --- */}
        {current.field !== 'specialty' && (
          <input
            type="text"
            placeholder={
              current.field === 'full_name'
                ? 'e.g. Dr. Chidi Okafor'
                : current.field === 'hospital_name'
                ? 'e.g. Lagos University Teaching Hospital'
                : 'e.g. MDCN/R&R/12345'
            }
            value={form[current.field as keyof FormData]}
            onChange={(e) =>
              setForm((f) => ({ ...f, [current.field]: e.target.value }))
            }
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-700 focus:border-green-600 focus:outline-none mb-6 transition"
          />
        )}

        {/* Error */}
        {error && (
          <p className="text-sm text-red-500 mb-4 bg-red-50 px-4 py-2 rounded-lg">
            {error}
          </p>
        )}

        {/* Navigation */}
        <div className="flex gap-3">
          {step > 0 && (
            <button
              onClick={() => setStep((s) => s - 1)}
              disabled={loading}
              className="flex-1 py-3 border-2 border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-50 transition disabled:opacity-50"
            >
              ← Back
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={!canProceed() || loading}
            className="flex-1 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition disabled:opacity-40"
          >
            {loading
              ? 'Submitting...'
              : isLast
              ? 'Submit for Verification →'
              : 'Continue →'}
          </button>
        </div>

      </div>
    </div>
  )
}
