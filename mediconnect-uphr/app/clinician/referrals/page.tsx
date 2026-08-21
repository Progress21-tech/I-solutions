'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { SpecialistReferral, getStoredReferrals } from '@/lib/data/records-data'

export default function SpecialistReferralsPage() {
  const [referrals, setReferrals] = useState<SpecialistReferral[]>([])
  const [selectedReferral, setSelectedReferral] = useState<SpecialistReferral | null>(null)

  useEffect(() => {
    const list = getStoredReferrals()
    setReferrals(list)
    setSelectedReferral(list[0] || null)
  }, [])

  return <main className="workflow-page"><header className="workflow-header"><div><Link href="/clinician/dashboard" className="workflow-back">← Dashboard</Link><p className="dashboard-kicker">Clinical workflow</p><h1>Specialist referrals</h1><p className="dashboard-subtitle">Review, prepare, and share patient context with the next care team.</p></div><span className="workflow-count">{referrals.length} active referrals</span></header><div className="workflow-grid"><section className="workflow-list"><div className="workflow-section-title"><h2>Referral queue</h2><span>Click to review</span></div>{referrals.length ? referrals.map((referral) => <button type="button" key={referral.id} onClick={() => setSelectedReferral(referral)} className={`workflow-list-item ${selectedReferral?.id === referral.id ? 'selected' : ''}`}><span className="workflow-item-icon">↗</span><span><strong>{referral.patient_name}</strong><small>{referral.referral_code} · {referral.target_facility}</small></span><b>→</b></button>) : <div className="workflow-empty">No active referrals yet.</div>}</section>{selectedReferral && <section className="workflow-detail"><div className="workflow-detail-heading"><div><p className="dashboard-kicker">Referral summary</p><h2>{selectedReferral.patient_name}</h2><p>{selectedReferral.referral_code} · {selectedReferral.target_specialty}</p></div><a href={`/api/fhir?patient_id=${selectedReferral.patient_health_id}`} download className="dashboard-primary-action">Download FHIR <span>↗</span></a></div><div className="workflow-meta-grid"><div><small>From</small><strong>{selectedReferral.referring_facility}</strong></div><div><small>To</small><strong>{selectedReferral.target_facility}</strong></div><div><small>Urgency</small><strong className="workflow-urgency">{selectedReferral.urgency}</strong></div></div><div className="workflow-copy"><h3>Clinical summary</h3><p>{selectedReferral.clinical_summary}</p></div><div className="workflow-copy"><div className="workflow-copy-heading"><h3>Interoperability package</h3><span>FHIR R4 · JSON</span></div><pre>{selectedReferral.fhir_bundle_json || '{"resourceType":"Bundle","type":"document"}'}</pre></div></section>}</div></main>
}
