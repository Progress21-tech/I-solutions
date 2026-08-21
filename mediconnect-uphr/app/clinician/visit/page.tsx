'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  ClinicalVisit,
  PatientRecord,
  Prescription,
  RiskTier,
  addClinicalVisit,
  getPatientById,
  getStoredVisits
} from '@/lib/data/records-data'
import { evaluateClinicalRisk } from '@/lib/ai/risk-engine'

function StructuredVisitEntryForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const patientIdParam = searchParams.get('patient_id') || 'MAT-AMK-2026'

  const [patient, setPatient] = useState<PatientRecord | null>(null)
  const [previousVisits, setPreviousVisits] = useState<ClinicalVisit[]>([])

  // Form Vitals
  const [systolic, setSystolic] = useState<number>(148)
  const [diastolic, setDiastolic] = useState<number>(96)
  const [heartRate, setHeartRate] = useState<number>(88)
  const [weightKg, setWeightKg] = useState<number>(74)
  const [gestationalWeeks, setGestationalWeeks] = useState<number>(32)
  const [fundalHeight, setFundalHeight] = useState<number>(31)
  const [fetalHeartRate, setFetalHeartRate] = useState<number>(152)
  const [proteinuria, setProteinuria] = useState<'Negative' | 'Trace' | '1+' | '2+' | '3+' | '4+'>('2+')
  const [bloodGlucose, setBloodGlucose] = useState<number>(98)
  const [hemoglobin, setHemoglobin] = useState<number>(10.9)

  // Symptoms
  const [symptoms, setSymptoms] = useState<string[]>([
    'Persistent frontal headache',
    'Bilateral pitting ankle edema'
  ])

  const [clinicalNotes, setClinicalNotes] = useState(
    'Routine 32-week antenatal evaluation. High clinical suspicion for developing pre-eclampsia based on elevated BP and 2+ proteinuria. Commencing Methyldopa and initiating specialist consult.'
  )
  const [diagnoses, setDiagnoses] = useState('Pre-eclampsia at 32 weeks, Gestational Hypertension')

  // Prescriptions
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([
    {
      id: `rx-${Date.now()}-1`,
      medication_name: 'Methyldopa (Aldomet) 250mg',
      dosage: '250mg',
      frequency: 'Three times daily (TDS)',
      duration_days: 14,
      refills_remaining: 3,
      instructions: 'Take 1 tablet every 8 hours with or after food. Do not skip doses.',
      prescribed_by: 'Dr. Bello Adeyemi',
      prescribed_date: new Date().toISOString().split('T')[0],
      status: 'active',
      category: 'Antihypertensive'
    },
    {
      id: `rx-${Date.now()}-2`,
      medication_name: 'Pregnacare Plus Prenatal Micronutrients',
      dosage: '1 dual pack daily',
      frequency: 'Once Daily',
      duration_days: 30,
      refills_remaining: 1,
      instructions: 'Take after lunch with a glass of water.',
      prescribed_by: 'Dr. Bello Adeyemi',
      prescribed_date: new Date().toISOString().split('T')[0],
      status: 'active',
      category: 'Prenatal Vitamins'
    }
  ])

  // New Rx form state
  const [newMedName, setNewMedName] = useState('')
  const [newDosage, setNewDosage] = useState('')
  const [newFreq, setNewFreq] = useState('Once Daily')
  const [newDuration, setNewDuration] = useState('30')

  // Live Risk Calculation
  const [liveRisk, setLiveRisk] = useState<ReturnType<typeof evaluateClinicalRisk> | null>(null)
  const [saving, setSaving] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)

  useEffect(() => {
    const found = getPatientById(patientIdParam)
    if (found) {
      setPatient(found)
      if (found.gestational_weeks) setGestationalWeeks(found.gestational_weeks)
      const visits = getStoredVisits(found.id)
      setPreviousVisits(visits)
    }
  }, [patientIdParam])

  // Recalculate risk on any vital change
  useEffect(() => {
    if (!patient) return
    const partialVisit: Partial<ClinicalVisit> = {
      systolic_bp: systolic,
      diastolic_bp: diastolic,
      heart_rate: heartRate,
      weight_kg: weightKg,
      gestational_age_weeks: gestationalWeeks,
      fundal_height_cm: fundalHeight,
      fetal_heart_rate_bpm: fetalHeartRate,
      proteinuria_dipstick: proteinuria,
      blood_glucose_mg_dl: bloodGlucose,
      hemoglobin_g_dl: hemoglobin,
      symptoms
    }
    const result = evaluateClinicalRisk(patient, partialVisit, previousVisits)
    setLiveRisk(result)
  }, [
    patient,
    systolic,
    diastolic,
    heartRate,
    weightKg,
    gestationalWeeks,
    fundalHeight,
    fetalHeartRate,
    proteinuria,
    bloodGlucose,
    hemoglobin,
    symptoms,
    previousVisits
  ])

  const toggleSymptom = (sym: string) => {
    if (symptoms.includes(sym)) {
      setSymptoms(symptoms.filter((s) => s !== sym))
    } else {
      setSymptoms([...symptoms, sym])
    }
  }

  const handleAddPrescription = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMedName.trim()) return
    const newRx: Prescription = {
      id: `rx-${Date.now()}`,
      medication_name: newMedName.trim(),
      dosage: newDosage.trim() || 'Standard Dose',
      frequency: newFreq,
      duration_days: Number(newDuration) || 30,
      refills_remaining: 2,
      instructions: 'Take as directed by doctor with water.',
      prescribed_by: 'Dr. Bello Adeyemi',
      prescribed_date: new Date().toISOString().split('T')[0],
      status: 'active',
      category: 'Other'
    }
    setPrescriptions([...prescriptions, newRx])
    setNewMedName('')
    setNewDosage('')
  }

  const handleSaveVisit = () => {
    if (!patient || !liveRisk) return
    setSaving(true)

    const newVisit: ClinicalVisit = {
      id: `vis-${Date.now()}`,
      patient_id: patient.id,
      patient_health_id: patient.health_id,
      visit_date: new Date().toISOString(),
      clinician_name: 'Dr. Bello Adeyemi',
      clinician_role: 'Doctor',
      facility_name: 'Lagos Island Maternity Hospital',
      visit_type: patient.pathway === 'maternal' ? 'Antenatal Routine' : 'Chronic Follow-up',
      systolic_bp: Number(systolic),
      diastolic_bp: Number(diastolic),
      heart_rate: Number(heartRate),
      weight_kg: Number(weightKg),
      gestational_age_weeks: patient.pathway === 'maternal' ? Number(gestationalWeeks) : undefined,
      fundal_height_cm: patient.pathway === 'maternal' ? Number(fundalHeight) : undefined,
      fetal_heart_rate_bpm: patient.pathway === 'maternal' ? Number(fetalHeartRate) : undefined,
      proteinuria_dipstick: proteinuria,
      blood_glucose_mg_dl: Number(bloodGlucose),
      hemoglobin_g_dl: Number(hemoglobin),
      symptoms,
      clinical_notes: clinicalNotes,
      diagnoses: diagnoses.split(',').map((d) => d.trim()),
      prescriptions,
      calculated_risk_tier: liveRisk.tier,
      driving_factors: liveRisk.drivingFactors
    }

    addClinicalVisit(newVisit)
    setSavedSuccess(true)
    setTimeout(() => {
      router.push('/clinician/dashboard')
    }, 1500)
  }

  if (!patient) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500">
        Loading patient record...
      </div>
    )
  }

  const riskTierColor =
    liveRisk?.tier === 'RED'
      ? 'bg-rose-50 text-rose-700 border-rose-200'
      : liveRisk?.tier === 'AMBER'
      ? 'bg-amber-50 text-amber-700 border-amber-200'
      : 'bg-emerald-50 text-emerald-700 border-emerald-200'

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-16">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-3">
          <Link href="/clinician/dashboard" className="text-slate-500 hover:text-slate-800 text-sm font-semibold">
            ← Back to Dashboard
          </Link>
          <span className="text-slate-300">/</span>
          <h1 className="font-bold text-slate-900 text-base">Structured Clinical Visit Entry</h1>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500">Patient: <strong className="text-slate-800">{patient.full_name}</strong> ({patient.health_id})</span>
          <button
            onClick={handleSaveVisit}
            disabled={saving || savedSuccess}
            className={`font-bold text-xs px-5 py-2.5 rounded-xl transition shadow-xs flex items-center gap-2 ${
              savedSuccess
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            {savedSuccess ? '✓ Visit Saved Successfully!' : saving ? 'Saving...' : '💾 Save & Update Risk Tier'}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Columns: Form Input Controls */}
        <section className="lg:col-span-7 space-y-6">
          {/* Vitals Entry Box */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>🩺</span> Clinical Measurements & Vitals
              </h2>
              <span className="text-[11px] text-slate-500">Standard Antenatal & Cardiovascular Panel</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Systolic BP <span className="text-slate-400 font-normal">(mmHg)</span>
                </label>
                <input
                  type="number"
                  value={systolic}
                  onChange={(e) => setSystolic(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 font-mono text-sm focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Diastolic BP <span className="text-slate-400 font-normal">(mmHg)</span>
                </label>
                <input
                  type="number"
                  value={diastolic}
                  onChange={(e) => setDiastolic(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 font-mono text-sm focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Heart Rate <span className="text-slate-400 font-normal">(bpm)</span>
                </label>
                <input
                  type="number"
                  value={heartRate}
                  onChange={(e) => setHeartRate(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 font-mono text-sm focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Maternal Weight <span className="text-slate-400 font-normal">(kg)</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={weightKg}
                  onChange={(e) => setWeightKg(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 font-mono text-sm focus:border-emerald-600 focus:outline-none"
                />
              </div>

              {patient.pathway === 'maternal' && (
                <>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      Gestational Age <span className="text-slate-400 font-normal">(wks)</span>
                    </label>
                    <input
                      type="number"
                      value={gestationalWeeks}
                      onChange={(e) => setGestationalWeeks(Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 font-mono text-sm focus:border-emerald-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      Fundal Height <span className="text-slate-400 font-normal">(cm)</span>
                    </label>
                    <input
                      type="number"
                      value={fundalHeight}
                      onChange={(e) => setFundalHeight(Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 font-mono text-sm focus:border-emerald-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      Fetal Heart Rate <span className="text-slate-400 font-normal">(bpm)</span>
                    </label>
                    <input
                      type="number"
                      value={fetalHeartRate}
                      onChange={(e) => setFetalHeartRate(Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 font-mono text-sm focus:border-emerald-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      Proteinuria Dipstick
                    </label>
                    <select
                      value={proteinuria}
                      onChange={(e) => setProteinuria(e.target.value as any)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 font-mono text-sm focus:border-emerald-600 focus:outline-none"
                    >
                      <option value="Negative">Negative</option>
                      <option value="Trace">Trace</option>
                      <option value="1+">1+ (30 mg/dL)</option>
                      <option value="2+">2+ (100 mg/dL)</option>
                      <option value="3+">3+ (300 mg/dL)</option>
                      <option value="4+">4+ (&gt;1000 mg/dL)</option>
                    </select>
                  </div>
                </>
              )}

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Blood Glucose <span className="text-slate-400 font-normal">(mg/dL)</span>
                </label>
                <input
                  type="number"
                  value={bloodGlucose}
                  onChange={(e) => setBloodGlucose(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 font-mono text-sm focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Hemoglobin / PCV <span className="text-slate-400 font-normal">(g/dL)</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={hemoglobin}
                  onChange={(e) => setHemoglobin(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 font-mono text-sm focus:border-emerald-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Clinical Symptoms Checklist */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>⚠️</span> Patient-Reported Symptoms & Red-Flag Checklist
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
              {[
                'Persistent frontal headache',
                'Visual blurring / Flashing spots',
                'Bilateral pitting ankle edema',
                'Epigastric / Upper abdominal pain',
                'Vaginal bleeding or spotting',
                'Reduced fetal movement',
                'Shortness of breath',
                'Fever / Chills'
              ].map((sym) => {
                const active = symptoms.includes(sym)
                return (
                  <button
                    key={sym}
                    type="button"
                    onClick={() => toggleSymptom(sym)}
                    className={`p-2.5 rounded-xl border text-left font-semibold transition flex items-center justify-between ${
                      active
                        ? 'bg-rose-50 border-rose-500 text-rose-800'
                        : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>{sym}</span>
                    <span>{active ? '✓' : '+'}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Notes & Diagnoses */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 text-xs shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>📋</span> Clinical Assessment & Diagnoses
            </h3>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Diagnoses (comma-separated)</label>
              <input
                type="text"
                value={diagnoses}
                onChange={(e) => setDiagnoses(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Clinical Notes & Observations</label>
              <textarea
                rows={3}
                value={clinicalNotes}
                onChange={(e) => setClinicalNotes(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl p-3 text-slate-900 focus:outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          {/* Prescriptions Builder */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 text-xs shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>💊</span> Prescriptions (Linked to Pharmacy Delivery Loop)
              </h3>
              <span className="text-[11px] text-emerald-700 font-semibold">Refill-enabled for Patient App</span>
            </div>

            <div className="space-y-2">
              {prescriptions.map((rx, idx) => (
                <div
                  key={rx.id || idx}
                  className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex items-center justify-between"
                >
                  <div>
                    <span className="font-bold text-slate-900">{rx.medication_name}</span>
                    <p className="text-slate-500 text-[11px]">
                      {rx.dosage} · {rx.frequency} · {rx.duration_days} days supply ({rx.refills_remaining} refills allowed)
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPrescriptions(prescriptions.filter((_, i) => i !== idx))}
                    className="text-rose-600 hover:text-rose-800 text-xs px-2 py-1"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            {/* Add Rx subform */}
            <form onSubmit={handleAddPrescription} className="pt-2 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-2">
              <input
                type="text"
                placeholder="Medication name"
                value={newMedName}
                onChange={(e) => setNewMedName(e.target.value)}
                className="bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-900 col-span-2"
              />
              <input
                type="text"
                placeholder="Dosage (e.g. 250mg)"
                value={newDosage}
                onChange={(e) => setNewDosage(e.target.value)}
                className="bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-900"
              />
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl px-3 py-1.5 transition"
              >
                + Add Rx
              </button>
            </form>
          </div>
        </section>

        {/* Right 5 Columns: Live Instant AI Risk Prediction Preview */}
        <section className="lg:col-span-5 space-y-5">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs sticky top-24 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-700">
                  LIVE AI RISK CALCULATION
                </span>
                <h3 className="font-bold text-slate-900 text-base mt-0.5">Instant Clinical Score</h3>
              </div>
              <span className={`text-xs font-black uppercase px-3 py-1 rounded-full border ${riskTierColor}`}>
                {liveRisk?.tier} ({liveRisk?.score}/100)
              </span>
            </div>

            {/* Score Bar */}
            <div>
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>Complication Risk Probability</span>
                <span className="font-bold text-slate-800">{liveRisk?.score}%</span>
              </div>
              <div className="w-full h-3 rounded-full bg-slate-100 border border-slate-200 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    liveRisk?.tier === 'RED'
                      ? 'bg-rose-500'
                      : liveRisk?.tier === 'AMBER'
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${liveRisk?.score || 10}%` }}
                />
              </div>
            </div>

            {/* Driving Factors */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Identified Driving Factors:
              </h4>
              <div className="space-y-1.5">
                {liveRisk?.drivingFactors.map((df, idx) => (
                  <div key={idx} className="text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-slate-700">
                    • {df}
                  </div>
                ))}
              </div>
            </div>

            {/* Clinical Recommendations */}
            <div>
              <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-2">
                Recommended Actions:
              </h4>
              <div className="space-y-1.5">
                {liveRisk?.clinicalRecommendations.map((rec, idx) => (
                  <div key={idx} className="text-xs bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl text-emerald-900">
                    ✓ {rec}
                  </div>
                ))}
              </div>
            </div>

            {/* Auto Plain Summary Preview */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-teal-700 block mb-1">
                Patient App Plain-Language Summary
              </span>
              <p className="text-xs text-slate-600 italic leading-relaxed">
                "{liveRisk?.patientFriendlySummary}"
              </p>
            </div>

            <button
              onClick={handleSaveVisit}
              disabled={saving || savedSuccess}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-2xl transition shadow-xs text-sm"
            >
              {savedSuccess ? '✓ Saved!' : saving ? 'Saving Visit...' : 'Confirm & Commit Visit to Timeline'}
            </button>
          </div>
        </section>
      </main>
    </div>
  )
}

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 grid place-items-center text-slate-500">Loading visit entry...</div>}>
      <StructuredVisitEntryForm />
    </Suspense>
  )
}
