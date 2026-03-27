'use client'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

// ─── Types ───────────────────────────────────────────────────────────────────

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

type TabId = 'overview' | 'diagnosis' | 'prescription' | 'lab' | 'note'

const RECORD_TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'overview',     label: 'Overview',      icon: '📋' },
  { id: 'diagnosis',    label: 'Diagnosis',      icon: '🩺' },
  { id: 'prescription', label: 'Prescription',   icon: '💊' },
  { id: 'lab',          label: 'Lab Results',    icon: '🔬' },
  { id: 'note',         label: "Doctor's Notes", icon: '📝' },
]

const BLOOD_TYPES = ['A+','A-','B+','B-','AB+','AB-','O+','O-','Unknown']
const GENDERS     = ['Male','Female','Non-binary','Prefer not to say']

// ─── Component ───────────────────────────────────────────────────────────────

export default function ClinicianAccessPage() {
  const router      = useRouter()
  const searchParams = useSearchParams()
  const patientId   = searchParams.get('patient_id')

  const [clinician,   setClinician]   = useState<any>(null)
  const [patient,     setPatient]     = useState<Patient | null>(null)
  const [records,     setRecords]     = useState<MedicalRecord[]>([])
  const [activeTab,   setActiveTab]   = useState<TabId>('overview')
  const [loading,     setLoading]     = useState(true)
  const [notVerified, setNotVerified] = useState(false)
  const [saving,      setSaving]      = useState(false)
  const [saveMsg,     setSaveMsg]     = useState('')
  const [saveError,   setSaveError]   = useState('')

  // Patient edit form
  const [patientForm, setPatientForm] = useState<Partial<Patient>>({})
  const [editingPatient, setEditingPatient] = useState(false)

  // New record form
  const [newRecord, setNewRecord] = useState({ title: '', details: '' })

  // ── Fetch on mount ──────────────────────────────────────────────────────

  useEffect(() => {
    if (patientId) init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId])

  const init = async () => {
    setLoading(true)

    // 1. Auth check
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    // 2. Clinician verified check
    const { data: clin } = await supabase
      .from('clinicians')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!clin) { router.push('/clinician/dashboard'); return }

    if (!clin.is_verified) {
      setNotVerified(true)
      setLoading(false)
      return
    }

    setClinician(clin)

    // 3. Load patient
    const { data: pat } = await supabase
      .from('patients')
      .select('*')
      .eq('health_id', patientId!)
      .single()

    if (!pat) { router.push('/clinician/dashboard'); return }

    setPatient(pat)
    setPatientForm(pat)

    // 4. Load medical records
    const { data: recs } = await supabase
      .from('medical_records')
      .select('*')
      .eq('patient_id', pat.id)
      .order('created_at', { ascending: false })

    setRecords(recs || [])
    setLoading(false)
  }

  // ── Save patient info ───────────────────────────────────────────────────

  const handleSavePatient = async () => {
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
      .eq('id', patient!.id)

    if (error) {
      setSaveError('Failed to update patient record.')
    } else {
      setPatient(prev => ({ ...prev!, ...patientForm }))
      setSaveMsg('Patient record updated.')
      setEditingPatient(false)
      setTimeout(() => setSaveMsg(''), 3000)
    }
    setSaving(false)
  }

  // ── Add medical record ──────────────────────────────────────────────────

  const handleAddRecord = async (type: MedicalRecord['record_type']) => {
    if (!newRecord.title.trim() || !newRecord.details.trim()) {
      setSaveError('Please fill in both title and details.')
      return
    }
    setSaving(true); setSaveMsg(''); setSaveError('')

    const { data, error } = await supabase
      .from('medical_records')
      .insert({
        patient_id:     patient!.id,
        clinician_id:   clinician.id,
        clinician_name: clinician.full_name,
        record_type:    type,
        title:          newRecord.title.trim(),
        details:        newRecord.details.trim(),
      })
      .select()
      .single()

    if (error) {
      setSaveError('Failed to save record. Please try again.')
    } else {
      setRecords(prev => [data, ...prev])
      setNewRecord({ title: '', details: '' })
      setSaveMsg('Record saved successfully.')
      setTimeout(() => setSaveMsg(''), 3000)
    }
    setSaving(false)
  }

  const filteredRecords = (type: MedicalRecord['record_type']) =>
    records.filter(r => r.record_type === type)

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
            &nbsp;·&nbsp; {patient?.gender}
            &nbsp;·&nbsp; Blood Type: <strong>{patient?.blood_type || '—'}</strong>
          </p>
        </div>
        <button onClick={() => setEditingPatient(v => !v)} style={S.editPatientBtn}>
          {editingPatient ? 'Cancel Edit' : '✏️ Edit Record'}
        </button>
      </div>

      {/* Success / error toast */}
      {saveMsg   && <div style={S.toast('success')}>{saveMsg}</div>}
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

        {/* ── OVERVIEW TAB ─────────────────────────────────────────────── */}
        {activeTab === 'overview' && (
          <>
            {editingPatient ? (
              <div style={S.card}>
                <p style={S.sectionHead}>Edit Patient Information</p>

                <div style={S.formGrid}>
                  <Field label="Full Name">
                    <input style={S.input} value={patientForm.full_name || ''} onChange={e => setPatientForm(p => ({ ...p, full_name: e.target.value }))} />
                  </Field>
                  <Field label="Date of Birth">
                    <input style={S.input} type="date" value={patientForm.date_of_birth || ''} onChange={e => setPatientForm(p => ({ ...p, date_of_birth: e.target.value }))} />
                  </Field>
                  <Field label="Gender">
                    <select style={S.input} value={patientForm.gender || ''} onChange={e => setPatientForm(p => ({ ...p, gender: e.target.value }))}>
                      <option value="">Select</option>
                      {GENDERS.map(g => <option key={g}>{g}</option>)}
                    </select>
                  </Field>
                  <Field label="Blood Type">
                    <select style={S.input} value={patientForm.blood_type || ''} onChange={e => setPatientForm(p => ({ ...p, blood_type: e.target.value }))}>
                      <option value="">Select</option>
                      {BLOOD_TYPES.map(b => <option key={b}>{b}</option>)}
                    </select>
                  </Field>
                  <Field label="Phone">
                    <input style={S.input} value={patientForm.phone || ''} onChange={e => setPatientForm(p => ({ ...p, phone: e.target.value }))} />
                  </Field>
                  <Field label="Email">
                    <input style={S.input} type="email" value={patientForm.email || ''} onChange={e => setPatientForm(p => ({ ...p, email: e.target.value }))} />
                  </Field>
                  <Field label="Address" fullWidth>
                    <input style={S.input} value={patientForm.address || ''} onChange={e => setPatientForm(p => ({ ...p, address: e.target.value }))} />
                  </Field>
                  <Field label="Allergies" fullWidth>
                    <input style={S.input} placeholder="e.g. Penicillin, Pollen" value={patientForm.allergies || ''} onChange={e => setPatientForm(p => ({ ...p, allergies: e.target.value }))} />
                  </Field>
                  <Field label="Emergency Contact Name">
                    <input style={S.input} value={patientForm.emergency_contact_name || ''} onChange={e => setPatientForm(p => ({ ...p, emergency_contact_name: e.target.value }))} />
                  </Field>
                  <Field label="Emergency Contact Phone">
                    <input style={S.input} value={patientForm.emergency_contact_phone || ''} onChange={e => setPatientForm(p => ({ ...p, emergency_contact_phone: e.target.value }))} />
                  </Field>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
                  <button onClick={() => setEditingPatient(false)} style={S.cancelBtn}>Cancel</button>
                  <button onClick={handleSavePatient} disabled={saving} style={S.saveBtn}>
                    {saving ? 'Saving...' : 'Save Patient Record'}
                  </button>
                </div>
              </div>
            ) : (
              <div style={S.card}>
                <p style={S.sectionHead}>Patient Information</p>
                <div style={S.infoGrid}>
                  {[
                    ['Full Name',        patient?.full_name],
                    ['Date of Birth',    patient?.date_of_birth ? formatDate(patient.date_of_birth) : '—'],
                    ['Gender',           patient?.gender],
                    ['Blood Type',       patient?.blood_type],
                    ['Phone',            patient?.phone],
                    ['Email',            patient?.email],
                    ['Address',          patient?.address],
                    ['Allergies',        patient?.allergies],
                    ['Emergency Contact',patient?.emergency_contact_name],
                    ['Emergency Phone',  patient?.emergency_contact_phone],
                  ].map(([label, value]) => (
                    <div key={label as string} style={S.infoField}>
                      <p style={S.infoLabel}>{label}</p>
                      <p style={S.infoValue}>{value || <span style={{ color: '#d1d5db' }}>Not set</span>}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Records summary */}
            <div style={S.card}>
              <p style={S.sectionHead}>Records Summary</p>
              <div style={S.summaryGrid}>
                {[
                  { type: 'diagnosis',    label: 'Diagnoses',     icon: '🩺', color: '#dbeafe' },
                  { type: 'prescription', label: 'Prescriptions', icon: '💊', color: '#fef9c3' },
                  { type: 'lab_result',   label: 'Lab Results',   icon: '🔬', color: '#f0fdf4' },
                  { type: 'note',         label: "Doctor's Notes",icon: '📝', color: '#fdf4ff' },
                ].map(({ type, label, icon, color }) => (
                  <div key={type} style={{ ...S.summaryCard, background: color }}>
                    <span style={{ fontSize: 28 }}>{icon}</span>
                    <p style={S.summaryCount}>{filteredRecords(type as MedicalRecord['record_type']).length}</p>
                    <p style={S.summaryLabel}>{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── RECORD TABS ──────────────────────────────────────────────── */}
        {(['diagnosis','prescription','lab','note'] as const).map(tabId => {
          const typeMap: Record<string, MedicalRecord['record_type']> = {
            diagnosis: 'diagnosis', prescription: 'prescription', lab: 'lab_result', note: 'note'
          }
          const placeholderMap: Record<string, { title: string; details: string }> = {
            diagnosis:    { title: 'e.g. Type 2 Diabetes Mellitus', details: 'Describe the diagnosis, severity, and clinical findings...' },
            prescription: { title: 'e.g. Metformin 500mg', details: 'Dosage, frequency, duration, and special instructions...' },
            lab:          { title: 'e.g. Full Blood Count (FBC)', details: 'Test results, reference ranges, and interpretation...' },
            note:         { title: 'e.g. Follow-up Consultation', details: 'Clinical observations, patient history discussed, next steps...' },
          }
          const recType = typeMap[tabId]
          if (activeTab !== tabId) return null

          return (
            <div key={tabId}>
              {/* Add new record */}
              <div style={S.card}>
                <p style={S.sectionHead}>Add New {RECORD_TABS.find(t => t.id === tabId)?.label}</p>
                <div style={S.formGrid}>
                  <Field label="Title" fullWidth>
                    <input
                      style={S.input}
                      placeholder={placeholderMap[tabId].title}
                      value={newRecord.title}
                      onChange={e => setNewRecord(p => ({ ...p, title: e.target.value }))}
                    />
                  </Field>
                  <Field label="Details" fullWidth>
                    <textarea
                      style={{ ...S.input, minHeight: 110, resize: 'vertical' }}
                      placeholder={placeholderMap[tabId].details}
                      value={newRecord.details}
                      onChange={e => setNewRecord(p => ({ ...p, details: e.target.value }))}
                    />
                  </Field>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
                  <button onClick={() => handleAddRecord(recType)} disabled={saving} style={S.saveBtn}>
                    {saving ? 'Saving...' : `Save ${RECORD_TABS.find(t => t.id === tabId)?.label}`}
                  </button>
                </div>
              </div>

              {/* Existing records */}
              {filteredRecords(recType).length === 0 ? (
                <div style={S.emptyState}>No {RECORD_TABS.find(t => t.id === tabId)?.label.toLowerCase()} records yet.</div>
              ) : (
                filteredRecords(recType).map(rec => (
                  <div key={rec.id} style={S.recordCard}>
                    <div style={S.recordHeader}>
                      <p style={S.recordTitle}>{rec.title}</p>
                      <span style={S.recordDate}>{formatDate(rec.created_at)}</span>
                    </div>
                    <p style={S.recordDetails}>{rec.details}</p>
                    <p style={S.recordClinician}>Added by Dr. {rec.clinician_name}</p>
                  </div>
                ))
              )}
            </div>
          )
        })}
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
  root:   { minHeight: '100vh', background: '#f8f9fc', fontFamily: "'DM Sans', sans-serif" },
  center: { minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
  spinner: {
    width: 36, height: 36, borderRadius: '50%',
    border: '3px solid #e5e7eb', borderTopColor: '#2563eb',
    animation: 'spin 0.8s linear infinite',
  },

  // Header
  header: {
    background: 'white', borderBottom: '1px solid #e5e7eb',
    padding: '14px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  backBtn:       { background: 'none', border: 'none', color: '#6b7280', fontSize: 14, cursor: 'pointer', fontWeight: 500 },
  logo:          { fontSize: 20, fontWeight: 800, color: '#2563eb', letterSpacing: '-0.5px' },
  verifiedBadge: { background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', fontSize: 12, fontWeight: 600, padding: '5px 12px', borderRadius: 20 },

  // Patient banner
  patientBanner: {
    background: '#1e3a5f', padding: '24px 32px',
    display: 'flex', alignItems: 'center', gap: 18,
  },
  patientAvatar: {
    width: 56, height: 56, borderRadius: '50%',
    background: 'rgba(255,255,255,0.15)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'white', fontWeight: 700, fontSize: 20, flexShrink: 0,
  },
  patientName:    { fontSize: 20, fontWeight: 700, color: 'white', letterSpacing: '-0.3px' },
  patientMeta:    { fontSize: 13, color: '#93c5fd', marginTop: 3 },
  editPatientBtn: {
    marginLeft: 'auto', background: 'rgba(255,255,255,0.12)',
    border: '1px solid rgba(255,255,255,0.25)', color: 'white',
    padding: '9px 18px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer',
    flexShrink: 0,
  },

  // Toast
  toast: (type: 'success' | 'error') => ({
    background: type === 'success' ? '#f0fdf4' : '#fef2f2',
    border: `1px solid ${type === 'success' ? '#bbf7d0' : '#fecaca'}`,
    color: type === 'success' ? '#15803d' : '#b91c1c',
    padding: '12px 28px', fontSize: 13, fontWeight: 500,
  }),

  // Tabs
  tabs: {
    background: 'white', borderBottom: '1px solid #e5e7eb',
    padding: '0 28px', display: 'flex', gap: 0, overflowX: 'auto',
  },
  tab: {
    padding: '16px 20px', border: 'none', background: 'none', cursor: 'pointer',
    fontSize: 13, fontWeight: 500, color: '#9ca3af',
    borderBottom: '2px solid transparent', whiteSpace: 'nowrap', transition: 'all 0.15s',
  },
  tabActive: { color: '#2563eb', borderBottomColor: '#2563eb' },

  // Body / cards
  body:       { maxWidth: 780, margin: '28px auto 80px', padding: '0 20px' },
  card:       { background: 'white', borderRadius: 16, border: '1px solid #e5e7eb', padding: 24, marginBottom: 16 },
  sectionHead: { fontSize: 13, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 18 },

  // Patient info display
  infoGrid:  { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 28px' },
  infoField: {},
  infoLabel: { fontSize: 11, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 2 },
  infoValue: { fontSize: 14, fontWeight: 600, color: '#1f2937' },

  // Summary
  summaryGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 },
  summaryCard: { borderRadius: 14, padding: '18px 14px', textAlign: 'center' },
  summaryCount: { fontSize: 28, fontWeight: 800, color: '#1f2937', marginTop: 6 },
  summaryLabel: { fontSize: 12, fontWeight: 500, color: '#6b7280', marginTop: 2 },

  // Form
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 },
  input: {
    border: '1.5px solid #e5e7eb', borderRadius: 10,
    padding: '10px 14px', fontSize: 14, color: '#111827',
    outline: 'none', width: '100%', fontFamily: 'inherit',
  },

  // Record cards
  recordCard:     { background: 'white', borderRadius: 14, border: '1px solid #e5e7eb', padding: '18px 22px', marginBottom: 10 },
  recordHeader:   { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  recordTitle:    { fontSize: 15, fontWeight: 700, color: '#111827' },
  recordDate:     { fontSize: 12, color: '#9ca3af', flexShrink: 0, marginLeft: 12 },
  recordDetails:  { fontSize: 14, color: '#374151', lineHeight: 1.6 },
  recordClinician:{ fontSize: 12, color: '#9ca3af', marginTop: 10, fontStyle: 'italic' },

  // Empty state
  emptyState: { textAlign: 'center', padding: '40px 20px', color: '#9ca3af', fontSize: 14 },

  // Buttons
  saveBtn: {
    background: '#2563eb', color: 'white', border: 'none',
    padding: '11px 26px', borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: 'pointer',
  },
  cancelBtn: {
    background: 'transparent', border: '1.5px solid #e5e7eb', color: '#6b7280',
    padding: '11px 22px', borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: 'pointer',
  },

  // Not verified gate
  gateCard:  { background: 'white', borderRadius: 20, padding: '48px 40px', textAlign: 'center', maxWidth: 400, border: '1px solid #e5e7eb' },
  gateTitle: { fontSize: 20, fontWeight: 700, color: '#111827', marginTop: 16 },
  gateSub:   { fontSize: 14, color: '#6b7280', marginTop: 10, lineHeight: 1.6 },
  gateBtn:   { marginTop: 24, background: '#2563eb', color: 'white', border: 'none', padding: '12px 28px', borderRadius: 12, fontWeight: 600, cursor: 'pointer' },
}
