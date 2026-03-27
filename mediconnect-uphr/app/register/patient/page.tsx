'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type FormData = {
  full_name: string
  date_of_birth: string
  blood_group: string
  allergies: string
  chronic_conditions: string
}

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

const STEPS = [
  {
    field: 'full_name',
    title: 'What is your name?',
    subtitle: 'This is how you\'ll appear in your health records.',
    required: true,
  },
  {
    field: 'date_of_birth',
    title: 'Date of birth?',
    subtitle: 'Used to calculate age-based risk factors.',
    required: true,
  },
  {
    field: 'blood_group',
    title: 'What is your blood group?',
    subtitle: 'Critical for emergency care decisions.',
    required: false,
  },
  {
    field: 'allergies',
    title: 'Any known allergies?',
    subtitle: 'e.g. Penicillin, Peanuts. Type "None" if not applicable.',
    required: false,
  },
  {
    field: 'chronic_conditions',
    title: 'Any chronic conditions?',
    subtitle: 'e.g. Type 2 Diabetes, Hypertension. Type "None" if not applicable.',
    required: false,
  },
]

export default function PatientOnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState<FormData>({
    full_name: '',
    date_of_birth: '',
    blood_group: '',
    allergies: '',
    chronic_conditions: '',
  })

  const current = STEPS[step]
  const isLast = step === STEPS.length - 1
  const progress = Math.round(((step + 1) / STEPS.length) * 100)

  const canProceed = () => {
    if (!current.required) return true
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

      const { error: patientError } = await supabase.from('patients').upsert({
        user_id: user.id,
        full_name: form.full_name,
        date_of_birth: form.date_of_birth || null,
        blood_group: form.blood_group || null,
        allergies: form.allergies || null,
        chronic_conditions: form.chronic_conditions || null,
      })

      if (patientError) throw patientError

      router.push('/patient/dashboard')
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
            <h1 className="text-2xl font-bold text-blue-600">UPHR</h1>
            <p className="text-xs text-gray-400 mt-0.5">Patient Onboarding</p>
          </div>
          <span className="text-sm text-gray-400 font-medium">
            {step + 1} / {STEPS.length}
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-100 rounded-full h-1.5 mb-8">
          <div
            className="bg-blue-600 h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Question */}
        <h2 className="text-xl font-semibold text-gray-800 mb-1">
          {current.title}
        </h2>
        <p className="text-sm text-gray-400 mb-6">{current.subtitle}</p>

        {/* --- Blood group picker --- */}
        {current.field === 'blood_group' && (
          <div className="grid grid-cols-4 gap-2 mb-6">
            {BLOOD_GROUPS.map((bg) => (
              <button
                key={bg}
                onClick={() => setForm((f) => ({ ...f, blood_group: bg }))}
                className={`py-3 rounded-xl border-2 font-semibold text-sm transition ${
                  form.blood_group === bg
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : 'border-gray-200 text-gray-600 hover:border-blue-300'
                }`}
              >
                {bg}
              </button>
            ))}
            <button
              onClick={() => setForm((f) => ({ ...f, blood_group: 'Unknown' }))}
              className={`col-span-4 py-3 rounded-xl border-2 font-medium text-sm transition ${
                form.blood_group === 'Unknown'
                  ? 'border-blue-600 bg-blue-600 text-white'
                  : 'border-gray-200 text-gray-500 hover:border-blue-300'
              }`}
            >
              I don't know my blood group
            </button>
          </div>
        )}

        {/* --- Date picker --- */}
        {current.field === 'date_of_birth' && (
          <input
            type="date"
            value={form.date_of_birth}
            max={new Date().toISOString().split('T')[0]}
            onChange={(e) => setForm((f) => ({ ...f, date_of_birth: e.target.value }))}
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-700 focus:border-blue-600 focus:outline-none mb-6 transition"
          />
        )}

        {/* --- Text inputs --- */}
        {(current.field === 'full_name' ||
          current.field === 'allergies' ||
          current.field === 'chronic_conditions') && (
          <textarea
            rows={current.field === 'full_name' ? 1 : 3}
            placeholder={
              current.field === 'full_name'
                ? 'e.g. Amara Johnson'
                : current.field === 'allergies'
                ? 'e.g. Penicillin, Latex, Peanuts'
                : 'e.g. Type 2 Diabetes, Hypertension'
            }
            value={form[current.field as keyof FormData]}
            onChange={(e) =>
              setForm((f) => ({ ...f, [current.field]: e.target.value }))
            }
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-700 focus:border-blue-600 focus:outline-none mb-6 transition resize-none"
          />
        )}

        {/* Optional tag */}
        {!current.required && (
          <p className="text-xs text-gray-400 -mt-4 mb-6">
            Optional — you can update this later from your dashboard.
          </p>
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
            className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-40"
          >
            {loading
              ? 'Saving...'
              : isLast
              ? 'Go to Dashboard →'
              : 'Continue →'}
          </button>
        </div>

      </div>
    </div>
  )
}
