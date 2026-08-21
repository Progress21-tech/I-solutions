'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  PatientRecord,
  RiskTier,
  getStoredPatients,
  savePatientRecord
} from '@/lib/data/records-data'
import Link from 'next/link'

export default function ClinicianDashboard() {
  const router = useRouter()
  const [patients, setPatients] = useState<PatientRecord[]>([])
  const [filterTier, setFilterTier] = useState<RiskTier | 'ALL'>('ALL')
  const [filterPathway, setFilterPathway] = useState<'all' | 'maternal' | 'chronic'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPatient, setSelectedPatient] = useState<PatientRecord | null>(null)
  const [showReferralModal, setShowReferralModal] = useState(false)
  const [showRegisterModal, setShowRegisterModal] = useState(false)
  const [slaCountdown, setSlaCountdown] = useState<number>(18)
  const [slaAcknowledged, setSlaAcknowledged] = useState(false)

  // New Patient Form state
  const [newFullName, setNewFullName] = useState('')
  const [newAge, setNewAge] = useState('26')
  const [newPhone, setNewPhone] = useState('+234 ')
  const [newPathway, setNewPathway] = useState<'maternal' | 'chronic'>('maternal')
  const [newWeeks, setNewWeeks] = useState('16')
  const [newConditions, setNewConditions] = useState('')

  useEffect(() => {
    const list = getStoredPatients()
    setPatients(list)
    if (list.length > 0) setSelectedPatient(list[0])

    const interval = setInterval(() => {
      setSlaCountdown((prev) => (prev > 0 ? prev - 1 : 0))
    }, 60000)

    return () => clearInterval(interval)
  }, [])

  const handleRegisterPatient = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newFullName.trim()) return

    const randomSuffix = Math.floor(1000 + Math.random() * 9000)
    const newRecord: PatientRecord = {
      id: `pat-${Date.now()}`,
      health_id: `MAT-${newFullName.slice(0, 3).toUpperCase()}-${randomSuffix}`,
      full_name: newFullName.trim(),
      age: Number(newAge) || 25,
      gender: 'female',
      phone: newPhone.trim(),
      address: 'Lagos, Nigeria',
      pathway: newPathway,
      blood_group: 'O+',
      genotype: 'AA',
      chronic_conditions: newConditions ? [newConditions] : [],
      is_pregnant: newPathway === 'maternal',
      gestational_weeks: newPathway === 'maternal' ? Number(newWeeks) : undefined,
      current_risk_tier: 'GREEN',
      risk_score: 15,
      risk_driving_factors: ['New patient intake; baseline vitals to be established.'],
      clinical_recommendations: ['Perform comprehensive baseline antenatal / chronic workup.'],
      patient_summary_plain: 'Welcome to Materna AI! Your continuity record is now active.',
      last_assessed_at: new Date().toISOString(),
      emergency_contact_name: 'Next of Kin',
      emergency_contact_phone: newPhone.trim(),
      emergency_contact_relation: 'Family'
    }

    const saved = savePatientRecord(newRecord)
    const updated = getStoredPatients()
    setPatients(updated)
    setSelectedPatient(saved)
    setShowRegisterModal(false)
    setNewFullName('')
  }

  const redCount = patients.filter((p) => p.current_risk_tier === 'RED').length
  const amberCount = patients.filter((p) => p.current_risk_tier === 'AMBER').length
  const greenCount = patients.filter((p) => p.current_risk_tier === 'GREEN').length

  const filteredPatients = patients.filter((p) => {
    if (filterTier !== 'ALL' && p.current_risk_tier !== filterTier) return false
    if (filterPathway !== 'all' && p.pathway !== filterPathway) return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      return (
        p.full_name.toLowerCase().includes(q) ||
        p.health_id.toLowerCase().includes(q) ||
        p.phone.includes(q)
      )
    }
    return true
  })

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Top Navigation */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-40 px-6 py-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center font-black text-white text-lg shadow-sm">
              M
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-slate-900 tracking-tight">Materna AI</span>
                <span className="text-[11px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                  CLINICAL PORTAL
                </span>
              </div>
              <p className="text-xs text-slate-500">Hospital & Specialist Care Continuity</p>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/chw"
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition flex items-center gap-1.5"
          >
            <span>🏡</span> CHW Field Mode
          </Link>
          <Link
            href="/offline-channels"
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100 transition flex items-center gap-1.5"
          >
            <span>📱</span> WhatsApp & USSD Simulator
          </Link>
          <div className="h-4 w-px bg-slate-200 mx-1" />
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-slate-800">Dr. Bello Adeyemi / Nurse Ifeoma</p>
            <p className="text-[11px] text-slate-500">Lagos Island Maternity & LUTH</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center text-xs font-bold text-emerald-800">
            DR
          </div>
        </div>
      </header>

      {/* Emergency Triage Banner */}
      {!slaAcknowledged && patients.some((p) => p.current_risk_tier === 'RED') && (
        <div className="bg-rose-50 border-b border-rose-200 px-6 py-3 text-rose-900 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🚨</span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm uppercase tracking-wider text-rose-800">
                  RED-TIER PRE-ECLAMPSIA ESCALATION DETECTED
                </span>
                <span className="bg-rose-100 text-rose-800 text-xs px-2 py-0.5 rounded-full font-mono font-bold border border-rose-300">
                  SLA: {slaCountdown}m Remaining
                </span>
              </div>
              <p className="text-xs text-rose-700 mt-0.5">
                Patient <strong>Amaka Johnson (MAT-AMK-2026, 32w)</strong>: BP 148/96 mmHg + 2+ Proteinuria + Severe Frontal Headache.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const amaka = patients.find((p) => p.health_id === 'MAT-AMK-2026')
                if (amaka) setSelectedPatient(amaka)
                setShowReferralModal(true)
              }}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-3.5 py-1.5 rounded-lg text-xs transition shadow-sm"
            >
              Dispatch Specialist Referral (LUTH)
            </button>
            <button
              onClick={() => setSlaAcknowledged(true)}
              className="bg-white hover:bg-rose-100 text-rose-800 border border-rose-300 px-3 py-1.5 rounded-lg text-xs transition font-semibold"
            >
              Acknowledge SLA
            </button>
          </div>
        </div>
      )}

      {/* Main Grid Layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Triage Metrics & Patient Roster (5 cols) */}
        <section className="lg:col-span-5 space-y-4">
          {/* Triage Stratification Counts */}
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => setFilterTier(filterTier === 'RED' ? 'ALL' : 'RED')}
              className={`p-3.5 rounded-2xl border text-left transition ${
                filterTier === 'RED'
                  ? 'bg-rose-50 border-rose-500 ring-2 ring-rose-300'
                  : 'bg-white border-slate-200 hover:border-rose-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-700 uppercase tracking-wider">Red Tier</span>
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              </div>
              <div className="text-2xl font-black text-rose-900 mt-1">{redCount}</div>
              <p className="text-[11px] text-rose-600 mt-0.5">High Complication Risk</p>
            </button>

            <button
              onClick={() => setFilterTier(filterTier === 'AMBER' ? 'ALL' : 'AMBER')}
              className={`p-3.5 rounded-2xl border text-left transition ${
                filterTier === 'AMBER'
                  ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-300'
                  : 'bg-white border-slate-200 hover:border-amber-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Amber Tier</span>
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              </div>
              <div className="text-2xl font-black text-amber-900 mt-1">{amberCount}</div>
              <p className="text-[11px] text-amber-600 mt-0.5">Moderate / Watch Closely</p>
            </button>

            <button
              onClick={() => setFilterTier(filterTier === 'GREEN' ? 'ALL' : 'GREEN')}
              className={`p-3.5 rounded-2xl border text-left transition ${
                filterTier === 'GREEN'
                  ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-300'
                  : 'bg-white border-slate-200 hover:border-emerald-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Green Tier</span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              </div>
              <div className="text-2xl font-black text-emerald-900 mt-1">{greenCount}</div>
              <p className="text-[11px] text-emerald-600 mt-0.5">Stable / Routine Care</p>
            </button>
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-xs">
            <div className="flex items-center justify-between gap-2">
              <input
                type="text"
                placeholder="Search patient name, Health ID (MAT-...), phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600"
              />
              <button
                onClick={() => setShowRegisterModal(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap shadow-sm"
              >
                <span>+</span> Register
              </button>
            </div>

            {/* Pathway tabs */}
            <div className="flex gap-2 text-xs font-semibold">
              <button
                onClick={() => setFilterPathway('all')}
                className={`px-3 py-1 rounded-lg transition ${
                  filterPathway === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900 bg-slate-100'
                }`}
              >
                All Patients ({patients.length})
              </button>
              <button
                onClick={() => setFilterPathway('maternal')}
                className={`px-3 py-1 rounded-lg transition ${
                  filterPathway === 'maternal'
                    ? 'bg-rose-600 text-white'
                    : 'text-rose-700 hover:text-rose-900 bg-rose-50'
                }`}
              >
                🤰 Maternal (ANC)
              </button>
              <button
                onClick={() => setFilterPathway('chronic')}
                className={`px-3 py-1 rounded-lg transition ${
                  filterPathway === 'chronic'
                    ? 'bg-blue-600 text-white'
                    : 'text-blue-700 hover:text-blue-900 bg-blue-50'
                }`}
              >
                🩺 Chronic Care
              </button>
            </div>
          </div>

          {/* Patient Cards List */}
          <div className="space-y-2.5 overflow-y-auto max-h-[600px] pr-1">
            {filteredPatients.map((patient) => {
              const isSelected = selectedPatient?.id === patient.id
              const tierBadgeColor =
                patient.current_risk_tier === 'RED'
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : patient.current_risk_tier === 'AMBER'
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'

              return (
                <div
                  key={patient.id}
                  onClick={() => setSelectedPatient(patient)}
                  className={`p-4 rounded-2xl border cursor-pointer transition text-left relative ${
                    isSelected
                      ? 'bg-white border-emerald-600 shadow-md ring-2 ring-emerald-100'
                      : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">{patient.full_name}</span>
                        <span className="text-[11px] font-mono text-slate-500">({patient.health_id})</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {patient.pathway === 'maternal'
                          ? `🤰 ${patient.gestational_weeks}w Gestation · Age ${patient.age}`
                          : `🩺 Chronic Care · Age ${patient.age}`}
                        {' · '}
                        <span className="text-slate-700 font-semibold">{patient.blood_group} ({patient.genotype})</span>
                      </p>
                    </div>

                    <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${tierBadgeColor}`}>
                      {patient.current_risk_tier} TIER
                    </span>
                  </div>

                  {/* Primary Driving Factors preview */}
                  <p className="text-xs text-slate-700 mt-2.5 line-clamp-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
                    🔍 <strong>Key Driver:</strong> {patient.risk_driving_factors[0] || 'Parameters within normal reference'}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2.5 pt-2 border-t border-slate-100">
                    <span>Facility: {patient.assigned_facility?.split('&')[0] || 'Lagos Maternity'}</span>
                    <span className="text-emerald-700 font-semibold">View Record →</span>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Right Column: Selected Patient Clinical Detail & AI Intelligence Hub (7 cols) */}
        {selectedPatient ? (
          <section className="lg:col-span-7 space-y-5">
            {/* Patient Header Card */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs relative overflow-hidden">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">{selectedPatient.full_name}</h2>
                    <span
                      className={`text-xs font-extrabold uppercase px-3 py-1 rounded-full border ${
                        selectedPatient.current_risk_tier === 'RED'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : selectedPatient.current_risk_tier === 'AMBER'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      {selectedPatient.current_risk_tier} RISK TIER ({selectedPatient.risk_score}/100)
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-2">
                    <span className="font-mono bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-slate-700">
                      ID: {selectedPatient.health_id}
                    </span>
                    <span>📞 {selectedPatient.phone}</span>
                    <span>📍 {selectedPatient.address}</span>
                  </div>
                </div>

                {/* Top Action Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/clinician/visit?patient_id=${selectedPatient.health_id}`}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition shadow-sm flex items-center gap-1.5"
                  >
                    <span>📝</span> Log Clinical Visit
                  </Link>

                  <button
                    onClick={() => setShowReferralModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition flex items-center gap-1.5"
                  >
                    <span>🏥</span> Specialist Referral
                  </button>

                  <a
                    href={`/api/fhir?patient_id=${selectedPatient.health_id}`}
                    download
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-3 py-2 rounded-xl border border-slate-300 transition flex items-center gap-1.5"
                    title="Download HL7 FHIR R4 Bundle for Helium Health / EMR import"
                  >
                    <span>📥</span> FHIR Export
                  </a>
                </div>
              </div>

              {/* Maternal Details Banner */}
              {selectedPatient.pathway === 'maternal' && (
                <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-semibold">Gestational Age</span>
                    <span className="font-bold text-emerald-700 text-sm">{selectedPatient.gestational_weeks} Weeks (3rd Trim)</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-semibold">Obstetric History</span>
                    <span className="font-bold text-slate-800">G{selectedPatient.gravida || 2} P{selectedPatient.para || 1}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-semibold">Est. Delivery (EDD)</span>
                    <span className="font-bold text-slate-800">{selectedPatient.edd_date || 'Oct 17, 2026'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-semibold">Assigned CHW</span>
                    <span className="font-bold text-teal-700">{selectedPatient.assigned_chw || 'Amina Bello (CHW)'}</span>
                  </div>
                </div>
              )}
            </div>

            {/* AI Decision Support & Explainable Driving Factors */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🤖</span>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">AI Clinical Decision Support Engine</h3>
                    <p className="text-[11px] text-slate-500">Explainable risk factors & evidence-based next actions</p>
                  </div>
                </div>
                <span className="text-[11px] text-emerald-800 font-mono bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                  Model: Hybrid Gradient Boosting + WHO Protocol
                </span>
              </div>

              {/* Driving Factors Box */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <span>📊</span> Primary Clinical Driving Factors ({selectedPatient.risk_driving_factors.length})
                </h4>
                <div className="space-y-2">
                  {selectedPatient.risk_driving_factors.map((factor, idx) => (
                    <div
                      key={idx}
                      className="text-xs bg-slate-50 border border-slate-200 p-3 rounded-xl flex items-start gap-2.5 text-slate-800"
                    >
                      <span className="text-rose-600 font-bold mt-0.5">•</span>
                      <p className="leading-relaxed">{factor}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommended Clinical Next Steps */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <span>🎯</span> Evidence-Based Recommended Clinical Actions
                </h4>
                <div className="space-y-2">
                  {selectedPatient.clinical_recommendations.map((rec, idx) => (
                    <div
                      key={idx}
                      className="text-xs bg-emerald-50 border border-emerald-200 p-3 rounded-xl flex items-start gap-2.5 text-emerald-900"
                    >
                      <span className="text-emerald-700 font-bold mt-0.5">✓</span>
                      <p className="leading-relaxed">{rec}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Plain Language Patient Summary View */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold text-teal-700 uppercase tracking-wider">
                    Patient App Translation (Plain-Language View)
                  </span>
                  <span className="text-[10px] text-slate-500">Auto-generated for patient understanding</span>
                </div>
                <p className="text-xs text-slate-700 italic leading-relaxed">
                  "{selectedPatient.patient_summary_plain}"
                </p>
              </div>
            </div>

            {/* Emergency Escalation Protocol Box */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <span>🚨</span> Emergency Escalation & Caregiver Contacts
                </h3>
                <span className="text-[11px] text-slate-500">NDPR-Compliant Continuity Link</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Primary Next of Kin / Caregiver</span>
                  <p className="font-bold text-slate-900 mt-1">{selectedPatient.emergency_contact_name}</p>
                  <p className="text-slate-500 text-[11px]">{selectedPatient.emergency_contact_phone} ({selectedPatient.emergency_contact_relation})</p>
                  <div className="mt-2 flex gap-2">
                    <a
                      href={`tel:${selectedPatient.emergency_contact_phone}`}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded text-[11px] font-semibold"
                    >
                      📞 Direct Call
                    </a>
                    <a
                      href={`https://wa.me/${selectedPatient.emergency_contact_phone.replace(/[^0-9]/g, '')}?text=Hello,%20this%20is%20Materna%20AI%20clinical%20team%20regarding%20${encodeURIComponent(selectedPatient.full_name)}.`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-teal-600 hover:bg-teal-700 text-white px-2.5 py-1 rounded text-[11px] font-semibold"
                    >
                      💬 WhatsApp Alert
                    </a>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Referral & Emergency Lines</span>
                  <p className="font-bold text-rose-800 mt-1">Lagos Island Maternity Emergency</p>
                  <p className="text-slate-500 text-[11px]">Toll-Free Rapid Dispatch: 112 / 767</p>
                  <div className="mt-2">
                    <span className="text-[11px] text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Auto-SLA: 20-min Clinician Callback Guarantee
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        ) : (
          <section className="lg:col-span-7 flex items-center justify-center min-h-[400px] border border-dashed border-slate-300 rounded-3xl text-slate-500 text-sm">
            Select a patient from the roster to review clinical intelligence and actions.
          </section>
        )}
      </main>

      {/* Specialist Referral Modal */}
      {showReferralModal && selectedPatient && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Pre-Triaged Specialist Referral</h3>
                <p className="text-xs text-slate-500">Attach structured clinical history & FHIR summary</p>
              </div>
              <button onClick={() => setShowReferralModal(false)} className="text-slate-400 hover:text-slate-600 text-lg">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Patient</label>
                <input
                  type="text"
                  disabled
                  value={`${selectedPatient.full_name} (${selectedPatient.health_id}) - ${selectedPatient.gestational_weeks}w Gestation`}
                  className="w-full bg-slate-100 border border-slate-300 rounded-xl px-3 py-2 text-slate-700"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Destination Facility</label>
                <select className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900">
                  <option>Lagos University Teaching Hospital (LUTH) - Maternal-Fetal Unit</option>
                  <option>National Hospital Abuja - High-Risk Obstetrics</option>
                  <option>Aminu Kano Teaching Hospital (AKTH) - Cardiology</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Clinical Indication / Handover Note</label>
                <textarea
                  rows={4}
                  defaultValue={`Urgent transfer for 27yo G2P1 at 32 weeks with rapid blood pressure rise (148/96 mmHg) and 2+ proteinuria. Severe frontal headache. Commenced on Methyldopa 250mg TDS. Requesting consultant obstetric review, formal pre-eclampsia lab panel, and biophysical profile.`}
                  className="w-full bg-white border border-slate-300 rounded-xl p-3 text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-emerald-900">
                <span className="font-bold block">✓ FHIR R4 Bundle Auto-Attached</span>
                <span className="text-[11px] text-emerald-700">
                  Contains all longitudinal vitals (BP, Proteinuria, Fetal HR), medication list, and allergy data.
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowReferralModal(false)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  alert(`Referral REF-LUTH-2026-${Math.floor(100 + Math.random() * 900)} successfully submitted to LUTH Maternal-Fetal Medicine Unit!`)
                  setShowReferralModal(false)
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2 rounded-xl text-xs transition shadow-sm"
              >
                Submit Referral & Notify Specialist
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Patient Registration Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form onSubmit={handleRegisterPatient} className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Register New Patient</h3>
                <p className="text-xs text-slate-500">Initiate Maternal or Chronic Care Pathway</p>
              </div>
              <button type="button" onClick={() => setShowRegisterModal(false)} className="text-slate-400 hover:text-slate-600 text-lg">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Fatima Mohammed"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Age</label>
                  <input
                    type="number"
                    value={newAge}
                    onChange={(e) => setNewAge(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Care Pathway</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewPathway('maternal')}
                    className={`py-2 px-3 rounded-xl font-bold border transition ${
                      newPathway === 'maternal'
                        ? 'bg-rose-50 border-rose-500 text-rose-800'
                        : 'bg-white border-slate-300 text-slate-600'
                    }`}
                  >
                    🤰 Maternal (Antenatal)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewPathway('chronic')}
                    className={`py-2 px-3 rounded-xl font-bold border transition ${
                      newPathway === 'chronic'
                        ? 'bg-blue-50 border-blue-500 text-blue-800'
                        : 'bg-white border-slate-300 text-slate-600'
                    }`}
                  >
                    🩺 Chronic Disease
                  </button>
                </div>
              </div>

              {newPathway === 'maternal' ? (
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Current Gestational Weeks</label>
                  <input
                    type="number"
                    min={1}
                    max={42}
                    value={newWeeks}
                    onChange={(e) => setNewWeeks(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Chronic Condition(s)</label>
                  <input
                    type="text"
                    placeholder="e.g. Hypertension, Type 2 Diabetes, Sickle Cell"
                    value={newConditions}
                    onChange={(e) => setNewConditions(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowRegisterModal(false)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2 rounded-xl text-xs transition shadow-sm"
              >
                Save & Open Record
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
