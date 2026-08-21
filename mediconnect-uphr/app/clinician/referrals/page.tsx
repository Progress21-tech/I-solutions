'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  SpecialistReferral,
  getStoredReferrals
} from '@/lib/data/records-data'

export default function SpecialistReferralsPage() {
  const [referrals, setReferrals] = useState<SpecialistReferral[]>([])
  const [selectedReferral, setSelectedReferral] = useState<SpecialistReferral | null>(null)

  useEffect(() => {
    const list = getStoredReferrals()
    setReferrals(list)
    if (list.length > 0) setSelectedReferral(list[0])
  }, [])

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans pb-16">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Link href="/clinician/dashboard" className="text-slate-400 hover:text-white text-xs font-bold">
            ← Dashboard
          </Link>
          <span className="text-slate-600">/</span>
          <div>
            <h1 className="font-bold text-white text-sm">Specialist Referrals & FHIR Interoperability Hub</h1>
            <p className="text-[11px] text-emerald-400">Pre-Triaged Hospital Referrals & IPS Export</p>
          </div>
        </div>

        <span className="text-xs bg-slate-800 text-slate-300 font-semibold px-3 py-1.5 rounded-xl border border-slate-700">
          Lagos Maternity ↔ LUTH Referral Bridge
        </span>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Referrals List (5 cols) */}
        <section className="lg:col-span-5 space-y-3">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Active Pre-Triaged Referrals ({referrals.length})
          </h2>

          <div className="space-y-2.5">
            {referrals.map((ref) => {
              const isSelected = selectedReferral?.id === ref.id
              return (
                <div
                  key={ref.id}
                  onClick={() => setSelectedReferral(ref)}
                  className={`p-4 rounded-2xl border cursor-pointer transition text-left ${
                    isSelected
                      ? 'bg-slate-800 border-blue-500 ring-1 ring-blue-500/40 shadow-lg'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-white">{ref.patient_name}</span>
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                        ref.risk_tier === 'RED'
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      }`}
                    >
                      {ref.urgency}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 mt-1 font-mono">{ref.referral_code}</p>
                  <p className="text-xs text-slate-300 mt-1.5 line-clamp-2">{ref.reason_for_referral}</p>

                  <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Target: {ref.target_facility}</span>
                    <span className="text-blue-400 font-semibold">View Details →</span>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Right Column: Referral Summary & FHIR Payload (7 cols) */}
        {selectedReferral && (
          <section className="lg:col-span-7 space-y-5">
            <div className="bg-slate-950/80 border border-slate-800 rounded-3xl p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div>
                  <span className="text-xs font-mono font-bold text-blue-400">{selectedReferral.referral_code}</span>
                  <h3 className="text-xl font-bold text-white mt-0.5">{selectedReferral.patient_name}</h3>
                </div>

                <a
                  href={`/api/fhir?patient_id=${selectedReferral.patient_health_id}`}
                  download
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition shadow flex items-center gap-1.5"
                >
                  <span>📥</span> Download FHIR Bundle JSON
                </a>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-900 p-3.5 rounded-2xl border border-slate-800">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Referring Clinician</span>
                  <p className="font-bold text-slate-200 mt-0.5">{selectedReferral.referring_clinician}</p>
                  <p className="text-slate-400 text-[11px]">{selectedReferral.referring_facility}</p>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Receiving Facility / Specialty</span>
                  <p className="font-bold text-slate-200 mt-0.5">{selectedReferral.target_facility}</p>
                  <p className="text-slate-400 text-[11px]">{selectedReferral.target_specialty}</p>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Clinical Summary & Indication
                </h4>
                <p className="text-xs text-slate-200 leading-relaxed bg-slate-900 p-4 rounded-2xl border border-slate-800">
                  {selectedReferral.clinical_summary}
                </p>
              </div>

              {/* FHIR JSON Preview */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                    HL7 FHIR R4 Bundle (Helium Health & EMR Compatible)
                  </h4>
                  <span className="text-[10px] text-slate-500 font-mono">Format: application/fhir+json</span>
                </div>
                <pre className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-[11px] font-mono text-emerald-300 overflow-x-auto max-h-60 leading-relaxed">
                  {selectedReferral.fhir_bundle_json || '{"resourceType": "Bundle", "type": "document"}'}
                </pre>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
