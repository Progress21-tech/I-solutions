'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface Clinician {
  id?: string
  user_id?: string
  full_name: string
  hospital_name: string
  specialty: string
  license_number: string
  phone?: string
  email?: string
  department?: string
  profile_photo_url?: string
}

interface EditForm {
  full_name: string
  phone: string
  email: string
  specialty: string
  department: string
  hospital_name: string
  license_number: string
  profile_photo_url: string
}

const SPECIALTIES = [
  'General Practice', 'Internal Medicine', 'Cardiology', 'Neurology',
  'Orthopedics', 'Pediatrics', 'Obstetrics & Gynecology', 'Psychiatry',
  'Oncology', 'Radiology', 'Surgery', 'Dermatology', 'Ophthalmology',
  'Endocrinology', 'Nephrology', 'Pulmonology', 'Gastroenterology',
]

export default function ClinicianDashboard() {
  const [clinician, setClinician] = useState<Clinician | null>(null)
  const [searchId, setSearchId] = useState('')
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState('')
  const [showEditModal, setShowEditModal] = useState(false)
  const [editForm, setEditForm] = useState<EditForm>({
    full_name: '',
    phone: '',
    email: '',
    specialty: '',
    department: '',
    hospital_name: '',
    license_number: '',
    profile_photo_url: '',
  })
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetchClinicianData()
  }, [])

  const fetchClinicianData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data: clinicianData } = await supabase
      .from('clinicians')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (clinicianData) {
      setClinician(clinicianData)
      setEditForm({
        full_name: clinicianData.full_name || '',
        phone: clinicianData.phone || '',
        email: clinicianData.email || user.email || '',
        specialty: clinicianData.specialty || '',
        department: clinicianData.department || '',
        hospital_name: clinicianData.hospital_name || '',
        license_number: clinicianData.license_number || '',
        profile_photo_url: clinicianData.profile_photo_url || '',
      })
    }
    setLoading(false)
  }

  const handleSearch = async () => {
    if (!searchId.trim()) return
    setSearching(true)
    setError('')
    const { data: patient } = await supabase
      .from('patients')
      .select('*')
      .eq('health_id', searchId.trim().toUpperCase())
      .single()

    if (!patient) {
      setError('No patient found with that Health ID. Please check and try again.')
      setSearching(false)
      return
    }
    router.push(`/clinician/access?patient_id=${patient.health_id}`)
    setSearching(false)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingPhoto(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const ext = file.name.split('.').pop()
    const path = `clinician-photos/${user.id}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('profile-photos')
      .upload(path, file, { upsert: true })

    if (!uploadError) {
      const { data: { publicUrl } } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(path)
      setEditForm(prev => ({ ...prev, profile_photo_url: publicUrl }))
    }
    setUploadingPhoto(false)
  }

  const handleSaveProfile = async () => {
    setSaving(true)
    setSaveError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error: updateError } = await supabase
      .from('clinicians')
      .update({
        full_name: editForm.full_name.trim(),
        phone: editForm.phone.trim(),
        email: editForm.email.trim(),
        specialty: editForm.specialty,
        department: editForm.department.trim(),
        hospital_name: editForm.hospital_name.trim(),
        license_number: editForm.license_number.trim(),
        profile_photo_url: editForm.profile_photo_url,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)

    if (updateError) {
      setSaveError('Failed to save. Please try again.')
    } else {
      setSaveSuccess(true)
      setClinician(prev => prev ? { ...prev, ...editForm } : null)
      setTimeout(() => {
        setSaveSuccess(false)
        setShowEditModal(false)
      }, 1800)
    }
    setSaving(false)
  }

  const initials = clinician?.full_name
    ? clinician.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'DR'

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f9fc' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={styles.spinner} />
          <p style={{ color: '#6b7280', marginTop: 16, fontSize: 14 }}>Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.root}>
      {/* ── Header ── */}
      <header style={styles.header}>
        <span style={styles.logo}>UPHR</span>
        <div style={styles.headerRight}>
          <button onClick={() => setShowEditModal(true)} style={styles.editBtn}>
            Edit Profile
          </button>
          <button onClick={handleSignOut} style={styles.signOutBtn}>Sign Out</button>
        </div>
      </header>

      <div style={styles.container}>
        {/* ── Welcome ── */}
        <div style={styles.welcomeRow}>
          <div style={styles.avatarLg}>
            {clinician?.profile_photo_url
              ? <img src={clinician.profile_photo_url} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
              : <span style={styles.avatarText}>{initials}</span>
            }
          </div>
          <div>
            <h2 style={styles.welcomeTitle}>Welcome, Dr. {clinician?.full_name} 👋</h2>
            <p style={styles.welcomeSub}>Search for a patient to access their records</p>
          </div>
        </div>

        {/* ── Profile Card ── */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <span style={styles.cardTitle}>Your Profile</span>
            <button onClick={() => setShowEditModal(true)} style={styles.editIconBtn}>
              ✏️ Edit
            </button>
          </div>
          <div style={styles.profileGrid}>
            {[
              { label: 'Hospital', value: clinician?.hospital_name },
              { label: 'Specialty', value: clinician?.specialty },
              { label: 'Department', value: clinician?.department },
              { label: 'License Number', value: clinician?.license_number },
              { label: 'Phone', value: clinician?.phone },
              { label: 'Email', value: clinician?.email },
            ].map(({ label, value }) => (
              <div key={label} style={styles.profileField}>
                <p style={styles.fieldLabel}>{label}</p>
                <p style={styles.fieldValue}>{value || <span style={{ color: '#d1d5db' }}>Not set</span>}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Search Patient ── */}
        <div style={styles.card}>
          <p style={styles.cardTitle}>Search Patient by Health ID</p>
          <div style={styles.searchRow}>
            <input
              type="text"
              value={searchId}
              onChange={e => setSearchId(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="e.g. UPH-A1B2C3D4"
              style={styles.searchInput}
            />
            <button onClick={handleSearch} disabled={searching} style={styles.searchBtn}>
              {searching ? 'Searching...' : 'Search'}
            </button>
          </div>
          {error && <p style={styles.errorText}>{error}</p>}
          <p style={styles.hint}>Ask the patient to show you their Health ID or scan their QR code</p>
        </div>

        {/* ── Pricing Banner ── */}
        <div style={styles.banner}>
          <div>
            <p style={styles.bannerTitle}>Upgrade Your Plan</p>
            <p style={styles.bannerSub}>Access unlimited patient records and AI-powered insights</p>
          </div>
          <button onClick={() => router.push('/clinician/pricing')} style={styles.bannerBtn}>View Plans</button>
        </div>
      </div>

      {/* ── Edit Profile Modal ── */}
      {showEditModal && (
        <div style={styles.overlay} onClick={e => { if (e.target === e.currentTarget) setShowEditModal(false) }}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Edit Profile</h3>
              <button onClick={() => setShowEditModal(false)} style={styles.closeBtn}>✕</button>
            </div>

            <div style={styles.modalBody}>
              {/* Photo Upload */}
              <div style={styles.photoSection}>
                <div style={styles.modalAvatar}>
                  {editForm.profile_photo_url
                    ? <img src={editForm.profile_photo_url} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                    : <span style={styles.avatarText}>{initials}</span>
                  }
                </div>
                <label style={styles.photoLabel}>
                  {uploadingPhoto ? 'Uploading...' : '📷 Upload Photo'}
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} />
                </label>
              </div>

              <div style={styles.divider} />

              {/* Section: Personal Info */}
              <p style={styles.sectionLabel}>Personal Information</p>
              <div style={styles.formGrid}>
                <div style={styles.formField}>
                  <label style={styles.label}>Full Name</label>
                  <input
                    style={styles.input}
                    value={editForm.full_name}
                    onChange={e => setEditForm(p => ({ ...p, full_name: e.target.value }))}
                    placeholder="Dr. Jane Smith"
                  />
                </div>
                <div style={styles.formField}>
                  <label style={styles.label}>License Number</label>
                  <input
                    style={styles.input}
                    value={editForm.license_number}
                    onChange={e => setEditForm(p => ({ ...p, license_number: e.target.value }))}
                    placeholder="e.g. MDCN-12345"
                  />
                </div>
              </div>

              {/* Section: Contact */}
              <p style={styles.sectionLabel}>Contact Details</p>
              <div style={styles.formGrid}>
                <div style={styles.formField}>
                  <label style={styles.label}>Email</label>
                  <input
                    style={styles.input}
                    type="email"
                    value={editForm.email}
                    onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))}
                    placeholder="doctor@hospital.com"
                  />
                </div>
                <div style={styles.formField}>
                  <label style={styles.label}>Phone</label>
                  <input
                    style={styles.input}
                    type="tel"
                    value={editForm.phone}
                    onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))}
                    placeholder="+234 800 000 0000"
                  />
                </div>
              </div>

              {/* Section: Specialization */}
              <p style={styles.sectionLabel}>Specialization & Department</p>
              <div style={styles.formGrid}>
                <div style={styles.formField}>
                  <label style={styles.label}>Hospital / Institution</label>
                  <input
                    style={styles.input}
                    value={editForm.hospital_name}
                    onChange={e => setEditForm(p => ({ ...p, hospital_name: e.target.value }))}
                    placeholder="Lagos University Teaching Hospital"
                  />
                </div>
                <div style={styles.formField}>
                  <label style={styles.label}>Specialty</label>
                  <select
                    style={styles.input}
                    value={editForm.specialty}
                    onChange={e => setEditForm(p => ({ ...p, specialty: e.target.value }))}
                  >
                    <option value="">Select specialty</option>
                    {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div style={{ ...styles.formField, gridColumn: '1 / -1' }}>
                  <label style={styles.label}>Department</label>
                  <input
                    style={styles.input}
                    value={editForm.department}
                    onChange={e => setEditForm(p => ({ ...p, department: e.target.value }))}
                    placeholder="e.g. Outpatient Cardiology"
                  />
                </div>
              </div>

              {saveError && <p style={styles.errorText}>{saveError}</p>}
            </div>

            <div style={styles.modalFooter}>
              <button onClick={() => setShowEditModal(false)} style={styles.cancelBtn}>Cancel</button>
              <button onClick={handleSaveProfile} disabled={saving || saveSuccess} style={{
                ...styles.saveBtn,
                background: saveSuccess ? '#16a34a' : '#2563eb',
              }}>
                {saveSuccess ? '✓ Saved!' : saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Styles ─────────────────────────────────────── */
const styles: Record<string, React.CSSProperties> = {
  root: { minHeight: '100vh', background: '#f8f9fc', fontFamily: "'DM Sans', sans-serif" },
  spinner: {
    width: 36, height: 36, borderRadius: '50%',
    border: '3px solid #e5e7eb', borderTopColor: '#2563eb',
    animation: 'spin 0.8s linear infinite', margin: '0 auto',
  },

  // Header
  header: {
    background: 'white', borderBottom: '1px solid #e5e7eb',
    padding: '14px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  logo: { fontSize: 20, fontWeight: 800, color: '#2563eb', letterSpacing: '-0.5px' },
  headerRight: { display: 'flex', gap: 10, alignItems: 'center' },
  editBtn: {
    padding: '8px 18px', borderRadius: 10, border: '1.5px solid #2563eb',
    background: 'transparent', color: '#2563eb', fontSize: 13, fontWeight: 600, cursor: 'pointer',
  },
  signOutBtn: {
    padding: '8px 16px', borderRadius: 10, border: '1.5px solid #e5e7eb',
    background: 'transparent', color: '#6b7280', fontSize: 13, fontWeight: 500, cursor: 'pointer',
  },

  // Layout
  container: { maxWidth: 680, margin: '0 auto', padding: '32px 20px 80px' },
  welcomeRow: { display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 },
  avatarLg: {
    width: 60, height: 60, borderRadius: '50%',
    background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    overflow: 'hidden',
  },
  avatarText: { color: 'white', fontWeight: 700, fontSize: 20, letterSpacing: 1 },
  welcomeTitle: { fontSize: 22, fontWeight: 700, color: '#111827', letterSpacing: '-0.3px' },
  welcomeSub: { color: '#6b7280', fontSize: 14, marginTop: 2 },

  // Card
  card: {
    background: 'white', borderRadius: 18, padding: 24,
    border: '1px solid #e5e7eb', marginBottom: 16,
  },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  cardTitle: { fontWeight: 700, color: '#111827', fontSize: 15, marginBottom: 16 },
  editIconBtn: {
    background: '#eff6ff', border: 'none', color: '#2563eb',
    padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
  },
  profileGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 24px' },
  profileField: {},
  fieldLabel: { fontSize: 11, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 3 },
  fieldValue: { fontSize: 14, fontWeight: 600, color: '#1f2937' },

  // Search
  searchRow: { display: 'flex', gap: 10, marginBottom: 10 },
  searchInput: {
    flex: 1, border: '2px solid #e5e7eb', borderRadius: 12,
    padding: '12px 16px', fontSize: 14, outline: 'none', color: '#111827',
  },
  searchBtn: {
    background: '#2563eb', color: 'white', border: 'none',
    padding: '12px 22px', borderRadius: 12, fontWeight: 600, fontSize: 14, cursor: 'pointer',
  },
  hint: { fontSize: 12, color: '#9ca3af', marginTop: 8 },
  errorText: { color: '#ef4444', fontSize: 13, marginTop: 8 },

  // Banner
  banner: {
    background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 18,
    padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  bannerTitle: { fontWeight: 700, color: '#14532d', fontSize: 15 },
  bannerSub: { color: '#166534', fontSize: 13, marginTop: 3 },
  bannerBtn: {
    background: '#16a34a', color: 'white', border: 'none',
    padding: '10px 22px', borderRadius: 12, fontWeight: 600, fontSize: 13, cursor: 'pointer',
    flexShrink: 0,
  },

  // Modal
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000, padding: 16,
  },
  modal: {
    background: 'white', borderRadius: 20, width: '100%', maxWidth: 560,
    maxHeight: '90vh', display: 'flex', flexDirection: 'column',
    boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
  },
  modalHeader: {
    padding: '20px 24px', borderBottom: '1px solid #f3f4f6',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  },
  modalTitle: { fontSize: 18, fontWeight: 700, color: '#111827' },
  closeBtn: { background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#9ca3af' },
  modalBody: { padding: '20px 24px', overflowY: 'auto', flex: 1 },
  modalFooter: {
    padding: '16px 24px', borderTop: '1px solid #f3f4f6',
    display: 'flex', justifyContent: 'flex-end', gap: 10,
  },

  // Photo
  photoSection: { display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 },
  modalAvatar: {
    width: 72, height: 72, borderRadius: '50%',
    background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
    flexShrink: 0,
  },
  photoLabel: {
    padding: '9px 18px', borderRadius: 10, border: '1.5px solid #2563eb',
    color: '#2563eb', fontSize: 13, fontWeight: 600, cursor: 'pointer',
  },
  divider: { height: 1, background: '#f3f4f6', margin: '4px 0 20px' },

  // Form
  sectionLabel: { fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 12 },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 24 },
  formField: { display: 'flex', flexDirection: 'column', gap: 5 },
  label: { fontSize: 12, fontWeight: 600, color: '#374151' },
  input: {
    border: '1.5px solid #e5e7eb', borderRadius: 10,
    padding: '10px 14px', fontSize: 14, color: '#111827',
    outline: 'none', width: '100%',
  },

  // Buttons
  cancelBtn: {
    padding: '10px 20px', borderRadius: 10, border: '1.5px solid #e5e7eb',
    background: 'transparent', color: '#6b7280', fontSize: 14, fontWeight: 600, cursor: 'pointer',
  },
  saveBtn: {
    padding: '10px 24px', borderRadius: 10, border: 'none',
    color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s',
  },
}
