'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

// ─── Types ────────────────────────────────────────────────────────────────

interface Patient {
  id: string
  health_id: string
  full_name: string
  date_of_birth: string
  gender: string
  phone: string
  email: string
  address: string
  blood_type: string
  allergies: string
  emergency_contact_name: string
  emergency_contact_phone: string
}

interface MedicalRecord {
  id: string
  created_at: string
  record_type: 'diagnosis' | 'prescription' | 'lab_result' | 'note'
  title: string
  details: string
  clinician_name: string
  clinician_id: string
}

// TabId is only for UI tabs; we map it to the actual record_type when filtering
type TabId = 'overview' | 'diagnosis' | 'prescription' | 'lab' | 'note'

const RECORD_TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'overview', label: 'Overview', icon: '📋' },
  { id: 'diagnosis', label: 'Diagnosis', icon: '🩺' },
  { id: 'prescription', label: 'Prescription', icon: '💊' },
  { id: 'lab', label: 'Lab Results', icon: '🔬' },
  { id: 'note', label: "Doctor's Notes", icon: '📝' },
]

const TAB_TO_RECORD_TYPE: Record<Exclude<TabId, 'overview'>, MedicalRecord['record_type']> = {
  diagnosis: 'diagnosis',
  prescription: 'prescription',
  lab: 'lab_result',
  note: 'note',
}

const BLOOD_TYPES = ['A+','A-','B+','B-','AB+','AB-','O+','O-','Unknown']
const GENDERS     = ['Male','Female','Non-binary','Prefer not to say']

// ─── Component ─────────────────────────────────────────────────────────────

export default function ClinicianAccessPage() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const patientId    = searchParams.get('patient_id')

  const [clinician, setClinician] = useState<null | { id: string; full_name: string; is_verified: boolean }>(null)
  const [patient, setPatient]     = useState<Patient | null>(null)
  const [records, setRecords]     = useState<MedicalRecord[]>([])
  const [activeTab, setActiveTab] = useState<TabId>('overview')
  const [loading, setLoading]     = useState(true)
  const [notVerified, setNotVerified] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [saveError, setSaveError] = useState('')

  // Patient edit form
  const [patientForm, setPatientForm] = useState<Partial<Patient>>({})
  const [editingPatient, setEditingPatient] = useState(false)

  // New record form
  const [newRecord, setNewRecord] = useState({ title: '', details: '' })

  // ── Fetch data on mount ────────────────────────────────────────────────
  useEffect(() => {
    if (patientId) init()
  }, [patientId])

  const init = async () => {
    setLoading(true)

    // 1. Auth check
    const { data: authData, error: authError } = await supabase.auth.getUser()
    if (authError || !authData?.user) { router.push('/login'); return }
    const user = authData.user

    // 2. Clinician verified check
    const { data: clin, error: clinError } = await supabase
      .from('clinicians')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (clinError || !clin) { router.push('/clinician/dashboard'); return }

    if (!clin.is_verified) {
      setNotVerified(true)
      setLoading(false)
      return
    }

    setClinician(clin)

    // 3. Load patient
    const { data: pat, error: patError } = await supabase
      .from('patients')
      .select('*')
      .eq('health_id', patientId)
      .single()

    if (patError || !pat) { router.push('/clinician/dashboard'); return }

    setPatient(pat)
    setPatientForm(pat)

    // 4. Load medical records
    const { data: recs, error: recsError } = await supabase
      .from('medical_records')
      .select('*')
      .eq('patient_id', pat.id)
      .order('created_at', { ascending: false })

    if (recsError) console.error(recsError)
    setRecords(recs || [])
    setLoading(false)
  }

  // ── Save patient info ──────────────────────────────────────────────────
  const handleSavePatient = async () => {
    if (!patient) return

    setSaving(true); setSaveMsg(''); setSaveError('')

    const { error } = await supabase
      .from('patients')
      .update({
        full_name:               patientForm.full_name,
        date_of_birth:           patientForm.date_of_birth,
        gender:                  patientForm.gender,
        phone:                   patientForm.phone,
        email:                   patientForm.email,
        address:                 patientForm.address,
        blood_type:              patientForm.blood_type,
        allergies:               patientForm.allergies,
        emergency_contact_name:  patientForm.emergency_contact_name,
        emergency_contact_phone: patientForm.emergency_contact_phone,
        updated_at:              new Date().toISOString(),
      })
      .eq('id', patient.id)

    if (error) setSaveError('Failed to update patient record.')
    else {
      setPatient(prev => ({ ...prev!, ...patientForm }))
      setSaveMsg('Patient record updated.')
      setEditingPatient(false)
      setTimeout(() => setSaveMsg(''), 3000)
    }

    setSaving(false)
  }

  // ── Add medical record ──────────────────────────────────────────────────
  const handleAddRecord = async (type: MedicalRecord['record_type']) => {
    if (!patient || !clinician) return
    if (!newRecord.title.trim() || !newRecord.details.trim()) {
      setSaveError('Please fill in both title and details.')
      return
    }

    setSaving(true); setSaveMsg(''); setSaveError('')

    const { data, error } = await supabase
      .from('medical_records')
      .insert({
        patient_id:     patient.id,
        clinician_id:   clinician.id,
        clinician_name: clinician.full_name,
        record_type:    type,
        title:          newRecord.title.trim(),
        details:        newRecord.details.trim(),
      })
      .select()
      .single()

    if (error) setSaveError('Failed to save record. Please try again.')
    else if (data) {
      setRecords(prev => [data, ...prev])
      setNewRecord({ title: '', details: '' })
      setSaveMsg('Record saved successfully.')
      setTimeout(() => setSaveMsg(''), 3000)
    }

    setSaving(false)
  }

  // ── Filter records by tab ──────────────────────────────────────────────
  const filteredRecords = (tab: TabId) => {
    if (tab === 'overview') return []
    const type = TAB_TO_RECORD_TYPE[tab as Exclude<TabId, 'overview'>]
    return records.filter(r => r.record_type === type)
  }

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

  // ── Loading ─────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={S.center}>
      <div style={S.spinner} />
      <p style={{ color: '#6b7280', marginTop: 14, fontSize: 14 }}>Loading patient records...</p>
    </div>
  )

  // ── Not verified gate ───────────────────────────────────────────────────
  if (notVerified) return (
    <div style={S.center}>
      <div style={S.gateCard}>
        <span style={{ fontSize: 40 }}>🔒</span>
        <h2 style={S.gateTitle}>Verification Required</h2>
        <p style={S.gateSub}>
          Your account is pending verification. Once an admin approves your credentials,
          you'll be able to access and update patient records.
        </p>
        <button onClick={() => router.push('/clinician/dashboard')} style={S.gateBtn}>
          Back to Dashboard
        </button>
      </div>
    </div>
  )

  // ── Main UI ─────────────────────────────────────────────────────────────
  return (
    <div style={S.root}>
      {/* Header */}
      <header style={S.header}>
        <button onClick={() => router.push('/clinician/dashboard')} style={S.backBtn}>
          ← Dashboard
        </button>
        <span style={S.logo}>UPHR</span>
        <span style={S.verifiedBadge}>✓ Verified Clinician</span>
      </header>

      {/* Patient banner */}
      <div style={S.patientBanner}>
        <div style={S.patientAvatar}>
          {patient?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
        </div>
        <div style={{ flex: 1 }}>
          <h2 style={S.patientName}>{patient?.full_name}</h2>
          <p style={S.patientMeta}>
            Health ID: <strong>{patient?.health_id}</strong>
            &nbsp;·&nbsp; DOB: {patient?.date_of_birth ? formatDate(patient.date_of_birth) : '—'}
            &nbsp;·&nbsp; {patient?.gender || '—'}
            &nbsp;·&nbsp; Blood Type: <strong>{patient?.blood_type || '—'}</strong>
          </p>
        </div>
        <button onClick={() => setEditingPatient(v => !v)} style={S.editPatientBtn}>
          {editingPatient ? 'Cancel Edit' : '✏️ Edit Record'}
        </button>
      </div>

      {/* Success / error toast */}
      {saveMsg && <div style={S.toast('success')}>{saveMsg}</div>}
      {saveError && <div style={S.toast('error')}>{saveError}</div>}

      {/* Tabs */}
      <div style={S.tabs}>
        {RECORD_TABS.map(t => (
          <button
            key={t.id}
            onClick={() => { setActiveTab(t.id); setSaveMsg(''); setSaveError('') }}
            style={{ ...S.tab, ...(activeTab === t.id ? S.tabActive : {}) }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div style={S.body}>
        {/* Render tab content */}
        {activeTab === 'overview' && (
          <div>
            <p>Overview content here...</p>
          </div>
        )}
        {activeTab !== 'overview' && filteredRecords(activeTab).map(r => (
          <div key={r.id} style={S.recordCard}>
            <h4>{r.title}</h4>
            <p>{r.details}</p>
            <small>By {r.clinician_name} on {formatDate(r.created_at)}</small>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Helper ──────────────────────────────────────────────────────────────────
function Field({ label, children, fullWidth }: { label: string; children: React.ReactNode; fullWidth?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, gridColumn: fullWidth ? '1 / -1' : undefined }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{label}</label>
      {children}
    </div>
  )
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const S: Record<string, any> = {
  root: { minHeight: '100vh', background: '#f8f9fc', fontFamily: "'DM Sans', sans-serif" },
  center: { minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
  spinner: { width: 36, height: 36, borderRadius: '50%', border: '3px solid #e5e7eb', borderTopColor: '#2563eb', animation: 'spin 0.8s linear infinite' },
  gateCard: { background: '#fff', padding: 24, borderRadius: 12, textAlign: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' },
  gateTitle: { fontSize: 20, margin: 12 },
  gateSub: { fontSize: 14, color: '#6b7280', marginBottom: 16 },
  gateBtn: { background: '#2563eb', color: '#fff', padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer' },
  header: { display: 'flex', alignItems: 'center', padding: 16, gap: 16, background: '#fff', borderBottom: '1px solid #e5e7eb' },
  backBtn: { border: 'none', background: 'none', cursor: 'pointer', color: '#2563eb', fontWeight: 600 },
  logo: { fontWeight: 700, fontSize: 18 },
  verifiedBadge: { marginLeft: 'auto', color: 'green', fontWeight: 600 },
  patientBanner: { display: 'flex', alignItems: 'center', padding: 16, background: '#fff', gap: 16 },
  patientAvatar: { width: 56, height: 56, borderRadius: '50%', background: '#2563eb', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 18 },
  patientName: { fontSize: 18, fontWeight: 600 },
  patientMeta: { fontSize: 12, color: '#6b7280' },
  editPatientBtn: { padding: '6px 12px', cursor: 'pointer', borderRadius: 8, border: '1px solid #2563eb', background: '#fff' },
  tabs: { display: 'flex', gap: 8, padding: 16 },
  tab: { padding: '6px 12px', cursor: 'pointer', borderRadius: 8, border: '1px solid #ccc', background: '#fff' },
  tabActive: { background: '#2563eb', color: '#fff', border: '1px solid #2563eb' },
  body: { padding: 16, display: 'flex', flexDirection: 'column', gap: 12 },
  recordCard: { background: '#fff', padding: 12, borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  toast: (type: 'success' | 'error') => ({
    position: 'fixed', top: 24, right: 24, padding: 12, borderRadius: 8,
    background: type === 'success' ? '#16a34a' : '#dc2626', color: '#fff', fontWeight: 600
  }),
}
