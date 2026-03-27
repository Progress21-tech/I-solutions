'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const steps = [
  'name',
  'personal',
  'medical',
  'conditions',
  'emergency'
]

export default function PatientOnboarding() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)

  // Form data
  const [fullName, setFullName] = useState('')
  const [dob, setDob] = useState('')
  const [bloodGroup, setBloodGroup] = useState('')
  const [genotype, setGenotype] = useState('')
  const [allergies, setAllergies] = useState('')
  const [conditions, setConditions] = useState<string[]>([])
  const [emergencyName, setEmergencyName] = useState('')
  const [emergencyPhone, setEmergencyPhone] = useState('')

  const chronicConditions = [
    'Diabetes',
    'Hypertension',
    'Asthma',
    'Sickle Cell',
    'Heart Disease',
    'Kidney Disease',
    'HIV/AIDS',
    'Tuberculosis',
    'Cancer',
    'Epilepsy'
  ]

  const toggleCondition = (condition: string) => {
    setConditions(prev =>
      prev.includes(condition)
        ? prev.filter(c => c !== condition)
        : [...prev, condition]
    )
  }

  const handleSubmit = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()

    await supabase.from('patients').upsert({
      user_id: user?.id,
      full_name: fullName,
      date_of_birth: dob || null,
      blood_group: bloodGroup || null,
      genotype: genotype || null,
      allergies: allergies || null,
      chronic_conditions: conditions.length > 0 ? conditions : null,
      emergency_contact_name: emergencyName || null,
      emergency_contact_phone: emergencyPhone || null,
    })

    router.push('/patient/dashboard')
    setLoading(false)
  }

  const progress = ((step + 1) / steps.length) * 100

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <h1 className="text-xl font-bold text-blue-600">UPHR</h1>
        {/* Progress bar */}
        <div className="mt-3 bg-gray-200 rounded-full h-1.5">
          <div
            className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-1">
          Step {step + 1} of {steps.length}
        </p>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-8">
        <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-sm">

          {/* Step 0 — Full Name */}
          {step === 0 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                What is your name?
              </h2>
              <p className="text-gray-500 text-sm mb-6">
                This is how you will appear on your health record
              </p>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-600"
              />
              <button
                onClick={() => setStep(1)}
                disabled={!fullName.trim()}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium mt-6 hover:bg-blue-700 transition disabled:opacity-50"
              >
                Continue
              </button>
            </div>
          )}

          {/* Step 1 — Personal Details */}
          {step === 1 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Personal details
              </h2>
              <p className="text-gray-500 text-sm mb-6">
                Help us personalize your health record
              </p>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 border-2 border-gray-200 text-gray-600 py-3 rounded-xl font-medium hover:bg-gray-50 transition"
                >
                  Skip for now
                </button>
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 transition"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 2 — Medical Info */}
          {step === 2 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Basic medical info
              </h2>
              <p className="text-gray-500 text-sm mb-6">
                Only fill in what you know. You can update this later.
              </p>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">
                    Blood Group
                  </label>
                  <select
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                    className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-blue-600"
                  >
                    <option value="">I don't know / Prefer to skip</option>
                    <option>A+</option>
                    <option>A-</option>
                    <option>B+</option>
                    <option>B-</option>
                    <option>AB+</option>
                    <option>AB-</option>
                    <option>O+</option>
                    <option>O-</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">
                    Genotype
                  </label>
                  <select
                    value={genotype}
                    onChange={(e) => setGenotype(e.target.value)}
                    className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-blue-600"
                  >
                    <option value="">I don't know / Prefer to skip</option>
                    <option>AA</option>
                    <option>AS</option>
                    <option>AC</option>
                    <option>SS</option>
                    <option>SC</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">
                    Known Allergies
                  </label>
                  <input
                    type="text"
                    value={allergies}
                    onChange={(e) => setAllergies(e.target.value)}
                    placeholder="e.g. Penicillin, Peanuts (or leave blank)"
                    className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 border-2 border-gray-200 text-gray-600 py-3 rounded-xl font-medium hover:bg-gray-50 transition"
                >
                  Skip for now
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 transition"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 3 — Chronic Conditions */}
          {step === 3 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Any chronic conditions?
              </h2>
              <p className="text-gray-500 text-sm mb-6">
                Select all that apply. This helps doctors treat you better.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {chronicConditions.map((condition) => (
                  <button
                    key={condition}
                    onClick={() => toggleCondition(condition)}
                    className={`py-3 px-4 rounded-xl text-sm font-medium text-left transition border-2 ${
                      conditions.includes(condition)
                        ? 'border-blue-600 bg-blue-50 text-blue-600'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {condition}
                  </button>
                ))}
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setStep(4)}
                  className="flex-1 border-2 border-gray-200 text-gray-600 py-3 rounded-xl font-medium hover:bg-gray-50 transition"
                >
                  Skip for now
                </button>
                <button
                  onClick={() => setStep(4)}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 transition"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 4 — Emergency Contact */}
          {step === 4 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Emergency contact
              </h2>
              <p className="text-gray-500 text-sm mb-6">
                Who should we contact in case of an emergency?
              </p>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">
                    Contact Name
                  </label>
                  <input
                    type="text"
                    value={emergencyName}
                    onChange={(e) => setEmergencyName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    value={emergencyPhone}
                    onChange={(e) => setEmergencyPhone(e.target.value)}
                    placeholder="e.g. 08012345678"
                    className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 border-2 border-gray-200 text-gray-600 py-3 rounded-xl font-medium hover:bg-gray-50 transition disabled:opacity-50"
                >
                  Skip for now
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Complete Setup'}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
