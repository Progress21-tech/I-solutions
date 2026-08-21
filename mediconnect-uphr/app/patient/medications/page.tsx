'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  MedicationOrder,
  PatientRecord,
  Prescription,
  getPatientById,
  getStoredOrders,
  getStoredPatients,
  placeMedicationOrder
} from '@/lib/data/records-data'

export default function PatientMedicationsPage() {
  const [patient, setPatient] = useState<PatientRecord | null>(null)
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [orders, setOrders] = useState<MedicationOrder[]>([])
  const [selectedRx, setSelectedRx] = useState<Prescription | null>(null)
  const [ordering, setOrdering] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null)

  useEffect(() => {
    const list = getStoredPatients()
    const found = list.find((p) => p.health_id === 'MAT-AMK-2026') || list[0]
    if (found) {
      setPatient(found)
      const ords = getStoredOrders(found.id)
      setOrders(ords)

      // Sample active prescriptions for Amaka or current patient
      const rxs: Prescription[] = [
        {
          id: 'rx-amk-03',
          medication_name: 'Methyldopa (Aldomet) 250mg',
          dosage: '250mg',
          frequency: 'Three times daily (TDS)',
          duration_days: 14,
          refills_remaining: 3,
          instructions: 'Take 1 tablet every 8 hours with or after food. Do not skip doses.',
          prescribed_by: 'Dr. Bello Adeyemi (Lagos Island Maternity)',
          prescribed_date: '2026-08-20',
          status: 'active',
          category: 'Antihypertensive'
        },
        {
          id: 'rx-amk-01',
          medication_name: 'Pregnacare Plus Prenatal Micronutrients & DHA',
          dosage: '1 dual pack daily',
          frequency: 'Once Daily with main meal',
          duration_days: 30,
          refills_remaining: 2,
          instructions: 'Take after lunch or dinner with a full glass of water.',
          prescribed_by: 'Dr. Bello Adeyemi',
          prescribed_date: '2026-08-20',
          status: 'active',
          category: 'Prenatal Vitamins'
        }
      ]
      setPrescriptions(rxs)
      setSelectedRx(rxs[0])
    }
  }, [])

  const handlePlaceRefillOrder = (rx: Prescription) => {
    if (!patient) return
    setOrdering(true)

    const randomOrderNum = Math.floor(10000 + Math.random() * 90000)
    const newOrder: MedicationOrder = {
      id: `ord-${Date.now()}`,
      order_number: `MAT-ORD-${randomOrderNum}`,
      patient_id: patient.id,
      patient_name: patient.full_name,
      delivery_address: patient.address,
      contact_phone: patient.phone,
      items: [
        {
          name: `${rx.medication_name} (${rx.duration_days}-day supply)`,
          dosage: rx.dosage,
          quantity: '1 Pack',
          price_ngn: rx.category === 'Antihypertensive' ? 4500 : 11200
        }
      ],
      total_amount_ngn: rx.category === 'Antihypertensive' ? 4500 : 11200,
      delivery_fee_ngn: 1200,
      partner_pharmacy: 'Medplus Pharmacy (Lekki Admiralty Branch)',
      placed_at: new Date().toISOString(),
      status: 'pharmacy_dispensed',
      status_history: [
        { status: 'order_confirmed', timestamp: new Date().toISOString(), note: `Prescription verified with ${rx.prescribed_by}` },
        { status: 'pharmacy_dispensed', timestamp: new Date().toISOString(), note: 'Medication packaged with tamper-proof security seal at Medplus Lekki' }
      ],
      rider_name: 'Babatunde Olalekan (GOKADA Logistics)',
      rider_phone: '+234 812 400 9988',
      estimated_delivery_time: 'Within 45 mins'
    }

    placeMedicationOrder(newOrder)
    const updatedOrders = getStoredOrders(patient.id)
    setOrders(updatedOrders)
    setOrdering(false)
    setOrderSuccess(newOrder.order_number)
  }

  if (!patient) return <div className="min-h-screen bg-slate-950 p-6 text-white">Loading medications...</div>

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-24">
      {/* Top Bar */}
      <header className="border-b border-slate-800 bg-slate-900 px-5 py-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Link href="/patient/dashboard" className="text-slate-400 hover:text-white text-xs font-bold">
            ← Home
          </Link>
          <span className="text-slate-600">/</span>
          <h1 className="font-bold text-white text-sm">Medications & Doorstep Refill Delivery</h1>
        </div>
        <span className="text-[11px] font-bold bg-blue-950 text-blue-300 border border-blue-800/40 px-2.5 py-1 rounded-full">
          Prescription-Linked Fulfillment
        </span>
      </header>

      <main className="max-w-xl mx-auto px-4 pt-5 space-y-6">
        {/* Success Alert */}
        {orderSuccess && (
          <div className="bg-emerald-950 border border-emerald-500 text-emerald-100 p-4 rounded-2xl text-xs space-y-2 animate-bounce">
            <div className="flex items-center gap-2 font-bold text-sm text-emerald-300">
              <span>✓</span> Order Confirmed: {orderSuccess}
            </div>
            <p>
              Your prescription refill order was verified and sent to <strong>Medplus Pharmacy Lekki</strong>. Delivery rider is being assigned to bring it to your home.
            </p>
          </div>
        )}

        {/* Closed-Loop Safety Notice */}
        <div className="bg-gradient-to-r from-blue-950/60 via-slate-900 to-slate-900 border border-blue-800/40 p-4 rounded-2xl text-xs space-y-1">
          <span className="font-bold text-blue-300 block uppercase tracking-wider text-[11px]">
            🔒 Clinician-Controlled Medication Access
          </span>
          <p className="text-slate-300 text-[11px] leading-relaxed">
            Materna AI only allows ordering medications and dosage strengths actively prescribed by your doctor or midwife at Lagos Island Maternity.
          </p>
        </div>

        {/* Active Prescriptions List */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <h2 className="font-bold text-xs text-white uppercase tracking-wider">
              Active Prescriptions ({prescriptions.length})
            </h2>
            <span className="text-[11px] text-slate-400">Dr. Bello Adeyemi</span>
          </div>

          <div className="space-y-3">
            {prescriptions.map((rx) => (
              <div
                key={rx.id}
                className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 space-y-3 text-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-extrabold text-white text-sm">{rx.medication_name}</span>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      {rx.dosage} · {rx.frequency}
                    </p>
                    <p className="text-emerald-400 font-semibold text-[11px] mt-1">
                      {rx.refills_remaining} Refills Remaining ({rx.duration_days} days supply each)
                    </p>
                  </div>
                  <span className="bg-slate-900 text-slate-300 text-[10px] uppercase font-bold px-2 py-0.5 rounded border border-slate-800">
                    {rx.category}
                  </span>
                </div>

                <p className="text-slate-300 text-[11px] bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/60">
                  📋 <strong>Instructions:</strong> {rx.instructions}
                </p>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-slate-400 text-[11px]">Partner: Medplus Pharmacy</span>
                  <button
                    onClick={() => handlePlaceRefillOrder(rx)}
                    disabled={ordering}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition shadow-md shadow-blue-950 flex items-center gap-1.5"
                  >
                    <span>🚀</span> Order Home Delivery (₦{rx.category === 'Antihypertensive' ? '4,500' : '11,200'})
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Delivery Status Tracker */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <h2 className="font-bold text-xs text-white uppercase tracking-wider">
              Live Delivery Status ({orders.length})
            </h2>
            <span className="text-[11px] text-emerald-400 font-bold">Partner Pharmacy Network</span>
          </div>

          {orders.map((order) => (
            <div key={order.id} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-mono font-bold text-white text-sm">{order.order_number}</span>
                  <p className="text-slate-400 text-[11px]">Placed {new Date(order.placed_at).toLocaleTimeString()}</p>
                </div>
                <span className="bg-emerald-950 text-emerald-300 font-bold text-[10px] uppercase px-2.5 py-1 rounded-full border border-emerald-800/40">
                  {order.status.replace(/_/g, ' ')}
                </span>
              </div>

              {/* Progress Steps */}
              <div className="grid grid-cols-4 gap-1.5 text-center text-[10px] pt-1">
                <div className="p-1.5 rounded-lg bg-emerald-950 border border-emerald-700 text-emerald-300 font-bold">
                  ✓ Confirmed
                </div>
                <div className="p-1.5 rounded-lg bg-emerald-950 border border-emerald-700 text-emerald-300 font-bold">
                  ✓ Dispensed
                </div>
                <div className="p-1.5 rounded-lg bg-emerald-950 border border-emerald-700 text-emerald-300 font-bold">
                  ✓ Rider Assigned
                </div>
                <div className="p-1.5 rounded-lg bg-blue-950 border border-blue-600 text-blue-300 font-bold animate-pulse">
                  🚴 In Transit
                </div>
              </div>

              {/* Rider Info Card */}
              {order.rider_name && (
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Assigned Dispatch Rider</span>
                    <p className="font-bold text-white mt-0.5">{order.rider_name}</p>
                    <p className="text-slate-400 text-[11px]">{order.rider_phone}</p>
                  </div>
                  <a
                    href={`tel:${order.rider_phone}`}
                    className="bg-emerald-700 hover:bg-emerald-600 text-white font-bold px-3 py-1.5 rounded-lg text-xs"
                  >
                    📞 Call Rider
                  </a>
                </div>
              )}

              <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-900 flex justify-between">
                <span>Deliver To: {order.delivery_address}</span>
                <span className="font-bold text-slate-200">Total: ₦{order.total_amount_ngn.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Floating Bottom Nav */}
      <nav className="fixed bottom-0 inset-x-0 bg-slate-900/95 border-t border-slate-800 backdrop-blur px-6 py-2.5 flex items-center justify-around z-40 max-w-xl mx-auto">
        <Link href="/patient/dashboard" className="text-center text-slate-400 hover:text-slate-200 flex flex-col items-center gap-0.5">
          <span className="text-base">🏠</span>
          <span className="text-[10px] font-bold">Home</span>
        </Link>
        <Link href="/patient/medications" className="text-center text-pink-400 flex flex-col items-center gap-0.5">
          <span className="text-base">💊</span>
          <span className="text-[10px] font-bold">Meds & Refills</span>
        </Link>
        <Link href="/patient/chat" className="text-center text-slate-400 hover:text-slate-200 flex flex-col items-center gap-0.5">
          <span className="text-base">🤖</span>
          <span className="text-[10px] font-bold">AI Copilot</span>
        </Link>
        <Link href="/patient/log" className="text-center text-slate-400 hover:text-slate-200 flex flex-col items-center gap-0.5">
          <span className="text-base">📊</span>
          <span className="text-[10px] font-bold">Log Vitals</span>
        </Link>
      </nav>
    </div>
  )
}
