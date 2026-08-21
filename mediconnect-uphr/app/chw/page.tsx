'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  PatientRecord,
  getStoredPatients,
  savePatientRecord
} from '@/lib/data/records-data'

export default function CHWFieldPortal() {
  const [patients, setPatients] = useState<PatientRecord[]>([])
  const [selectedPatient, setSelectedPatient] = useState<PatientRecord | null>(null)
  const [systolic, setSystolic] = useState('146')
  const [diastolic, setDiastolic] = useState('94')
  const [pillsRemaining, setPillsRemaining] = useState('4')
  const [fieldNotes, setFieldNotes] = useState('Home visit in Makoko outreach cluster. Patient reports mild headache.')
  const [loggedSuccess, setLoggedSuccess] = useState(false)
  const [escalated, setEscalated] = useState(false)

  useEffect(() => {
    const list = getStoredPatients()
    setPatients(list)
    if (list.length > 0) setSelectedPatient(list[0])
  }, [])

  const handleLogHomeVisit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPatient) return

    const sys = Number(systolic)
    const dia = Number(diastolic)
    const pills = Number(pillsRemaining)

    const updated = {
      ...selectedPatient,
      risk_driving_factors: [
        `CHW Field Reading: BP ${sys}/${dia} mmHg (${pills} pills remaining). ${fieldNotes}`,
        ...selectedPatient.risk_driving_factors.slice(0, 2)
      ],
      current_risk_tier: (sys >= 140 || dia >= 90 ? 'RED' : selectedPatient.current_risk_tier) as any
    }

    savePatientRecord(updated)
    setPatients(getStoredPatients())
    setSelectedPatient(updated)
    setLoggedSuccess(true)
    setTimeout(() => setLoggedSuccess(false), 2500)
  }

  const handleEscalateToNurse = () => {
    if (!selectedPatient) return
    setEscalated(true)
    alert(`🚨 Escalation sent to Nurse Ifeoma Eze (Lagos Island Maternity Triage) for ${selectedPatient.full_name}. Priority callback queued.`)
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-16">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-slate-500 hover:text-slate-800 text-xs font-bold">
            ← Main
          </Link>
          <span className="text-slate-300">/</span>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-slate-900 text-sm">Community Health Worker (CHW) Field Portal</h1>
              <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
            </div>
            <p className="text-[11px] text-teal-700 font-semibold">Offline-Ready Field Outreach & Home BP Sync</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Worker: <strong className="text-slate-800">Amina Bello (CHW-LAG-09)</strong></span>
          <Link
            href="/clinician/dashboard"
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-3 py-1.5 rounded-xl border border-slate-300 transition"
          >
            Hospital Dashboard ↗
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Column: Assigned Patient Roster (5 cols) */}
        <section className="md:col-span-5 space-y-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-3 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h2 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
                Assigned Community Mothers ({patients.length})
              </h2>
              <span className="text-[10px] text-teal-700 font-bold bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full">
                Cluster: Lagos Island / Makoko
              </span>
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {patients.map((p) => {
                const isSelected = selectedPatient?.id === p.id
                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPatient(p)}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition text-xs ${
                      isSelected
                        ? 'bg-teal-50/70 border-teal-500 ring-2 ring-teal-200'
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-bold text-slate-900">{p.full_name}</p>
                        <p className="text-slate-500 text-[11px]">
                          {p.pathway === 'maternal' ? `32w Gestation · ${p.phone}` : `Chronic Care · ${p.phone}`}
                        </p>
                      </div>
                      <span
                        className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                          p.current_risk_tier === 'RED'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : p.current_risk_tier === 'AMBER'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}
                      >
                        {p.current_risk_tier}
                      </span>
                    </div>

                    <p className="text-slate-500 text-[11px] mt-2 line-clamp-1">
                      📍 {p.address}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Right Column: Home Visit Logging & Escalation (7 cols) */}
        {selectedPatient && (
          <section className="md:col-span-7 space-y-5">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-bold text-base text-slate-900">{selectedPatient.full_name}</h3>
                  <p className="text-xs text-slate-500">ID: {selectedPatient.health_id} · {selectedPatient.phone}</p>
                </div>
                <button
                  onClick={handleEscalateToNurse}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition shadow-xs flex items-center gap-1.5"
                >
                  <span>🚨</span> Escalate to Hospital Nurse
                </button>
              </div>

              {loggedSuccess && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-3.5 rounded-2xl text-xs">
                  ✓ Field visit reading successfully recorded and synced to Dr. Bello's hospital dashboard.
                </div>
              )}

              {/* Form for Portable Cuff Log */}
              <form onSubmit={handleLogHomeVisit} className="space-y-4 text-xs">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                  <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px] block">
                    Portable Bluetooth/Manual BP Cuff Reading
                  </span>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Systolic (mmHg)</label>
                      <input
                        type="number"
                        value={systolic}
                        onChange={(e) => setSystolic(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Diastolic (mmHg)</label>
                      <input
                        type="number"
                        value={diastolic}
                        onChange={(e) => setDiastolic(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                  <label className="block text-slate-700 font-bold">
                    Pill Count & Adherence Verification
                  </label>
                  <p className="text-slate-500 text-[11px]">Check how many Methyldopa tablets remain in patient's blister pack:</p>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      value={pillsRemaining}
                      onChange={(e) => setPillsRemaining(e.target.value)}
                      className="w-24 bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono text-sm"
                    />
                    <span className="text-slate-500 text-xs">Tablets remaining (Refill alert triggers at &le; 5)</span>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">CHW Field Observations & Symptoms</label>
                  <textarea
                    rows={3}
                    value={fieldNotes}
                    onChange={(e) => setFieldNotes(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-3 text-slate-900 focus:outline-none focus:border-teal-600"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-2xl transition shadow-xs text-sm"
                >
                  💾 Save & Sync Home Visit
                </button>
              </form>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
