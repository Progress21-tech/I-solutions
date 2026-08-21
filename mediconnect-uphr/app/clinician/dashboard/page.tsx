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
      gender: newPathway === 'maternal' ? 'female' : 'female',
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
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans">
      {/* Top Navigation */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-40 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-black text-slate-950 text-xl shadow-lg shadow-emerald-500/20">
              M
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-white tracking-tight">Materna AI</span>
                <span className="text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  CLINICAL PORTAL
                </span>
              </div>
              <p className="text-xs text-slate-400">Hospital & Specialist Care Continuity</p>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/chw"
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition flex items-center gap-1.5"
          >
            <span>🏡</span> CHW Field Mode
          </Link>
          <Link
            href="/offline-channels"
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-teal-950 text-teal-300 border border-teal-800/50 hover:bg-teal-900 transition flex items-center gap-1.5"
          >
            <span>📱</span> WhatsApp & USSD Simulator
          </Link>
          <div className="h-4 w-px bg-slate-800 mx-1" />
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-slate-200">Dr. Bello Adeyemi / Nurse Ifeoma</p>
            <p className="text-[11px] text-slate-400">Lagos Island Maternity & LUTH</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-emerald-400">
            DR
          </div>
        </div>
      </header>

      {/* Emergency Triage Banner (When active RED patient needs attention) */}
      {!slaAcknowledged && patients.some((p) => p.current_risk_tier === 'RED') && (
        <div className="bg-gradient-to-r from-rose-950 via-rose-900 to-rose-950 border-b border-rose-700/60 px-6 py-3 text-rose-100 flex flex-wrap items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center gap-3">
            <span className="text-2xl animate-bounce">🚨</span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm uppercase tracking-wider text-rose-300">
                  RED-TIER PRE-ECLAMPSIA ESCALATION DETECTED
                </span>
                <span className="bg-rose-500/30 text-rose-200 text-xs px-2 py-0.5 rounded-full font-mono font-bold">
                  SLA: {slaCountdown}m Remaining
                </span>
              </div>
              <p className="text-xs text-rose-200 mt-0.5">
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
              className="bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold px-3.5 py-1.5 rounded-lg text-xs transition shadow-lg"
            >
              Dispatch Specialist Referral (LUTH)
            </button>
            <button
              onClick={() => setSlaAcknowledged(true)}
              className="bg-rose-900/60 hover:bg-rose-800/80 text-rose-200 border border-rose-600 px-3 py-1.5 rounded-lg text-xs transition font-semibold"
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
                  ? 'bg-rose-950/80 border-rose-500 ring-2 ring-rose-500/40'
                  : 'bg-slate-950/60 border-rose-900/40 hover:border-rose-700/60'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">Red Tier</span>
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
              </div>
              <div className="text-2xl font-black text-rose-200 mt-1">{redCount}</div>
              <p className="text-[11px] text-rose-300/80 mt-0.5">High Complication Risk</p>
            </button>

            <button
              onClick={() => setFilterTier(filterTier === 'AMBER' ? 'ALL' : 'AMBER')}
              className={`p-3.5 rounded-2xl border text-left transition ${
                filterTier === 'AMBER'
                  ? 'bg-amber-950/80 border-amber-500 ring-2 ring-amber-500/40'
                  : 'bg-slate-950/60 border-amber-900/40 hover:border-amber-700/60'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Amber Tier</span>
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              </div>
              <div className="text-2xl font-black text-amber-200 mt-1">{amberCount}</div>
              <p className="text-[11px] text-amber-300/80 mt-0.5">Moderate / Watch Closely</p>
            </button>

            <button
              onClick={() => setFilterTier(filterTier === 'GREEN' ? 'ALL' : 'GREEN')}
              className={`p-3.5 rounded-2xl border text-left transition ${
                filterTier === 'GREEN'
                  ? 'bg-emerald-950/80 border-emerald-500 ring-2 ring-emerald-500/40'
                  : 'bg-slate-950/60 border-emerald-900/40 hover:border-emerald-700/60'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Green Tier</span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              </div>
              <div className="text-2xl font-black text-emerald-200 mt-1">{greenCount}</div>
              <p className="text-[11px] text-emerald-300/80 mt-0.5">Stable / Routine Care</p>
            </button>
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <input
                type="text"
                placeholder="Search patient name, Health ID (MAT-...), phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-700/70 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              <button
                onClick={() => setShowRegisterModal(true)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap shadow-md shadow-emerald-900/30"
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
                    ? 'bg-slate-800 text-white border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All Patients ({patients.length})
              </button>
              <button
                onClick={() => setFilterPathway('maternal')}
                className={`px-3 py-1 rounded-lg transition ${
                  filterPathway === 'maternal'
                    ? 'bg-pink-950/60 text-pink-300 border border-pink-800/60'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                🤰 Maternal (ANC)
              </button>
              <button
                onClick={() => setFilterPathway('chronic')}
                className={`px-3 py-1 rounded-lg transition ${
                  filterPathway === 'chronic'
                    ? 'bg-blue-950/60 text-blue-300 border border-blue-800/60'
                    : 'text-slate-400 hover:text-slate-200'
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
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  : patient.current_risk_tier === 'AMBER'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'

              return (
                <div
                  key={patient.id}
                  onClick={() => setSelectedPatient(patient)}
                  className={`p-4 rounded-2xl border cursor-pointer transition text-left relative ${
                    isSelected
                      ? 'bg-slate-800/90 border-emerald-500/80 shadow-lg shadow-emerald-950/40 ring-1 ring-emerald-500/30'
                      : 'bg-slate-950/50 border-slate-800/80 hover:bg-slate-900/60 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white">{patient.full_name}</span>
                        <span className="text-[11px] font-mono text-slate-400">({patient.health_id})</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {patient.pathway === 'maternal'
                          ? `🤰 ${patient.gestational_weeks}w Gestation · Age ${patient.age}`
                          : `🩺 Chronic Care · Age ${patient.age}`}
                        {' · '}
                        <span className="text-slate-300 font-semibold">{patient.blood_group} ({patient.genotype})</span>
                      </p>
                    </div>

                    <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${tierBadgeColor}`}>
                      {patient.current_risk_tier} TIER
                    </span>
                  </div>

                  {/* Primary Driving Factors preview */}
                  <p className="text-xs text-slate-300 mt-2.5 line-clamp-2 bg-slate-900/70 p-2 rounded-lg border border-slate-800/60">
                    🔍 <strong>Key Driver:</strong> {patient.risk_driving_factors[0] || 'Parameters within normal reference'}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2.5 pt-2 border-t border-slate-800/60">
                    <span>Facility: {patient.assigned_facility?.split('&')[0] || 'Lagos Maternity'}</span>
                    <span className="text-emerald-400 font-semibold">View Record →</span>
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
            <div className="bg-slate-950/80 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-black text-white tracking-tight">{selectedPatient.full_name}</h2>
                    <span
                      className={`text-xs font-extrabold uppercase px-3 py-1 rounded-full border ${
                        selectedPatient.current_risk_tier === 'RED'
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          : selectedPatient.current_risk_tier === 'AMBER'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      }`}
                    >
                      {selectedPatient.current_risk_tier} RISK TIER ({selectedPatient.risk_score}/100)
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-2">
                    <span className="font-mono bg-slate-900 px-2 py-0.5 rounded border border-slate-800 text-slate-300">
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
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition shadow-md shadow-emerald-950 flex items-center gap-1.5"
                  >
                    <span>📝</span> Log Clinical Visit
                  </Link>

                  <button
                    onClick={() => setShowReferralModal(true)}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition flex items-center gap-1.5"
                  >
                    <span>🏥</span> Specialist Referral
                  </button>

                  <a
                    href={`/api/fhir?patient_id=${selectedPatient.health_id}`}
                    download
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs px-3 py-2 rounded-xl border border-slate-700 transition flex items-center gap-1.5"
                    title="Download HL7 FHIR R4 Bundle for Helium Health / EMR import"
                  >
                    <span>📥</span> FHIR Export
                  </a>
                </div>
              </div>

              {/* Maternal Details Banner */}
              {selectedPatient.pathway === 'maternal' && (
                <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800/80 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Gestational Age</span>
                    <span className="font-bold text-emerald-400 text-sm">{selectedPatient.gestational_weeks} Weeks (3rd Trim)</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Obstetric History</span>
                    <span className="font-bold text-slate-200">G{selectedPatient.gravida || 2} P{selectedPatient.para || 1}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Est. Delivery (EDD)</span>
                    <span className="font-bold text-slate-200">{selectedPatient.edd_date || 'Oct 17, 2026'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Assigned CHW</span>
                    <span className="font-bold text-teal-300">{selectedPatient.assigned_chw || 'Amina Bello (CHW)'}</span>
                  </div>
                </div>
              )}
            </div>

            {/* AI Decision Support & Explainable Driving Factors */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-3xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🤖</span>
                  <div>
                    <h3 className="font-bold text-sm text-white">AI Clinical Decision Support Engine</h3>
                    <p className="text-[11px] text-slate-400">Explainable risk factors & evidence-based next actions</p>
                  </div>
                </div>
                <span className="text-[11px] text-emerald-400 font-mono bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-800/40">
                  Model: Hybrid Gradient Boosting + WHO Protocol
                </span>
              </div>

              {/* Driving Factors Box */}
              <div>
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <span>📊</span> Primary Clinical Driving Factors ({selectedPatient.risk_driving_factors.length})
                </h4>
                <div className="space-y-2">
                  {selectedPatient.risk_driving_factors.map((factor, idx) => (
                    <div
                      key={idx}
                      className="text-xs bg-slate-900/90 border border-slate-800 p-3 rounded-xl flex items-start gap-2.5 text-slate-200"
                    >
                      <span className="text-rose-400 font-bold mt-0.5">•</span>
                      <p className="leading-relaxed">{factor}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommended Clinical Next Steps */}
              <div>
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <span>🎯</span> Evidence-Based Recommended Clinical Actions
                </h4>
                <div className="space-y-2">
                  {selectedPatient.clinical_recommendations.map((rec, idx) => (
                    <div
                      key={idx}
                      className="text-xs bg-emerald-950/20 border border-emerald-800/30 p-3 rounded-xl flex items-start gap-2.5 text-emerald-200"
                    >
                      <span className="text-emerald-400 font-bold mt-0.5">✓</span>
                      <p className="leading-relaxed">{rec}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Plain Language Patient Summary View */}
              <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-2xl">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold text-teal-400 uppercase tracking-wider">
                    Patient App Translation (Plain-Language View)
                  </span>
                  <span className="text-[10px] text-slate-500">Auto-generated for patient understanding</span>
                </div>
                <p className="text-xs text-slate-300 italic leading-relaxed">
                  "{selectedPatient.patient_summary_plain}"
                </p>
              </div>
            </div>

            {/* Emergency Escalation Protocol Box */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-3xl p-6 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <span>🚨</span> Emergency Escalation & Caregiver Contacts
                </h3>
                <span className="text-[11px] text-slate-400">NDPR-Compliant Continuity Link</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Primary Next of Kin / Caregiver</span>
                  <p className="font-bold text-slate-200 mt-1">{selectedPatient.emergency_contact_name}</p>
                  <p className="text-slate-400 text-[11px]">{selectedPatient.emergency_contact_phone} ({selectedPatient.emergency_contact_relation})</p>
                  <div className="mt-2 flex gap-2">
                    <a
                      href={`tel:${selectedPatient.emergency_contact_phone}`}
                      className="bg-emerald-700 hover:bg-emerald-600 text-white px-2.5 py-1 rounded text-[11px] font-semibold"
                    >
                      📞 Direct Call
                    </a>
                    <a
                      href={`https://wa.me/${selectedPatient.emergency_contact_phone.replace(/[^0-9]/g, '')}?text=Hello,%20this%20is%20Materna%20AI%20clinical%20team%20regarding%20${encodeURIComponent(selectedPatient.full_name)}.`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-teal-700 hover:bg-teal-600 text-white px-2.5 py-1 rounded text-[11px] font-semibold"
                    >
                      💬 WhatsApp Alert
                    </a>
                  </div>
                </div>

                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Referral & Emergency Lines</span>
                  <p className="font-bold text-rose-300 mt-1">Lagos Island Maternity Emergency</p>
                  <p className="text-slate-400 text-[11px]">Toll-Free Rapid Dispatch: 112 / 767</p>
                  <div className="mt-2">
                    <span className="text-[11px] text-emerald-400 font-semibold bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/30">
                      Auto-SLA: 20-min Clinician Callback Guarantee
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        ) : (
          <section className="lg:col-span-7 flex items-center justify-center min-h-[400px] border border-dashed border-slate-800 rounded-3xl text-slate-500 text-sm">
            Select a patient from the roster to review clinical intelligence and actions.
          </section>
        )}
      </main>

      {/* Specialist Referral Modal */}
      {showReferralModal && selectedPatient && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white">Pre-Triaged Specialist Referral</h3>
                <p className="text-xs text-slate-400">Attach structured clinical history & FHIR summary</p>
              </div>
              <button onClick={() => setShowReferralModal(false)} className="text-slate-400 hover:text-white text-lg">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Patient</label>
                <input
                  type="text"
                  disabled
                  value={`${selectedPatient.full_name} (${selectedPatient.health_id}) - ${selectedPatient.gestational_weeks}w Gestation`}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-300"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Destination Facility</label>
                <select className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white">
                  <option>Lagos University Teaching Hospital (LUTH) - Maternal-Fetal Unit</option>
                  <option>National Hospital Abuja - High-Risk Obstetrics</option>
                  <option>Aminu Kano Teaching Hospital (AKTH) - Cardiology</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Clinical Indication / Handover Note</label>
                <textarea
                  rows={4}
                  defaultValue={`Urgent transfer for 27yo G2P1 at 32 weeks with rapid blood pressure rise (148/96 mmHg) and 2+ proteinuria. Severe frontal headache. Commenced on Methyldopa 250mg TDS. Requesting consultant obstetric review, formal pre-eclampsia lab panel, and biophysical profile.`}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="bg-emerald-950/30 border border-emerald-800/40 p-3 rounded-xl text-emerald-200">
                <span className="font-bold block">✓ FHIR R4 Bundle Auto-Attached</span>
                <span className="text-[11px] text-emerald-300/80">
                  Contains all longitudinal vitals (BP, Proteinuria, Fetal HR), medication list, and allergy data.
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowReferralModal(false)}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  alert(`Referral REF-LUTH-2026-${Math.floor(100 + Math.random() * 900)} successfully submitted to LUTH Maternal-Fetal Medicine Unit!`)
                  setShowReferralModal(false)
                }}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2 rounded-xl text-xs transition shadow-lg"
              >
                Submit Referral & Notify Specialist
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Patient Registration Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleRegisterPatient} className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white">Register New Patient</h3>
                <p className="text-xs text-slate-400">Initiate Maternal or Chronic Care Pathway</p>
              </div>
              <button type="button" onClick={() => setShowRegisterModal(false)} className="text-slate-400 hover:text-white text-lg">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Fatima Mohammed"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Age</label>
                  <input
                    type="number"
                    value={newAge}
                    onChange={(e) => setNewAge(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Care Pathway</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewPathway('maternal')}
                    className={`py-2 px-3 rounded-xl font-bold border transition ${
                      newPathway === 'maternal'
                        ? 'bg-pink-950 border-pink-500 text-pink-200'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    🤰 Maternal (Antenatal)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewPathway('chronic')}
                    className={`py-2 px-3 rounded-xl font-bold border transition ${
                      newPathway === 'chronic'
                        ? 'bg-blue-950 border-blue-500 text-blue-200'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    🩺 Chronic Disease
                  </button>
                </div>
              </div>

              {newPathway === 'maternal' ? (
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Current Gestational Weeks</label>
                  <input
                    type="number"
                    min={1}
                    max={42}
                    value={newWeeks}
                    onChange={(e) => setNewWeeks(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Chronic Condition(s)</label>
                  <input
                    type="text"
                    placeholder="e.g. Hypertension, Type 2 Diabetes, Sickle Cell"
                    value={newConditions}
                    onChange={(e) => setNewConditions(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowRegisterModal(false)}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2 rounded-xl text-xs transition shadow-lg"
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
