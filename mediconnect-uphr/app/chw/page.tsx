'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  PatientRecord,
  SelfLoggedReading,
  addSelfLoggedReading,
  getStoredPatients,
  savePatientRecord
} from '@/lib/data/records-data'

export default function CHWPortal() {
  const [patients, setPatients] = useState<PatientRecord[]>([])
  const [selectedPatient, setSelectedPatient] = useState<PatientRecord | null>(null)
  const [homeBpSystolic, setHomeBpSystolic] = useState('144')
  const [homeBpDiastolic, setHomeBpDiastolic] = useState('92')
  const [pillsRemaining, setPillsRemaining] = useState('4')
  const [homeNotes, setHomeNotes] = useState('Patient resting in bed. Observed mild facial puffiness.')
  const [savedSuccess, setSavedSuccess] = useState(false)
  const [escalated, setEscalated] = useState(false)

  useEffect(() => {
    const list = getStoredPatients()
    setPatients(list)
    if (list.length > 0) setSelectedPatient(list[0])
  }, [])

  const handleSaveHomeVisit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPatient) return

    const sys = Number(homeBpSystolic)
    const dia = Number(homeBpDiastolic)
    const isRed = sys >= 140 || dia >= 90

    const newLog: SelfLoggedReading = {
      id: `chw-log-${Date.now()}`,
      patient_id: selectedPatient.id,
      timestamp: new Date().toISOString(),
      reading_type: 'blood_pressure',
      systolic: sys,
      diastolic: dia,
      notes: `CHW Home Visit by Amina Bello: ${homeNotes}. Pills count: ${pillsRemaining} remaining.`,
      ai_feedback: isRed
        ? 'BP remains in elevated hypertensive range during CHW home visit. Community worker notified supervising nurse.'
        : 'Vitals stable during home visit.',
      is_flagged_red: isRed
    }

    addSelfLoggedReading(newLog)
    setSavedSuccess(true)
    setTimeout(() => setSavedSuccess(false), 2500)
  }

  const handleEscalateToNurse = () => {
    if (!selectedPatient) return
    selectedPatient.has_active_emergency = true
    selectedPatient.emergency_reason = `CHW Field Escalation: BP ${homeBpSystolic}/${homeBpDiastolic} + Low pill supply (${pillsRemaining} left)`
    selectedPatient.emergency_sla_minutes_left = 20
    savePatientRecord(selectedPatient)
    setEscalated(true)
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-12">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Link href="/clinician/dashboard" className="text-slate-400 hover:text-white text-xs font-bold">
            ← Hospital Portal
          </Link>
          <span className="text-slate-600">/</span>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-teal-500 flex items-center justify-center text-slate-950 font-bold text-sm">
              🏡
            </div>
            <div>
              <h1 className="font-bold text-white text-sm">Materna AI — Community Health Worker (CHW) Field Portal</h1>
              <p className="text-[11px] text-teal-400">Offline-Enabled Outreach & Home Visits</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="bg-emerald-950 text-emerald-400 border border-emerald-800/40 text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Field Mode Ready (Offline-Sync)
          </span>
          <span className="text-xs text-slate-300 font-semibold hidden sm:inline">CHW Amina Bello (Lagos Zone 4)</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Top Explainer */}
        <div className="bg-gradient-to-r from-teal-950/70 via-slate-900 to-slate-900 border border-teal-800/40 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="font-bold text-teal-300 text-xs uppercase tracking-wider">
              Community Outreach & Home Follow-up
            </span>
            <p className="text-xs text-slate-300 mt-1">
              Registered CHWs log in-person vitals, inspect pill counts, and trigger instantaneous escalation to hospital nurses.
            </p>
          </div>
          <Link
            href="/offline-channels"
            className="bg-teal-700 hover:bg-teal-600 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition shadow"
          >
            Launch WhatsApp & USSD Simulator →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Assigned Households List (4 cols) */}
          <div className="md:col-span-5 space-y-3">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Assigned Community Households ({patients.length})
            </h2>

            <div className="space-y-2">
              {patients.map((p) => {
                const active = selectedPatient?.id === p.id
                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPatient(p)}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition text-left ${
                      active
                        ? 'bg-slate-800 border-teal-500 shadow-md ring-1 ring-teal-500/40'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-white">{p.full_name}</span>
                      <span
                        className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                          p.current_risk_tier === 'RED'
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                            : p.current_risk_tier === 'AMBER'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        }`}
                      >
                        {p.current_risk_tier}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{p.address}</p>
                    <p className="text-[11px] text-teal-400 mt-1 font-mono">ID: {p.health_id}</p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* CHW Quick Visit Form (7 cols) */}
          {selectedPatient && (
            <div className="md:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="font-bold text-base text-white">Log Home Visit for {selectedPatient.full_name}</h3>
                  <p className="text-xs text-slate-400">
                    {selectedPatient.pathway === 'maternal'
                      ? `🤰 ${selectedPatient.gestational_weeks}w Gestation`
                      : '🩺 Chronic Care'} · Phone: {selectedPatient.phone}
                  </p>
                </div>
                <span className="text-xs bg-slate-800 text-slate-300 px-3 py-1 rounded-xl">
                  {selectedPatient.blood_group} ({selectedPatient.genotype})
                </span>
              </div>

              {/* Alert if escalated */}
              {escalated && (
                <div className="bg-rose-950 border border-rose-600 text-rose-200 p-3.5 rounded-2xl text-xs font-semibold animate-pulse">
                  🚨 <strong>Hospital Escalation Sent!</strong> Nurse Ifeoma at Lagos Island Maternity has received an urgent callback alert. 20-minute callback SLA is now active.
                </div>
              )}

              <form onSubmit={handleSaveHomeVisit} className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">
                      Portable Cuff Systolic BP (mmHg)
                    </label>
                    <input
                      type="number"
                      value={homeBpSystolic}
                      onChange={(e) => setHomeBpSystolic(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-mono text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">
                      Diastolic BP (mmHg)
                    </label>
                    <input
                      type="number"
                      value={homeBpDiastolic}
                      onChange={(e) => setHomeBpDiastolic(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-mono text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    Medication Adherence (Pills Remaining in Pack)
                  </label>
                  <input
                    type="number"
                    value={pillsRemaining}
                    onChange={(e) => setPillsRemaining(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                    placeholder="e.g. 4 tablets left"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    If &lt; 5 pills remain, an automated refill delivery prompt will be sent to the patient.
                  </p>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    CHW Field Notes & Observed Symptoms
                  </label>
                  <textarea
                    rows={3}
                    value={homeNotes}
                    onChange={(e) => setHomeNotes(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleEscalateToNurse}
                    className="bg-rose-700 hover:bg-rose-600 text-white font-bold px-4 py-2.5 rounded-xl transition flex items-center gap-1.5"
                  >
                    <span>🚨</span> Escalate to Hospital Nurse
                  </button>

                  <button
                    type="submit"
                    className="bg-teal-600 hover:bg-teal-500 text-white font-bold px-6 py-2.5 rounded-xl transition shadow-lg flex items-center gap-1.5"
                  >
                    {savedSuccess ? '✓ Home Reading Logged!' : '💾 Save Field Log'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
