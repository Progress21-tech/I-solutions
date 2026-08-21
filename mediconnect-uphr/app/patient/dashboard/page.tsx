'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { QRCodeSVG } from 'qrcode.react'
import {
  PatientRecord,
  ClinicalVisit,
  getStoredPatients,
  getStoredVisits,
  savePatientRecord
} from '@/lib/data/records-data'

export default function PatientDashboard() {
  const router = useRouter()
  const [patient, setPatient] = useState<PatientRecord | null>(null)
  const [visits, setVisits] = useState<ClinicalVisit[]>([])
  const [showCaregiverModal, setShowCaregiverModal] = useState(false)
  const [caregiverName, setCaregiverName] = useState('Chidi Johnson')
  const [caregiverPhone, setCaregiverPhone] = useState('+234 802 333 4455')
  const [caregiverRelation, setCaregiverRelation] = useState('Spouse / Husband')
  const [caregiverSaved, setCaregiverSaved] = useState(false)

  useEffect(() => {
    const list = getStoredPatients()
    const found = list.find((p) => p.health_id === 'MAT-AMK-2026') || list[0]
    if (found) {
      setPatient(found)
      const v = getStoredVisits(found.id)
      setVisits(v)
    }
  }, [])

  const handleSwitchPersona = (healthId: string) => {
    const list = getStoredPatients()
    const target = list.find((p) => p.health_id === healthId)
    if (target) {
      setPatient(target)
      setVisits(getStoredVisits(target.id))
    }
  }

  const handleSaveCaregiver = (e: React.FormEvent) => {
    e.preventDefault()
    if (!patient) return
    const updated = {
      ...patient,
      caregivers: [
        {
          name: caregiverName,
          relation: caregiverRelation,
          phone: caregiverPhone,
          permissions: ['emergency_alerts', 'medication_pickup', 'appointment_reminders']
        }
      ]
    }
    savePatientRecord(updated)
    setPatient(updated)
    setCaregiverSaved(true)
    setTimeout(() => {
      setCaregiverSaved(false)
      setShowCaregiverModal(false)
    }, 1500)
  }

  if (!patient) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500">
        Loading your health continuity record...
      </div>
    )
  }

  const isMaternal = patient.pathway === 'maternal'
  const isRedTier = patient.current_risk_tier === 'RED'

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-24">
      {/* Top Navbar */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-30 px-5 py-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-rose-600 flex items-center justify-center font-bold text-white text-sm shadow-sm">
            M
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-sm">Materna AI</span>
              <span className="text-[10px] font-bold bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full border border-rose-200">
                PATIENT APP
              </span>
            </div>
            <p className="text-[11px] text-slate-500">Personal Health & Baby Companion</p>
          </div>
        </div>

        {/* Demo Persona Switcher */}
        <div className="flex items-center gap-2">
          <select
            value={patient.health_id}
            onChange={(e) => handleSwitchPersona(e.target.value)}
            className="bg-white border border-slate-300 text-xs font-semibold text-slate-800 rounded-xl px-2.5 py-1.5 focus:outline-none"
          >
            <option value="MAT-AMK-2026">Amaka (32w Maternal)</option>
            <option value="MAT-MUS-5401">Musa (Chronic HTN/Diabetes)</option>
            <option value="MAT-BLE-1988">Blessing (24w Routine)</option>
          </select>
          <Link
            href="/clinician/dashboard"
            className="text-[11px] font-bold bg-slate-100 text-slate-700 hover:text-slate-900 px-2.5 py-1.5 rounded-xl border border-slate-300 hidden sm:block"
          >
            Hospital View ↗
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-xl mx-auto px-4 pt-5 space-y-5">
        {/* Welcome & Health ID Banner */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs relative overflow-hidden">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-slate-500">Welcome back,</p>
              <h1 className="text-2xl font-black text-slate-900 mt-0.5">{patient.full_name} 👋</h1>
              <p className="text-xs text-slate-700 mt-1 font-mono">
                Health ID: <strong className="text-emerald-700">{patient.health_id}</strong>
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {patient.blood_group} ({patient.genotype}) · {patient.assigned_facility?.split('&')[0]}
              </p>
            </div>

            <div className="bg-white border border-slate-200 p-2 rounded-2xl shadow-xs shrink-0">
              <QRCodeSVG value={`https://materna.ai/record/${patient.health_id}`} size={64} />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Caregiver: <strong className="text-slate-800">{patient.caregivers?.[0]?.name || patient.emergency_contact_name}</strong></span>
            <button
              onClick={() => setShowCaregiverModal(true)}
              className="text-rose-600 font-bold hover:underline"
            >
              Manage Access ⚙️
            </button>
          </div>
        </div>

        {/* AI Plain-Language Health Status Card */}
        <div
          className={`border rounded-3xl p-5 space-y-3 shadow-xs ${
            isRedTier
              ? 'bg-rose-50/70 border-rose-200'
              : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">{isRedTier ? '⚠️' : '✨'}</span>
              <h2 className="font-bold text-sm text-slate-900">Your Health Update in Plain Language</h2>
            </div>
            <span
              className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                isRedTier
                  ? 'bg-rose-100 text-rose-800 border-rose-300'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}
            >
              {isRedTier ? 'Care Alert' : 'On Track'}
            </span>
          </div>

          <p className="text-xs text-slate-700 leading-relaxed bg-white p-3.5 rounded-2xl border border-slate-200">
            "{patient.patient_summary_plain}"
          </p>

          {isRedTier && (
            <div className="flex items-center justify-between gap-2 pt-1">
              <a
                href="tel:112"
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white text-center font-bold text-xs py-2.5 rounded-xl transition shadow-xs"
              >
                🚨 Emergency Call (112)
              </a>
              <Link
                href="/patient/chat"
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-center font-bold text-xs py-2.5 rounded-xl border border-slate-300 transition"
              >
                💬 Ask AI Copilot
              </Link>
            </div>
          )}
        </div>

        {/* Maternal 32-Week Journey Tracker */}
        {isMaternal && (
          <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🤰</span>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Week {patient.gestational_weeks} Pregnancy Journey</h3>
                  <p className="text-[11px] text-rose-600">3rd Trimester · Due {patient.edd_date || 'Oct 17, 2026'}</p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold bg-rose-50 text-rose-700 px-3 py-1 rounded-full border border-rose-200">
                8 Weeks to EDD
              </span>
            </div>

            {/* Baby size and milestone */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Baby Size This Week</span>
                <p className="font-black text-sm text-slate-900 mt-1">🍍 Large Pineapple</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Approx 1.8 kg · 42 cm long</p>
              </div>

              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Development Milestone</span>
                <p className="font-bold text-emerald-700 mt-1">Lungs Practicing Breaths</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Sleep cycles & rapid eye movement</p>
              </div>
            </div>

            {/* Quick Kick Counter action */}
            <div className="flex items-center justify-between bg-rose-50 border border-rose-200 p-3 rounded-2xl">
              <div className="text-xs">
                <span className="font-bold text-rose-900 block">Fetal Kick Counting</span>
                <span className="text-[11px] text-rose-700">Goal: 10 movements in 2 hours</span>
              </div>
              <Link
                href="/patient/log?type=fetal_kicks"
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl transition shadow-xs"
              >
                Count Kicks 🦶
              </Link>
            </div>
          </div>
        )}

        {/* Quick Action Hub (4 Cards) */}
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/patient/medications"
            className="bg-white hover:bg-slate-50 border border-slate-200 p-4 rounded-2xl text-left transition space-y-2 group shadow-xs hover:border-blue-300"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center text-lg">
              💊
            </div>
            <div>
              <h3 className="font-bold text-xs text-slate-900 group-hover:text-blue-700 transition">
                Order Medication & Delivery
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Prescription refills to your doorstep</p>
            </div>
          </Link>

          <Link
            href="/patient/chat"
            className="bg-white hover:bg-slate-50 border border-slate-200 p-4 rounded-2xl text-left transition space-y-2 group shadow-xs hover:border-emerald-300"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center text-lg">
              🤖
            </div>
            <div>
              <h3 className="font-bold text-xs text-slate-900 group-hover:text-emerald-700 transition">
                Ask Materna AI Copilot
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Grounded answers in Pidgin & Yoruba</p>
            </div>
          </Link>

          <Link
            href="/patient/log"
            className="bg-white hover:bg-slate-50 border border-slate-200 p-4 rounded-2xl text-left transition space-y-2 group shadow-xs hover:border-purple-300"
          >
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center text-lg">
              📊
            </div>
            <div>
              <h3 className="font-bold text-xs text-slate-900 group-hover:text-purple-700 transition">
                Log Home BP & Symptoms
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Instant AI risk feedback</p>
            </div>
          </Link>

          <Link
            href="/offline-channels"
            className="bg-white hover:bg-slate-50 border border-slate-200 p-4 rounded-2xl text-left transition space-y-2 group shadow-xs hover:border-teal-300"
          >
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center text-lg">
              📱
            </div>
            <div>
              <h3 className="font-bold text-xs text-slate-900 group-hover:text-teal-700 transition">
                WhatsApp & USSD Access
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Low-data & feature phone fallback</p>
            </div>
          </Link>
        </div>

        {/* Recent Hospital Visit History */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-3 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
              Recent Clinical Visits ({visits.length})
            </h3>
            <span className="text-[11px] text-slate-500">Doctor & Nurse Records</span>
          </div>

          <div className="space-y-2.5">
            {visits.map((v) => (
              <div key={v.id} className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{v.visit_type}</span>
                  <span className="text-[11px] text-slate-500">{new Date(v.visit_date).toLocaleDateString()}</span>
                </div>
                <p className="text-slate-700">
                  BP: <strong className="text-slate-900 font-mono">{v.systolic_bp}/{v.diastolic_bp} mmHg</strong> · Weight: {v.weight_kg}kg
                  {v.proteinuria_dipstick && ` · Protein: ${v.proteinuria_dipstick}`}
                </p>
                <p className="text-[11px] text-slate-500 italic">"{v.clinical_notes}"</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Caregiver Modal */}
      {showCaregiverModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSaveCaregiver} className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-xl text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Caregiver & Family Access</h3>
                <p className="text-slate-500 text-[11px]">Grant limited visibility for reminders and emergency alerts</p>
              </div>
              <button type="button" onClick={() => setShowCaregiverModal(false)} className="text-slate-400 text-base">
                ✕
              </button>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Family Member Name</label>
              <input
                type="text"
                value={caregiverName}
                onChange={(e) => setCaregiverName(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Relationship</label>
              <input
                type="text"
                value={caregiverRelation}
                onChange={(e) => setCaregiverRelation(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Phone Number (for SMS & Emergency WhatsApp)</label>
              <input
                type="tel"
                value={caregiverPhone}
                onChange={(e) => setCaregiverPhone(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
              />
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1 text-slate-700">
              <span className="font-bold text-slate-900 block">Permissions Granted:</span>
              <p>✓ Appointment reminder SMS</p>
              <p>✓ Low-stock medication refill notifications</p>
              <p>✓ Instant Red-Tier emergency alerts</p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCaregiverModal(false)}
                className="px-4 py-2 rounded-xl text-slate-600 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-5 py-2 rounded-xl shadow-xs"
              >
                {caregiverSaved ? '✓ Saved!' : 'Save Caregiver Access'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Bottom Floating Navigation for Patient Mobile App */}
      <nav className="fixed bottom-0 inset-x-0 bg-white/95 border-t border-slate-200 backdrop-blur px-6 py-2.5 flex items-center justify-around z-40 max-w-xl mx-auto shadow-md">
        <Link href="/patient/dashboard" className="text-center text-rose-600 flex flex-col items-center gap-0.5">
          <span className="text-base">🏠</span>
          <span className="text-[10px] font-bold">Home</span>
        </Link>
        <Link href="/patient/medications" className="text-center text-slate-500 hover:text-slate-800 flex flex-col items-center gap-0.5">
          <span className="text-base">💊</span>
          <span className="text-[10px] font-bold">Meds & Refills</span>
        </Link>
        <Link href="/patient/chat" className="text-center text-slate-500 hover:text-slate-800 flex flex-col items-center gap-0.5">
          <span className="text-base">🤖</span>
          <span className="text-[10px] font-bold">AI Copilot</span>
        </Link>
        <Link href="/patient/log" className="text-center text-slate-500 hover:text-slate-800 flex flex-col items-center gap-0.5">
          <span className="text-base">📊</span>
          <span className="text-[10px] font-bold">Log Vitals</span>
        </Link>
      </nav>
    </div>
  )
}
