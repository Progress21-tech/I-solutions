'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { PatientRecord, getStoredPatients } from '@/lib/data/records-data'

const workAreas = [
    { href: '/clinician/visit', icon: '+', label: 'Record a visit', description: 'Capture vitals, labs, notes, and prescriptions in one structured flow.' },
    { href: '/clinician/referrals', icon: '↗', label: 'Referrals', description: 'Send a complete patient summary to the right specialist.' },
    { href: '/clinician/upload', icon: '□', label: 'Clinical files', description: 'Upload and organise documents connected to a patient record.' },
    { href: '/clinician/access', icon: '◇', label: 'Access requests', description: 'Review consent and keep every patient connection intentional.' },
]

export default function ClinicianDashboard() {
    const [patients, setPatients] = useState<PatientRecord[]>([])
    const [searchQuery, setSearchQuery] = useState('')

    useEffect(() => setPatients(getStoredPatients()), [])

    const filteredPatients = patients.filter((patient) => {
        const query = searchQuery.trim().toLowerCase()
        return !query || patient.full_name.toLowerCase().includes(query) || patient.health_id.toLowerCase().includes(query)
    })
    const attentionCount = patients.filter((patient) => patient.current_risk_tier === 'RED').length
    const maternalCount = patients.filter((patient) => patient.pathway === 'maternal').length
    const chronicCount = patients.filter((patient) => patient.pathway === 'chronic').length

    return (
        <main className="dashboard-page">
            <header className="dashboard-header">
                <div><p className="dashboard-kicker">Clinical workspace</p><h1>Good morning, Dr. Bello</h1><p className="dashboard-subtitle">A clear view of the care your team is carrying today.</p></div>
                <div className="dashboard-header-actions"><Link href="/clinician/visit" className="dashboard-primary-action"><span>+</span> Record a visit</Link><div className="dashboard-profile"><span className="dashboard-avatar">DB</span><span><strong>Dr. Bello Adeyemi</strong><small>Lagos Island Maternity</small></span></div></div>
            </header>

            <section className="dashboard-summary" aria-label="Care overview"><div className="summary-heading"><span className="summary-mark">✓</span><span><strong>Care overview</strong><small>Everything in your panel, at a glance</small></span></div><div className="summary-stats"><div><strong>{patients.length}</strong><span>Active patients</span></div><div><strong>{maternalCount}</strong><span>Maternal care</span></div><div><strong>{chronicCount}</strong><span>Chronic care</span></div><div className={attentionCount > 0 ? 'summary-attention' : ''}><strong>{attentionCount}</strong><span>Needs attention</span></div></div></section>

            <section className="dashboard-section"><div className="dashboard-section-heading"><div><p className="dashboard-kicker">Your tools</p><h2>What would you like to do?</h2></div><span className="dashboard-section-note">Choose a workflow to continue</span></div><div className="work-area-grid">{workAreas.map((area) => <Link key={area.href} href={area.href} className="work-area-card"><span className="work-area-icon">{area.icon}</span><span className="work-area-content"><strong>{area.label}</strong><small>{area.description}</small></span><span className="work-area-arrow">→</span></Link>)}</div></section>

            <section className="dashboard-section patient-section"><div className="dashboard-section-heading"><div><p className="dashboard-kicker">Patient panel</p><h2>Your connected patients</h2></div><Link href="/clinician/visit" className="dashboard-text-link">Add patient <span>→</span></Link></div><div className="patient-panel-toolbar"><label htmlFor="patient-search">Search your panel</label><input id="patient-search" type="search" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Name or Health ID" /></div><div className="patient-list">{filteredPatients.length > 0 ? filteredPatients.slice(0, 8).map((patient) => { const needsAttention = patient.current_risk_tier === 'RED'; return <Link key={patient.id} href={`/clinician/visit?patient_id=${patient.health_id}`} className="patient-row"><span className="patient-initials">{patient.full_name.split(' ').map((part) => part[0]).slice(0, 2).join('')}</span><span className="patient-row-main"><strong>{patient.full_name}</strong><small>{patient.health_id} · {patient.pathway === 'maternal' ? `${patient.gestational_weeks || '--'} weeks maternal care` : 'Chronic care'}</small></span><span className={needsAttention ? 'patient-row-status status-attention' : 'patient-row-status'}>{needsAttention ? 'Needs attention' : 'View record'} <b>→</b></span></Link> }) : <div className="empty-panel">No patients match your search.</div>}</div></section>

            <section className="dashboard-footer-card"><span className="footer-card-icon">⌁</span><span><strong>Care should work wherever your patients are.</strong><small>Materna AI also supports WhatsApp, SMS, USSD, and community health worker workflows.</small></span><Link href="/offline-channels">Explore access options <span>→</span></Link></section>
        </main>
    )
}
