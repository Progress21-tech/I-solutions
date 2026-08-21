'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { PatientRecord, getStoredPatients } from '@/lib/data/records-data'

const careAreas = [
    { href: '/patient/care', icon: '♡', label: 'My care', description: 'Appointments, care team, and your health record in plain language.' },
    { href: '/patient/log', icon: '↗', label: 'Health log', description: 'Record blood pressure, symptoms, glucose, or baby movements.' },
    { href: '/patient/medications', icon: '+', label: 'Medications', description: 'Review prescriptions and request a delivery refill.' },
    { href: '/patient/chat', icon: '✦', label: 'AI copilot', description: 'Ask questions grounded in your personal continuity record.' },
]

export default function PatientDashboard() {
    const [patient, setPatient] = useState<PatientRecord | null>(null)

    useEffect(() => {
        const list = getStoredPatients()
        setPatient(list.find((item) => item.health_id === 'MAT-AMK-2026') || list[0] || null)
    }, [])

    if (!patient) return <main className="patient-dashboard-page"><p className="dashboard-subtitle">Loading your care overview...</p></main>

    const isUrgent = patient.current_risk_tier === 'RED'
    const pathwayLabel = patient.pathway === 'maternal' ? `${patient.gestational_weeks || '--'} weeks pregnant` : 'Chronic care pathway'

    return <main className="patient-dashboard-page"><header className="patient-welcome"><div><p className="dashboard-kicker">Your care overview</p><h1>Good morning, {patient.full_name.split(' ')[0]}</h1><p className="dashboard-subtitle">Everything you need to stay connected to your care, in one place.</p></div><div className="patient-identity"><span className="patient-dashboard-avatar">{patient.full_name.split(' ').map((part) => part[0]).slice(0, 2).join('')}</span><span><strong>{patient.health_id}</strong><small>{pathwayLabel}</small></span></div></header>

        <section className={isUrgent ? 'patient-status-card status-urgent' : 'patient-status-card'}><div className="patient-status-heading"><span className="patient-status-icon">{isUrgent ? '!' : '✓'}</span><span><strong>{isUrgent ? 'Your care team needs to review an update' : 'Your care is on track'}</strong><small>{isUrgent ? 'Please follow the next step below.' : 'Your latest care information is available.'}</small></span></div><p>{patient.patient_summary_plain}</p>{isUrgent && <div className="patient-status-actions"><a href="tel:112">Call emergency services</a><Link href="/patient/chat">Talk to the copilot</Link></div>}</section>

        <section className="patient-dashboard-section"><div className="patient-section-heading"><div><p className="dashboard-kicker">Your care tools</p><h2>What do you need today?</h2></div><span className="dashboard-section-note">Select a space to continue</span></div><div className="patient-care-grid">{careAreas.map((area) => <Link key={area.href} href={area.href} className="patient-care-card"><span className="patient-care-icon">{area.icon}</span><span><strong>{area.label}</strong><small>{area.description}</small></span><b>→</b></Link>)}</div></section>

        <section className="patient-next-card"><div><p className="dashboard-kicker">Next step</p><h2>{patient.pathway === 'maternal' ? 'Keep your pregnancy journey updated.' : 'Keep your health signals visible.'}</h2><p>{patient.pathway === 'maternal' ? 'A quick check-in helps your care team understand how you are doing between visits.' : 'Regular readings help your care team spot changes early.'}</p></div><Link href="/patient/log" className="dashboard-primary-action">Add a check-in <span>↗</span></Link></section>

        <footer className="patient-trust-row"><span>Health ID: {patient.health_id}</span><span>•</span><span>Your record is private and consent-led</span><Link href="/offline-channels">Need low-data access? →</Link></footer>
    </main>
}
